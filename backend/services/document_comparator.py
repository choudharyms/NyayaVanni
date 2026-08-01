"""Multi-document legal comparison engine.

Orchestrates clause segmentation, matching, change detection, risk analysis
and report generation for comparing two versions of a legal document.
"""

from typing import Any, Dict

from .clause_matcher import segment_clauses
from .comparison_report_generator import generate_report
from .difference_detector import detect_changes
from .risk_change_analyzer import analyze_risk_changes


def compare_documents(
    old_text: str,
    new_text: str,
    document_meta: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """Compare two document versions and return a structured change report.

    Args:
        old_text: Extracted text of the older version.
        new_text: Extracted text of the newer version.
        document_meta: Optional metadata describing the compared documents.

    Returns:
        Report dict with summary, risk level, per-clause changes and critical
        changes.
    """
    old_clauses = segment_clauses(old_text)
    new_clauses = segment_clauses(new_text)
    changes = detect_changes(old_clauses, new_clauses)
    risks = analyze_risk_changes(changes)
    return generate_report(changes, risks, document_meta)
