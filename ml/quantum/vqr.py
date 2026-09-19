from __future__ import annotations

import logging
import time
from typing import Any

import numpy as np
try:
    import pennylane as qml
    HAS_PENNYLANE = True
except ImportError:
    qml = None
    HAS_PENNYLANE = False
import torch
import torch.nn as nn
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from ml.quantum.feature_maps import angle_feature_map

logger = logging.getLogger("ml.quantum.vqr")


class VariationalQuantumRegressor(nn.Module):
    """Variational Quantum Regressor (VQR) for Continuous Clinical Biomarker & Disease Progression Prediction.
    Encapsulates:
    - Angle encoding feature map into n_qubits.
    - Parameterized rotation gates Rot(alpha, beta, gamma) with circular CNOT entanglement chains.
    - Pauli-Z expectation measurement on output wires.
    - Trainable classical readout head mapping quantum expectations to continuous outcomes (e.g. UPDRS, risk scores).
    - Barren plateau gradient variance monitoring.
    """

    def __init__(
        self,
        n_qubits: int = 4,
        n_layers: int = 2,
        data_reupload: bool = True,
        device_name: str = "default.qubit",
        shots: int | None = None,
        random_state: int = 42,
    ):
        super().__init__()
        torch.manual_seed(random_state)
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.data_reupload = data_reupload
        self.device_name = device_name
        self.shots = shots
        self.random_state = random_state

        if not HAS_PENNYLANE or qml is None:
            raise ImportError("PennyLane is required for VariationalQuantumRegressor.")

        self.dev = qml.device(device_name, wires=n_qubits, shots=shots)

        # Trainable circuit weights: shape (n_layers, n_qubits, 3)
        self.weights = nn.Parameter(
            torch.randn(n_layers, n_qubits, 3, dtype=torch.float32) * 0.1
        )
        # Trainable readout linear layer: maps n_qubits expectation values -> 1 continuous output
        self.readout = nn.Linear(n_qubits, 1)

        @qml.qnode(self.dev, interface="torch", diff_method="backprop")
        def _circuit(inputs, weights):
            for layer in range(self.n_layers):
                if layer == 0 or self.data_reupload:
                    angle_feature_map(inputs, wires=range(self.n_qubits), rotation="Y")

                # Variational Rotations
                for q in range(self.n_qubits):
                    qml.Rot(
                        weights[layer, q, 0],
                        weights[layer, q, 1],
                        weights[layer, q, 2],
                        wires=q,
                    )

                # Circular CNOT Entanglement
                for q in range(self.n_qubits):
                    qml.CNOT(wires=[q, (q + 1) % self.n_qubits])

            # Measure Pauli-Z expectation value on all active qubits
            return [qml.expval(qml.PauliZ(q)) for q in range(self.n_qubits)]

        self.qnode = _circuit
        self.gradient_variance_history: list[float] = []

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass over a batch of classical features, outputting continuous regression estimates."""
        if x.ndim == 1:
            x = x.unsqueeze(0)

        outputs = []
        for i in range(x.shape[0]):
            exp_vals = self.qnode(x[i], self.weights)
            exp_tensor = torch.stack(exp_vals).float()
            outputs.append(exp_tensor)

        quantum_features = torch.stack(outputs)
        y_hat = self.readout(quantum_features).squeeze(-1)
        return y_hat

    def fit(
        self,
        X: np.ndarray,
        y: np.ndarray,
        epochs: int = 15,
        lr: float = 0.03,
        batch_size: int = 16,
    ) -> VariationalQuantumRegressor:
        """Fits the variational quantum regressor using Mean Squared Error (MSE) loss."""
        X_t = torch.tensor(X, dtype=torch.float32)
        y_t = torch.tensor(y, dtype=torch.float32)

        optimizer = torch.optim.Adam(self.parameters(), lr=lr)
        loss_fn = nn.MSELoss()

        dataset = torch.utils.data.TensorDataset(X_t, y_t)
        loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)

        self.train()
        for epoch in range(epochs):
            total_loss = 0.0
            for bx, by in loader:
                optimizer.zero_grad()
                pred = self.forward(bx)
                loss = loss_fn(pred, by)
                loss.backward()
                optimizer.step()
                total_loss += float(loss.item()) * len(bx)

            # Record gradient variance telemetry
            if self.weights.grad is not None:
                grad_var = float(np.var(self.weights.grad.detach().cpu().numpy()))
                self.gradient_variance_history.append(grad_var)

        self.eval()
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Generates continuous regression predictions."""
        self.eval()
        with torch.no_grad():
            X_t = torch.tensor(X, dtype=torch.float32)
            preds = self.forward(X_t)
            return preds.cpu().numpy()

    def evaluate_regression_metrics(self, X: np.ndarray, y: np.ndarray) -> dict[str, float]:
        """Calculates standard continuous regression metrics: R2, RMSE, MAE, Pearson Correlation."""
        preds = self.predict(X)
        mse = mean_squared_error(y, preds)
        rmse = float(np.sqrt(mse))
        mae = float(mean_absolute_error(y, preds))
        r2 = float(r2_score(y, preds))

        # Pearson correlation
        if len(preds) > 1 and np.std(preds) > 1e-8 and np.std(y) > 1e-8:
            corr = float(np.corrcoef(y, preds)[0, 1])
        else:
            corr = 0.0

        return {
            "r2_score": round(r2, 4),
            "rmse": round(rmse, 4),
            "mae": round(mae, 4),
            "pearson_correlation": round(corr, 4),
        }

    def compute_gradient_telemetry(self) -> dict[str, Any]:
        """Monitors barren plateau susceptibility by checking gradient norm and variance."""
        if self.weights.grad is None:
            return {"grad_norm": 0.0, "grad_var": 0.0, "barren_plateau_detected": False}

        grad = self.weights.grad.detach().cpu().numpy()
        grad_norm = float(np.linalg.norm(grad))
        grad_var = float(np.var(grad))
        is_plateau = grad_var < 1e-6 and len(self.gradient_variance_history) > 5

        return {
            "grad_norm": round(grad_norm, 6),
            "grad_var": round(grad_var, 8),
            "barren_plateau_detected": is_plateau,
        }
