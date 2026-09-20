from __future__ import annotations

import logging
import numpy as np
try:
    import pennylane as qml
except ImportError:
    qml = None
import torch
import torch.nn as nn

from ml.quantum.feature_maps import angle_feature_map

logger = logging.getLogger("ml.quantum.hybrid")


class HybridQNNClassifier(nn.Module):
    """Hybrid Quantum-Classical Neural Network.
    Integrates a PennyLane parameterized quantum expectation layer with PyTorch MLP classical layers.
    """

    def __init__(
        self,
        num_classes: int = 2,
        n_qubits: int = 8,
        n_layers: int = 2,
        device_name: str = "default.qubit",
    ):
        super().__init__()
        self.num_classes = num_classes
        self.n_qubits = n_qubits
        self.n_layers = n_layers

        self.dev = qml.device(device_name, wires=n_qubits)

        # Quantum layer parameters
        self.q_weights = nn.Parameter(torch.randn(n_layers, n_qubits, 3) * 0.1)

        @qml.qnode(self.dev, interface="torch", diff_method="backprop")
        def _qcircuit(inputs, weights):
            angle_feature_map(inputs, wires=range(self.n_qubits), rotation="Y")
            for layer in range(self.n_layers):
                for q in range(self.n_qubits):
                    qml.Rot(weights[layer, q, 0], weights[layer, q, 1], weights[layer, q, 2], wires=q)
                for q in range(self.n_qubits):
                    qml.CNOT(wires=[q, (q + 1) % self.n_qubits])
            return [qml.expval(qml.PauliZ(i)) for i in range(self.n_qubits)]

        self.qnode = _qcircuit

        # Classical post-processing head
        self.classical_head = nn.Sequential(
            nn.Linear(n_qubits, 32),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(32, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if x.ndim == 1:
            x = x.unsqueeze(0)

        # Quantum expectation pass
        q_features = []
        for i in range(x.shape[0]):
            expvals = self.qnode(x[i], self.q_weights)
            q_features.append(torch.stack(expvals).float())

        q_tensor = torch.stack(q_features)
        logits = self.classical_head(q_tensor)
        return logits

    def predict_proba(self, X: np.ndarray | torch.Tensor) -> np.ndarray:
        self.eval()
        with torch.no_grad():
            if isinstance(X, np.ndarray):
                X_t = torch.tensor(X, dtype=torch.float32)
            else:
                X_t = X.float()
            logits = self.forward(X_t)
            probs = torch.softmax(logits, dim=-1).cpu().numpy()
        return probs

    def predict(self, X: np.ndarray | torch.Tensor) -> np.ndarray:
        return self.predict_proba(X).argmax(axis=-1)
