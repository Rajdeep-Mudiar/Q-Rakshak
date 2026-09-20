from ml.skin_cancer.quantum.quantum_derma import QuantumHead


class QSkinVortex(QuantumHead):
    """High-capacity skin lesion classifier: 10 qubits, 5 layers.

    More variational layers than QuantumDerma for deeper quantum feature
    extraction.  Uses StronglyEntanglingLayers with data re-uploading.
    """

    def __init__(self, num_classes: int, n_qubits: int = 10, n_layers: int = 5, **kwargs):
        kwargs.setdefault("data_reupload", True)
        kwargs.setdefault("ansatz", "strongly")
        super().__init__(
            num_classes=num_classes,
            n_qubits=n_qubits,
            n_layers=n_layers,
            **kwargs,
        )
