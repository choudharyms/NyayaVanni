import json
import logging
import os
import re
from datetime import date
from typing import List, Literal, Optional

import google.generativeai as genai
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from ..models.llm_schemas import DocumentAnalysis

load_dotenv()

# Import the custom Legal Query Optimizer
from .legal_processor import LegalQueryOptimizer

logger = logging.getLogger(__name__)

# Configure API key only if available
api_key = os.getenv("GEMINI_API_KEY")
if not api_key or not api_key.strip():
    logger.warning(
        "GEMINI_API_KEY environment variable is not set or empty. "
        "RAG and Gemini features will be unavailable until configured."
    )

    logger.warning(
        "GEMINI_API_KEY environment variable is not set or empty. RAG and document analysis features will fail."
    )
else:
    genai.configure(api_key=api_key)

from google.api_core.exceptions import DeadlineExceeded

# Instantiate the optimizer module globally
query_optimizer = LegalQueryOptimizer()

GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-2.0-flash-001")
GEMINI_TIMEOUT = float(os.getenv("GEMINI_TIMEOUT", "30.0"))

generation_config = {
    "temperature": 0.3,
    "top_p": 0.8,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "application/json",
    "response_schema": DocumentAnalysis.model_json_schema(),
}

chat_config = {
    "temperature": 0.5,
    "response_mime_type": "text/plain",
}


def _create_model(system_instruction: str = ""):
    return genai.GenerativeModel(
        model_name=GEMINI_MODEL_NAME,
        generation_config=generation_config,
        system_instruction=system_instruction,
    )


def _create_chat_model(system_instruction: str = ""):
    return genai.GenerativeModel(
        model_name=GEMINI_MODEL_NAME,
        generation_config=chat_config,
        system_instruction=system_instruction,
    )


def _parse_structured_response(resp) -> dict:
    """
    Robustly extract JSON/dict from various model response shapes.
    Supports objects with a `.json()` method, a `.text` field containing
    either raw JSON or fenced ```json``` blocks, or plain dicts.
    This is a module-level helper so it can be unit-tested independently.
    """
    # If the model already returned a dict-like object
    if isinstance(resp, dict):
        return resp

    # If response exposes a json() method (common for requests-like objects)
    if hasattr(resp, "json") and callable(getattr(resp, "json")):
        try:
            data = resp.json()
            if isinstance(data, dict):
                return data
        except Exception:
            pass

    # Try to get text payload
    text = None
    if hasattr(resp, "text"):
        try:
            text = resp.text
        except Exception:
            text = None

    # If the resp itself is a str, use it
    if text is None and isinstance(resp, str):
        text = resp

    if not text:
        # Try to stringify the object
        try:
            text = json.dumps(resp)
        except Exception:
            text = None

    if text:
        # Remove fenced code blocks if present
        m = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
        if m:
            candidate = m.group(1)
        else:
            candidate = text

        # Try direct JSON parse
        try:
            return json.loads(candidate)
        except Exception:
            # Fallback: find the first { and last } and parse the substring
            start = candidate.find("{")
            end = candidate.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(candidate[start : end + 1])
                except Exception:
                    pass

    raise ValueError("Unable to parse structured JSON from model response")


def analyze_document_with_gemini(
    document_text: str, retrieved_laws: list, language: str = "en"
) -> dict:
    """
    Analyze a legal document using the Gemini generative model.

    Truncates the document and retrieved laws to fit within model token
    limits, constructs a structured prompt, and returns a parsed JSON
    dictionary containing document type, parties, dates, risk level,
    recommended actions, and other legal insights.

    Args:
        document_text (str): Raw text content of the legal document to analyze.
        retrieved_laws (list): List of relevant law snippets retrieved via RAG
            to provide legal context during analysis.
        language (str): Language code for the response output. Defaults to
            'en' (English). Use 'hi' for Hindi output.

    Returns:
        dict: A dictionary containing structured legal analysis fields including
            document_type, parties, dates, sections, clauses, summary,
            risk_level, urgency, consequences, recommended_timeline,
            and actions.

    Raises:
        Exception: If the Gemini API call fails or the response cannot
            be parsed into a valid JSON structure.
    """
    document_text = document_text[:8000]
    retrieved_laws = [law[:500] for law in retrieved_laws[:3]]
    context = "\n".join(retrieved_laws)

    prompt = f"""
Analyze the following document text and relevant legal snippets.

Document Text:
<document_content>
{document_text}
</document_content>

Relevant Laws:
{context}

Extract and structure the output strictly in JSON format matching this schema:
{{
  "document_type": "FIR/Notice/Contract/etc.",
  "parties": [{{"name": "...", "role": "..."}}],
  "dates": [{{"type": "notice_date|response_deadline", "value": "YYYY-MM-DD"}}],
  "sections": ["Extract explicit legal sections/laws from Document, or apply from Relevant Laws"],
  "clauses": ["Extract key clauses/obligations from Document"],
  "summary": "A clear 2-3 sentence explanation of the document.",
  "risk_level": "Low|Medium|High",
  "urgency": "Immediate|Soon|Normal",
  "consequences": ["List of potential outcomes"],
  "recommended_timeline": "Respond within X days",
  "actions": [
    {{
      "priority": "high|medium|low",
      "action": "What to do next",
      "why": "Reason",
      "timeline": "When to do it"
    }}
  ]
}}
"""
    lang_suffix = ""
    if language == "hi":
        lang_suffix = "\n\nIMPORTANT: Translate all analysis, summaries, and action points into Hindi (हिन्दी). Keep JSON keys in English."

    try:
        sys_inst = query_optimizer.get_system_instruction(language)
        analysis_model = _create_model(sys_inst + lang_suffix)
        response = analysis_model.generate_content(prompt, request_options={"timeout": GEMINI_TIMEOUT})
        parsed = _parse_structured_response(response)
        return parsed
    except Exception as e:
        logger.error(f"Gemini Analysis Failed (model={GEMINI_MODEL_NAME}): {e}")
        if "not found" in str(e).lower() or "not supported" in str(e).lower():
            raise RuntimeError(
                f"Gemini model '{GEMINI_MODEL_NAME}' not found. Check GEMINI_MODEL_NAME environment variable."
            )
        raise


def generate_chat_response(
    document_analysis: dict, chat_history: list, user_message: str, language: str = "en"
) -> str:
    """
    Generate a conversational response using the Gemini chat model.
    """
    optimized_message = query_optimizer.optimize_prompt(user_message)

    history_str = "\n".join(
        [f"{msg['role'].capitalize()}: {msg['message']}" for msg in chat_history]
    )

    if document_analysis:
        context_prompt = f"You are helping a user understand their legal document ({document_analysis.get('document_type', 'Document')}).\nPrevious analysis: {json.dumps(document_analysis)}"
    else:
        context_prompt = "You are an expert Indian Legal AI Assistant helping a user with general legal queries based on Indian law."

    prompt = f"""
CONTEXT:
{context_prompt}

CONVERSATION HISTORY:
{history_str}

USER QUESTION:
<user_query>
{optimized_message}
</user_query>

Provide a helpful, accurate answer in simple, jargon-free language.
If legal consultation is needed, recommend it clearly.

STRICT FORMATTING RULES:
1. Organize your answer clearly using bullet points (use * or -).
2. Use **bold** for key terms or section names.
3. Break down complex sentences into short, easy-to-read points.
4. Each point should be on a new line.

Example Structure:
* **Observation:** [Brief point]
* **Next Step:** [Actionable advice]
* **Note:** [Relevant legal mention]
"""
    try:
        if not os.getenv("GEMINI_API_KEY"):
            raise ValueError("GEMINI_API_KEY is not configured")

        sys_inst = query_optimizer.get_system_instruction(language)
        chat_model_instance = _create_chat_model(sys_inst)
        response = chat_model_instance.generate_content(prompt, request_options={"timeout": GEMINI_TIMEOUT})
        return response.text

    except DeadlineExceeded as e:
        logger.error(f"Gemini Chat Timed Out (model={GEMINI_MODEL_NAME}): {e}")
        return "AI service request timed out. Please try again in a few moments."
    except Exception as e:
        logger.error(f"Gemini Chat Failed (model={GEMINI_MODEL_NAME}): {e}")
        if "not found" in str(e).lower() or "not supported" in str(e).lower():
            return f"AI service configuration error: Gemini model '{GEMINI_MODEL_NAME}' is not available. Please contact the administrator."
        return "AI service is currently unavailable. Please contact the administrator."


def stream_chat_response(
    document_analysis: dict, chat_history: list, user_message: str, language: str = "en"
):
    """
Stream a conversational legal response using the Gemini chat model.

Optimizes the user message via LegalQueryOptimizer, constructs a
context-aware prompt from document analysis and chat history, and
yields response text in chunks for real-time streaming to the client.

Args:
    document_analysis: Dictionary containing prior document analysis
        results, or an empty dict for general legal queries.
    chat_history: List of previous conversation turns, each a dict
        with 'role' and 'message' keys.
    user_message: Raw legal question or statement from the user.
    language: Language code for the response. Defaults to 'en'
        (English). Use 'hi' for Hindi output.

Yields:
    str: Successive text chunks of the generated response as they
        stream from the Gemini API.

Raises:
    ValueError: If GEMINI_API_KEY is not configured in the
        environment.
"""
    optimized_message = query_optimizer.optimize_prompt(user_message)

    history_str = "\n".join(
        [f"{msg['role'].capitalize()}: {msg['message']}" for msg in chat_history]
    )

    if document_analysis:
        context_prompt = f"You are helping a user understand their legal document ({document_analysis.get('document_type', 'Document')}).\nPrevious analysis: {json.dumps(document_analysis)}"
    else:
        context_prompt = "You are an expert Indian Legal AI Assistant helping a user with general legal queries based on Indian law."

    prompt = f"""
CONTEXT:
{context_prompt}

CONVERSATION HISTORY:
{history_str}

USER QUESTION:
<user_query>
{optimized_message}
</user_query>

Provide a helpful, accurate answer in simple, jargon-free language.
If legal consultation is needed, recommend it clearly.

STRICT FORMATTING RULES:
1. Organize your answer clearly using bullet points (use * or -).
2. Use **bold** for key terms or section names.
3. Break down complex sentences into short, easy-to-read points.
4. Each point should be on a new line.

Example Structure:
* **Observation:** [Brief point]
* **Next Step:** [Actionable advice]
* **Note:** [Relevant legal mention]
"""
    try:
        if not os.getenv("GEMINI_API_KEY"):
            raise ValueError("GEMINI_API_KEY is not configured")

        sys_inst = query_optimizer.get_system_instruction(language)
        chat_model_instance = _create_chat_model(sys_inst)
        response = chat_model_instance.generate_content(prompt, stream=True, request_options={"timeout": GEMINI_TIMEOUT})

        for chunk in response:
            if chunk.text:
                yield chunk.text

    except DeadlineExceeded as e:
        logger.error(f"Gemini Chat Stream Timed Out (model={GEMINI_MODEL_NAME}): {e}")
        yield "AI service request timed out. Please try again in a few moments."
    except Exception as e:
        logger.error(f"Gemini Chat Stream Failed (model={GEMINI_MODEL_NAME}): {e}")
        if "not found" in str(e).lower() or "not supported" in str(e).lower():
            yield "AI service configuration error: The configured Gemini model is not available. Please contact the administrator."
        else:
            yield "AI service is currently unavailable. Please contact the administrator."
