from __future__ import annotations

import argparse

from ml.skin_cancer.data.audit_dataset import audit
from ml.skin_cancer.data.detect_duplicates import detect
from ml.skin_cancer.data.split_dataset import build_split
from ml.skin_cancer.evaluation.evaluate_all import evaluate_all
from ml.skin_cancer.paths import MODELS_DIR, ensure_dirs
from ml.skin_cancer.training.common import train_classical
from ml.skin_cancer.training.train_quantum import train_quantum


def run(
    full: bool = False,
    no_resume: bool = False,
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
    balanced_sampling: bool = False,
    max_grad_norm: float | None = None,
    patience: int | None = None,
    early_stopping_on: str = "macro_f1",
    scaler_type: str = "standard",
    post_norm: str = "none",
    use_class_weights: bool = False,
    skip_leaderboard: bool = False,
) -> None:
    """Run the quantum machine learning pipeline.

    Every explicit override is forwarded to all ``train_quantum`` calls,
    enabling one-variable-at-a-time ablations across the full pipeline.
    """
    ensure_dirs()
    print("== dataset audit ==")
    audit()
    print("== duplicates check ==")
    detect()
    print("== stratified split ==")
    build_split()

    backbone_ckpt = MODELS_DIR / "classical" / "DermisNova" / "best.pt"
    if not backbone_ckpt.exists():
        print("== preparing backbone feature extractor (DermisNova) ==")
        train_classical("DermisNova")

    shared = dict(
        no_resume=no_resume,
        seed=seed,
        pca_components=pca_components,
        qubits=qubits,
        layers=layers,
        dropout=dropout,
        focal_gamma=focal_gamma,
        label_smoothing=label_smoothing,
        lr=lr,
        weight_decay=weight_decay,
        scheduler=scheduler,
        cosine_T0=cosine_T0,
        epochs=epochs,
        batch_size=batch_size,
        balanced_sampling=balanced_sampling,
        max_grad_norm=max_grad_norm,
        patience=patience,
        early_stopping_on=early_stopping_on,
        scaler_type=scaler_type,
        post_norm=post_norm,
        use_class_weights=use_class_weights,
        skip_leaderboard=skip_leaderboard,
    )

    print("== train QuantumDerma (QML) ==")
    train_quantum("QuantumDerma", **shared)

    if full:
        print("== train QuantumDermaX (12 qubits QML) ==")
        train_quantum("QuantumDermaX", **shared)
        print("== train VitaQ-Derm (Raw-feature QML) ==")
        train_quantum("VitaQ-Derm", **shared)
        print("== train QSkin-Vortex (Deep 5-layer QML) ==")
        train_quantum("QSkin-Vortex", **shared)

    print("== model evaluation ==")
    evaluate_all()


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Run the skin cancer QML training pipeline.")
    p.add_argument("--full", action="store_true", help="Train all quantum model variants")
    p.add_argument("--no-resume", action="store_true")
    p.add_argument("--seed", type=int, default=None)
    p.add_argument("--pca-components", type=int, default=None)
    p.add_argument("--qubits", type=int, default=None)
    p.add_argument("--layers", type=int, default=None)
    p.add_argument("--dropout", type=float, default=None)
    p.add_argument("--focal-gamma", type=float, default=None)
    p.add_argument("--label-smoothing", type=float, default=None)
    p.add_argument("--lr", type=float, default=None)
    p.add_argument("--weight-decay", type=float, default=None)
    p.add_argument("--scheduler", type=str, default=None)
    p.add_argument("--cosine-T0", type=int, default=None)
    p.add_argument("--epochs", type=int, default=None)
    p.add_argument("--batch-size", type=int, default=None)
    p.add_argument("--balanced-sampling", action="store_true", default=False)
    p.add_argument("--max-grad-norm", type=float, default=None)
    p.add_argument("--patience", type=int, default=None)
    p.add_argument(
        "--early-stopping-on",
        type=str,
        default="macro_f1",
        choices=["macro_f1", "balanced_accuracy", "roc_auc"],
    )
    p.add_argument("--scaler-type", type=str, default="standard")
    p.add_argument("--post-norm", type=str, default="none")
    p.add_argument("--use-class-weights", action="store_true", default=False)
    p.add_argument("--skip-leaderboard", action="store_true", default=False)
    args = p.parse_args()
    run(
        full=args.full,
        no_resume=args.no_resume,
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
