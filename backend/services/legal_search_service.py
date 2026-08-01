"""Legal search engine over the built-in Indian legal corpus.

Lets users search statutory provisions (IPC / BNS / Constitution articles),
Acts, section numbers, article numbers, keywords and legal phrases. Each
corpus entry is parsed into a structured record (source, section/article
number, title, text) which is then matched and ranked by keyword overlap,
section/article number matches and legal phrases.
"""

import json
import logging
import os
import re
from functools import lru_cache
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

CORPUS_PATH = os.getenv(
    "LEGAL_CORPUS_PATH",
    os.path.join(os.path.dirname(__file__), "..", "data", "legal_corpus.json"),
)

# Recognised legal sources; used both for parsing and for act-name matching.
KNOWN_SOURCES = {
    "IPC": ["IPC", "Indian Penal Code"],
    "BNS": ["BNS", "Bharatiya Niaya Sanhita", "Bharatiya Nyaya Sanhita"],
    "CONSTITUTION": ["Constitution of India", "Constitution"],
    "CRPC": ["CrPC", "Code of Criminal Procedure"],
    "BNSS": ["BNSS", "Bharatiya Nagarik Suraksha Sanhita"],
    "NI ACT": ["NI Act", "Negotiable Instruments Act"],
    "HINDU MARRIAGE ACT": ["Hindu Marriage Act"],
    "RENT CONTROL ACT": ["Rent Control Act"],
    "CONSUMER PROTECTION ACT": ["Consumer Protection Act"],
    "IT ACT": ["IT Act", "Information Technology Act"],
    "EVIDENCE ACT": ["Evidence Act", "Indian Evidence Act"],
    "DPDP ACT": ["DPDP Act", "Digital Personal Data Protection Act"],
}

_SECTION_RE = re.compile(
    r"\b(?:section|sec\.|article|art\.|clause|cl\.)\s+(\d+[A-Za-z]?(?:-\d+)?)",
    re.IGNORECASE,
)
_HEADING_RE = re.compile(r"^([^:]+):\s*(.*)$")


def _normalise(text: str) -> str:
    return " ".join(text.lower().split())


def _detect_source(text: str) -> str | None:
    lowered = text.lower()
    for source, aliases in KNOWN_SOURCES.items():
        for alias in aliases:
            if alias.lower() in lowered:
                return source
    return None


def _extract_number(text: str) -> str | None:
    match = _SECTION_RE.search(text)
    return match.group(1) if match else None


def _parse_entry(entry: str) -> Dict[str, Any]:
    text = entry.strip()
    title = ""
    body = text
    match = _HEADING_RE.match(text)
    if match and len(match.group(1)) < 120:
        title = match.group(1).strip()
        body = match.group(2).strip()
    return {
        "source": _detect_source(text),
        "section_number": _extract_number(text),
        "title": title,
        "text": body,
    }


@lru_cache(maxsize=1)
def load_corpus() -> List[Dict[str, Any]]:
    """Load and parse the legal corpus once per process."""
    if not os.path.exists(CORPUS_PATH):
        logger.warning("Legal corpus not found at %s", CORPUS_PATH)
        return []
    try:
        with open(CORPUS_PATH, "r", encoding="utf-8") as f:
            raw = json.load(f)
    except (OSError, json.JSONDecodeError) as exc:
        logger.error("Failed to load legal corpus: %s", exc)
        return []
    records = []
    for entry in raw:
        if isinstance(entry, str) and entry.strip():
            records.append(_parse_entry(entry))
    return records


def _tokenise(text: str) -> set:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def _section_match(record: Dict[str, Any], query: str) -> bool:
    wanted = _extract_number(query)
    return bool(wanted) and record.get("section_number") == wanted


def search_legal(
    query: str,
    limit: int = 10,
    source_filter: str | None = None,
) -> List[Dict[str, Any]]:
    """Search the legal corpus and return ranked structured results.

    Args:
        query: Free-form query (keywords, section/article numbers, phrases).
        limit: Maximum number of results to return.
        source_filter: Optional source name to narrow the search.

    Returns:
        List of result dicts with source, section_number, title, text, matched
        term and a relevance score.
    """
    query = query.strip()
    if not query:
        return []

    records = load_corpus()
    if source_filter:
        records = [r for r in records if r.get("source") == source_filter]

    q_tokens = _tokenise(query)
    results = []
    for idx, record in enumerate(records):
        haystack = " ".join(
            str(record.get(k, "") or "") for k in ("title", "text", "source")
        )
        h_tokens = _tokenise(haystack)
        if not h_tokens:
            continue
        overlap = len(q_tokens & h_tokens)
        if overlap == 0 and not _section_match(record, query):
            continue

        score = overlap / max(len(q_tokens), 1)
        if _section_match(record, query):
            score += 1.0  # exact section/article number match is highly relevant
        for phrase in KNOWN_SOURCES:
            if phrase.lower() in query.lower() and phrase.lower() in haystack.lower():
                score += 0.5

        matched = sorted(q_tokens & h_tokens)[:5]
        results.append(
            {
                "source": record.get("source"),
                "section_number": record.get("section_number"),
                "title": record.get("title") or (record.get("text") or "")[:80],
                "text": record.get("text", ""),
                "matched_terms": matched,
                "score": round(score, 4),
            }
        )

    results.sort(key=lambda r: r["score"], reverse=True)
    return results[:limit]
