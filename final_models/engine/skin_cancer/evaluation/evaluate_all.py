from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

from ml.skin_cancer.paths import REPORTS_DIR, ensure_dirs

KEYS = ("accuracy", "macro_f1", "weighted_f1", "sensitivity_macro", "specificity_macro", "roc_auc", "pr_auc", "ece")


def evaluate_all() -> pd.DataFrame:
    ensure_dirs()
    rows = []
    for metrics_path in sorted(REPORTS_DIR.glob("*/metrics.json")):
        if metrics_path.parent.name in {"features", "cache"}:
            continue
        data = json.loads(metrics_path.read_text(encoding="utf-8"))
        row = {"model": data.get("model", metrics_path.parent.name)}
        for key in KEYS:
            row[key] = data.get(key)
        rows.append(row)
    df = pd.DataFrame(rows)
    if df.empty:
        print("no metrics yet")
        return df
    df.to_csv(REPORTS_DIR / "model_comparison.csv", index=False)
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.bar(df["model"], df["macro_f1"], color="#8250df")
    ax.set_ylabel("Macro F1")
    ax.set_title("Model comparison (measured)")
    ax.tick_params(axis="x", rotation=20)
    fig.tight_layout()
    fig.savefig(REPORTS_DIR / "model_comparison.png", dpi=140)
    plt.close(fig)
    print(df.to_string(index=False))
    return df


if __name__ == "__main__":
    evaluate_all()
