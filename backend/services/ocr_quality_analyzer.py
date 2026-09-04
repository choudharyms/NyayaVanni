"""OCR quality assessment orchestrator.

Runs confidence scoring, blur detection, skew detection and readability
validation on an extracted document and its optional source image, returning a
single quality report used by the analysis pipeline.
"""

from typing import Any, Dict, Optional

from .blur_detector import estimate_blur
from .confidence_scorer import compute_confidence
from .readability_validator import validate_readability
from .skew_detector import estimate_skew


def analyze_ocr_quality(
    text: str, image_bytes: Optional[bytes] = None
) -> Dict[str, Any]:
    """Assess OCR quality of an extracted document.

    Args:
        text: The extracted document text.
        image_bytes: Optional original image bytes for blur/skew checks.

    Returns:
        Dict with score, level, stats, warnings, validity, and (when an image
        was provided) blur/skew metrics.
    """
    confidence = compute_confidence(text)
    score = confidence["score"]
    stats = confidence["stats"]

    validation = validate_readability(text, score, stats)

    report: Dict[str, Any] = {
        "score": score,
        "level": confidence["level"],
        "stats": stats,
        "warnings": validation["warnings"],
        "valid": validation["valid"],
        "blocked": validation["blocked"],
    }

    if image_bytes:
        report["blur"] = estimate_blur(image_bytes)
        report["skew"] = estimate_skew(image_bytes)

    return report
