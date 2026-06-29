"""Case status audit trail service for compliance and legal accountability.

Tracks all case status changes (filed, reviewed, closed, etc.) with timestamps,
user information, and historical context. Enables attorneys and auditors to
trace the complete lifecycle of a case and verify compliance with legal
procedural requirements.
"""

import logging
import sqlite3
from datetime import datetime, timezone
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

CASE_STATUS_HISTORY_TABLE = "case_status_history"
VALID_STATUSES = {"pending_review", "approved", "filed", "reviewed", "closed", "rejected"}


def init_case_audit_tables(db_path: str) -> None:
    """Create case status audit tables if they don't exist."""
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {CASE_STATUS_HISTORY_TABLE} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_id TEXT NOT NULL,
                previous_status TEXT,
                new_status TEXT NOT NULL,
                changed_by TEXT,
                changed_at TEXT NOT NULL,
                reason TEXT,
                created_at TEXT NOT NULL
            )
        """)

        cursor.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_case_status_history_case_id
            ON {CASE_STATUS_HISTORY_TABLE}(case_id)
        """)

        cursor.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_case_status_history_changed_at
            ON {CASE_STATUS_HISTORY_TABLE}(changed_at)
        """)

        conn.commit()
        logger.info("Case audit tables initialized")
    except Exception as e:
        logger.error(f"Failed to initialize case audit tables: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


def record_status_change(
    db_path: str,
    case_id: str,
    new_status: str,
    previous_status: Optional[str] = None,
    changed_by: Optional[str] = None,
    reason: Optional[str] = None,
) -> bool:
    """Record a case status change in the audit trail.

    Args:
        db_path: Path to SQLite database
        case_id: Unique case identifier
        new_status: New status value (must be valid)
        previous_status: Previous status (optional, for historical record)
        changed_by: User or system that made the change (optional)
        reason: Reason for the change (optional)

    Returns:
        True if recorded successfully, False otherwise
    """
    if new_status not in VALID_STATUSES:
        logger.warning(f"Invalid status: {new_status}. Valid values: {VALID_STATUSES}")
        return False

    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        now_iso = datetime.now(timezone.utc).isoformat()

        cursor.execute(
            f"""
            INSERT INTO {CASE_STATUS_HISTORY_TABLE}
            (case_id, previous_status, new_status, changed_by, changed_at, reason, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (case_id, previous_status, new_status, changed_by, now_iso, reason, now_iso),
        )

        conn.commit()
        logger.info(
            f"Recorded status change for case {case_id}: {previous_status} -> {new_status}"
        )
        return True
    except Exception as e:
        logger.error(f"Failed to record status change: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()


def get_case_status_history(
    db_path: str, case_id: str
) -> List[Dict]:
    """Retrieve the complete status change history for a case.

    Returns a reverse-chronological list of all status changes, showing
    when and why the case transitioned between statuses.

    Args:
        db_path: Path to SQLite database
        case_id: Unique case identifier

    Returns:
        List of status change records (reverse chronological order)
    """
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(
            f"""
            SELECT id, previous_status, new_status, changed_by, changed_at, reason
            FROM {CASE_STATUS_HISTORY_TABLE}
            WHERE case_id = ?
            ORDER BY changed_at DESC
            """,
            (case_id,),
        )

        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        logger.error(f"Failed to retrieve case history: {e}")
        return []
    finally:
        if conn:
            conn.close()


def get_time_in_status(
    db_path: str, case_id: str, status: str
) -> Optional[Dict]:
    """Calculate how long a case was in a specific status.

    Args:
        db_path: Path to SQLite database
        case_id: Unique case identifier
        status: Status value to query

    Returns:
        Dict with 'entered_at', 'exited_at', 'duration_days' or None if status not found
    """
    history = get_case_status_history(db_path, case_id)

    entered_at = None
    exited_at = None

    for record in history:
        if record["new_status"] == status and entered_at is None:
            exited_at = record["changed_at"]
        if record["previous_status"] == status and entered_at is None:
            entered_at = record["changed_at"]

    if not entered_at:
        return None

    try:
        from datetime import datetime
        enter_dt = datetime.fromisoformat(entered_at)
        exit_dt = datetime.fromisoformat(exited_at) if exited_at else datetime.now(timezone.utc)
        duration = (exit_dt - enter_dt).days

        return {
            "entered_at": entered_at,
            "exited_at": exited_at,
            "duration_days": duration,
        }
    except Exception as e:
        logger.error(f"Failed to calculate time in status: {e}")
        return None


def get_cases_by_update_range(
    db_path: str, start_date: str, end_date: str
) -> List[str]:
    """Get all case IDs that were modified within a date range.

    Useful for audit reports and compliance checks.

    Args:
        db_path: Path to SQLite database
        start_date: ISO 8601 datetime string
        end_date: ISO 8601 datetime string

    Returns:
        List of unique case IDs modified in the range
    """
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute(
            f"""
            SELECT DISTINCT case_id
            FROM {CASE_STATUS_HISTORY_TABLE}
            WHERE changed_at >= ? AND changed_at <= ?
            ORDER BY case_id
            """,
            (start_date, end_date),
        )

        return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Failed to query cases by date range: {e}")
        return []
    finally:
        if conn:
            conn.close()
