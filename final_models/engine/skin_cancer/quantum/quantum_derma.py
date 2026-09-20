from __future__ import annotations

import torch
import torch.nn as nn

from ml.skin_cancer.quantum.quantum_layers import QuantumLayer, angle_scale


class QuantumHead(nn.Module):
    """Hybrid quantum-classical classification head.

    Architecture (best-practice 2025):
        1. BatchNorm to stabilise incoming CNN features.
        2. Linear projection to match qubit count.
        3. tanh angle-scaling to map into [-π, π].
        4. Variational quantum circuit (VQC) with data re-uploading +
           StronglyEntanglingLayers.
        5. Deeper post-quantum MLP (two hidden layers) for richer mapping
           from expectation values to class logits.
        6. Classical residual path: direct linear map from input features
           to class logits is added to the quantum logits, helping
           gradients flow and preventing vanishing-gradient stalls.
    """

    def __init__(
        self,
        num_classes: int,
        n_qubits: int = 10,
        n_layers: int = 4,
        in_dim: int = 16,
        dropout: float = 0.2,
        embedding: str = "angle",
        ansatz: str = "strongly",
        data_reupload: bool = True,
    ):
        super().__init__()
        self.n_qubits = n_qubits
        self.n_layers = n_layers

        # Normalise incoming features before projection
        self.bn = nn.BatchNorm1d(in_dim)

        # Project to qubit dimension
        self.projection = nn.Identity() if in_dim == n_qubits else nn.Linear(in_dim, n_qubits)

        # Variational quantum circuit
        self.quantum = QuantumLayer(n_qubits, n_layers, embedding, ansatz, data_reupload)

        # Deeper post-quantum MLP for richer expectation-value → logit mapping
        hidden = max(32, num_classes * 8)
        self.classifier = nn.Sequential(
            nn.LayerNorm(n_qubits),
            nn.Dropout(dropout),
            nn.Linear(n_qubits, hidden),
            nn.GELU(),
            nn.Dropout(dropout * 0.5),
            nn.Linear(hidden, max(16, num_classes * 2)),
            nn.GELU(),
            nn.Linear(max(16, num_classes * 2), num_classes),
        )

        # Classical residual: direct shortcut for gradient flow
        self.classical_residual = nn.Linear(in_dim, num_classes)
        # Learnable scale for residual shortcut, initialized to a conservative 0.1
        self.alpha = nn.Parameter(torch.tensor(0.1))

    def quantum_features(self, x: torch.Tensor) -> torch.Tensor:
        x = self.bn(x)
        x = self.projection(x)
        x = angle_scale(x)
        return self.quantum(x)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        quantum_logits = self.classifier(self.quantum_features(x))
        return quantum_logits + self.alpha * self.classical_residual(x)


class QuantumDerma(QuantumHead):
    """Primary quantum hybrid model for HAM10000 skin lesion classification.

    Uses 10 qubits, 4 layers, StronglyEntanglingLayers, and data re-uploading.
    """
    pass
