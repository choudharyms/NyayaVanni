"""Clause-level change detection between document versions."""

from typing import Any, Dict, List

from .clause_matcher import match_clauses


def detect_changes(
    clauses_old: List[Dict[str, Any]], clauses_new: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Detect added, removed and modified clauses between two versions."""
    matched = match_clauses(clauses_old, clauses_new)
    return {
        "added": matched["added"],
        "removed": matched["removed"],
        "modified": matched["modified"],
        "unchanged_count": len(matched["unchanged"]),
        "added_count": len(matched["added"]),
        "removed_count": len(matched["removed"]),
        "modified_count": len(matched["modified"]),
    }
