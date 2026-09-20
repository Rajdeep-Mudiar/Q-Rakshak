from __future__ import annotations

import argparse
from pathlib import Path

import torch

from ml.skin_cancer.classical import CLASSICAL_BUILDERS
from ml.skin_cancer.paths import MODELS_DIR


def export_onnx(model_name: str = "DermisNova") -> Path:
    ckpt = torch.load(MODELS_DIR / "classical" / model_name / "best.pt", map_location="cpu", weights_only=False)
    model = CLASSICAL_BUILDERS[model_name](ckpt["num_classes"], dropout=ckpt.get("dropout", 0.3))
    model.load_state_dict(ckpt["model"])
    model.eval()
    out = MODELS_DIR / "classical" / model_name / "model.onnx"
    dummy = torch.randn(1, 3, ckpt["image_size"], ckpt["image_size"])
    torch.onnx.export(model, dummy, str(out), input_names=["image"], output_names=["logits"], opset_version=17)
    return out


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="DermisNova")
    args = parser.parse_args()
    print(export_onnx(args.model))
