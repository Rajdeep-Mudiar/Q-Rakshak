from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any

import numpy as np
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR, CosineAnnealingWarmRestarts, ReduceLROnPlateau
from torch.utils.data import DataLoader, TensorDataset
from tqdm import tqdm

from ml.skin_cancer.config import load_config
from ml.skin_cancer.constants import HAM10000_LABELS
from ml.skin_cancer.data.dataset_loader import class_weights
from ml.skin_cancer.data.split_dataset import load_manifest
from ml.skin_cancer.evaluation import write_eval_artifacts
from ml.skin_cancer.evaluation.calibration import (
    expected_calibration_error,
    fit_temperature,
    save_temperature,
)
from ml.skin_cancer.evaluation.metrics import compute_metrics
from ml.skin_cancer.features.extract_cnn_features import extract_all
from ml.skin_cancer.features.pca_features import fit_pca
from ml.skin_cancer.paths import MODELS_DIR, REPORTS_DIR, ensure_dirs
from ml.skin_cancer.quantum.qskin_vortex import QSkinVortex
from ml.skin_cancer.quantum.quantum_derma import QuantumDerma
from ml.skin_cancer.quantum.quantum_derma_x import QuantumDermaX
from ml.skin_cancer.quantum.quantum_utils import FocalLoss
from ml.skin_cancer.quantum.vitaq_derm import VitaQDerm
from ml.skin_cancer.seed import get_device, set_seed
from ml.skin_cancer.training.experiment_tracking import record_experiment

BUILDERS = {
    "QuantumDerma": QuantumDerma,
    "QuantumDermaX": QuantumDermaX,
    "VitaQ-Derm": VitaQDerm,
    "QSkin-Vortex": QSkinVortex,
}

VALID_SCHEDULERS = {"cosine_restarts", "cosine", "plateau"}
VALID_SAMPLERS = {"normal", "balanced"}
VALID_SCALERS = {"standard", "minmax", "none"}
VALID_POST_NORM = {"none", "l2"}


def _loader(x: np.ndarray, y: np.ndarray, batch: int, shuffle: bool, balanced: bool = False) -> DataLoader:
    ds = TensorDataset(
        torch.tensor(x, dtype=torch.float32),
        torch.tensor(y, dtype=torch.long),
    )
    if balanced and shuffle:
        num_classes = int(y.max()) + 1
        counts = np.bincount(y, minlength=num_classes).astype(np.float64)
        counts = np.maximum(counts, 1.0)
        weights = counts.sum() / (num_classes * counts)
        sample_weights = torch.tensor(weights[y], dtype=torch.float32)
        sampler = torch.utils.data.WeightedRandomSampler(
            sample_weights, num_samples=len(sample_weights), replacement=True
        )
        return DataLoader(ds, batch_size=batch, sampler=sampler, pin_memory=False)
    return DataLoader(ds, batch_size=batch, shuffle=shuffle, pin_memory=False)


def _ckpt_state(
    model: nn.Module,
    model_name: str,
    num_classes: int,
    class_names: list[str],
    qcfg: dict,
    tcfg: dict,
    in_dim: int,
    n_qubits: int,
    n_layers: int,
    use_raw: bool,
    backbone: str,
    epoch: int,
    best_val_macro_f1: float,
    best_val_balanced_acc: float,
    best_val_roc_auc: float,
    scaler_type: str,
    post_norm: str,
    pca_components: int,
    label_smoothing: float,
    focal_gamma: float,
    lr: float,
    weight_decay: float,
    scheduler_type: str,
    balanced_sampling: bool,
    seed: int,
) -> dict:
    return {
        "model": model.state_dict(),
        "model_name": model_name,
        "num_classes": num_classes,
        "class_names": class_names,
        "config_quantum": qcfg,
        "config_training": tcfg,
        "in_dim": in_dim,
        "n_qubits": n_qubits,
        "n_layers": n_layers,
        "use_raw": use_raw,
        "backbone": backbone,
        "epoch": epoch,
        "best_val_macro_f1": best_val_macro_f1,
        "best_val_balanced_acc": best_val_balanced_acc,
        "best_val_roc_auc": best_val_roc_auc,
        "hparams": {
            "seed": seed,
            "pca_components": pca_components,
            "balanced_sampling": balanced_sampling,
            "loss": "FocalLoss",
            "focal_gamma": focal_gamma,
            "label_smoothing": label_smoothing,
            "lr": lr,
            "weight_decay": weight_decay,
            "scheduler": scheduler_type,
            "n_qubits": n_qubits,
            "n_layers": n_layers,
            "scaler_type": scaler_type,
            "post_norm": post_norm,
        },
    }


def train_quantum(
    model_name: str = "QuantumDerma",
    config_name: str = "quantum.yaml",
    config_override: dict | None = None,
    no_resume: bool = False,
    experiment_name: str | None = None,
    seed: int | None = None,
    pca_components: int | None = None,
    qubits: int | None = None,
    layers: int | None = None,
    dropout: float | None = None,
    focal_gamma: float | None = None,
    label_smoothing: float | None = None,
    lr: float | None = None,
    weight_decay: float | None = None,
    scheduler: str | None = None,
    cosine_T0: int | None = None,
    epochs: int | None = None,
    batch_size: int | None = None,
    balanced_sampling: bool | None = None,
    max_grad_norm: float | None = None,
    patience: int | None = None,
    early_stopping_on: str = "macro_f1",
    scaler_type: str = "standard",
    post_norm: str = "none",
    use_class_weights: bool = False,
    skip_leaderboard: bool = False,
) -> Path:
    """Train a quantum hybrid model end-to-end with full experiment tracking.

    All keyword arguments override the YAML config, enabling the 15-phase
    ablation protocol. A single value is changed per experiment; everything
    else stays identical to the protected baseline.

    Args:
        model_name:       One of ``"QuantumDerma"``, ``"QuantumDermaX"``,
                          ``"VitaQ-Derm"``, ``"QSkin-Vortex"``.
        config_name:      YAML config filename (resolved against ``configs/``).
        config_override:  Dict of nested overrides applied last.
        no_resume:        Skip loading ``last.pt``, start from epoch 1.
        experiment_name:  Slug used for the leaderboard row. Auto-generated if
                          not supplied.
        seed:             Overrides ``seed``.
        pca_components:   Overrides ``quantum.pca_components``.
        qubits:           Overrides ``quantum.qubits``.
        layers:           Overrides ``quantum.layers``.
        dropout:          Overrides ``quantum.dropout``.
        focal_gamma:      Overrides ``quantum.focal_gamma``.
        label_smoothing:  Overrides ``training.label_smoothing``.
        lr:               Overrides ``training.lr``.
        weight_decay:     Overrides ``training.weight_decay``.
        scheduler:        Overrides ``training.scheduler`` (one of
                          ``cosine_restarts``, ``cosine``, ``plateau``).
        cosine_T0:        Overrides ``training.cosine_T0``.
        epochs:           Overrides ``training.epochs``.
        batch_size:       Overrides ``training.batch_size``.
        balanced_sampling: Overrides ``training.balanced_sampling``.
        max_grad_norm:    Overrides ``training.max_grad_norm``.
        patience:         Overrides ``training.patience`` (early stop).
        early_stopping_on: Metric to watch for early stop: ``"macro_f1"``,
                          ``"balanced_accuracy"``, ``"roc_auc"``.
        scaler_type:      Scaler before PCA (``standard``, ``minmax``, ``none``).
        post_norm:        Post-PCA normalisation (``none``, ``l2``).
        use_class_weights:If True, pass class weights to FocalLoss; else None.
        skip_leaderboard: If True, do not write to the leaderboard.

    Returns:
        Path to the checkpoint directory containing all checkpoints and
        ``experiment.json``.
    """
    ensure_dirs()
    cfg = load_config(config_name)
    if config_override:
        for k, v in config_override.items():
            if isinstance(v, dict) and k in cfg:
                cfg[k].update(v)
            else:
                cfg[k] = v

    # Apply explicit CLI overrides (highest precedence)
    if seed is not None:
        cfg["seed"] = seed
    qcfg = cfg.setdefault("quantum", {})
    tcfg = cfg.setdefault("training", {})
    if pca_components is not None:
        qcfg["pca_components"] = int(pca_components)
    if qubits is not None:
        qcfg["qubits"] = int(qubits)
    if layers is not None:
        qcfg["layers"] = int(layers)
    if dropout is not None:
        qcfg["dropout"] = float(dropout)
    if focal_gamma is not None:
        qcfg["focal_gamma"] = float(focal_gamma)
    if label_smoothing is not None:
        tcfg["label_smoothing"] = float(label_smoothing)
    if lr is not None:
        tcfg["lr"] = float(lr)
    if weight_decay is not None:
        tcfg["weight_decay"] = float(weight_decay)
    if scheduler is not None:
        if scheduler not in VALID_SCHEDULERS:
            raise ValueError(f"scheduler must be one of {VALID_SCHEDULERS}")
        tcfg["scheduler"] = scheduler
    if cosine_T0 is not None:
        tcfg["cosine_T0"] = int(cosine_T0)
    if epochs is not None:
        tcfg["epochs"] = int(epochs)
    if batch_size is not None:
        tcfg["batch_size"] = int(batch_size)
    if balanced_sampling is not None:
        tcfg["balanced_sampling"] = bool(balanced_sampling)
    if max_grad_norm is not None:
        tcfg["max_grad_norm"] = float(max_grad_norm)
    if patience is not None:
        tcfg["patience"] = int(patience)

    actual_seed = int(cfg.get("seed", 42))
    set_seed(actual_seed)
    device = get_device()
    backbone = cfg.get("backbone", "DermisNova")

    # ------------------------------------------------------------------
    # Feature extraction (cached when backbone checkpoint is unchanged)
    # ------------------------------------------------------------------
    feat_dir = REPORTS_DIR / "features" / backbone
    classical_ckpt = MODELS_DIR / "classical" / backbone / "best.pt"
    feature_meta = feat_dir / "feature_meta.json"
    features_are_current = False

    if feature_meta.exists() and classical_ckpt.exists():
        meta = json.loads(feature_meta.read_text(encoding="utf-8"))
        try:
            classical_meta = torch.load(classical_ckpt, map_location="cpu", weights_only=False)
            features_are_current = (
                meta.get("model") == backbone
                and int(meta.get("image_size", -1)) == int(classical_meta["image_size"])
                and int(meta.get("checkpoint_mtime_ns", -1)) == classical_ckpt.stat().st_mtime_ns
            )
        except Exception:
            features_are_current = False

    if not (feat_dir / "train_x.npy").exists() or not features_are_current:
        print(f"[train_quantum] Extracting CNN features from {backbone} ...")
        extract_all(backbone)
        features_are_current = False

    # ------------------------------------------------------------------
    # PCA / feature reduction — re-fit every run if scaler/post_norm/pca dims
    # differ from cache, so experiments are leakage-free.
    # ------------------------------------------------------------------
    actual_pca = int(qcfg.get("pca_components", 16))
    use_raw = model_name == "VitaQ-Derm"
    suffix = "x" if use_raw else "pca"

    if not use_raw:
        pca_meta_path = feat_dir / "pca_meta.json"
        need_refit = True
        if pca_meta_path.exists() and features_are_current:
            try:
                pmeta = json.loads(pca_meta_path.read_text(encoding="utf-8"))
                need_refit = (
                    int(pmeta.get("n_components", -1)) != actual_pca
                    or pmeta.get("scaler_type", "standard") != scaler_type
                    or pmeta.get("post_norm", "none") != post_norm
                )
            except Exception:
                need_refit = True
        if need_refit or not (feat_dir / "train_pca.npy").exists() or not features_are_current:
            print(
                f"[train_quantum] (Re)fitting scaler={scaler_type} "
                f"PCA(n={actual_pca}) post_norm={post_norm} ..."
            )
            fit_pca(
                backbone,
                actual_pca,
                quantum_model_name=model_name,
                scaler_type=scaler_type,
                post_norm=post_norm,
                random_state=actual_seed,
            )

    x_train = np.load(feat_dir / f"train_{suffix}.npy")
    y_train = np.load(feat_dir / "train_y.npy")
    x_val = np.load(feat_dir / f"val_{suffix}.npy")
    y_val = np.load(feat_dir / "val_y.npy")
    x_test = np.load(feat_dir / f"test_{suffix}.npy")
    y_test = np.load(feat_dir / "test_y.npy")

    num_classes = int(y_train.max()) + 1
    class_names = [HAM10000_LABELS[i] for i in range(num_classes)]

    # ------------------------------------------------------------------
    # Model construction
    # ------------------------------------------------------------------
    builder = BUILDERS[model_name]
    n_qubits = int(qcfg.get("qubits", 10))
    n_layers = int(qcfg.get("layers", 4))
    dropout_val = float(qcfg.get("dropout", 0.2))

    if model_name == "QuantumDermaX":
        n_qubits = max(n_qubits, 12)
    elif model_name == "QSkin-Vortex":
        n_layers = max(n_layers, 5)

    model = builder(
        num_classes,
        n_qubits=n_qubits,
        n_layers=n_layers,
        in_dim=x_train.shape[1],
        dropout=dropout_val,
        data_reupload=True,
    )
    model.to(device)

    if model_name == "VitaQ-Derm" and classical_ckpt.exists():
        print(f"[train_quantum] Loading pretrained classical head into VitaQ-Derm residual...")
        ckpt = torch.load(classical_ckpt, map_location=device, weights_only=False)
        residual_sd = model.residual.state_dict()
        residual_sd["1.weight"] = ckpt["model"]["head.4.weight"]
        residual_sd["1.bias"] = ckpt["model"]["head.4.bias"]
        model.residual.load_state_dict(residual_sd)

    # ------------------------------------------------------------------
    # Loss
    # ------------------------------------------------------------------
    balanced = bool(tcfg.get("balanced_sampling", False))
    actual_gamma = float(qcfg.get("focal_gamma", 2.0))
    actual_label_smoothing = float(tcfg.get("label_smoothing", 0.0))

    if use_class_weights and not balanced:
        weights = class_weights(y_train, num_classes).to(device)
    else:
        weights = None

    criterion = FocalLoss(
        gamma=actual_gamma,
        weight=weights,
        label_smoothing=actual_label_smoothing,
    )

    # ------------------------------------------------------------------
    # Optimiser + LR scheduler
    # ------------------------------------------------------------------
    actual_lr = float(tcfg.get("lr", 5e-4))
    actual_wd = float(tcfg.get("weight_decay", 1e-2))
    optimizer = AdamW(
        model.parameters(),
        lr=actual_lr,
        weight_decay=actual_wd,
    )
    sched_type = tcfg.get("scheduler", "cosine_restarts")
    actual_epochs = int(tcfg.get("epochs", 100))
    if sched_type == "cosine":
        scheduler_obj = CosineAnnealingLR(optimizer_obj := optimizer, T_max=actual_epochs, eta_min=1e-6)
    elif sched_type == "plateau":
        scheduler_obj = ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=3)
    else:
        T_0 = int(tcfg.get("cosine_T0", 10))
        scheduler_obj = CosineAnnealingWarmRestarts(optimizer, T_0=T_0, T_mult=2, eta_min=1e-6)

    actual_bs = int(tcfg.get("batch_size", 64))
    train_loader = _loader(x_train, y_train, actual_bs, True, balanced=balanced)
    val_loader = _loader(x_val, y_val, actual_bs, False)

    safe_model = model_name.replace("/", "-")
    out_dir = MODELS_DIR / "quantum" / safe_model
    out_dir.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Tracking state
    # ------------------------------------------------------------------
    best_f1 = -1.0
    best_bal = -1.0
    best_roc = -1.0
    best_epoch_f1 = 0
    best_epoch_bal = 0
    best_epoch_roc = 0
    history: list[dict] = []
    stale = 0
    max_grad_norm = float(tcfg.get("max_grad_norm", 1.0))
    actual_patience = int(tcfg.get("patience", 10))
    start_epoch = 1

    resume_path = out_dir / "last.pt"
    if not no_resume and resume_path.exists():
        print(f"[train_quantum] Found resume checkpoint at {resume_path}. Attempting to resume...")
        try:
            checkpoint = torch.load(resume_path, map_location=device, weights_only=False)
            model.load_state_dict(checkpoint["model"])
            optimizer.load_state_dict(checkpoint["optimizer"])
            scheduler_obj.load_state_dict(checkpoint["scheduler"])
            start_epoch = int(checkpoint["epoch"]) + 1
            best_f1 = float(checkpoint["best_f1"])
            best_bal = float(checkpoint.get("best_bal", -1.0))
            best_roc = float(checkpoint.get("best_roc", -1.0))
            best_epoch_f1 = int(checkpoint.get("best_epoch_f1", 0))
            best_epoch_bal = int(checkpoint.get("best_epoch_bal", 0))
            best_epoch_roc = int(checkpoint.get("best_epoch_roc", 0))
            stale = int(checkpoint["stale"])
            history = list(checkpoint["history"])
            print(f"[train_quantum] Resuming from epoch {start_epoch}...")
        except Exception as e:
            print(f"[train_quantum] Failed to resume: {e}. Starting from scratch.")
    elif no_resume and resume_path.exists():
        print(f"[train_quantum] --no-resume set. Ignoring {resume_path}. Starting fresh from epoch 1.")

    def _watch_metric(m: dict) -> float:
        if early_stopping_on == "balanced_accuracy":
            return float(m["balanced_accuracy"])
        if early_stopping_on == "roc_auc":
            return float(m["roc_auc"])
        return float(m["macro_f1"])

    def _quantum_module(mdl: nn.Module) -> nn.Module:
        """Return the (first) quantum submodule with trainable parameters."""
        for sub in mdl.modules():
            if sub.__class__.__name__ == "QuantumLayer":
                return sub
        return mdl

    best_watch = -1.0
    collapse_streak = 0
    # Recompute from history if resuming
    if history:
        for row in history:
            if "val_balanced_acc" in row and "val_roc_auc" in row and "val_macro_f1" in row:
                w = (
                    row["val_balanced_acc"]
                    if early_stopping_on == "balanced_accuracy"
                    else (
                        row["val_roc_auc"]
                        if early_stopping_on == "roc_auc"
                        else row["val_macro_f1"]
                    )
                )
                if w > best_watch:
                    best_watch = w
                if row.get("val_macro_f1", 1.0) < 0.15 and float(row.get("pred_max_frac", 0.0)) > 0.80:
                    collapse_streak += 1
                else:
                    collapse_streak = 0

    first_epoch_print_done = False

    for epoch in range(start_epoch, actual_epochs + 1):
        model.train()
        running_loss = 0.0
        n_samples = 0
        start = time.time()

        train_class_counts_epoch = np.zeros(num_classes, dtype=np.int64)
        logits_train_stats = {"min": 0.0, "max": 0.0, "mean": 0.0, "std": 0.0}
        first_train_batch_logits: torch.Tensor | None = None
        last_quantum_grad_norm = 0.0

        for x_batch, y_batch in tqdm(
            train_loader, desc=f"[{model_name}] epoch {epoch}", leave=False
        ):
            x_batch = x_batch.to(device)
            y_batch = y_batch.to(device)
            for c in range(num_classes):
                train_class_counts_epoch[c] += int((y_batch.detach().cpu().numpy() == c).sum())
            optimizer.zero_grad(set_to_none=True)
            logits = model(x_batch)
            if first_train_batch_logits is None:
                first_train_batch_logits = logits.detach().cpu()
            loss = criterion(logits, y_batch)
            loss.backward()

            qmod = _quantum_module(model)
            qgrads = []
            for p in qmod.parameters():
                if p.grad is not None:
                    qgrads.append(p.grad.detach().flatten())
            if qgrads:
                last_quantum_grad_norm = float(torch.norm(torch.cat(qgrads)).item())
            else:
                last_quantum_grad_norm = 0.0

            nn.utils.clip_grad_norm_(model.parameters(), max_norm=max_grad_norm)
            optimizer.step()
            running_loss += float(loss.item()) * len(y_batch)
            n_samples += len(y_batch)

        # Train-batch logits diagnostic stats (first batch)
        if first_train_batch_logits is not None:
            logits_train_stats = {
                "min": float(first_train_batch_logits.min().item()),
                "max": float(first_train_batch_logits.max().item()),
                "mean": float(first_train_batch_logits.mean().item()),
                "std": float(first_train_batch_logits.std(unbiased=False).item()),
            }

        # Report effective class distribution seen during training (once + on
        # imbalance diagnostics events)
        if epoch == start_epoch or collapse_streak >= 1:
            total_train_seen = int(train_class_counts_epoch.sum())
            dist_str = ", ".join(
                f"{class_names[c]}={int(train_class_counts_epoch[c])}"
                f"({100.0 * train_class_counts_epoch[c] / max(total_train_seen, 1):.1f}%)"
                for c in range(num_classes)
            )
            print(
                f"  [train_distribution] epoch {epoch}: total_seen={total_train_seen}  "
                f"classes → {dist_str}"
            )
            if not first_epoch_print_done:
                first_epoch_print_done = True

        model.eval()
        ys, ps, ls = [], [], []
        with torch.no_grad():
            for x_batch, y_batch in val_loader:
                xb = x_batch.to(device)
                logit = model(xb)
                prob = torch.softmax(logit, dim=1)
                ys.append(y_batch.numpy())
                ps.append(prob.cpu().numpy())
                ls.append(logit.cpu().numpy())

        y_val_arr = np.concatenate(ys)
        p_val_arr = np.concatenate(ps)
        logit_val_arr = np.concatenate(ls)
        val_preds = np.argmax(p_val_arr, axis=1)
        val_pred_counts = np.bincount(val_preds, minlength=num_classes)
        val_pred_distribution = {
            class_names[c]: int(val_pred_counts[c]) for c in range(num_classes)
        }
        val_pred_frac = (
            val_pred_counts.astype(np.float64) / max(int(val_pred_counts.sum()), 1)
        )
        val_pred_max_frac = float(val_pred_frac.max())
        val_pred_max_class = class_names[int(np.argmax(val_pred_counts))]

        # Validation logits diagnostic stats
        logits_val_stats = {
            "min": float(logit_val_arr.min()),
            "max": float(logit_val_arr.max()),
            "mean": float(logit_val_arr.mean()),
            "std": float(logit_val_arr.std(ddof=0)),
        }

        val_metrics = compute_metrics(y_val_arr, p_val_arr, class_names)
        current_lr = optimizer.param_groups[0]["lr"]
        val_ece = expected_calibration_error(p_val_arr, y_val_arr)

        row = {
            "epoch": epoch,
            "train_loss": running_loss / max(n_samples, 1),
            "val_macro_f1": float(val_metrics["macro_f1"]),
            "val_weighted_f1": float(val_metrics["weighted_f1"]),
            "val_balanced_acc": float(val_metrics["balanced_accuracy"]),
            "val_accuracy": float(val_metrics["accuracy"]),
            "val_roc_auc": float(val_metrics["roc_auc"]),
            "val_sensitivity_macro": float(val_metrics["sensitivity_macro"]),
            "val_ece": val_ece,
            "lr": current_lr,
            "seconds": round(time.time() - start, 2),
            "val_pred_distribution": val_pred_distribution,
            "val_pred_max_frac": val_pred_max_frac,
            "val_pred_max_class": val_pred_max_class,
            "logits_train_stats": logits_train_stats,
            "logits_val_stats": logits_val_stats,
            "quantum_grad_norm": last_quantum_grad_norm,
            "train_class_counts_epoch": train_class_counts_epoch.tolist(),
        }
        history.append(row)
        print(
            f"[{model_name}] ep {epoch:>3}: loss={row['train_loss']:.4f}  "
            f"mF1={row['val_macro_f1']:.4f}  bal_acc={row['val_balanced_acc']:.4f}  "
            f"roc={row['val_roc_auc']:.4f}  ece={row['val_ece']:.4f}  "
            f"lr={current_lr:.2e}  qgrad_norm={last_quantum_grad_norm:.3f}  "
            f"t={row['seconds']:.1f}s"
        )
        print(
            f"  [logits_val] min={logits_val_stats['min']:+.3f}  max={logits_val_stats['max']:+.3f}  "
            f"mean={logits_val_stats['mean']:+.3f}  std={logits_val_stats['std']:.3f}"
        )

        # Validation prediction distribution — essential collapse diagnosis
        pd_lines = []
        for c in range(num_classes):
            pd_lines.append(
                f"{class_names[c]}={val_pred_counts[c]}"
                f"({100.0 * val_pred_frac[c]:.1f}%)"
            )
        print("  [predicted] " + "  ".join(pd_lines))

        # ── Majority-class collapse detector ────────────────────────────
        if float(val_metrics["macro_f1"]) < 0.15 and val_pred_max_frac > 0.80:
            collapse_streak += 1
        else:
            collapse_streak = 0

        if collapse_streak >= 3:
            print()
            print("=" * 78)
            print("  WARNING: MAJORITY-CLASS COLLAPSE DETECTED")
            print(f"  macro_f1={float(val_metrics['macro_f1']):.4f} (<0.15)")
            print(
                f"  '{val_pred_max_class}' predictions = {100.0 * val_pred_max_frac:.1f}%"
                f" (>80% of all predictions) for {collapse_streak} consecutive epochs"
            )
            print("  Prediction distribution:")
            for c in range(num_classes):
                print(
                    f"    predicted {class_names[c]:<6s}: {int(val_pred_counts[c]):>5d}  "
                    f"({100.0 * val_pred_frac[c]:.1f}%)"
                )
            print("=" * 78)
            print()

        # Per-class F1 summary line (1-line for log readability)
        pc_str = "  ".join(
            f"{item['class']}={item['f1']:.3f}" for item in val_metrics["per_class"]
        )
        print("  F1: " + pc_str)

        if isinstance(scheduler_obj, ReduceLROnPlateau):
            scheduler_obj.step(val_metrics["macro_f1"])
        else:
            scheduler_obj.step()

        # ── Multiple best checkpoints (Phase 14) ───────────────────────
        common_ckpt = lambda epoch_metric_f1, epoch_metric_bal, epoch_metric_roc, be_f1, be_bal, be_roc: _ckpt_state(
            model=model,
            model_name=model_name,
            num_classes=num_classes,
            class_names=class_names,
            qcfg=qcfg,
            tcfg=tcfg,
            in_dim=x_train.shape[1],
            n_qubits=n_qubits,
            n_layers=n_layers,
            use_raw=use_raw,
            backbone=backbone,
            epoch=epoch,
            best_val_macro_f1=epoch_metric_f1,
            best_val_balanced_acc=epoch_metric_bal,
            best_val_roc_auc=epoch_metric_roc,
            scaler_type=scaler_type,
            post_norm=post_norm,
            pca_components=actual_pca,
            label_smoothing=actual_label_smoothing,
            focal_gamma=actual_gamma,
            lr=actual_lr,
            weight_decay=actual_wd,
            scheduler_type=sched_type,
            balanced_sampling=balanced,
            seed=actual_seed,
        )

        if val_metrics["macro_f1"] > best_f1:
            best_f1 = float(val_metrics["macro_f1"])
            best_epoch_f1 = epoch
            torch.save(
                common_ckpt(best_f1, best_bal, best_roc, best_epoch_f1, best_epoch_bal, best_epoch_roc),
                out_dir / "best_macro_f1.pt",
            )
            # Alias best.pt for backwards compatibility
            torch.save(
                common_ckpt(best_f1, best_bal, best_roc, best_epoch_f1, best_epoch_bal, best_epoch_roc),
                out_dir / "best.pt",
            )

        if val_metrics["balanced_accuracy"] > best_bal:
            best_bal = float(val_metrics["balanced_accuracy"])
            best_epoch_bal = epoch
            torch.save(
                common_ckpt(best_f1, best_bal, best_roc, best_epoch_f1, best_epoch_bal, best_epoch_roc),
                out_dir / "best_balanced_accuracy.pt",
            )

        if val_metrics["roc_auc"] > best_roc:
            best_roc = float(val_metrics["roc_auc"])
            best_epoch_roc = epoch
            torch.save(
                common_ckpt(best_f1, best_bal, best_roc, best_epoch_f1, best_epoch_bal, best_epoch_roc),
                out_dir / "best_roc_auc.pt",
            )

        # Always overwrite last.pt (resume + latest)
        torch.save(
            {
                "model": model.state_dict(),
                "optimizer": optimizer.state_dict(),
                "scheduler": scheduler_obj.state_dict(),
                "epoch": epoch,
                "best_f1": best_f1,
                "best_bal": best_bal,
                "best_roc": best_roc,
                "best_epoch_f1": best_epoch_f1,
                "best_epoch_bal": best_epoch_bal,
                "best_epoch_roc": best_epoch_roc,
                "stale": stale,
                "history": history,
            },
            resume_path,
        )

        # ── Early stopping on configured metric ───────────────────────
        w = _watch_metric(val_metrics)
        if w > best_watch + 1e-9:
            best_watch = w
            stale = 0
        else:
            stale += 1
            if stale >= actual_patience:
                print(
                    f"[{model_name}] Early stopping at epoch {epoch} "
                    f"(patience={actual_patience} on {early_stopping_on})."
                )
                break

    # Training complete — keep last.pt so users can inspect final state, but
    # mark the run as finished in metadata.

    # ------------------------------------------------------------------
    # Final test evaluation using PRIMARY checkpoint: best_macro_f1.pt
    # ------------------------------------------------------------------
    primary_ckpt_path = out_dir / "best_macro_f1.pt"
    if not primary_ckpt_path.exists():
        primary_ckpt_path = out_dir / "best.pt"
    ckpt = torch.load(primary_ckpt_path, map_location=device, weights_only=False)
    model.load_state_dict(ckpt["model"])
    model.eval()

    with torch.no_grad():
        val_logits = model(torch.tensor(x_val, dtype=torch.float32, device=device)).cpu().numpy()
        test_logits = model(torch.tensor(x_test, dtype=torch.float32, device=device)).cpu().numpy()

    # Pre-calibration metrics on VAL (Phase 12)
    val_probs_pre = torch.softmax(torch.tensor(val_logits, dtype=torch.float32), dim=1).numpy()
    val_pre_metrics = compute_metrics(y_val, val_probs_pre, class_names)
    val_pre_ece = expected_calibration_error(val_probs_pre, y_val)

    # Temperature scaling fit on VAL only
    temperature = fit_temperature(val_logits, y_val)
    save_temperature(out_dir / "calibration.json", temperature)

    # Apply calibrated scaling to TEST
    test_prob = torch.softmax(torch.tensor(test_logits) / temperature, dim=1).numpy()

    manifest = load_manifest()
    test_idx = manifest.loc[manifest["split"] == "test", "index"].to_numpy()

    # Save training curves (history) first, so artifacts can use them
    (out_dir / "training_history.json").write_text(json.dumps(history, indent=2), encoding="utf-8")
    reports_model_dir = REPORTS_DIR / safe_model
    reports_model_dir.mkdir(parents=True, exist_ok=True)
    (reports_model_dir / "training_history.json").write_text(json.dumps(history, indent=2), encoding="utf-8")

    final_extra = {
        "model": model_name,
        "temperature": temperature,
        "best_val_macro_f1": best_f1,
        "best_epoch_macro_f1": best_epoch_f1,
        "best_val_balanced_acc": best_bal,
        "best_epoch_balanced_acc": best_epoch_bal,
        "best_val_roc_auc": best_roc,
        "best_epoch_roc_auc": best_epoch_roc,
        "n_qubits": n_qubits,
        "n_layers": n_layers,
        "data_reupload": True,
        "scaler_type": scaler_type,
        "post_norm": post_norm,
        "val_pre_cal_ece": val_pre_ece,
        "val_pre_cal_macro_f1": float(val_pre_metrics["macro_f1"]),
        "val_pre_cal_roc_auc": float(val_pre_metrics["roc_auc"]),
        "early_stopping_on": early_stopping_on,
        "total_epochs_run": len(history),
    }

    metrics = write_eval_artifacts(
        reports_model_dir,
        y_test,
        test_prob,
        class_names,
        indices=test_idx,
        extra=final_extra,
    )

    final_ece = float(metrics.get("ece", expected_calibration_error(test_prob, y_test)))
    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    (out_dir / "labels.json").write_text(
        json.dumps({"class_names": class_names, "num_classes": num_classes}, indent=2),
        encoding="utf-8",
    )

    # Final test-set prediction distribution and logits diagnostics
    test_preds_arr = np.argmax(test_prob, axis=1)
    test_pred_counts = np.bincount(test_preds_arr, minlength=num_classes)
    test_pred_frac = test_pred_counts.astype(np.float64) / max(int(test_pred_counts.sum()), 1)
    test_pred_distribution = {
        class_names[c]: int(test_pred_counts[c]) for c in range(num_classes)
    }
    test_logits_stats = {
        "min": float(test_logits.min()),
        "max": float(test_logits.max()),
        "mean": float(test_logits.mean()),
        "std": float(test_logits.std(ddof=0)),
    }

    # Train label distribution (ground truth imbalance reference)
    train_gt_counts = np.bincount(y_train.astype(np.int64), minlength=num_classes)
    train_gt_distribution = {
        class_names[c]: int(train_gt_counts[c]) for c in range(num_classes)
    }
    # Rich config capture
    full_cfg_capture: dict[str, Any] = {
        "name": model_name,
        **qcfg,
        "backbone": backbone,
        "n_qubits": n_qubits,
        "n_layers": n_layers,
        "data_reupload": True,
        "scaler_type": scaler_type,
        "post_norm": post_norm,
        "hparams": {
            "seed": actual_seed,
            "pca_components": actual_pca,
            "balanced_sampling": balanced,
            "use_class_weights": use_class_weights,
            "loss": "FocalLoss",
            "gamma": actual_gamma,
            "label_smoothing": actual_label_smoothing,
            "lr": actual_lr,
            "weight_decay": actual_wd,
            "scheduler": sched_type,
            "cosine_T0": int(tcfg.get("cosine_T0", 10)),
            "batch_size": actual_bs,
            "max_grad_norm": max_grad_norm,
            "epochs": actual_epochs,
            "patience": actual_patience,
            "early_stopping_on": early_stopping_on,
            "dropout": dropout_val,
        },
        "run_summary": {
            "best_val_macro_f1": best_f1,
            "best_epoch_macro_f1": best_epoch_f1,
            "best_val_balanced_accuracy": best_bal,
            "best_epoch_balanced_accuracy": best_epoch_bal,
            "best_val_roc_auc": best_roc,
            "best_epoch_roc_auc": best_epoch_roc,
            "test_macro_f1": float(metrics["macro_f1"]),
            "test_balanced_accuracy": float(metrics["balanced_accuracy"]),
            "test_accuracy": float(metrics["accuracy"]),
            "test_weighted_f1": float(metrics["weighted_f1"]),
            "test_roc_auc": float(metrics["roc_auc"]),
            "test_ece": final_ece,
            "temperature": temperature,
            "total_epochs_run": len(history),
        },
    }
    (out_dir / "config.json").write_text(json.dumps(full_cfg_capture, indent=2), encoding="utf-8")
    (out_dir / "experiment.json").write_text(json.dumps(full_cfg_capture, indent=2), encoding="utf-8")

    # Save final metrics JSON also to the run dir for leaderboard
    final_metrics_for_board = {
        "seed": actual_seed,
        "pca": actual_pca,
        "sampler": "balanced" if balanced else "normal",
        "loss": "FocalLoss",
        "gamma": actual_gamma,
        "label_smoothing": actual_label_smoothing,
        "lr": actual_lr,
        "weight_decay": actual_wd,
        "scheduler": sched_type,
        "quantum_layers": n_layers,
        "qubits": n_qubits,
        "epochs": actual_epochs,
        "best_epoch": best_epoch_f1,
        "accuracy": float(metrics["accuracy"]),
        "macro_f1": float(metrics["macro_f1"]),
        "weighted_f1": float(metrics["weighted_f1"]),
        "balanced_accuracy": float(metrics["balanced_accuracy"]),
        "roc_auc": float(metrics["roc_auc"]),
        "sensitivity_macro": float(metrics["sensitivity_macro"]),
        "ece": final_ece,
        "per_class_precision": [c["precision"] for c in metrics["per_class"]],
        "per_class_recall": [c["recall"] for c in metrics["per_class"]],
        "per_class_f1": [c["f1"] for c in metrics["per_class"]],
        "per_class_support": [c["support"] for c in metrics["per_class"]],
        "confusion_matrix": metrics["confusion_matrix"],
        "temperature": temperature,
        "test_pred_distribution": test_pred_distribution,
        "test_pred_max_frac": float(test_pred_frac.max()),
        "test_logits_stats": test_logits_stats,
        "train_gt_distribution": train_gt_distribution,
    }
    (out_dir / "final_metrics.json").write_text(
        json.dumps(final_metrics_for_board, indent=2), encoding="utf-8"
    )

    if not skip_leaderboard:
        if experiment_name is None:
            auto = [safe_model, f"s{actual_seed}", f"pca{actual_pca}", f"g{actual_gamma:.1f}"]
            auto += [f"ls{actual_label_smoothing:.2f}", f"lr{actual_lr:.0e}", f"wd{actual_wd:.0e}"]
            auto += [f"q{n_qubits}", f"l{n_layers}", sched_type]
            if balanced:
                auto.append("bal")
            if scaler_type != "standard":
                auto.append(scaler_type)
            if post_norm != "none":
                auto.append(post_norm)
            auto_name = "_".join(auto)
        else:
            auto_name = experiment_name
        record_experiment(auto_name, final_metrics_for_board, final_metrics_for_board, out_dir)

    print(
        json.dumps(
            {
                "best_val_macro_f1": best_f1,
                "best_epoch": best_epoch_f1,
                "test_accuracy": float(metrics["accuracy"]),
                "test_macro_f1": float(metrics["macro_f1"]),
                "test_balanced_accuracy": float(metrics["balanced_accuracy"]),
                "test_roc_auc": float(metrics["roc_auc"]),
                "test_ece": final_ece,
            },
            indent=2,
        )
    )
    return out_dir


def main() -> None:
    p = argparse.ArgumentParser(
        description="Train QuantumDerma with full experiment tracking (15-phase protocol)."
    )
    p.add_argument("--model", default="QuantumDerma", choices=list(BUILDERS))
    p.add_argument("--config", default="quantum.yaml")
    p.add_argument("--no-resume", action="store_true")
    p.add_argument("--experiment-name", type=str, default=None)
    p.add_argument("--seed", type=int, default=None)
    p.add_argument("--pca-components", type=int, default=None)
    p.add_argument("--qubits", type=int, default=None)
    p.add_argument("--layers", type=int, default=None)
    p.add_argument("--dropout", type=float, default=None)
    p.add_argument("--focal-gamma", type=float, default=None)
    p.add_argument("--label-smoothing", type=float, default=None)
    p.add_argument("--lr", type=float, default=None)
    p.add_argument("--weight-decay", type=float, default=None)
    p.add_argument("--scheduler", type=str, default=None, choices=sorted(VALID_SCHEDULERS))
    p.add_argument("--cosine-T0", type=int, default=None)
    p.add_argument("--epochs", type=int, default=None)
    p.add_argument("--batch-size", type=int, default=None)
    p.add_argument("--balanced-sampling", action="store_true", default=None)
    p.add_argument("--max-grad-norm", type=float, default=None)
    p.add_argument("--patience", type=int, default=None)
    p.add_argument(
        "--early-stopping-on",
        type=str,
        default="macro_f1",
        choices=["macro_f1", "balanced_accuracy", "roc_auc"],
    )
    p.add_argument(
        "--scaler-type",
        type=str,
        default="standard",
        choices=sorted(VALID_SCALERS),
    )
    p.add_argument(
        "--post-norm",
        type=str,
        default="none",
        choices=sorted(VALID_POST_NORM),
    )
    p.add_argument("--use-class-weights", action="store_true", default=False)
    p.add_argument("--skip-leaderboard", action="store_true", default=False)
    args = p.parse_args()
    train_quantum(
        model_name=args.model,
        config_name=args.config,
        no_resume=args.no_resume,
        experiment_name=args.experiment_name,
        seed=args.seed,
        pca_components=args.pca_components,
        qubits=args.qubits,
        layers=args.layers,
        dropout=args.dropout,
        focal_gamma=args.focal_gamma,
        label_smoothing=args.label_smoothing,
        lr=args.lr,
        weight_decay=args.weight_decay,
        scheduler=args.scheduler,
        cosine_T0=args.cosine_T0,
        epochs=args.epochs,
        batch_size=args.batch_size,
        balanced_sampling=args.balanced_sampling,
        max_grad_norm=args.max_grad_norm,
        patience=args.patience,
        early_stopping_on=args.early_stopping_on,
        scaler_type=args.scaler_type,
        post_norm=args.post_norm,
        use_class_weights=args.use_class_weights,
        skip_leaderboard=args.skip_leaderboard,
    )


if __name__ == "__main__":
    main()
