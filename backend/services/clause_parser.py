"""Clause parser: high-level entry point for clause-level document parsing.

Combines clause segmentation with section-title preservation and clause
classification into a single `parse_document_clauses` helper used by the API.
"""

from typing import Any, Dict, List

from .clause_segmenter import segment_clauses


def parse_document_clauses(text: str) -> List[Dict[str, Any]]:
    """Parse a document into structured clauses with metadata.

    Args:
        text: Full extracted document text.

    Returns:
        List of clause dicts with clause_number, title, text, level, parent
        and categories.
    """
    return segment_clauses(text)
