from typing import Dict, List
import re

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

def classify_document(text: str) -> Dict:
    """
    Lightweight rule + AI-ready classifier (MVP version).
    Later you can replace with OpenAI/Gemini classification.
    """

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