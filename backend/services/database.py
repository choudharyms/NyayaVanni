import sqlite3

from ..config.database import DB_TIMEOUT_SECONDS as SQLITE_TIMEOUT_SECONDS


def connect_db(db_path: str) -> sqlite3.Connection:
    """Create a short-lived SQLite connection configured for concurrent callers."""
    connection = sqlite3.connect(
        db_path,
        check_same_thread=False,
        timeout=SQLITE_TIMEOUT_SECONDS,
        uri=str(db_path).startswith("file:"),
    )
    connection.execute(f"PRAGMA busy_timeout = {SQLITE_TIMEOUT_SECONDS * 1000}")
    return connection
