import pytest
from unittest.mock import MagicMock
from google.api_core.exceptions import DeadlineExceeded

def test_analyze_document_timeout(test_client, monkeypatch):
    """
    Test that when Gemini API call raises DeadlineExceeded during document analysis,
    the endpoint returns 504 Gateway Timeout.
    """
    # Mock extract_document and retrieve_relevant_laws to avoid external dependencies
    monkeypatch.setattr("backend.api.routes.extract_document", lambda *args, **kwargs: "Mocked text content")
    monkeypatch.setattr("backend.api.routes.retrieve_relevant_laws", lambda *args, **kwargs: [])
    monkeypatch.setattr("backend.api.routes.get_cached_analysis", lambda *args, **kwargs: None)
    monkeypatch.setattr("backend.api.routes.require_session_id", lambda *args, **kwargs: "session-123")
    monkeypatch.setattr("backend.api.routes.require_document_owner", lambda *args, **kwargs: {"local_path": "mock_path", "filename": "mock.pdf", "session_id": "session-123"})
    monkeypatch.setattr("backend.api.routes.index_document", lambda *args, **kwargs: None)
    
    # Mock analyze_document_with_gemini to raise DeadlineExceeded
    def mock_analyze(*args, **kwargs):
        raise DeadlineExceeded("Mock timeout error")
    
    monkeypatch.setattr("backend.api.routes.analyze_document_with_gemini", mock_analyze)
    
    # Call the endpoint passing file in the files parameter
    files = {"file": ("mock.pdf", b"dummy content", "application/pdf")}
    response = test_client.post(
        "/api/analyze/doc-123",
        params={"language": "en"},
        files=files
    )
    
    print("RESPONSE STATUS:", response.status_code)
    print("RESPONSE JSON:", response.json())
    
    assert response.status_code == 504
    assert "timed out" in response.json()["detail"].lower()

def test_chat_general_timeout(test_client, monkeypatch):
    """
    Test that when Gemini API call raises DeadlineExceeded during general chat,
    the endpoint returns a friendly timeout message.
    """
    # Mock generate_chat_response to raise DeadlineExceeded
    def mock_generate(*args, **kwargs):
        raise DeadlineExceeded("Mock timeout error")
        
    monkeypatch.setattr("backend.services.gemini_service.genai.GenerativeModel.generate_content", mock_generate)
    
    response = test_client.post(
        "/api/chat/general",
        json={
            "user_message": "Hello",
            "chat_history": [],
            "language": "en"
        }
    )
    
    assert response.status_code == 200
    assert "timed out" in response.json()["response"].lower()

def test_classify_document_timeout(monkeypatch):
    """
    Test that when Gemini API call raises DeadlineExceeded during classification,
    it falls back to the heuristic classifier.
    """
    from backend.services.document_classifier import classify_document
    
    # Mock api_key checks so it enters the try-except block
    monkeypatch.setattr("backend.services.document_classifier.api_key", "mock_key")
    
    def mock_generate(*args, **kwargs):
        raise DeadlineExceeded("Mock timeout error")
        
    monkeypatch.setattr("backend.services.document_classifier.genai.GenerativeModel.generate_content", mock_generate)
    
    result = classify_document("employment contract text")
    assert result["predicted_type"] == "Employment Agreement"

def test_diff_analysis_timeout(test_client, monkeypatch):
    """
    Test that when Gemini API call raises DeadlineExceeded during diff analysis,
    the endpoint returns 504 Gateway Timeout.
    """
    monkeypatch.setattr("backend.api.routes.require_session_id", lambda *args, **kwargs: "session-123")
    monkeypatch.setattr("backend.api.routes.extract_document", lambda *args, **kwargs: "Mocked text")
    
    def mock_generate(*args, **kwargs):
        raise DeadlineExceeded("Mock timeout error")
        
    monkeypatch.setattr("backend.api.routes.genai.GenerativeModel.generate_content", mock_generate)
    
    # Prepare files that pass the upload validation layer.
    files = {
        "old_document": ("old.pdf", b"%PDF-1.4\nold content", "application/pdf"),
        "new_document": ("new.pdf", b"%PDF-1.4\nnew content", "application/pdf"),
    }
    
    response = test_client.post("/api/diff-analysis", files=files)
    assert response.status_code == 504
    assert "timed out" in response.json()["detail"].lower()
