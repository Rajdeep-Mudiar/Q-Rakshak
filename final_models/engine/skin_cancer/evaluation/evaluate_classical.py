from __future__ import annotations

import argparse
import json
from pathlib import Path

import torch

from ml.skin_cancer.classical import CLASSICAL_BUILDERS
from ml.skin_cancer.constants import HAM10000_LABELS
from ml.skin_cancer.data.dataset_loader import make_loader
from ml.skin_cancer.data.split_dataset import load_manifest
from ml.skin_cancer.evaluation import collect_predictions, write_eval_artifacts
from ml.skin_cancer.paths import MODELS_DIR, REPORTS_DIR
from ml.skin_cancer.seed import get_device


def evaluate_classical(model_name: str = "DermisNova") -> dict:
    device = get_device()
    ckpt_path = MODELS_DIR / "classical" / model_name / "best.pt"
    ckpt = torch.load(ckpt_path, map_location=device, weights_only=False)
    model = CLASSICAL_BUILDERS[model_name](ckpt["num_classes"], dropout=ckpt.get("dropout", 0.3)).to(device)
    model.load_state_dict(ckpt["model"])
    loader = make_loader("test", ckpt["image_size"], 64, train=False)
    y_true, y_prob, _ = collect_predictions(model, loader, device)
    class_names = ckpt.get("class_names") or [HAM10000_LABELS[i] for i in range(ckpt["num_classes"])]
    test_idx = load_manifest().loc[lambda d: d["split"] == "test", "index"].to_numpy()
    return write_eval_artifacts(REPORTS_DIR / model_name, y_true, y_prob, class_names, indices=test_idx)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="DermisNova")
    args = parser.parse_args()
    print(json.dumps(evaluate_classical(args.model), indent=2)[:2000])
