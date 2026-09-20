"""Q-RAKSHAK Comprehensive Clinical Diagnostic & Training Visualizer.

Generates publication-quality clinical plots and dashboards:
1. Train vs Validation Loss & Accuracy Convergence Curves (Vision Hybrid VQCs)
2. Quantum Circuit MSE Optimization Curves (Tabular Standalone VQCs)
3. Multi-Model Benchmark Comparison Bar Charts (Classical vs Quantum vs Hybrid)
4. Consolidated Master Clinical Dashboard (All 6 Disease Domains)

Usage:
    python visualize_metrics.py --disease all --output-dir ./outputs
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
plt.rcParams["axes.edgecolor"] = "#cccccc"
plt.rcParams["axes.linewidth"] = 0.8

DOMAIN_TITLES = {
    "pneumonia": ("Loss vs Epochs — QuantumPneu (Pneumonia Hybrid VQC)", "Accuracy Progression (%) — QuantumPneu (Pneumonia Hybrid VQC)"),
    "skin_cancer": ("Loss vs Epochs — Q-Skin-Vortex (Skin Cancer Hybrid VQC)", "Accuracy Progression (%) — Q-Skin-Vortex (Skin Cancer Hybrid VQC)"),
    "breast_cancer": "Quantum Circuit Optimization — OncoPulse-VQC (Breast Cancer WDBC)",
    "heart_disease": "Quantum Circuit Optimization — CardioWave-VQC (Heart Disease Cleveland)",
    "parkinsons": "Quantum Circuit Optimization — NeuroSynapse-VQC (Parkinson's Acoustics)",
    "diabetes": "Quantum Circuit Optimization — Diabetes-VQC (PIMA Diabetes)",
}


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

    title_info = DOMAIN_TITLES.get(disease_name, (f"Loss vs Epochs ({disease_name})", f"Accuracy ({disease_name})"))

    if train_acc:
        loss_title, acc_title = title_info if isinstance(title_info, tuple) else (f"Loss vs Epochs ({disease_name})", f"Accuracy Progression ({disease_name})")
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.2), dpi=140)

        # 1. Loss Curve
        ax1.plot(epochs, train_loss, 'o-', color='#2563EB', linewidth=2.2, markersize=5, label='Training Loss')
        if val_loss:
            ax1.plot(epochs, val_loss, 's--', color='#DC2626', linewidth=2.2, markersize=5, label='Validation Loss')
        ax1.set_title(loss_title, fontsize=11, fontweight='bold')
        ax1.set_xlabel("Epoch", fontsize=10)
        ax1.set_ylabel("Cross-Entropy Loss", fontsize=10)
        ax1.legend(frameon=True, facecolor='white', framealpha=0.9)
        ax1.grid(True, linestyle=':', alpha=0.6)

        # 2. Accuracy Curve
        ax2.plot(epochs, train_acc, 'o-', color='#059669', linewidth=2.2, markersize=5, label='Training Accuracy (%)')
        if val_acc:
            ax2.plot(epochs, val_acc, 's--', color='#7C3AED', linewidth=2.2, markersize=5, label='Validation Accuracy (%)')
        ax2.set_title(acc_title, fontsize=11, fontweight='bold')
        ax2.set_xlabel("Epoch", fontsize=10)
        ax2.set_ylabel("Accuracy (%)", fontsize=10)
        ax2.legend(frameon=True, facecolor='white', framealpha=0.9, loc='lower right')
        ax2.grid(True, linestyle=':', alpha=0.6)
    else:
        title = title_info if isinstance(title_info, str) else f"Quantum Circuit Optimization ({disease_name})"
        fig, ax1 = plt.subplots(1, 1, figsize=(8, 4.5), dpi=140)
        ax1.plot(epochs, train_loss, 'o-', color='#7C3AED', linewidth=2.4, markersize=6, label='Quantum VQC MSE Loss')
        ax1.set_title(title, fontsize=12, fontweight='bold')
        ax1.set_xlabel("Epoch / Parameter Step", fontsize=10)
        ax1.set_ylabel("Quantum Expectation Loss (MSE)", fontsize=10)
        ax1.legend(frameon=True, facecolor='white', framealpha=0.9, loc='upper right')
        ax1.grid(True, linestyle=':', alpha=0.6)

    plt.tight_layout()
    if save_path:
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, bbox_inches='tight', dpi=300)
        print(f"📊 Training curve saved to: {save_path}")
    plt.close(fig)


def plot_master_dashboard(base_dirs: list[str | Path], save_path: str | Path):
    """Generates a combined multi-panel summary figure of all 6 clinical domain trainings."""
    diseases = ["pneumonia", "skin_cancer", "breast_cancer", "heart_disease", "parkinsons", "diabetes"]
    
    fig = plt.figure(figsize=(16, 12), dpi=140)
    gs = fig.add_gridspec(3, 2, hspace=0.35, wspace=0.25)
    
    for idx, d in enumerate(diseases):
        row, col = idx // 2, idx % 2
        ax = fig.add_subplot(gs[row, col])
        
        hist_file = find_history_file(base_dirs, d)
        if not hist_file or not hist_file.exists():
            ax.text(0.5, 0.5, f"No history found for {d}", ha='center', va='center', fontsize=11)
            ax.set_title(d.replace("_", " ").title(), fontsize=11, fontweight='bold')
            continue
            
        with open(hist_file, "r") as f:
            data = json.load(f)
            
        train_loss = data.get("train_loss", data.get("loss", []))
        val_loss = data.get("val_loss", [])
        train_acc = [x * 100 if x <= 1.0 else x for x in data.get("train_acc", [])]
        val_acc = [x * 100 if x <= 1.0 else x for x in data.get("val_acc", [])]
        epochs = range(1, len(train_loss) + 1)
        
        title_info = DOMAIN_TITLES.get(d, d.replace("_", " ").title())
        if isinstance(title_info, tuple):
            title = title_info[0]
        else:
            title = title_info
            
        if train_acc:
            ax.plot(epochs, train_loss, 'o-', color='#2563EB', linewidth=2.0, markersize=4, label='Train Loss')
            if val_loss:
                ax.plot(epochs, val_loss, 's--', color='#DC2626', linewidth=2.0, markersize=4, label='Val Loss')
            ax.set_ylabel("Cross-Entropy Loss", fontsize=9)
        else:
            ax.plot(epochs, train_loss, 'o-', color='#7C3AED', linewidth=2.2, markersize=5, label='Quantum VQC Loss')
            ax.set_ylabel("Quantum MSE Loss", fontsize=9)
            
        ax.set_title(title, fontsize=10, fontweight='bold')
        ax.set_xlabel("Epoch / Step", fontsize=9)
        ax.legend(frameon=True, facecolor='white', framealpha=0.9, fontsize=8)
        ax.grid(True, linestyle=':', alpha=0.6)
        
    Path(save_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, bbox_inches='tight', dpi=300)
    print(f"✨ Master Training Dashboard saved to: {save_path}")
    plt.close(fig)


def plot_benchmark_bars(benchmark_path: str | Path, output_dir: str | Path):
    """Generates clean, non-overlapping comparison bar charts from benchmark_summary.json."""
    bp = Path(benchmark_path)
    if not bp.exists():
        return
        
    with open(bp, "r") as f:
        all_results = json.load(f)
        
    metrics_keys = ["accuracy", "sensitivity", "specificity", "f1_score", "auc_roc"]
    metric_labels = ["Accuracy", "Sensitivity", "Specificity", "F1 Score", "AUC-ROC"]
    colors = ["#2563EB", "#059669", "#7C3AED", "#D97706", "#DC2626"]
    
    for disease, models in all_results.items():
        if not models or not isinstance(models, dict):
            continue
            
        model_names = list(models.keys())
        n_models = len(model_names)
        x = np.arange(len(metric_labels)) * 1.3
        width = min(0.24, 0.9 / max(1, n_models))
        
        fig, ax = plt.subplots(figsize=(11, 5.8), dpi=140)
        
        for i, model in enumerate(model_names):
            vals = [models[model].get(k, 0.0) for k in metrics_keys]
            offset = (i - n_models / 2 + 0.5) * width
            bars = ax.bar(x + offset, vals, width, label=model, color=colors[i % len(colors)], alpha=0.9, edgecolor='#222222', linewidth=0.7)
            for bar in bars:
                h = bar.get_height()
                ax.text(
                    bar.get_x() + bar.get_width() / 2,
                    h + 0.015,
                    f"{h:.2f}",
                    ha='center',
                    va='bottom',
                    fontsize=8.5,
                    fontweight='semibold',
                    color='#333333'
                )
                
        ax.set_ylabel("Score (0.00 - 1.00)", fontsize=11, fontweight="bold")
        ax.set_title(f"Clinical Model Benchmark Comparison — {disease.replace('_', ' ').title()}", fontsize=13, fontweight="bold", pad=35)
        ax.set_xticks(x)
        ax.set_xticklabels(metric_labels, fontsize=10.5, fontweight="bold")
        ax.set_ylim(0, 1.12)
        ax.legend(
            bbox_to_anchor=(0.5, 1.13),
            loc='upper center',
            ncol=min(4, n_models),
            frameon=True,
            facecolor='white',
            framealpha=0.98,
            edgecolor='#cccccc',
            fontsize=9.5,
        )
        ax.grid(True, linestyle=':', alpha=0.6, axis='y')
        
        save_file = Path(output_dir) / disease / "benchmark_comparison.png"
        save_file.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_file, bbox_inches='tight', dpi=300)
        print(f"📊 Benchmark comparison bar chart saved to: {save_file}")
        plt.close(fig)


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

    # Generate master consolidated dashboard
    master_path = Path(args.output_dir) / "master_training_dashboard.png"
    plot_master_dashboard(search_dirs, master_path)

    # Plot benchmark comparison charts if summary file exists
    summary_path = Path(args.output_dir) / "benchmark_summary.json"
    if summary_path.exists():
        plot_benchmark_bars(summary_path, args.output_dir)
