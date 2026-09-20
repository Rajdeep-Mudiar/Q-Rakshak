from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from ml.skin_cancer.paths import MODELS_DIR


def package_model(model_name: str = "QuantumDerma") -> Path:
    src = MODELS_DIR / "quantum" / model_name
    if not (src / "best.pt").exists():
        src = MODELS_DIR / "classical" / model_name
    dest = MODELS_DIR / "production" / model_name
    dest.mkdir(parents=True, exist_ok=True)
    for item in src.iterdir():
        if item.is_file():
            shutil.copy2(item, dest / item.name)
    registry = MODELS_DIR / "production" / "registry.json"
    data = {"production": model_name, "path": str(dest)}
    registry.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return dest


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="QuantumDerma")
    args = parser.parse_args()
    print(package_model(args.model))
