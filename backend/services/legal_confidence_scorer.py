"""Legal confidence scoring for AI-generated insights.

Blends evidence support, OCR/extraction quality and retrieval similarity into a
single 0-100 confidence score. Low-confidence outputs are surfaced as needing
review.
"""

from typing import Any, Dict

EVIDENCE_WEIGHT = 0.6
OCR_WEIGHT = 0.25
RETRIEVAL_WEIGHT = 0.15


def compute_legal_confidence(
    evidence_score: float,
    ocr_score: float = 100.0,
    retrieval_score: float = 1.0,
) -> Dict[str, Any]:
    """Compute a blended legal confidence score and interpretation level.

    Args:
        evidence_score: 0-100 evidence support score for the insights.
        ocr_score: 0-100 OCR/extraction quality score.
        retrieval_score: 0-1 retrieval similarity score (default 1.0).

    Returns:
        Dict with score, level and contributing factors.
    """
    score = (
        EVIDENCE_WEIGHT * evidence_score
        + OCR_WEIGHT * ocr_score
        + RETRIEVAL_WEIGHT * (retrieval_score * 100.0)
    )
    score = round(max(0.0, min(100.0, score)), 1)
    level = (
        "High Confidence"
        if score >= 90
        else "Moderate Confidence" if score >= 70 else "Needs Review"
    )
    return {
        "score": score,
        "level": level,
        "factors": {
            "evidence_score": round(evidence_score, 1),
            "ocr_score": round(ocr_score, 1),
            "retrieval_score": round(retrieval_score, 2),
        },
    }
