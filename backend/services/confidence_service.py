from typing import List
import google.generativeai as genai
import numpy as np

class ConfidenceService:

    @staticmethod
    def calculate_text_coverage(text: str):
        return min(len(text) / 5000, 1.0)

    @staticmethod
    def calculate_similarity(document_text: str, summary: str):

        try:
            doc_embed = genai.embed_content(
                model="models/gemini-embedding-001",
                content=document_text[:8000]
            )["embedding"]

            summary_embed = genai.embed_content(
                model="models/gemini-embedding-001",
                content=summary
            )["embedding"]

            doc_embed = np.array(doc_embed)
            summary_embed = np.array(summary_embed)

            similarity = np.dot(
                doc_embed,
                summary_embed
            ) / (
                np.linalg.norm(doc_embed)
                * np.linalg.norm(summary_embed)
            )

            return float(similarity)

        except Exception:
            return 0.5

    @staticmethod
    def confidence_level(score):

        if score >= 85:
            return "High"

        if score >= 65:
            return "Medium"

        return "Low"

    @classmethod
    def generate(
        cls,
        document_text,
        summary
    ):

        coverage = cls.calculate_text_coverage(
            document_text
        )

        similarity = cls.calculate_similarity(
            document_text,
            summary
        )

        score = (
            (coverage * 20)
            + (similarity * 80)
        )

        return {
            "score": round(score, 2),
            "level": cls.confidence_level(score),
            "coverage": round(coverage * 100, 2),
            "similarity": round(similarity * 100, 2)
        }