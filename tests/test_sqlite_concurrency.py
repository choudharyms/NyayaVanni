import asyncio
import uuid
from concurrent.futures import ThreadPoolExecutor

from backend.services import storage_service
from backend.services.database import connect_db


def test_connection_can_be_used_from_a_worker_thread():
    db_uri = f"file:nyayavanni-thread-test-{uuid.uuid4()}?mode=memory&cache=shared"
    conn = connect_db(db_uri)
    try:
        conn.execute("CREATE TABLE thread_test (value TEXT)")
        assert conn.execute("PRAGMA busy_timeout").fetchone() == (30000,)

        with ThreadPoolExecutor(max_workers=1) as executor:
            executor.submit(conn.execute, "INSERT INTO thread_test VALUES ('ok')").result()

        assert conn.execute("SELECT value FROM thread_test").fetchone() == ("ok",)
    finally:
        conn.close()


def test_concurrent_storage_requests_use_consistent_connections(monkeypatch):
    db_uri = f"file:nyayavanni-concurrency-test-{uuid.uuid4()}?mode=memory&cache=shared"
    anchor = connect_db(db_uri)
    monkeypatch.setattr(storage_service, "DB_PATH", db_uri)
    try:
        storage_service.init_db(raise_on_error=True)
        for index in range(40):
            storage_service.save_document_record(
                "session-a",
                f"doc-{index}",
                f"document-{index}.pdf",
                f"document-{index}.pdf",
            )

        def read(index):
            return storage_service.get_document_record(f"doc-{index}")

        with ThreadPoolExecutor(max_workers=8) as executor:
            records = list(executor.map(read, range(40)))

        assert [record["document_id"] for record in records] == [
            f"doc-{index}" for index in range(40)
        ]
    finally:
        anchor.close()


def test_cleanup_once_uses_shared_connection_policy(monkeypatch):
    db_uri = f"file:nyayavanni-cleanup-test-{uuid.uuid4()}?mode=memory&cache=shared"
    anchor = connect_db(db_uri)
    monkeypatch.setattr(storage_service, "DB_PATH", db_uri)
    try:
        storage_service.init_db(raise_on_error=True)
        anchor.execute(
            """
            INSERT INTO documents
                (document_id, session_id, filename, local_path, status, uploaded_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            ("expired-doc", "session-a", "old.pdf", None, "ready", "2000-01-01T00:00:00"),
        )
        anchor.commit()

        assert storage_service.cleanup_expired_documents_once() == 1
        assert anchor.execute("SELECT COUNT(*) FROM documents").fetchone()[0] == 0
    finally:
        anchor.close()


def test_async_cleanup_runs_database_work_in_thread(monkeypatch):
    calls = []

    async def fake_to_thread(func):
        calls.append(func)
        raise asyncio.CancelledError

    monkeypatch.setattr(storage_service.asyncio, "to_thread", fake_to_thread)

    try:
        asyncio.run(storage_service.cleanup_expired_documents())
    except asyncio.CancelledError:
        pass

    assert calls == [storage_service.cleanup_expired_documents_once]
