from __future__ import annotations

import time
from typing import Any

import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC


class ClassicalBaselineSuite:
    """Trains and evaluates Sentinel classical machine learning baselines per SRS Section 4.6 & model.md:
    - Sentinel-LogReg: Logistic Regression (L2 regularization with StandardScaler)
    - Sentinel-RF: Random Forest (100-300 estimators)
    - Sentinel-SVM: Classical SVM (RBF kernel calibrated)
    - Sentinel-XGB: Gradient Boosted Trees (HistGradientBoosting)
    - Sentinel-MLP: Multi-Layer Perceptron (MLP with StandardScaler)
    """

    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        logreg = make_pipeline(
            StandardScaler(),
            LogisticRegression(max_iter=1000, random_state=random_state),
        )
        rf = RandomForestClassifier(n_estimators=200, max_depth=8, random_state=random_state)
        svm = make_pipeline(
            StandardScaler(),
            CalibratedClassifierCV(SVC(kernel="rbf", C=10.0, random_state=random_state), cv=2),
        )
        xgb = HistGradientBoostingClassifier(max_iter=150, max_depth=6, random_state=random_state)
        mlp = make_pipeline(
            StandardScaler(),
            MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, alpha=0.001, random_state=random_state),
        )

        self.models: dict[str, Any] = {
            "Sentinel-LogReg": logreg,
            "Sentinel-RF": rf,
            "Sentinel-SVM": svm,
            "Sentinel-XGB": xgb,
            "Sentinel-MLP": mlp,
            # Backwards-compatible aliases for clinical controller & test suite
            "Logistic Regression": logreg,
            "Random Forest": rf,
            "SVM": svm,
            "Gradient Boosting": xgb,
            "MLP": mlp,
        }
        self.fit_times: dict[str, float] = {}

    def fit_all(self, X_train: np.ndarray, y_train: np.ndarray) -> dict[str, float]:
        primary_names = ["Sentinel-LogReg", "Sentinel-RF", "Sentinel-SVM", "Sentinel-XGB", "Sentinel-MLP"]
        alias_map = {
            "Sentinel-LogReg": "Logistic Regression",
            "Sentinel-RF": "Random Forest",
            "Sentinel-SVM": "SVM",
            "Sentinel-XGB": "Gradient Boosting",
            "Sentinel-MLP": "MLP",
        }
        for name in primary_names:
            model = self.models[name]
            start = time.perf_counter()
            model.fit(X_train, y_train)
            dur = time.perf_counter() - start
            self.fit_times[name] = dur
            if name in alias_map:
                self.fit_times[alias_map[name]] = dur
        return self.fit_times

    def predict(self, name: str, X_test: np.ndarray) -> tuple[np.ndarray, float]:
        model = self.models[name]
        start = time.perf_counter()
        preds = model.predict(X_test)
        elapsed = time.perf_counter() - start
        return preds, elapsed

    def predict_proba(self, name: str, X_test: np.ndarray) -> np.ndarray:
        model = self.models[name]
        return model.predict_proba(X_test)

    def predict_all(self, X_test: np.ndarray) -> dict[str, np.ndarray]:
        return {name: model.predict(X_test) for name, model in self.models.items()}

    def predict_proba_all(self, X_test: np.ndarray) -> dict[str, np.ndarray]:
        return {name: model.predict_proba(X_test) for name, model in self.models.items()}

