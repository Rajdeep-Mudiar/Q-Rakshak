from __future__ import annotations

import logging
import time
from typing import Any

import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.neural_network import MLPRegressor
from sklearn.svm import SVR
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

logger = logging.getLogger("ml.models.classical_regressors")


class ClassicalRegressionSuite:
    """Standardized Classical Machine Learning Regression Baseline Suite.
    Implements Ridge Regression, Support Vector Regressor (SVR), Random Forest Regressor,
    Gradient Boosting Regressor (GBDT), and Multi-Layer Perceptron Regressor (MLP).
    Ensures identical feature inputs and fair benchmarking against quantum regression models.
    """

    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.models: dict[str, Any] = {
            "Ridge Regression": Ridge(alpha=1.0, random_state=random_state),
            "SVR (RBF Kernel)": SVR(kernel="rbf", C=1.0, epsilon=0.1),
            "Random Forest Regressor": RandomForestRegressor(
                n_estimators=100, max_depth=8, random_state=random_state, n_jobs=-1
            ),
            "Gradient Boosting Regressor": GradientBoostingRegressor(
                n_estimators=100, max_depth=4, learning_rate=0.1, random_state=random_state
            ),
            "MLP Regressor": MLPRegressor(
                hidden_layer_sizes=(64, 32), max_iter=400, random_state=random_state, early_stopping=True
            ),
        }
        self.fit_runtimes: dict[str, float] = {}

    def fit_all(self, X: np.ndarray, y: np.ndarray) -> dict[str, float]:
        """Fits all classical regression baselines strictly on the training partition."""
        for name, model in self.models.items():
            start_t = time.perf_counter()
            model.fit(X, y)
            elapsed = time.perf_counter() - start_t
            self.fit_runtimes[name] = elapsed
            logger.info(f"Fitted classical regressor '{name}' in {elapsed:.4f}s")
        return self.fit_runtimes

    def predict_all(self, X: np.ndarray) -> dict[str, np.ndarray]:
        """Generates continuous predictions across all fitted regression models."""
        return {name: model.predict(X) for name, model in self.models.items()}

    def evaluate_all(self, X_test: np.ndarray, y_test: np.ndarray) -> dict[str, dict[str, float]]:
        """Evaluates all regression baselines on held-out test data."""
        results = {}
        for name, model in self.models.items():
            preds = model.predict(X_test)
            mse = mean_squared_error(y_test, preds)
            rmse = float(np.sqrt(mse))
            mae = float(mean_absolute_error(y_test, preds))
            r2 = float(r2_score(y_test, preds))

            if len(preds) > 1 and np.std(preds) > 1e-8 and np.std(y_test) > 1e-8:
                corr = float(np.corrcoef(y_test, preds)[0, 1])
            else:
                corr = 0.0

            results[name] = {
                "r2_score": round(r2, 4),
                "rmse": round(rmse, 4),
                "mae": round(mae, 4),
                "pearson_correlation": round(corr, 4),
                "fit_time_sec": round(self.fit_runtimes.get(name, 0.0), 4),
            }
        return results

    def get_model(self, name: str) -> Any:
        return self.models.get(name)
