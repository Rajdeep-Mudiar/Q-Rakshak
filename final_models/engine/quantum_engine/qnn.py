from __future__ import annotations

import time
from pathlib import Path
from typing import Any

try:
    import pennylane as qml
    HAS_PENNYLANE = True
except ImportError:
    qml = None
    HAS_PENNYLANE = False

import numpy as np
import torch
import torch.nn as nn


class MultiClassQuantumNeuralNetwork(nn.Module):
    """Quantum Neural Network (QNN) for Multi-Class classification per SRS Section 4.5:
    - Output layer: y_hat_c = softmax( sum_q w_{c,q} <Z_q> + b_c )
    - Categorical Cross-Entropy loss
    - Hardware-Efficient multi-qubit measurement
    """

    def __init__(
        self,
        num_classes: int = 2,
        n_qubits: int = 8,
        n_layers: int = 4,
        device_name: str = "default.qubit",
    ):
        super().__init__()
        self.num_classes = num_classes
        self.n_qubits = n_qubits
        self.n_layers = n_layers

        if HAS_PENNYLANE and qml is not None:
            self.dev = qml.device(device_name, wires=n_qubits)

            @qml.qnode(self.dev, interface="torch", diff_method="best")
            def _qnn_circuit(inputs, weights):
                for l in range(n_layers):
                    for i in range(n_qubits):
                        qml.RY(inputs[i], wires=i)
                        qml.Rot(weights[l, i, 0], weights[l, i, 1], weights[l, i, 2], wires=i)

                    for i in range(n_qubits):
                        qml.CZ(wires=[i, (i + 1) % n_qubits])

                return [qml.expval(qml.PauliZ(i)) for i in range(n_qubits)]

            self.circuit = _qnn_circuit
        else:
            self.dev = None
            self.circuit = None

        self.weights = nn.Parameter(torch.randn(n_layers, n_qubits, 3) * 0.05)
        self.classifier_head = nn.Sequential(
            nn.BatchNorm1d(n_qubits),
            nn.Linear(n_qubits, 32),
            nn.GELU(),
            nn.Linear(32, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        batch_size = x.shape[0]
        if self.circuit is None:
            if x.shape[1] >= self.n_qubits:
                expvals_tensor = torch.tanh(x[:, :self.n_qubits])
            else:
                pad = torch.zeros(batch_size, self.n_qubits - x.shape[1], device=x.device)
                expvals_tensor = torch.tanh(torch.cat([x, pad], dim=1))
            return self.classifier_head(expvals_tensor)

        expvals = []
        for i in range(batch_size):
            ev = self.circuit(x[i], self.weights)
            if isinstance(ev, (list, tuple)):
                ev_t = torch.stack(ev)
            else:
                ev_t = ev
            expvals.append(ev_t)

        expvals_tensor = torch.stack(expvals).to(x.device).float()
        logits = self.classifier_head(expvals_tensor)
        return logits

    def fit_dataset(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray | None = None,
        y_val: np.ndarray | None = None,
        epochs: int = 25,
        lr: float = 0.015,
        batch_size: int = 16,
        patience: int = 15,
    ) -> dict[str, Any]:
        optimizer = torch.optim.AdamW(self.parameters(), lr=lr, weight_decay=1e-3)
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-4)
        criterion = nn.CrossEntropyLoss()

        X_t = torch.tensor(X_train, dtype=torch.float32)
        y_t = torch.tensor(y_train, dtype=torch.long)

        dataset = torch.utils.data.TensorDataset(X_t, y_t)
        loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)

        history = []
        best_val_loss = float("inf")
        best_state = None
        no_improve = 0

        start_time = time.perf_counter()
        for epoch in range(epochs):
            self.train()
            epoch_loss = 0.0
            correct = 0
            total = 0
            for bx, by in loader:
                optimizer.zero_grad()
                out = self(bx)
                loss = criterion(out, by)
                loss.backward()
                optimizer.step()

                epoch_loss += loss.item() * bx.size(0)
                preds = out.argmax(dim=1)
                correct += (preds == by).sum().item()
                total += bx.size(0)

            scheduler.step()
            train_acc = correct / max(total, 1)
            train_loss = epoch_loss / max(total, 1)

            val_loss = train_loss
            val_acc = train_acc
            if X_val is not None and y_val is not None:
                self.eval()
                with torch.no_grad():
                    X_v = torch.tensor(X_val, dtype=torch.float32)
                    y_v = torch.tensor(y_val, dtype=torch.long)
                    val_out = self(X_v)
                    val_loss = criterion(val_out, y_v).item()
                    val_acc = (val_out.argmax(dim=1) == y_v).float().mean().item()

                if val_loss < best_val_loss:
                    best_val_loss = val_loss
                    best_state = {k: v.cpu().clone() for k, v in self.state_dict().items()}
                    no_improve = 0
                else:
                    no_improve += 1

            history.append({
                "epoch": epoch + 1,
                "train_loss": train_loss,
                "train_accuracy": train_acc,
                "val_loss": val_loss,
                "val_accuracy": val_acc,
            })

            print(f"      [Epoch {epoch+1:02d}/{epochs:02d}] Train Loss: {train_loss:.4f} Acc: {train_acc:.3f} | Val Loss: {val_loss:.4f} Acc: {val_acc:.3f}", flush=True)

            if no_improve >= patience and epoch >= 10:
                break

        if best_state is not None:
            self.load_state_dict(best_state)

        train_time = time.perf_counter() - start_time
        return {
            "train_time_sec": round(train_time, 2),
            "history": history,
            "final_acc": history[-1]["val_accuracy"] if X_val is not None else history[-1]["train_accuracy"],
            "epochs_run": len(history),
        }

    @torch.no_grad()
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        self.eval()
        X_t = torch.tensor(X, dtype=torch.float32)
        logits = self(X_t)
        return torch.softmax(logits, dim=1).cpu().numpy()

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.predict_proba(X).argmax(axis=1)

    def save_checkpoint(self, path: str | Path) -> None:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        torch.save({
            "state_dict": self.state_dict(),
            "num_classes": self.num_classes,
            "n_qubits": self.n_qubits,
            "n_layers": self.n_layers,
        }, p)

    def load_checkpoint(self, path: str | Path) -> None:
        p = Path(path)
        data = torch.load(p, map_location="cpu")
        self.load_state_dict(data["state_dict"])

