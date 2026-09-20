"""Comprehensive Clinical Metrics & Calibration Evaluator for Kaggle Fine-Tuning."""

from __future__ import annotations

import time
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    matthews_corrcoef,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from typing import Dict, Any, Union


def compute_ece(probs: np.ndarray, y_true: np.ndarray, n_bins: int = 10) -> float:
    """Computes Expected Calibration Error (ECE)."""
    if probs.ndim > 1:
        confidences = np.max(probs, axis=1)
        predictions = np.argmax(probs, axis=1)
    else:
        confidences = probs
        predictions = (probs >= 0.5).astype(int)

    accuracies = predictions == y_true
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    ece = 0.0

    for i in range(n_bins):
        bin_lower, bin_upper = bin_boundaries[i], bin_boundaries[i + 1]
        in_bin = (confidences > bin_lower) & (confidences <= bin_upper)
        prop_in_bin = np.mean(in_bin)
        if prop_in_bin > 0:
            accuracy_in_bin = np.mean(accuracies[in_bin])
            avg_confidence_in_bin = np.mean(confidences[in_bin])
            ece += np.abs(avg_confidence_in_bin - accuracy_in_bin) * prop_in_bin

    return float(ece)


def evaluate_clinical_model(
    model_name: str,
    model_type: str,
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: np.ndarray,
    inference_time_ms: float = 0.0,
) -> Dict[str, Any]:
    """Calculates all key diagnostic metrics defined in Q-RAKSHAK clinical specifications."""
    acc = float(accuracy_score(y_true, y_pred))
    sens = float(recall_score(y_true, y_pred, zero_division=0))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    mcc = float(matthews_corrcoef(y_true, y_pred))
    cm = confusion_matrix(y_true, y_pred).tolist()

    # Specificity = TN / (TN + FP)
    if len(cm) == 2 and len(cm[0]) == 2:
        tn, fp = cm[0][0], cm[0][1]
        spec = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    else:
        spec = 0.0

    # AUC-ROC
    try:
        if y_prob.ndim == 2 and y_prob.shape[1] == 2:
            auc = float(roc_auc_score(y_true, y_prob[:, 1]))
        elif y_prob.ndim == 1:
            auc = float(roc_auc_score(y_true, y_prob))
        else:
            auc = float(roc_auc_score(y_true, y_prob, multi_class="ovr"))
    except Exception:
        auc = 0.5

    ece = compute_ece(y_prob, y_true)

    report = {
        "model": model_name,
        "type": model_type,
        "accuracy": round(acc, 4),
        "sensitivity": round(sens, 4),
        "specificity": round(spec, 4),
        "precision": round(prec, 4),
        "f1_score": round(f1, 4),
        "mcc": round(mcc, 4),
        "auc_roc": round(auc, 4),
        "ece": round(ece, 4),
        "inference_time_ms": round(inference_time_ms, 2),
        "confusion_matrix": cm,
    }

    print(f"\n=======================================================")
    print(f" 📊 Evaluation Summary: {model_name} ({model_type})")
    print(f"=======================================================")
    print(f"  Accuracy:    {acc*100:.2f}% | AUC-ROC:     {auc:.4f}")
    print(f"  Sensitivity: {sens:.4f}  | Specificity: {spec:.4f}")
    print(f"  Precision:   {prec:.4f}  | F1 Score:    {f1:.4f}")
    print(f"  MCC Score:   {mcc:.4f}  | ECE Error:   {ece:.4f}")
    print(f"  Avg Latency: {inference_time_ms:.2f} ms")
    print(f"=======================================================\n")

    return report
