"""Clause-level embedding index and retrieval.

Each document's clauses are embedded and stored in an in-memory FAISS index so
retrieval operates at clause granularity instead of whole-page chunks. When
embeddings are unavailable, keyword-overlap retrieval over clause text is used
as a fallback.
"""

import logging
import re
from typing import Any, Dict, List, Optional

import faiss
import numpy as np

from .rag_service import get_embeddings

logger = logging.getLogger(__name__)

# document_id -> {"clauses": [...], "index": Optional[faiss.Index], "has_vectors": bool}
_clause_indexes: Dict[str, Dict[str, Any]] = {}


def _clause_text(clause: Dict[str, Any]) -> str:
    parts = [
        clause.get("clause_number") or "",
        clause.get("title") or "",
        clause.get("text") or "",
    ]
    return " ".join(p for p in parts if p)


def index_clauses(document_id: str, clauses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Embed and index the clauses for a document. Replaces any prior index."""
    index = None
    has_vectors = False
    if clauses:
        texts = [_clause_text(c) for c in clauses]
        try:
            vectors = get_embeddings(texts)
            if vectors is not None and vectors.size > 0:
                index = faiss.IndexFlatL2(vectors.shape[1])
                index.add(vectors)
                has_vectors = True
        except Exception as exc:
            logger.warning("Clause embedding failed for %s: %s", document_id, exc)

    _clause_indexes[document_id] = {
        "clauses": clauses,
        "index": index,
        "has_vectors": has_vectors,
    }
    return {"indexed": len(clauses), "has_vectors": has_vectors}


def get_indexed_clauses(document_id: str) -> List[Dict[str, Any]]:
    entry = _clause_indexes.get(document_id)
    return list(entry["clauses"]) if entry else []


def retrieve_clauses(
    document_id: str,
    query: str,
    k: int = 5,
    categories: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """Retrieve the top-k clauses most relevant to a query.

    Args:
        document_id: Document whose clauses should be searched.
        query: User query.
        k: Number of clauses to return.
        categories: Optional category filter (e.g. ["Payment", "Termination"]).

    Returns:
        Ranked clause dicts (including clause_number, title, text, categories)
        plus a relevance score.
    """
    entry = _clause_indexes.get(document_id)
    if not entry or not entry.get("clauses"):
        return []

    clauses = entry["clauses"]
    if categories:
        wanted = {c.strip().lower() for c in categories if c}
        if wanted:
            filtered = [
                c
                for c in clauses
                if wanted & {cat.lower() for cat in (c.get("categories") or [])}
            ]
            if filtered:
                clauses = filtered

    if entry.get("has_vectors") and entry.get("index") is not None:
        try:
            qvec = get_embeddings([query])
            if qvec is not None and qvec.size > 0:
                distances, indices = entry["index"].search(qvec, min(k, len(clauses)))
                results = []
                for pos, idx in enumerate(indices[0]):
                    if idx == -1 or idx >= len(clauses):
                        continue
                    hit = dict(clauses[int(idx)])
                    hit["score"] = round(float(1.0 / (1.0 + distances[0][pos])), 4)
                    results.append(hit)
                return results
        except Exception as exc:
            logger.warning("Vector clause retrieval failed for %s: %s", document_id, exc)

    # Keyword overlap fallback.
    tokens = set(re.findall(r"[a-z0-9]+", query.lower()))
    if not tokens:
        return []
    scored = []
    for idx, clause in enumerate(clauses):
        text = _clause_text(clause)
        clause_tokens = set(re.findall(r"[a-z0-9]+", text.lower()))
        if not clause_tokens:
            continue
        overlap = len(tokens & clause_tokens)
        score = overlap / max(len(tokens), 1)
        if clause.get("clause_number") and clause["clause_number"] in query:
            score += 0.5
        scored.append((score, idx))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [
        {**clauses[idx], "score": round(score, 4)}
        for score, idx in scored[:k]
        if score > 0
    ]


def remove_clause_index(document_id: str) -> None:
    """Drop a document's clause index (e.g. on document deletion)."""
    _clause_indexes.pop(document_id, None)
