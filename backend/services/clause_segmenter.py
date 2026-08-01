"""Clause segmentation for legal documents.

Segments an uploaded legal document into individual clauses, preserving the
clause hierarchy (clause number, level, parent) and section titles so that each
clause can act as an independent retrieval unit.
"""

import re
from typing import Any, Dict, List, Optional

from .clause_classifier import classify_clause

_NUMBERED = re.compile(r"^\s*(\d+(?:\.\d+)*)[\.\)]\s*(.*)$")
_SECTION_HEADING = re.compile(
    r"^\s*(section|sec\.|clause|cl\.|article|art\.|annexure|schedule|para|part)"
    r"\s+([A-Za-z0-9][A-Za-z0-9.\-]*)(?:\s+(.*))?$",
    re.IGNORECASE,
)
_APPENDIX = re.compile(
    r"^\s*(annexure|schedule|exhibit)\s+([A-Za-z0-9]+)\s*:?\s*(.*)$", re.IGNORECASE
)

MAX_CLAUSE_CHARS = 1200
MIN_CLAUSE_CHARS = 30


def _level_of(number: str) -> int:
    return number.count(".") + 1 if number else 1


def _parent_of(number: str) -> Optional[str]:
    parts = number.split(".")
    return ".".join(parts[:-1]) if len(parts) > 1 else None


def _parse_clause_number(line: str) -> tuple[str, str] | None:
    """Return (clause_number, remainder) if the line opens a numbered clause."""
    stripped = line.strip()
    match = _NUMBERED.match(stripped)
    if match:
        return match.group(1), match.group(2).strip()
    return None


def _parse_section_heading(line: str) -> tuple[str, str, str] | None:
    """Return (heading_type, number, title) for section/article headings."""
    stripped = line.strip()
    match = _SECTION_HEADING.match(stripped)
    if match:
        return match.group(1).lower(), match.group(2), (match.group(3) or "").strip()
    match = _APPENDIX.match(stripped)
    if match:
        return match.group(1).lower(), match.group(2), (match.group(3) or "").strip()
    return None


def _finalise(
    clauses: List[Dict[str, Any]], pending: Dict[str, Any] | None
) -> Dict[str, Any] | None:
    """Finalise the current clause: append it to `clauses` if it has a body."""
    if pending is None:
        return None
    body = " ".join(pending.pop("_lines")).strip()
    if not body and not pending.get("clause_number"):
        return None
    pending["text"] = body
    pending["categories"] = classify_clause(body)
    if len(body) >= MIN_CLAUSE_CHARS:
        clauses.append(pending)
    elif pending.get("clause_number"):
        # A heading-only clause: keep it for retrieval but merge the short text.
        pending["title"] = f"{pending.get('title')} {body}".strip()
        clauses.append(pending)
    return None


def segment_clauses(text: str) -> List[Dict[str, Any]]:
    """Segment document text into structured clauses.

    Returns a list of clause dicts with:
      clause_number, title, text, level, parent, categories
    """
    if not text:
        return []

    clauses: List[Dict[str, Any]] = []
    pending: Dict[str, Any] | None = None

    for raw_line in text.splitlines():
        stripped = raw_line.strip()
        if not stripped:
            continue

        numbered = _parse_clause_number(stripped)
        if numbered:
            number, remainder = numbered
            title = remainder if len(remainder) < 120 else ""
            pending = _finalise(clauses, pending)
            pending = {
                "clause_number": number,
                "title": title,
                "_lines": [],
                "level": _level_of(number),
                "parent": _parent_of(number),
            }
            continue

        heading = _parse_section_heading(stripped)
        if heading:
            # A section heading starts a fresh clause (finalising any previous).
            heading_type, number, title = heading
            pending = _finalise(clauses, pending)
            pending = {
                "clause_number": None,
                "title": f"{heading_type.capitalize()} {number}"
                + (f" - {title}" if title else ""),
                "_lines": [],
                "level": 1,
                "parent": None,
            }
            continue

        if pending is None:
            pending = {
                "clause_number": None,
                "title": "",
                "_lines": [],
                "level": 1,
                "parent": None,
            }
        pending["_lines"].append(stripped)

        if len(" ".join(pending["_lines"])) >= MAX_CLAUSE_CHARS:
            pending = _finalise(clauses, pending)

    _finalise(clauses, pending)
    return clauses
