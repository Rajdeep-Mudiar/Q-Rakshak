from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

from ml.skin_cancer.constants import HAM10000_LABELS
from ml.skin_cancer.data import discover_csv, load_hmnist
from ml.skin_cancer.paths import REPORTS_DIR, ensure_dirs


def build_split(
    csv_path: Path | None = None,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    seed: int = 42,
) -> pd.DataFrame:
    ensure_dirs()
    csv_path = csv_path or discover_csv()
    images, labels = load_hmnist(csv_path)
    indices = np.arange(len(labels))
    test_ratio = 1.0 - train_ratio - val_ratio
    train_idx, temp_idx, y_train, y_temp = train_test_split(
        indices,
        labels,
        test_size=val_ratio + test_ratio,
        stratify=labels,
        random_state=seed,
    )
    relative_val = val_ratio / (val_ratio + test_ratio)
    val_idx, test_idx, _, _ = train_test_split(
        temp_idx,
        y_temp,
        test_size=1.0 - relative_val,
        stratify=y_temp,
        random_state=seed,
    )
    split = np.full(len(labels), "train", dtype=object)
    split[val_idx] = "val"
    split[test_idx] = "test"
    df = pd.DataFrame(
        {
            "index": indices,
            "class_id": labels,
            "class": [HAM10000_LABELS.get(int(y), f"class_{int(y)}") for y in labels],
            "split": split,
            "source": str(csv_path),
        }
    )
    path = REPORTS_DIR / "manifest.csv"
    df.to_csv(path, index=False)
    return df


def load_manifest(path: Path | None = None, csv_path: Path | None = None) -> pd.DataFrame:
    path = path or (REPORTS_DIR / "manifest.csv")
    if csv_path is not None:
        csv_path = csv_path.resolve()
        if path.exists():
            manifest = pd.read_csv(path)
            sources = manifest.get("source", pd.Series(dtype=str)).dropna().astype(str)
            if not sources.empty and Path(sources.iloc[0]).resolve() == csv_path:
                return manifest
        return build_split(csv_path)
    if not path.exists():
        return build_split()
    return pd.read_csv(path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", type=Path, default=None)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    df = build_split(args.csv, seed=args.seed)
    print(df["split"].value_counts().to_string())
    print(f"wrote {REPORTS_DIR / 'manifest.csv'}")


if __name__ == "__main__":
    main()
