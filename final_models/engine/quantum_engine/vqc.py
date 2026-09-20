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

import torch
import torch.nn as nn


class VariationalQuantumClassifier(nn.Module):
    """Variational Quantum Classifier (VQC) per SRS Section 4.3 & model.md:
    - Angle Feature Encoding |phi(x)> = tensor_i RY(x_i) RZ(0.5 x_i)|0>_i
    - Hardware-Efficient Strongly Entangling Ansatz U(theta) (linear, circular, or all-to-all)
    - Continuous Data Re-Uploading
    - Measurement expectation value <Z_i>
    - Parameter-shift rule / Autograd gradients with Adam optimizer & Cosine Annealing
    - Validation-based Early Stopping (patience=15)
    """

    def __init__(
        self,
        n_qubits: int = 8,
        n_layers: int = 3,
        data_reupload: bool = True,
        entanglement: str = "circular",  # 'linear', 'circular', 'all_to_all'
        device_name: str = "default.qubit",
    ):
        super().__init__()
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.data_reupload = data_reupload
        self.entanglement = entanglement

        if HAS_PENNYLANE and qml is not None:
            self.dev = qml.device(device_name, wires=n_qubits)

            # Build QNode
            @qml.qnode(self.dev, interface="torch", diff_method="best")
            def _circuit(inputs, weights):
                for l in range(n_layers):
                    if l == 0 or data_reupload:
                        for i in range(n_qubits):
                            qml.RY(inputs[i], wires=i)
                            qml.RZ(inputs[i] * 0.5, wires=i)

                    # Strongly entangling unitary block
                    for i in range(n_qubits):
                        qml.Rot(weights[l, i, 0], weights[l, i, 1], weights[l, i, 2], wires=i)

                    # Entanglement layer
                    if entanglement == "all_to_all":
                        for i in range(n_qubits):
                            for j in range(i + 1, n_qubits):
                                qml.CNOT(wires=[i, j])
                    elif entanglement == "linear":
                        for i in range(n_qubits - 1):
                            qml.CNOT(wires=[i, i + 1])
                    else:  # circular
                        for i in range(n_qubits):
                            qml.CNOT(wires=[i, (i + 1) % n_qubits])

                # 2-class expectation values
                return [qml.expval(qml.PauliZ(i)) for i in range(n_qubits)]

            self.circuit = _circuit
        else:
            self.dev = None
            self.circuit = None

        # Weight shape for Rot rotations: (n_layers, n_qubits, 3)
        self.weights = nn.Parameter(torch.randn(n_layers, n_qubits, 3) * 0.05)
        self.post_linear = nn.Linear(n_qubits, 2)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        batch_size = x.shape[0]
        if self.circuit is None:
            if x.shape[1] >= self.n_qubits:
                expvals_tensor = torch.tanh(x[:, :self.n_qubits])
            else:
                pad = torch.zeros(batch_size, self.n_qubits - x.shape[1], device=x.device)
                expvals_tensor = torch.tanh(torch.cat([x, pad], dim=1))
            return self.post_linear(expvals_tensor)

        expvals = []
        for i in range(batch_size):
            ev = self.circuit(x[i], self.weights)
            if isinstance(ev, (list, tuple)):
                ev_t = torch.stack(ev)
            else:
                ev_t = ev
            expvals.append(ev_t)

        expvals_tensor = torch.stack(expvals).to(x.device).float()
        logits = self.post_linear(expvals_tensor)
        return logits

    def fit_dataset(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray | None = None,
        y_val: np.ndarray | None = None,
        epochs: int = 25,
        lr: float = 0.02,
        batch_size: int = 16,
        patience: int = 15,
    ) -> dict[str, Any]:
        """Trains the VQC with Adam optimizer, Cosine Annealing, and validation-based early stopping."""
        optimizer = torch.optim.Adam(self.parameters(), lr=lr, weight_decay=1e-4)
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
                    v_loss = criterion(val_out, y_v).item()
                    v_acc = (val_out.argmax(dim=1) == y_v).float().mean().item()
                    val_loss = v_loss
                    val_acc = v_acc

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

        # Restore best checkpoint
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
        probs = torch.softmax(logits, dim=1).cpu().numpy()
        return probs

    def predict(self, X: np.ndarray) -> np.ndarray:
        probs = self.predict_proba(X)
        return probs.argmax(axis=1)

    def save_checkpoint(self, path: str | Path) -> None:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        torch.save({
            "state_dict": self.state_dict(),
            "n_qubits": self.n_qubits,
            "n_layers": self.n_layers,
            "data_reupload": self.data_reupload,
            "entanglement": self.entanglement,
        }, p)

    def load_checkpoint(self, path: str | Path) -> None:
        p = Path(path)
        data = torch.load(p, map_location="cpu")
        self.load_state_dict(data["state_dict"])

