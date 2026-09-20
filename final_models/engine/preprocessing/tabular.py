from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.feature_selection import mutual_info_classif, mutual_info_regression
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder, StandardScaler

logger = logging.getLogger("ml.preprocessing.tabular")


class ClinicalTabularPreprocessor:
    """Production Clinical Tabular Preprocessing Pipeline ensuring Zero Data Leakage.
    Implements:
    - Missing-value imputation (Median for numerical, Most Frequent for categorical, fitted strictly on train).
    - Duplicate record detection and audit logging.
    - Categorical variable encoding (One-Hot with handle_unknown='ignore').
    - Outlier detection and IQR-based boundary clipping.
    - Feature scaling: Quantum Angle Normalization [0, pi] or Z-Score Standardization.
    - Dimensionality reduction & Feature Selection to quantum qubit budgets (4, 6, 8, 10).
    """

    def __init__(
        self,
        target_qubits: Optional[int] = 8,
        scaling: str = "quantum_angle",  # 'quantum_angle' [0, pi] or 'standard'
        handle_outliers: bool = True,
        outlier_iqr_multiplier: float = 2.5,
        reduction_method: str = "pca",  # 'pca', 'mutual_info', or 'none'
        random_state: int = 42,
    ):
        self.target_qubits = target_qubits
        self.scaling = scaling
        self.handle_outliers = handle_outliers
        self.outlier_iqr_multiplier = outlier_iqr_multiplier
        self.reduction_method = reduction_method
        self.random_state = random_state

        self.num_imputer = SimpleImputer(strategy="median")
        self.cat_imputer = SimpleImputer(strategy="most_frequent")
        self.one_hot_encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
        self.quantum_scaler = MinMaxScaler(feature_range=(0.0, np.pi))
        self.standard_scaler = StandardScaler()
        self.pca = PCA(n_components=target_qubits, random_state=random_state) if target_qubits else None

        self.numerical_cols: List[str] = []
        self.categorical_cols: List[str] = []
        self.outlier_bounds: Dict[str, Tuple[float, float]] = {}
        self.selected_feature_indices: Optional[np.ndarray] = None
        self.audit_log: Dict[str, Any] = {}
        self.fitted = False

    def detect_and_purge_duplicates(self, df: pd.DataFrame, subset_cols: Optional[List[str]] = None) -> Tuple[pd.DataFrame, int]:
        """Identifies and purges duplicate patient records, logging findings for clinical auditability."""
        n_initial = len(df)
        df_dedup = df.drop_duplicates(subset=subset_cols).copy()
        n_purged = n_initial - len(df_dedup)
        if n_purged > 0:
            logger.info(f"Audit: Detected and purged {n_purged} duplicate records from clinical partition.")
        return df_dedup, n_purged

    def fit(self, X: pd.DataFrame, y: Optional[Union[pd.Series, np.ndarray]] = None) -> ClinicalTabularPreprocessor:
        """Fits all statistical transformations STRICTLY on the training partition to guarantee zero data leakage."""
        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X)

        df = X.copy()
        self.numerical_cols = list(df.select_dtypes(include=[np.number]).columns)
        self.categorical_cols = [c for c in df.columns if c not in self.numerical_cols]

        # 1. Fit numerical missing value imputer
        if self.numerical_cols:
            self.num_imputer.fit(df[self.numerical_cols])
            num_imputed = self.num_imputer.transform(df[self.numerical_cols])
            df_num = pd.DataFrame(num_imputed, columns=self.numerical_cols, index=df.index)

            # Fit outlier boundaries (IQR) strictly on train
            if self.handle_outliers:
                for col in self.numerical_cols:
                    q25 = float(df_num[col].quantile(0.25))
                    q75 = float(df_num[col].quantile(0.75))
                    iqr = q75 - q25
                    lower = q25 - (self.outlier_iqr_multiplier * iqr)
                    upper = q75 + (self.outlier_iqr_multiplier * iqr)
                    self.outlier_bounds[col] = (lower, upper)
                    # Clip train data
                    df_num[col] = df_num[col].clip(lower=lower, upper=upper)
        else:
            df_num = pd.DataFrame(index=df.index)

        # 2. Fit categorical imputer and one-hot encoder
        if self.categorical_cols:
            self.cat_imputer.fit(df[self.categorical_cols])
            cat_imputed = self.cat_imputer.transform(df[self.categorical_cols])
            self.one_hot_encoder.fit(cat_imputed)
            cat_encoded = self.one_hot_encoder.transform(cat_imputed)
            encoded_names = list(self.one_hot_encoder.get_feature_names_out(self.categorical_cols))
            df_cat = pd.DataFrame(cat_encoded, columns=encoded_names, index=df.index)
        else:
            df_cat = pd.DataFrame(index=df.index)

        # Combine numerical and encoded categorical features
        if not df_num.empty and not df_cat.empty:
            processed_matrix = np.hstack([df_num.values, df_cat.values])
        elif not df_num.empty:
            processed_matrix = df_num.values
        else:
            processed_matrix = df_cat.values

        # 3. Fit scaler
        if self.scaling == "quantum_angle":
            self.quantum_scaler.fit(processed_matrix)
            scaled_matrix = self.quantum_scaler.transform(processed_matrix)
        else:
            self.standard_scaler.fit(processed_matrix)
            scaled_matrix = self.standard_scaler.transform(processed_matrix)

        # 4. Fit feature selection or dimensionality reduction for quantum budget
        if self.target_qubits is not None and processed_matrix.shape[1] > self.target_qubits:
            if self.reduction_method == "mutual_info" and y is not None:
                y_arr = np.asarray(y)
                if np.issubdtype(y_arr.dtype, np.integer) or len(np.unique(y_arr)) < 10:
                    mi_scores = mutual_info_classif(scaled_matrix, y_arr, random_state=self.random_state)
                else:
                    mi_scores = mutual_info_regression(scaled_matrix, y_arr, random_state=self.random_state)
                self.selected_feature_indices = np.argsort(mi_scores)[::-1][:self.target_qubits]
            elif self.reduction_method == "pca":
                n_comp = min(self.target_qubits, scaled_matrix.shape[1])
                self.pca = PCA(n_components=n_comp, random_state=self.random_state)
                self.pca.fit(scaled_matrix)

        self.fitted = True
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        """Applies fitted transformations to unseen validation/test data without leakage."""
        if not self.fitted:
            raise RuntimeError("ClinicalTabularPreprocessor must be fitted on training data before transforming.")

        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X)

        df = X.copy()

        # 1. Transform numerical features
        if self.numerical_cols:
            num_imputed = self.num_imputer.transform(df[self.numerical_cols])
            df_num = pd.DataFrame(num_imputed, columns=self.numerical_cols, index=df.index)

            # Apply training outlier bounds
            if self.handle_outliers:
                for col in self.numerical_cols:
                    if col in self.outlier_bounds:
                        lower, upper = self.outlier_bounds[col]
                        df_num[col] = df_num[col].clip(lower=lower, upper=upper)
        else:
            df_num = pd.DataFrame(index=df.index)

        # 2. Transform categorical features
        if self.categorical_cols:
            cat_imputed = self.cat_imputer.transform(df[self.categorical_cols])
            cat_encoded = self.one_hot_encoder.transform(cat_imputed)
            encoded_names = list(self.one_hot_encoder.get_feature_names_out(self.categorical_cols))
            df_cat = pd.DataFrame(cat_encoded, columns=encoded_names, index=df.index)
        else:
            df_cat = pd.DataFrame(index=df.index)

        # Combine
        if not df_num.empty and not df_cat.empty:
            processed_matrix = np.hstack([df_num.values, df_cat.values])
        elif not df_num.empty:
            processed_matrix = df_num.values
        else:
            processed_matrix = df_cat.values

        # 3. Apply fitted scaling
        if self.scaling == "quantum_angle":
            scaled_matrix = self.quantum_scaler.transform(processed_matrix)
        else:
            scaled_matrix = self.standard_scaler.transform(processed_matrix)

        # 4. Apply fitted dimensionality reduction / selection
        if self.target_qubits is not None and processed_matrix.shape[1] > self.target_qubits:
            if self.selected_feature_indices is not None:
                scaled_matrix = scaled_matrix[:, self.selected_feature_indices]
            elif self.pca is not None:
                scaled_matrix = self.pca.transform(scaled_matrix)

        return scaled_matrix.astype(np.float32)

    def fit_transform(self, X: pd.DataFrame, y: Optional[Union[pd.Series, np.ndarray]] = None) -> np.ndarray:
        return self.fit(X, y).transform(X)
