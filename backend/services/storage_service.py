import asyncio
import json
import logging
import os
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from .audit_log_service import init_audit_log_table
from .database import connect_db
from .search_service import clear_expired_cache

logger = logging.getLogger(__name__)

# Render ephemeral storage / local temp directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# SQLite Database setup
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "nyayavanni.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def _connect_db():
    return connect_db(DB_PATH)


def init_db(raise_on_error: bool = False):
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                document_id TEXT PRIMARY KEY,
                session_id TEXT,
                user_id TEXT,
                filename TEXT,
                local_path TEXT,
                status TEXT,
                uploaded_at TEXT
            )
        """)
        cursor.execute("PRAGMA table_info(documents)")
        existing_columns = {row[1] for row in cursor.fetchall()}
        if "session_id" not in existing_columns:
            cursor.execute("ALTER TABLE documents ADD COLUMN session_id TEXT")
        if "user_id" not in existing_columns:
            cursor.execute("ALTER TABLE documents ADD COLUMN user_id TEXT")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_documents_session_id
            ON documents(session_id)
        """)

        _ensure_analysis_cache_table(cursor)
        _ensure_sessions_table(cursor)

        conn.commit()

        init_audit_log_table(DB_PATH)
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"SQLite initialization failed: {e}")
        if raise_on_error:
            raise
    finally:
        if conn:
            conn.close()


def _create_analysis_cache_table(cursor):
    cursor.execute("""
        CREATE TABLE document_analysis_cache (
            document_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            language TEXT NOT NULL,
            extracted_text TEXT,
            analysis_result TEXT,
            created_at TEXT,
            PRIMARY KEY (document_id, session_id, language)
        )
    """)


def _ensure_analysis_cache_table(cursor):
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'document_analysis_cache'"
    )
    if not cursor.fetchone():
        _create_analysis_cache_table(cursor)
        return

    cursor.execute("PRAGMA table_info(document_analysis_cache)")
    columns = cursor.fetchall()
    column_names = {row[1] for row in columns}
    primary_key = [
        name for _, name in sorted((row[5], row[1]) for row in columns if row[5])
    ]

    expected_columns = {
        "document_id",
        "session_id",
        "language",
        "extracted_text",
        "analysis_result",
        "created_at",
    }
    if expected_columns.issubset(column_names) and primary_key == [
        "document_id",
        "session_id",
        "language",
    ]:
        return

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
    backup_table = f"document_analysis_cache_legacy_{timestamp}"
    cursor.execute(f"ALTER TABLE document_analysis_cache RENAME TO {backup_table}")
    _create_analysis_cache_table(cursor)

    legacy_columns = ", ".join(column_names)
    logger.warning(
        "Migrating legacy document_analysis_cache schema with columns: %s",
        legacy_columns,
    )

    if {
        "document_id",
        "language",
        "extracted_text",
        "analysis_result",
        "created_at",
    }.issubset(column_names):
        if "session_id" in column_names:
            cursor.execute(f"""
                INSERT OR IGNORE INTO document_analysis_cache
                    (document_id, session_id, language, extracted_text, analysis_result, created_at)
                SELECT cache.document_id, cache.session_id, cache.language,
                       cache.extracted_text, cache.analysis_result, cache.created_at
                FROM {backup_table} AS cache
                JOIN documents
                  ON documents.document_id = cache.document_id
                 AND documents.session_id = cache.session_id
                WHERE cache.session_id IS NOT NULL AND TRIM(cache.session_id) != ''
            """)
        else:
            cursor.execute(f"""
                INSERT OR IGNORE INTO document_analysis_cache
                    (document_id, session_id, language, extracted_text, analysis_result, created_at)
                SELECT cache.document_id, documents.session_id, cache.language,
                       cache.extracted_text, cache.analysis_result, cache.created_at
                FROM {backup_table} AS cache
                JOIN documents ON documents.document_id = cache.document_id
                WHERE documents.session_id IS NOT NULL AND TRIM(documents.session_id) != ''
            """)
    cursor.execute(f"DROP TABLE {backup_table}")


def _ensure_sessions_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            user_id TEXT,
            created_at TEXT NOT NULL,
            last_used_at TEXT NOT NULL,
            expires_at TEXT NOT NULL
        )
    """)
    cursor.execute("PRAGMA table_info(sessions)")
    cols = {row[1] for row in cursor.fetchall()}
    if "user_id" not in cols:
        cursor.execute("ALTER TABLE sessions ADD COLUMN user_id TEXT")
    if "created_at" not in cols:
        cursor.execute("ALTER TABLE sessions ADD COLUMN created_at TEXT")
    if "last_used_at" not in cols:
        cursor.execute("ALTER TABLE sessions ADD COLUMN last_used_at TEXT")
    if "expires_at" not in cols:
        cursor.execute("ALTER TABLE sessions ADD COLUMN expires_at TEXT")


SESSION_TTL = timedelta(hours=24)


def create_session_id() -> str:
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    expires_at = now + SESSION_TTL
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR IGNORE INTO sessions (session_id, created_at, last_used_at, expires_at) VALUES (?, ?, ?, ?)",
            (session_id, now.isoformat(), now.isoformat(), expires_at.isoformat()),
        )
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Session creation failed: {e}")
    finally:
        if conn:
            conn.close()
    return session_id


def validate_session(session_id: str) -> bool:
    if not session_id or not session_id.strip():
        return False
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT expires_at FROM sessions WHERE session_id = ?", (session_id,)
        )
        row = cursor.fetchone()
        if not row:
            return False
        expires_at = datetime.fromisoformat(row[0])
        if expires_at < datetime.now(timezone.utc):
            logger.warning(f"Expired session attempted: {session_id}")
            return False
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            "UPDATE sessions SET last_used_at = ? WHERE session_id = ?",
            (now, session_id),
        )
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Session validation failed: {e}")
        return False
    finally:
        if conn:
            conn.close()


def update_session_user_id(session_id: str, user_id: str) -> bool:
    """Associate a user ID with an existing session."""
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE sessions SET user_id = ? WHERE session_id = ?",
            (user_id, session_id),
        )
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"Failed to update session user_id: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()


def get_session_user_id(session_id: str) -> Optional[str]:
    """Return the user_id associated with a session, or None."""
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT user_id FROM sessions WHERE session_id = ?", (session_id,)
        )
        row = cursor.fetchone()
        return row[0] if row else None
    except Exception as e:
        logger.error(f"Failed to get session user_id: {e}")
        return None
    finally:
        if conn:
            conn.close()


def cleanup_expired_sessions_once() -> int:
    now = datetime.now(timezone.utc).isoformat()
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE expires_at < ?", (now,))
        deleted = cursor.rowcount
        conn.commit()
        if deleted:
            logger.info(f"Cleaned up {deleted} expired sessions.")
        return deleted
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Session cleanup failed: {e}")
        return 0
    finally:
        if conn:
            conn.close()


# Initialize tables
init_db()


def upload_to_local(file_bytes: bytes, filename: str) -> tuple[str, str]:
    """Save a file locally and return the document ID and local path"""
    ext = filename.split(".")[-1]
    doc_id = str(uuid.uuid4())
    local_path = os.path.join(UPLOAD_DIR, f"{doc_id}.{ext}")

    try:
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        return doc_id, local_path
    except Exception as e:
        logger.error(f"Local storage save failed: {e}")
        raise e


def save_document_record(session_id: str, doc_id: str, filename: str, local_path: str):
    """Save document metadata to SQLite"""
    timestamp = datetime.utcnow().isoformat()
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO documents (document_id, session_id, user_id, filename, local_path, status, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (doc_id, session_id, None, filename, local_path, "processing", timestamp),
        )
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"SQLite save failed: {e}")
    finally:
        if conn:
            conn.close()


def get_document_record(doc_id: str) -> Optional[dict]:
    """Retrieve document metadata from SQLite"""
    conn = None
    try:
        conn = _connect_db()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM documents WHERE document_id = ?", (doc_id,))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None
    except Exception as e:
        logger.error(f"SQLite retrieve failed: {e}")
        return None
    finally:
        if conn:
            conn.close()


def delete_document_and_cache(doc_id: str) -> bool:
    record = get_document_record(doc_id)
    if not record:
        return False

    local_path = record.get("local_path")
    if local_path and os.path.exists(local_path):
        try:
            os.remove(local_path)
        except OSError as exc:
            logger.warning(f"Failed to delete local file {local_path}: {exc}")

    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM document_analysis_cache WHERE document_id = ?", (doc_id,)
        )
        cursor.execute("DELETE FROM documents WHERE document_id = ?", (doc_id,))
        conn.commit()
        return True
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"SQLite delete failed: {e}")
        return False
    finally:
        if conn:
            conn.close()


def delete_document_history(session_id: str) -> int:
    """Delete all documents and their analyses for a specific session ID"""
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()

        # Get all documents for this session to delete files
        cursor.execute(
            "SELECT document_id, local_path FROM documents WHERE session_id = ?",
            (session_id,),
        )
        docs = cursor.fetchall()

        # Delete local files
        for doc_id, local_path in docs:
            if local_path and os.path.exists(local_path):
                try:
                    os.remove(local_path)
                except OSError as exc:
                    logger.warning(
                        f"Failed to delete local file {local_path} during history clear: {exc}"
                    )

        # Delete from DB
        cursor.execute(
            "DELETE FROM document_analysis_cache WHERE document_id IN (SELECT document_id FROM documents WHERE session_id = ?)",
            (session_id,),
        )
        cursor.execute("DELETE FROM documents WHERE session_id = ?", (session_id,))

        deleted_count = cursor.rowcount
        conn.commit()
        return deleted_count
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"SQLite delete history failed: {e}")
        return 0
    finally:
        if conn:
            conn.close()


def cleanup_expired_documents_once() -> int:
    """Delete expired documents in a synchronous pass owned by one worker thread."""
    logger.info("Running expired documents cleanup task...")
    threshold = (datetime.utcnow() - timedelta(hours=24)).isoformat()
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT document_id, local_path FROM documents WHERE uploaded_at < ?",
            (threshold,),
        )
        expired_docs = cursor.fetchall()

        for doc_id, local_path in expired_docs:
            logger.info(f"Deleting expired document: {doc_id}")
            if local_path and os.path.exists(local_path):
                try:
                    os.remove(local_path)
                except OSError as exc:
                    logger.warning(f"Failed to delete file {local_path}: {exc}")

            cursor.execute(
                "DELETE FROM document_analysis_cache WHERE document_id = ?", (doc_id,)
            )
            cursor.execute("DELETE FROM documents WHERE document_id = ?", (doc_id,))

        conn.commit()
        if expired_docs:
            logger.info(f"Cleaned up {len(expired_docs)} expired documents.")
        return len(expired_docs)
    except Exception:
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()


async def cleanup_expired_documents():
    """Periodically clean up expired documents and search cache without blocking the event loop."""
    while True:
        try:
            await asyncio.to_thread(cleanup_expired_documents_once)
            await asyncio.to_thread(clear_expired_cache)
        except Exception as e:
            logger.error(f"Error during document cleanup: {e}")

        # Sleep for 1 hour before next cleanup
        await asyncio.sleep(3600)


def save_cached_analysis(
    doc_id: str,
    session_id: str,
    language: str,
    extracted_text: str,
    analysis_result: dict,
) -> bool:
    """Persist analysis only when the session owns the document."""
    timestamp = datetime.now(timezone.utc).isoformat()
    conn = None
    try:
        if not session_id or not session_id.strip():
            raise ValueError(
                "session_id is required for document analysis cache writes"
            )
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO document_analysis_cache
                (document_id, session_id, language, extracted_text, analysis_result, created_at)
            SELECT document_id, session_id, ?, ?, ?, ?
            FROM documents
            WHERE document_id = ? AND session_id = ?
            """,
            (
                language,
                extracted_text,
                json.dumps(analysis_result),
                timestamp,
                doc_id,
                session_id,
            ),
        )
        conn.commit()
        if cursor.rowcount == 0:
            logger.warning(
                "Analysis cache write rejected for document %s: session does not own document",
                doc_id,
            )
            return False
        logger.info(f"Analysis cached for document {doc_id} [{language}]")
        return True
    except Exception as e:
        # Non-fatal: if caching fails the response is still returned to the user.
        logger.error(f"SQLite analysis cache save failed: {e}")
        return False
    finally:
        if conn:
            conn.close()


def get_cached_analysis(doc_id: str, session_id: str, language: str) -> Optional[dict]:
    """Return cached analysis for a document+session+language tuple, or None if absent."""
    conn = None
    try:
        if not session_id or not session_id.strip():
            raise ValueError("session_id is required for document analysis cache reads")
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT cache.extracted_text, cache.analysis_result
            FROM document_analysis_cache AS cache
            JOIN documents
              ON documents.document_id = cache.document_id
             AND documents.session_id = cache.session_id
            WHERE cache.document_id = ?
              AND cache.session_id = ?
              AND cache.language = ?
            """,
            (doc_id, session_id, language),
        )

        row = cursor.fetchone()
        if row:
            return {"extracted_text": row[0], "analysis": json.loads(row[1])}
        return None
    except Exception as e:
        logger.error(f"SQLite analysis cache retrieve failed: {e}")
        return None
    finally:
        if conn:
            conn.close()
