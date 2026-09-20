"""Q-RAKSHAK Comprehensive Diagnostic & Training Visualizer.

Generates publication-quality clinical plots and dashboards:
1. Train vs Validation Loss & Accuracy Convergence Curves
2. ROC Curves with Area-Under-Curve (AUC) comparisons
3. Normalized Confusion Matrix Heatmaps
4. Multi-Model Diagnostic Radar / Benchmark Bar Comparison (Sensitivity, Specificity, AUC, F1, MCC)
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np

# Set clean, modern plot aesthetic
plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
plt.rcParams["font.sans-serif"] = "DejaVu Sans"
plt.rcParams["font.size"] = 10


def find_history_file(base_dirs: list[str | Path], disease: str) -> Path | None:
    """Auto-discovers training or VQC history files across common directories."""
    candidate_names = ["training_history.json", "vqc_history.json"]
    for b in base_dirs:
        bp = Path(b)
        if not bp.exists():
            continue
        for name in candidate_names:
            target = bp / disease / name
            if target.exists():
                return target
            # Search recursively within disease subfolders
            matches = list(bp.glob(f"**/{disease}/{name}"))
            if matches:
                return matches[0]
    return None


def plot_training_curves(history_path: str | Path, disease_name: str, save_path: str | Path | None = None):
    """Plots Training vs Validation Loss and Accuracy side-by-side or VQC Loss."""
    p = Path(history_path)
    if not p.exists():
        print(f"⚠️ No training history found at: {history_path}")
        return

    with open(p, "r") as f:
        data = json.load(f)

    train_loss = data.get("train_loss", data.get("loss", []))
    val_loss = data.get("val_loss", [])
    train_acc = [x * 100 if x <= 1.0 else x for x in data.get("train_acc", [])]
    val_acc = [x * 100 if x <= 1.0 else x for x in data.get("val_acc", [])]
    epochs = range(1, len(train_loss) + 1)

    if not train_loss:
        print(f"⚠️ History file at {p} contains no loss history.")
        return

    if train_acc:
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5), dpi=120)

        # 1. Loss Curve
        ax1.plot(epochs, train_loss, 'o-', color='#3B82F6', linewidth=2.5, markersize=5, label='Training Loss')
        if val_loss:
            ax1.plot(epochs, val_loss, 's--', color='#EF4444', linewidth=2.5, markersize=5, label='Validation Loss')
        ax1.set_title(f"Cross-Entropy Loss vs Epochs ({disease_name.replace('_', ' ').title()})", fontsize=12, fontweight='bold')
        ax1.set_xlabel("Epoch", fontsize=11)
        ax1.set_ylabel("Loss", fontsize=11)
        ax1.legend(frameon=True, facecolor='white', framealpha=0.9)
        ax1.grid(True, linestyle=':', alpha=0.6)

        # 2. Accuracy Curve
        ax2.plot(epochs, train_acc, 'o-', color='#10B981', linewidth=2.5, markersize=5, label='Training Accuracy (%)')
        if val_acc:
            ax2.plot(epochs, val_acc, 's--', color='#8B5CF6', linewidth=2.5, markersize=5, label='Validation Accuracy (%)')
        ax2.set_title(f"Accuracy Progression ({disease_name.replace('_', ' ').title()})", fontsize=12, fontweight='bold')
        ax2.set_xlabel("Epoch", fontsize=11)
        ax2.set_ylabel("Accuracy (%)", fontsize=11)
        ax2.legend(frameon=True, facecolor='white', framealpha=0.9)
        ax2.grid(True, linestyle=':', alpha=0.6)
    else:
        fig, ax1 = plt.subplots(1, 1, figsize=(7, 4.5), dpi=120)
        ax1.plot(epochs, train_loss, 'o-', color='#8B5CF6', linewidth=2.5, markersize=5, label='Quantum VQC Loss')
        ax1.set_title(f"Quantum Parameter-Shift Optimization ({disease_name.replace('_', ' ').title()})", fontsize=12, fontweight='bold')
        ax1.set_xlabel("Epoch / Iteration", fontsize=11)
        ax1.set_ylabel("MSE Loss", fontsize=11)
        ax1.legend(frameon=True, facecolor='white', framealpha=0.9)
        ax1.grid(True, linestyle=':', alpha=0.6)

    plt.tight_layout()
    if save_path:
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, bbox_inches='tight', dpi=300)
        print(f"📊 Training curves saved to: {save_path}")
    plt.show()


def plot_clinical_confusion_matrix(cm: list[list[int]], class_names: list[str], title: str = "Confusion Matrix", save_path: str | Path | None = None):
    """Plots clean, annotated confusion matrix with recall and specificity insights."""
    cm_arr = np.array(cm)
    cm_norm = cm_arr.astype('float') / cm_arr.sum(axis=1)[:, np.newaxis]

    fig, ax = plt.subplots(figsize=(6, 5), dpi=120)
    cax = ax.matshow(cm_norm, cmap=plt.cm.Blues, alpha=0.85)

    for i in range(cm_arr.shape[0]):
        for j in range(cm_arr.shape[1]):
            val = cm_arr[i, j]
            pct = cm_norm[i, j] * 100
            color = "white" if pct > 50 else "black"
            ax.text(j, i, f"{val}\n({pct:.1f}%)", ha="center", va="center", color=color, fontweight="bold", fontsize=11)

    fig.colorbar(cax)
    ax.set_xticks(range(len(class_names)))
    ax.set_yticks(range(len(class_names)))
    ax.set_xticklabels(class_names, fontsize=10)
    ax.set_yticklabels(class_names, fontsize=10)
    ax.set_xlabel("Predicted Diagnosis", fontsize=11, fontweight="bold", labelpad=10)
    ax.set_ylabel("Actual Ground Truth", fontsize=11, fontweight="bold")
    ax.set_title(title, fontsize=12, fontweight="bold", pad=20)
    plt.grid(False)

    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, bbox_inches='tight', dpi=300)
    plt.show()


def plot_model_comparison_bars(results: dict[str, dict[str, float]], disease_name: str, save_path: str | Path | None = None):
    """Generates comparison bar chart of Classical vs Quantum vs Hybrid metrics."""
    metrics_keys = ["accuracy", "sensitivity", "specificity", "f1_score", "auc_roc"]
    metric_labels = ["Accuracy", "Sensitivity", "Specificity", "F1 Score", "AUC-ROC"]

    models = list(results.keys())
    n_models = len(models)
    x = np.arange(len(metric_labels))
    width = 0.8 / max(1, n_models)

    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=120)
    colors = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"]

    for i, model in enumerate(models):
        vals = [results[model].get(k, 0.0) for k in metrics_keys]
        offset = (i - n_models / 2 + 0.5) * width
        bars = ax.bar(x + offset, vals, width, label=model, color=colors[i % len(colors)], alpha=0.9, edgecolor='black', linewidth=0.6)
        for bar in bars:
            h = bar.get_height()
            ax.text(bar.get_x() + bar.get_width() / 2, h + 0.015, f"{h:.2f}", ha='center', va='bottom', fontsize=8, rotation=0)

    ax.set_ylabel("Score (0.00 - 1.00)", fontsize=11, fontweight="bold")
    ax.set_title(f"Classical vs Quantum vs Hybrid Diagnostic Comparison ({disease_name.replace('_', ' ').title()})", fontsize=12, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(metric_labels, fontsize=10, fontweight="bold")
    ax.set_ylim(0, 1.15)
    ax.legend(frameon=True, facecolor='white', loc='upper right')
    ax.grid(True, linestyle=':', alpha=0.6, axis='y')

    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, bbox_inches='tight', dpi=300)
    plt.show()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Plot Q-RAKSHAK Clinical Diagnostics")
    parser.add_argument("--disease", type=str, default="all")
    parser.add_argument("--output-dir", type=str, default="./outputs")
    args = parser.parse_args()

    search_dirs = [
        Path(args.output_dir),
        Path("./outputs"),
        Path("/kaggle/working/outputs"),
        Path("/kaggle/working/QDoc/fine_tuned_models/outputs"),
        Path("fine_tuned_models/outputs"),
    ]

    diseases = ["pneumonia", "skin_cancer", "breast_cancer", "heart_disease", "parkinsons", "diabetes"] if args.disease == "all" else [args.disease]

    for d in diseases:
        hist_file = find_history_file(search_dirs, d)
        if hist_file and hist_file.exists():
            print(f"📊 Plotting training curves for {d} from {hist_file}...")
            plot_training_curves(hist_file, d, hist_file.parent / "training_curves.png")
        else:
            print(f"⚠️ No history found for domain: {d}")
