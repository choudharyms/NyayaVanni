import hashlib
import logging
import os
import secrets
import sqlite3
from datetime import datetime, timezone
from typing import Any, Optional

from .database import connect_db

STORAGE_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "nyayavanni.db")

logger = logging.getLogger(__name__)

USERS_TABLE = "users"


def init_users_table() -> None:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {USERS_TABLE} (
                user_id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                display_name TEXT,
                role TEXT NOT NULL DEFAULT 'user',
                must_reset_password INTEGER NOT NULL DEFAULT 0,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        cursor.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_users_email
            ON {USERS_TABLE}(email)
        """)
        conn.commit()
        logger.info("Users table initialized")
    except Exception as e:
        logger.error(f"Failed to initialize users table: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


def _hash_password(password: str) -> str:
    salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return salt.hex() + ":" + key.hex()


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, key_hex = stored_hash.split(":")
        salt = bytes.fromhex(salt_hex)
        stored_key = bytes.fromhex(key_hex)
        new_key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
        return new_key == stored_key
    except (ValueError, AttributeError):
        return False


def register_user(
    email: str,
    password: str,
    display_name: Optional[str] = None,
    is_default_password: bool = False,
) -> Optional[dict[str, Any]]:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()

        cursor.execute(f"SELECT user_id FROM {USERS_TABLE} WHERE email = ?", (email,))
        if cursor.fetchone():
            logger.warning(f"Registration failed: email {email} already exists")
            return None

        user_id = "usr_" + secrets.token_hex(16)
        password_hash = _hash_password(password)
        now_iso = datetime.now(timezone.utc).isoformat()
        must_reset = 1 if is_default_password else 0

        cursor.execute(
            f"""
            INSERT INTO {USERS_TABLE}
            (user_id, email, password_hash, display_name, role, must_reset_password, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, email, password_hash, display_name, "user", must_reset, 1, now_iso, now_iso),
        )
        conn.commit()

        logger.info(f"User registered: {email} (user_id={user_id})")
        return {
            "user_id": user_id,
            "email": email,
            "display_name": display_name,
            "must_reset_password": bool(must_reset),
        }
    except Exception as e:
        logger.error(f"User registration failed: {e}")
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()


def authenticate_user(email: str, password: str) -> Optional[dict[str, Any]]:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(
            f"SELECT * FROM {USERS_TABLE} WHERE email = ? AND is_active = 1",
            (email,),
        )
        row = cursor.fetchone()
        if not row:
            return None

        user = dict(row)
        if not _verify_password(password, user["password_hash"]):
            return None

        now_iso = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            f"UPDATE {USERS_TABLE} SET updated_at = ? WHERE user_id = ?",
            (now_iso, user["user_id"]),
        )
        conn.commit()

        return {
            "user_id": user["user_id"],
            "email": user["email"],
            "display_name": user["display_name"],
            "role": user["role"],
            "must_reset_password": bool(user["must_reset_password"]),
            "is_active": bool(user["is_active"]),
        }
    except Exception as e:
        logger.error(f"Authentication failed: {e}")
        return None
    finally:
        if conn:
            conn.close()


def change_password(
    user_id: str, current_password: str, new_password: str
) -> tuple[bool, str]:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(
            f"SELECT * FROM {USERS_TABLE} WHERE user_id = ? AND is_active = 1",
            (user_id,),
        )
        row = cursor.fetchone()
        if not row:
            return False, "User not found"

        user = dict(row)
        if not _verify_password(current_password, user["password_hash"]):
            return False, "Current password is incorrect"

        new_hash = _hash_password(new_password)
        now_iso = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            f"UPDATE {USERS_TABLE} SET password_hash = ?, must_reset_password = 0, updated_at = ? WHERE user_id = ?",
            (new_hash, now_iso, user_id),
        )
        conn.commit()
        logger.info(f"Password changed for user {user_id}")
        return True, "Password changed successfully"
    except Exception as e:
        logger.error(f"Password change failed for user {user_id}: {e}")
        if conn:
            conn.rollback()
        return False, "An internal error occurred"
    finally:
        if conn:
            conn.close()


def force_reset_password(user_id: str, new_password: str) -> tuple[bool, str]:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()

        new_hash = _hash_password(new_password)
        now_iso = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            f"UPDATE {USERS_TABLE} SET password_hash = ?, must_reset_password = 0, updated_at = ? WHERE user_id = ?",
            (new_hash, now_iso, user_id),
        )
        conn.commit()
        logger.info(f"Password force-reset for user {user_id}")
        return True, "Password reset successfully"
    except Exception as e:
        logger.error(f"Force password reset failed for user {user_id}: {e}")
        if conn:
            conn.rollback()
        return False, "An internal error occurred"
    finally:
        if conn:
            conn.close()


def get_user_by_id(user_id: str) -> Optional[dict[str, Any]]:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT user_id, email, display_name, role, must_reset_password, is_active FROM {USERS_TABLE} WHERE user_id = ?",
            (user_id,),
        )
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception as e:
        logger.error(f"Failed to get user {user_id}: {e}")
        return None
    finally:
        if conn:
            conn.close()


def user_requires_password_reset(user_id: str) -> bool:
    user = get_user_by_id(user_id)
    return bool(user and user.get("must_reset_password"))


init_users_table()
