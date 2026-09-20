from __future__ import annotations

import re
from typing import Any

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.feature_selection import mutual_info_classif
from sklearn.preprocessing import MinMaxScaler, StandardScaler

# ── HIPAA Safe Harbor 18 Protected Health Identifiers ─────────────────────────
SAFE_HARBOR_PATTERNS = [
    r"name", r"patient_name", r"mrn", r"ssn", r"phone", r"email", r"address",
    r"zip", r"postal", r"dob", r"birth", r"date_of_birth", r"medical_record",
    r"account", r"license", r"vehicle", r"device", r"ip_address", r"url", r"biometric"
]


def deidentify_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """Strips all 18 HIPAA Safe Harbor identifier columns prior to ML ingestion."""
    removed_cols = []
    clean_df = df.copy()
    for col in df.columns:
        col_lower = str(col).lower()
        if any(re.search(pat, col_lower) for pat in SAFE_HARBOR_PATTERNS):
            removed_cols.append(str(col))
            clean_df.drop(columns=[col], inplace=True)
    return clean_df, removed_cols


class QuantumPreprocessor:
    """Implements SRS Section 4.1 mathematical formulas:
    - Min-Max Normalization to [0, pi]
    - Z-Score Standardization
    - Mutual Information Feature Selection
    - PCA Dimensionality Reduction to n_qubits
    """

    def __init__(
        self,
        n_qubits: int = 8,
        scaling: str = "quantum_angle",  # 'quantum_angle' [0, pi] or 'standard'
        use_pca: bool = True,
        use_mi_selection: bool = False,
        top_k_features: int | None = None,
    ):
        self.n_qubits = n_qubits
        self.scaling = scaling
        self.use_pca = use_pca
        self.use_mi_selection = use_mi_selection
        self.top_k = top_k_features or n_qubits

        self.min_max_scaler = MinMaxScaler(feature_range=(0.0, np.pi))
        self.standard_scaler = StandardScaler()
        self.pca = PCA(n_components=n_qubits)
        self.selected_indices: np.ndarray | None = None
        self.fitted = False

    def fit(self, X: np.ndarray | pd.DataFrame, y: np.ndarray | pd.Series | None = None) -> QuantumPreprocessor:
        X_arr = np.asarray(X, dtype=np.float32)
        # 1. Feature selection via Mutual Information if requested
        if self.use_mi_selection and y is not None and X_arr.shape[1] > self.top_k:
            y_arr = np.asarray(y)
            mi_scores = mutual_info_classif(X_arr, y_arr, random_state=42)
            self.selected_indices = np.argsort(mi_scores)[::-1][:self.top_k]
            X_arr = X_arr[:, self.selected_indices]

        # 2. Fit scaler
        if self.scaling == "quantum_angle":
            self.min_max_scaler.fit(X_arr)
            X_scaled = self.min_max_scaler.transform(X_arr)
        else:
            self.standard_scaler.fit(X_arr)
            X_scaled = self.standard_scaler.transform(X_arr)

        # 3. Fit PCA if dimension exceeds or matches n_qubits
        if self.use_pca:
            n_comp = min(self.n_qubits, X_scaled.shape[1])
            self.pca = PCA(n_components=n_comp)
            self.pca.fit(X_scaled)

        self.fitted = True
        return self

    @property
    def explained_variance_ratio(self) -> float:
        if self.use_pca and hasattr(self.pca, "explained_variance_ratio_"):
            return float(self.pca.explained_variance_ratio_.sum())
        return 1.0

    def transform(self, X: np.ndarray | pd.DataFrame) -> np.ndarray:
        if not self.fitted:
            raise RuntimeError("QuantumPreprocessor must be fitted before transforming.")
        X_arr = np.asarray(X, dtype=np.float32)

        if self.selected_indices is not None and X_arr.shape[1] > len(self.selected_indices):
            X_arr = X_arr[:, self.selected_indices]

        if self.scaling == "quantum_angle":
            X_scaled = self.min_max_scaler.transform(X_arr)
            # Clip strictly to [0, pi]
            X_scaled = np.clip(X_scaled, 0.0, np.pi)
        else:
            X_scaled = self.standard_scaler.transform(X_arr)

        if self.use_pca:
            X_proj = self.pca.transform(X_scaled)
            # Rescale PCA projections into [0, pi] for angle encoding
            p_min, p_max = X_proj.min(axis=0), X_proj.max(axis=0)
            denom = np.where(p_max - p_min == 0, 1.0, p_max - p_min)
            X_out = (X_proj - p_min) / denom * np.pi
            return np.asarray(X_out, dtype=np.float32)

        return np.asarray(X_scaled, dtype=np.float32)

    def fit_transform(self, X: np.ndarray | pd.DataFrame, y: np.ndarray | pd.Series | None = None) -> np.ndarray:
        return self.fit(X, y).transform(X)


def smote_oversample(X: np.ndarray, y: np.ndarray, random_state: int = 42) -> tuple[np.ndarray, np.ndarray]:
    """Applies SMOTE (Synthetic Minority Over-sampling Technique) per SRS Section 4.1:
    x_new = x_i + lambda * (x_zi - x_i), lambda in [0, 1]
    """
    classes, counts = np.unique(y, return_counts=True)
    if len(classes) < 2 or counts[0] == counts[1]:
        return X, y

    maj_class = classes[np.argmax(counts)]
    min_class = classes[np.argmin(counts)]
    n_needed = counts.max() - counts.min()

    min_indices = np.where(y == min_class)[0]
    min_samples = X[min_indices]

    np.random.seed(random_state)
    synthetic_samples = []
    for _ in range(n_needed):
        idx = np.random.choice(len(min_samples))
        sample_i = min_samples[idx]
        # K-nearest neighbor distance in minority class
        dists = np.linalg.norm(min_samples - sample_i, axis=1)
        k_neighbors = np.argsort(dists)[1:6] if len(min_samples) > 5 else np.arange(len(min_samples))
        neighbor_idx = np.random.choice(k_neighbors)
        sample_zi = min_samples[neighbor_idx]

        lam = np.random.uniform(0.0, 1.0)
        diff = sample_zi - sample_i
        if np.allclose(diff, 0.0):
            diff = np.random.normal(0.0, 1e-7, size=sample_i.shape)
        new_sample = sample_i + lam * diff
        synthetic_samples.append(new_sample)

    X_aug = np.vstack([X, np.array(synthetic_samples, dtype=np.float32)])
    y_aug = np.concatenate([y, np.full(n_needed, min_class, dtype=y.dtype)])
    return X_aug, y_aug
