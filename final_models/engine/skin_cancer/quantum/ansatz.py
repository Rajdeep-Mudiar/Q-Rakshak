from __future__ import annotations

import pennylane as qml
import torch


def ring_entangle(n_qubits: int) -> None:
    """Ring (nearest-neighbour) CNOT entanglement."""
    for i in range(n_qubits):
        qml.CNOT(wires=[i, (i + 1) % n_qubits])


def all_to_all_entangle(n_qubits: int) -> None:
    """Full all-to-all CNOT entanglement for maximum expressivity."""
    for i in range(n_qubits):
        for j in range(i + 1, n_qubits):
            qml.CNOT(wires=[i, j])


def ring_ansatz(weights: torch.Tensor, n_qubits: int) -> None:
    """Ring ansatz: RY + RZ per qubit, ring CNOT entanglement."""
    n_layers = int(weights.shape[0])
    for layer in range(n_layers):
        for i in range(n_qubits):
            qml.RY(weights[layer, i, 0], wires=i)
            qml.RZ(weights[layer, i, 1], wires=i)
        ring_entangle(n_qubits)


def strongly_entangling(weights: torch.Tensor, n_qubits: int) -> None:
    """PennyLane StronglyEntanglingLayers — highest expressivity for NISQ."""
    qml.StronglyEntanglingLayers(weights, wires=range(n_qubits))


def hardware_efficient_ansatz(weights: torch.Tensor, n_qubits: int) -> None:
    """Hardware-efficient ansatz: alternating RY/RZ + CNOT ladder."""
    n_layers = int(weights.shape[0])
    for layer in range(n_layers):
        for i in range(n_qubits):
            qml.RY(weights[layer, i, 0], wires=i)
            qml.RZ(weights[layer, i, 1], wires=i)
        # CNOT ladder (linear)
        for i in range(n_qubits - 1):
            qml.CNOT(wires=[i, i + 1])


def basic_entangler(weights: torch.Tensor, n_qubits: int) -> None:
    qml.BasicEntanglerLayers(weights, wires=range(n_qubits))
