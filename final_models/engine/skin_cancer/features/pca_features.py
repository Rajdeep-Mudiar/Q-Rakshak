from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import MinMaxScaler, StandardScaler

from ml.skin_cancer.paths import MODELS_DIR, REPORTS_DIR, ensure_dirs


VALID_SCALERS = {"standard", "minmax", "none"}
VALID_POST_NORM = {"none", "l2"}


def fit_pca(
    model_name: str = "DermisNova",
    n_components: int = 16,
    quantum_model_name: str = "QuantumDerma",
    scaler_type: str = "standard",
    post_norm: str = "none",
    random_state: int = 42,
) -> Path:
    """Fit scaler and PCA on extracted CNN training features.

    Supports Phase 8 ablation (scaler + normalization choices). PCA is always
    fitted on training data only, val/test use only ``transform``.

    Args:
        model_name: Backbone feature extractor name.
        n_components: Number of principal components.
        quantum_model_name: Quantum model name for saving artifacts.
        scaler_type: One of ``"standard"`` (default), ``"minmax"``, ``"none"``.
        post_norm: One of ``"none"`` (default) or ``"l2"`` (L2-norm PCA output).
        random_state: PCA random seed.

    Returns:
        Path to the quantum model output directory.
    """
    if scaler_type not in VALID_SCALERS:
        raise ValueError(f"scaler_type must be one of {VALID_SCALERS}, got {scaler_type!r}")
    if post_norm not in VALID_POST_NORM:
        raise ValueError(f"post_norm must be one of {VALID_POST_NORM}, got {post_norm!r}")

    ensure_dirs()
    feat_dir = REPORTS_DIR / "features" / model_name
    x_train = np.load(feat_dir / "train_x.npy")

    max_components = min(x_train.shape[0], x_train.shape[1], n_components)

    # Fit scaler on TRAIN only
    if scaler_type == "standard":
        scaler = StandardScaler()
    elif scaler_type == "minmax":
        scaler = MinMaxScaler()
    else:
        scaler = None

    z = scaler.fit_transform(x_train) if scaler is not None else x_train

    pca = PCA(n_components=max_components, random_state=random_state)
    pca.fit(z)

    def _apply(x: np.ndarray) -> np.ndarray:
        t = scaler.transform(x) if scaler is not None else x
        p = pca.transform(t)
        if post_norm == "l2":
            norms = np.linalg.norm(p, axis=1, keepdims=True)
            p = p / np.maximum(norms, 1e-12)
        return p

    # Save to quantum model folder
    out = MODELS_DIR / "quantum" / quantum_model_name
    out.mkdir(parents=True, exist_ok=True)
    if scaler is not None:
        joblib.dump(scaler, out / "scaler.pkl")
    joblib.dump(pca, out / "pca.pkl")

    joblib.dump(scaler, feat_dir / "scaler.pkl") if scaler is not None else None
    joblib.dump(pca, feat_dir / "pca.pkl")

    meta = {
        "explained_variance_ratio": pca.explained_variance_ratio_.tolist(),
        "total_explained_variance": float(np.sum(pca.explained_variance_ratio_)),
        "n_components": max_components,
        "source_model": model_name,
        "scaler_type": scaler_type,
        "post_norm": post_norm,
    }
    (out / "pca_meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    (feat_dir / "pca_meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    for split in ("train", "val", "test"):
        split_file = feat_dir / f"{split}_x.npy"
        if split_file.exists():
            x = np.load(split_file)
            p = _apply(x)
            np.save(feat_dir / f"{split}_pca.npy", p)

    return out


if __name__ == "__main__":
    fit_pca()

