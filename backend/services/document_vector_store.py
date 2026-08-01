"""Persistent per-document clause vector index for the smart chat feature.

Documents are segmented into individual clauses which are embedded and stored
in a FAISS index persisted to disk under FAISS_STORE_DIR. Because the index
survives server restarts, document context used by the chat feature is not
lost on redeploy/crash (previously it lived only in an in-memory global).

Indexes are scoped per document and automatically pruned after INDEX_TTL_HOURS
(privacy protection for legal documents).
"""

import logging
import os
import re
import time

import faiss
import numpy as np

from .rag_service import get_embeddings

logger = logging.getLogger(__name__)

FAISS_STORE_DIR = os.getenv("FAISS_STORE_DIR", "./faiss_indexes")
INDEX_TTL_HOURS = int(os.getenv("INDEX_TTL_HOURS", "24"))

MAX_CLAUSE_CHARS = 1200
MIN_CLAUSE_CHARS = 40
FALLBACK_CHUNK_CHARS = 500

# Clause heading regexes used to segment legal documents.
_CLAUSE_HEADING = re.compile(
    r"(?m)^\s*(?:"
    r"\d+(?:\.\d+)*[\.\)]|"  # 4. / 4.1 / 10.3)
    r"(?:section|sec\.|clause|cl\.|article|art\.|annexure|schedule|para|part)"
    r"\s+[A-Z0-9][A-Z0-9.\-]*"
    r")\s+([A-Z][^\n]{0,80})?$"
)

_NUMBERED = re.compile(r"^\s*(\d+(?:\.\d+)*)[\.\)]\s*")
_SECTION_HEADING = re.compile(
    r"^\s*(section|sec\.|clause|cl\.|article|art\.|annexure|schedule|para|part)"
    r"\s+[A-Z0-9][A-Z0-9.\-]*",
    re.IGNORECASE,
)


def _is_heading(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    if _NUMBERED.match(stripped) or _SECTION_HEADING.match(stripped):
        return True
    return bool(_CLAUSE_HEADING.search(stripped))


def split_into_clauses(text: str) -> list[str]:
    """Segment document text into individual clauses.

    Uses clause headings (numbers, section numbers, article numbers) as
    boundaries; long passages without headings are split into sentence-sized
    chunks so every chunk is a viable retrieval unit.
    """
    if not text:
        return []

    lines = [ln for ln in text.splitlines() if ln.strip()]
    chunks: list[str] = []
    current: list[str] = []

    def flush():
        nonlocal current
        block = " ".join(current).strip()
        current = []
        if len(block) >= MIN_CLAUSE_CHARS:
            chunks.append(block)

    for line in lines:
        if _is_heading(line) and len(" ".join(current).strip()) >= MIN_CLAUSE_CHARS:
            flush()
        current.append(line.strip())

        # Enforce a hard cap per clause to keep embeddings bounded.
        joined = " ".join(current)
        if len(joined) >= MAX_CLAUSE_CHARS:
            for piece in _split_long_passage(joined):
                if len(piece) >= MIN_CLAUSE_CHARS:
                    chunks.append(piece)
            current = []

    flush()
    return chunks


def _split_long_passage(block: str) -> list[str]:
    pieces: list[str] = []
    words = block.split()
    current: list[str] = []
    size = 0
    for word in words:
        current.append(word)
        size += len(word) + 1
        if size >= FALLBACK_CHUNK_CHARS:
            pieces.append(" ".join(current))
            current = []
            size = 0
    if current:
        pieces.append(" ".join(current))
    return pieces


def _index_path(doc_id: str) -> str:
    return os.path.join(FAISS_STORE_DIR, f"{doc_id}.index")


def _meta_path(doc_id: str) -> str:
    return os.path.join(FAISS_STORE_DIR, f"{doc_id}.pkl")


def index_document_clauses(doc_id: str, text: str, metadata: dict | None = None) -> dict:
    """Embed document clauses and persist the index to disk.

    Returns a summary dict (indexed clause count, stored clause list) so the
    caller can report indexing status. If embeddings are unavailable (no API
    key / API error), clauses are still persisted for keyword-based fallback
    retrieval.
    """
    clauses = split_into_clauses(text)
    if not clauses:
        return {"indexed": 0, "clauses": []}

    os.makedirs(FAISS_STORE_DIR, exist_ok=True)
    vectors = get_embeddings(clauses)
    has_vectors = vectors is not None and vectors.size > 0

    if has_vectors:
        d = vectors.shape[1]
        index = faiss.IndexFlatL2(d)
        index.add(vectors)
        faiss.write_index(index, _index_path(doc_id))
    else:
        logger.warning(
            "Embedding generation unavailable for document %s; "
            "storing clause text only (keyword retrieval fallback).",
            doc_id,
        )

    payload = {
        "doc_id": doc_id,
        "clauses": clauses,
        "has_vectors": has_vectors,
        "metadata": metadata or {},
        "created_at": time.time(),
    }
    import pickle

    with open(_meta_path(doc_id), "wb") as f:
        pickle.dump(payload, f)

    cleanup_expired_indexes()
    return {"indexed": len(clauses), "clauses": clauses}


def load_document_index(doc_id: str) -> dict:
    """Load a document's persisted index metadata.

    Raises FileNotFoundError if the index is missing or stale, so callers can
    respond with 404 ("Session expired, please re-upload").
    """
    meta = _meta_path(doc_id)
    if not os.path.exists(meta):
        raise FileNotFoundError(f"No persisted index for document {doc_id}")

    import pickle

    with open(meta, "rb") as f:
        payload = pickle.load(f)

    if INDEX_TTL_HOURS > 0 and (time.time() - payload.get("created_at", 0)) > INDEX_TTL_HOURS * 3600:
        remove_document_index(doc_id)
        raise FileNotFoundError(f"Index for document {doc_id} has expired")

    payload["index"] = None
    if payload.get("has_vectors") and os.path.exists(_index_path(doc_id)):
        payload["index"] = faiss.read_index(_index_path(doc_id))
    return payload


def retrieve_clauses(doc_id: str, query: str, k: int = 3) -> list[dict]:
    """Retrieve the most relevant clauses for a query.

    Uses the persisted FAISS index when vectors are available; otherwise falls
    back to keyword overlap scoring over the stored clause text.
    """
    payload = load_document_index(doc_id)
    clauses = payload.get("clauses", [])

    if not clauses or not query:
        return []

    if payload.get("index") is not None and payload.get("has_vectors"):
        try:
            q_vec = get_embeddings([query])
            if q_vec is not None and q_vec.size > 0:
                distances, indices = payload["index"].search(q_vec, min(k, len(clauses)))
                hits = []
                for pos, idx in enumerate(indices[0]):
                    if idx == -1 or idx >= len(clauses):
                        continue
                    hits.append(
                        {
                            "clause_index": int(idx),
                            "text": clauses[int(idx)],
                            "score": round(float(1.0 / (1.0 + distances[0][pos])), 4),
                        }
                    )
                return hits
        except Exception as e:
            logger.warning("Vector retrieval failed for %s: %s", doc_id, e)

    # Keyword fallback.
    import re as _re

    tokens = set(_re.findall(r"[a-z0-9]+", query.lower()))
    if not tokens:
        return []
    scored = []
    for idx, clause in enumerate(clauses):
        clause_tokens = set(_re.findall(r"[a-z0-9]+", clause.lower()))
        if not clause_tokens:
            continue
        overlap = len(tokens & clause_tokens)
        score = overlap / max(len(tokens), 1)
        scored.append((score, idx, clause))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [
        {"clause_index": idx, "text": text, "score": round(score, 4)}
        for score, idx, text in scored[:k]
        if score > 0
    ]


def remove_document_index(doc_id: str) -> None:
    """Delete a document's persisted index and metadata."""
    for path in (_index_path(doc_id), _meta_path(doc_id)):
        if os.path.exists(path):
            try:
                os.remove(path)
            except OSError as exc:
                logger.warning("Failed to remove index file %s: %s", path, exc)


def cleanup_expired_indexes() -> int:
    """Prune persisted indexes older than INDEX_TTL_HOURS. Returns count removed."""
    if INDEX_TTL_HOURS <= 0 or not os.path.isdir(FAISS_STORE_DIR):
        return 0
    cutoff = time.time() - INDEX_TTL_HOURS * 3600
    removed = 0
    for entry in os.scandir(FAISS_STORE_DIR):
        if not entry.is_file():
            continue
        if entry.stat().st_mtime < cutoff:
            doc_id = os.path.splitext(entry.name)[0]
            remove_document_index(doc_id)
            removed += 1
    if removed:
        logger.info("Cleaned up %d expired document vector indexes.", removed)
    return removed
