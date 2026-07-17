import hashlib
import logging
import os
import re
import secrets
import smtplib
import sqlite3
import threading
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from typing import Any, Optional

import bcrypt

from .database import connect_db

STORAGE_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "nyayavanni.db")

_email_rate_limit_store = defaultdict(list)
_EMAIL_RATE_LIMIT_MAX = 5
_EMAIL_RATE_LIMIT_WINDOW = 3600


def _check_email_rate_limit(email: str) -> bool:
    now = time.time()
    timestamps = _email_rate_limit_store[email]
    cutoff = now - _EMAIL_RATE_LIMIT_WINDOW
    active = [t for t in timestamps if t > cutoff]
    _email_rate_limit_store[email] = active
    if len(active) >= _EMAIL_RATE_LIMIT_MAX:
        return False
    _email_rate_limit_store[email].append(now)
    return True

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
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
    except (ValueError, AttributeError):
        return False


def _generate_verification_token() -> str:
    return secrets.token_urlsafe(48)


PASSWORD_POLICY_ERRORS = {
    "min_length": "Password must be at least 8 characters long",
    "max_length": "Password must be at most 128 characters long",
    "uppercase": "Password must contain at least one uppercase letter",
    "digit": "Password must contain at least one digit",
    "special": "Password must contain at least one special character (@$!%*#?&)",
}


def validate_password_strength(password: str) -> Optional[str]:
    if len(password) < 8:
        return PASSWORD_POLICY_ERRORS["min_length"]
    if len(password) > 128:
        return PASSWORD_POLICY_ERRORS["max_length"]
    if not re.search(r"[A-Z]", password):
        return PASSWORD_POLICY_ERRORS["uppercase"]
    if not re.search(r"\d", password):
        return PASSWORD_POLICY_ERRORS["digit"]
    if not re.search(r"[@$!%*#?&]", password):
        return PASSWORD_POLICY_ERRORS["special"]
    return None


def register_user(
    email: str,
    password: str,
    display_name: Optional[str] = None,
    is_default_password: bool = False,
) -> Optional[dict[str, Any]]:
    validation_error = validate_password_strength(password)
    if validation_error:
        logger.warning(f"Registration failed: weak password for {email}")
        return None
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


def authenticate_user(email: str, password: str, ip_address: str = "") -> Optional[dict[str, Any]]:
    is_locked, remaining = is_account_locked(email)
    if is_locked:
        logger.warning(f"Login denied: account locked for {email}")
        return None

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
            record_failed_login(email, ip_address="")
            return None

        user = dict(row)
        if not _verify_password(password, user["password_hash"]):
            record_failed_login(email, ip_address="")
            return None

        if not user.get("email_verified"):
            logger.warning(f"Login denied: email not verified for user {user['user_id']}")
            record_failed_login(email, ip_address="")
            return None

        clear_login_attempts(email)

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
    lock = _get_password_change_lock(user_id)
    acquired = lock.acquire(timeout=10)
    if not acquired:
        logger.warning("Password change timed out waiting for lock for user %s", user_id)
        return False, "A password change is already in progress. Please try again."
    try:
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

            if _verify_password(new_password, user["password_hash"]):
                return False, "New password must be different from the current password"

            new_hash = _hash_password(new_password)
            now_iso = datetime.now(timezone.utc).isoformat()
            cursor.execute(
                f"UPDATE {USERS_TABLE} SET password_hash = ?, must_reset_password = 0, updated_at = ? WHERE user_id = ?",
                (new_hash, now_iso, user_id),
            )
            conn.commit()
            _invalidate_user_cache(user_id)
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
    finally:
        lock.release()


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
        _invalidate_user_cache(user_id)
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


_password_change_locks: dict[str, threading.Lock] = {}
_password_change_locks_lock = threading.Lock()


def _get_password_change_lock(user_id: str) -> threading.Lock:
    with _password_change_locks_lock:
        if user_id not in _password_change_locks:
            _password_change_locks[user_id] = threading.Lock()
        return _password_change_locks[user_id]


_SENSITIVE_FIELDS = {"password_hash", "verification_token"}


def _strip_sensitive_fields(user: dict) -> dict:
    return {k: v for k, v in user.items() if k not in _SENSITIVE_FIELDS}


_user_cache: dict[str, dict[str, Any]] = {}


def _invalidate_user_cache(user_id: str) -> None:
    _user_cache.pop(user_id, None)


_PUBLIC_PROFILE_FIELDS = {"created_at", "updated_at"}


def get_user_by_id(user_id: str, public: bool = False) -> Optional[dict[str, Any]]:
    cached = _user_cache.get(user_id)
    if cached is not None:
        result = cached
        if public:
            return {k: v for k, v in result.items() if k not in _PUBLIC_PROFILE_FIELDS}
        return result
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT user_id, email, display_name, role, must_reset_password, is_active, avatar_url, created_at FROM {USERS_TABLE} WHERE user_id = ?",
            (user_id,),
        )
        row = cursor.fetchone()
        result = dict(row) if row else None
        if result is not None:
            result = _strip_sensitive_fields(result)
            _user_cache[user_id] = result
        if public and result is not None:
            return {k: v for k, v in result.items() if k not in _PUBLIC_PROFILE_FIELDS}
        return result
    except Exception as e:
        logger.error(f"Failed to get user {user_id}: {e}")
        return None
    finally:
        if conn:
            conn.close()


def update_user_profile(user_id: str, display_name: str = "") -> bool:
    """Update the user's display name."""
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE {USERS_TABLE} SET display_name = ?, updated_at = ? WHERE user_id = ?",
            (display_name, datetime.now(timezone.utc).isoformat(), user_id),
        )
        conn.commit()
        _invalidate_user_cache(user_id)
        return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"Failed to update user profile for {user_id}: {e}")
        if conn:
            conn.rollback()
        return False
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
        _invalidate_user_cache(user_id)
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
    """Send email verification link. Logs to console by default; uses SMTP if configured.

    Rate-limited to 5 emails per hour per user address.
    """
    if not _check_email_rate_limit(email):
        logger.warning("Email rate limit exceeded for %s", email)
        return
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


# ---------------------------------------------------------------------------
# Password reset tokens (secure, email-based flow)
# ---------------------------------------------------------------------------

PASSWORD_RESET_TOKENS_TABLE = "password_reset_tokens"


def init_password_reset_tokens_table() -> None:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {PASSWORD_RESET_TOKENS_TABLE} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                token TEXT NOT NULL UNIQUE,
                expires_at TEXT NOT NULL,
                used INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES {USERS_TABLE}(user_id)
            )
        """)
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to initialize password reset tokens table: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


init_password_reset_tokens_table()


def request_password_reset(email: str) -> Optional[str]:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT user_id FROM {USERS_TABLE} WHERE email = ? AND is_active = 1",
            (email,),
        )
        row = cursor.fetchone()
        if not row:
            return None

        user_id = row[0]
        token = secrets.token_urlsafe(48)
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(hours=1)

        cursor.execute(
            f"INSERT INTO {PASSWORD_RESET_TOKENS_TABLE} (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)",
            (user_id, token, expires_at.isoformat(), now.isoformat()),
        )
        conn.commit()
        return token
    except Exception as e:
        logger.error(f"Failed to create password reset token: {e}")
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()


def reset_password_with_token(token: str, new_password: str) -> tuple[bool, str]:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT id, user_id, expires_at FROM {PASSWORD_RESET_TOKENS_TABLE} WHERE token = ? AND used = 0",
            (token,),
        )
        row = cursor.fetchone()
        if not row:
            return False, "Invalid or expired reset token"
        token_id, user_id, expires_at_str = row
        expires_at = datetime.fromisoformat(expires_at_str)
        if expires_at < datetime.now(timezone.utc):
            return False, "Reset token has expired"
        new_hash = _hash_password(new_password)
        now_iso = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            f"UPDATE {USERS_TABLE} SET password_hash = ?, must_reset_password = 0, updated_at = ? WHERE user_id = ?",
            (new_hash, now_iso, user_id),
        )
        cursor.execute(
            f"UPDATE {PASSWORD_RESET_TOKENS_TABLE} SET used = 1 WHERE id = ?",
            (token_id,),
        )
        conn.commit()
        _invalidate_user_cache(user_id)
        logger.info(f"Password reset via token for user {user_id}")
        return True, "Password reset successfully"
    except Exception as e:
        logger.error(f"Password reset with token failed: {e}")
        if conn:
            conn.rollback()
        return False, "An internal error occurred"
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# 2FA verification (rate-limited)
# ---------------------------------------------------------------------------

TWO_FA_TABLE = "two_factor_codes"


def init_two_factor_table() -> None:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {TWO_FA_TABLE} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                code TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                used INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES {USERS_TABLE}(user_id)
            )
        """)
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to initialize 2FA table: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


def request_2fa_code(user_id: str) -> Optional[str]:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()
        code = str(secrets.randbelow(900000) + 100000)
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=10)
        cursor.execute(
            f"INSERT INTO {TWO_FA_TABLE} (user_id, code, expires_at, created_at) VALUES (?, ?, ?, ?)",
            (user_id, code, expires_at.isoformat(), now.isoformat()),
        )
        conn.commit()
        return code
    except Exception as e:
        logger.error(f"Failed to create 2FA code for user {user_id}: {e}")
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()


def verify_2fa_code(user_id: str, code: str) -> bool:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT id, code, expires_at, used FROM {TWO_FA_TABLE} WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
            (user_id,),
        )
        row = cursor.fetchone()
        if not row:
            return False
        record_id, stored_code, expires_at_str, used = row
        if used:
            return False
        expires_at = datetime.fromisoformat(expires_at_str)
        if expires_at < datetime.now(timezone.utc):
            return False
        if stored_code != code:
            return False
        cursor.execute(
            f"UPDATE {TWO_FA_TABLE} SET used = 1 WHERE id = ?",
            (record_id,),
        )
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"2FA verification failed for user {user_id}: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# Account lockout after failed login attempts
# ---------------------------------------------------------------------------

LOGIN_ATTEMPTS_TABLE = "login_attempts"
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15


def init_login_attempts_table() -> None:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {LOGIN_ATTEMPTS_TABLE} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                attempted_at TEXT NOT NULL,
                ip_address TEXT
            )
        """)
        cursor.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_login_attempts_email
            ON {LOGIN_ATTEMPTS_TABLE}(email)
        """)
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to initialize login attempts table: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


def record_failed_login(email: str, ip_address: str = "") -> None:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()
        now_iso = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            f"INSERT INTO {LOGIN_ATTEMPTS_TABLE} (email, attempted_at, ip_address) VALUES (?, ?, ?)",
            (email, now_iso, ip_address),
        )
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to record login attempt: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


def clear_login_attempts(email: str) -> None:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            f"DELETE FROM {LOGIN_ATTEMPTS_TABLE} WHERE email = ?",
            (email,),
        )
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to clear login attempts: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


def is_account_locked(email: str) -> tuple[bool, Optional[int]]:
    """Check if account is locked due to too many failed attempts.
    
    Returns:
        tuple[bool, Optional[int]]: (is_locked, remaining_seconds)
    """
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()
        lockout_threshold = (
            datetime.now(timezone.utc) - timedelta(minutes=LOCKOUT_DURATION_MINUTES)
        ).isoformat()
        cursor.execute(
            f"SELECT COUNT(*) FROM {LOGIN_ATTEMPTS_TABLE} WHERE email = ? AND attempted_at > ?",
            (email, lockout_threshold),
        )
        count = cursor.fetchone()[0]
        if count >= MAX_FAILED_ATTEMPTS:
            cursor.execute(
                f"SELECT MAX(attempted_at) FROM {LOGIN_ATTEMPTS_TABLE} WHERE email = ? AND attempted_at > ?",
                (email, lockout_threshold),
            )
            last_attempt = cursor.fetchone()[0]
            if last_attempt:
                lockout_end = datetime.fromisoformat(last_attempt) + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
                remaining = int((lockout_end - datetime.now(timezone.utc)).total_seconds())
                return True, max(remaining, 0)
            return True, LOCKOUT_DURATION_MINUTES * 60
        return False, None
    except Exception as e:
        logger.error(f"Failed to check account lockout: {e}")
        return False, None
    finally:
        if conn:
            conn.close()


DEFAULT_ADMIN_EMAIL = "admin@nyayavanni.com"
DEFAULT_ADMIN_PASSWORD = "admin123"


def list_users(limit: int = 20, offset: int = 0) -> tuple[list[dict], int]:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(f"SELECT COUNT(*) FROM {USERS_TABLE}")
        total = cursor.fetchone()[0]

        cursor.execute(
            f"SELECT user_id, email, display_name, role, must_reset_password, is_active, email_verified, avatar_url, created_at, updated_at FROM {USERS_TABLE} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        )
        rows = cursor.fetchall()
        users = [_strip_sensitive_fields(dict(r)) for r in rows]
        return users, total
    except Exception as e:
        logger.error(f"Failed to list users: {e}")
        return [], 0
    finally:
        if conn:
            conn.close()


def seed_default_admin() -> None:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT user_id FROM {USERS_TABLE} WHERE email = ?",
            (DEFAULT_ADMIN_EMAIL,),
        )
        if cursor.fetchone():
            return
        user_id = "usr_" + secrets.token_hex(16)
        password_hash = _hash_password(DEFAULT_ADMIN_PASSWORD)
        now_iso = datetime.now(timezone.utc).isoformat()
        verification_token = _generate_verification_token()
        cursor.execute(
            f"""
            INSERT INTO {USERS_TABLE}
            (user_id, email, password_hash, display_name, role, must_reset_password, is_active, email_verified, verification_token, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, DEFAULT_ADMIN_EMAIL, password_hash, "Admin", "admin", 1, 1, 1, verification_token, now_iso, now_iso),
        )
        conn.commit()
        logger.info("Default admin seeded with must_reset_password=1")
    except Exception as e:
        logger.error(f"Failed to seed default admin: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


def delete_user_account(user_id: str) -> tuple[bool, str]:
    """Delete a user account and all associated data.

    Cleans up documents, analysis cache, sessions, search index,
    audit logs, and auth-related records.

    Returns:
        tuple[bool, str]: (success, message)
    """
    from .audit_log_service import AUDIT_LOG_TABLE
    from .storage_service import UPLOAD_DIR

    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()

        cursor.execute(
            f"SELECT email FROM {USERS_TABLE} WHERE user_id = ?",
            (user_id,),
        )
        row = cursor.fetchone()
        if not row:
            return False, "User not found"

        email = row[0]

        # Find sessions for this user to clean up documents
        cursor.execute("SELECT session_id FROM sessions WHERE user_id = ?", (user_id,))
        session_ids = [r[0] for r in cursor.fetchall()]

        # Clean up documents, analysis cache, and local files for each session
        for sid in session_ids:
            cursor.execute(
                "SELECT document_id, local_path FROM documents WHERE session_id = ?",
                (sid,),
            )
            docs = cursor.fetchall()
            for doc_id, local_path in docs:
                if local_path and os.path.exists(local_path):
                    try:
                        os.remove(local_path)
                    except OSError as exc:
                        logger.warning(
                            "Failed to delete file %s during account deletion: %s",
                            local_path, exc,
                        )
                # Remove from FTS search index
                try:
                    cursor.execute(
                        "DELETE FROM documents_fts WHERE document_id = ?",
                        (doc_id,),
                    )
                except Exception:
                    pass

            cursor.execute(
                "DELETE FROM document_analysis_cache WHERE session_id = ?",
                (sid,),
            )
            cursor.execute("DELETE FROM documents WHERE session_id = ?", (sid,))

        # Delete all sessions for this user
        cursor.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))

        # Clean up audit log records associated with this user
        cursor.execute(
            f"DELETE FROM {AUDIT_LOG_TABLE} WHERE resource_type = 'user' AND resource_id = ?",
            (user_id,),
        )

        # Delete auth-related records
        cursor.execute(
            f"DELETE FROM {PASSWORD_RESET_TOKENS_TABLE} WHERE user_id = ?",
            (user_id,),
        )
        cursor.execute(
            f"DELETE FROM {TWO_FA_TABLE} WHERE user_id = ?",
            (user_id,),
        )
        cursor.execute(f"DELETE FROM {USERS_TABLE} WHERE user_id = ?", (user_id,))

        conn.commit()
        _invalidate_user_cache(user_id)
        logger.info(f"User account deleted: {user_id} (email={email})")
        return True, "Account deleted successfully"
    except Exception as e:
        logger.error(f"Failed to delete user account {user_id}: {e}")
        if conn:
            conn.rollback()
        return False, "An internal error occurred"
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# SSO token validation
# ---------------------------------------------------------------------------

SSO_TOKENS_TABLE = "sso_tokens"


def init_sso_tokens_table() -> None:
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {SSO_TOKENS_TABLE} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token_hash TEXT NOT NULL UNIQUE,
                user_id TEXT,
                email TEXT NOT NULL,
                provider TEXT NOT NULL,
                issued_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                used INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)
        cursor.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_sso_tokens_token_hash
            ON {SSO_TOKENS_TABLE}(token_hash)
        """)
        conn.commit()
        logger.info("SSO tokens table initialized")
    except Exception as e:
        logger.error(f"Failed to initialize SSO tokens table: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


def validate_sso_token(token: str, provider: str = "") -> Optional[dict[str, Any]]:
    """Validate an SSO token by checking signature (hash) and expiry.

    Args:
        token: The SSO token string.
        provider: Optional provider name to filter by.

    Returns:
        dict with user info if valid, None otherwise.
    """
    if not token or not token.strip():
        return None

    token_hash = hashlib.sha256(token.encode()).hexdigest()
    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        conditions = ["token_hash = ?", "used = 0"]
        params = [token_hash]
        if provider:
            conditions.append("provider = ?")
            params.append(provider)

        where = " AND ".join(conditions)
        cursor.execute(
            f"SELECT * FROM {SSO_TOKENS_TABLE} WHERE {where}",
            params,
        )
        row = cursor.fetchone()
        if not row:
            logger.warning("SSO token not found or already used")
            return None

        record = dict(row)
        expires_at = datetime.fromisoformat(record["expires_at"])
        if expires_at < datetime.now(timezone.utc):
            logger.warning("SSO token expired")
            return None

        # Mark token as used (one-time use)
        cursor.execute(
            f"UPDATE {SSO_TOKENS_TABLE} SET used = 1 WHERE id = ?",
            (record["id"],),
        )
        conn.commit()

        return {
            "user_id": record.get("user_id"),
            "email": record["email"],
            "provider": record["provider"],
        }
    except Exception as e:
        logger.error(f"SSO token validation failed: {e}")
        return None
    finally:
        if conn:
            conn.close()


def create_sso_token(email: str, provider: str, user_id: Optional[str] = None) -> Optional[str]:
    """Create a new SSO token with expiry.

    Args:
        email: User email.
        provider: SSO provider name (e.g. 'google', 'github').
        user_id: Optional user ID.

    Returns:
        str: The raw token (hash stored in DB).
    """
    token = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=1)

    conn = None
    try:
        conn = connect_db(STORAGE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            f"""
            INSERT INTO {SSO_TOKENS_TABLE}
            (token_hash, user_id, email, provider, issued_at, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (token_hash, user_id, email, provider, now.isoformat(), expires_at.isoformat(), now.isoformat()),
        )
        conn.commit()
        return token
    except Exception as e:
        logger.error(f"Failed to create SSO token: {e}")
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()


init_sso_tokens_table()
init_two_factor_table()
init_users_table()
init_login_attempts_table()
seed_default_admin()
