import sqlite3

from backend.services import search_service


def test_search_documents_isolated_by_session_and_cache_key(tmp_path):
    db_path = tmp_path / "search.db"

    conn = sqlite3.connect(db_path)
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
        INSERT INTO documents (document_id, session_id, filename)
        VALUES (?, ?, ?), (?, ?, ?)
        """,
        (
            "doc-a",
            "session-a",
            "alice-notice.pdf",
            "doc-b",
            "session-b",
            "bob-notice.pdf",
        ),
    )
    conn.commit()
    conn.close()

    search_service.init_search_service(str(db_path))
    search_service.index_document("doc-a", "alice-notice.pdf", "notice for alice")
    search_service.index_document("doc-b", "bob-notice.pdf", "notice for bob")

    first = search_service.search_documents(
        "notice",
        session_id="session-a",
        use_cache=True,
    )
    second = search_service.search_documents(
        "notice",
        session_id="session-b",
        use_cache=True,
    )

    assert [row["document_id"] for row in first["results"]] == ["doc-a"]
    assert [row["document_id"] for row in second["results"]] == ["doc-b"]
    assert second["from_cache"] is False
