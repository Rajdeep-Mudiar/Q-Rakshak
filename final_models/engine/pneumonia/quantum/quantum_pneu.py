from __future__ import annotations

import torch
import torch.nn as nn

from ml.skin_cancer.quantum.quantum_layers import QuantumLayer, angle_scale


class QuantumPneu(nn.Module):
    """Hybrid Quantum-Classical Classifier for Chest X-Ray Pneumonia Detection.

    Architecture (2025 State-of-the-Art NISQ QML):
        1. BatchNorm1d to normalise input features.
        2. Linear projection to match the 8-qubit variational circuit.
        3. Angle scaling (tanh -> [-pi, pi]).
        4. 8-qubit, 4-layer variational quantum circuit with data re-uploading
           and StronglyEntanglingLayers.
        5. LayerNorm + 2-layer GELU MLP head mapping quantum expectation values to binary logits.
        6. Classical linear residual connection for gradient stability.
    """

    def __init__(
        self,
        in_dim: int = 8,
        n_qubits: int = 8,
        n_layers: int = 4,
        dropout: float = 0.2,
        embedding: str = "angle",
        ansatz: str = "strongly",
        data_reupload: bool = True,
    ):
        super().__init__()
        self.n_qubits = n_qubits
        self.n_layers = n_layers

        self.bn = nn.BatchNorm1d(in_dim)
        self.projection = nn.Identity() if in_dim == n_qubits else nn.Linear(in_dim, n_qubits)
        self.quantum = QuantumLayer(
            n_qubits=n_qubits,
            n_layers=n_layers,
            embedding=embedding,
            ansatz=ansatz,
            data_reupload=data_reupload,
        )

        hidden = 32
        self.classifier = nn.Sequential(
            nn.LayerNorm(n_qubits),
            nn.Dropout(dropout),
            nn.Linear(n_qubits, hidden),
            nn.GELU(),
            nn.Dropout(dropout * 0.5),
            nn.Linear(hidden, 2),
        )
        self.classical_residual = nn.Linear(in_dim, 2)

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        normed = self.bn(features)
        projected = self.projection(normed)
        scaled = angle_scale(projected)
        quantum_out = self.quantum(scaled)
        quantum_logits = self.classifier(quantum_out)
        return quantum_logits + self.classical_residual(features)