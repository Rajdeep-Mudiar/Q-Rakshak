from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd


def write_error_analysis(
    indices: np.ndarray,
    y_true: np.ndarray,
    y_prob: np.ndarray,
    class_names: list[str],
    out_dir: Path,
) -> None:
    y_pred = y_prob.argmax(axis=1)
    conf = y_prob.max(axis=1)
    df = pd.DataFrame(
        {
            "index": indices,
            "true": [class_names[i] for i in y_true],
            "pred": [class_names[i] for i in y_pred],
            "confidence": conf,
            "correct": y_true == y_pred,
        }
    )
    errors = df[~df["correct"]].sort_values("confidence", ascending=False)
    errors.to_csv(out_dir / "error_analysis.csv", index=False)
    summary = {
        "n_errors": int(len(errors)),
        "high_confidence_errors": int((errors["confidence"] >= 0.8).sum()),
        "low_confidence_correct": int(((df["correct"]) & (df["confidence"] < 0.5)).sum()),
    }
    (out_dir / "error_analysis.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
