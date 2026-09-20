from __future__ import annotations

import argparse
import json

import numpy as np
import torch

from ml.skin_cancer.constants import HAM10000_LABELS
from ml.skin_cancer.data.split_dataset import load_manifest
from ml.skin_cancer.evaluation import write_eval_artifacts
from ml.skin_cancer.evaluation.calibration import fit_temperature
from ml.skin_cancer.paths import MODELS_DIR, REPORTS_DIR
from ml.skin_cancer.quantum.quantum_derma import QuantumDerma
from ml.skin_cancer.quantum.quantum_derma_x import QuantumDermaX
from ml.skin_cancer.quantum.qskin_vortex import QSkinVortex
from ml.skin_cancer.quantum.vitaq_derm import VitaQDerm
from ml.skin_cancer.seed import get_device

BUILDERS = {
    "QuantumDerma": QuantumDerma,
    "QuantumDermaX": QuantumDermaX,
    "VitaQ-Derm": VitaQDerm,
    "QSkin-Vortex": QSkinVortex,
}


def evaluate_quantum(model_name: str = "QuantumDerma") -> dict:
    device = get_device()
    ckpt = torch.load(MODELS_DIR / "quantum" / model_name / "best.pt", map_location=device, weights_only=False)
    backbone = ckpt.get("backbone", "DermisNova")
    feat_dir = REPORTS_DIR / "features" / backbone
    suffix = "x" if ckpt.get("use_raw") else "pca"
    x_val = np.load(feat_dir / f"val_{suffix}.npy")
    y_val = np.load(feat_dir / "val_y.npy")
    x_test = np.load(feat_dir / f"test_{suffix}.npy")
    y_test = np.load(feat_dir / "test_y.npy")
    builder = BUILDERS[model_name]
    kwargs = dict(num_classes=ckpt["num_classes"], in_dim=ckpt["in_dim"])
    if model_name != "VitaQ-Derm":
        kwargs.update(n_qubits=int(ckpt["config"]["qubits"]), n_layers=int(ckpt["config"]["layers"]))
        if model_name == "QuantumDermaX":
            kwargs["n_qubits"] = 10
            kwargs["n_layers"] = 3
        if model_name == "QSkin-Vortex":
            kwargs["n_layers"] = 4
    else:
        kwargs.update(n_qubits=int(ckpt["config"]["qubits"]), n_layers=int(ckpt["config"]["layers"]))
    model = builder(**kwargs).to(device)
    model.load_state_dict(ckpt["model"])
    model.eval()
    with torch.no_grad():
        val_logits = model(torch.tensor(x_val, dtype=torch.float32, device=device)).cpu()
        test_logits = model(torch.tensor(x_test, dtype=torch.float32, device=device)).cpu()
    temperature = fit_temperature(val_logits.numpy(), y_val)
    y_prob = torch.softmax(test_logits / temperature, dim=1).numpy()
    class_names = ckpt.get("class_names") or [HAM10000_LABELS[i] for i in range(ckpt["num_classes"])]
    test_idx = load_manifest().loc[lambda d: d["split"] == "test", "index"].to_numpy()
    return write_eval_artifacts(REPORTS_DIR / model_name, y_test, y_prob, class_names, indices=test_idx)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="QuantumDerma")
    args = parser.parse_args()
    print(json.dumps({k: evaluate_quantum(args.model)[k] for k in ("accuracy", "macro_f1")}, indent=2))
