from __future__ import annotations
import json
import time
from pathlib import Path
from ml.skin_cancer.training.train_quantum import train_quantum

def main():
    epochs = 20
    results = []
    
    base_override = {
        "seed": 42,
        "training": {
            "epochs": epochs,
            "balanced_sampling": False,
            "scheduler": "cosine_restarts"
        },
        "quantum": {
            "focal_gamma": 2.0,
            "pca_components": 16
        }
    }
    
    for layers in [5, 6]:
        print(f"\n>>> Running Depth {layers} layers...")
        cfg = base_override.copy()
        cfg["quantum"] = cfg["quantum"].copy()
        cfg["quantum"]["layers"] = layers
        
        start = time.time()
        out_dir = train_quantum(model_name="QuantumDerma", config_override=cfg)
        duration = time.time() - start
        
        with open(out_dir / "metrics.json", "r", encoding="utf-8") as f:
            metrics = json.load(f)
            
        print(f"Depth {layers} layers metrics:")
        print(f"  Accuracy: {metrics['accuracy']:.4f} | Macro F1: {metrics['macro_f1']:.4f} | Balanced Acc: {metrics.get('sensitivity_macro', metrics.get('macro_f1')):.4f} | ROC-AUC: {metrics['roc_auc']:.4f}")

if __name__ == "__main__":
    main()
