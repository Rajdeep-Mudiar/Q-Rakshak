from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

import numpy as np
import pandas as pd

from ml.skin_cancer.constants import HAM10000_LABELS
from ml.skin_cancer.data import discover_csv, load_hmnist
from ml.skin_cancer.paths import REPORTS_DIR, ensure_dirs


def row_hash(image: np.ndarray, label: int) -> str:
    return hashlib.sha1(image.tobytes() + str(label).encode()).hexdigest()


def detect(csv_path: Path | None = None) -> pd.DataFrame:
    ensure_dirs()
    images, labels = load_hmnist(csv_path or discover_csv())
    hashes = [row_hash(images[i], int(labels[i])) for i in range(len(labels))]
    df = pd.DataFrame({"index": np.arange(len(labels)), "hash": hashes, "label": labels})
    dup = df[df.duplicated("hash", keep=False)].sort_values("hash")
    dup.to_csv(REPORTS_DIR / "duplicates.csv", index=False)
    return dup


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", type=Path, default=None)
    args = parser.parse_args()
    dup = detect(args.csv)
    print(f"duplicate rows: {len(dup)}")


if __name__ == "__main__":
    main()
