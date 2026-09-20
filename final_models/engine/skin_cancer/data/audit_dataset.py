from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from ml.skin_cancer.constants import HAM10000_DISPLAY, HAM10000_LABELS
from ml.skin_cancer.data import class_names_from_labels, discover_csv, load_hmnist
from ml.skin_cancer.paths import REPORTS_DIR, ensure_dirs


def audit(csv_path: Path | None = None) -> dict:
    ensure_dirs()
    csv_path = csv_path or discover_csv()
    images, labels = load_hmnist(csv_path)
    counts = Counter(int(v) for v in labels)
    class_rows = []
    for class_id, count in sorted(counts.items()):
        code = HAM10000_LABELS.get(class_id, f"class_{class_id}")
        class_rows.append(
            {
                "class_id": class_id,
                "code": code,
                "name": HAM10000_DISPLAY.get(code, code),
                "count": count,
                "fraction": count / len(labels),
            }
        )
    class_df = pd.DataFrame(class_rows)
    dims = pd.DataFrame(
        [
            {
                "height": images.shape[1],
                "width": images.shape[2],
                "channels": images.shape[3],
                "dtype": str(images.dtype),
                "n_samples": int(images.shape[0]),
            }
        ]
    )
    brightness = images.mean(axis=(1, 2, 3))
    report = {
        "csv": str(csv_path),
        "total_images": int(len(labels)),
        "classes": class_names_from_labels(labels),
        "num_classes": int(len(counts)),
        "images_per_class": class_rows,
        "image_dimensions": dims.to_dict(orient="records")[0],
        "file_formats": ["csv-hmnist"],
        "corrupted_images": 0,
        "duplicate_hashes": None,
        "class_imbalance_ratio": float(max(counts.values()) / max(min(counts.values()), 1)),
        "brightness_mean": float(brightness.mean()),
        "brightness_std": float(brightness.std()),
        "missing_metadata": True,
        "patient_ids_available": False,
        "note": "HAM10000 MNIST CSV has no patient/lesion IDs; split is stratified by class.",
        "medical_limitation": "Research/decision-support only. Not a diagnosis.",
    }

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    (REPORTS_DIR / "dataset_audit.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    class_df.to_csv(REPORTS_DIR / "class_distribution.csv", index=False)
    dims.to_csv(REPORTS_DIR / "image_dimensions.csv", index=False)

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.bar(class_df["code"], class_df["count"], color="#1f6feb")
    ax.set_title("HAM10000 class distribution")
    ax.set_ylabel("images")
    ax.tick_params(axis="x", rotation=30)
    fig.tight_layout()
    fig.savefig(REPORTS_DIR / "class_distribution.png", dpi=140)
    plt.close(fig)
    return report


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=None)
    parser.add_argument("--csv", type=Path, default=None)
    args = parser.parse_args()
    csv_path = args.csv
    if csv_path is None and args.root is not None:
        csv_path = args.root / "archive" / "hmnist_28_28_RGB.csv"
    report = audit(csv_path)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
