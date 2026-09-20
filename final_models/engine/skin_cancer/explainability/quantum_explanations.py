from __future__ import annotations

import json

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import torch

from ml.skin_cancer.paths import MODELS_DIR, REPORTS_DIR
from ml.skin_cancer.quantum.quantum_derma import QuantumDerma
from ml.skin_cancer.seed import get_device


def quantum_sensitivity(n: int = 64) -> None:
    device = get_device()
    feat = np.load(REPORTS_DIR / "features" / "DermisNova" / "test_pca.npy")[:n]
    ckpt = torch.load(MODELS_DIR / "quantum" / "QuantumDerma" / "best.pt", map_location=device, weights_only=False)
    model = QuantumDerma(ckpt["num_classes"], n_qubits=int(ckpt["config"]["qubits"]), n_layers=int(ckpt["config"]["layers"]), in_dim=ckpt["in_dim"]).to(device)
    model.load_state_dict(ckpt["model"])
    model.eval()
    x = torch.tensor(feat, dtype=torch.float32, device=device)
    with torch.no_grad():
        base = torch.softmax(model(x), dim=1)
    deltas = []
    for i in range(x.shape[1]):
        xp = x.clone()
        xp[:, i] = xp[:, i] + 0.1
        with torch.no_grad():
            pert = torch.softmax(model(xp), dim=1)
        deltas.append(float((pert - base).abs().mean().cpu()))
    df = pd.DataFrame({"feature": [f"x{i}" for i in range(len(deltas))], "delta": deltas})
    df.to_csv(REPORTS_DIR / "quantum_feature_importance.csv", index=False)
    fig, ax = plt.subplots(figsize=(7, 4))
    ax.bar(df["feature"], df["delta"], color="#1f6feb")
    ax.set_title("Quantum feature sensitivity")
    fig.tight_layout()
    fig.savefig(REPORTS_DIR / "quantum_feature_importance.png", dpi=140)
    plt.close(fig)
    (REPORTS_DIR / "quantum_explanations.json").write_text(json.dumps(deltas), encoding="utf-8")


if __name__ == "__main__":
    quantum_sensitivity()
