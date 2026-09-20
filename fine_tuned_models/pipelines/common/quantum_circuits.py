"""PennyLane Quantum Circuits & PyTorch Hybrid Layer Modules for Fine-Tuning.

Supports:
1. Variational Quantum Classifier (VQC) with Parameterized Strongly Entangling Layers
2. Hybrid Quantum Neural Network (QNN) PyTorch TorchLayer Head
3. Quantum Support Vector Machine (QSVM) Kernel Matrix Estimator
"""

from __future__ import annotations

import numpy as np
try:
    import pennylane as qml
except ImportError:
    qml = None
import torch
import torch.nn as nn
from typing import Optional, Union, Tuple


def get_quantum_device(n_qubits: int, shots: Optional[int] = None):
    """Initializes high-performance PennyLane device.
    Uses lightning.qubit if available, otherwise falls back to default.qubit.
    """
    try:
        return qml.device("lightning.qubit", wires=n_qubits, shots=shots)
    except Exception:
        return qml.device("default.qubit", wires=n_qubits, shots=shots)


class QuantumHybridHead(nn.Module):
    """PyTorch-compatible Quantum Neural Network classification head.
    Can be stacked on top of any classical CNN/Transformer (e.g. EfficientNet, DenseNet, BiomedCLIP).
    """

    def __init__(
        self,
        in_features: int,
        n_qubits: int = 8,
        n_layers: int = 3,
        n_classes: int = 2,
    ):
        super().__init__()
        self.in_features = in_features
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.n_classes = n_classes

        self.pre_proj = nn.Sequential(
            nn.Linear(in_features, 64),
            nn.LayerNorm(64),
            nn.SiLU(),
            nn.Dropout(0.20),
            nn.Linear(64, n_qubits),
            nn.Tanh(),
        )

        self.q_weights = nn.Parameter(torch.randn(n_layers, n_qubits, 3) * 0.1)

        dev = get_quantum_device(n_qubits)

        if qml is not None:
            @qml.qnode(dev, interface="torch", diff_method="best")
            def qnode(x_vec, weights):
                for i in range(n_qubits):
                    qml.RY(x_vec[i] * np.pi, wires=i)
                    qml.RZ(x_vec[i] * np.pi, wires=i)
                for l in range(n_layers):
                    for i in range(n_qubits):
                        qml.Rot(weights[l, i, 0], weights[l, i, 1], weights[l, i, 2], wires=i)
                    for i in range(n_qubits):
                        qml.CNOT(wires=[i, (i + 1) % n_qubits])
                return [qml.expval(qml.PauliZ(i)) for i in range(n_classes)]

            self.qnode = qnode
        else:
            self.qnode = None

        self.post_proj = nn.Linear(n_classes, n_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x_proj = self.pre_proj(x)
        if self.qnode is not None:
            q_outs = []
            for i in range(x_proj.shape[0]):
                res = self.qnode(x_proj[i], self.q_weights)
                q_outs.append(torch.stack(res) if isinstance(res, (list, tuple)) else res)
            q_tensor = torch.stack(q_outs).to(x.device).float()
            return self.post_proj(q_tensor)
        else:
            return self.post_proj(x_proj[:, :self.n_classes])



class StandaloneVQC(nn.Module):
    """PyTorch-backed High-Performance Standalone VQC for tabular clinical datasets."""

    def __init__(self, n_qubits: int = 8, n_layers: int = 3, lr: float = 0.02):
        super().__init__()
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.lr = lr
        self.q_weights = nn.Parameter(0.05 * torch.randn(n_layers, n_qubits, 3))
        self.bias = nn.Parameter(torch.zeros(1))
        self.history = {"loss": []}

        dev = get_quantum_device(n_qubits)

        @qml.qnode(dev, interface="torch", diff_method="best")
        def _circuit(inputs, weights):
            for i in range(n_qubits):
                qml.RY(inputs[i], wires=i)
                qml.RZ(inputs[i], wires=i)
            for l in range(n_layers):
                for i in range(n_qubits):
                    qml.Rot(weights[l, i, 0], weights[l, i, 1], weights[l, i, 2], wires=i)
                for i in range(n_qubits):
                    qml.CNOT(wires=[i, (i + 1) % n_qubits])
            return qml.expval(qml.PauliZ(0))

        self._circuit = _circuit

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        outs = []
        for i in range(x.shape[0]):
            outs.append(self._circuit(x[i], self.q_weights))
        return torch.stack(outs) + self.bias

    def fit(self, X: np.ndarray, y: np.ndarray, epochs: int = 30, batch_size: int = 16):
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.to(device)
        self.train()

        X_t = torch.tensor(X, dtype=torch.float32)
        y_scaled = torch.tensor(np.where(y == 0, -1.0, 1.0), dtype=torch.float32)

        dataset = torch.utils.data.TensorDataset(X_t, y_scaled)
        loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)

        optimizer = torch.optim.Adam(self.parameters(), lr=self.lr, weight_decay=1e-4)
        criterion = nn.MSELoss()
        self.history = {"loss": []}

        for epoch in range(epochs):
            total_loss = 0.0
            total_samples = 0
            for x_b, y_b in loader:
                x_b, y_b = x_b.to(device), y_b.to(device)
                optimizer.zero_grad()
                preds = self(x_b)
                loss = criterion(preds, y_b)
                loss.backward()
                optimizer.step()

                total_loss += loss.item() * len(x_b)
                total_samples += len(x_b)

            avg_loss = total_loss / max(1, total_samples)
            self.history["loss"].append(round(avg_loss, 4))

            if (epoch + 1) % 5 == 0 or epoch == epochs - 1:
                print(f"Epoch [{epoch+1:02d}/{epochs:02d}] | Quantum MSE Loss: {avg_loss:.4f}")

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.to(device)
        self.eval()
        X_t = torch.tensor(X, dtype=torch.float32).to(device)
        with torch.no_grad():
            raw_vals = self(X_t).cpu().numpy()
        p1 = 1.0 / (1.0 + np.exp(-2.0 * raw_vals))
        p0 = 1.0 - p1
        return np.column_stack([p0, p1])

    def predict(self, X: np.ndarray) -> np.ndarray:
        probs = self.predict_proba(X)
        return np.argmax(probs, axis=1)

    def save_checkpoint(self, path: str):
        torch.save(
            {
                "weights": self.q_weights.detach().cpu(),
                "bias": self.bias.detach().cpu().item(),
                "n_qubits": self.n_qubits,
                "n_layers": self.n_layers,
            },
            path,
        )

    def load_checkpoint(self, path: str):
        ckpt = torch.load(path, map_location="cpu")
        self.weights = ckpt["weights"].numpy()
        self.bias = ckpt["bias"]
        self.n_qubits = ckpt["n_qubits"]
        self.n_layers = ckpt["n_layers"]


class QuantumSupportVectorMachine:
    """Quantum Support Vector Machine (QSVM) using PennyLane Quantum Kernel Estimation."""

    def __init__(self, n_qubits: int = 8):
        self.n_qubits = n_qubits
        self.dev = get_quantum_device(n_qubits)
        self.clf = None

        if qml is not None:
            @qml.qnode(self.dev, interface="autograd")
            def _kernel_circuit(x1, x2):
                # Encode x1
                for i in range(n_qubits):
                    qml.RY(x1[i], wires=i)
                    qml.RZ(x1[i], wires=i)
                # Adjoint encode x2
                for i in reversed(range(n_qubits)):
                    qml.RZ(-x2[i], wires=i)
                    qml.RY(-x2[i], wires=i)
                return qml.probs(wires=range(n_qubits))

            self._kernel_circuit = _kernel_circuit
        else:
            self._kernel_circuit = None

    def _compute_kernel_matrix(self, X1: np.ndarray, X2: np.ndarray, is_symmetric: bool = False) -> np.ndarray:
        if self._kernel_circuit is None:
            from sklearn.metrics.pairwise import rbf_kernel
            return rbf_kernel(X1, X2)

        N1, N2 = len(X1), len(X2)
        K = np.zeros((N1, N2), dtype=np.float32)

        if is_symmetric or (N1 == N2 and np.array_equal(X1, X2)):
            for i in range(N1):
                K[i, i] = 1.0
                for j in range(i + 1, N2):
                    probs = self._kernel_circuit(X1[i], X2[j])
                    fidelity = float(probs[0])
                    K[i, j] = fidelity
                    K[j, i] = fidelity
        else:
            for i in range(N1):
                for j in range(N2):
                    probs = self._kernel_circuit(X1[i], X2[j])
                    K[i, j] = float(probs[0])
        return K

    def fit(self, X: np.ndarray, y: np.ndarray):
        from sklearn.svm import SVC
        self.X_train = X.copy()
        K_train = self._compute_kernel_matrix(X, X, is_symmetric=True)
        self.clf = SVC(kernel="precomputed", probability=True)
        self.clf.fit(K_train, y)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        K_test = self._compute_kernel_matrix(X, self.X_train)
        return self.clf.predict_proba(K_test)

    def predict(self, X: np.ndarray) -> np.ndarray:
        K_test = self._compute_kernel_matrix(X, self.X_train)
        return self.clf.predict(K_test)

    def save_checkpoint(self, path: str):
        import joblib
        joblib.dump({"clf": self.clf, "X_train": self.X_train, "n_qubits": self.n_qubits}, path)

