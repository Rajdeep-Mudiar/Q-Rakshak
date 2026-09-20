from __future__ import annotations

import logging
import time
from typing import Any

import numpy as np
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.svm import SVC

logger = logging.getLogger("ml.models.classical")


class ClassicalBaselineSuite:
    """Unified Classical Machine Learning Baseline Suite.
    Implements Logistic Regression, SVM (RBF), Random Forest, XGBoost/GBDT, and Multi-Layer Perceptron (MLP).
    Ensures identical feature inputs and fair benchmarking against quantum models.
    """

    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.models: dict[str, Any] = {
            "Logistic Regression": LogisticRegression(
                C=1.0, max_iter=500, random_state=random_state, solver="lbfgs"
            ),
            "SVM (RBF)": SVC(
                kernel="rbf", C=1.0, probability=True, random_state=random_state
            ),
            "Random Forest": RandomForestClassifier(
                n_estimators=100, max_depth=8, random_state=random_state, n_jobs=-1
            ),
            "Gradient Boosting": GradientBoostingClassifier(
                n_estimators=100, max_depth=4, learning_rate=0.1, random_state=random_state
            ),
            "MLP Classifier": MLPClassifier(
                hidden_layer_sizes=(64, 32), max_iter=400, random_state=random_state, early_stopping=True
            ),
        }
        self.fit_runtimes: dict[str, float] = {}

    def fit_all(self, X: np.ndarray, y: np.ndarray) -> dict[str, float]:
        """Fits all classical baselines on training split exclusively and records training wall time."""
        for name, model in self.models.items():
            start_t = time.perf_counter()
            model.fit(X, y)
            elapsed = time.perf_counter() - start_t
            self.fit_runtimes[name] = elapsed
            logger.info(f"Fitted classical baseline '{name}' in {elapsed:.4f}s")
        return self.fit_runtimes

    def predict_all(self, X: np.ndarray) -> dict[str, np.ndarray]:
        """Generates predictions across all fitted classical models."""
        return {name: model.predict(X) for name, model in self.models.items()}

    def predict_proba_all(self, X: np.ndarray) -> dict[str, np.ndarray]:
        """Generates class probability distributions across all fitted classical models."""
        probas = {}
        for name, model in self.models.items():
            if hasattr(model, "predict_proba"):
                probas[name] = model.predict_proba(X)
            elif hasattr(model, "decision_function"):
                df = model.decision_function(X)
                exp = np.exp(df - np.max(df, axis=-1, keepdims=True))
                probas[name] = exp / np.sum(exp, axis=-1, keepdims=True)
        return probas

    def get_model(self, name: str) -> Any:
        return self.models.get(name)
