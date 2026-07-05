import os
import sys
import uuid
from datetime import datetime

os.environ["GEMINI_API_KEY"] = "dummy_key"
sys.path.append(os.path.abspath("backend"))

import pytest
from fastapi.testclient import TestClient
from main import app
from backend.services.storage_service import save_document_record, get_document_record

client = TestClient(app)


def test_audit_trail_flow():
    # 1. Establish session
    session_response = client.get("/api/session")
    assert session_response.status_code == 200
    session_cookie = session_response.cookies.get("session_id")
    assert session_cookie is not None

    # 2. Save a dummy document
    doc_id = str(uuid.uuid4())
    save_document_record(
        session_id=session_cookie,
        doc_id=doc_id,
        filename="complaint.pdf",
        local_path=f"uploads/{doc_id}.pdf"
    )

    # Verify initial status is "processing"
    record = get_document_record(doc_id)
    assert record is not None
    assert record["status"] == "processing"

    # 3. Retrieve history and check initial "processing" record
    history_response = client.get(f"/api/documents/{doc_id}/history")
    assert history_response.status_code == 200
    history_data = history_response.json()
    assert history_data["documentId"] == doc_id
    history = history_data["history"]
    assert len(history) == 1
    assert history[0]["old_status"] is None
    assert history[0]["new_status"] == "processing"
    assert history[0]["changed_by"] == session_cookie

    # 4. Update status to "reviewed"
    update_response = client.post(
        f"/api/documents/{doc_id}/status",
        json={"status": "reviewed"}
    )
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "reviewed"

    # Verify document record is updated
    record = get_document_record(doc_id)
    assert record["status"] == "reviewed"
    assert record["updated_at"] is not None

    # 5. Retrieve history again and check the transitions
    history_response = client.get(f"/api/documents/{doc_id}/history")
    assert history_response.status_code == 200
    history = history_response.json()["history"]
    assert len(history) == 2
    assert history[1]["old_status"] == "processing"
    assert history[1]["new_status"] == "reviewed"
    assert history[1]["changed_by"] == session_cookie

    # 6. Update status to "filed"
    update_response = client.post(
        f"/api/documents/{doc_id}/status",
        json={"status": "filed"}
    )
    assert update_response.status_code == 200

    # Retrieve final history
    history_response = client.get(f"/api/documents/{doc_id}/history")
    history = history_response.json()["history"]
    assert len(history) == 3
    assert history[2]["old_status"] == "reviewed"
    assert history[2]["new_status"] == "filed"


def test_audit_trail_unauthorized():
    # Get a session
    session_response = client.get("/api/session")
    session_cookie = session_response.cookies.get("session_id")
    
    # Save a document owned by this session
    doc_id = str(uuid.uuid4())
    save_document_record(
        session_id=session_cookie,
        doc_id=doc_id,
        filename="sensitive.pdf",
        local_path=f"uploads/{doc_id}.pdf"
    )

    # Make another client representing a different session
    unauthorized_client = TestClient(app)
    unauthorized_client.cookies.clear()
    
    # Attempt status update without session - should get 401
    bad_update = unauthorized_client.post(
        f"/api/documents/{doc_id}/status",
        json={"status": "approved"}
    )
    assert bad_update.status_code == 401

    # Establish a different session
    other_session_resp = unauthorized_client.get("/api/session")
    assert other_session_resp.status_code == 200
    
    # Attempt status update with different owner session - should get 403
    forbidden_update = unauthorized_client.post(
        f"/api/documents/{doc_id}/status",
        json={"status": "approved"}
    )
    assert forbidden_update.status_code == 403

    # Attempt fetching history from different owner - should get 403
    forbidden_history = unauthorized_client.get(f"/api/documents/{doc_id}/history")
    assert forbidden_history.status_code == 403
