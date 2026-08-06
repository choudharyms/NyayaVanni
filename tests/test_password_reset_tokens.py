import sqlite3
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from backend.services import storage_service


@pytest.fixture
def isolated_db(tmp_path, monkeypatch):
    """Point storage at a throwaway database for reset-token tests."""
    db_path = str(tmp_path / "test_nyayavanni.db")
    monkeypatch.setattr(storage_service, "DB_PATH", db_path)
    storage_service.init_db()
    return db_path


def test_reset_token_not_stored_in_plaintext(isolated_db):
    email = "user@example.com"
    raw_token = storage_service.create_password_reset(email)

    conn = sqlite3.connect(storage_service.DB_PATH)
    row = conn.execute(
        "SELECT token_hash FROM password_resets WHERE email = ?", (email,)
    ).fetchone()
    conn.close()

    assert row is not None
    stored_hash = row[0]
    assert raw_token not in stored_hash
    assert stored_hash == storage_service._hash_reset_token(raw_token)
    assert stored_hash != raw_token


def test_verify_with_correct_token(isolated_db):
    raw_token = storage_service.create_password_reset("user@example.com")

    assert (
        storage_service.verify_password_reset_token(
            "user@example.com", raw_token
        )
        is True
    )


def test_verify_rejects_wrong_token(isolated_db):
    raw_token = storage_service.create_password_reset("user@example.com")

    assert (
        storage_service.verify_password_reset_token(
            "user@example.com", "wrong-token"
        )
        is False
    )
    assert (
        storage_service.verify_password_reset_token(
            "other@example.com", raw_token
        )
        is False
    )


def test_verify_token_is_single_use(isolated_db):
    raw_token = storage_service.create_password_reset("user@example.com")

    assert (
        storage_service.verify_password_reset_token(
            "user@example.com", raw_token
        )
        is True
    )
    assert (
        storage_service.verify_password_reset_token(
            "user@example.com", raw_token
        )
        is False
    )


def test_verify_rejects_expired_token(isolated_db):
    raw_token = storage_service.create_password_reset(
        "user@example.com", ttl=timedelta(seconds=-1)
    )

    assert (
        storage_service.verify_password_reset_token(
            "user@example.com", raw_token
        )
        is False
    )


def test_new_reset_revokes_previous_tokens(isolated_db):
    first = storage_service.create_password_reset("user@example.com")
    second = storage_service.create_password_reset("user@example.com")

    assert (
        storage_service.verify_password_reset_token(
            "user@example.com", first
        )
        is False
    )
    assert (
        storage_service.verify_password_reset_token(
            "user@example.com", second
        )
        is True
    )


def test_password_reset_flow_via_api(isolated_db):
    from backend.main import app

    client = TestClient(app)

    response = client.post(
        "/api/password-reset/request", json={"email": "user@example.com"}
    )
    assert response.status_code == 200
    raw_token = response.json()["resetToken"]

    conn = sqlite3.connect(storage_service.DB_PATH)
    stored = conn.execute(
        "SELECT token_hash FROM password_resets WHERE email = ?",
        ("user@example.com",),
    ).fetchone()
    conn.close()
    assert stored is not None
    assert raw_token not in stored[0]

    verified = client.post(
        "/api/password-reset/verify",
        json={"email": "user@example.com", "token": raw_token},
    )
    assert verified.status_code == 200
    assert verified.json()["valid"] is True

    replayed = client.post(
        "/api/password-reset/verify",
        json={"email": "user@example.com", "token": raw_token},
    )
    assert replayed.status_code == 401


def test_password_reset_verify_rejects_bad_token(isolated_db):
    from backend.main import app

    client = TestClient(app)

    response = client.post(
        "/api/password-reset/verify",
        json={"email": "user@example.com", "token": "not-a-real-token"},
    )
    assert response.status_code == 401
