"""
tests/test_file_validator.py

Unit tests for backend/api/file_validator.py

Run with:
    pytest tests/test_file_validator.py -v
"""

import io
import sys
import os
import pytest

# Make sure the backend package is importable from the repo root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from fastapi import UploadFile, HTTPException
from api.file_validator import (
    MAX_FILE_SIZE_BYTES,
    validate_upload,
    _check_declared_mime,
    _check_magic_bytes,
    _check_size,
)

# ---------------------------------------------------------------------------
# Magic-byte helpers
# ---------------------------------------------------------------------------
PDF_MAGIC   = b"%PDF-1.4 fake pdf content"
PNG_MAGIC   = b"\x89PNG\r\n\x1a\n" + b"\x00" * 20
JPEG_MAGIC  = b"\xff\xd8\xff\xe0" + b"\x00" * 20
EXE_BYTES   = b"MZ\x90\x00" + b"\x00" * 20  # Windows PE header
TEXT_BYTES  = b"Hello, I am a text file."


def make_upload_file(content: bytes, content_type: str, filename: str = "test.pdf") -> UploadFile:
    return UploadFile(
        filename=filename,
        file=io.BytesIO(content),
        headers={"content-type": content_type},
    )


# ---------------------------------------------------------------------------
# _check_size
# ---------------------------------------------------------------------------

def test_check_size_passes_small_file():
    _check_size(b"x" * 100)  # Should not raise


def test_check_size_passes_at_limit():
    _check_size(b"x" * MAX_FILE_SIZE_BYTES)  # Exactly at limit — should pass


def test_check_size_rejects_oversized():
    with pytest.raises(HTTPException) as exc_info:
        _check_size(b"x" * (MAX_FILE_SIZE_BYTES + 1))
    assert exc_info.value.status_code == 413


# ---------------------------------------------------------------------------
# _check_declared_mime
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("mime", [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
])
def test_check_declared_mime_accepts_allowed(mime):
    _check_declared_mime(mime)  # Should not raise


@pytest.mark.parametrize("mime", [
    "text/plain",
    "application/octet-stream",
    "application/x-sh",
    "application/x-msdownload",
    "video/mp4",
    "",
    None,
])
def test_check_declared_mime_rejects_disallowed(mime):
    with pytest.raises(HTTPException) as exc_info:
        _check_declared_mime(mime)
    assert exc_info.value.status_code == 415


def test_check_declared_mime_strips_parameters():
    # "application/pdf; charset=utf-8" should still be accepted
    _check_declared_mime("application/pdf; charset=utf-8")


# ---------------------------------------------------------------------------
# _check_magic_bytes
# ---------------------------------------------------------------------------

def test_magic_bytes_pdf_ok():
    _check_magic_bytes(PDF_MAGIC, "application/pdf", "doc.pdf")


def test_magic_bytes_png_ok():
    _check_magic_bytes(PNG_MAGIC, "image/png", "img.png")


def test_magic_bytes_jpeg_ok():
    _check_magic_bytes(JPEG_MAGIC, "image/jpeg", "photo.jpg")


def test_magic_bytes_jpeg_declared_as_jpg():
    # image/jpg is an alias — should not raise
    _check_magic_bytes(JPEG_MAGIC, "image/jpg", "photo.jpg")


def test_magic_bytes_exe_disguised_as_pdf():
    with pytest.raises(HTTPException) as exc_info:
        _check_magic_bytes(EXE_BYTES, "application/pdf", "evil.pdf")
    assert exc_info.value.status_code == 415


def test_magic_bytes_txt_disguised_as_pdf():
    with pytest.raises(HTTPException) as exc_info:
        _check_magic_bytes(TEXT_BYTES, "application/pdf", "renamed.pdf")
    assert exc_info.value.status_code == 415


def test_magic_bytes_pdf_declared_as_png_mismatch():
    with pytest.raises(HTTPException) as exc_info:
        _check_magic_bytes(PDF_MAGIC, "image/png", "wrong.png")
    assert exc_info.value.status_code == 415


def test_magic_bytes_empty_file():
    with pytest.raises(HTTPException) as exc_info:
        _check_magic_bytes(b"", "application/pdf", "empty.pdf")
    assert exc_info.value.status_code in (415, 422)


# ---------------------------------------------------------------------------
# validate_upload (integration — async)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_validate_upload_valid_pdf():
    uf = make_upload_file(PDF_MAGIC, "application/pdf", "valid.pdf")
    content = await validate_upload(uf)
    assert content == PDF_MAGIC


@pytest.mark.asyncio
async def test_validate_upload_valid_png():
    uf = make_upload_file(PNG_MAGIC, "image/png", "image.png")
    content = await validate_upload(uf)
    assert content == PNG_MAGIC


@pytest.mark.asyncio
async def test_validate_upload_oversized_pdf():
    big = PDF_MAGIC + b"\x00" * MAX_FILE_SIZE_BYTES  # just over limit
    uf = make_upload_file(big, "application/pdf", "big.pdf")
    with pytest.raises(HTTPException) as exc_info:
        await validate_upload(uf)
    assert exc_info.value.status_code == 413


@pytest.mark.asyncio
async def test_validate_upload_wrong_mime_type():
    uf = make_upload_file(TEXT_BYTES, "text/plain", "notes.txt")
    with pytest.raises(HTTPException) as exc_info:
        await validate_upload(uf)
    assert exc_info.value.status_code == 415


@pytest.mark.asyncio
async def test_validate_upload_exe_disguised_as_pdf():
    uf = make_upload_file(EXE_BYTES, "application/pdf", "malware.pdf")
    with pytest.raises(HTTPException) as exc_info:
        await validate_upload(uf)
    assert exc_info.value.status_code == 415


@pytest.mark.asyncio
async def test_validate_upload_shell_script():
    sh_content = b"#!/bin/bash\nrm -rf /\n"
    uf = make_upload_file(sh_content, "application/x-sh", "bad.sh")
    with pytest.raises(HTTPException) as exc_info:
        await validate_upload(uf)
    assert exc_info.value.status_code == 415


@pytest.mark.asyncio
async def test_validate_upload_returns_bytes_for_reuse():
    """Returned bytes must equal original content so callers can write to disk."""
    uf = make_upload_file(PDF_MAGIC, "application/pdf", "doc.pdf")
    result = await validate_upload(uf)
    assert result == PDF_MAGIC
