from __future__ import annotations

import logging
import time
from typing import Literal

import numpy as np
try:
    import pennylane as qml
except ImportError:
    qml = None
from sklearn.svm import SVC

from ml.quantum.feature_maps import angle_feature_map, zz_feature_map

logger = logging.getLogger("ml.quantum.kernels")


class QuantumKernelEngine:
    """Quantum Kernel Matrix Computer using State-Fidelity Overlap in PennyLane.
    Evaluates: K(x_1, x_2) = |<0| U^dagger(x_2) U(x_1) |0>|^2
    """

    def __init__(self, n_qubits: int = 8, feature_map: Literal["angle", "zz"] = "angle", device_name: str = "default.qubit"):
        self.n_qubits = n_qubits
        self.feature_map_type = feature_map
        self.dev = qml.device(device_name, wires=n_qubits)
        self.qnode = qml.QNode(self._circuit, self.dev)

    def _circuit(self, x1, x2):
        wires = list(range(self.n_qubits))
        if self.feature_map_type == "zz":
            zz_feature_map(x1, wires=wires, reps=1)
            qml.adjoint(zz_feature_map)(x2, wires=wires, reps=1)
        else:
            angle_feature_map(x1, wires=wires, rotation="Y")
            qml.adjoint(angle_feature_map)(x2, wires=wires, rotation="Y")
        return qml.probs(wires=wires)

    def compute_similarity(self, x1: np.ndarray, x2: np.ndarray) -> float:
        """Computes pairwise overlap probability |<phi(x1)|phi(x2)>|^2 (prob of measuring |00...0>)."""
        probs = self.qnode(x1, x2)
        return float(probs[0])

    def compute_kernel_matrix(self, X1: np.ndarray, X2: np.ndarray | None = None) -> np.ndarray:
        """Computes symmetric Gram matrix K(X1, X2)."""
        is_symmetric = X2 is None
        X2 = X1 if is_symmetric else X2
        n1, n2 = len(X1), len(X2)
        K = np.zeros((n1, n2), dtype=np.float32)

        for i in range(n1):
            j_start = i if is_symmetric else 0
            for j in range(j_start, n2):
                val = self.compute_similarity(X1[i], X2[j])
                K[i, j] = val
                if is_symmetric:
                    K[j, i] = val
        return K


class QuantumSupportVectorMachine:
    """Quantum Support Vector Machine (QSVM) Classifier using Precomputed Quantum Kernel."""

    def __init__(self, n_qubits: int = 8, feature_map: str = "angle", C: float = 1.0):
        self.n_qubits = n_qubits
        self.feature_map = feature_map
        self.C = C
        self.kernel_engine = QuantumKernelEngine(n_qubits=n_qubits, feature_map=feature_map)
        self.svc = SVC(kernel="precomputed", C=C, probability=True, random_state=42)
        self.X_train_: np.ndarray | None = None
        self.is_fitted = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> dict[str, Any]:
        start = time.perf_counter()
        self.X_train_ = np.asarray(X, dtype=np.float32)
        K_train = self.kernel_engine.compute_kernel_matrix(self.X_train_)
        self.svc.fit(K_train, y)
        self.is_fitted = True
        elapsed = time.perf_counter() - start
        return {
            "fit_time_sec": elapsed,
            "n_support_vectors": int(len(self.svc.support_)),
            "kernel_dim": list(K_train.shape),
        }

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted or self.X_train_ is None:
            raise RuntimeError("QSVM model must be fitted first.")
        K_test = self.kernel_engine.compute_kernel_matrix(np.asarray(X, dtype=np.float32), self.X_train_)
        return self.svc.predict(K_test)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted or self.X_train_ is None:
            raise RuntimeError("QSVM model must be fitted first.")
        K_test = self.kernel_engine.compute_kernel_matrix(np.asarray(X, dtype=np.float32), self.X_train_)
        return self.svc.predict_proba(K_test)
