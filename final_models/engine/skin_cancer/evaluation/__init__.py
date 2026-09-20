from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader
from tqdm import tqdm

from ml.skin_cancer.evaluation.calibration import expected_calibration_error, save_reliability
from ml.skin_cancer.evaluation.confusion_matrix import save_confusion_matrix
from ml.skin_cancer.evaluation.error_analysis import write_error_analysis
from ml.skin_cancer.evaluation.metrics import compute_metrics
from ml.skin_cancer.evaluation.roc_pr import save_roc_pr
from ml.skin_cancer.evaluation.plots import save_per_class_charts, save_training_curves


@torch.no_grad()
def collect_predictions(model, loader: DataLoader, device) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    model.eval()
    ys, probs, logits = [], [], []
    for x, y in tqdm(loader, desc="eval", leave=False):
        x = x.to(device)
        logit = model(x)
        prob = torch.softmax(logit, dim=1)
        ys.append(y.numpy())
        probs.append(prob.cpu().numpy())
        logits.append(logit.cpu().numpy())
    return np.concatenate(ys), np.concatenate(probs), np.concatenate(logits)


def write_eval_artifacts(
    out_dir: Path,
    y_true: np.ndarray,
    y_prob: np.ndarray,
    class_names: list[str],
    indices: np.ndarray | None = None,
    extra: dict | None = None,
) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    metrics = compute_metrics(y_true, y_prob, class_names)
    if extra:
        metrics.update(extra)
    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    save_confusion_matrix(np.array(metrics["confusion_matrix"]), class_names, out_dir / "confusion_matrix.png")
    save_confusion_matrix(np.array(metrics["confusion_matrix"]), class_names, out_dir / "confusion_matrix_normalized.png", title="Normalized Confusion Matrix", normalize=True)
    save_roc_pr(y_true, y_prob, class_names, out_dir / "roc_curve.png", out_dir / "pr_curve.png")
    save_reliability(y_prob, y_true, out_dir / "calibration.png")
    save_per_class_charts(metrics, out_dir)

    history_file = out_dir / "training_history.json"
    if history_file.exists():
        try:
            with open(history_file, "r", encoding="utf-8") as f:
                history = json.load(f)
            save_training_curves(history, out_dir)
        except Exception as e:
            print(f"[write_eval_artifacts] Error plotting training curves: {e}")

    metrics["ece"] = expected_calibration_error(y_prob, y_true)
    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    if indices is not None:
        write_error_analysis(indices, y_true, y_prob, class_names, out_dir)
        pred_rows = {
            "index": indices,
            "true": [class_names[i] for i in y_true],
            "pred": [class_names[i] for i in y_prob.argmax(1)],
            "confidence": y_prob.max(1),
        }
        import pandas as pd

        pd.DataFrame(pred_rows).to_csv(out_dir / "predictions.csv", index=False)
    return metrics
