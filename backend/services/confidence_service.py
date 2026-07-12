from typing import List

import google.generativeai as genai
import numpy as np


class ConfidenceService:

    @staticmethod
    def calculate_text_quality(text: str):
        words = text.strip().split()
        if len(words) < 10:
            return 0.0
        unique_ratio = len(set(w.lower() for w in words)) / len(words)
        avg_word_len = sum(len(w) for w in words) / len(words)
        if avg_word_len < 2 or unique_ratio < 0.2:
            return 0.0
        return min(unique_ratio, 1.0)

    @staticmethod
    def calculate_text_coverage(text: str):
        return min(len(text) / 5000, 1.0)

    @staticmethod
    def calculate_similarity(document_text: str, summary: str):

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

        if score >= 85:
            return "High"

        if score >= 65:
            return "Medium"

        return "Low"

    @classmethod
    def generate(cls, document_text, summary):

        coverage = cls.calculate_text_coverage(document_text)
        text_quality = cls.calculate_text_quality(document_text)
        similarity = cls.calculate_similarity(document_text, summary)

        quality_penalty = 1.0 - (1.0 - text_quality) * 0.5
        score = ((coverage * 20) + (similarity * 80)) * quality_penalty
        score = max(0.0, min(score, 100.0))

        result = {
            "score": round(score, 2),
            "level": cls.confidence_level(score),
            "coverage": round(coverage * 100, 2),
            "similarity": round(similarity * 100, 2),
        }
        if text_quality < 0.5:
            result["warning"] = "Low text quality detected — confidence may be unreliable"
        return result
