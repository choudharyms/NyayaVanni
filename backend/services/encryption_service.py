import base64
import logging
import os
from typing import Tuple

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes

logger = logging.getLogger(__name__)

ENCRYPTION_ALGORITHM = 'AES-256-GCM'
NONCE_SIZE = 12
TAG_SIZE = 16
SALT_SIZE = 16
ITERATIONS = 100000


class EncryptionService:
    """Service for encrypting and decrypting document data using AES-256-GCM."""

    def __init__(self, master_key: str = None):
        self.master_key = master_key or os.getenv('DOCUMENT_ENCRYPTION_KEY')
        if not self.master_key:
            raise ValueError(
                "DOCUMENT_ENCRYPTION_KEY environment variable must be set for encryption"
            )

    def _derive_key(self, password: str, salt: bytes) -> bytes:
        """Derive a 256-bit key from password using PBKDF2."""
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=ITERATIONS,
            backend=default_backend()
        )
        return kdf.derive(password.encode())

    def encrypt_data(self, plaintext: bytes) -> str:
        """
        Encrypt data using AES-256-GCM.

        Returns a base64-encoded string containing: salt || nonce || ciphertext || tag
        """
        if not isinstance(plaintext, bytes):
            plaintext = plaintext.encode()

        salt = os.urandom(SALT_SIZE)
        nonce = os.urandom(NONCE_SIZE)

        key = self._derive_key(self.master_key, salt)
        cipher = AESGCM(key)

        ciphertext = cipher.encrypt(nonce, plaintext, None)

        encrypted_data = salt + nonce + ciphertext

        return base64.b64encode(encrypted_data).decode('utf-8')

    def decrypt_data(self, encrypted_string: str) -> bytes:
        """
        Decrypt data that was encrypted with encrypt_data.

        Expects base64-encoded string containing: salt || nonce || ciphertext || tag
        """
        try:
            encrypted_data = base64.b64decode(encrypted_string.encode('utf-8'))

            salt = encrypted_data[:SALT_SIZE]
            nonce = encrypted_data[SALT_SIZE:SALT_SIZE + NONCE_SIZE]
            ciphertext = encrypted_data[SALT_SIZE + NONCE_SIZE:]

            key = self._derive_key(self.master_key, salt)
            cipher = AESGCM(key)

            plaintext = cipher.decrypt(nonce, ciphertext, None)

            return plaintext
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise ValueError(f"Failed to decrypt data: {e}")

    def encrypt_file(self, file_path: str) -> str:
        """
        Encrypt a file and return encrypted content as base64 string.
        Original file is not modified.
        """
        try:
            with open(file_path, 'rb') as f:
                plaintext = f.read()

            return self.encrypt_data(plaintext)
        except Exception as e:
            logger.error(f"File encryption failed for {file_path}: {e}")
            raise

    def decrypt_file(self, encrypted_string: str, output_path: str) -> None:
        """
        Decrypt encrypted content and write to file.
        """
        try:
            plaintext = self.decrypt_data(encrypted_string)

            with open(output_path, 'wb') as f:
                f.write(plaintext)
        except Exception as e:
            logger.error(f"File decryption failed for {output_path}: {e}")
            raise


def get_encryption_service(master_key: str = None) -> EncryptionService:
    """Factory function to get an EncryptionService instance."""
    return EncryptionService(master_key)
