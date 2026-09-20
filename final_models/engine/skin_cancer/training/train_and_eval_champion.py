from __future__ import annotations
import json
import numpy as np
import torch
import torch.nn as nn
from ml.skin_cancer.training.train_quantum import train_quantum, _loader
from ml.skin_cancer.features.pca_features import fit_pca
from ml.skin_cancer.quantum.quantum_derma import QuantumDerma
from ml.skin_cancer.data.split_dataset import load_manifest
from ml.skin_cancer.evaluation.metrics import compute_metrics
from ml.skin_cancer.paths import MODELS_DIR

def main():
    epochs = 20
    pca_size = 16
    
    # Fit PCA
    fit_pca(model_name="DenseNet121", n_components=pca_size)
    
    cfg = {
        "seed": 42,
        "training": {
            "epochs": epochs,
            "balanced_sampling": False,
            "scheduler": "cosine_restarts"
        },
        "quantum": {
            "focal_gamma": 2.0,
            "layers": 4,
            "pca_components": pca_size
        }
    }
    
    print("\n>>> Training champion model to extract detailed confusion analysis...")
    out_dir = train_quantum(model_name="QuantumDerma", config_override=cfg)
    
    # Load validation data
    feat_dir = Path("reports/skin_cancer/features/DenseNet121")
    x_val = np.load(feat_dir / "val_pca.npy")
    y_val = np.load(feat_dir / "val_y.npy")
    
    # Load champion model
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = QuantumDerma(num_classes=7, in_dim=pca_size, n_layers=4)
    model.load_state_dict(torch.load(out_dir / "best.pt", map_location=device))
    model.to(device)
    model.eval()
    
    # Evaluate
    val_loader = _loader(x_val, y_val, batch=64, shuffle=False)
    ys, ps = [], []
    with torch.no_grad():
        for x_batch, y_batch in val_loader:
            prob = torch.softmax(model(x_batch.to(device)), dim=1)
            ys.append(y_batch.numpy())
            ps.append(prob.cpu().numpy())
            
    y_true = np.concatenate(ys)
    p_pred = np.concatenate(ps)
    y_pred = p_pred.argmax(axis=1)
    
    # Compute confusion matrix
    num_classes = 7
    classes = ["akiec", "bcc", "bkl", "df", "nv", "vasc", "mel"]
    
    cm = np.zeros((num_classes, num_classes), dtype=int)
    for t, p in zip(y_true, y_pred):
        cm[t, p] += 1
        
    print("\n=== RAW CONFUSION MATRIX ===")
    print("True \\ Pred")
    print(f"{'':<8} | " + " | ".join(f"{c:<5}" for c in classes))
    print("-" * 60)
    for i in range(num_classes):
        print(f"{classes[i]:<8} | " + " | ".join(f"{cm[i, j]:<5}" for j in range(num_classes)))
        
    print("\n=== NORMALIZED CONFUSION MATRIX (Row Normalized) ===")
    print(f"{'':<8} | " + " | ".join(f"{c:<6}" for c in classes))
    print("-" * 65)
    for i in range(num_classes):
        row_sum = max(cm[i].sum(), 1)
        print(f"{classes[i]:<8} | " + " | ".join(f"{cm[i, j]/row_sum:<6.3f}" for j in range(num_classes)))
        
    print("\n=== DETAILED CLASS-SPECIFIC PERFORMANCE ===")
    print(f"{'class':<8} | {'precision':<9} | {'recall':<8} | {'F1':<8} | {'support':<7} | {'FP':<5} | {'FN':<5}")
    print("-" * 70)
    for i in range(num_classes):
        support = int((y_true == i).sum())
        tp = int(cm[i, i])
        fn = int(support - tp)
        fp = int(cm[:, i].sum() - tp)
        
        precision = tp / max((tp + fp), 1)
        recall = tp / max(support, 1)
        f1 = 2 * precision * recall / max((precision + recall), 1e-8)
        
        print(f"{classes[i]:<8} | {precision:<9.4f} | {recall:<8.4f} | {f1:<8.4f} | {support:<7} | {fp:<5} | {fn:<5}")
        
    print("\n=== TOP CONFUSIONS ===")
    for i in range(num_classes):
        sorted_idx = np.argsort(cm[i])[::-1]
        confused_with = []
        for idx in sorted_idx:
            if idx != i and cm[i, idx] > 0:
                confused_with.append(f"{classes[idx]} ({cm[i, idx]} times)")
        print(f"{classes[i]:<6} is most confused with: {', '.join(confused_with[:3])}")

if __name__ == "__main__":
    from pathlib import Path
    main()
