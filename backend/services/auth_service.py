import hashlib
import logging
import os
import secrets
import smtplib
import sqlite3
from datetime import datetime, timezone
from email.mime.text import MIMEText
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
                email_verified INTEGER NOT NULL DEFAULT 0,
                verification_token TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        cursor.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_users_email
            ON {USERS_TABLE}(email)
        """)
        cursor.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_users_verification_token
            ON {USERS_TABLE}(verification_token)
        """)
        # Migrate existing tables: add email_verified and verification_token if missing
        cursor.execute(f"PRAGMA table_info({USERS_TABLE})")
        existing_cols = {row[1] for row in cursor.fetchall()}
        if "email_verified" not in existing_cols:
            cursor.execute(f"ALTER TABLE {USERS_TABLE} ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0")
        if "verification_token" not in existing_cols:
            cursor.execute(f"ALTER TABLE {USERS_TABLE} ADD COLUMN verification_token TEXT")
        if "avatar_url" not in existing_cols:
            cursor.execute(f"ALTER TABLE {USERS_TABLE} ADD COLUMN avatar_url TEXT")
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


def _generate_verification_token() -> str:
    return secrets.token_urlsafe(48)


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
        verification_token = _generate_verification_token()

        cursor.execute(
            f"""
            INSERT INTO {USERS_TABLE}
            (user_id, email, password_hash, display_name, role, must_reset_password, is_active, email_verified, verification_token, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, email, password_hash, display_name, "user", must_reset, 1, 0, verification_token, now_iso, now_iso),
        )
        conn.commit()

        logger.info(f"User registered: {email} (user_id={user_id})")
        return {
            "user_id": user_id,
            "email": email,
            "display_name": display_name,
            "must_reset_password": bool(must_reset),
            "email_verified": False,
            "verification_token": verification_token,
        }
    except Exception as e:
        logger.error(f"User registration failed: {e}")
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()


def verify_email(token: str) -> bool:
    """Mark a user's email as verified using the provided token."""
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT user_id FROM {USERS_TABLE} WHERE verification_token = ? AND email_verified = 0",
            (token,),
        )
        row = cursor.fetchone()
        if not row:
            return False
        cursor.execute(
            f"UPDATE {USERS_TABLE} SET email_verified = 1, verification_token = NULL, updated_at = ? WHERE user_id = ?",
            (datetime.now(timezone.utc).isoformat(), row[0]),
        )
        conn.commit()
        logger.info(f"Email verified for user {row[0]}")
        return True
    except Exception as e:
        logger.error(f"Email verification failed: {e}")
        if conn:
            conn.rollback()
        return False
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

        if not user.get("email_verified"):
            logger.warning(f"Login denied: email not verified for user {user['user_id']}")
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
            "avatar_url": user.get("avatar_url"),
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
            f"SELECT user_id, email, display_name, role, must_reset_password, is_active, avatar_url FROM {USERS_TABLE} WHERE user_id = ?",
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


def update_avatar_url(user_id: str, avatar_url: str) -> bool:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE {USERS_TABLE} SET avatar_url = ?, updated_at = ? WHERE user_id = ?",
            (avatar_url, datetime.now(timezone.utc).isoformat(), user_id),
        )
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"Failed to update avatar URL for user {user_id}: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()


def send_verification_email(email: str, token: str) -> None:
    """Send email verification link. Logs to console by default; uses SMTP if configured."""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    verify_url = f"{frontend_url}/verify-email?token={token}"
    subject = "Verify your NyayaVanni account"
    body = (
        f"Welcome to NyayaVanni!\n\n"
        f"Please verify your email address by clicking the link below:\n\n"
        f"{verify_url}\n\n"
        f"This link will expire in 24 hours.\n\n"
        f"If you did not create this account, please ignore this email."
    )
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    if smtp_host and smtp_user and smtp_pass:
        try:
            msg = MIMEText(body)
            msg["Subject"] = subject
            msg["From"] = smtp_user
            msg["To"] = email
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            logger.info(f"Verification email sent to {email}")
            return
        except Exception as e:
            logger.error(f"Failed to send verification email to {email}: {e}")
    logger.info(f"Verification email (log only) to {email}: {verify_url}")


def user_requires_password_reset(user_id: str) -> bool:
    user = get_user_by_id(user_id)
    return bool(user and user.get("must_reset_password"))


init_users_table()
