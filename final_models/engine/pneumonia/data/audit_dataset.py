from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

from ml.pneumonia.data.dataset_loader import discover_dataset_root, discover_split_dirs
from ml.pneumonia.paths import REPORTS_DIR, ensure_dirs


def audit(root: Path | None = None) -> dict:
    ensure_dirs()
    dataset_root = discover_dataset_root(root)
    splits = discover_split_dirs(dataset_root)
    report = {
        "root": str(dataset_root), "splits": {}, "classes": ["NORMAL", "PNEUMONIA"],
        "validation_split_generated": "val" not in splits,
    }
    for split, split_root in splits.items():
        counts = {name: 0 for name in ("NORMAL", "PNEUMONIA")}
        invalid = 0
        dimensions = set()
        for path in split_root.rglob("*"):
            if "__MACOSX" in path.parts or path.name.startswith("._") or path.name.lower() in {".ds_store", "thumbs.db"}:
                continue
            if path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
                continue
            class_name = path.parent.name.upper()
            if class_name in counts:
                counts[class_name] += 1
            try:
                with Image.open(path) as image:
                    image.verify()
                with Image.open(path) as image:
                    dimensions.add(image.size)
            except Exception:
                invalid += 1
        report["splits"][split] = {
            "path": str(split_root), "counts": counts,
            "total": sum(counts.values()), "invalid_images": invalid,
            "dimensions": sorted([list(size) for size in dimensions]),
        }
    (REPORTS_DIR / "dataset_audit.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=None)
    print(json.dumps(audit(parser.parse_args().root), indent=2))