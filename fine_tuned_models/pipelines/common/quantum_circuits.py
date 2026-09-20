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



class StandaloneVQC:
    """Numpy/Scikit-Learn compatible Standalone VQC for tabular datasets."""

    def __init__(self, n_qubits: int = 8, n_layers: int = 3, lr: float = 0.02):
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.lr = lr
        self.weights = np.random.uniform(0, 2 * np.pi, (n_layers, n_qubits, 3))
        self.bias = 0.0

        dev = get_quantum_device(n_qubits)

        @qml.qnode(dev, interface="autograd", diff_method="parameter-shift")
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

    def fit(self, X: np.ndarray, y: np.ndarray, epochs: int = 30, batch_size: int = 16):
        y_scaled = np.where(y == 0, -1.0, 1.0)
        n_samples = len(X)
        opt = qml.AdamOptimizer(stepsize=self.lr)
        self.history = {"loss": []}

        def cost_fn(w, b, x_batch, y_batch):
            preds = np.array([self._circuit(x, w) + b for x in x_batch])
            loss = np.mean((preds - y_batch) ** 2)
            return loss

        for epoch in range(epochs):
            perm = np.random.permutation(n_samples)
            X_shuffled = X[perm]
            y_shuffled = y_scaled[perm]

            epoch_loss = 0.0
            steps = 0
            for start_idx in range(0, n_samples, batch_size):
                x_b = X_shuffled[start_idx : start_idx + batch_size]
                y_b = y_shuffled[start_idx : start_idx + batch_size]
                self.weights, self.bias = opt.step(lambda w, b: cost_fn(w, b, x_b, y_b), self.weights, self.bias)
                epoch_loss += cost_fn(self.weights, self.bias, x_b, y_b)
                steps += 1

            avg_loss = float(epoch_loss / max(1, steps))
            self.history["loss"].append(round(avg_loss, 4))

            if (epoch + 1) % 5 == 0 or epoch == epochs - 1:
                print(f"Epoch [{epoch+1:02d}/{epochs:02d}] | MSE Loss: {avg_loss:.4f}")

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        raw_vals = np.array([self._circuit(x, self.weights) + self.bias for x in X])
        p1 = 1.0 / (1.0 + np.exp(-2.0 * raw_vals))
        p0 = 1.0 - p1
        return np.column_stack([p0, p1])

    def predict(self, X: np.ndarray) -> np.ndarray:
        probs = self.predict_proba(X)
        return np.argmax(probs, axis=1)

    def save_checkpoint(self, path: str):
        torch.save(
            {
                "weights": torch.tensor(self.weights, dtype=torch.float32),
                "bias": float(self.bias),
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

    def _compute_kernel_matrix(self, X1: np.ndarray, X2: np.ndarray) -> np.ndarray:
        if self._kernel_circuit is None:
            # Fallback linear/rbf kernel if pennylane not installed
            from sklearn.metrics.pairwise import rbf_kernel
            return rbf_kernel(X1, X2)

        N1, N2 = len(X1), len(X2)
        K = np.zeros((N1, N2), dtype=np.float32)
        for i in range(N1):
            for j in range(N2):
                probs = self._kernel_circuit(X1[i], X2[j])
                K[i, j] = probs[0]  # State fidelity |<psi(x1)|psi(x2)>|^2
        return K

    def fit(self, X: np.ndarray, y: np.ndarray):
        from sklearn.svm import SVC
        self.X_train = X.copy()
        K_train = self._compute_kernel_matrix(X, X)
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

