from __future__ import annotations

from typing import Sequence

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    brier_score_loss,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_recall_fscore_support,
    roc_auc_score,
)


def _one_hot(y: np.ndarray, n: int) -> np.ndarray:
    out = np.zeros((len(y), n), dtype=np.float64)
    out[np.arange(len(y)), y] = 1.0
    return out


def specificity_from_cm(cm: np.ndarray) -> np.ndarray:
    specs = []
    for i in range(cm.shape[0]):
        tn = cm.sum() - (cm[i, :].sum() + cm[:, i].sum() - cm[i, i])
        fp = cm[:, i].sum() - cm[i, i]
        specs.append(float(tn / max(tn + fp, 1)))
    return np.array(specs)


def compute_metrics(y_true: Sequence[int], y_prob: np.ndarray, class_names: list[str]) -> dict:
    y_true = np.asarray(y_true)
    y_prob = np.asarray(y_prob)
    y_pred = y_prob.argmax(axis=1)
    n = y_prob.shape[1]
    cm = confusion_matrix(y_true, y_pred, labels=list(range(n)))
    precision, recall, f1, support = precision_recall_fscore_support(
        y_true, y_pred, labels=list(range(n)), zero_division=0
    )
    specs = specificity_from_cm(cm)
    y_oh = _one_hot(y_true, n)
    try:
        roc = float(roc_auc_score(y_oh, y_prob, average="macro", multi_class="ovr"))
    except ValueError:
        roc = float("nan")
    try:
        pr = float(average_precision_score(y_oh, y_prob, average="macro"))
    except ValueError:
        pr = float("nan")
    per_class = []
    for i, name in enumerate(class_names):
        per_class.append(
            {
                "class": name,
                "precision": float(precision[i]),
                "recall": float(recall[i]),
                "sensitivity": float(recall[i]),
                "specificity": float(specs[i]),
                "f1": float(f1[i]),
                "support": int(support[i]),
            }
        )
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "balanced_accuracy": float(balanced_accuracy_score(y_true, y_pred)),
        "macro_f1": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
        "weighted_f1": float(f1_score(y_true, y_pred, average="weighted", zero_division=0)),
        "sensitivity_macro": float(np.mean(recall)),
        "specificity_macro": float(np.mean(specs)),
        "roc_auc": roc,
        "pr_auc": pr,
        "brier": float(np.mean(np.sum((y_prob - y_oh) ** 2, axis=1))),
        "confusion_matrix": cm.tolist(),
        "per_class": per_class,
        "classification_report": classification_report(
            y_true, y_pred, target_names=class_names, zero_division=0
        ),
    }
