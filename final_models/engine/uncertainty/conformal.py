from __future__ import annotations

import logging
from typing import Any
import numpy as np

logger = logging.getLogger("ml.uncertainty.conformal")


class ConformalPredictor:
    """Inductive Split-Conformal Prediction Sets for Valid Clinical Uncertainty Gating."""

    def __init__(self, alpha: float = 0.10):
        self.alpha = alpha  # Target error rate (e.g. 0.10 => 90% guaranteed marginal coverage)
        self.q_hat: float = 1.0
        self.is_calibrated = False

    def calibrate(self, val_probs: np.ndarray, y_val: np.ndarray) -> ConformalPredictor:
        """Calibrates conformal quantile strictly on held-out validation probabilities."""
        val_probs = np.asarray(val_probs, dtype=np.float64)
        y_val = np.asarray(y_val, dtype=np.int64)

        n = len(y_val)
        # Non-conformity score: 1 - P(true_class)
        true_class_probs = val_probs[np.arange(n), y_val]
        non_conformity_scores = 1.0 - true_class_probs

        # Conformal quantile: ceiling((n + 1)(1 - alpha)) / n
        p_val = min(np.ceil((n + 1) * (1.0 - self.alpha)) / n, 1.0)
        self.q_hat = float(np.quantile(non_conformity_scores, p_val, method="higher"))
        self.is_calibrated = True
        logger.info(f"Conformal calibrator fitted (alpha={self.alpha}, q_hat={self.q_hat:.4f})")
        return self

    def predict_set(self, test_probs: np.ndarray, class_labels: list[str] | None = None) -> list[dict[str, Any]]:
        """Constructs prediction sets for test instances."""
        if not self.is_calibrated:
            raise RuntimeError("ConformalPredictor must be calibrated first.")

        test_probs = np.asarray(test_probs, dtype=np.float64)
        if test_probs.ndim == 1:
            test_probs = test_probs.reshape(1, -1)

        results = []
        for prob in test_probs:
            # Include class c if 1 - prob[c] <= q_hat <=> prob[c] >= 1 - q_hat
            included_indices = np.where(1.0 - prob <= self.q_hat)[0]
            if len(included_indices) == 0:
                # Highly ambiguous distribution: include top classes within uncertainty threshold
                included_indices = np.where(prob >= (np.max(prob) - 0.20))[0]

            if class_labels:
                included_classes = [class_labels[i] for i in included_indices if i < len(class_labels)]
            else:
                included_classes = [f"Class_{i}" for i in included_indices]

            # Uncertainty score is proportional to set size and entropy
            set_size = len(included_classes)
            uncertainty_score = float(np.clip(1.0 - np.max(prob) + (set_size - 1) * 0.2, 0.0, 1.0))
            uncertainty_status = "HIGH" if (set_size > 1 or uncertainty_score > 0.40) else "LOW"

            results.append({
                "prediction_set": included_classes,
                "set_size": set_size,
                "uncertainty_score": round(uncertainty_score, 4),
                "uncertainty_status": uncertainty_status,
                "coverage_guarantee": f"{int((1 - self.alpha) * 100)}%",
            })

        return results
