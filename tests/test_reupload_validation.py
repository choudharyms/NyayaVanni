import pytest
from fastapi import HTTPException

from backend.services.reupload_validation import validate_analysis_reupload


ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024


def test_validate_analysis_reupload_rejects_unsupported_extension():
    with pytest.raises(HTTPException) as exc:
        validate_analysis_reupload(
            "payload.exe",
            b"MZ",
            max_file_size=MAX_FILE_SIZE,
            allowed_extensions=ALLOWED_EXTENSIONS,
        )

    assert exc.value.status_code == 400
    assert "Unsupported file format" in exc.value.detail


def test_validate_analysis_reupload_rejects_oversized_payload():
    oversized_pdf = b"%PDF" + (b"0" * MAX_FILE_SIZE)

    with pytest.raises(HTTPException) as exc:
        validate_analysis_reupload(
            "evidence.pdf",
            oversized_pdf,
            max_file_size=MAX_FILE_SIZE,
            allowed_extensions=ALLOWED_EXTENSIONS,
        )

    assert exc.value.status_code == 413
    assert "10MB" in exc.value.detail


def test_validate_analysis_reupload_rejects_magic_byte_mismatch():
    with pytest.raises(HTTPException) as exc:
        validate_analysis_reupload(
            "evidence.pdf",
            b"\x89PNG",
            max_file_size=MAX_FILE_SIZE,
            allowed_extensions=ALLOWED_EXTENSIONS,
        )

    assert exc.value.status_code == 400
    assert "claimed file type" in exc.value.detail
