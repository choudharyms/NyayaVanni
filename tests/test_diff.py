import pytest
from unittest.mock import MagicMock


def test_diff_analysis_success(test_client, monkeypatch):
    """
    POST /api/diff-analysis returns 200 with the structured clause comparison response.
    """
    # Mock require_session_id
    monkeypatch.setattr("backend.api.routes.require_session_id", lambda *args, **kwargs: "session-123")
    
    # Mock extract_document
    monkeypatch.setattr("backend.api.routes.extract_document", lambda *args, **kwargs: "Mocked text")
    
    # Mock the Gemini API response
    mock_response = MagicMock()
    mock_response.text = '{"summary": {"matched": 10, "modified": 2, "added": 1, "removed": 1}, "clauses": [{"status": "unchanged", "oldClause": "This is old", "newClause": "This is old", "category": "Payment"}], "ai_summary": {"payment": "No changes", "liability": "No changes", "termination": "No changes", "privacy": "No changes", "intellectual_property": "No changes", "dispute_resolution": "No changes"}}'
    
    monkeypatch.setattr("backend.api.routes.genai.GenerativeModel.generate_content", lambda *args, **kwargs: mock_response)
    
    # Prepare dummy files
    files = {
        "old_document": ("old.pdf", b"dummy content", "application/pdf"),
        "new_document": ("new.pdf", b"dummy content", "application/pdf"),
    }
    
    response = test_client.post("/api/diff-analysis", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert data["summary"]["matched"] == 10
    assert len(data["clauses"]) == 1
    assert data["clauses"][0]["status"] == "unchanged"
    assert data["ai_summary"]["payment"] == "No changes"
