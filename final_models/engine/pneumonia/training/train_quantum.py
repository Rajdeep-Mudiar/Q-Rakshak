from __future__ import annotations

import argparse
import json
import random
import time
from pathlib import Path

import joblib
import numpy as np
import torch
import torch.nn as nn
import yaml
from sklearn.decomposition import PCA
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_recall_fscore_support, roc_auc_score
from sklearn.preprocessing import StandardScaler
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingWarmRestarts
from torch.utils.data import DataLoader, TensorDataset
from tqdm import tqdm

from ml.pneumonia.classical import PneuVision
from ml.pneumonia.data.dataset_loader import build_dataset, discover_split_dirs, make_loader
from ml.pneumonia.paths import DATASET_ROOT, MODELS_DIR, REPORTS_DIR, ensure_dirs
from ml.pneumonia.preprocessing.transforms import eval_transform
from ml.pneumonia.quantum.quantum_pneu import QuantumPneu
from ml.pneumonia.training.train import train as train_classical_backbone
from ml.skin_cancer.quantum.quantum_utils import FocalLoss


def load_pneumonia_config(config_name: str = "quantum.yaml") -> dict:
    config_path = Path(__file__).resolve().parents[1] / "configs" / config_name
    if not config_path.exists():
        config_path = Path(config_name)
    with config_path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def _extract_split_features(backbone: PneuVision, loader: DataLoader, device: torch.device) -> tuple[np.ndarray, np.ndarray]:
    backbone.eval()
    features_list, labels_list = [], []
    with torch.no_grad():
        for images, labels in tqdm(loader, desc="extracting features", leave=False):
            feats = backbone.compact_features(images.to(device)).cpu().numpy()
            features_list.append(feats)
            labels_list.append(labels.numpy())
    return np.concatenate(features_list), np.concatenate(labels_list)


def _loader(x: np.ndarray, y: np.ndarray, batch_size: int, shuffle: bool) -> DataLoader:
    dataset = TensorDataset(torch.tensor(x, dtype=torch.float32), torch.tensor(y, dtype=torch.long))
    return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle)


def evaluate_quantum(model: nn.Module, x: np.ndarray, y: np.ndarray, device: torch.device, threshold: float = 0.5) -> dict:
    model.eval()
    with torch.no_grad():
        logits = model(torch.tensor(x, dtype=torch.float32, device=device))
        probs = torch.softmax(logits, dim=1)[:, 1].cpu().numpy()
    preds = (probs >= threshold).astype(int)
    cm = confusion_matrix(y, preds, labels=[0, 1])
    precision, recall, f1, _ = precision_recall_fscore_support(y, preds, labels=[0, 1], zero_division=0)
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
    specificity = float(tn / max(tn + fp, 1))
    sensitivity = float(tp / max(tp + fn, 1))
    try:
        roc = float(roc_auc_score(y, probs))
    except Exception:
        roc = float("nan")

    return {
        "accuracy": float(accuracy_score(y, preds)),
        "macro_f1": float(f1_score(y, preds, average="macro", zero_division=0)),
        "roc_auc": roc,
        "sensitivity": sensitivity,
        "specificity": specificity,
        "confusion_matrix": cm.tolist(),
        "decision_threshold": threshold,
    }


def find_best_threshold(model: nn.Module, x_val: np.ndarray, y_val: np.ndarray, device: torch.device) -> float:
    model.eval()
    with torch.no_grad():
        probs = torch.softmax(model(torch.tensor(x_val, dtype=torch.float32, device=device)), dim=1)[:, 1].cpu().numpy()
    candidates = [i / 100 for i in range(15, 86)]
    return max(
        candidates,
        key=lambda t: f1_score(y_val, (probs >= t).astype(int), average="macro", zero_division=0),
    )


def train_quantum_pneu(config_name: str = "quantum.yaml", root: Path | None = None) -> dict:
    """Train QuantumPneu hybrid model on chest X-ray pneumonia dataset."""
    ensure_dirs()
    cfg = load_pneumonia_config(config_name)
    seed = int(cfg.get("seed", 42))
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    dataset_root = root or Path(cfg["dataset"].get("root", DATASET_ROOT))
    image_size = int(cfg["dataset"].get("image_size", 224))
    tcfg = cfg["training"]
    qcfg = cfg["quantum"]

    # 1. Check/Train classical backbone for feature extraction
    backbone_ckpt = MODELS_DIR / "best.pt"
    if not backbone_ckpt.exists():
        print("[QuantumPneu] Backbone feature extractor not found. Training PneuVision first...")
        train_classical_backbone(root=dataset_root, epochs=8, image_size=image_size)

    splits = discover_split_dirs(dataset_root)
    backbone = PneuVision().to(device)
    ckpt = torch.load(backbone_ckpt, map_location=device, weights_only=False)
    backbone.load_state_dict(ckpt["model"])
    backbone.eval()

    # 2. Extract features
    feat_dir = REPORTS_DIR / "features"
    feat_dir.mkdir(parents=True, exist_ok=True)
    batch_size = int(tcfg.get("batch_size", 32))

    train_loader = make_loader(splits["train"], eval_transform(image_size), batch_size, False)
    if "val" in splits:
        val_loader = make_loader(splits["val"], eval_transform(image_size), batch_size, False)
    else:
        # Create deterministic split if val is absent
        train_data = build_dataset(splits["train"], eval_transform(image_size))
        gen = torch.Generator().manual_seed(seed)
        indices = torch.randperm(len(train_data), generator=gen).tolist()
        val_size = max(1, int(len(indices) * 0.1))
        from torch.utils.data import Subset
        val_loader = DataLoader(Subset(train_data, indices[:val_size]), batch_size=batch_size, shuffle=False)
        train_loader = DataLoader(Subset(train_data, indices[val_size:]), batch_size=batch_size, shuffle=False)

    test_loader = make_loader(splits["test"], eval_transform(image_size), batch_size, False)

    print("[QuantumPneu] Extracting CNN features from chest X-rays...")
    x_train_raw, y_train = _extract_split_features(backbone, train_loader, device)
    x_val_raw, y_val = _extract_split_features(backbone, val_loader, device)
    x_test_raw, y_test = _extract_split_features(backbone, test_loader, device)

    # 3. Fit PCA
    pca_dim = int(qcfg.get("pca_components", 8))
    scaler = StandardScaler()
    x_train_scaled = scaler.fit_transform(x_train_raw)
    pca = PCA(n_components=pca_dim, random_state=seed)
    x_train_pca = pca.fit_transform(x_train_scaled)
    x_val_pca = pca.transform(scaler.transform(x_val_raw))
    x_test_pca = pca.transform(scaler.transform(x_test_raw))

    quantum_out_dir = MODELS_DIR / "quantum" / "QuantumPneu"
    quantum_out_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(scaler, quantum_out_dir / "scaler.pkl")
    joblib.dump(pca, quantum_out_dir / "pca.pkl")
    joblib.dump(scaler, MODELS_DIR / "scaler.pkl")
    joblib.dump(pca, MODELS_DIR / "pca.pkl")

    # 4. Build Quantum Model
    n_qubits = int(qcfg.get("qubits", 8))
    n_layers = int(qcfg.get("layers", 4))
    model = QuantumPneu(
        in_dim=pca_dim,
        n_qubits=n_qubits,
        n_layers=n_layers,
        dropout=float(qcfg.get("dropout", 0.2)),
        embedding=str(qcfg.get("embedding", "angle")),
        ansatz=str(qcfg.get("ansatz", "strongly")),
        data_reupload=bool(qcfg.get("data_reupload", True)),
    ).to(device)

    # Class weights for Focal Loss
    counts = torch.bincount(torch.tensor(y_train, dtype=torch.long), minlength=2).float().clamp_min(1)
    class_weights = counts.sum() / (2.0 * counts)
    criterion = FocalLoss(
        gamma=float(qcfg.get("focal_gamma", 2.0)),
        weight=class_weights.to(device),
        label_smoothing=float(tcfg.get("label_smoothing", 0.1)),
    )

    optimizer = AdamW(
        model.parameters(),
        lr=float(tcfg.get("lr", 5.0e-4)),
        weight_decay=float(tcfg.get("weight_decay", 1.0e-5)),
    )
    scheduler = CosineAnnealingWarmRestarts(
        optimizer,
        T_0=int(tcfg.get("cosine_T0", 8)),
        T_mult=2,
        eta_min=1e-6,
    )

    train_data_loader = _loader(x_train_pca, y_train, batch_size, True)
    best_f1 = -1.0
    stale = 0
    patience = int(tcfg.get("patience", 8))
    max_grad_norm = float(tcfg.get("max_grad_norm", 1.0))
    history = []

    print("[QuantumPneu] Starting Quantum Training...")
    epochs = int(tcfg.get("epochs", 30))
    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        n_samples = 0
        start = time.time()

        for xb, yb in tqdm(train_data_loader, desc=f"[QuantumPneu] epoch {epoch}", leave=False):
            xb, yb = xb.to(device), yb.to(device)
            optimizer.zero_grad(set_to_none=True)
            loss = criterion(model(xb), yb)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=max_grad_norm)
            optimizer.step()
            running_loss += float(loss.item()) * len(yb)
            n_samples += len(yb)

        scheduler.step()
        val_eval = evaluate_quantum(model, x_val_pca, y_val, device)
        row = {
            "epoch": epoch,
            "train_loss": running_loss / max(n_samples, 1),
            "val_macro_f1": val_eval["macro_f1"],
            "val_accuracy": val_eval["accuracy"],
            "lr": optimizer.param_groups[0]["lr"],
            "seconds": round(time.time() - start, 2),
        }
        history.append(row)
        print(row)

        if val_eval["macro_f1"] > best_f1:
            best_f1 = val_eval["macro_f1"]
            stale = 0
            ckpt_data = {
                "model": model.state_dict(),
                "model_name": "QuantumPneu",
                "n_qubits": n_qubits,
                "n_layers": n_layers,
                "in_dim": pca_dim,
                "image_size": image_size,
                "config": qcfg,
                "epoch": epoch,
                "best_val_macro_f1": best_f1,
            }
            torch.save(ckpt_data, quantum_out_dir / "best.pt")
            torch.save(ckpt_data, MODELS_DIR / "quantum_best.pt")
        else:
            stale += 1
            if stale >= patience:
                print(f"[QuantumPneu] Early stopping triggered at epoch {epoch}")
                break

    # 5. Optimal Threshold & Final Test Evaluation
    best_ckpt = torch.load(quantum_out_dir / "best.pt", map_location=device, weights_only=False)
    model.load_state_dict(best_ckpt["model"])
    model.eval()

    threshold = find_best_threshold(model, x_val_pca, y_val, device)
    test_metrics = evaluate_quantum(model, x_test_pca, y_test, device, threshold=threshold)
    test_metrics["model"] = "QuantumPneu"
    test_metrics["n_qubits"] = n_qubits
    test_metrics["n_layers"] = n_layers
    test_metrics["data_reupload"] = True
    test_metrics["best_val_macro_f1"] = best_f1

    # Save threshold to checkpoint
    best_ckpt["decision_threshold"] = threshold
    best_ckpt["test_metrics"] = test_metrics
    torch.save(best_ckpt, quantum_out_dir / "best.pt")
    torch.save(best_ckpt, MODELS_DIR / "quantum_best.pt")

    (quantum_out_dir / "metrics.json").write_text(json.dumps(test_metrics, indent=2), encoding="utf-8")
    (MODELS_DIR / "quantum_metrics.json").write_text(json.dumps(test_metrics, indent=2), encoding="utf-8")
    (quantum_out_dir / "training_history.json").write_text(json.dumps(history, indent=2), encoding="utf-8")

    print("[QuantumPneu] Training complete. Test Metrics:")
    print(json.dumps(test_metrics, indent=2))
    return test_metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train QuantumPneu hybrid model for chest X-ray pneumonia classification.")
    parser.add_argument("--config", default="quantum.yaml")
    parser.add_argument("--root", type=Path, default=None)
    args = parser.parse_args()
    train_quantum_pneu(args.config, args.root)
