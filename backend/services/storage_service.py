import os
import uuid
import logging
import sqlite3
import json
from typing import Optional
from datetime import datetime, timezone, timedelta
import asyncio


logger = logging.getLogger(__name__)

# Render ephemeral storage / local temp directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

# SQLite Database setup
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'nyayavanni.db')
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def _connect_db():
    return sqlite3.connect(DB_PATH, uri=str(DB_PATH).startswith("file:"))


def init_db(raise_on_error: bool = False):
    conn = None
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS documents (
                document_id TEXT PRIMARY KEY,
                session_id TEXT,
                user_id TEXT,
                filename TEXT,
                local_path TEXT,
                status TEXT,
                uploaded_at TEXT
            )
        ''')
        cursor.execute("PRAGMA table_info(documents)")
        existing_columns = {row[1] for row in cursor.fetchall()}
        if "session_id" not in existing_columns:
            cursor.execute("ALTER TABLE documents ADD COLUMN session_id TEXT")
        if "user_id" not in existing_columns:
            cursor.execute("ALTER TABLE documents ADD COLUMN user_id TEXT")
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_documents_session_id
            ON documents(session_id)
        ''')

        _ensure_analysis_cache_table(cursor)

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
    cursor.execute('''
        CREATE TABLE document_analysis_cache (
            document_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            language TEXT NOT NULL,
            extracted_text TEXT,
            analysis_result TEXT,
            created_at TEXT,
            PRIMARY KEY (document_id, session_id, language)
        )
    ''')


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
    primary_key = [name for _, name in sorted((row[5], row[1]) for row in columns if row[5])]

    expected_columns = {
        "document_id",
        "session_id",
        "language",
        "extracted_text",
        "analysis_result",
        "created_at",
    }
    if expected_columns.issubset(column_names) and primary_key == ["document_id", "session_id", "language"]:
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

    if {"document_id", "language", "extracted_text", "analysis_result", "created_at"}.issubset(column_names):
        if "session_id" in column_names:
            cursor.execute(f'''
                INSERT OR IGNORE INTO document_analysis_cache
                    (document_id, session_id, language, extracted_text, analysis_result, created_at)
                SELECT cache.document_id, cache.session_id, cache.language,
                       cache.extracted_text, cache.analysis_result, cache.created_at
                FROM {backup_table} AS cache
                JOIN documents
                  ON documents.document_id = cache.document_id
                 AND documents.session_id = cache.session_id
                WHERE cache.session_id IS NOT NULL AND TRIM(cache.session_id) != ''
            ''')
        else:
            cursor.execute(f'''
                INSERT OR IGNORE INTO document_analysis_cache
                    (document_id, session_id, language, extracted_text, analysis_result, created_at)
                SELECT cache.document_id, documents.session_id, cache.language,
                       cache.extracted_text, cache.analysis_result, cache.created_at
                FROM {backup_table} AS cache
                JOIN documents ON documents.document_id = cache.document_id
                WHERE documents.session_id IS NOT NULL AND TRIM(documents.session_id) != ''
            ''')
    cursor.execute(f"DROP TABLE {backup_table}")

# Initialize tables
init_db()

def upload_to_local(file_bytes: bytes, filename: str) -> tuple[str, str]:
    """Save a file locally and return the document ID and local path"""
    ext = filename.split('.')[-1]
    doc_id = str(uuid.uuid4())
    local_path = os.path.join(UPLOAD_DIR, f"{doc_id}.{ext}")
    
    try:
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        return doc_id, local_path
    except Exception as e:
        logger.error(f"Local storage save failed: {e}")
        raise e

def create_session_id() -> str:
    return str(uuid.uuid4())


def save_document_record(session_id: str, doc_id: str, filename: str, local_path: str):
    """Save document metadata to SQLite"""
    timestamp = datetime.utcnow().isoformat()
    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO documents (document_id, session_id, user_id, filename, local_path, status, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (doc_id, session_id, None, filename, local_path, 'processing', timestamp)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"SQLite save failed: {e}")

def get_document_record(doc_id: str) -> Optional[dict]:
    """Retrieve document metadata from SQLite"""
    try:
        conn = _connect_db()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM documents WHERE document_id = ?", (doc_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None
    except Exception as e:
        logger.error(f"SQLite retrieve failed: {e}")
        return None


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

    try:
        conn = _connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM document_analysis_cache WHERE document_id = ?",
            (doc_id,)
        )
        cursor.execute(
            "DELETE FROM documents WHERE document_id = ?",
            (doc_id,)
        )
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"SQLite delete failed: {e}")
        return False

def delete_document_history(session_id: str) -> int:
    """Delete all documents and their analyses for a specific session ID"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get all documents for this session to delete files
        cursor.execute("SELECT document_id, local_path FROM documents WHERE session_id = ?", (session_id,))
        docs = cursor.fetchall()
        
        # Delete local files
        for doc_id, local_path in docs:
            if local_path and os.path.exists(local_path):
                try:
                    os.remove(local_path)
                except OSError as exc:
                    logger.warning(f"Failed to delete local file {local_path} during history clear: {exc}")
                    
        # Delete from DB
        cursor.execute("DELETE FROM document_analysis_cache WHERE document_id IN (SELECT document_id FROM documents WHERE session_id = ?)", (session_id,))
        cursor.execute("DELETE FROM documents WHERE session_id = ?", (session_id,))
        
        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()
        return deleted_count
    except Exception as e:
        logger.error(f"SQLite delete history failed: {e}")
        return 0

async def cleanup_expired_documents():
    """Background task to delete documents older than 24 hours to prevent storage exhaustion."""
    while True:
        try:
            logger.info("Running expired documents cleanup task...")
            # Calculate threshold: 24 hours ago
            threshold = (datetime.utcnow() - timedelta(hours=24)).isoformat()
            
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Find expired documents
            cursor.execute("SELECT document_id, local_path FROM documents WHERE uploaded_at < ?", (threshold,))
            expired_docs = cursor.fetchall()
            
            for doc_id, local_path in expired_docs:
                logger.info(f"Deleting expired document: {doc_id}")
                # Delete local file
                if local_path and os.path.exists(local_path):
                    try:
                        os.remove(local_path)
                    except OSError as exc:
                        logger.warning(f"Failed to delete file {local_path}: {exc}")
                
                # Delete from document_analysis_cache
                cursor.execute("DELETE FROM document_analysis_cache WHERE document_id = ?", (doc_id,))
                
                # Delete from documents table
                cursor.execute("DELETE FROM documents WHERE document_id = ?", (doc_id,))
            
            conn.commit()
            conn.close()
            
            if expired_docs:
                logger.info(f"Cleaned up {len(expired_docs)} expired documents.")
                
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
            raise ValueError("session_id is required for document analysis cache writes")
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
            (doc_id, session_id, language)
        )

        row = cursor.fetchone()
        if row:
            return {
                "extracted_text": row[0],
                "analysis": json.loads(row[1])
            }
        return None
    except Exception as e:
        logger.error(f"SQLite analysis cache retrieve failed: {e}")
        return None
    finally:
        if conn:
            conn.close()
