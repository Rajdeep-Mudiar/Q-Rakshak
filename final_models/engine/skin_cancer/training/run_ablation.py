from __future__ import annotations
import argparse
import json
from pathlib import Path
import time
import numpy as np
import pandas as pd

from ml.skin_cancer.paths import MODELS_DIR, REPORTS_DIR, ensure_dirs
from ml.skin_cancer.training.train_quantum import train_quantum
from ml.skin_cancer.features.pca_features import fit_pca

def run_experiment(model_name: str, exp_name: str, config_override: dict, epochs: int) -> dict:
    print(f"\n========================================================")
    print(f" Running Experiment: {exp_name} ({model_name})")
    print(f"========================================================")
    
    # Merge epochs into config override
    if "training" not in config_override:
        config_override["training"] = {}
    config_override["training"]["epochs"] = epochs
    
    start_time = time.time()
    out_dir = train_quantum(model_name=model_name, config_override=config_override)
    duration = time.time() - start_time
    
    # Load metrics from out_dir
    with open(out_dir / "metrics.json", "r", encoding="utf-8") as f:
        metrics = json.load(f)
        
    res = {
        "Experiment": exp_name,
        "Model": model_name,
        "Seed": config_override.get("seed", 42),
        "Training Time (s)": round(duration, 2),
        "Best Epoch": metrics.get("epoch", -1),
        "Accuracy": round(metrics["accuracy"], 4),
        "Macro F1": round(metrics["macro_f1"], 4),
        "Weighted F1": round(metrics["weighted_f1"], 4),
        "Balanced Accuracy": round(metrics.get("sensitivity_macro", metrics.get("macro_f1")), 4),
        "ROC-AUC": round(metrics["roc_auc"], 4),
    }
    
    # Extract per-class recall and F1
    for item in metrics["per_class"]:
        cls_name = item["class"]
        res[f"{cls_name}_recall"] = round(item["recall"], 4)
        res[f"{cls_name}_f1"] = round(item["f1"], 4)
        
    return res

def main() -> None:
    parser = argparse.ArgumentParser(description="Run QML controlled ablation experiments.")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs per ablation run")
    args = parser.parse_args()
    
    ensure_dirs()
    leaderboard = []
    
    # A. Baseline (Focal Loss Gamma=2, Balanced Sampling=False)
    exp_a = run_experiment(
        model_name="QuantumDerma",
        exp_name="Exp A: Baseline",
        config_override={
            "seed": 42,
            "training": {"balanced_sampling": False},
            "quantum": {"focal_gamma": 2.0}
        },
        epochs=args.epochs
    )
    leaderboard.append(exp_a)
    
    # B. Baseline + class-weighted loss (Focal Loss Gamma=0 is CE, balanced_sampling=False utilizes class-weighted loss)
    exp_b = run_experiment(
        model_name="QuantumDerma",
        exp_name="Exp B: Weighted CE",
        config_override={
            "seed": 42,
            "training": {"balanced_sampling": False},
            "quantum": {"focal_gamma": 0.0}
        },
        epochs=args.epochs
    )
    leaderboard.append(exp_b)
    
    # C. Baseline + Focal Loss (Gamma=1.0 & Gamma=3.0)
    for g in [1.0, 3.0]:
        exp_c = run_experiment(
            model_name="QuantumDerma",
            exp_name=f"Exp C: Focal Loss (Gamma={g})",
            config_override={
                "seed": 42,
                "training": {"balanced_sampling": False},
                "quantum": {"focal_gamma": g}
            },
            epochs=args.epochs
        )
        leaderboard.append(exp_c)
        
    # D. Baseline + Balanced Sampling (WeightedRandomSampler)
    exp_d = run_experiment(
        model_name="QuantumDerma",
        exp_name="Exp D: Balanced Sampler",
        config_override={
            "seed": 42,
            "training": {"balanced_sampling": True},
            "quantum": {"focal_gamma": 2.0}
        },
        epochs=args.epochs
    )
    leaderboard.append(exp_d)
    
    # F. Best Strategy + PCA comparison (8 vs 24 components)
    for pca_c in [8, 24]:
        print(f"[Ablation] Fitting PCA with {pca_c} components for comparison...")
        fit_pca(model_name="DenseNet121", n_components=pca_c)
        exp_f = run_experiment(
            model_name="QuantumDerma",
            exp_name=f"Exp F: PCA {pca_c}",
            config_override={
                "seed": 42,
                "training": {"balanced_sampling": True},
                "quantum": {"focal_gamma": 2.0, "pca_components": pca_c}
            },
            epochs=args.epochs
        )
        leaderboard.append(exp_f)
        
    # Restore standard 16 components PCA
    fit_pca(model_name="DenseNet121", n_components=16)
    
    # G. Architecture improvement (QuantumDermaX, QSkin-Vortex)
    for model_variant in ["QuantumDermaX", "QSkin-Vortex"]:
        exp_g = run_experiment(
            model_name=model_variant,
            exp_name=f"Exp G: {model_variant}",
            config_override={
                "seed": 42,
                "training": {"balanced_sampling": True},
                "quantum": {"focal_gamma": 2.0}
            },
            epochs=args.epochs
        )
        leaderboard.append(exp_g)
        
    # H. Multiple Seeds (seed 123 & seed 2026 on QuantumDermaX)
    for s in [123, 2026]:
        exp_h = run_experiment(
            model_name="QuantumDermaX",
            exp_name=f"Exp H: Seed {s}",
            config_override={
                "seed": s,
                "training": {"balanced_sampling": True},
                "quantum": {"focal_gamma": 2.0}
            },
            epochs=args.epochs
        )
        leaderboard.append(exp_h)
        
    # Save leaderboard
    out_path = REPORTS_DIR / "ablation_leaderboard.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(leaderboard, f, indent=2)
        
    # Generate markdown table and print it (no tabulate dependency needed)
    headers = ["Experiment", "Model", "Seed", "Training Time (s)", "Accuracy", "Macro F1", "Weighted F1", "Balanced Accuracy", "ROC-AUC"]
    markdown_lines = []
    markdown_lines.append("| " + " | ".join(headers) + " |")
    markdown_lines.append("| " + " | ".join(["---"] * len(headers)) + " |")
    for row in leaderboard:
        row_vals = [str(row[h]) for h in headers]
        markdown_lines.append("| " + " | ".join(row_vals) + " |")
    markdown_table = "\n".join(markdown_lines)
    
    print("\n========================================================")
    print(" ABLATION LEADERBOARD RESULT")
    print("========================================================")
    print(markdown_table)
    
    (REPORTS_DIR / "ablation_leaderboard.md").write_text(markdown_table, encoding="utf-8")

if __name__ == "__main__":
    main()
