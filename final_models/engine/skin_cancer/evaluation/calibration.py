from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import torch
import torch.nn as nn


class TemperatureScaler(nn.Module):
    def __init__(self):
        super().__init__()
        self.temperature = nn.Parameter(torch.ones(1))

    def forward(self, logits: torch.Tensor) -> torch.Tensor:
        return logits / self.temperature.clamp_min(1e-3)


def fit_temperature(logits: np.ndarray, labels: np.ndarray, max_iter: int = 50) -> float:
    device = torch.device("cpu")
    scaler = TemperatureScaler().to(device)
    x = torch.tensor(logits, dtype=torch.float32)
    y = torch.tensor(labels, dtype=torch.long)
    opt = torch.optim.LBFGS(scaler.parameters(), lr=0.1, max_iter=max_iter)
    nll = nn.CrossEntropyLoss()

    def closure():
        opt.zero_grad()
        loss = nll(scaler(x), y)
        loss.backward()
        return loss

    opt.step(closure)
    return float(scaler.temperature.detach().cpu().item())


def expected_calibration_error(probs: np.ndarray, labels: np.ndarray, n_bins: int = 15) -> float:
    conf = probs.max(axis=1)
    pred = probs.argmax(axis=1)
    acc = (pred == labels).astype(np.float64)
    bins = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    for i in range(n_bins):
        mask = (conf > bins[i]) & (conf <= bins[i + 1])
        if not mask.any():
            continue
        ece += mask.mean() * abs(acc[mask].mean() - conf[mask].mean())
    return float(ece)


def save_reliability(probs: np.ndarray, labels: np.ndarray, path: Path) -> None:
    conf = probs.max(axis=1)
    acc = (probs.argmax(axis=1) == labels).astype(np.float64)
    bins = np.linspace(0, 1, 11)
    xs, ys = [], []
    for i in range(10):
        mask = (conf > bins[i]) & (conf <= bins[i + 1])
        if mask.any():
            xs.append(conf[mask].mean())
            ys.append(acc[mask].mean())
    fig, ax = plt.subplots(figsize=(5, 5))
    ax.plot([0, 1], [0, 1], "--", color="gray")
    ax.plot(xs, ys, marker="o")
    ax.set_title("Reliability")
    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)


def save_temperature(path: Path, temperature: float) -> None:
    path.write_text(json.dumps({"temperature": temperature}, indent=2), encoding="utf-8")
