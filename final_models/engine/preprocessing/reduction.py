from __future__ import annotations

import logging
from typing import Literal
import numpy as np
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, mutual_info_classif
from sklearn.preprocessing import MinMaxScaler, StandardScaler

logger = logging.getLogger("ml.preprocessing.reduction")


class DimensionalityReducer:
    """Train-Only Fitted Dimensionality Reduction and Quantum Angle Scaling Pipeline.
    Strictly prevents test-set statistics leakage.
    """

    def __init__(
        self,
        target_dim: int = 8,
        method: Literal["pca", "mutual_info", "standard_scaler"] = "pca",
        angle_scaling: bool = True,
        random_state: int = 42,
    ):
        self.target_dim = target_dim
        self.method = method
        self.angle_scaling = angle_scaling
        self.random_state = random_state

        self.scaler = StandardScaler()
        self.pca = PCA(n_components=target_dim, random_state=random_state) if method == "pca" else None
        self.selector = (
            SelectKBest(score_func=mutual_info_classif, k=target_dim) if method == "mutual_info" else None
        )
        self.angle_scaler = MinMaxScaler(feature_range=(0, np.pi)) if angle_scaling else None
        self.is_fitted = False
        self.explained_variance_ratio_: float = 0.0

    def fit(self, X_train: np.ndarray, y_train: np.ndarray | None = None) -> DimensionalityReducer:
        """Fits scalers, PCA, or feature selector EXCLUSIVELY on training data."""
        if X_train.ndim == 1:
            X_train = X_train.reshape(1, -1)

        # 1. Fit Standard Scaler
        X_scaled = self.scaler.fit_transform(X_train)

        # 2. Fit Dimensionality Reducer
        n_features = X_train.shape[1]
        n_components = min(self.target_dim, n_features)

        if self.method == "pca":
            self.pca = PCA(n_components=n_components, random_state=self.random_state)
            X_red = self.pca.fit_transform(X_scaled)
            self.explained_variance_ratio_ = float(np.sum(self.pca.explained_variance_ratio_))
            logger.info(f"Fitted PCA: {n_features} -> {n_components} dims (Retained Var: {self.explained_variance_ratio_:.3f})")
        elif self.method == "mutual_info" and y_train is not None:
            self.selector = SelectKBest(score_func=mutual_info_classif, k=n_components)
            X_red = self.selector.fit_transform(X_scaled, y_train)
        else:
            X_red = X_scaled[:, :n_components]

        # 3. Fit Angle Scaler for Quantum Encoding [0, pi]
        if self.angle_scaling and self.angle_scaler is not None:
            self.angle_scaler.fit(X_red)

        self.is_fitted = True
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        """Transforms validation, test, or inference data using the fitted parameters."""
        if not self.is_fitted:
            raise RuntimeError("DimensionalityReducer must be fitted on training data before calling transform.")

        is_1d = X.ndim == 1
        if is_1d:
            X = X.reshape(1, -1)

        X_scaled = self.scaler.transform(X)

        if self.method == "pca" and self.pca is not None:
            X_red = self.pca.transform(X_scaled)
        elif self.method == "mutual_info" and self.selector is not None:
            X_red = self.selector.transform(X_scaled)
        else:
            X_red = X_scaled[:, : self.target_dim]

        # Pad with zeros if input features are fewer than target_dim
        if X_red.shape[1] < self.target_dim:
            pad_w = self.target_dim - X_red.shape[1]
            X_red = np.pad(X_red, ((0, 0), (0, pad_w)), mode="constant", constant_values=0.0)

        if self.angle_scaling and self.angle_scaler is not None:
            X_red = self.angle_scaler.transform(X_red)
            X_red = np.clip(X_red, 0.0, np.pi)

        return X_red[0] if is_1d else X_red

    def fit_transform(self, X_train: np.ndarray, y_train: np.ndarray | None = None) -> np.ndarray:
        """Helper to fit on training data and return transformed training representations."""
        self.fit(X_train, y_train)
        return self.transform(X_train)
