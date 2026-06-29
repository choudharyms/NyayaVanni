"""Transparent at-rest encryption for uploaded legal documents.

Uses Fernet (AES-128-CBC + HMAC) with a per-document derived key so that
compromise of one document's key material does not expose every other
document encrypted under the same master key. The master key is read once
from the DOCUMENT_ENCRYPTION_KEY environment variable and never persisted
alongside the ciphertext.
"""

import base64
import hashlib
import hmac
import logging
import os

from cryptography.fernet import Fernet, InvalidToken

logger = logging.getLogger(__name__)

_MASTER_KEY_ENV_VAR = "DOCUMENT_ENCRYPTION_KEY"


class EncryptionNotConfiguredError(RuntimeError):
    """Raised when DOCUMENT_ENCRYPTION_KEY is missing or malformed."""


def _get_master_key() -> bytes:
    raw_key = os.environ.get(_MASTER_KEY_ENV_VAR)
    if not raw_key:
        raise EncryptionNotConfiguredError(
            f"{_MASTER_KEY_ENV_VAR} is not set. Generate one with "
            "Fernet.generate_key() and store it in your environment."
        )
    try:
        # Validate the key is well-formed base64 Fernet key material.
        Fernet(raw_key.encode())
    except Exception as exc:
        raise EncryptionNotConfiguredError(
            f"{_MASTER_KEY_ENV_VAR} is not a valid Fernet key."
        ) from exc
    return raw_key.encode()


def _derive_document_key(document_id: str) -> bytes:
    """Derive a per-document Fernet key from the master key and document UUID.

    Using the document ID as salt means each document is encrypted under a
    distinct key, so a leaked key only ever decrypts a single file.
    """
    master_key = _get_master_key()
    digest = hmac.new(
        master_key, document_id.encode("utf-8"), hashlib.sha256
    ).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_document(file_bytes: bytes, document_id: str) -> bytes:
    """Encrypt raw file bytes for storage. Returns ciphertext to write to disk."""
    fernet = Fernet(_derive_document_key(document_id))
    return fernet.encrypt(file_bytes)


def decrypt_document(ciphertext: bytes, document_id: str) -> bytes:
    """Decrypt ciphertext previously produced by encrypt_document.

    Raises InvalidToken if the ciphertext is corrupted, was encrypted under
    a different document_id, or the master key has changed.
    """
    fernet = Fernet(_derive_document_key(document_id))
    try:
        return fernet.decrypt(ciphertext)
    except InvalidToken:
        logger.error(
            "Failed to decrypt document %s: invalid token or key mismatch",
            document_id,
        )
        raise


def is_encryption_configured() -> bool:
    """Check whether DOCUMENT_ENCRYPTION_KEY is set without raising."""
    try:
        _get_master_key()
        return True
    except EncryptionNotConfiguredError:
        return False
