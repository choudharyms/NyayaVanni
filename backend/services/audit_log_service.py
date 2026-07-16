import json
import logging
import sqlite3
from datetime import datetime, timezone
from typing import Any, Optional

from .database import connect_db

logger = logging.getLogger(__name__)

AUDIT_LOG_TABLE = "audit_log"


def init_audit_log_table(db_path: str) -> None:
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {AUDIT_LOG_TABLE} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                action TEXT NOT NULL,
                resource_type TEXT NOT NULL,
                resource_id TEXT,
                session_id TEXT,
                details TEXT,
                ip_address TEXT
            )
        """)
        cursor.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp
            ON {AUDIT_LOG_TABLE}(timestamp)
        """)
        cursor.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_audit_log_action
            ON {AUDIT_LOG_TABLE}(action)
        """)
        cursor.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_audit_log_resource
            ON {AUDIT_LOG_TABLE}(resource_type, resource_id)
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


def log_action(
    db_path: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    session_id: Optional[str] = None,
    details: Optional[dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> bool:
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        now_iso = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            f"""
            INSERT INTO {AUDIT_LOG_TABLE}
            (timestamp, action, resource_type, resource_id, session_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                now_iso,
                action,
                resource_type,
                resource_id,
                session_id,
                json.dumps(details) if details else None,
                ip_address,
            ),
        )
        conn.commit()
        logger.info(f"Audit log: {action} on {resource_type} {resource_id or ''}")
        return True
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()


def get_audit_logs(
    db_path: str,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict[str, Any]]:
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        conditions = []
        params = []

        if action:
            conditions.append("action = ?")
            params.append(action)
        if resource_type:
            conditions.append("resource_type = ?")
            params.append(resource_type)
        if resource_id:
            conditions.append("resource_id = ?")
            params.append(resource_id)

        where_clause = " AND ".join(conditions) if conditions else "1=1"
        query = f"""
            SELECT id, timestamp, action, resource_type, resource_id, session_id, details, ip_address
            FROM {AUDIT_LOG_TABLE}
            WHERE {where_clause}
            ORDER BY timestamp DESC
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        cursor.execute(query, params)
        rows = cursor.fetchall()
        result = []
        for row in rows:
            record = dict(row)
            if record.get("details"):
                try:
                    record["details"] = json.loads(record["details"])
                except (json.JSONDecodeError, TypeError):
                    pass
            result.append(record)
        return result
    except Exception as e:
        logger.error(f"Failed to retrieve audit logs: {e}")
        return []
    finally:
        if conn:
            conn.close()


def get_audit_log_count(
    db_path: str,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
) -> int:
    """Return the total count of audit log entries matching the given filters."""
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        conditions = []
        params = []

        if action:
            conditions.append("action = ?")
            params.append(action)
        if resource_type:
            conditions.append("resource_type = ?")
            params.append(resource_type)
        if resource_id:
            conditions.append("resource_id = ?")
            params.append(resource_id)

        where_clause = " AND ".join(conditions) if conditions else "1=1"
        cursor.execute(
            f"SELECT COUNT(*) FROM {AUDIT_LOG_TABLE} WHERE {where_clause}",
            params,
        )
        return cursor.fetchone()[0]
    except Exception as e:
        logger.error(f"Failed to count audit logs: {e}")
        return 0
    finally:
        if conn:
            conn.close()
