from __future__ import annotations

import json

import numpy as np
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.utils.data import DataLoader, TensorDataset

from ml.skin_cancer.constants import HAM10000_LABELS
from ml.skin_cancer.evaluation.metrics import compute_metrics
from ml.skin_cancer.paths import REPORTS_DIR
from ml.skin_cancer.quantum.quantum_derma import QuantumDerma
from ml.skin_cancer.seed import get_device, set_seed


def _run(n_qubits: int, n_layers: int = 2, epochs: int = 8) -> dict:
    set_seed(42)
    device = get_device()
    feat_dir = REPORTS_DIR / "features" / "DermisNova"
    xtr = np.load(feat_dir / "train_pca.npy")[:, :n_qubits]
    ytr = np.load(feat_dir / "train_y.npy")
    xv = np.load(feat_dir / "val_pca.npy")[:, :n_qubits]
    yv = np.load(feat_dir / "val_y.npy")
    model = QuantumDerma(int(ytr.max()) + 1, n_qubits=n_qubits, n_layers=n_layers, in_dim=n_qubits).to(device)
    opt = AdamW(model.parameters(), lr=1e-3)
    crit = nn.CrossEntropyLoss()
    loader = DataLoader(
        TensorDataset(torch.tensor(xtr, dtype=torch.float32), torch.tensor(ytr, dtype=torch.long)),
        batch_size=64,
        shuffle=True,
    )
    for _ in range(epochs):
        model.train()
        for x, y in loader:
            opt.zero_grad()
            loss = crit(model(x.to(device)), y.to(device))
            loss.backward()
            opt.step()
    model.eval()
    with torch.no_grad():
        prob = torch.softmax(model(torch.tensor(xv, dtype=torch.float32, device=device)), dim=1).cpu().numpy()
    names = [HAM10000_LABELS[i] for i in range(int(ytr.max()) + 1)]
    metrics = compute_metrics(yv, prob, names)
    return {"qubits": n_qubits, "layers": n_layers, "val_macro_f1": metrics["macro_f1"], "val_accuracy": metrics["accuracy"]}


def main() -> None:
    rows = [_run(q) for q in (4, 6, 8)]
    out = REPORTS_DIR / "qubit_comparison.json"
    out.write_text(json.dumps(rows, indent=2), encoding="utf-8")
    print(json.dumps(rows, indent=2))


if __name__ == "__main__":
    main()
