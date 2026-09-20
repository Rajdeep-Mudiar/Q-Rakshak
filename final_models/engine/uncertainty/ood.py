from __future__ import annotations

import logging
from typing import Any
import numpy as np
from sklearn.ensemble import IsolationForest

logger = logging.getLogger("ml.uncertainty.ood")


class MahalanobisOODDetector:
    """Class-Conditional Mahalanobis Distance Out-of-Distribution (OOD) Detector."""

    def __init__(self, threshold_percentile: float = 95.0):
        self.threshold_percentile = threshold_percentile
        self.class_means_: dict[int, np.ndarray] = {}
        self.precision_matrix_: np.ndarray | None = None
        self.threshold_: float = 10.0
        self.is_fitted = False

    def fit(self, X_train: np.ndarray, y_train: np.ndarray) -> MahalanobisOODDetector:
        """Fits class centroids and pooled covariance matrix strictly on training embeddings."""
        X = np.asarray(X_train, dtype=np.float64)
        y = np.asarray(y_train, dtype=np.int64)

        classes = np.unique(y)
        pooled_cov = np.zeros((X.shape[1], X.shape[1]), dtype=np.float64)

        for c in classes:
            X_c = X[y == c]
            mean_c = np.mean(X_c, axis=0)
            self.class_means_[int(c)] = mean_c
            diff = X_c - mean_c
            cov_c = np.dot(diff.T, diff)
            pooled_cov += cov_c

        pooled_cov /= max(len(X) - len(classes), 1)
        # Regularization for numerical stability
        pooled_cov += np.eye(X.shape[1]) * 1e-4
        self.precision_matrix_ = np.linalg.pinv(pooled_cov)
        self.is_fitted = True

        # Compute training distances to set threshold
        train_distances = self.compute_distances(X)
        self.threshold_ = float(np.percentile(train_distances, self.threshold_percentile))
        logger.info(f"Fitted Mahalanobis OOD Detector: threshold={self.threshold_:.3f}")
        return self

    def compute_distances(self, X: np.ndarray) -> np.ndarray:
        """Computes minimum Mahalanobis distance to any class centroid."""
        if not self.is_fitted or self.precision_matrix_ is None:
            raise RuntimeError("MahalanobisOODDetector must be fitted first.")
        X = np.asarray(X, dtype=np.float64)
        if X.ndim == 1:
            X = X.reshape(1, -1)

        min_distances = []
        for x in X:
            dists = []
            for c, mean_c in self.class_means_.items():
                diff = x - mean_c
                dist = np.sqrt(np.dot(np.dot(diff, self.precision_matrix_), diff.T))
                dists.append(dist)
            min_distances.append(min(dists))
        return np.array(min_distances, dtype=np.float32)

    def predict_ood(self, X: np.ndarray) -> dict[str, Any]:
        """Returns boolean OOD flags and continuous normalized anomaly scores."""
        dists = self.compute_distances(X)
        is_ood = dists > self.threshold_
        # Normalized score: 0 (in distribution) -> 1 (extreme OOD)
        norm_scores = np.clip(dists / (self.threshold_ * 1.5), 0.0, 1.0)
        return {
            "ood_detected": bool(is_ood[0]) if len(is_ood) == 1 else is_ood.tolist(),
            "ood_score": round(float(norm_scores[0]), 4) if len(norm_scores) == 1 else norm_scores.tolist(),
            "distance": round(float(dists[0]), 4) if len(dists) == 1 else dists.tolist(),
            "threshold": round(self.threshold_, 4),
        }


class IsolationForestOODDetector:
    """Non-parametric Isolation Forest OOD detector for arbitrary feature spaces."""

    def __init__(self, contamination: float = 0.05, random_state: int = 42):
        self.clf = IsolationForest(contamination=contamination, random_state=random_state)
        self.is_fitted = False

    def fit(self, X_train: np.ndarray) -> IsolationForestOODDetector:
        self.clf.fit(X_train)
        self.is_fitted = True
        return self

    def predict_ood(self, X: np.ndarray) -> dict[str, Any]:
        if not self.is_fitted:
            raise RuntimeError("IsolationForestOODDetector must be fitted first.")
        X = np.asarray(X)
        if X.ndim == 1:
            X = X.reshape(1, -1)
        preds = self.clf.predict(X)  # 1 = inlier, -1 = outlier
        scores = self.clf.decision_function(X)
        # Invert score so higher = more anomalous
        norm_scores = np.clip(1.0 - (scores + 0.5), 0.0, 1.0)
        is_ood = preds == -1
        return {
            "ood_detected": bool(is_ood[0]) if len(is_ood) == 1 else is_ood.tolist(),
            "ood_score": round(float(norm_scores[0]), 4) if len(norm_scores) == 1 else norm_scores.tolist(),
        }
