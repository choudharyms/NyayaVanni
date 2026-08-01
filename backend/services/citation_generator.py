"""Citation generation for verified legal insights.

Attaches source metadata (clause number, approximate page, supporting text) to
each insight so users can verify AI outputs against the original document.
"""

import re
from typing import Any, Dict, Optional

PAGE_CHARS = 3500

_CLASSIFIER_RE = re.compile(
    r"^\s*(?:section|sec\.|clause|cl\.|article|art\.)\s+([A-Za-z0-9.\-]+)",
    re.IGNORECASE,
)
_NUMBERED_RE = re.compile(r"^\s*(\d+(?:\.\d+)*)[\.\)]\s*(.*)$")


def _clause_number_before(document: str, offset: int) -> Optional[str]:
    window = document[max(0, offset - 4000) : offset]
    lines = window.splitlines()
    for line in reversed(lines):
        m = _NUMBERED_RE.match(line.strip()) or _CLASSIFIER_RE.match(line.strip())
        if m:
            return m.group(1)
    return None


def generate_citation(
    claim: str, evidence: str, document: str
) -> Dict[str, Any]:
    """Build citation metadata for a claim using its supporting evidence."""
    page = 1
    clause_number = None
    if evidence:
        offset = document.find(evidence[:120])
        if offset >= 0:
            page = max(1, (offset // PAGE_CHARS) + 1)
            clause_number = _clause_number_before(document, offset)

    return {
        "clause": clause_number,
        "page": page,
        "source": evidence[:300] or "",
        "confidence": None,  # filled by the confidence scorer
    }
