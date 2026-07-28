"""Password hashing service using bcrypt.

Provides secure password hashing and verification using bcrypt with
configurable work factor. Follows OWASP guidelines for password storage.
"""

import logging
import os
import secrets
from typing import Optional

import bcrypt

logger = logging.getLogger(__name__)

BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))


def hash_password(password: str) -> str:
    """Hash a password using bcrypt with configurable work factor.

    Args:
        password: Plain text password to hash.

    Returns:
        Bcrypt hash string including salt.

    Raises:
        ValueError: If password is empty or too short.
        RuntimeError: If hashing fails.
    """
    if not password:
        raise ValueError("Password cannot be empty")

    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")

    try:
        password_bytes = password.encode("utf-8")
        salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode("utf-8")
    except Exception as e:
        logger.error(f"Password hashing failed: {e}")
        raise RuntimeError("Failed to hash password")


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against a bcrypt hash.

    Args:
        password: Plain text password to verify.
        hashed_password: Bcrypt hash to verify against.

    Returns:
        True if password matches, False otherwise.
    """
    if not password or not hashed_password:
        return False

    try:
        password_bytes = password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        logger.error(f"Password verification failed: {e}")
        return False


def needs_rehash(hashed_password: str) -> bool:
    """Check if a password hash needs to be rehashed with a higher work factor.

    Args:
        hashed_password: The bcrypt hash to check.

    Returns:
        True if the hash should be updated, False otherwise.
    """
    if not hashed_password:
        return False

    try:
        hash_bytes = hashed_password.encode("utf-8")
        current_rounds = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
        return bcrypt.checkpw(hash_bytes, current_rounds) and len(hashed_password) < 60
    except Exception:
        return False


def generate_password(length: int = 16) -> str:
    """Generate a cryptographically secure random password.

    Args:
        length: Desired password length (minimum 12).

    Returns:
        Random password string.
    """
    length = max(length, 12)
    alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    password = "".join(secrets.choice(alphabet) for _ in range(length))

    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*" for c in password)

    if not (has_upper and has_lower and has_digit and has_special):
        return generate_password(length)

    return password
