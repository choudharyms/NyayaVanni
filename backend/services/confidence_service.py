from typing import List

import google.generativeai as genai
import numpy as np


class ConfidenceService:

    @staticmethod
    def calculate_text_coverage(text: str):
        """
        Calculate how much of the document is covered based on text length.

        Args:
            text: The document text to evaluate.

        Returns:
            A float between 0.0 and 1.0 representing coverage ratio,
            capped at 1.0 for documents longer than 5000 characters.
        """
        return min(len(text) / 5000, 1.0)

    @staticmethod
    def calculate_similarity(document_text: str, summary: str):
        """
        Calculate semantic similarity between document and summary using Gemini embeddings.

        Generates embeddings for both the document and summary using the
        Gemini embedding model, then computes cosine similarity between them.

        Args:
            document_text: The original document text (truncated to 8000 chars).
            summary: The summary text to compare against the document.

        Returns:
            A float representing cosine similarity between 0.0 and 1.0.
            Returns 0.5 as a fallback if embedding generation fails.
        """



        try:
            doc_embed = genai.embed_content(
                model="models/gemini-embedding-001", content=document_text[:8000]
            )["embedding"]

            summary_embed = genai.embed_content(
                model="models/gemini-embedding-001", content=summary
            )["embedding"]

            doc_embed = np.array(doc_embed)
            summary_embed = np.array(summary_embed)

            similarity = np.dot(doc_embed, summary_embed) / (
                np.linalg.norm(doc_embed) * np.linalg.norm(summary_embed)
            )

            return float(similarity)

        except Exception:
            return 0.5

    @staticmethod
    def confidence_level(score):
        """
        Convert a numeric confidence score into a human-readable level.

        Args:
            score: Numeric confidence score between 0 and 100.

        Returns:
            A string label: 'High' (>=85), 'Medium' (>=65), or 'Low' (<65).
        """

        if score >= 85:
            return "High"

        if score >= 65:
            return "Medium"

        return "Low"

    @classmethod
    def generate(cls, document_text, summary):
        """
        Generate a confidence report for a document-summary pair.

        Combines text coverage and semantic similarity scores to produce
        an overall confidence score and level for the given summary.

        Args:
            document_text (str): The original document text to evaluate.
            summary (str): The generated summary to assess confidence for.

        Returns:
            dict: A dictionary containing:
                - score: Overall confidence score (0-100).
                - level: Human-readable level ('High', 'Medium', 'Low').
                - coverage: Text coverage percentage (0-100).
                - similarity: Semantic similarity percentage (0-100).
        """
        coverage = cls.calculate_text_coverage(document_text)
   

       

        similarity = cls.calculate_similarity(document_text, summary)

        score = (coverage * 20) + (similarity * 80)

        return {
            "score": round(score, 2),
            "level": cls.confidence_level(score),
            "coverage": round(coverage * 100, 2),
            "similarity": round(similarity * 100, 2),
        }
