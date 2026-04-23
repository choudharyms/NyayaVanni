import google.generativeai as genai
import os
import json
import logging

logger = logging.getLogger(__name__)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

generation_config = {
  "temperature": 0.3,
  "top_p": 0.8,
  "top_k": 40,
  "max_output_tokens": 8192,
  "response_mime_type": "application/json",
}

chat_config = {
  "temperature": 0.5,
  "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-3.1-flash-lite-preview",
    generation_config=generation_config
)

chat_model = genai.GenerativeModel(
    model_name="gemini-3.1-flash-lite-preview",
    generation_config=chat_config
)

def analyze_document_with_gemini(document_text: str, retrieved_laws: list, language: str = "en") -> dict:
    context = "\n".join(retrieved_laws)
    
    lang_instruction = ""
    if language == "hi":
        lang_instruction = "IMPORTANT: You MUST translate all your analysis, summaries, and action points into Hindi (हिन्दी). Provide the values in Hindi, but keep the JSON keys strictly in English."

    prompt = f"""
    You are an expert Indian Legal AI. Analyze the following document text and relevant legal snippets.
    {lang_instruction}

    Document Text:
    {document_text}

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
    
    try:
        response = model.generate_content(prompt)
        text = response.text
        # Clean potential markdown markdown wrapping if Gemini messes up
        import re
        match = re.search(r'```(?:json)?\n(.*?)\n```', text, re.DOTALL)
        if match:
            text = match.group(1)
        else:
            # Fallback to finding the first { and last }
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1:
                text = text[start:end+1]

        return json.loads(text)
    except Exception as e:
        logger.error(f"Gemini Analysis Failed: {e}")
        raise e

def generate_chat_response(document_analysis: dict, chat_history: list, user_message: str, language: str = "en") -> str:
    history_str = "\n".join([f"{msg['role'].capitalize()}: {msg['message']}" for msg in chat_history])
    
    if document_analysis:
        context_prompt = f"You are helping a user understand their legal document ({document_analysis.get('document_type', 'Document')}).\nPrevious analysis: {json.dumps(document_analysis)}"
    else:
        context_prompt = "You are an expert Indian Legal AI Assistant helping a user with general legal queries based on Indian law."

    lang_instruction = ""
    if language == "hi":
        lang_instruction = "IMPORTANT: You MUST respond entirely in the Hindi language (हिन्दी)."

    prompt = f"""
    CONTEXT:
    {context_prompt}

    CONVERSATION HISTORY:
    {history_str}

    USER QUESTION:
    {user_message}

    Provide a helpful, accurate answer in simple, jargon-free language.
    If legal consultation is needed, recommend it clearly. Keep it conversational.
    {lang_instruction}
    """
    try:
        response = chat_model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini Chat Failed: {e}")
        return "Sorry, I am unable to respond at the moment."
