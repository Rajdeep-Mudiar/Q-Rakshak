"""Pneumonia (Chest X-Ray) Fine-Tuning Pipeline: EfficientNet-B0 + QuantumPneu Hybrid VQC Head.

Optimized for execution in Kaggle (GPU T4 / P100) or local CUDA environments.
Dataset: Kermany Pediatric Chest X-Rays (/kaggle/input/chest-xray-pneumonia/chest_xray)
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
import torch
import torch.nn as nn
import torchvision.transforms as T
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
from tqdm import tqdm

from lr_schedulers import CosineAnnealingWarmupRestarts
from metrics_evaluator import evaluate_clinical_model
from quantum_circuits import QuantumHybridHead


class ChestXRayDataset(Dataset):
    """Custom dataset loader for Kaggle Kermany Chest X-Ray structure."""

    def __init__(self, root_dir: str, split: str = "train", transform=None, max_samples: int = None):
        self.root_dir = Path(root_dir) / split
        self.transform = transform
        self.samples = []

        if not self.root_dir.exists():
            # Create synthetic fallback for dry-run/testing
            print(f"[Warning] Dataset path {self.root_dir} not found. Generating dummy samples for dry-run.")
            self.is_dummy = True
            self.samples = [("dummy", i % 2) for i in range(max_samples or 32)]
            return

        self.is_dummy = False
        # NORMAL -> 0, PNEUMONIA -> 1
        for class_idx, class_name in enumerate(["NORMAL", "PNEUMONIA"]):
            class_folder = self.root_dir / class_name
            if class_folder.exists():
                for img_path in class_folder.glob("*.jpeg"):
                    self.samples.append((str(img_path), class_idx))
                for img_path in class_folder.glob("*.png"):
                    self.samples.append((str(img_path), class_idx))
                for img_path in class_folder.glob("*.jpg"):
                    self.samples.append((str(img_path), class_idx))

        if max_samples and len(self.samples) > max_samples:
            self.samples = self.samples[:max_samples]

        print(f"Loaded {len(self.samples)} images for split '{split}' from {self.root_dir}")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        if self.is_dummy:
            img = torch.randn(3, 224, 224)
            label = self.samples[idx][1]
            return img, label

        img_path, label = self.samples[idx]
        try:
            image = Image.open(img_path).convert("RGB")
        except Exception:
            image = Image.new("RGB", (224, 224), color=0)

        if self.transform:
            image = self.transform(image)

        return image, label


class QuantumPneuNet(nn.Module):
    """Deep Hybrid Architecture: Pretrained EfficientNet-B0 + 8-Qubit Parameterized Quantum Head."""

    def __init__(self, n_qubits: int = 8, n_layers: int = 3, freeze_backbone: bool = True):
        super().__init__()
        weights = EfficientNet_B0_Weights.DEFAULT
        backbone = efficientnet_b0(weights=weights)

        # Retain feature extractor
        self.features = backbone.features
        self.avgpool = backbone.avgpool
        in_features = 1280

        if freeze_backbone:
            for p in self.features.parameters():
                p.requires_grad = False
            # Unfreeze top layers for domain fine-tuning
            for p in self.features[-3:].parameters():
                p.requires_grad = True

        self.quantum_head = QuantumHybridHead(
            in_features=in_features,
            n_qubits=n_qubits,
            n_layers=n_layers,
            n_classes=2,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        feat = self.features(x)
        feat = self.avgpool(feat)
        feat = torch.flatten(feat, 1)
        logits = self.quantum_head(feat)
        return logits


def get_transforms():
    train_transform = T.Compose([
        T.Resize((224, 224)),
        T.RandomHorizontalFlip(p=0.5),
        T.RandomRotation(degrees=10),
        T.ColorJitter(brightness=0.15, contrast=0.15),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    val_transform = T.Compose([
        T.Resize((224, 224)),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    return train_transform, val_transform


def train_pneumonia_pipeline(args):
    device = torch.device("cuda" if torch.cuda.is_available() and not args.cpu else "cpu")
    print(f"🚀 Initializing Pneumonia Fine-Tuning Pipeline on Device: {device}")

    train_tf, val_tf = get_transforms()

    train_ds = ChestXRayDataset(args.data_dir, split="train", transform=train_tf, max_samples=args.max_samples)
    val_ds = ChestXRayDataset(args.data_dir, split="val", transform=val_tf, max_samples=args.max_samples)
    test_ds = ChestXRayDataset(args.data_dir, split="test", transform=val_tf, max_samples=args.max_samples)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=args.num_workers)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=args.num_workers)
    test_loader = DataLoader(test_ds, batch_size=args.batch_size, shuffle=False, num_workers=args.num_workers)

    model = QuantumPneuNet(n_qubits=args.n_qubits, n_layers=args.n_layers, freeze_backbone=not args.unfreeze_all)
    model.to(device)

    criterion = nn.CrossEntropyLoss()
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
    best_model_path = output_dir / "QuantumPneu-FineTuned.pt"

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
                    "arch": "EfficientNet-B0 + 8-Qubit VQC",
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
        model_name="QuantumPneu-FineTuned",
        model_type="Quantum Hybrid VQC Head",
        y_true=np.array(y_true_list),
        y_pred=np.array(y_pred_list),
        y_prob=np.array(y_prob_list),
        inference_time_ms=float(np.mean(latencies)) if latencies else 0.0,
    )

    print(f"✅ Pneumonia Fine-Tuning Complete! Model stored at: {best_model_path}")
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune QuantumPneu on Chest X-Ray")
    parser.add_argument("--data-dir", type=str, default="/kaggle/input/chest-xray-pneumonia/chest_xray")
    parser.add_argument("--output-dir", type=str, default="./outputs/pneumonia")
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

    train_pneumonia_pipeline(args)
