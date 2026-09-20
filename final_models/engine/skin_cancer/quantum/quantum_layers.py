from __future__ import annotations

import math

import pennylane as qml
import torch
import torch.nn as nn

from ml.skin_cancer.quantum.ansatz import ring_ansatz
from ml.skin_cancer.quantum.encodings import angle_encode


def build_qnode(
    n_qubits: int,
    n_layers: int,
    embedding: str = "angle",
    ansatz: str = "strongly",
    data_reupload: bool = True,
):
    """Build a QNode with optional data re-uploading.

    Data re-uploading (Pérez-Salinas et al., 2020) encodes input features at
    the beginning of *every* variational layer rather than only once.  This
    dramatically increases the expressive power of the circuit and is the
    recommended approach for hybrid QML on medical imaging tasks (2024-2025).

    Args:
        n_qubits:      Number of qubits.
        n_layers:      Number of variational layers.
        embedding:     Encoding strategy — ``"angle"`` (default) or ``"iqp"``.
        ansatz:        Variational form — ``"strongly"`` (default), ``"ring"``,
                       or ``"hardware_efficient"``.
        data_reupload: If *True*, the encoding block is applied before each
                       variational layer (data re-uploading).  If *False*,
                       encoding is applied once before all layers.
    """
    dev = qml.device("default.qubit", wires=n_qubits)

    # Weight shapes depend on ansatz
    if ansatz == "strongly":
        weight_shapes = {"weights": (n_layers, n_qubits, 3)}
    else:
        # ring and hardware_efficient both use 2 angles per qubit per layer
        weight_shapes = {"weights": (n_layers, n_qubits, 2)}

    def _encode(inputs: torch.Tensor) -> None:
        if embedding == "iqp":
            from ml.skin_cancer.quantum.encodings import iqp_encode
            iqp_encode(inputs, n_qubits)
        else:
            angle_encode(inputs, n_qubits)

    @qml.qnode(dev, interface="torch", diff_method="best")
    def circuit_reupload(inputs: torch.Tensor, weights: torch.Tensor):
        """Data re-uploading variant: encode before each layer."""
        for layer in range(n_layers):
            _encode(inputs)
            if ansatz == "strongly":
                qml.StronglyEntanglingLayers(
                    weights[layer : layer + 1], wires=range(n_qubits)
                )
            elif ansatz == "ring":
                ring_ansatz(weights[layer : layer + 1], n_qubits)
            else:
                from ml.skin_cancer.quantum.ansatz import hardware_efficient_ansatz
                hardware_efficient_ansatz(weights[layer : layer + 1], n_qubits)
        return [qml.expval(qml.PauliZ(i)) for i in range(n_qubits)]

    @qml.qnode(dev, interface="torch", diff_method="best")
    def circuit_single(inputs: torch.Tensor, weights: torch.Tensor):
        """Single-upload variant: encode once, then apply all layers."""
        _encode(inputs)
        if ansatz == "strongly":
            qml.StronglyEntanglingLayers(weights, wires=range(n_qubits))
        elif ansatz == "ring":
            ring_ansatz(weights, n_qubits)
        else:
            from ml.skin_cancer.quantum.ansatz import hardware_efficient_ansatz
            hardware_efficient_ansatz(weights, n_qubits)
        return [qml.expval(qml.PauliZ(i)) for i in range(n_qubits)]

    circuit = circuit_reupload if data_reupload else circuit_single
    return circuit, weight_shapes


class QuantumLayer(nn.Module):
    """A PyTorch-compatible variational quantum layer.

    Wraps a PennyLane QNode via ``qml.qnn.TorchLayer`` so it participates
    in standard PyTorch autograd.
    """

    def __init__(
        self,
        n_qubits: int = 10,
        n_layers: int = 4,
        embedding: str = "angle",
        ansatz: str = "strongly",
        data_reupload: bool = True,
    ):
        super().__init__()
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        circuit, shapes = build_qnode(n_qubits, n_layers, embedding, ansatz, data_reupload)
        self.qnn = qml.qnn.TorchLayer(circuit, shapes)
        # Initialise with small weights to avoid barren plateaus at the start
        with torch.no_grad():
            for param in self.qnn.parameters():
                param.normal_(0.0, 0.01)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.qnn(x)


def angle_scale(x: torch.Tensor) -> torch.Tensor:
    """Map real-valued features to [-π, π] via tanh."""
    return math.pi * torch.tanh(x)
