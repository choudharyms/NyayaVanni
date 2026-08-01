"""Clause classification.

Automatically categorizes legal clause text into well-known legal categories
(Payment, Liability, Confidentiality, Arbitration, Termination, ...) based on
keyword signals, so retrieval and filtering can operate at category level.
"""

import re
from typing import Dict, List

CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "Payment": [
        "payment",
        "invoice",
        "amount",
        "fee",
        "due",
        "late payment",
        "consideration",
        "payable",
    ],
    "Liability": [
        "liability",
        "indemnif",
        "warrant",
        "damages",
        "responsible",
        "claims",
        "holds harmless",
    ],
    "Confidentiality": [
        "confidential",
        "non-disclosure",
        "nondisclosure",
        "trade secret",
        "proprietary",
    ],
    "Arbitration": [
        "arbitrat",
        "dispute resolution",
        "mediation",
        "conciliation",
        "adjudicat",
    ],
    "Intellectual Property": [
        "intellectual property",
        "copyright",
        "trademark",
        "patent",
        "assignment of ip",
        "licence",
        "license",
    ],
    "Termination": [
        "terminat",
        "renewal",
        "expiry",
        "expire",
        "end of term",
        "survive",
    ],
    "Compliance": [
        "comply",
        "regulatory",
        "legal requirement",
        "applicable law",
        "statutory",
        "permit",
    ],
    "Penalties": [
        "penalty",
        "penal",
        "interest",
        "default",
        "breach",
        "liquidated damages",
        "interest rate",
    ],
    "Governing Law": ["governing law", "jurisdiction", "venue", "exclusive jurisdiction"],
    "Notices": ["notice", "notify", "notice period"],
    "Assignment": ["assign", "transfer", "assignment"],
    "Force Majeure": ["force majeure", "act of god", "unforeseen"],
}

def _normalise(text: str) -> str:
    return " ".join(text.lower().split())


def classify_clause(text: str) -> List[str]:
    """Return the ordered list of legal categories matching the clause text."""
    if not text:
        return []
    normalised = _normalise(text)
    hits: List[str] = []
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in normalised:
                hits.append(category)
                break
    return hits
