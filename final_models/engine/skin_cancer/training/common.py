from __future__ import annotations

import json
import time
from pathlib import Path

import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import ReduceLROnPlateau
from tqdm import tqdm

from ml.skin_cancer.classical import CLASSICAL_BUILDERS
from ml.skin_cancer.config import load_config
from ml.skin_cancer.constants import HAM10000_LABELS
from ml.skin_cancer.data.dataset_loader import class_weights, make_loader
from ml.skin_cancer.data.split_dataset import load_manifest
from ml.skin_cancer.evaluation import collect_predictions, write_eval_artifacts
from ml.skin_cancer.paths import MODELS_DIR, REPORTS_DIR, ensure_dirs
from ml.skin_cancer.seed import get_device, set_seed


def train_classical(model_name: str, config_name: str = "classical.yaml") -> Path:
    ensure_dirs()
    cfg = load_config(config_name)
    set_seed(int(cfg.get("seed", 42)))
    device = get_device()
    image_size = int(cfg["dataset"]["image_size"])
    tcfg = cfg["training"]
    mcfg = cfg["models"][model_name]
    csv_path = Path(cfg["dataset"]["csv"])
    manifest = load_manifest(csv_path=csv_path)
    num_classes = int(manifest["class_id"].nunique())
    class_names = [HAM10000_LABELS[i] for i in range(num_classes)]

    loader_args = {
        "num_workers": int(tcfg.get("num_workers", 0)),
        "csv_path": csv_path,
    }
    train_loader = make_loader(
        "train", image_size, tcfg["batch_size"], train=True,
        balanced=bool(tcfg.get("balanced_sampling", False)), **loader_args,
    )
    val_loader = make_loader("val", image_size, tcfg["batch_size"], train=False, **loader_args)
    test_loader = make_loader("test", image_size, tcfg["batch_size"], train=False, **loader_args)

    model = CLASSICAL_BUILDERS[model_name](num_classes, dropout=mcfg["dropout"]).to(device)
    freeze_epochs = int(tcfg.get("freeze_backbone_epochs", 2))
    if freeze_epochs > 0:
        for parameter in model.backbone.parameters():
            parameter.requires_grad = False
    y_train = manifest.loc[manifest["split"] == "train", "class_id"].to_numpy()
    weights = class_weights(y_train, num_classes).to(device)
    criterion = nn.CrossEntropyLoss(weight=weights, label_smoothing=float(tcfg.get("label_smoothing", 0)))
    optimizer = AdamW(
        [
            {"params": model.backbone.parameters(), "lr": float(mcfg.get("backbone_lr", 1.0e-5))},
            {"params": model.head.parameters(), "lr": float(mcfg["lr"])},
        ],
        weight_decay=float(tcfg["weight_decay"]),
    )
    scheduler = ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=2)
    use_amp = bool(tcfg.get("mixed_precision", False)) and device.type == "cuda"
    scaler = torch.amp.GradScaler("cuda", enabled=use_amp)

    out_dir = MODELS_DIR / "classical" / model_name
    out_dir.mkdir(parents=True, exist_ok=True)
    best_f1 = -1.0
    history = []
    patience = int(tcfg["patience"])
    stale = 0
    start_epoch = 1

    resume_path = out_dir / "last.pt"
    if resume_path.exists():
        print(f"[train_classical] Found resume checkpoint at {resume_path}. Attempting to resume...")
        try:
            checkpoint = torch.load(resume_path, map_location=device, weights_only=False)
            model.load_state_dict(checkpoint["model"])
            optimizer.load_state_dict(checkpoint["optimizer"])
            scheduler.load_state_dict(checkpoint["scheduler"])
            start_epoch = checkpoint["epoch"] + 1
            best_f1 = checkpoint["best_f1"]
            stale = checkpoint["stale"]
            history = checkpoint["history"]
            print(f"[train_classical] Resuming from epoch {start_epoch}...")
        except Exception as e:
            print(f"[train_classical] Failed to resume: {e}. Starting from scratch.")

    for epoch in range(start_epoch, int(tcfg["epochs"]) + 1):
        if freeze_epochs and epoch == freeze_epochs + 1:
            for parameter in model.backbone.parameters():
                parameter.requires_grad = True
        model.train()
        if freeze_epochs and epoch <= freeze_epochs:
            model.backbone.eval()
        running = 0.0
        n = 0
        start = time.time()
        for x, y in tqdm(train_loader, desc=f"{model_name} epoch {epoch}", leave=False):
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad(set_to_none=True)
            with torch.amp.autocast("cuda", enabled=use_amp):
                logits = model(x)
                loss = criterion(logits, y)
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            running += float(loss.item()) * len(y)
            n += len(y)
        y_true, y_prob, _ = collect_predictions(model, val_loader, device)
        from ml.skin_cancer.evaluation.metrics import compute_metrics

        val_metrics = compute_metrics(y_true, y_prob, class_names)
        scheduler.step(val_metrics["macro_f1"])
        row = {
            "epoch": epoch,
            "train_loss": running / max(n, 1),
            "val_macro_f1": val_metrics["macro_f1"],
            "val_accuracy": val_metrics["accuracy"],
            "seconds": time.time() - start,
        }
        history.append(row)
        print(row)
        if val_metrics["macro_f1"] > best_f1:
            best_f1 = val_metrics["macro_f1"]
            stale = 0
            torch.save(
                {
                    "model": model.state_dict(),
                    "num_classes": num_classes,
                    "class_names": class_names,
                    "image_size": image_size,
                    "backbone": mcfg["backbone"],
                    "dropout": mcfg["dropout"],
                    "metrics": val_metrics,
                },
                out_dir / "best.pt",
            )
        # Save last checkpoint for resuming
        torch.save(
            {
                "model": model.state_dict(),
                "optimizer": optimizer.state_dict(),
                "scheduler": scheduler.state_dict(),
                "epoch": epoch,
                "best_f1": best_f1,
                "stale": stale,
                "history": history,
            },
            resume_path,
        )

    # Training complete, remove resume checkpoint
    if resume_path.exists():
        resume_path.unlink()

    ckpt = torch.load(out_dir / "best.pt", map_location=device, weights_only=False)
    model.load_state_dict(ckpt["model"])
    y_true, y_prob, _ = collect_predictions(model, test_loader, device)
    test_idx = manifest.loc[manifest["split"] == "test", "index"].to_numpy()
    report_dir = REPORTS_DIR / model_name
    metrics = write_eval_artifacts(
        report_dir,
        y_true,
        y_prob,
        class_names,
        indices=test_idx,
        extra={"model": model_name, "best_val_macro_f1": best_f1},
    )
    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    (out_dir / "training_history.json").write_text(json.dumps(history, indent=2), encoding="utf-8")
    labels = {"class_names": class_names, "num_classes": num_classes}
    (out_dir / "labels.json").write_text(json.dumps(labels, indent=2), encoding="utf-8")
    print(json.dumps({k: metrics[k] for k in ("accuracy", "macro_f1", "roc_auc")}, indent=2))
    return out_dir
