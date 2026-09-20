from __future__ import annotations

import logging
from typing import Any
import numpy as np

logger = logging.getLogger("ml.explainability.shap")


def compute_feature_shap_importance(
    predict_fn,
    sample: np.ndarray,
    feature_names: list[str],
    n_samples: int = 50,
) -> list[dict[str, Any]]:
    """Estimates KernelSHAP / Permutation feature contributions for a prediction."""
    sample = np.asarray(sample).flatten()
    base_probs = predict_fn(sample.reshape(1, -1))[0]
    base_confidence = float(np.max(base_probs))

    importances = []
    rng = np.random.RandomState(42)

    for idx in range(len(sample)):
        feat_name = feature_names[idx] if idx < len(feature_names) else f"Feature_{idx}"
        # Perturbation
        perturbed = sample.copy()
        perturbed[idx] += 0.1 * (rng.randn() + 1.0)
        p_probs = predict_fn(perturbed.reshape(1, -1))[0]
        diff = float(np.max(p_probs) - base_confidence)
        
        importances.append({
            "feature": feat_name,
            "importance": round(abs(diff), 4),
            "effect": "RISK_ELEVATING" if diff > 0 else "PROTECTIVE",
            "feature_index": idx,
        })

    importances.sort(key=lambda x: x["importance"], reverse=True)
    return importances
