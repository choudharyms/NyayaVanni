"""Clause-level RAG pipeline.

Ties together clause parsing, segmentation, classification, embedding and
retrieval for the clause-level retrieval-augmented generation workflow.
"""

from typing import Any, Dict, List, Optional

from .clause_parser import parse_document_clauses
from .clause_retriever import get_indexed_clauses, index_clauses, retrieve_clauses


def index_document_for_rag(document_id: str, text: str) -> Dict[str, Any]:
    """Parse a document into clauses and build the clause retrieval index."""
    clauses = parse_document_clauses(text)
    return index_clauses(document_id, clauses)


def retrieve_for_query(
    document_id: str,
    query: str,
    k: int = 5,
    categories: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """Retrieve the most relevant clauses for a user query."""
    return retrieve_clauses(document_id, query, k=k, categories=categories)


def get_document_clauses(document_id: str) -> List[Dict[str, Any]]:
    """Return the currently indexed clauses for a document."""
    return get_indexed_clauses(document_id)
