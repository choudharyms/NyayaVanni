import os
import sqlite3
import sys

os.environ["GEMINI_API_KEY"] = "dummy_key"

sys.path.append(os.path.abspath("backend"))

import pytest
from fastapi.testclient import TestClient
from main import app

from backend.services import storage_service

client = TestClient(app)


@pytest.fixture
def isolated_db(tmp_path, monkeypatch):
    """Point storage at a throwaway database for forgot-password tests."""
    db_path = str(tmp_path / "test_nyayavanni.db")
    monkeypatch.setattr(storage_service, "DB_PATH", db_path)
    storage_service.init_db()
    return db_path


def test_forgot_password_returns_generic_response(isolated_db):
    response = client.post(
        "/api/forgot-password", json={"email": "user@example.com"}
    )
    assert response.status_code == 200
    assert "reset" not in response.json().get("status", "").lower()
    assert "token" not in response.text.lower()


def test_forgot_password_stores_only_token_hash(isolated_db):
    response = client.post(
        "/api/forgot-password", json={"email": "user@example.com"}
    )
    assert response.status_code == 200

    conn = sqlite3.connect(storage_service.DB_PATH)
    row = conn.execute(
        "SELECT token_hash FROM password_resets WHERE email = ?",
        ("user@example.com",),
    ).fetchone()
    conn.close()

    assert row is not None
    assert len(row[0]) == 64
    assert row[0] != "user@example.com"


def test_forgot_password_rejects_missing_email():
    response = client.post("/api/forgot-password", json={})
    assert response.status_code == 422


def test_forgot_password_rate_limit():
    last_response = None
    for _ in range(5):
        last_response = client.post(
            "/api/forgot-password", json={"email": "user@example.com"}
        )

    assert last_response.status_code == 429
