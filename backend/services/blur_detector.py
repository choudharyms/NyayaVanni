"""Blur detection for uploaded document scans.

Estimates image sharpness using the variance of the Laplacian (approximated
with numpy gradients over the grayscale image). Low variance indicates a blurry
or out-of-focus scan. Uses Pillow + numpy, which are existing dependencies.
"""

import io
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

try:
    import numpy as np
    from PIL import Image
except ImportError:  # pragma: no cover
    np = None
    Image = None

BLUR_THRESHOLD = 100.0
MIN_IMAGE_DIMENSION = 64


def _to_gray_array(image_bytes: bytes):
    if np is None or Image is None:
        return None
    img = Image.open(io.BytesIO(image_bytes)).convert("L")
    img.thumbnail((1024, 1024))
    return np.asarray(img, dtype=float)


def estimate_blur(image_bytes: bytes) -> Dict[str, Any]:
    """Return blur metrics for an image. Safe fallback when no image provided."""
    result: Dict[str, Any] = {
        "blur_detected": None,
        "variance_of_laplacian": None,
        "message": "Image quality checks skipped (no image bytes provided).",
    }
    if not image_bytes:
        return result

    try:
        gray = _to_gray_array(image_bytes)
        if gray is None or gray.size == 0:
            return result
        if min(gray.shape) < MIN_IMAGE_DIMENSION:
            result.update(
                {
                    "blur_detected": True,
                    "variance_of_laplacian": 0.0,
                    "message": "Uploaded image has very low resolution.",
                }
            )
            return result

        # Approximate Laplacian via second-order gradients.
        gy, gx = np.gradient(gray)
        lap = np.abs(np.gradient(gx)[1]) + np.abs(np.gradient(gy)[0])
        variance = float(lap.var())

        blurry = variance < BLUR_THRESHOLD
        result.update(
            {
                "blur_detected": blurry,
                "variance_of_laplacian": round(variance, 2),
                "message": (
                    "Uploaded document appears blurry and may produce inaccurate "
                    "legal analysis."
                    if blurry
                    else "Image sharpness is acceptable."
                ),
            }
        )
    except Exception as exc:
        logger.warning("Blur detection failed: %s", exc)
    return result
