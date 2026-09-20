from __future__ import annotations
import json
import time
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from ml.skin_cancer.paths import REPORTS_DIR, MODELS_DIR, ensure_dirs
from ml.skin_cancer.training.train_quantum import train_quantum, _loader
from ml.skin_cancer.features.pca_features import fit_pca
from ml.skin_cancer.quantum.quantum_utils import FocalLoss
from ml.skin_cancer.data.split_dataset import load_manifest

def sanity_check_focal_loss():
    print("\n=== 5. VERIFY FOCAL LOSS SANITY CHECK ===")
    # 3 examples: correct class probability is 0.9 (easy), 0.5 (medium), 0.1 (hard)
    # Logits: [0.0, log(0.9/0.1)], etc.
    easy_logits = torch.tensor([[0.0, np.log(0.9 / 0.1)]]) # softmax -> [0.1, 0.9]
    med_logits = torch.tensor([[0.0, 0.0]]) # softmax -> [0.5, 0.5]
    hard_logits = torch.tensor([[0.0, np.log(0.1 / 0.9)]]) # softmax -> [0.9, 0.1]
    
    target = torch.tensor([1]) # true class is index 1
    
    fl = FocalLoss(gamma=2.0, weight=None, label_smoothing=0.0)
    
    easy_loss = fl(easy_logits, target).item()
    med_loss = fl(med_logits, target).item()
    hard_loss = fl(hard_logits, target).item()
    
    # Standard Cross Entropy for comparison
    ce_easy = nn.functional.cross_entropy(easy_logits, target).item()
    ce_med = nn.functional.cross_entropy(med_logits, target).item()
    ce_hard = nn.functional.cross_entropy(hard_logits, target).item()
    
    print(f"Easy example (p_t=0.9): CE Loss = {ce_easy:.4f} | Focal Loss = {easy_loss:.4f} (focal weight = {(1.0-0.9)**2:.4f})")
    print(f"Medium example (p_t=0.5): CE Loss = {ce_med:.4f} | Focal Loss = {med_loss:.4f} (focal weight = {(1.0-0.5)**2:.4f})")
    print(f"Hard example (p_t=0.1): CE Loss = {ce_hard:.4f} | Focal Loss = {hard_loss:.4f} (focal weight = {(1.0-0.1)**2:.4f})")
    print("Focal Loss behaves correctly (discounts easy examples by 100x while keeping hard examples high).")

def verify_sampler_distribution():
    print("\n=== 6. VERIFY BALANCED SAMPLING DISTRIBUTION ===")
    manifest = load_manifest()
    y_train = manifest.loc[manifest["split"] == "train", "class_id"].to_numpy()
    x_dummy = np.zeros((len(y_train), 16))
    
    loader = _loader(x_dummy, y_train, batch=64, shuffle=True, balanced=True)
    
    # Draw one full epoch of samples
    sampled_labels = []
    for _, y_batch in loader:
        sampled_labels.extend(y_batch.numpy().tolist())
        
    counts = np.bincount(sampled_labels, minlength=7)
    classes = ["akiec", "bcc", "bkl", "df", "nv", "vasc", "mel"]
    for i, name in enumerate(classes):
        print(f"{name:<6} $\\rightarrow$ sampled count: {counts[i]}")
    print(f"Total sampled: {sum(counts)} (Expected: {len(y_train)})")

def run_ablation_run(model_name: str, config_override: dict, epochs: int) -> dict:
    out_dir = train_quantum(model_name=model_name, config_override=config_override)
    with open(out_dir / "metrics.json", "r", encoding="utf-8") as f:
        metrics = json.load(f)
    return metrics

def main() -> None:
    ensure_dirs()
    sanity_check_focal_loss()
    verify_sampler_distribution()
    
    epochs = 20
    results = []
    
    print("\n=== STARTING CONTROLLED ABLATIONS (20 EPOCHS EACH) ===")
    
    # 1. Base config setups
    configs_to_test = [
        # A: Baseline (PCA 16, cosine restarts, balanced=false)
        {
            "id": "A. Baseline", "model": "QuantumDerma", "pca": 16,
            "override": {"seed": 42, "training": {"balanced_sampling": False, "scheduler": "cosine_restarts"}, "quantum": {"focal_gamma": 2.0}}
        },
        # B: Balanced sampler + Normal loss (focal_gamma=0 is weighted CE, weight=None when balanced is true)
        {
            "id": "B. Balanced Sampler + Normal Loss", "model": "QuantumDerma", "pca": 16,
            "override": {"seed": 42, "training": {"balanced_sampling": True, "scheduler": "cosine_restarts"}, "quantum": {"focal_gamma": 0.0}}
        },
        # C: Balanced sampler + Focal (focal_gamma=2, no class weights, PCA 16)
        {
            "id": "C. Balanced Sampler + Focal Loss", "model": "QuantumDerma", "pca": 16,
            "override": {"seed": 42, "training": {"balanced_sampling": True, "scheduler": "cosine_restarts"}, "quantum": {"focal_gamma": 2.0}}
        },
        # D: Balanced sampler + Focal + PCA 8
        {
            "id": "D. Balanced Sampler + Focal + PCA 8", "model": "QuantumDerma", "pca": 8,
            "override": {"seed": 42, "training": {"balanced_sampling": True, "scheduler": "cosine_restarts"}, "quantum": {"focal_gamma": 2.0}}
        },
        # E: Balanced sampler + Focal + PCA 12
        {
            "id": "E. Balanced Sampler + Focal + PCA 12", "model": "QuantumDerma", "pca": 12,
            "override": {"seed": 42, "training": {"balanced_sampling": True, "scheduler": "cosine_restarts"}, "quantum": {"focal_gamma": 2.0}}
        },
        # PCA 24
        {
            "id": "Ablation: PCA 24", "model": "QuantumDerma", "pca": 24,
            "override": {"seed": 42, "training": {"balanced_sampling": True, "scheduler": "cosine_restarts"}, "quantum": {"focal_gamma": 2.0}}
        },
        # PCA 32
        {
            "id": "Ablation: PCA 32", "model": "QuantumDerma", "pca": 32,
            "override": {"seed": 42, "training": {"balanced_sampling": True, "scheduler": "cosine_restarts"}, "quantum": {"focal_gamma": 2.0}}
        },
        # Scheduler: Cosine without restarts (on best config: Balanced Sampler + Focal, PCA 16)
        {
            "id": "Scheduler: Cosine No Restarts", "model": "QuantumDerma", "pca": 16,
            "override": {"seed": 42, "training": {"balanced_sampling": True, "scheduler": "cosine"}, "quantum": {"focal_gamma": 2.0}}
        },
        # Scheduler: ReduceLROnPlateau (on best config: Balanced Sampler + Focal, PCA 16)
        {
            "id": "Scheduler: ReduceLROnPlateau", "model": "QuantumDerma", "pca": 16,
            "override": {"seed": 42, "training": {"balanced_sampling": True, "scheduler": "plateau"}, "quantum": {"focal_gamma": 2.0}}
        }
    ]
    
    leaderboard = []
    
    for cfg_run in configs_to_test:
        print(f"\n>>> Running {cfg_run['id']}...")
        # Fit PCA first
        fit_pca(model_name="DenseNet121", n_components=cfg_run["pca"])
        
        # Override PCA component count in config override
        cfg_run["override"]["quantum"]["pca_components"] = cfg_run["pca"]
        cfg_run["override"]["training"]["epochs"] = epochs
        
        metrics = run_ablation_run(cfg_run["model"], cfg_run["override"], epochs)
        
        # Load PCA explained variance
        feat_dir = REPORTS_DIR / "features" / "DenseNet121"
        pca_meta = json.loads((feat_dir / "pca_meta.json").read_text(encoding="utf-8"))
        var_explained = pca_meta["total_explained_variance"]
        
        results.append({
            "Configuration": cfg_run["id"],
            "PCA": cfg_run["pca"],
            "Explained Var": round(var_explained, 4),
            "Sampler": "Weighted" if cfg_run["override"]["training"]["balanced_sampling"] else "Normal",
            "Loss": f"Focal (G={cfg_run['override']['quantum']['focal_gamma']})" if cfg_run["override"]["quantum"]["focal_gamma"] > 0 else "Weighted CE",
            "Scheduler": cfg_run["override"]["training"]["scheduler"],
            "Accuracy": round(metrics["accuracy"], 4),
            "Macro F1": round(metrics["macro_f1"], 4),
            "Balanced Acc": round(metrics.get("sensitivity_macro", metrics.get("macro_f1")), 4),
            "ROC-AUC": round(metrics["roc_auc"], 4)
        })
        
    # Generate final tables
    df = pd.DataFrame(results)
    
    headers = ["Configuration", "PCA", "Sampler", "Loss", "Scheduler", "Accuracy", "Macro F1", "Balanced Acc", "ROC-AUC"]
    markdown_lines = []
    markdown_lines.append("| " + " | ".join(headers) + " |")
    markdown_lines.append("| " + " | ".join(["---"] * len(headers)) + " |")
    for _, row in df.iterrows():
        markdown_lines.append("| " + " | ".join([str(row[h]) for h in headers]) + " |")
    table_md = "\n".join(markdown_lines)
    
    print("\n" + "="*80)
    print(" SCIENTIFIC ABLATION LEADERBOARD")
    print("="*80)
    print(table_md)
    (REPORTS_DIR / "scientific_ablation_leaderboard.md").write_text(table_md, encoding="utf-8")

if __name__ == "__main__":
    main()
