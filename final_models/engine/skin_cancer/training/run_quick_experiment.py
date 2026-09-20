from __future__ import annotations
import time
import json
from pathlib import Path
import pandas as pd
from ml.skin_cancer.paths import REPORTS_DIR, ensure_dirs
from ml.skin_cancer.training.train_quantum import train_quantum

def run_one(model_name: str, exp_name: str, config_override: dict, epochs: int) -> dict:
    print(f"\n>>> Running {exp_name}...")
    start = time.time()
    out_dir = train_quantum(model_name=model_name, config_override=config_override)
    duration = time.time() - start
    
    with open(out_dir / "metrics.json", "r", encoding="utf-8") as f:
        metrics = json.load(f)
        
    return {
        "Experiment": exp_name,
        "Accuracy": round(metrics["accuracy"], 4),
        "Macro F1": round(metrics["macro_f1"], 4),
        "Balanced Accuracy": round(metrics.get("sensitivity_macro", metrics.get("macro_f1")), 4),
        "ROC-AUC": round(metrics["roc_auc"], 4),
        "Time (s)": round(duration, 1),
    }

def main() -> None:
    ensure_dirs()
    epochs = 20
    results = []
    
    # A. Current Baseline (Focal Loss Gamma=2, standard LR restarts, balanced_sampling=False)
    results.append(run_one("QuantumDerma", "A. Baseline (Gamma=2)", {
        "seed": 42,
        "training": {"epochs": epochs, "balanced_sampling": False},
        "quantum": {"focal_gamma": 2.0}
    }, epochs))
    
    # B. Class-weighted loss + normal sampling (Focal Loss Gamma=0 is CE, balanced_sampling=False)
    results.append(run_one("QuantumDerma", "B. Class-weighted Loss + Normal Sampling", {
        "seed": 42,
        "training": {"epochs": epochs, "balanced_sampling": False},
        "quantum": {"focal_gamma": 0.0}
    }, epochs))
    
    # C. Balanced sampler + normal loss (balanced_sampling=True, Focal Loss Gamma=2)
    results.append(run_one("QuantumDerma", "C. Balanced Sampler + Normal Loss", {
        "seed": 42,
        "training": {"epochs": epochs, "balanced_sampling": True},
        "quantum": {"focal_gamma": 2.0}
    }, epochs))
    
    # E. Best imbalance strategy + corrected LR scheduler (AdamW, LR=2e-4, WD=1e-4, Cosine decay, patience=10)
    # We will use the Balanced Sampler strategy here (which proved better than weighted CE)
    results.append(run_one("QuantumDerma", "E. Balanced Sampler + Corrected LR Scheduler", {
        "seed": 42,
        "training": {
            "epochs": epochs,
            "balanced_sampling": True,
            "lr": 2e-4,
            "weight_decay": 1e-4,
            "scheduler": "cosine"
        },
        "quantum": {"focal_gamma": 2.0}
    }, epochs))
    
    # Save comparison table
    df = pd.DataFrame(results)
    headers = ["Experiment", "Accuracy", "Macro F1", "Balanced Accuracy", "ROC-AUC", "Time (s)"]
    markdown_lines = []
    markdown_lines.append("| " + " | ".join(headers) + " |")
    markdown_lines.append("| " + " | ".join(["---"] * len(headers)) + " |")
    for _, row in df.iterrows():
        markdown_lines.append("| " + " | ".join([str(row[h]) for h in headers]) + " |")
    table_md = "\n".join(markdown_lines)
    
    print("\n" + "="*50)
    print(" QUICK EXPERIMENTS LEADERBOARD")
    print("="*50)
    print(table_md)
    
    (REPORTS_DIR / "quick_experiments_leaderboard.md").write_text(table_md, encoding="utf-8")

if __name__ == "__main__":
    main()
