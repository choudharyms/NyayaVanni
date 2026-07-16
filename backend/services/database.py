import sqlite3
import threading

from ..config.database import DB_POOL_MAX_SIZE, DB_TIMEOUT_SECONDS as SQLITE_TIMEOUT_SECONDS

_connection_semaphore = threading.Semaphore(DB_POOL_MAX_SIZE)


class _PooledConnection:
    def __init__(self, conn: sqlite3.Connection):
        self._conn = conn

    def __getattr__(self, name):
        return getattr(self._conn, name)

    def close(self):
        self._conn.close()
        _connection_semaphore.release()


def connect_db(db_path: str) -> sqlite3.Connection:
    _connection_semaphore.acquire()
    try:
        connection = sqlite3.connect(
            db_path,
            check_same_thread=False,
            timeout=SQLITE_TIMEOUT_SECONDS,
            uri=str(db_path).startswith("file:"),
        )
        connection.execute(f"PRAGMA busy_timeout = {SQLITE_TIMEOUT_SECONDS * 1000}")
        return _PooledConnection(connection)
    except Exception:
        _connection_semaphore.release()
        raise
