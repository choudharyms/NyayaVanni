"""Evidence validation for AI-generated legal insights.

Every generated claim (summary sentence, clause, consequence, action) is
checked for support against the uploaded document text using token-overlap and
numeric-token coverage. Claims lacking support are flagged.
"""

import re
from typing import Any, Dict, List

WORD_RE = re.compile(r"[a-zA-Z0-9]+")
NUMBER_RE = re.compile(r"\b\d+(?:[.,]\d+)?\b")
SUPPORT_THRESHOLD = 0.35


def _tokenize(text: str) -> set:
    return set(WORD_RE.findall(text.lower()))


def _split_sentences(text: str) -> List[str]:
    return [s.strip() for s in re.split(r"[.!?]+", text) if len(s.strip()) > 10]


def token_overlap(claim: str, document: str) -> float:
    claim_tokens = _tokenize(claim)
    if not claim_tokens:
        return 0.0
    doc_tokens = _tokenize(document)
    matched = len(claim_tokens & doc_tokens)
    return matched / len(claim_tokens)


def _numeric_coverage(claim: str, document: str) -> float:
    claim_numbers = set(NUMBER_RE.findall(claim))
    if not claim_numbers:
        return 1.0
    doc_numbers = set(NUMBER_RE.findall(document))
    matched = len(claim_numbers & doc_numbers)
    return matched / len(claim_numbers)


def find_supporting_text(claim: str, document: str, max_chars: int = 300) -> str:
    """Return the document sentence that best supports the claim."""
    sentences = _split_sentences(document)
    if not sentences:
        return ""
    best_sentence = ""
    best_score = 0.0
    claim_tokens = _tokenize(claim)
    for sentence in sentences:
        sentence_tokens = _tokenize(sentence)
        if not sentence_tokens:
            continue
        overlap = len(claim_tokens & sentence_tokens) / max(len(claim_tokens), 1)
        if overlap > best_score:
            best_score = overlap
            best_sentence = sentence
    if best_score >= SUPPORT_THRESHOLD:
        return best_sentence[:max_chars]
    return ""


def validate_claim(claim: str, document: str) -> Dict[str, Any]:
    """Validate a single generated claim against the document.

    Returns:
        - supported: bool
        - score: 0-1 support score
        - evidence: best matching document sentence (or empty)
        - missing_numbers: list of claim numbers absent from the document
    """
    if not claim or not claim.strip():
        return {"supported": True, "score": 1.0, "evidence": "", "missing_numbers": []}

    overlap = token_overlap(claim, document)
    numeric = _numeric_coverage(claim, document)
    score = 0.7 * overlap + 0.3 * numeric

    claim_numbers = set(NUMBER_RE.findall(claim))
    doc_numbers = set(NUMBER_RE.findall(document))
    missing_numbers = sorted(claim_numbers - doc_numbers)

    supported = score >= SUPPORT_THRESHOLD
    evidence = find_supporting_text(claim, document) if supported else ""
    return {
        "supported": supported,
        "score": round(score, 3),
        "evidence": evidence,
        "missing_numbers": missing_numbers,
    }
