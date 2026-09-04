import pytest

from backend.services.confidence_service import ConfidenceService


def test_confidence_service_generate(monkeypatch):
    # Mock genai.embed_content to avoid API key requirements and network calls
    def mock_embed_content(*args, **kwargs):
        return {"embedding": [0.5, 0.5]}

    monkeypatch.setattr("google.generativeai.embed_content", mock_embed_content)

    # Call generate with valid arguments (no relevant_laws parameter)
    result = ConfidenceService.generate(
        document_text="This is a test legal document text to verify the confidence calculation.",
        summary="This is a test summary.",
    )

    # Assert correct structure in the returned dictionary
    assert "score" in result
    assert "level" in result
    assert "coverage" in result
    assert "similarity" in result
    assert result["level"] in ["High", "Medium", "Low"]
    assert isinstance(result["score"], float)
