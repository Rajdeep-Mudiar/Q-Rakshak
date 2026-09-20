from __future__ import annotations

import logging
from typing import Any
import numpy as np

logger = logging.getLogger("ml.explainability.quantum")


class QuantumSensitivityAnalyzer:
    """Quantum Circuit Parameter & Feature Sensitivity Analysis for Clinical Interpretability."""

    def __init__(self, perturbation_epsilon: float = 0.05):
        self.eps = perturbation_epsilon

    def analyze_qubit_contributions(self, vqc_model, sample_q: np.ndarray) -> list[dict[str, Any]]:
        """Evaluates output sensitivity to perturbations on individual qubit rotation angles."""
        base_probs = vqc_model.predict_proba(sample_q.reshape(1, -1))[0]
        base_conf = float(np.max(base_probs))
        n_qubits = len(sample_q)

        qubit_sensitivities = []
        for q in range(n_qubits):
            perturbed_plus = sample_q.copy()
            perturbed_plus[q] += self.eps
            prob_plus = vqc_model.predict_proba(perturbed_plus.reshape(1, -1))[0]

            perturbed_minus = sample_q.copy()
            perturbed_minus[q] -= self.eps
            prob_minus = vqc_model.predict_proba(perturbed_minus.reshape(1, -1))[0]

            # Numerical gradient approximation
            grad = (np.max(prob_plus) - np.max(prob_minus)) / (2.0 * self.eps)
            sensitivity = float(abs(grad))

            qubit_sensitivities.append({
                "qubit_index": q,
                "qubit_label": f"Qubit q[{q}]",
                "sensitivity": round(sensitivity, 4),
                "rotation_angle_rad": round(float(sample_q[q]), 3),
            })

        qubit_sensitivities.sort(key=lambda x: x["sensitivity"], reverse=True)
        return qubit_sensitivities
