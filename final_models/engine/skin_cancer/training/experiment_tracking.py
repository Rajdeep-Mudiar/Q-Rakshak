from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

from ml.skin_cancer.paths import REPORTS_DIR

LEADERBOARD_JSON = REPORTS_DIR / "experiments" / "leaderboard.json"
LEADERBOARD_MD = REPORTS_DIR / "experiments" / "quick_experiments_leaderboard.md"

REQUIRED_COLS = [
    "experiment",
    "seed",
    "pca",
    "sampler",
    "loss",
    "gamma",
    "label_smoothing",
    "lr",
    "weight_decay",
    "scheduler",
    "quantum_layers",
    "qubits",
    "epochs",
    "best_epoch",
    "accuracy",
    "macro_f1",
    "weighted_f1",
    "balanced_accuracy",
    "roc_auc",
    "sensitivity_macro",
    "ece",
]

MD_COLUMNS = [
    "Experiment",
    "Seed",
    "PCA",
    "Sampler",
    "Loss",
    "Gamma",
    "LS",
    "LR",
    "WD",
    "Scheduler",
    "QL",
    "Q",
    "Epochs",
    "BestEp",
    "Acc",
    "MacroF1",
    "W-F1",
    "BalAcc",
    "ROC-AUC",
    "Sens",
    "ECE",
]


def _ensure_dirs() -> None:
    LEADERBOARD_JSON.parent.mkdir(parents=True, exist_ok=True)


def _load_leaderboard() -> list[dict[str, Any]]:
    _ensure_dirs()
    if LEADERBOARD_JSON.exists():
        try:
            data = json.loads(LEADERBOARD_JSON.read_text(encoding="utf-8"))
            if isinstance(data, list):
                return data
        except Exception:
            pass
    return []


def _save_leaderboard(rows: list[dict[str, Any]]) -> None:
    _ensure_dirs()
    LEADERBOARD_JSON.write_text(json.dumps(rows, indent=2), encoding="utf-8")


def _fmt(value: Any, decimals: int = 4) -> str:
    if value is None:
        return "-"
    if isinstance(value, float):
        return f"{value:.{decimals}f}"
    return str(value)


def _render_markdown(rows: list[dict[str, Any]]) -> str:
    sorted_rows = sorted(rows, key=lambda r: r.get("macro_f1", -1.0), reverse=True)
    header = "| " + " | ".join(MD_COLUMNS) + " |"
    sep = "| " + " | ".join(["---"] * len(MD_COLUMNS)) + " |"
    body_lines = []
    for r in sorted_rows:
        cells = [
            r.get("experiment", "-"),
            str(r.get("seed", "-")),
            str(r.get("pca", "-")),
            r.get("sampler", "-"),
            r.get("loss", "-"),
            _fmt(r.get("gamma"), 2),
            _fmt(r.get("label_smoothing"), 2),
            _fmt(r.get("lr"), 5),
            _fmt(r.get("weight_decay"), 5),
            r.get("scheduler", "-"),
            str(r.get("quantum_layers", "-")),
            str(r.get("qubits", "-")),
            str(r.get("epochs", "-")),
            str(r.get("best_epoch", "-")),
            _fmt(r.get("accuracy")),
            _fmt(r.get("macro_f1")),
            _fmt(r.get("weighted_f1")),
            _fmt(r.get("balanced_accuracy")),
            _fmt(r.get("roc_auc")),
            _fmt(r.get("sensitivity_macro")),
            _fmt(r.get("ece"), 4),
        ]
        body_lines.append("| " + " | ".join(str(c) for c in cells) + " |")
    body = "\n".join(body_lines)
    return (
        f"# QuantumDerma Experiments Leaderboard\n\n"
        f"_Auto-generated on {datetime.now().isoformat(timespec='seconds')}._\n\n"
        f"Ranked by **Macro F1** (descending). Protected baseline: Macro F1 = 0.39448.\n\n"
        f"{header}\n{sep}\n{body}\n\n"
        f"Key: LS = label_smoothing, WD = weight_decay, QL = quantum_layers, Q = qubits, BestEp = best_epoch, BalAcc = balanced_accuracy, Sens = sensitivity_macro, W-F1 = weighted_f1.\n"
    )


def record_experiment(
    experiment_name: str,
    hyperparams: dict[str, Any],
    metrics: dict[str, Any],
    run_dir: Path,
) -> Path:
    """Append one experiment to the leaderboard and regenerate the markdown.

    Args:
        experiment_name: Short human-readable experiment slug.
        hyperparams: Flat dict of hyperparameters (must match REQUIRED_COLS subset).
        metrics: Metric dict from compute_metrics / final evaluation. Must include
                 ``best_epoch`` and ``ece``.
        run_dir: Directory where this run's artifacts live.

    Returns:
        Path to the leaderboard markdown file.
    """
    row: dict[str, Any] = {
        "experiment": experiment_name,
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "run_dir": str(run_dir),
    }
    for key in REQUIRED_COLS:
        if key in hyperparams:
            row[key] = hyperparams[key]
        elif key in metrics:
            row[key] = metrics[key]
        else:
            row[key] = None

    rows = _load_leaderboard()
    rows.append(row)
    _save_leaderboard(rows)
    md = _render_markdown(rows)
    LEADERBOARD_MD.parent.mkdir(parents=True, exist_ok=True)
    LEADERBOARD_MD.write_text(md, encoding="utf-8")

    # Also copy the leaderboard into docs/ so it's easy to find
    docs_target = Path(__file__).resolve().parents[3] / "docs" / "quick_experiments_leaderboard.md"
    docs_target.parent.mkdir(parents=True, exist_ok=True)
    docs_target.write_text(md, encoding="utf-8")
    return LEADERBOARD_MD
