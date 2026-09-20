"""Skin Cancer (HAM10000) Fine-Tuning Pipeline: DenseNet-121 + Q-Skin-Vortex Hybrid Head.

Optimized for execution in Kaggle (GPU T4 / P100) or local CUDA environments.
Dataset: HAM10000 Dermatoscopy (/kaggle/input/skin-cancer-mnist-ham10000)
"""

import argparse
import os
import sys
import time
from pathlib import Path

# Add project roots for imports
current_dir = Path(__file__).resolve().parent
common_dir = current_dir.parent / "common"
if str(common_dir) not in sys.path:
    sys.path.insert(0, str(common_dir))

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torchvision.transforms as T
from PIL import Image
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, Dataset
from torchvision.models import densenet121, DenseNet121_Weights
from tqdm import tqdm

from lr_schedulers import CosineAnnealingWarmupRestarts
from metrics_evaluator import evaluate_clinical_model
from quantum_circuits import QuantumHybridHead


class HAM10000Dataset(Dataset):
    """Custom dataset loader for Kaggle HAM10000 structure."""

    def __init__(self, metadata_df: pd.DataFrame, img_dir_list: list, transform=None):
        self.df = metadata_df.reset_index(drop=True)
        self.transform = transform
        self.img_map = {}

        # Scan image directories
        for d in img_dir_list:
            p = Path(d)
            if p.exists():
                for f in p.glob("*.jpg"):
                    self.img_map[f.stem] = str(f)

        # Mapping for 7 diagnostic categories or binary (benign vs malignant/melanoma)
        # nv, mel, bkl, bcc, akiec, vasc, df
        self.label_map = {
            "nv": 0, "bkl": 0, "df": 0, "vasc": 0,  # Benign group
            "mel": 1, "bcc": 1, "akiec": 1,         # Malignant / High-risk group
        }

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_id = row.get("image_id", "")
        dx = row.get("dx", "nv")
        label = self.label_map.get(dx, 0)

        img_path = self.img_map.get(img_id)
        if img_path and Path(img_path).exists():
            try:
                image = Image.open(img_path).convert("RGB")
            except Exception:
                image = Image.new("RGB", (224, 224), color=0)
        else:
            image = Image.new("RGB", (224, 224), color=128)

        if self.transform:
            image = self.transform(image)

        return image, label


class QSkinVortexNet(nn.Module):
    """Deep Hybrid Architecture: Pretrained DenseNet-121 + 8-Qubit Parameterized Quantum Head."""

    def __init__(self, n_qubits: int = 8, n_layers: int = 3, freeze_backbone: bool = True):
        super().__init__()
        weights = DenseNet121_Weights.DEFAULT
        backbone = densenet121(weights=weights)

        self.features = backbone.features
        in_features = 1024  # DenseNet-121 feature dimension

        if freeze_backbone:
            for p in self.features.parameters():
                p.requires_grad = False
            # Unfreeze denseblock4 for dermatologic adaptation
            for p in self.features.denseblock4.parameters():
                p.requires_grad = True

        self.quantum_head = QuantumHybridHead(
            in_features=in_features,
            n_qubits=n_qubits,
            n_layers=n_layers,
            n_classes=2,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.features(x)
        out = nn.functional.relu(features, inplace=False)
        out = nn.functional.adaptive_avg_pool2d(out, (1, 1))
        feat = torch.flatten(out, 1)
        logits = self.quantum_head(feat)
        return logits


def get_transforms():
    train_transform = T.Compose([
        T.Resize((224, 224)),
        T.RandomHorizontalFlip(p=0.5),
        T.RandomVerticalFlip(p=0.5),
        T.RandomRotation(degrees=20),
        T.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    val_transform = T.Compose([
        T.Resize((224, 224)),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    return train_transform, val_transform


def train_skin_cancer_pipeline(args):
    device = torch.device("cuda" if torch.cuda.is_available() and not args.cpu else "cpu")
    print(f"🚀 Initializing Dermatology (HAM10000) Fine-Tuning on: {device}")

    meta_path = Path(args.data_dir) / "HAM10000_metadata.csv"
    img_dirs = [
        Path(args.data_dir) / "HAM10000_images_part_1",
        Path(args.data_dir) / "HAM10000_images_part_2",
        Path(args.data_dir) / "ham10000_images_part_1",
        Path(args.data_dir) / "ham10000_images_part_2",
        Path(args.data_dir),
    ]

    if meta_path.exists():
        df = pd.read_csv(meta_path)
    else:
        print(f"[Warning] Metadata {meta_path} not found. Creating dummy split for dry-run testing.")
        df = pd.DataFrame({
            "image_id": [f"ISIC_{i:07d}" for i in range(args.max_samples or 32)],
            "dx": ["nv" if i % 2 == 0 else "mel" for i in range(args.max_samples or 32)],
        })

    if args.max_samples and len(df) > args.max_samples:
        df = df.iloc[:args.max_samples]

    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42)
    train_df, val_df = train_test_split(train_df, test_size=0.15, random_state=42)

    train_tf, val_tf = get_transforms()
    train_ds = HAM10000Dataset(train_df, img_dirs, transform=train_tf)
    val_ds = HAM10000Dataset(val_df, img_dirs, transform=val_tf)
    test_ds = HAM10000Dataset(test_df, img_dirs, transform=val_tf)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=args.num_workers)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=args.num_workers)
    test_loader = DataLoader(test_ds, batch_size=args.batch_size, shuffle=False, num_workers=args.num_workers)

    model = QSkinVortexNet(n_qubits=args.n_qubits, n_layers=args.n_layers, freeze_backbone=not args.unfreeze_all)
    model.to(device)

    # Class weights for imbalance compensation
    class_weights = torch.tensor([1.0, 3.0]).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    optimizer = torch.optim.AdamW(
        [
            {"params": model.features.parameters(), "lr": args.backbone_lr},
            {"params": model.quantum_head.parameters(), "lr": args.quantum_lr},
        ],
        weight_decay=1e-4,
    )

    scheduler = CosineAnnealingWarmupRestarts(
        optimizer,
        max_lr=args.quantum_lr,
        min_lr=1e-6,
        warmup_epochs=2,
        total_epochs=args.epochs,
    )

    best_val_acc = 0.0
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    best_model_path = output_dir / "Q-Skin-Vortex-FineTuned.pt"

    history = {
        "train_loss": [],
        "train_acc": [],
        "val_loss": [],
        "val_acc": [],
    }

    for epoch in range(args.epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        pbar = tqdm(train_loader, desc=f"Epoch [{epoch+1:02d}/{args.epochs:02d}] Training")
        for images, labels in pbar:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            preds = torch.argmax(logits, dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
            pbar.set_postfix({"Loss": f"{loss.item():.4f}", "Acc": f"{correct/max(1, total):.2%}"})

        scheduler.step()
        epoch_train_loss = running_loss / max(1, total)
        epoch_train_acc = correct / max(1, total)

        # Validation pass
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                logits = model(images)
                loss = criterion(logits, labels)
                val_loss += loss.item() * images.size(0)
                preds = torch.argmax(logits, dim=1)
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)

        epoch_val_loss = val_loss / max(1, val_total)
        epoch_val_acc = val_correct / max(1, val_total)

        history["train_loss"].append(round(epoch_train_loss, 4))
        history["train_acc"].append(round(epoch_train_acc, 4))
        history["val_loss"].append(round(epoch_val_loss, 4))
        history["val_acc"].append(round(epoch_val_acc, 4))

        print(f"--> Epoch [{epoch+1:02d}] Train Acc: {epoch_train_acc:.2%} | Val Acc: {epoch_val_acc:.2%} (Val Loss: {epoch_val_loss:.4f})")

        if epoch_val_acc >= best_val_acc:
            best_val_acc = epoch_val_acc
            torch.save(
                {
                    "epoch": epoch + 1,
                    "model_state_dict": model.state_dict(),
                    "val_acc": epoch_val_acc,
                    "arch": "DenseNet-121 + 8-Qubit Q-Skin-Vortex",
                },
                best_model_path,
            )
            print(f"✨ Best model checkpoint saved to {best_model_path}")

    # Save training history
    with open(output_dir / "training_history.json", "w") as f:
        import json
        json.dump(history, f, indent=2)

    # Final Evaluation on Test Partition
    print("\n🔬 Executing Benchmark Evaluation on Test Split...")
    model.eval()
    y_true_list = []
    y_pred_list = []
    y_prob_list = []
    latencies = []

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            t0 = time.perf_counter()
            logits = model(images)
            t1 = time.perf_counter()
            latencies.append((t1 - t0) * 1000 / max(1, len(images)))

            probs = torch.softmax(logits, dim=1).cpu().numpy()
            preds = np.argmax(probs, axis=1)

            y_true_list.extend(labels.numpy())
            y_pred_list.extend(preds)
            y_prob_list.extend(probs)

    metrics = evaluate_clinical_model(
        model_name="Q-Skin-Vortex-FineTuned",
        model_type="Quantum Hybrid VQC Head",
        y_true=np.array(y_true_list),
        y_pred=np.array(y_pred_list),
        y_prob=np.array(y_prob_list),
        inference_time_ms=float(np.mean(latencies)) if latencies else 0.0,
    )

    print(f"✅ Skin Cancer Fine-Tuning Complete! Model stored at: {best_model_path}")
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune Q-Skin-Vortex on HAM10000")
    parser.add_argument("--data-dir", type=str, default="/kaggle/input/skin-cancer-mnist-ham10000")
    parser.add_argument("--output-dir", type=str, default="./outputs/skin_cancer")
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--quantum-lr", type=float, default=0.005)
    parser.add_argument("--backbone-lr", type=float, default=0.0001)
    parser.add_argument("--n-qubits", type=int, default=8)
    parser.add_argument("--n-layers", type=int, default=3)
    parser.add_argument("--num-workers", type=int, default=2)
    parser.add_argument("--unfreeze-all", action="store_true")
    parser.add_argument("--max-samples", type=int, default=None)
    parser.add_argument("--cpu", action="store_true")
    args = parser.parse_args()

    train_skin_cancer_pipeline(args)
