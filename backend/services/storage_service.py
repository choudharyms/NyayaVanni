import os
import uuid
import logging
import sqlite3
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Render ephemeral storage / local temp directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

# SQLite Database setup
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'nyayavanni.db')
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            document_id TEXT PRIMARY KEY,
            user_id TEXT,
            filename TEXT,
            local_path TEXT,
            status TEXT,
            uploaded_at TEXT
        )
    ''')
    conn.commit()
    conn.close()

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

def save_document_record(user_id: str, doc_id: str, filename: str, local_path: str):
    """Save document metadata to SQLite"""
    timestamp = datetime.utcnow().isoformat()
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO documents (document_id, user_id, filename, local_path, status, uploaded_at) VALUES (?, ?, ?, ?, ?, ?)",
            (doc_id, user_id, filename, local_path, 'processing', timestamp)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"SQLite save failed: {e}")

def get_document_record(doc_id: str) -> Optional[dict]:
    """Retrieve document metadata from SQLite"""
    try:
        conn = sqlite3.connect(DB_PATH)
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
