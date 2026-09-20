from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

import torch
import torch.nn as nn
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from torch.utils.data import DataLoader, Subset
from torch.optim.lr_scheduler import ReduceLROnPlateau
from tqdm import tqdm

from ml.pneumonia.classical import PneuVision
from ml.pneumonia.data.dataset_loader import build_dataset, discover_split_dirs, make_loader
from ml.pneumonia.paths import MODELS_DIR, ensure_dirs
from ml.pneumonia.preprocessing.transforms import eval_transform, train_transform


def evaluate(model, loader, device, threshold: float = 0.5):
    model.eval()
    truth, predictions, probabilities = [], [], []
    with torch.no_grad():
        for images, labels in loader:
            output = model(images.to(device))
            probability = output.softmax(1)[:, 1].cpu()
            truth.extend(labels.tolist())
            probabilities.extend(probability.tolist())
            predictions.extend((probability >= threshold).long().tolist())
    return {
        "accuracy": float(accuracy_score(truth, predictions)),
        "macro_f1": float(f1_score(truth, predictions, average="macro", zero_division=0)),
        "roc_auc": float(roc_auc_score(truth, probabilities)),
    }


def best_threshold(model, loader, device) -> float:
    model.eval()
    truth, probabilities = [], []
    with torch.no_grad():
        for images, labels in loader:
            probabilities.extend(model(images.to(device)).softmax(1)[:, 1].cpu().tolist())
            truth.extend(labels.tolist())
    candidates = [index / 100 for index in range(20, 81)]
    return max(
        candidates,
        key=lambda threshold: f1_score(
            truth,
            [int(probability >= threshold) for probability in probabilities],
            average="macro",
            zero_division=0,
        ),
    )


def train(root: Path | None = None, epochs: int = 8, batch_size: int = 32, image_size: int = 224):
    ensure_dirs()
    random.seed(42)
    torch.manual_seed(42)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(42)
    splits = discover_split_dirs(root)
    if not {"train", "test"}.issubset(splits):
        raise FileNotFoundError("Pneumonia training requires train and test directories")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    if "val" in splits:
        train_loader = make_loader(splits["train"], train_transform(image_size), batch_size, True)
        val_loader = make_loader(splits["val"], eval_transform(image_size), batch_size, False)
        train_labels = [label for _, label in train_loader.dataset.samples]
    else:
        train_data = build_dataset(splits["train"], train_transform(image_size))
        val_data = build_dataset(splits["train"], eval_transform(image_size))
        generator = torch.Generator().manual_seed(42)
        indices = torch.randperm(len(train_data), generator=generator).tolist()
        val_size = max(1, int(len(indices) * 0.1))
        val_indices, train_indices = indices[:val_size], indices[val_size:]
        train_loader = DataLoader(Subset(train_data, train_indices), batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(Subset(val_data, val_indices), batch_size=batch_size, shuffle=False)
        train_labels = [train_data.targets[index] for index in train_indices]
    test_loader = make_loader(splits["test"], eval_transform(image_size), batch_size, False)
    model = PneuVision().to(device)
    freeze_epochs = 2
    if freeze_epochs:
        for parameter in model.features.parameters():
            parameter.requires_grad = False
    labels = torch.tensor(train_labels)
    counts = torch.bincount(labels, minlength=2).float().clamp_min(1)
    criterion = nn.CrossEntropyLoss(weight=counts.sum() / (2 * counts)).to(device)
    optimizer = torch.optim.AdamW(
        [
            {"params": model.features.parameters(), "lr": 1e-5},
            {"params": model.head.parameters(), "lr": 1e-4},
        ],
        weight_decay=1e-4,
    )
    scheduler = ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=2)
    best = -1.0
    for epoch in range(1, epochs + 1):
        if epoch == freeze_epochs + 1:
            for parameter in model.features.parameters():
                parameter.requires_grad = True
        model.train()
        if epoch <= freeze_epochs:
            model.features.eval()
        for images, targets in tqdm(train_loader, desc=f"PneuVision epoch {epoch}", leave=False):
            optimizer.zero_grad(set_to_none=True)
            loss = criterion(model(images.to(device)), targets.to(device))
            loss.backward()
            optimizer.step()
        metrics = evaluate(model, val_loader, device)
        scheduler.step(metrics["macro_f1"])
        print({"epoch": epoch, **metrics})
        if metrics["macro_f1"] > best:
            best = metrics["macro_f1"]
            torch.save({"model": model.state_dict(), "image_size": image_size, "metrics": metrics}, MODELS_DIR / "best.pt")
    checkpoint = torch.load(MODELS_DIR / "best.pt", map_location=device, weights_only=False)
    model.load_state_dict(checkpoint["model"])
    threshold = best_threshold(model, val_loader, device)
    result = evaluate(model, test_loader, device, threshold)
    result["decision_threshold"] = threshold
    checkpoint["decision_threshold"] = threshold
    torch.save(checkpoint, MODELS_DIR / "best.pt")
    (MODELS_DIR / "metrics.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=None)
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--batch-size", type=int, default=32)
    args = parser.parse_args()
    train(args.root, args.epochs, args.batch_size)