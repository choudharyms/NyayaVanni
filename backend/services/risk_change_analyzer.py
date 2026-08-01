"""Risk change analysis between two versions of a legal document.

Assigns a risk level (Low / Moderate / High) to added or modified clauses based
on legal-risk keyword signals (penalties, liabilities, termination, notice
periods, jurisdiction, payment terms, compliance).
"""

import re
from typing import Any, Dict, List

RISK_RULES: List[Dict[str, Any]] = [
    {
        "category": "Penalty",
        "level": "High",
        "keywords": ["penalty", "penal", "liquidated damages", "penalty clause", "fine"],
    },
    {
        "category": "Liability",
        "level": "High",
        "keywords": ["indemnif", "liability", "liable", "holds harmless", "unlimited liability"],
    },
    {
        "category": "Termination",
        "level": "High",
        "keywords": ["terminat", "termination", "terminate", "terminated"],
    },
    {
        "category": "Jurisdiction",
        "level": "High",
        "keywords": ["jurisdiction", "governing law", "venue", "arbitrat"],
    },
    {
        "category": "Financial Obligation",
        "level": "Moderate",
        "keywords": ["payment", "payable", "amount", "fee", "consideration", "interest", "deposit"],
    },
    {
        "category": "Notice Period",
        "level": "Moderate",
        "keywords": ["notice period", "notice", "notify", "days' notice", "days of notice"],
    },
    {
        "category": "Compliance",
        "level": "Moderate",
        "keywords": ["comply", "regulatory", "compliance", "applicable law", "statutory"],
    },
    {
        "category": "Confidentiality",
        "level": "Moderate",
        "keywords": ["confidential", "non-disclosure", "trade secret"],
    },
]


def _normalise(text: str) -> str:
    return " ".join(text.lower().split())


def _score_clause(text: str) -> List[Dict[str, str]]:
    normalised = _normalise(text)
    hits: List[Dict[str, str]] = []
    for rule in RISK_RULES:
        for keyword in rule["keywords"]:
            if keyword in normalised:
                hits.append({"category": rule["category"], "level": rule["level"]})
                break
    return hits


def analyze_risk_changes(changes: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Analyze risk impact of added and modified clauses."""
    risks: List[Dict[str, Any]] = []

    def inspect(clause: Dict[str, Any], change_type: str) -> None:
        text = clause.get("text", "")
        hits = _score_clause(text)
        for hit in hits:
            risks.append(
                {
                    "clause_number": clause.get("clause_number"),
                    "title": clause.get("title"),
                    "change_type": change_type,
                    "category": hit["category"],
                    "risk_level": hit["level"],
                    "reason": (
                        f"{change_type} clause {clause.get('clause_number') or 'section'} "
                        f"relates to {hit['category'].lower()}."
                    ),
                }
            )

    for clause in changes.get("added", []):
        inspect(clause, "added")
    for clause in changes.get("modified", []):
        inspect(clause, "modified")

    # Prioritize critical (High) changes.
    order = {"High": 0, "Moderate": 1, "Low": 2}
    risks.sort(key=lambda r: order.get(r["risk_level"], 3))
    return risks


def classify_risk_level(risk_items: List[Dict[str, Any]]) -> str:
    """Overall risk level for the comparison."""
    levels = [r.get("risk_level") for r in risk_items]
    if "High" in levels:
        return "High"
    if "Moderate" in levels:
        return "Moderate"
    return "Low"
