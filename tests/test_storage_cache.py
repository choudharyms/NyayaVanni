import json
import sqlite3
import uuid

import pytest
from backend.services import storage_service


@pytest.fixture
def cache_db_uri():
    db_uri = f"file:nyayavanni-cache-test-{uuid.uuid4()}?mode=memory&cache=shared"
    anchor = sqlite3.connect(db_uri, uri=True)
    try:
        yield db_uri
    finally:
        anchor.close()


def _cache_primary_key(db_uri):
    conn = sqlite3.connect(db_uri, uri=True)
    try:
        rows = conn.execute("PRAGMA table_info(document_analysis_cache)").fetchall()
        return [name for _, name in sorted((row[5], row[1]) for row in rows if row[5])]
    finally:
        conn.close()


def _legacy_cache_tables(db_uri):
    conn = sqlite3.connect(db_uri, uri=True)
    try:
        rows = conn.execute(
            """
            SELECT name
            FROM sqlite_master
            WHERE type = 'table' AND name LIKE 'document_analysis_cache_legacy_%'
            """
        ).fetchall()
        return [row[0] for row in rows]
    finally:
        conn.close()


def test_cached_analysis_is_scoped_to_session(cache_db_uri, monkeypatch):
    monkeypatch.setattr(storage_service, "DB_PATH", cache_db_uri)
    storage_service.init_db(raise_on_error=True)

    storage_service.save_document_record(
        "session-a",
        "doc-1",
        "lease.pdf",
        "lease.pdf",
    )
    saved = storage_service.save_cached_analysis(
        "doc-1",
        "session-a",
        "en",
        "extracted text",
        {"document_type": "Lease"},
    )

    assert saved is True
    cached = storage_service.get_cached_analysis("doc-1", "session-a", "en")

    assert cached == {
        "extracted_text": "extracted text",
        "analysis": {"document_type": "Lease"},
    }
    assert storage_service.get_cached_analysis("doc-1", "session-b", "en") is None
    assert _cache_primary_key(cache_db_uri) == ["document_id", "session_id", "language"]


def test_cache_rejects_write_from_non_owner(cache_db_uri, monkeypatch):
    monkeypatch.setattr(storage_service, "DB_PATH", cache_db_uri)
    storage_service.init_db(raise_on_error=True)
    storage_service.save_document_record("session-a", "doc-1", "lease.pdf", "lease.pdf")

    saved = storage_service.save_cached_analysis(
        "doc-1",
        "session-b",
        "en",
        "extracted text",
        {"document_type": "Lease"},
    )

    assert saved is False
    assert storage_service.get_cached_analysis("doc-1", "session-a", "en") is None
    assert storage_service.get_cached_analysis("doc-1", "session-b", "en") is None


def test_legacy_cache_schema_is_migrated_to_session_scope(cache_db_uri, monkeypatch):
    conn = sqlite3.connect(cache_db_uri, uri=True)
    try:
        conn.execute(
            """
            CREATE TABLE documents (
                document_id TEXT PRIMARY KEY,
                session_id TEXT,
                user_id TEXT,
                filename TEXT,
                local_path TEXT,
                status TEXT,
                uploaded_at TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE document_analysis_cache (
                document_id TEXT,
                language TEXT,
                extracted_text TEXT,
                analysis_result TEXT,
                created_at TEXT,
                PRIMARY KEY (document_id, language)
            )
            """
        )
        conn.execute(
            """
            INSERT INTO documents
                (document_id, session_id, user_id, filename, local_path, status, uploaded_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            ("doc-legacy", "session-a", None, "legacy.pdf", "legacy.pdf", "ready", "2026-06-05"),
        )
        conn.execute(
            """
            INSERT INTO document_analysis_cache
                (document_id, language, extracted_text, analysis_result, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                "doc-legacy",
                "en",
                "legacy text",
                json.dumps({"document_type": "Legacy"}),
                "2026-06-05",
            ),
        )
        conn.commit()
    finally:
        conn.close()

    monkeypatch.setattr(storage_service, "DB_PATH", cache_db_uri)
    storage_service.init_db(raise_on_error=True)

    assert _cache_primary_key(cache_db_uri) == ["document_id", "session_id", "language"]
    assert storage_service.get_cached_analysis("doc-legacy", "session-a", "en") == {
        "extracted_text": "legacy text",
        "analysis": {"document_type": "Legacy"},
    }
    assert storage_service.get_cached_analysis("doc-legacy", "session-b", "en") is None
    assert _legacy_cache_tables(cache_db_uri) == []
