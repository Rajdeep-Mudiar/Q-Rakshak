from __future__ import annotations

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    matthews_corrcoef,
    precision_score,
    recall_score,
    roc_auc_score,
)


def compute_expected_calibration_error(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10) -> float:
    """Computes Expected Calibration Error (ECE) across confidence bins."""
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    n_samples = len(y_true)

    for i in range(n_bins):
        bin_lower, bin_upper = bin_boundaries[i], bin_boundaries[i + 1]
        in_bin = (y_prob >= bin_lower) & (y_prob < bin_upper) if i < n_bins - 1 else (y_prob >= bin_lower) & (y_prob <= bin_upper)
        prop_in_bin = np.mean(in_bin)

        if prop_in_bin > 0:
            accuracy_in_bin = np.mean(y_true[in_bin])
            avg_confidence_in_bin = np.mean(y_prob[in_bin])
            ece += np.abs(avg_confidence_in_bin - accuracy_in_bin) * prop_in_bin

    return float(ece)


def evaluate_clinical_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: np.ndarray | None = None,
    inference_time_sec: float | None = None,
) -> dict[str, float]:
    """Computes the full medical metric suite defined in MODEL.md."""
    y_true = np.asarray(y_true).astype(int)
    y_pred = np.asarray(y_pred).astype(int)

    # Confusion matrix elements
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    if cm.shape == (2, 2):
        tn, fp, fn, tp = cm.ravel()
    else:
        tn, fp, fn, tp = 0, 0, 0, len(y_true)

    sens = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    npv = tn / (tn + fn) if (tn + fn) > 0 else 0.0

    acc = float(accuracy_score(y_true, y_pred))
    bal_acc = float(balanced_accuracy_score(y_true, y_pred))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    mcc = float(matthews_corrcoef(y_true, y_pred))

    # Threshold-independent metrics
    if y_prob is not None:
        if y_prob.ndim == 2:
            pos_prob = y_prob[:, 1]
        else:
            pos_prob = y_prob
        try:
            auc_roc = float(roc_auc_score(y_true, pos_prob))
        except Exception:
            auc_roc = 0.5
        try:
            auprc = float(average_precision_score(y_true, pos_prob))
        except Exception:
            auprc = float(np.mean(y_true))
        try:
            brier = float(brier_score_loss(y_true, pos_prob))
        except Exception:
            brier = 0.25
        ece = compute_expected_calibration_error(y_true, pos_prob)
    else:
        auc_roc = float(acc)
        auprc = float(acc)
        brier = 0.0
        ece = 0.0

    metrics = {
        "accuracy": round(acc, 4),
        "balanced_accuracy": round(bal_acc, 4),
        "sensitivity": round(sens, 4),
        "specificity": round(spec, 4),
        "precision": round(prec, 4),
        "ppv": round(prec, 4),
        "npv": round(npv, 4),
        "f1": round(f1, 4),
        "auc_roc": round(auc_roc, 4),
        "auprc": round(auprc, 4),
        "mcc": round(mcc, 4),
        "brier_score": round(brier, 4),
        "calibration_error": round(ece, 4),
        "confusion_matrix": cm.tolist(),
    }

    if inference_time_sec is not None:
        metrics["inference_time_ms"] = round(inference_time_sec * 1000, 2)

    return metrics


def compute_quantum_advantage_score(
    acc_quantum: float,
    acc_classical: float,
    t_classical_sec: float,
    t_quantum_sec: float,
) -> float:
    """Computes Quantum Advantage Score per SRS & MODEL.md formula:
    QAS = ((Acc_q - Acc_c) / Acc_c) * (T_c / T_q)
    """
    if acc_classical <= 0 or t_quantum_sec <= 0:
        return 0.0
    acc_diff_ratio = (acc_quantum - acc_classical) / acc_classical
    time_ratio = t_classical_sec / t_quantum_sec
    return round(float(acc_diff_ratio * time_ratio), 6)
