from __future__ import annotations

from typing import Any

import numpy as np
from PIL import Image


def assess_array(image: np.ndarray) -> dict[str, Any]:
    if image.ndim == 2:
        gray = image.astype(np.float32)
    else:
        gray = image.mean(axis=2).astype(np.float32)
    brightness = float(gray.mean())
    contrast = float(gray.std())
    gy, gx = np.gradient(gray)
    sharpness = float(np.mean(gx**2 + gy**2))
    reasons = []
    if brightness < 15 or brightness > 245:
        reasons.append("exposure")
    if contrast < 8:
        reasons.append("contrast")
    if sharpness < 4:
        reasons.append("blur")
    if min(image.shape[0], image.shape[1]) < 8:
        reasons.append("resolution")
    return {
        "valid": not reasons,
        "reason": "Image quality is insufficient." if reasons else None,
        "issues": reasons,
        "brightness": brightness,
        "contrast": contrast,
        "sharpness": sharpness,
    }


def assess_pil(image: Image.Image) -> dict[str, Any]:
    return assess_array(np.array(image.convert("RGB")))
