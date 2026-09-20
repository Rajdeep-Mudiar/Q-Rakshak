from __future__ import annotations

import numpy as np
from scipy.stats import norm, chi2


def mcnemar_paired_test(y_true: np.ndarray, y_pred_a: np.ndarray, y_pred_b: np.ndarray) -> dict[str, float]:
    """McNemar's test for paired comparison between two classification models.
    H0: Model A and Model B have identical error rates.
    """
    y_true = np.asarray(y_true)
    y_pred_a = np.asarray(y_pred_a)
    y_pred_b = np.asarray(y_pred_b)

    correct_a = (y_pred_a == y_true)
    correct_b = (y_pred_b == y_true)

    # b: A correct, B incorrect; c: A incorrect, B correct
    b = int(np.sum(correct_a & ~correct_b))
    c = int(np.sum(~correct_a & correct_b))

    if (b + c) == 0:
        return {"statistic": 0.0, "p_value": 1.0, "significant": False}

    # Continuity corrected McNemar statistic
    statistic = float(((abs(b - c) - 1.0) ** 2) / (b + c))
    p_value = float(1.0 - chi2.cdf(statistic, df=1))

    return {
        "statistic": round(statistic, 4),
        "p_value": round(p_value, 6),
        "significant": p_value < 0.05,
        "n_a_only_correct": b,
        "n_b_only_correct": c,
    }


def delong_roc_test(y_true: np.ndarray, y_prob_a: np.ndarray, y_prob_b: np.ndarray) -> dict[str, float]:
    """DeLong test for comparing two correlated ROC curves on the same test set."""
    y_true = np.asarray(y_true)
    pos_idx = np.where(y_true == 1)[0]
    neg_idx = np.where(y_true == 0)[0]
    m, n = len(pos_idx), len(neg_idx)

    if m == 0 or n == 0:
        return {"z_score": 0.0, "p_value": 1.0, "significant": False}

    # Structural components
    v10_a = np.array([np.mean(y_prob_a[i] > y_prob_a[neg_idx]) + 0.5 * np.mean(y_prob_a[i] == y_prob_a[neg_idx]) for i in pos_idx])
    v01_a = np.array([np.mean(y_prob_a[pos_idx] > y_prob_a[j]) + 0.5 * np.mean(y_prob_a[pos_idx] == y_prob_a[j]) for j in neg_idx])

    v10_b = np.array([np.mean(y_prob_b[i] > y_prob_b[neg_idx]) + 0.5 * np.mean(y_prob_b[i] == y_prob_b[neg_idx]) for i in pos_idx])
    v01_b = np.array([np.mean(y_prob_b[pos_idx] > y_prob_b[j]) + 0.5 * np.mean(y_prob_b[pos_idx] == y_prob_b[j]) for j in neg_idx])

    auc_a = float(np.mean(v10_a))
    auc_b = float(np.mean(v10_b))

    s10 = np.cov(v10_a, v10_b) if m > 1 else np.zeros((2, 2))
    s01 = np.cov(v01_a, v01_b) if n > 1 else np.zeros((2, 2))

    s = (s10 / m) + (s01 / n)
    diff = auc_a - auc_b
    var_diff = max(s[0, 0] + s[1, 1] - 2 * s[0, 1], 1e-8)

    z = float(diff / np.sqrt(var_diff))
    p_value = float(2.0 * (1.0 - norm.cdf(abs(z))))

    return {
        "auc_a": round(auc_a, 4),
        "auc_b": round(auc_b, 4),
        "auc_diff": round(diff, 4),
        "z_score": round(z, 4),
        "p_value": round(p_value, 6),
        "significant": p_value < 0.05,
    }
