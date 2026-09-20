from __future__ import annotations

from typing import Sequence
try:
    import pennylane as qml
except ImportError:
    qml = None
import torch


def angle_feature_map(features: torch.Tensor | Sequence[float], wires: Sequence[int], rotation: str = "Y") -> None:
    """Encodes classical continuous features into quantum state rotations.
    Applies single-qubit rotations per wire with values scaled in [0, pi].
    """
    for i, wire in enumerate(wires):
        val = features[i] if i < len(features) else 0.0
        if rotation == "Y":
            qml.RY(val, wires=wire)
        elif rotation == "Z":
            qml.RZ(val, wires=wire)
        elif rotation == "X":
            qml.RX(val, wires=wire)
        else:
            qml.Rot(val, val, val, wires=wire)


def zz_feature_map(features: torch.Tensor | Sequence[float], wires: Sequence[int], reps: int = 2) -> None:
    """Applies higher-order ZZ non-linear entanglement feature map.
    Implements: H-gates -> RZ(2*x_i) -> CNOT -> RZ(2*(pi-x_i)(pi-x_j)) -> CNOT.
    """
    n_wires = len(wires)
    for _ in range(reps):
        for wire in wires:
            qml.Hadamard(wires=wire)
        for i, wire in enumerate(wires):
            val = features[i] if i < len(features) else 0.0
            qml.RZ(2.0 * val, wires=wire)
        # Pairwise circular entanglement
        for i in range(n_wires):
            j = (i + 1) % n_wires
            val_i = features[i] if i < len(features) else 0.0
            val_j = features[j] if j < len(features) else 0.0
            phi_ij = 2.0 * (torch.pi - val_i) * (torch.pi - val_j) if isinstance(val_i, torch.Tensor) else 2.0 * (3.14159 - val_i) * (3.14159 - val_j)
            qml.CNOT(wires=[wires[i], wires[j]])
            qml.RZ(phi_ij, wires=wires[j])
            qml.CNOT(wires=[wires[i], wires[j]])
