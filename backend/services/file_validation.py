from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

MAGIC_BYTES = {
    "pdf": {
        "bytes": [0x25, 0x50, 0x44, 0x46],
        "offset": 0,
        "mime": "application/pdf",
    },
    "png": {
        "bytes": [0x89, 0x50, 0x4E, 0x47],
        "offset": 0,
        "mime": "image/png",
    },
    "jpg": {
        "bytes": [0xFF, 0xD8, 0xFF],
        "offset": 0,
        "mime": "image/jpeg",
    },
    "jpeg": {
        "bytes": [0xFF, 0xD8, 0xFF],
        "offset": 0,
        "mime": "image/jpeg",
    },
    "docx": {
        "bytes": [0x50, 0x4B, 0x03, 0x04],
        "offset": 0,
        "mime": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
}


def validate_file_magic_bytes(file_bytes: bytes, expected_ext: str) -> bool:
    if expected_ext not in MAGIC_BYTES:
        logger.warning("No magic bytes configured for extension: %s", expected_ext)
        return False

    sig = MAGIC_BYTES[expected_ext]
    offset = sig["offset"]
    expected = sig["bytes"]

    if len(file_bytes) < offset + len(expected):
        return False

    actual = file_bytes[offset : offset + len(expected)]
    return list(actual) == expected


def detect_actual_mime(file_bytes: bytes) -> str | None:
    for ext, sig in MAGIC_BYTES.items():
        offset = sig["offset"]
        expected = sig["bytes"]
        if len(file_bytes) >= offset + len(expected):
            actual = list(file_bytes[offset : offset + len(expected)])
            if actual == expected:
                return sig["mime"]
    return None
