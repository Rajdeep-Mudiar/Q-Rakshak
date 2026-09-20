from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import torch
from tqdm import tqdm

from ml.skin_cancer.classical import CLASSICAL_BUILDERS
from ml.skin_cancer.data.dataset_loader import make_loader
from ml.skin_cancer.paths import MODELS_DIR, REPORTS_DIR, ensure_dirs
from ml.skin_cancer.seed import get_device


def load_classical(model_name: str, device):
    ckpt_path = MODELS_DIR / "classical" / model_name / "best.pt"
    ckpt = torch.load(ckpt_path, map_location=device, weights_only=False)
    model = CLASSICAL_BUILDERS[model_name](ckpt["num_classes"], dropout=ckpt.get("dropout", 0.3))
    model.load_state_dict(ckpt["model"])
    model.to(device).eval()
    return model, ckpt


@torch.no_grad()
def extract_split(model, split: str, image_size: int, batch_size: int, device) -> tuple[np.ndarray, np.ndarray]:
    loader = make_loader(split, image_size, batch_size, train=False)
    feats, labels = [], []
    for x, y in tqdm(loader, desc=f"features {split}", leave=False):
        x = x.to(device)
        compact = model.compact_features(x)
        feats.append(compact.cpu().numpy())
        labels.append(y.numpy())
    return np.concatenate(feats), np.concatenate(labels)


def extract_all(model_name: str = "DermisNova", batch_size: int = 64) -> Path:
    ensure_dirs()
    device = get_device()
    model, ckpt = load_classical(model_name, device)
    out = REPORTS_DIR / "features" / model_name
    out.mkdir(parents=True, exist_ok=True)
    for split in ("train", "val", "test"):
        x, y = extract_split(model, split, ckpt["image_size"], batch_size, device)
        np.save(out / f"{split}_x.npy", x)
        np.save(out / f"{split}_y.npy", y)
    (out / "feature_meta.json").write_text(
        json.dumps(
            {
                "model": model_name,
                "image_size": ckpt["image_size"],
                "checkpoint_mtime_ns": (MODELS_DIR / "classical" / model_name / "best.pt").stat().st_mtime_ns,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    return out


if __name__ == "__main__":
    extract_all()
