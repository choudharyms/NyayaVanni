import json
import logging
import os
from datetime import datetime, timezone

import faiss
import google.generativeai as genai
import numpy as np
from dotenv import load_dotenv

load_dotenv(override=True)
logger = logging.getLogger(__name__)

# Configure API key only if available
api_key = os.getenv("GEMINI_API_KEY")
if not api_key or not api_key.strip():
    logger.warning(
        "GEMINI_API_KEY environment variable is not set or empty. "
        "RAG features will be unavailable until configured."
    )

else:
    genai.configure(api_key=api_key)

# Load Legal Corpus
CORPUS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "legal_corpus.json")
legal_corpus = []

try:
    with open(CORPUS_PATH, "r") as f:
        legal_corpus = json.load(f)

    if not legal_corpus:
        logger.warning(
            "RAG system degraded: legal_corpus.json is empty. "
            "Operating in fallback mode (no legal retrieval)."
        )

except FileNotFoundError:
    logger.warning(
        f"RAG system degraded: legal_corpus.json not found at {CORPUS_PATH}. "
        "Operating in fallback mode."
    )

except Exception as e:
    logger.error(f"RAG system degraded: failed to load corpus: {e}")

# Initialize FAISS Index
index = None
corpus_embeddings = None


def get_embeddings(texts: list) -> np.ndarray:
    """
    Generate embeddings for a list of texts using the Gemini embedding model.

    Args:
        texts: List of text strings to embed.

    Returns:
        A numpy array of float32 embeddings, or an empty array if
        the input is empty, the API key is missing, or an error occurs.
    """
    try:
        if not texts or not os.getenv("GEMINI_API_KEY"):
            return np.array([])
        result = genai.embed_content(
            model="models/gemini-embedding-001",
            content=texts,
            task_type="retrieval_document",
        )
        return np.array(result["embedding"], dtype=np.float32)
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return np.array([])


def build_index():
    """
    Build a FAISS index from the legal corpus embeddings.

    Generates embeddings for all documents in the legal corpus and
    adds them to a FAISS flat L2 index stored in a global variable.
    Logs a warning and returns early if the corpus is empty or
    embedding generation fails.
    """
    global corpus_embeddings, index

    if not legal_corpus:
        logger.warning("RAG system degraded: skipping FAISS build (empty corpus).")
        return

    logger.info("Building FAISS index...")

    corpus_embeddings = get_embeddings(legal_corpus)

    if corpus_embeddings is None or corpus_embeddings.size == 0:
        logger.warning("RAG system degraded: embedding generation failed.")
        return

    d = corpus_embeddings.shape[1]
    index = faiss.IndexFlatL2(d)
    index.add(corpus_embeddings)


# Build immediately on module import (MVP approach)

INDEX_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "faiss_index.bin")


def init_index():
    """
    Initialize the FAISS index by loading from cache or building fresh.

    Checks for a cached FAISS index on disk and loads it if available.
    Otherwise builds a new index from the legal corpus and saves it
    to disk for future use.
    """
    global index
    if os.path.exists(INDEX_PATH):
        logger.info("Loading cached FAISS index from disk...")
        index = faiss.read_index(INDEX_PATH)
    else:
        logger.info("No cache found. Building FAISS index from Gemini API...")
        build_index()
        if index is not None:
            faiss.write_index(index, INDEX_PATH)


init_index()


# Cache expiry in seconds (default 24 hours)
RAG_CACHE_TTL = int(os.getenv("RAG_CACHE_TTL", str(24 * 3600)))
_last_refresh = datetime.now(timezone.utc)


def _is_cache_stale() -> bool:
    global _last_refresh
    elapsed = (datetime.now(timezone.utc) - _last_refresh).total_seconds()
    return elapsed > RAG_CACHE_TTL


def refresh_index_if_stale():
    """Rebuild the FAISS index if the cache TTL has expired."""
    global _last_refresh
    if _is_cache_stale():
        logger.info("RAG cache expired, refreshing FAISS index...")
        build_index()
        if index is not None:
            faiss.write_index(index, INDEX_PATH)
        _last_refresh = datetime.now(timezone.utc)
        logger.info("RAG index refresh complete.")


def schedule_rag_refresh():
    """Background task that periodically refreshes the RAG index."""
    import asyncio

    async def _refresh_loop():
        while True:
            await asyncio.sleep(RAG_CACHE_TTL)
            refresh_index_if_stale()

    import threading
    thread = threading.Thread(target=lambda: asyncio.run(_refresh_loop()), daemon=True)
    thread.start()


# Start background refresh on import
schedule_rag_refresh()


def retrieve_relevant_laws(query_text: str, k=2) -> list:
    """
    Retrieve the most relevant legal corpus entries for a given query.

    Embeds the query text and searches the FAISS index for the closest
    matching legal documents using L2 distance. Automatically refreshes
    the index if the cache TTL has expired.

    Args:
        query_text: The legal query or document text to search against.
        k: Number of top results to retrieve. Defaults to 2.

    Returns:
        A list of relevant legal corpus strings. Returns an empty list
        if the index is unavailable or retrieval fails.
    """
    refresh_index_if_stale()
    if index is None or index.ntotal == 0:
        logger.warning(
            "RAG system degraded: FAISS index unavailable or empty. "
            "Returning no legal context."
        )
        return []

    try:
        query_embed = genai.embed_content(
            model="models/gemini-embedding-001",
            content=query_text,
            task_type="retrieval_query",
        )

        query_vec = np.array([query_embed["embedding"]], dtype=np.float32)
        distances, indices = index.search(query_vec, k)

        results = [
            legal_corpus[i] for i in indices[0] if i != -1 and i < len(legal_corpus)
        ]

        if len(results) == 0:
            logger.warning("RAG system degraded: no retrieval results for query.")

        return results

    except Exception as e:
        logger.error(f"RAG system degraded: retrieval failed: {e}")
        return []
