"""
backend/api/file_validator.py

Centralised upload-validation logic for NyayaVanni.

Enforces:
  - Allowed MIME types (declared + sniffed from magic bytes)
  - Maximum file size
  - Magic-byte verification so a renamed .exe cannot pass as application/pdf

Usage (in routes.py):
    from api.file_validator import validate_upload
    ...
    await validate_upload(file)          # raises HTTPException on failure
"""

import io
from typing import Final

from fastapi import HTTPException, UploadFile, status

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

#: Maximum accepted upload size in bytes (10 MB).
MAX_FILE_SIZE_BYTES: Final[int] = 10 * 1024 * 1024  # 10 MB

#: Accepted MIME types reported by the client.
ALLOWED_MIME_TYPES: Final[frozenset[str]] = frozenset(
    {
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
    }
)

#: Magic-byte signatures mapped to their canonical MIME type.
#: Each entry is (byte_offset, signature_bytes, mime_type).
_MAGIC_SIGNATURES: Final[list[tuple[int, bytes, str]]] = [
    (0, b"%PDF",       "application/pdf"),
    (0, b"\x89PNG\r\n\x1a\n", "image/png"),
    (0, b"\xff\xd8\xff",      "image/jpeg"),  # JPEG / JFIF / EXIF
]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def validate_upload(file: UploadFile) -> bytes:
    """
    Read *file* completely, then validate size, declared MIME type, and
    magic bytes.  Returns the raw file content so the caller does not have
    to seek/re-read.

    Raises:
        HTTPException 415  – unsupported / mismatched MIME type
        HTTPException 413  – payload too large
    """
    content: bytes = await file.read()

    _check_size(content)
    _check_declared_mime(file.content_type)
    _check_magic_bytes(content, file.content_type, file.filename or "")

    # Reset stream so downstream code can still call file.read() if needed.
    file.file = io.BytesIO(content)

    return content


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _check_size(content: bytes) -> None:
    size = len(content)
    if size > MAX_FILE_SIZE_BYTES:
        limit_mb = MAX_FILE_SIZE_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"File is too large ({size / (1024 * 1024):.1f} MB). "
                f"Maximum allowed size is {limit_mb} MB."
            ),
        )


def _check_declared_mime(content_type: str | None) -> None:
    # Normalise: strip parameters like "; charset=utf-8"
    mime = (content_type or "").split(";")[0].strip().lower()
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported file type '{mime}'. "
                f"Please upload a PDF, PNG, or JPEG file."
            ),
        )


def _check_magic_bytes(content: bytes, declared_mime: str | None, filename: str) -> None:
    """
    Verify that the file's actual bytes match the declared MIME type.
    This prevents a renamed .exe (or other file) from passing MIME-type
    validation.
    """
    if not content:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded file appears to be empty.",
        )

    detected_mime: str | None = None
    for offset, signature, mime in _MAGIC_SIGNATURES:
        end = offset + len(signature)
        if content[offset:end] == signature:
            detected_mime = mime
            break

    if detected_mime is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                "The file content does not match any supported format "
                "(PDF, PNG, JPEG). Please upload a valid legal document."
            ),
        )

    declared = (declared_mime or "").split(";")[0].strip().lower()

    # JPEG can appear as image/jpg or image/jpeg — treat both as the same.
    def _normalise(m: str) -> str:
        return "image/jpeg" if m == "image/jpg" else m

    if _normalise(detected_mime) != _normalise(declared):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"File extension / declared type '{declared}' does not match "
                f"the actual file content (detected: '{detected_mime}'). "
                "Please upload an unmodified PDF, PNG, or JPEG."
            ),
        )
