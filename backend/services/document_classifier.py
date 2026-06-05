from typing import Dict, List
import re
import os
import json
import logging
import google.generativeai as genai

logger = logging.getLogger(__name__)

# Configure API key only if available
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

DOCUMENT_TYPES = [
    "Non-Disclosure Agreement",
    "Employment Agreement",
    "Rental/Lease Agreement",
    "Service Agreement",
    "Terms & Conditions",
    "Privacy Policy",
    "Partnership Agreement",
    "Loan Agreement",
    "Purchase Agreement",
    "Other / Unknown"
]

def _heuristic_classify(text: str) -> Dict:
    """Fallback heuristic-based classifier."""
    text_lower = text.lower()
    scores = {doc: 0 for doc in DOCUMENT_TYPES}

    # --- simple heuristics ---
    if "confidential" in text_lower or "non-disclosure" in text_lower:
        scores["Non-Disclosure Agreement"] += 40

    if "employment" in text_lower or "employee" in text_lower:
        scores["Employment Agreement"] += 40

    if "rent" in text_lower or "lease" in text_lower:
        scores["Rental/Lease Agreement"] += 40

    if "service" in text_lower and "agreement" in text_lower:
        scores["Service Agreement"] += 30

    if "terms and conditions" in text_lower or "privacy policy" in text_lower:
        scores["Terms & Conditions"] += 40

    if "loan" in text_lower or "borrow" in text_lower:
        scores["Loan Agreement"] += 40

    if "purchase" in text_lower or "buyer" in text_lower:
        scores["Purchase Agreement"] += 30

    # fallback boost
    scores["Other / Unknown"] += 10

    # sort results
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    top = sorted_scores[0]

    return {
        "predicted_type": top[0],
        "confidence": min(0.99, max(0.30, top[1] / 100)),
        "alternatives": [
            {"type": k, "score": round(v / 100, 2)}
            for k, v in sorted_scores[1:4]
        ]
    }

def classify_document(text: str) -> Dict:
    """
    AI-powered document classifier using Gemini 1.5 Flash.
    Falls back to heuristic model on failure.
    """
    if not api_key:
        logger.warning("GEMINI_API_KEY not set. Using heuristic fallback for classification.")
        return _heuristic_classify(text)
        
    try:
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        
        # Read only the first 10k chars to save tokens (classification only needs the top)
        truncated_text = text[:10000]
        
        prompt = f"""
You are an expert legal AI classifier.
Analyze the following document text and classify it into exactly ONE of the following categories:
{json.dumps(DOCUMENT_TYPES)}

Respond ONLY with a valid JSON object matching this schema:
{{
  "predicted_type": "string (must be from the allowed list)",
  "confidence": "float between 0.0 and 1.0",
  "alternatives": [
    {{"type": "string", "score": "float"}}
  ]
}}

Document Text:
{truncated_text}
"""
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        
        result = json.loads(response.text)
        
        # Validate that the predicted type is in the allowed list
        if result.get("predicted_type") not in DOCUMENT_TYPES:
            result["predicted_type"] = "Other / Unknown"
            
        return result
        
    except Exception as e:
        logger.error(f"Gemini classification failed: {e}. Falling back to heuristics.")
        return _heuristic_classify(text)