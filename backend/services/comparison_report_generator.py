"""Comparison report generation for multi-document legal comparison."""

from typing import Any, Dict, List

from .risk_change_analyzer import classify_risk_level


def _summarise(changes: Dict[str, Any], risks: List[Dict[str, Any]]) -> str:
    added = changes["added_count"]
    removed = changes["removed_count"]
    modified = changes["modified_count"]

    summary = (
        f"{modified} clause(s) modified, {added} clause(s) added, "
        f"and {removed} clause(s) removed. "
    )

    high_risks = [r for r in risks if r.get("risk_level") == "High"]
    if high_risks:
        categories = sorted({r["category"] for r in high_risks})
        summary += (
            "The updated document introduces higher-impact changes related to "
            f"{', '.join(categories).lower()}."
        )
    elif risks:
        summary += "The updated document contains moderate legal changes worth reviewing."
    else:
        summary += "No material risk changes detected between the two versions."
    return summary


def generate_report(
    changes: Dict[str, Any],
    risks: List[Dict[str, Any]],
    document_meta: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """Build the final structured comparison report."""
    report: Dict[str, Any] = {
        "summary": _summarise(changes, risks),
        "overall_risk_level": classify_risk_level(risks),
        "counts": {
            "added": changes["added_count"],
            "removed": changes["removed_count"],
            "modified": changes["modified_count"],
            "unchanged": changes["unchanged_count"],
        },
        "changes": {
            "added": changes["added"],
            "removed": changes["removed"],
            "modified": changes["modified"],
        },
        "risk_changes": risks,
        "critical_changes": [r for r in risks if r.get("risk_level") == "High"],
    }
    if document_meta:
        report["documents"] = document_meta
    return report
