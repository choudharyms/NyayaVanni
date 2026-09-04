"""Readability validation for OCR-extracted document text.

Combines the OCR confidence score with missing-page / blank-page heuristics to
decide whether the extracted text is fit for AI legal analysis.
"""

from typing import Any, Dict, List

# Scores below this block AI analysis of the document.
BLOCK_THRESHOLD = 50.0
# Scores in this band pass with warnings.
WARNING_THRESHOLD = 70.0

_MIN_DOCUMENT_CHARS = 200
_BLANK_LINE_PATTERN_COUNT = 3


def validate_readability(
    text: str, score: float, stats: Dict[str, Any] | None = None
) -> Dict[str, Any]:
    """Validate whether extracted text is usable for legal analysis.

    Returns dict with `valid`, `blocked`, `level` and a list of `warnings`.
    """
    warnings: List[str] = []
    stats = stats or {}

    if not text or len(text.strip()) < _MIN_DOCUMENT_CHARS:
        warnings.append(
            "Extracted text is very short; the document may have been partially "
            "uploaded or pages may be missing."
        )

    words = stats.get("words", 0)
    if words and words < 40:
        warnings.append(
            "Very few words extracted; the scan may be cut off or mostly blank."
        )

    total_chars = stats.get("total_chars", 0)
    if total_chars and stats.get("whitespace_ratio", 0) > 0.25:
        warnings.append(
            "Large amounts of whitespace detected; possible blank pages or "
            "missing content."
        )

    if score < BLOCK_THRESHOLD:
        warnings.append(
            "Document quality is too poor for reliable legal analysis. Please "
            "upload a clearer scan."
        )

    blocked = score < BLOCK_THRESHOLD or len(warnings) >= _BLANK_LINE_PATTERN_COUNT
    valid = not blocked

    level = "Good"
    if score < WARNING_THRESHOLD:
        level = "Poor" if score >= BLOCK_THRESHOLD else "Unusable"

    return {
        "valid": valid,
        "blocked": blocked,
        "level": level,
        "score": round(score, 1),
        "warnings": warnings,
    }
