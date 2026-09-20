from __future__ import annotations

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns


def save_confusion_matrix(cm: np.ndarray, class_names: list[str], path, title: str = "Confusion matrix", normalize: bool = False):
    fig, ax = plt.subplots(figsize=(7, 6))
    if normalize:
        cm_display = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
        cm_display = np.nan_to_num(cm_display)
        fmt = ".2f"
    else:
        cm_display = cm
        fmt = "d"
    sns.heatmap(cm_display, annot=True, fmt=fmt, cmap="Blues", xticklabels=class_names, yticklabels=class_names, ax=ax)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("True")
    ax.set_title(title)
    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)
