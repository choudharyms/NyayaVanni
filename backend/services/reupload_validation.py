import os

from fastapi import HTTPException

from .file_validation import validate_file_magic_bytes


def validate_analysis_reupload(
    filename: str,
    file_bytes: bytes,
    *,
    max_file_size: int,
    allowed_extensions: set[str],
) -> tuple[str, bytes]:
    """Validate a replacement file submitted to the analyze endpoint."""
    if not filename:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must have a valid filename.",
        )

    safe_filename = os.path.basename(filename)
    safe_filename = "".join(
        ch for ch in safe_filename if ch.isalnum() or ch in ("._-")
    )
    if not safe_filename:
        safe_filename = "upload"

    ext = safe_filename.split(".")[-1].lower() if "." in safe_filename else ""
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Only PDF, PNG, JPG, JPEG, and DOCX are allowed.",
        )

    if len(file_bytes) > max_file_size:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds the maximum allowed limit of 10MB.",
        )

    if not validate_file_magic_bytes(file_bytes, ext):
        raise HTTPException(
            status_code=400,
            detail="File content does not match the claimed file type. Upload rejected.",
        )

    return safe_filename, file_bytes
