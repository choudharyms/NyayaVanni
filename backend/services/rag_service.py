import faiss
import numpy as np
import google.generativeai as genai
import json
import os
import logging

logger = logging.getLogger(__name__)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Load Legal Corpus
CORPUS_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'legal_corpus.json')
try:
    with open(CORPUS_PATH, 'r') as f:
        legal_corpus = json.load(f)
except Exception as e:
    logger.error("Failed to load legal corpus")
    legal_corpus = []

# Initialize FAISS Index
index = None
corpus_embeddings = None

def get_embeddings(texts: list) -> np.ndarray:
    try:
        if not texts: return np.array([])
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
        return
    logger.info("Building FAISS index...")
    corpus_embeddings = get_embeddings(legal_corpus)
    if corpus_embeddings.size > 0:
        d = corpus_embeddings.shape[1]
        index = faiss.IndexFlatL2(d)
        index.add(corpus_embeddings)
        logger.info(f"FAISS index built with {index.ntotal} vectors.")

# Build immediately on module import (MVP approach)
build_index()

def retrieve_relevant_laws(query_text: str, k=2) -> list:
    """Search FAISS for the most relevant laws given the document's extracted text or sections"""
    if not index or index.ntotal == 0:
        return []
    
    # We embed the query
    try:
        query_embed = genai.embed_content(
            model="models/gemini-embedding-001",
            content=query_text,
            task_type="retrieval_query",
        )
        query_vec = np.array([query_embed['embedding']], dtype=np.float32)
        
        # Search
        distances, indices = index.search(query_vec, k)
        
        results = []
        for i in indices[0]:
            if i != -1 and i < len(legal_corpus):
                results.append(legal_corpus[i])
        return results
    except Exception as e:
        logger.error(f"RAG search failed: {e}")
        return []
