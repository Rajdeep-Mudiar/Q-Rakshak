from __future__ import annotations

import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import precision_recall_curve, roc_curve


def save_roc_pr(y_true: np.ndarray, y_prob: np.ndarray, class_names: list[str], roc_path, pr_path):
    fig, ax = plt.subplots(figsize=(6, 5))
    for i, name in enumerate(class_names):
        y_bin = (y_true == i).astype(int)
        if y_bin.sum() == 0 or y_bin.sum() == len(y_bin):
            continue
        fpr, tpr, _ = roc_curve(y_bin, y_prob[:, i])
        ax.plot(fpr, tpr, label=name)
    ax.plot([0, 1], [0, 1], "--", color="gray")
    ax.set_title("ROC")
    ax.legend(fontsize=8)
    fig.tight_layout()
    fig.savefig(roc_path, dpi=140)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(6, 5))
    for i, name in enumerate(class_names):
        y_bin = (y_true == i).astype(int)
        if y_bin.sum() == 0:
            continue
        p, r, _ = precision_recall_curve(y_bin, y_prob[:, i])
        ax.plot(r, p, label=name)
    ax.set_title("Precision-Recall")
    ax.legend(fontsize=8)
    fig.tight_layout()
    fig.savefig(pr_path, dpi=140)
    plt.close(fig)
