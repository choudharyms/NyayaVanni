from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from .database import connect_db

logger = logging.getLogger(__name__)

# Render ephemeral storage / local temp directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

AVATAR_DIR = os.path.join(os.path.dirname(__file__), "..", "avatars")
os.makedirs(AVATAR_DIR, exist_ok=True)

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
        _ensure_avatars_table(cursor)
        _ensure_notification_prefs_table(cursor)

        conn.commit()
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
            created_at TEXT NOT NULL,
            last_used_at TEXT NOT NULL,
            expires_at TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            token_hash TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used INTEGER NOT NULL DEFAULT 0
        )
    """)


def _ensure_avatars_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS avatars (
            session_id TEXT PRIMARY KEY,
            avatar_path TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)


def _ensure_notification_prefs_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notification_preferences (
            session_id TEXT PRIMARY KEY,
            preferences TEXT NOT NULL DEFAULT '{}',
            updated_at TEXT NOT NULL
        )
    """)


SESSION_TTL = timedelta(days=30)


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


def invalidate_session(session_id: str) -> bool:
    if not session_id or not session_id.strip():
        return False
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Session invalidation failed: {e}")
        return False
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


PASSWORD_RESET_TTL = timedelta(hours=1)


def store_password_reset_token(email: str) -> Optional[str]:
    token = str(uuid.uuid4())
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    now = datetime.now(timezone.utc)
    expires_at = now + PASSWORD_RESET_TTL
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO password_reset_tokens (token_hash, email, created_at, expires_at, used) VALUES (?, ?, ?, ?, 0)",
            (token_hash, email, now.isoformat(), expires_at.isoformat()),
        )
        conn.commit()
        return token
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Password reset token storage failed: {e}")
        return None
    finally:
        if conn:
            conn.close()


def verify_password_reset_token(token: str) -> Optional[str]:
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT email, expires_at, used FROM password_reset_tokens WHERE token_hash = ?",
            (token_hash,),
        )
        row = cursor.fetchone()
        if not row:
            return None
        email, expires_at, used = row
        if used:
            logger.warning("Password reset token already used")
            return None
        if datetime.fromisoformat(expires_at) < datetime.now(timezone.utc):
            logger.warning("Password reset token expired")
            return None
        return email
    except Exception as e:
        logger.error(f"Password reset token verification failed: {e}")
        return None
    finally:
        if conn:
            conn.close()


def mark_password_reset_token_used(token: str) -> bool:
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE password_reset_tokens SET used = 1 WHERE token_hash = ?",
            (token_hash,),
        )
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Failed to mark password reset token used: {e}")
        return False
    finally:
        if conn:
            conn.close()


def init_api_keys_table() -> None:
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS api_keys (
                key_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                key_hash TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL DEFAULT 'default',
                scopes TEXT NOT NULL DEFAULT 'read',
                is_active INTEGER NOT NULL DEFAULT 1,
                last_used_at TEXT,
                created_at TEXT NOT NULL,
                expires_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_api_keys_user_id
            ON api_keys(user_id)
        """)
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Failed to initialize api_keys table: {e}")
    finally:
        if conn:
            conn.close()


# Initialize tables
init_db()
init_api_keys_table()


def upload_to_local(file_bytes: bytes, filename: str) -> tuple[str, str]:
    """Save a file locally and return the document ID and local path"""
    safe = "".join(ch for ch in os.path.basename(filename) if ch.isalnum() or ch in ("._-"))
    ext = safe.split(".")[-1] if "." in safe else ""
    doc_id = str(uuid.uuid4())
    local_path = os.path.normpath(os.path.join(UPLOAD_DIR, f"{doc_id}.{ext}"))
    if not local_path.startswith(os.path.normpath(UPLOAD_DIR)):
        raise ValueError("Path traversal detected in upload_to_local")

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
    """Periodically clean up expired documents without blocking the event loop."""
    while True:
        try:
            await asyncio.to_thread(cleanup_expired_documents_once)
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


def get_avatar_path(session_id: str) -> str | None:
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute("SELECT avatar_path FROM avatars WHERE session_id = ?", (session_id,))
        row = cursor.fetchone()
        return row[0] if row else None
    except Exception as e:
        logger.error(f"Failed to get avatar path: {e}")
        return None
    finally:
        if conn:
            conn.close()


def save_avatar(session_id: str, avatar_path: str) -> str | None:
    old_path = get_avatar_path(session_id)
    if old_path and old_path != avatar_path and os.path.exists(old_path):
        try:
            os.remove(old_path)
        except OSError as exc:
            logger.warning("Failed to delete old avatar %s: %s", old_path, exc)

    now = datetime.now(timezone.utc).isoformat()
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO avatars (session_id, avatar_path, updated_at) VALUES (?, ?, ?)",
            (session_id, avatar_path, now),
        )
        conn.commit()
        return old_path
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Failed to save avatar: {e}")
        return None
    finally:
        if conn:
            conn.close()


def get_notification_preferences(session_id: str) -> dict:
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute("SELECT preferences FROM notification_preferences WHERE session_id = ?", (session_id,))
        row = cursor.fetchone()
        if row:
            return json.loads(row[0])
        return {}
    except Exception as e:
        logger.error(f"Failed to get notification preferences: {e}")
        return {}
    finally:
        if conn:
            conn.close()


ALLOWED_NOTIFICATION_PREFERENCES = {"email", "sms", "push", "in_app"}
ALLOWED_DOCUMENT_TAGS = frozenset({
    "legal", "contract", "nda", "agreement", "policy",
    "terms", "employment", "property", "financial", "personal",
})
ALLOWED_SHARE_PERMISSIONS = {"view", "comment", "edit", "admin"}


def get_user_documents(session_id: str, page: int = 1, page_size: int = 10) -> dict:
    """Return a paginated list of documents for the given session."""
    conn = None
    try:
        conn = _connect_db()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(
            "SELECT COUNT(*) FROM documents WHERE session_id = ?",
            (session_id,),
        )
        total_count = cursor.fetchone()[0]

        offset = (page - 1) * page_size
        cursor.execute(
            "SELECT document_id, filename, status, uploaded_at, tags, description FROM documents WHERE session_id = ? ORDER BY uploaded_at DESC LIMIT ? OFFSET ?",
            (session_id, page_size, offset),
        )
        rows = cursor.fetchall()
        results = []
        for row in rows:
            d = dict(row)
            if d.get("tags"):
                try:
                    d["tags"] = json.loads(d["tags"])
                except (json.JSONDecodeError, TypeError):
                    d["tags"] = []
            else:
                d["tags"] = []
            results.append(d)

        return {
            "results": results,
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
        }
    except Exception as e:
        logger.error(f"Failed to list documents for session {session_id}: {e}")
        return {"results": [], "total_count": 0, "page": page, "page_size": page_size}
    finally:
        if conn:
            conn.close()


def get_document_tags(doc_id: str) -> list[str]:
    """Return tags for a document."""
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute("SELECT tags FROM documents WHERE document_id = ?", (doc_id,))
        row = cursor.fetchone()
        if row and row[0]:
            try:
                return json.loads(row[0])
            except (json.JSONDecodeError, TypeError):
                return []
        return []
    except Exception as e:
        logger.error(f"Failed to get tags for document {doc_id}: {e}")
        return []
    finally:
        if conn:
            conn.close()


def set_document_tags(doc_id: str, tags: list[str]) -> bool:
    """Set tags for a document, dropping any not in ALLOWED_DOCUMENT_TAGS."""
    cleaned = []
    for tag in tags:
        cleaned_tag = tag.strip().lower()
        if cleaned_tag in ALLOWED_DOCUMENT_TAGS:
            cleaned.append(cleaned_tag)
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE documents SET tags = ? WHERE document_id = ?",
            (json.dumps(cleaned), doc_id),
        )
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Failed to set tags for document {doc_id}: {e}")
        return False
    finally:
        if conn:
            conn.close()


def export_document_record(doc_id: str) -> dict | None:
    """Export document record excluding internal fields."""
    conn = None
    try:
        conn = _connect_db()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT document_id, filename, uploaded_at FROM documents WHERE document_id = ?",
            (doc_id,),
        )
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception as e:
        logger.error(f"Failed to export document {doc_id}: {e}")
        return None
    finally:
        if conn:
            conn.close()


def get_session_user_id(session_id: str) -> str | None:
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM sessions WHERE session_id = ?", (session_id,))
        row = cursor.fetchone()
        return row[0] if row else None
    except Exception as e:
        logger.error(f"Failed to get user_id for session {session_id}: {e}")
        return None
    finally:
        if conn:
            conn.close()


def update_session_user_id(session_id: str, user_id: str) -> bool:
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
        if conn:
            conn.rollback()
        logger.error(f"Failed to update session user_id: {e}")
        return False
    finally:
        if conn:
            conn.close()


def update_session_ip(session_id: str, ip_address: str) -> bool:
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE sessions SET ip_address = ? WHERE session_id = ?",
            (ip_address, session_id),
        )
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Failed to update session ip: {e}")
        return False
    finally:
        if conn:
            conn.close()


def deactivate_user_sessions(user_id: str) -> int:
    """Delete all sessions for a given user. Returns count of deleted sessions."""
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
        deleted = cursor.rowcount
        conn.commit()
        return deleted
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Failed to delete sessions for user {user_id}: {e}")
        return 0
    finally:
        if conn:
            conn.close()


def generate_api_key(user_id: str, name: str = "default", scopes: str = "read") -> tuple[str, str] | None:
    """Generate a new API key for a user. Returns (key_id, raw_key)."""
    import hashlib
    import secrets
    raw_key = f"nyv_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_id = secrets.token_hex(16)
    now = datetime.now(timezone.utc).isoformat()
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO api_keys (key_id, user_id, key_hash, name, scopes, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (key_id, user_id, key_hash, name, scopes, now),
        )
        conn.commit()
        return key_id, raw_key
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Failed to generate API key: {e}")
        return None
    finally:
        if conn:
            conn.close()


def list_api_keys(user_id: str) -> list[dict]:
    conn = None
    try:
        conn = _connect_db()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT key_id, name, scopes, is_active, last_used_at, created_at, expires_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        )
        return [dict(r) for r in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Failed to list API keys: {e}")
        return []
    finally:
        if conn:
            conn.close()


def revoke_api_key(key_id: str, user_id: str) -> bool:
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE api_keys SET is_active = 0 WHERE key_id = ? AND user_id = ?",
            (key_id, user_id),
        )
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Failed to revoke API key {key_id}: {e}")
        return False
    finally:
        if conn:
            conn.close()


def update_notification_preferences(session_id: str, preferences: dict) -> bool:
    invalid = set(preferences.keys()) - ALLOWED_NOTIFICATION_PREFERENCES
    if invalid:
        raise ValueError(f"Invalid notification preferences: {', '.join(sorted(invalid))}")

    for key, value in preferences.items():
        if not isinstance(value, bool):
            raise ValueError(f"Notification preference '{key}' must be a boolean")

    now = datetime.now(timezone.utc).isoformat()
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        existing = get_notification_preferences(session_id)
        existing.update(preferences)
        cursor.execute(
            "INSERT OR REPLACE INTO notification_preferences (session_id, preferences, updated_at) VALUES (?, ?, ?)",
            (session_id, json.dumps(existing), now),
        )
        conn.commit()
        return True
    except ValueError:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Failed to update notification preferences: {e}")
        return False
    finally:
        if conn:
            conn.close()
