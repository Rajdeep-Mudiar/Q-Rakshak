from __future__ import annotations
import json
import time
from pathlib import Path
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from ml.skin_cancer.paths import REPORTS_DIR, MODELS_DIR, ensure_dirs
from ml.skin_cancer.training.train_quantum import train_quantum
from ml.skin_cancer.features.pca_features import fit_pca
from ml.skin_cancer.data.split_dataset import load_manifest

def get_feature_statistics():
    print("\n=== 4. FEATURE AND ANGLE SCALING STATISTICS ===")
    feat_path = Path("reports/skin_cancer/features/DenseNet121/train_x.npy")
    if not feat_path.exists():
        print("Feature file train_x.npy not found.")
        return
    x_train = np.load(feat_path)
    
    # Simulate BatchNorm + Projection + Angle Scaling
    x_tensor = torch.tensor(x_train, dtype=torch.float32)
    bn = nn.BatchNorm1d(x_train.shape[1], affine=False)
    proj = nn.Linear(x_train.shape[1], 10)
    
    # Fit BN
    bn.train()
    x_bn = bn(x_tensor)
    
    # Projection (initialize projection weights standard)
    nn.init.xavier_uniform_(proj.weight)
    nn.init.zeros_(proj.bias)
    x_proj = proj(x_bn)
    
    # Angle scale (tanh angle-scaling)
    x_angle = torch.tanh(x_proj) * np.pi
    
    x_bn_np = x_bn.detach().numpy()
    x_proj_np = x_proj.detach().numpy()
    x_angle_np = x_angle.detach().numpy()
    
    print("Features entering BN:")
    print(f"  Min: {x_train.min():.4f} | Max: {x_train.max():.4f} | Mean: {x_train.mean():.4f} | Std: {x_train.std():.4f}")
    print("Features after BN:")
    print(f"  Min: {x_bn_np.min():.4f} | Max: {x_bn_np.max():.4f} | Mean: {x_bn_np.mean():.4f} | Std: {x_bn_np.std():.4f}")
    print("Features after Projection:")
    print(f"  Min: {x_proj_np.min():.4f} | Max: {x_proj_np.max():.4f} | Mean: {x_proj_np.mean():.4f} | Std: {x_proj_np.std():.4f}")
    print("Encoded angles entering quantum circuit (tanh projection * pi):")
    print(f"  Min: {x_angle_np.min():.4f} | Max: {x_angle_np.max():.4f} | Mean: {x_angle_np.mean():.4f} | Std: {x_angle_np.std():.4f}")

def run_one_experiment(exp_id: str, model_name: str, pca_size: int, config: dict) -> dict:
    print(f"\n>>> Running {exp_id}...")
    fit_pca(model_name="DenseNet121", n_components=pca_size)
    config["quantum"]["pca_components"] = pca_size
    
    start = time.time()
    out_dir = train_quantum(model_name=model_name, config_override=config)
    duration = time.time() - start
    
    with open(out_dir / "metrics.json", "r", encoding="utf-8") as f:
        metrics = json.load(f)
        
    return {
        "Experiment": exp_id,
        "PCA": pca_size,
        "Gamma": config["quantum"].get("focal_gamma", 2.0),
        "Layers": config["quantum"].get("n_layers", 4),
        "Accuracy": round(metrics["accuracy"], 4),
        "Macro F1": round(metrics["macro_f1"], 4),
        "Balanced Acc": round(metrics.get("sensitivity_macro", metrics.get("macro_f1")), 4),
        "ROC-AUC": round(metrics["roc_auc"], 4),
        "Duration (s)": round(duration, 1)
    }

def main():
    ensure_dirs()
    get_feature_statistics()
    
    epochs = 20
    results = []
    
    # base baseline override config (Normal sampling, Cosine restarts, focal gamma=2.0)
    base_override = {
        "seed": 42,
        "training": {
            "epochs": epochs,
            "balanced_sampling": False,
            "scheduler": "cosine_restarts"
        },
        "quantum": {
            "focal_gamma": 2.0,
            "n_layers": 4
        }
    }
    
    # 2. Clean PCA ablation with normal sampling
    print("\n=== PHASE 2.1: PCA ABLATION ===")
    for pca in [8, 12, 16, 24, 32]:
        results.append(run_one_experiment(f"PCA {pca}", "QuantumDerma", pca, base_override))
        
    # 3. Focal Gamma ablation (using best PCA from baseline/results, default to 16)
    print("\n=== PHASE 2.2: FOCAL GAMMA ABLATION ===")
    for gamma in [1.0, 1.5, 2.5, 3.0]:
        cfg = base_override.copy()
        cfg["quantum"] = cfg["quantum"].copy()
        cfg["quantum"]["focal_gamma"] = gamma
        results.append(run_one_experiment(f"Gamma {gamma}", "QuantumDerma", 16, cfg))
        
    # 4. Quantum Circuit Depth ablation (Layers count: 5 and 6)
    print("\n=== PHASE 2.3: QUANTUM DEPTH ABLATION ===")
    for layers in [5, 6]:
        cfg = base_override.copy()
        cfg["quantum"] = cfg["quantum"].copy()
        cfg["quantum"]["n_layers"] = layers
        results.append(run_one_experiment(f"Depth {layers} layers", "QuantumDerma", 16, cfg))
        
    # Generate leaderboard
    df = pd.DataFrame(results)
    headers = ["Experiment", "PCA", "Gamma", "Layers", "Accuracy", "Macro F1", "Balanced Acc", "ROC-AUC", "Duration (s)"]
    markdown_lines = []
    markdown_lines.append("| " + " | ".join(headers) + " |")
    markdown_lines.append("| " + " | ".join(["---"] * len(headers)) + " |")
    for _, row in df.iterrows():
        markdown_lines.append("| " + " | ".join([str(row[h]) for h in headers]) + " |")
    table_md = "\n".join(markdown_lines)
    
    print("\n" + "="*80)
    print(" PHASE 2 SCIENTIFIC LEADERBOARD")
    print("="*80)
    print(table_md)
    (REPORTS_DIR / "phase2_leaderboard.md").write_text(table_md, encoding="utf-8")

if __name__ == "__main__":
    main()
