"""Audit logging service for tracking sensitive operations.

Records uploads, deletions, analyses, and other sensitive actions in an
append-only audit trail for compliance, debugging, and security monitoring.
"""

import logging
import sqlite3
from datetime import datetime, timezone
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

AUDIT_TABLE = "audit_log"


def init_audit_table(db_path: str) -> None:
    """Create the audit log table if it doesn't exist."""
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {AUDIT_TABLE} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                session_id TEXT,
                document_id TEXT,
                details TEXT,
                ip_address TEXT,
                user_agent TEXT,
                created_at TEXT NOT NULL
            )
        """)

        cursor.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_audit_log_action
            ON {AUDIT_TABLE}(action)
        """)

        cursor.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_audit_log_session_id
            ON {AUDIT_TABLE}(session_id)
        """)

        cursor.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
            ON {AUDIT_TABLE}(created_at)
        """)

        conn.commit()
        logger.info("Audit log table initialized")
    except Exception as e:
        logger.error(f"Failed to initialize audit log table: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


def log_audit_event(
    db_path: str,
    action: str,
    session_id: Optional[str] = None,
    document_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> bool:
    """Record an audit event.

    Args:
        db_path: Path to the SQLite database.
        action: The action performed (e.g., 'upload', 'delete', 'analyze').
        session_id: The session that performed the action.
        document_id: The document involved (if any).
        details: Additional context or metadata.
        ip_address: Client IP address.
        user_agent: Client user agent string.

    Returns:
        True if recorded successfully, False otherwise.
    """
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        now_iso = datetime.now(timezone.utc).isoformat()

        cursor.execute(
            f"""
            INSERT INTO {AUDIT_TABLE}
            (action, session_id, document_id, details, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (action, session_id, document_id, details, ip_address, user_agent, now_iso),
        )

        conn.commit()
        logger.info(f"Audit event recorded: {action} (doc={document_id}, session={session_id})")
        return True
    except Exception as e:
        logger.error(f"Failed to record audit event: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()


def get_audit_log(
    db_path: str,
    session_id: Optional[str] = None,
    document_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[Dict]:
    """Query audit log entries with optional filters.

    Args:
        db_path: Path to the SQLite database.
        session_id: Filter by session ID.
        document_id: Filter by document ID.
        action: Filter by action type.
        limit: Maximum results to return.
        offset: Pagination offset.

    Returns:
        List of audit log records (most recent first).
    """
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        conditions = []
        params = []

        if session_id:
            conditions.append("session_id = ?")
            params.append(session_id)
        if document_id:
            conditions.append("document_id = ?")
            params.append(document_id)
        if action:
            conditions.append("action = ?")
            params.append(action)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        cursor.execute(
            f"""
            SELECT id, action, session_id, document_id, details, ip_address, user_agent, created_at
            FROM {AUDIT_TABLE}
            {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            (*params, limit, offset),
        )

        return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Failed to query audit log: {e}")
        return []
    finally:
        if conn:
            conn.close()
