from __future__ import annotations

import pennylane as qml
import torch


def angle_encode(features: torch.Tensor, n_qubits: int) -> None:
    """Dual-basis angle encoding: Y then Z rotations."""
    qml.AngleEmbedding(features, wires=range(n_qubits), rotation="Y")
    qml.AngleEmbedding(features, wires=range(n_qubits), rotation="Z")


def amplitude_encode(features: torch.Tensor, n_qubits: int) -> None:
    """Amplitude embedding — encodes 2^n_qubits features into superposition."""
    qml.AmplitudeEmbedding(features, wires=range(n_qubits), normalize=True, pad_with=0.0)


def basis_encode(features: torch.Tensor, n_qubits: int) -> None:
    """Basis state embedding for integer-valued features."""
    qml.BasisEmbedding(features, wires=range(n_qubits))


def iqp_encode(features: torch.Tensor, n_qubits: int) -> None:
    """IQP-style encoding: Hadamard layer → RZ feature rotations → pairwise ZZ interactions.

    This creates an entangled feature map that is believed to be classically hard
    to simulate, providing a potential quantum advantage for classification tasks.
    """
    # Hadamard to create superposition
    for i in range(n_qubits):
        qml.Hadamard(wires=i)
    # Single-qubit RZ rotations encoding each feature
    for i in range(n_qubits):
        qml.RZ(features[i], wires=i)
    # Pairwise ZZ interactions (product feature map)
    for i in range(n_qubits - 1):
        qml.IsingZZ(features[i] * features[i + 1], wires=[i, i + 1])
