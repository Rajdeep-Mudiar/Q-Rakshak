from __future__ import annotations

import numpy as np
from scipy.optimize import minimize
from sklearn.linear_model import LogisticRegression


def compute_expected_calibration_error(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10) -> float:
    """Computes Expected Calibration Error (ECE)."""
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    for i in range(n_bins):
        bin_lower, bin_upper = bin_boundaries[i], bin_boundaries[i + 1]
        in_bin = (y_prob >= bin_lower) & (y_prob < bin_upper) if i < n_bins - 1 else (y_prob >= bin_lower) & (y_prob <= bin_upper)
        prop_in_bin = np.mean(in_bin)
        if prop_in_bin > 0:
            accuracy_in_bin = np.mean(y_true[in_bin])
            avg_conf_in_bin = np.mean(y_prob[in_bin])
            ece += np.abs(avg_conf_in_bin - accuracy_in_bin) * prop_in_bin
    return float(ece)


class TemperatureScaler:
    """Temperature Scaling post-processing calibrator for neural/quantum networks."""

    def __init__(self):
        self.temperature = 1.0
        self.is_fitted = False

    def fit(self, logits: np.ndarray, y_val: np.ndarray) -> TemperatureScaler:
        """Optimizes temperature T > 0 strictly on the validation partition via NLL minimization."""
        logits_arr = np.asarray(logits, dtype=np.float64)
        y_val_arr = np.asarray(y_val, dtype=np.int64)

        def _nll(temp_arr):
            t = max(temp_arr[0], 1e-4)
            scaled = logits_arr / t
            # Stable log-sum-exp
            max_val = np.max(scaled, axis=1, keepdims=True)
            log_sum = max_val + np.log(np.sum(np.exp(scaled - max_val), axis=1, keepdims=True))
            log_probs = scaled - log_sum
            return -np.mean(log_probs[np.arange(len(y_val_arr)), y_val_arr])

        res = minimize(_nll, [1.0], bounds=[(0.01, 10.0)], method="L-BFGS-B")
        self.temperature = float(res.x[0])
        self.is_fitted = True
        return self

    def transform(self, logits: np.ndarray) -> np.ndarray:
        """Returns calibrated probabilities."""
        t = max(self.temperature, 1e-4)
        scaled = np.asarray(logits, dtype=np.float64) / t
        exp_scaled = np.exp(scaled - np.max(scaled, axis=-1, keepdims=True))
        return exp_scaled / np.sum(exp_scaled, axis=-1, keepdims=True)


class PlattScaler:
    """Platt Scaling (logistic regression calibration on validation scores)."""

    def __init__(self):
        self.clf = LogisticRegression(C=1.0, solver="lbfgs")
        self.is_fitted = False

    def fit(self, scores: np.ndarray, y_val: np.ndarray) -> PlattScaler:
        if scores.ndim == 1:
            scores = scores.reshape(-1, 1)
        self.clf.fit(scores, y_val)
        self.is_fitted = True
        return self

    def transform(self, scores: np.ndarray) -> np.ndarray:
        if scores.ndim == 1:
            scores = scores.reshape(-1, 1)
        return self.clf.predict_proba(scores)
