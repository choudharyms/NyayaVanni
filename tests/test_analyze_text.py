import pytest
from fastapi.testclient import TestClient


def test_analyze_text_success(test_client, monkeypatch):
    """
    POST /api/analyze-text with session ID header/cookie returns 200 with the mocked analysis.
    """
    # 1. Establish session first
    session_response = test_client.get("/api/session")
    assert session_response.status_code == 200
    session_id = session_response.json().get("sessionId")
    assert session_id is not None

    # 2. Mock downstream services
    monkeypatch.setattr(
        "backend.api.routes.retrieve_relevant_laws",
        lambda *args, **kwargs: ["Mock Law 1", "Mock Law 2"],
    )
    monkeypatch.setattr(
        "backend.api.routes.analyze_document_with_gemini",
        lambda *args, **kwargs: {
            "document_type": "Notice",
            "parties": [{"name": "Company A", "role": "Sender"}],
            "dates": [],
            "sections": ["Section 407"],
            "clauses": ["Do not share data."],
            "summary": "This is a mock legal document summary.",
            "risk_level": "High",
            "urgency": "Immediate",
            "consequences": ["Fines", "Data loss"],
            "recommended_timeline": "Respond within 5 days",
            "actions": [
                {
                    "priority": "high",
                    "action": "Consult legal counsel immediately.",
                    "why": "Urgent risk detected.",
                    "timeline": "As soon as possible",
                }
            ],
        },
    )
    monkeypatch.setattr(
        "backend.api.routes.ConfidenceService.generate",
        lambda *args, **kwargs: {"score": 0.95, "reason": "High matching"},
    )
    monkeypatch.setattr(
        "backend.api.routes.classify_document",
        lambda *args, **kwargs: "legal_notice",
    )
    monkeypatch.setattr(
        "backend.api.routes.graph_builder.generate_graph",
        lambda *args, **kwargs: {"nodes": [], "edges": []},
    )

    # 3. Post text to analysis endpoint
    response = test_client.post(
        "/api/analyze-text",
        headers={"X-Session-Id": session_id},
        json={
            "text": "This page lists the Terms of Service. Users must not share their account passwords.",
            "language": "en",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "documentId" in data
    assert data["analysis"]["risk_level"] == "High"
    assert data["analysis"]["summary"] == "This is a mock legal document summary."
    assert len(data["analysis"]["clauses"]) == 1
    assert data["analysis"]["clauses"][0] == "Do not share data."


def test_analyze_text_no_session(test_client):
    """
    POST /api/analyze-text without session ID header/cookie returns 401.
    """
    response = test_client.post(
        "/api/analyze-text",
        json={
            "text": "Some text content to analyze.",
            "language": "en",
        },
    )
    assert response.status_code == 401
    assert "Missing session_id" in response.json()["detail"]


def test_analyze_text_empty_input(test_client):
    """
    POST /api/analyze-text with empty text field returns 422 (Unprocessable Entity).
    """
    session_response = test_client.get("/api/session")
    session_id = session_response.json().get("sessionId")

    response = test_client.post(
        "/api/analyze-text",
        headers={"X-Session-Id": session_id},
        json={
            "text": "",
            "language": "en",
        },
    )
    assert response.status_code == 422
