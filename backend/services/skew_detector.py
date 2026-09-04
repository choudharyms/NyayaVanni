"""Skew / rotation detection for uploaded document scans.

Estimates the skew angle of a scanned page from the covariance of its dark
(binary) pixels, and flags landscape-rotated pages via aspect ratio. Uses
Pillow + numpy (existing dependencies). Safe fallback when no image is given.
"""

import io
import logging
import math
from typing import Dict, Any

logger = logging.getLogger(__name__)

try:
    import numpy as np
    from PIL import Image
except ImportError:  # pragma: no cover
    np = None
    Image = None

SKEW_TOLERANCE_DEG = 3.0
MIN_IMAGE_DIMENSION = 64


def _binarize(image_bytes: bytes):
    if np is None or Image is None:
        return None
    img = Image.open(io.BytesIO(image_bytes)).convert("L")
    img.thumbnail((1024, 1024))
    arr = np.asarray(img, dtype=float)
    threshold = arr.mean() * 0.9
    return (arr < threshold).astype(float)


def estimate_skew(image_bytes: bytes) -> Dict[str, Any]:
    """Estimate page skew and detect rotated/landscape uploads."""
    result: Dict[str, Any] = {
        "skew_detected": None,
        "skew_angle": 0.0,
        "rotated": False,
        "message": "Skew checks skipped (no image bytes provided).",
    }
    if not image_bytes:
        return result

    try:
        if np is None or Image is None:
            return result

        with Image.open(io.BytesIO(image_bytes)) as img:
            width, height = img.size
        if min(width, height) < MIN_IMAGE_DIMENSION:
            return result

        binary = _binarize(image_bytes)
        if binary is None or binary.size == 0:
            return result
        ys, xs = np.nonzero(binary)
        if len(xs) < 50:
            return result

        # The dominant orientation of dark pixels approximates text direction.
        dx = xs - xs.mean()
        dy = ys - ys.mean()
        cov_xx = float(np.dot(dx, dx))
        cov_yy = float(np.dot(dy, dy))
        cov_xy = float(np.dot(dx, dy))

        if cov_xx + cov_yy == 0:
            raw_angle = 0.0
        else:
            # Eigenvector angle of the covariance matrix (already in -45..45).
            raw_angle = math.degrees(
                0.5 * math.atan2(2 * cov_xy, cov_xx - cov_yy)
            )
            raw_angle = abs(raw_angle)
            # Deviation from the nearest of horizontal / vertical text axis.
            angle = min(raw_angle, abs(90 - raw_angle))

        rotated = width > height * 1.2  # landscape upload of a portrait page
        skew = abs(angle) > SKEW_TOLERANCE_DEG
        result.update(
            {
                "skew_detected": skew or rotated,
                "skew_angle": round(angle, 2),
                "rotated": rotated,
                "message": (
                    "Uploaded document appears tilted or rotated; OCR quality "
                    "may be reduced."
                    if skew or rotated
                    else "Page orientation appears acceptable."
                ),
            }
        )
    except Exception as exc:
        logger.warning("Skew detection failed: %s", exc)
    return result
