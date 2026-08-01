"""Clause segmentation and matching for document comparison.

Segments documents into clauses (by number / section heading) and matches
clauses between two versions by clause number and text similarity.
"""

import re
from difflib import SequenceMatcher
from typing import Any, Dict, List, Optional

_NUMBERED = re.compile(r"^\s*(\d+(?:\.\d+)*)[\.\)]\s*(.*)$")
_SECTION_HEADING = re.compile(
    r"^\s*(section|sec\.|clause|cl\.|article|art\.|annexure|schedule|para|part)"
    r"\s+([A-Za-z0-9][A-Za-z0-9.\-]*)(?:\s+(.*))?$",
    re.IGNORECASE,
)

MIN_CLAUSE_CHARS = 25
SIMILARITY_THRESHOLD = 0.9


def _normalise(text: str) -> str:
    return " ".join(text.lower().split())


def segment_clauses(text: str) -> List[Dict[str, Any]]:
    """Split document text into numbered clauses plus unnumbered blocks."""
    if not text:
        return []
    clauses: List[Dict[str, Any]] = []
    pending: Dict[str, Any] | None = None

    def finalise():
        nonlocal pending
        if pending is None:
            return
        body = " ".join(pending.pop("_lines")).strip()
        if not body and not pending.get("clause_number"):
            return
        pending["text"] = body
        if len(body) >= MIN_CLAUSE_CHARS or pending.get("clause_number"):
            clauses.append(pending)
        pending = None

    for raw_line in text.splitlines():
        stripped = raw_line.strip()
        if not stripped:
            continue
        m = _NUMBERED.match(stripped)
        if m:
            number, remainder = m.group(1), m.group(2).strip()
            title = remainder if len(remainder) < 120 else ""
            finalise()
            pending = {"clause_number": number, "title": title, "_lines": []}
            continue
        h = _SECTION_HEADING.match(stripped)
        if h and not pending:
            htype, number, title = h.group(1), h.group(2), (h.group(3) or "").strip()
            finalise()
            pending = {
                "clause_number": None,
                "title": f"{htype.capitalize()} {number}" + (f" - {title}" if title else ""),
                "_lines": [],
            }
            continue
        if pending is None:
            pending = {"clause_number": None, "title": "", "_lines": []}
        pending["_lines"].append(stripped)

    finalise()
    return [
        {"clause_number": c.get("clause_number"), "title": c.get("title"), "text": c.get("text")}
        for c in clauses
    ]


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, _normalise(a), _normalise(b)).ratio()


def match_clauses(
    old: List[Dict[str, Any]], new: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Match clauses between two versions.

    Returns dict with keys:
      unchanged, added, removed, modified
    where modified entries carry old/new text and a similarity score.
    """
    old_by_number: Dict[str, Dict[str, Any]] = {}
    old_unnumbered: List[Dict[str, Any]] = []
    for clause in old:
        if clause.get("clause_number"):
            old_by_number[clause["clause_number"]] = clause
        else:
            old_unnumbered.append(clause)

    unchanged: List[Dict[str, Any]] = []
    added: List[Dict[str, Any]] = []
    removed: List[Dict[str, Any]] = []
    modified: List[Dict[str, Any]] = []

    new_unnumbered_pool: List[Dict[str, Any]] = []

    for clause in new:
        number = clause.get("clause_number")
        if number:
            old_clause = old_by_number.pop(number, None)
            if old_clause is None:
                added.append(clause)
            else:
                sim = _similarity(old_clause["text"], clause["text"])
                if sim >= SIMILARITY_THRESHOLD:
                    unchanged.append({**clause, "similarity": round(sim, 3)})
                else:
                    modified.append(
                        {
                            **clause,
                            "old_text": old_clause["text"],
                            "similarity": round(sim, 3),
                        }
                    )
        else:
            new_unnumbered_pool.append(clause)

    # Match unnumbered clauses (headings/preamble) by similarity.
    for clause in old_unnumbered:
        best_idx = -1
        best_score = 0.0
        for idx, cand in enumerate(new_unnumbered_pool):
            score = _similarity(clause["text"], cand["text"])
            if score > best_score:
                best_score = score
                best_idx = idx
        if best_idx >= 0 and best_score >= SIMILARITY_THRESHOLD:
            unchanged.append(
                {**new_unnumbered_pool.pop(best_idx), "similarity": round(best_score, 3)}
            )
        else:
            removed.append(clause)

    added.extend(new_unnumbered_pool)
    removed.extend(old_by_number.values())

    return {
        "unchanged": unchanged,
        "added": added,
        "removed": removed,
        "modified": modified,
    }
