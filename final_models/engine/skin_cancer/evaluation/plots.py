from __future__ import annotations
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np

def save_per_class_charts(metrics: dict, out_dir: Path):
    per_class = metrics["per_class"]
    classes = [item["class"] for item in per_class]
    f1s = [item["f1"] for item in per_class]
    recalls = [item["recall"] for item in per_class]

    # Per-class F1 chart
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.bar(classes, f1s, color="skyblue", edgecolor="grey")
    ax.set_ylabel("F1 Score")
    ax.set_title("Per-class F1 Score")
    ax.set_ylim(0, 1.0)
    for i, v in enumerate(f1s):
        ax.text(i, v + 0.02, f"{v:.2f}", ha="center", fontweight="bold")
    fig.tight_layout()
    fig.savefig(out_dir / "per_class_f1.png", dpi=140)
    plt.close(fig)

    # Per-class Recall chart
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.bar(classes, recalls, color="lightcoral", edgecolor="grey")
    ax.set_ylabel("Recall / Sensitivity")
    ax.set_title("Per-class Recall")
    ax.set_ylim(0, 1.0)
    for i, v in enumerate(recalls):
        ax.text(i, v + 0.02, f"{v:.2f}", ha="center", fontweight="bold")
    fig.tight_layout()
    fig.savefig(out_dir / "per_class_recall.png", dpi=140)
    plt.close(fig)

def save_training_curves(history: list[dict], out_dir: Path):
    epochs = [item["epoch"] for item in history]
    train_loss = [item["train_loss"] for item in history]
    val_macro_f1 = [item["val_macro_f1"] for item in history]
    val_accuracy = [item["val_accuracy"] for item in history]
    lr = [item["lr"] for item in history]

    # Training Loss Curve (train_loss.png)
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.plot(epochs, train_loss, label="Train Loss", color="blue", marker="o")
    ax.set_xlabel("Epoch")
    ax.set_ylabel("Loss")
    ax.set_title("Training Loss Curve")
    ax.grid(True)
    fig.tight_layout()
    fig.savefig(out_dir / "train_loss.png", dpi=140)
    plt.close(fig)

    # Validation Macro F1 Curve (val_macro_f1.png)
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.plot(epochs, val_macro_f1, label="Val Macro F1", color="green", marker="s")
    ax.set_xlabel("Epoch")
    ax.set_ylabel("Macro F1")
    ax.set_title("Validation Macro F1 Curve")
    ax.grid(True)
    fig.tight_layout()
    fig.savefig(out_dir / "val_macro_f1.png", dpi=140)
    plt.close(fig)

    # Validation Accuracy Curve (val_accuracy.png)
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.plot(epochs, val_accuracy, label="Val Accuracy", color="orange", marker="^")
    ax.set_xlabel("Epoch")
    ax.set_ylabel("Accuracy")
    ax.set_title("Validation Accuracy Curve")
    ax.grid(True)
    fig.tight_layout()
    fig.savefig(out_dir / "val_accuracy.png", dpi=140)
    plt.close(fig)

    # Learning Rate Curve (learning_rate.png)
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.plot(epochs, lr, label="Learning Rate", color="purple", marker="d")
    ax.set_xlabel("Epoch")
    ax.set_ylabel("Learning Rate")
    ax.set_title("Learning Rate Schedule")
    ax.set_yscale("log")
    ax.grid(True)
    fig.tight_layout()
    fig.savefig(out_dir / "learning_rate.png", dpi=140)
    plt.close(fig)
