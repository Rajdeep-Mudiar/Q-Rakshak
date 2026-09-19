from __future__ import annotations

import math
from typing import Any

import numpy as np
try:
    from sklearn.metrics import (
        accuracy_score,
        confusion_matrix,
        f1_score,
        matthews_corrcoef,
        precision_score,
        recall_score,
        roc_auc_score,
    )
except Exception:
    def accuracy_score(y_true, y_pred):
        y_true, y_pred = np.asarray(y_true), np.asarray(y_pred)
        return float(np.mean(y_true == y_pred)) if len(y_true) > 0 else 0.0

    def confusion_matrix(y_true, y_pred, labels=None):
        y_true, y_pred = np.asarray(y_true), np.asarray(y_pred)
        if labels is None:
            labels = sorted(list(set(y_true).union(set(y_pred))))
        matrix = np.zeros((len(labels), len(labels)), dtype=int)
        label_to_idx = {l: i for i, l in enumerate(labels)}
        for t, p in zip(y_true, y_pred):
            if t in label_to_idx and p in label_to_idx:
                matrix[label_to_idx[t], label_to_idx[p]] += 1
        return matrix

    def precision_score(y_true, y_pred, average="weighted", zero_division=0):
        y_true, y_pred = np.asarray(y_true), np.asarray(y_pred)
        tp = int(np.sum((y_true == 1) & (y_pred == 1)))
        fp = int(np.sum((y_true == 0) & (y_pred == 1)))
        return float(tp / (tp + fp)) if (tp + fp) > 0 else float(zero_division)

    def recall_score(y_true, y_pred, average="weighted", zero_division=0):
        y_true, y_pred = np.asarray(y_true), np.asarray(y_pred)
        tp = int(np.sum((y_true == 1) & (y_pred == 1)))
        fn = int(np.sum((y_true == 1) & (y_pred == 0)))
        return float(tp / (tp + fn)) if (tp + fn) > 0 else float(zero_division)

    def f1_score(y_true, y_pred, average="weighted", zero_division=0):
        prec = precision_score(y_true, y_pred, zero_division=zero_division)
        rec = recall_score(y_true, y_pred, zero_division=zero_division)
        return float(2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else float(zero_division)

    def matthews_corrcoef(y_true, y_pred):
        y_true, y_pred = np.asarray(y_true), np.asarray(y_pred)
        tp = int(np.sum((y_true == 1) & (y_pred == 1)))
        tn = int(np.sum((y_true == 0) & (y_pred == 0)))
        fp = int(np.sum((y_true == 0) & (y_pred == 1)))
        fn = int(np.sum((y_true == 1) & (y_pred == 0)))
        denom = math.sqrt(float((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn)))
        return float(((tp * tn) - (fp * fn)) / denom) if denom > 0 else 0.0

    def roc_auc_score(y_true, y_score, multi_class="ovr", average="weighted"):
        try:
            y_true, y_score = np.asarray(y_true), np.asarray(y_score)
            if y_score.ndim == 2:
                y_score = y_score[:, 1]
            # Mann-Whitney U test statistic for AUC
            pos = y_score[y_true == 1]
            neg = y_score[y_true == 0]
            if len(pos) == 0 or len(neg) == 0:
                return 0.5
            return float(np.mean([p > n for p in pos for n in neg]))
        except Exception:
            return 0.5



def evaluate_classification_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: np.ndarray | None = None,
    inference_time_sec: float = 0.001,
) -> dict[str, Any]:
    """Computes all standard clinical and ML metrics from SRS Section 4.6:
    - Accuracy = (TP + TN) / (TP + TN + FP + FN)
    - Sensitivity (Recall) = TP / (TP + FN)
    - Specificity = TN / (TN + FP)
    - Precision = TP / (TP + FP)
    - F1-Score = 2 * (Precision * Recall) / (Precision + Recall)
    - Matthews Correlation Coefficient (MCC)
    - AUC-ROC
    """
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, average="weighted", zero_division=0))
    sens = float(recall_score(y_true, y_pred, average="weighted", zero_division=0))
    f1 = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))
    mcc = float(matthews_corrcoef(y_true, y_pred)) if len(np.unique(y_true)) > 1 else 0.0

    cm = confusion_matrix(y_true, y_pred)
    if cm.shape == (2, 2):
        tn, fp, fn, tp = cm.ravel()
        spec = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    else:
        spec = float(sens)  # multi-class fallback

    auc = None
    if y_prob is not None:
        try:
            if y_prob.ndim == 2 and y_prob.shape[1] == 2:
                auc = float(roc_auc_score(y_true, y_prob[:, 1]))
            elif y_prob.ndim == 2 and y_prob.shape[1] > 2:
                auc = float(roc_auc_score(y_true, y_prob, multi_class="ovr", average="weighted"))
            else:
                auc = float(roc_auc_score(y_true, y_prob))
        except Exception:
            auc = 0.5

    return {
        "accuracy": round(acc, 4),
        "sensitivity": round(sens, 4),
        "specificity": round(spec, 4),
        "precision": round(prec, 4),
        "f1_score": round(f1, 4),
        "mcc": round(mcc, 4),
        "auc_roc": round(auc, 4) if auc is not None else None,
        "inference_time_ms": round(inference_time_sec * 1000, 2),
        "confusion_matrix": cm.tolist(),
    }


def compute_quantum_advantage_score(
    acc_quantum: float,
    acc_classical: float,
    t_classical_sec: float,
    t_quantum_sec: float,
) -> float:
    """Computes the novel Quantum Advantage Score (QAS) per SRS Section 4.6:
    QAS = ( (Acc_quantum - Acc_classical) / Acc_classical ) * ( T_classical / T_quantum )
    """
    if acc_classical <= 0 or t_quantum_sec <= 0:
        return 0.0
    acc_delta = (acc_quantum - acc_classical) / acc_classical
    # Soft relative runtime scaling
    time_ratio = min(max(t_classical_sec / t_quantum_sec, 0.05), 20.0)
    qas = acc_delta * time_ratio
    return round(float(qas), 4)


def compute_entanglement_entropy(density_matrix: np.ndarray) -> float:
    """Computes von Neumann entanglement entropy S(rho) = -Tr(rho log2 rho)
    for circuit quantum correlation verification (SRS Section 6 & 16).
    """
    eigenvals = np.linalg.eigvalsh(density_matrix)
    eigenvals = eigenvals[eigenvals > 1e-12]
    entropy = -np.sum(eigenvals * np.log2(eigenvals))
    return round(float(entropy), 4)


def find_optimal_clinical_threshold(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    min_specificity: float = 0.80,
) -> tuple[float, dict[str, float]]:
    """Finds optimal binary classification threshold using Youden's J-statistic
    (Sensitivity + Specificity - 1) subject to clinical safety constraints.
    Prevents catastrophic specificity collapse in imbalanced clinical cohorts.
    """
    y_true = np.asarray(y_true).astype(int)
    scores = y_prob[:, 1] if y_prob.ndim == 2 else y_prob

    best_thresh = 0.5
    best_j = -1.0
    best_metrics = {}

    thresholds = np.linspace(0.05, 0.95, 91)
    for t in thresholds:
        preds = (scores >= t).astype(int)
        cm = confusion_matrix(y_true, preds, labels=[0, 1])
        if cm.shape == (2, 2):
            tn, fp, fn, tp = cm.ravel()
            sens = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
            acc = (tp + tn) / len(y_true)
            j_stat = sens + spec - 1.0

            # Prioritize candidate if it meets the clinical specificity guardrail
            if spec >= min_specificity and j_stat > best_j:
                best_j = j_stat
                best_thresh = float(t)
                best_metrics = {
                    "accuracy": round(float(acc), 4),
                    "sensitivity": round(float(sens), 4),
                    "specificity": round(float(spec), 4),
                    "threshold": round(float(t), 4),
                }

    # Fallback to unrestricted Youden's J if no threshold met strict specificity
    if not best_metrics:
        for t in thresholds:
            preds = (scores >= t).astype(int)
            cm = confusion_matrix(y_true, preds, labels=[0, 1])
            if cm.shape == (2, 2):
                tn, fp, fn, tp = cm.ravel()
                sens = tp / (tp + fn) if (tp + fn) > 0 else 0.0
                spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
                acc = (tp + tn) / len(y_true)
                j_stat = sens + spec - 1.0
                if j_stat > best_j:
                    best_j = j_stat
                    best_thresh = float(t)
                    best_metrics = {
                        "accuracy": round(float(acc), 4),
                        "sensitivity": round(float(sens), 4),
                        "specificity": round(float(spec), 4),
                        "threshold": round(float(t), 4),
                    }

    return best_thresh, best_metrics


def recommend_clinical_engine(
    qas: float,
    quantum_accuracy: float,
    classical_accuracy: float,
    quantum_specificity: float,
    classical_specificity: float,
    min_specificity: float = 0.80,
) -> dict[str, Any]:
    """Autonomous clinical triage policy: determines whether the quantum engine
    or classical sentinel baseline should serve as the primary diagnostic driver.
    """
    # Safety rule: if quantum specificity fails clinical guardrail and classical specificity is higher
    if quantum_specificity < min_specificity and classical_specificity > quantum_specificity:
        return {
            "recommended_engine": "classical",
            "active_model_type": "Classical Sentinel Baseline",
            "rationale": f"Safety Override: Quantum specificity ({quantum_specificity:.2f}) fails clinical guardrail (< {min_specificity:.2f}). Classical specificity ({classical_specificity:.2f}) protects patient outcomes.",
            "safety_guardrail_applied": True,
        }
    if classical_accuracy - quantum_accuracy > 0.03:
        return {
            "recommended_engine": "classical",
            "active_model_type": "Classical Sentinel Baseline",
            "rationale": f"Performance Advantage: Classical baseline leads by {(classical_accuracy - quantum_accuracy) * 100:.1f}% accuracy.",
            "safety_guardrail_applied": False,
        }
    if qas > 0 and quantum_accuracy >= classical_accuracy and quantum_specificity >= min_specificity:
        return {
            "recommended_engine": "quantum",
            "active_model_type": "Quantum Hybrid",
            "rationale": f"Quantum Advantage Verified: QAS = +{qas:.4f}, quantum accuracy leads classical baseline by {(quantum_accuracy - classical_accuracy) * 100:.1f}%.",
            "safety_guardrail_applied": False,
        }
    return {
        "recommended_engine": "classical",
        "active_model_type": "Classical Sentinel Baseline",
        "rationale": "Classical baseline selected: Non-positive QAS or specificity gap indicates superior classical efficacy.",
        "safety_guardrail_applied": False,
    }

