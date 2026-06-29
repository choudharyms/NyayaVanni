"""Scheduled refresh of RAG legal case database to prevent stale precedents.

Implements periodic updates of the case law index with version tracking and
staleness detection. The retrieve_cases() function checks index age and flags
outdated results, ensuring attorneys are alerted when case law needs refresh.
"""

import logging
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Optional

logger = logging.getLogger(__name__)

INDEX_VERSION_TABLE = "rag_index_metadata"
INDEX_REFRESH_DAYS = 30


def init_refresh_metadata_table(db_path: str) -> None:
    """Create or migrate rag_index_metadata table for tracking index versions."""
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {INDEX_VERSION_TABLE} (
                index_name TEXT PRIMARY KEY,
                version INTEGER DEFAULT 1,
                last_updated_at TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        cursor.execute("PRAGMA table_info(rag_index_metadata)")
        existing_columns = {row[1] for row in cursor.fetchall()}

        if "last_updated_at" not in existing_columns:
            cursor.execute(f"ALTER TABLE {INDEX_VERSION_TABLE} ADD COLUMN last_updated_at TEXT")
        if "created_at" not in existing_columns:
            cursor.execute(f"ALTER TABLE {INDEX_VERSION_TABLE} ADD COLUMN created_at TEXT")

        conn.commit()
        logger.info("RAG metadata table initialized")
    except Exception as e:
        logger.error(f"Failed to initialize RAG metadata table: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


def get_index_metadata(db_path: str, index_name: str = "case_law") -> Optional[dict]:
    """Retrieve index version and last update timestamp."""
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT version, last_updated_at, created_at FROM {INDEX_VERSION_TABLE} WHERE index_name = ?",
            (index_name,),
        )
        row = cursor.fetchone()
        if row:
            return {
                "version": row["version"],
                "last_updated_at": row["last_updated_at"],
                "created_at": row["created_at"],
            }
        return None
    except Exception as e:
        logger.error(f"Failed to retrieve index metadata: {e}")
        return None
    finally:
        if conn:
            conn.close()


def mark_index_refreshed(db_path: str, index_name: str = "case_law") -> bool:
    """Update index version and timestamp to mark successful refresh."""
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        now_iso = datetime.now(timezone.utc).isoformat()

        existing = get_index_metadata(db_path, index_name)
        if existing:
            new_version = existing["version"] + 1
            cursor.execute(
                f"UPDATE {INDEX_VERSION_TABLE} SET version = ?, last_updated_at = ? WHERE index_name = ?",
                (new_version, now_iso, index_name),
            )
        else:
            cursor.execute(
                f"INSERT INTO {INDEX_VERSION_TABLE} (index_name, version, last_updated_at, created_at) VALUES (?, 1, ?, ?)",
                (index_name, now_iso, now_iso),
            )

        conn.commit()
        logger.info(f"Marked RAG index {index_name} as refreshed (version {new_version if existing else 1})")
        return True
    except Exception as e:
        logger.error(f"Failed to mark index as refreshed: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()


def is_index_stale(db_path: str, index_name: str = "case_law", max_age_days: int = INDEX_REFRESH_DAYS) -> bool:
    """Check whether the case law index needs refresh based on age.

    Returns True if last update was more than max_age_days old, or if metadata
    does not exist (considered stale).
    """
    metadata = get_index_metadata(db_path, index_name)
    if not metadata or not metadata["last_updated_at"]:
        return True

    try:
        last_updated = datetime.fromisoformat(metadata["last_updated_at"])
        age = datetime.now(timezone.utc) - last_updated
        is_stale = age > timedelta(days=max_age_days)
        if is_stale:
            logger.warning(
                f"RAG index {index_name} is stale (age: {age.days} days, max: {max_age_days} days)"
            )
        return is_stale
    except Exception as e:
        logger.error(f"Failed to check index staleness: {e}")
        return True
