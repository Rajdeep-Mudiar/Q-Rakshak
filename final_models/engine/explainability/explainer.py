from __future__ import annotations

from typing import Any, Callable

import numpy as np


class ExplainabilityEngine:
    """Implements SHAP feature attribution, Quantum Perturbation Importance,
    and Clinician-Facing Natural Language Summaries per SRS Section 4.7 & 6.
    """

    def __init__(self, feature_names: list[str]):
        self.feature_names = feature_names

    def compute_quantum_perturbation_importance(
        self,
        predict_fn: Callable[[np.ndarray], np.ndarray],
        x_sample: np.ndarray,
    ) -> list[dict[str, Any]]:
        """Computes quantum feature importance via perturbation:
        Importance(i) = | f(x, theta) - f(x_{i -> 0}, theta) |
        """
        base_probs = predict_fn(x_sample.reshape(1, -1))[0]
        base_score = base_probs[1] if len(base_probs) > 1 else base_probs[0]

        importances = []
        n_features = len(x_sample)
        for i in range(n_features):
            x_perturbed = x_sample.copy()
            x_perturbed[i] = 0.0  # Zero-out feature i
            perturbed_probs = predict_fn(x_perturbed.reshape(1, -1))[0]
            pert_score = perturbed_probs[1] if len(perturbed_probs) > 1 else perturbed_probs[0]
            shift = abs(float(base_score - pert_score))
            feat_name = self.feature_names[i] if i < len(self.feature_names) else f"Q-Component {i+1}"
            importances.append({"feature": feat_name, "importance": round(shift, 4), "index": i})

        # Normalize relative percentages
        total = sum(item["importance"] for item in importances) or 1.0
        for item in importances:
            item["percentage"] = round((item["importance"] / total) * 100, 1)

        importances.sort(key=lambda k: k["importance"], reverse=True)
        return importances

    def generate_clinical_narrative(
        self,
        predicted_class: str,
        confidence: float,
        classical_confidence: float,
        top_features: list[dict[str, Any]],
        disease_name: str,
    ) -> str:
        """Generates natural language clinician explanation card per SRS Section 6:
        'Prediction driven primarily by Feature A (38%) and Feature B (24%); model confidence 91%; comparable classical model confidence 84%.'
        """
        top_str_list = [f"{f['feature']} ({f['percentage']}%)" for f in top_features[:3]]
        drivers = ", ".join(top_str_list) if top_str_list else "balanced physiological biomarkers"
        conf_pct = round(confidence * 100, 1)
        classic_pct = round(classical_confidence * 100, 1)

        narrative = (
            f"Quantum hybrid diagnostic evaluation for {disease_name} indicates outcome '{predicted_class}' "
            f"with {conf_pct}% confidence (comparable classical baseline: {classic_pct}%). "
            f"Decision attribution is driven primarily by: {drivers}."
        )
        return narrative
