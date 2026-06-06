import faiss
import numpy as np
import google.generativeai as genai
import json
import os
import logging

logger = logging.getLogger(__name__)

# Configure API key only if available
api_key = os.getenv("GEMINI_API_KEY")
if not api_key or not api_key.strip():
 main
    logger.warning(
        "GEMINI_API_KEY environment variable is not set or empty. "
        "RAG features will be unavailable until configured."
    )

    logger.warning("GEMINI_API_KEY environment variable is not set or empty. RAG and document analysis features will fail.")
 main
else:
    genai.configure(api_key=api_key)

# Load Legal Corpus
CORPUS_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'legal_corpus.json')
legal_corpus = []

try:
    with open(CORPUS_PATH, 'r') as f:
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
    logger.error(
        f"RAG system degraded: failed to load corpus: {e}"
    )

# Initialize FAISS Index
index = None
corpus_embeddings = None

def get_embeddings(texts: list) -> np.ndarray:
    try:
        if not texts or not os.getenv("GEMINI_API_KEY"):
            return np.array([])
        result = genai.embed_content(
            model="models/gemini-embedding-001",
            content=texts,
            task_type="retrieval_document",
        )
        return np.array(result['embedding'], dtype=np.float32)
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return np.array([])

def build_index():
    global corpus_embeddings, index

    if not legal_corpus:
        logger.warning(
            "RAG system degraded: skipping FAISS build (empty corpus)."
        )
        return

    logger.info("Building FAISS index...")

    corpus_embeddings = get_embeddings(legal_corpus)

    if corpus_embeddings is None or corpus_embeddings.size == 0:
        logger.warning(
            "RAG system degraded: embedding generation failed."
        )
        return

    d = corpus_embeddings.shape[1]
    index = faiss.IndexFlatL2(d)
    index.add(corpus_embeddings)

# Build immediately on module import (MVP approach)
build_index()

def retrieve_relevant_laws(query_text: str, k=2) -> list:
    """Search FAISS for the most relevant laws given the document's extracted text or sections"""
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
            legal_corpus[i]
            for i in indices[0]
            if i != -1 and i < len(legal_corpus)
        ]

        if len(results) == 0:
            logger.warning(
                "RAG system degraded: no retrieval results for query."
            )

        return results

    except Exception as e:
        logger.error(
            f"RAG system degraded: retrieval failed: {e}"
        )
        return []
