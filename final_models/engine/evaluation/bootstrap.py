from __future__ import annotations

from typing import Any
import numpy as np
from sklearn.metrics import roc_auc_score


def compute_bootstrap_ci(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    metric_func=roc_auc_score,
    n_bootstraps: int = 1000,
    ci: float = 0.95,
    random_state: int = 42,
) -> dict[str, float]:
    """Computes non-parametric empirical bootstrap confidence intervals (e.g. 95% CI on AUROC)."""
    rng = np.random.RandomState(random_state)
    bootstrapped_scores = []
    n_samples = len(y_true)

    for _ in range(n_bootstraps):
        indices = rng.randint(0, n_samples, n_samples)
        if len(np.unique(y_true[indices])) < 2:
            continue
        try:
            score = metric_func(y_true[indices], y_prob[indices])
            bootstrapped_scores.append(score)
        except Exception:
            continue

    if not bootstrapped_scores:
        base_score = float(metric_func(y_true, y_prob))
        return {"mean": base_score, "ci_lower": base_score, "ci_upper": base_score, "std": 0.0}

    alpha = (1.0 - ci) / 2.0
    lower = float(np.percentile(bootstrapped_scores, 100 * alpha))
    upper = float(np.percentile(bootstrapped_scores, 100 * (1.0 - alpha)))
    mean = float(np.mean(bootstrapped_scores))
    std = float(np.std(bootstrapped_scores))

    return {
        "mean": round(mean, 4),
        "ci_lower": round(lower, 4),
        "ci_upper": round(upper, 4),
        "std": round(std, 4),
    }


def aggregate_multiseed_results(seed_results: list[dict[str, float]]) -> dict[str, dict[str, float]]:
    """Aggregates performance across the 5 standard seeds (7, 21, 42, 73, 101)."""
    if not seed_results:
        return {}

    metric_keys = list(seed_results[0].keys())
    aggregated = {}

    for k in metric_keys:
        vals = [r[k] for r in seed_results if k in r and isinstance(r[k], (int, float))]
        if vals:
            aggregated[k] = {
                "mean": round(float(np.mean(vals)), 4),
                "std": round(float(np.std(vals)), 4),
                "min": round(float(np.min(vals)), 4),
                "max": round(float(np.max(vals)), 4),
            }

    return aggregated
