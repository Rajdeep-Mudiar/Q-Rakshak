from __future__ import annotations

import torch
import torch.nn as nn

from ml.skin_cancer.quantum.quantum_layers import QuantumLayer, angle_scale


class VitaQDerm(nn.Module):
    """Raw-feature quantum model with data re-uploading.

    Unlike QuantumDerma, VitaQDerm accepts the full (un-PCA'd) compact CNN
    features via a learned projection, then passes them through the quantum
    circuit.  A BatchNorm on the input and a deeper post-quantum MLP improve
    training stability.

    Architecture:
        BatchNorm(in_dim) → Linear(in_dim, n_qubits) → angle_scale →
        QuantumLayer(data_reupload=True) → LayerNorm → MLP(3 layers) → logits
    """

    def __init__(
        self,
        num_classes: int,
        n_qubits: int = 10,
        n_layers: int = 4,
        in_dim: int = 128,
        dropout: float = 0.2,
        data_reupload: bool = True,
    ):
        super().__init__()
        self.bn = nn.BatchNorm1d(in_dim)
        # Non-linear projection MLP to project 128 features down to n_qubits
        self.projection = nn.Sequential(
            nn.Linear(in_dim, 64),
            nn.GELU(),
            nn.Linear(64, n_qubits),
        )
        self.quantum = QuantumLayer(n_qubits, n_layers, data_reupload=data_reupload)

        hidden = max(32, num_classes * 8)
        self.mlp = nn.Sequential(
            nn.LayerNorm(n_qubits),
            nn.Dropout(dropout),
            nn.Linear(n_qubits, hidden),
            nn.GELU(),
            nn.Dropout(dropout * 0.5),
            nn.Linear(hidden, max(16, num_classes * 2)),
            nn.GELU(),
            nn.Linear(max(16, num_classes * 2), num_classes),
        )
        
        # Initialize final layer of quantum MLP to zero to prevent random noise from corrupting classical logits at start-up
        nn.init.zeros_(self.mlp[-1].weight)
        nn.init.zeros_(self.mlp[-1].bias)

        # Non-linear classical residual shortcut matching the remainder of DermisNova head (ReLU -> Linear)
        self.residual = nn.Sequential(
            nn.ReLU(),
            nn.Linear(in_dim, num_classes)
        )
        # Learnable scaling factor for the classical residual connection, initialized to 1.0
        self.alpha = nn.Parameter(torch.tensor(1.0))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x_norm = self.bn(x)
        q = self.quantum(angle_scale(self.projection(x_norm)))
        return self.mlp(q) + self.alpha * self.residual(x)
