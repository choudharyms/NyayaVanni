"""Hallucination detection for AI-generated legal analysis.

Runs every generated insight (summary sentences, clauses, sections,
consequences, action items) through evidence validation against the uploaded
document and reports which claims are unsupported.
"""

from typing import Any, Dict, List

from .evidence_validator import validate_claim

KEY_INSIGHT_FIELDS = ("summary", "clauses", "sections", "consequences", "actions")


def _collect_insights(analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
    insights: List[Dict[str, Any]] = []

    summary = analysis.get("summary", "")
    if summary:
        import re

        for sentence in re.split(r"[.!?]+", summary):
            sentence = sentence.strip()
            if len(sentence) > 10:
                insights.append({"kind": "summary", "text": sentence})

    for kind in ("clauses", "sections", "consequences"):
        for item in analysis.get(kind, []):
            if isinstance(item, str) and item.strip():
                insights.append({"kind": kind, "text": item.strip()})

    for action in analysis.get("actions", []):
        if isinstance(action, dict):
            for field in ("action", "why"):
                text = (action.get(field) or "").strip()
                if text:
                    insights.append({"kind": "action", "text": text})
    return insights


def detect_hallucinations(
    document_text: str, analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """Detect unsupported claims in the generated analysis.

    Args:
        document_text: Full extracted document text (evidence source).
        analysis: The Gemini-generated analysis dict.

    Returns:
        Dict with status, evidence_score, supported_count, unsupported_count,
        and a list of per-claim verification results.
    """
    insights = _collect_insights(analysis)
    results: List[Dict[str, Any]] = []
    unsupported: List[Dict[str, Any]] = []

    for insight in insights:
        result = validate_claim(insight["text"], document_text)
        entry = {**insight, **result}
        results.append(entry)
        if not result["supported"]:
            unsupported.append(entry)

    if not insights:
        return {
            "status": "no_insights",
            "evidence_score": 0.0,
            "supported_count": 0,
            "unsupported_count": 0,
            "unsupported_claims": [],
            "results": [],
        }

    supported_count = len(results) - len(unsupported)
    evidence_score = (supported_count / len(results)) * 100.0
    status = (
        "verified"
        if evidence_score >= 70
        else "needs_review" if evidence_score >= 50 else "potential_hallucination"
    )

    return {
        "status": status,
        "evidence_score": round(evidence_score, 1),
        "supported_count": supported_count,
        "unsupported_count": len(unsupported),
        "unsupported_claims": unsupported,
        "results": results,
    }
