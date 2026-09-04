"""OCR confidence scoring from extracted text.

Produces a 0-100 OCR confidence score using text-quality heuristics: average
word length, word length distribution, sentence structure, character/special
character ratios and text completeness. These mirror the kinds of signals OCR
quality degrades (fragmented words, garbage characters, missing punctuation).
"""

import re
from typing import Any, Dict

WORD_RE = re.compile(r"[a-zA-Z0-9]+")
SENTENCE_SPLIT_RE = re.compile(r"[.!?]+")


def _stats(text: str) -> Dict[str, Any]:
    words = WORD_RE.findall(text)
    total_chars = len(text.strip())
    if not words or total_chars == 0:
        return {"words": 0, "avg_word_len": 0.0, "unique_ratio": 0.0}

    word_lengths = [len(w) for w in words]
    avg_word_len = sum(word_lengths) / len(words)
    unique_ratio = len(set(words)) / len(words)
    sentences = [s for s in SENTENCE_SPLIT_RE.split(text) if s.strip()]

    specials = re.findall(r"[^\w\s\u2013\u2014.,;:!?'\"()\[\]{}\-]", text)
    special_ratio = len(specials) / max(total_chars, 1)
    whitespace_ratio = sum(1 for ch in text if ch.isspace()) / max(total_chars, 1)

    return {
        "words": len(words),
        "avg_word_len": round(avg_word_len, 2),
        "unique_ratio": round(unique_ratio, 2),
        "sentences": len(sentences),
        "special_ratio": round(special_ratio, 4),
        "whitespace_ratio": round(whitespace_ratio, 4),
        "total_chars": total_chars,
    }


def compute_confidence(text: str) -> Dict[str, Any]:
    """Compute a 0-100 OCR confidence score and quality level."""
    stats = _stats(text)
    if stats["words"] == 0 or stats["total_chars"] < 20:
        return {"score": 0.0, "level": "Unusable", "stats": stats}

    score = 100.0
    avg = stats["avg_word_len"]
    unique = stats["unique_ratio"]
    special = stats["special_ratio"]
    whitespace = stats["whitespace_ratio"]
    total_chars = stats["total_chars"]

    # Very short or very long average word length signals OCR corruption.
    if avg < 2.5 or avg > 16:
        score -= 40
    elif avg < 3.0 or avg > 12:
        score -= 20

    # A collapse of vocabulary diversity suggests garbled/repeated text.
    if unique < 0.25:
        score -= 30
    elif unique < 0.4:
        score -= 12

    # Excessive non-alphanumeric garbage characters.
    if special > 0.05:
        score -= 30
    elif special > 0.02:
        score -= 10

    # Extremely sparse whitespace (long unbroken runs) is a corruption signal.
    if whitespace < 0.02:
        score -= 15
    elif whitespace > 0.35:
        score -= 8

    # Tiny extracts cannot be trusted as a faithful OCR of a document.
    if total_chars < 300:
        score -= 15
    elif total_chars < 800:
        score -= 5

    score = max(0.0, min(100.0, score))
    level = "Excellent" if score >= 90 else (
        "Good" if score >= 70 else ("Poor" if score >= 50 else "Unusable")
    )
    return {"score": round(score, 1), "level": level, "stats": stats}
