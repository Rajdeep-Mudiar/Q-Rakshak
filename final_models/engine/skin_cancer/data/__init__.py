from __future__ import annotations

import hashlib
from pathlib import Path

import numpy as np
import pandas as pd

from ml.skin_cancer.constants import HAM10000_DISPLAY, HAM10000_LABELS
from ml.skin_cancer.paths import ARCHIVE_DIR, CACHE_DIR, PRIMARY_CSV, ensure_dirs


def discover_csv(root: Path | None = None) -> Path:
    if PRIMARY_CSV.exists():
        return PRIMARY_CSV
    search_root = root or ARCHIVE_DIR
    candidates = sorted(search_root.rglob("hmnist_28_28_RGB.csv"))
    if not candidates:
        raise FileNotFoundError("hmnist_28_28_RGB.csv not found under datasets/SKIN_CANCER")
    return candidates[0]


def load_hmnist(csv_path: Path | None = None, cache: bool = True) -> tuple[np.ndarray, np.ndarray]:
    """Load HAM10000 MNIST RGB as uint8 images of shape [N, H, W, 3]."""
    ensure_dirs()
    csv_path = csv_path or discover_csv()
    cache_x = CACHE_DIR / f"{csv_path.stem}_x.npy"
    cache_y = CACHE_DIR / f"{csv_path.stem}_y.npy"
    if cache and cache_x.exists() and cache_y.exists():
        return np.load(cache_x), np.load(cache_y)

    df = pd.read_csv(csv_path)
    if "label" not in df.columns:
        raise ValueError(f"Expected a label column in {csv_path}")
    labels = df["label"].to_numpy(dtype=np.int64)
    pixels = df.drop(columns=["label"]).to_numpy(dtype=np.uint8)
    n_pixels = pixels.shape[1]
    if n_pixels == 28 * 28 * 3:
        images = pixels.reshape(-1, 28, 28, 3)
    elif n_pixels == 8 * 8 * 3:
        images = pixels.reshape(-1, 8, 8, 3)
    elif n_pixels == 28 * 28:
        gray = pixels.reshape(-1, 28, 28)
        images = np.repeat(gray[..., None], 3, axis=-1)
    elif n_pixels == 8 * 8:
        gray = pixels.reshape(-1, 8, 8)
        images = np.repeat(gray[..., None], 3, axis=-1)
    else:
        raise ValueError(f"Unsupported pixel count {n_pixels} in {csv_path}")

    if cache:
        np.save(cache_x, images)
        np.save(cache_y, labels)
    return images, labels


def class_names_from_labels(labels: np.ndarray) -> list[str]:
    unique = sorted(int(v) for v in np.unique(labels))
    return [HAM10000_LABELS.get(i, f"class_{i}") for i in unique]


def dataset_fingerprint(csv_path: Path) -> str:
    hasher = hashlib.sha256()
    hasher.update(str(csv_path.resolve()).encode())
    hasher.update(str(csv_path.stat().st_size).encode())
    hasher.update(str(int(csv_path.stat().st_mtime)).encode())
    return hasher.hexdigest()[:16]


def label_table() -> pd.DataFrame:
    rows = [
        {"id": i, "code": code, "name": HAM10000_DISPLAY[code]}
        for i, code in HAM10000_LABELS.items()
    ]
    return pd.DataFrame(rows)
