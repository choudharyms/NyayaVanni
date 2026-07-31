import pytest

from backend.api.routes import AVERAGE_READING_WPM, _estimate_reading_time


def test_estimate_reading_time_empty():
    result = _estimate_reading_time("")
    assert result == {"word_count": 0, "reading_time_minutes": 0}

    result = _estimate_reading_time(None)
    assert result == {"word_count": 0, "reading_time_minutes": 0}


def test_estimate_reading_time_short_text():
    result = _estimate_reading_time("This is a short document.")
    assert result["word_count"] == 5
    assert result["reading_time_minutes"] == 1


def test_estimate_reading_time_long_text():
    words = "word " * (AVERAGE_READING_WPM * 2)
    result = _estimate_reading_time(words.strip())
    assert result["word_count"] == AVERAGE_READING_WPM * 2
    assert result["reading_time_minutes"] == 2


def test_analyze_text_returns_reading_time(test_client, monkeypatch):
    session_response = test_client.get("/api/session")
    session_id = session_response.json().get("sessionId")

    monkeypatch.setattr(
        "backend.api.routes.retrieve_relevant_laws",
        lambda *args, **kwargs: [],
    )
    monkeypatch.setattr(
        "backend.api.routes.analyze_document_with_gemini",
        lambda *args, **kwargs: {
            "document_type": "Notice",
            "summary": "A mock summary.",
            "risk_level": "High",
        },
    )
    monkeypatch.setattr(
        "backend.api.routes.ConfidenceService.generate",
        lambda *args, **kwargs: {"score": 0.9, "reason": "Mock"},
    )
    monkeypatch.setattr(
        "backend.api.routes.classify_document",
        lambda *args, **kwargs: "legal_notice",
    )
    monkeypatch.setattr(
        "backend.api.routes.graph_builder.generate_graph",
        lambda *args, **kwargs: {"nodes": [], "edges": []},
    )

    response = test_client.post(
        "/api/analyze-text",
        headers={"X-Session-Id": session_id},
        json={
            "text": "This is a sample legal document with several words to analyze.",
            "language": "en",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "reading_time" in data
    assert data["reading_time"]["word_count"] > 0
    assert data["reading_time"]["reading_time_minutes"] >= 1
