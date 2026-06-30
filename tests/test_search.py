import sqlite3
import uuid
from datetime import datetime, timedelta

import pytest

from backend.services import search_service


@pytest.fixture
def search_db_uri():
    db_uri = f"file:nyayavanni-search-test-{uuid.uuid4()}?mode=memory&cache=shared"
    anchor = sqlite3.connect(db_uri, uri=True)
    try:
        yield db_uri
    finally:
        anchor.close()


def test_search_cache_lifecycle(search_db_uri, monkeypatch):
    monkeypatch.setattr(search_service, "DB_PATH", search_db_uri)
    search_service.init_search_service(search_db_uri)

    # 1. Clean empty cache runs without issues
    search_service.clear_expired_cache()

    # 2. Add an expired and a valid search cache entry manually
    conn = sqlite3.connect(search_db_uri, uri=True)
    cursor = conn.cursor()

    now = datetime.now()
    expired_time = (
        now - timedelta(seconds=search_service.CACHE_EXPIRY_SECONDS + 10)
    ).isoformat()
    valid_time = now.isoformat()

    # Insert expired entry
    cursor.execute(
        "INSERT INTO search_cache (query_hash, query, results, page, page_size, total_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ("hash-expired", "old query", "[]", 1, 10, 0, expired_time),
    )
    # Insert valid entry
    cursor.execute(
        "INSERT INTO search_cache (query_hash, query, results, page, page_size, total_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ("hash-valid", "new query", "[]", 1, 10, 0, valid_time),
    )
    conn.commit()

    # Verify both entries exist in database
    cursor.execute("SELECT COUNT(*) FROM search_cache")
    assert cursor.fetchone()[0] == 2

    # 3. Trigger cache pruning
    search_service.clear_expired_cache()

    # 4. Verify only the valid entry remains
    cursor.execute("SELECT query_hash FROM search_cache")
    remaining_hashes = [row[0] for row in cursor.fetchall()]
    assert "hash-valid" in remaining_hashes
    assert "hash-expired" not in remaining_hashes
    assert len(remaining_hashes) == 1

    conn.close()
