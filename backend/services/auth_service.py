"""Authentication service for JWT/SSO token validation.

Provides token creation, validation, and verification for single sign-on (SSO)
authentication. Supports both JWT tokens and opaque session tokens.
"""

import hashlib
import hmac
import json
import logging
import os
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Optional

logger = logging.getLogger(__name__)

JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "24"))
SSO_TOKEN_LENGTH = 64


def _base64url_encode(data: bytes) -> str:
    """Encode bytes to URL-safe base64."""
    import base64
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64url_decode(data: str) -> bytes:
    """Decode URL-safe base64 to bytes."""
    import base64
    padding = 4 - len(data) % 4
    data += "=" * padding
    return base64.urlsafe_b64decode(data)


def _sign_message(message: str) -> str:
    """Create HMAC-SHA256 signature for a message."""
    signature = hmac.new(
        JWT_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return _base64url_encode(signature)


def create_jwt_token(
    user_id: str,
    email: str,
    roles: Optional[list] = None,
    extra_claims: Optional[dict] = None,
) -> str:
    """Create a JWT token for SSO authentication.

    Args:
        user_id: Unique user identifier.
        email: User's email address.
        roles: List of user roles (default: ["user"]).
        extra_claims: Additional claims to include in the token.

    Returns:
        Signed JWT token string.
    """
    now = datetime.now(timezone.utc)
    exp = now + timedelta(hours=JWT_EXPIRY_HOURS)

    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}

    payload = {
        "sub": user_id,
        "email": email,
        "roles": roles or ["user"],
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "iss": "nyayavanni",
        "jti": secrets.token_hex(16),
    }

    if extra_claims:
        payload.update(extra_claims)

    header_b64 = _base64url_encode(json.dumps(header).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(payload).encode("utf-8"))

    signing_input = f"{header_b64}.{payload_b64}"
    signature = _sign_message(signing_input)

    return f"{header_b64}.{payload_b64}.{signature}"


def validate_jwt_token(token: str) -> Optional[dict]:
    """Validate a JWT token and return its payload.

    Args:
        token: The JWT token string to validate.

    Returns:
        Token payload dict if valid, None if invalid or expired.
    """
    if not token or not isinstance(token, str):
        return None

    parts = token.split(".")
    if len(parts) != 3:
        return None

    header_b64, payload_b64, signature = parts

    signing_input = f"{header_b64}.{payload_b64}"
    expected_signature = _sign_message(signing_input)

    if not hmac.compare_digest(signature, expected_signature):
        logger.warning("JWT signature verification failed")
        return None

    try:
        payload_bytes = _base64url_decode(payload_b64)
        payload = json.loads(payload_bytes)
    except Exception as e:
        logger.warning(f"Failed to decode JWT payload: {e}")
        return None

    now = int(time.time())
    if "exp" in payload and payload["exp"] < now:
        logger.warning("JWT token has expired")
        return None

    if "iat" in payload and payload["iat"] > now + 300:
        logger.warning("JWT token issued in the future")
        return None

    if payload.get("iss") != "nyayavanni":
        logger.warning("JWT token has invalid issuer")
        return None

    return payload


def create_sso_token(user_id: str, email: str) -> str:
    """Create an opaque SSO token.

    Args:
        user_id: Unique user identifier.
        email: User's email address.

    Returns:
        Opaque SSO token string.
    """
    token = secrets.token_hex(SSO_TOKEN_LENGTH // 2)
    _sso_token_store[token] = {
        "user_id": user_id,
        "email": email,
        "created_at": time.time(),
        "expires_at": time.time() + (JWT_EXPIRY_HOURS * 3600),
    }
    return token


_sso_token_store: dict = {}


def validate_sso_token(token: str) -> Optional[dict]:
    """Validate an opaque SSO token.

    Args:
        token: The SSO token string to validate.

    Returns:
        Token data dict if valid, None if invalid or expired.
    """
    if not token or not isinstance(token, str):
        return None

    data = _sso_token_store.get(token)
    if not data:
        return None

    if time.time() > data["expires_at"]:
        del _sso_token_store[token]
        return None

    return data


def revoke_sso_token(token: str) -> bool:
    """Revoke an SSO token.

    Args:
        token: The SSO token to revoke.

    Returns:
        True if revoked, False if not found.
    """
    if token in _sso_token_store:
        del _sso_token_store[token]
        return True
    return False


def validate_auth_token(token: str) -> Optional[dict]:
    """Validate either a JWT or SSO token.

    Args:
        token: The authentication token to validate.

    Returns:
        Token payload if valid, None otherwise.
    """
    if not token:
        return None

    if "." in token and len(token.split(".")) == 3:
        return validate_jwt_token(token)

    return validate_sso_token(token)
