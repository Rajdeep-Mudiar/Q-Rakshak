from ml.skin_cancer.quantum.quantum_derma import QuantumHead


class QuantumDermaX(QuantumHead):
    """Extended quantum model: 12 qubits, 4 layers, data re-uploading.

    Larger qubit count than QuantumDerma gives more expressive feature space
    at the cost of longer circuit simulation time.
    """

    def __init__(self, num_classes: int, n_qubits: int = 12, n_layers: int = 4, **kwargs):
        kwargs.setdefault("data_reupload", True)
        kwargs.setdefault("ansatz", "strongly")
        super().__init__(num_classes=num_classes, n_qubits=n_qubits, n_layers=n_layers, **kwargs)
