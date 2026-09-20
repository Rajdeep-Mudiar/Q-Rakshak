from __future__ import annotations

from typing import Any
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, roc_auc_score


def evaluate_subgroup_fairness(
    df_test: pd.DataFrame,
    subgroup_col: str,
    y_true_col: str,
    y_pred: np.ndarray,
    y_prob: np.ndarray | None = None,
) -> dict[str, Any]:
    """Evaluates fairness and performance parity across demographic subgroups."""
    if subgroup_col not in df_test.columns:
        return {"error": f"Subgroup column '{subgroup_col}' not found in dataframe"}

    subgroups = df_test[subgroup_col].unique()
    subgroup_metrics = {}

    for grp in subgroups:
        mask = (df_test[subgroup_col] == grp).values
        n_grp = int(np.sum(mask))
        if n_grp < 5:
            continue

        y_true_grp = df_test.iloc[mask][y_true_col].values
        y_pred_grp = y_pred[mask]
        acc = float(accuracy_score(y_true_grp, y_pred_grp))

        grp_res = {"sample_count": n_grp, "accuracy": round(acc, 4)}
        if y_prob is not None and len(np.unique(y_true_grp)) > 1:
            try:
                prob_grp = y_prob[mask, 1] if y_prob.ndim == 2 else y_prob[mask]
                grp_res["auc_roc"] = round(float(roc_auc_score(y_true_grp, prob_grp)), 4)
            except Exception:
                pass

        subgroup_metrics[str(grp)] = grp_res

    # Disparate impact ratio
    accuracies = [m["accuracy"] for m in subgroup_metrics.values()]
    disp_impact = min(accuracies) / max(accuracies) if accuracies and max(accuracies) > 0 else 1.0

    return {
        "subgroup_column": subgroup_col,
        "metrics_by_subgroup": subgroup_metrics,
        "disparity_ratio": round(float(disp_impact), 4),
        "fairness_flag": disp_impact >= 0.80,
    }
