from __future__ import annotations

import json

import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression

from ml.skin_cancer.constants import HAM10000_LABELS
from ml.skin_cancer.data.split_dataset import load_manifest
from ml.skin_cancer.evaluation import write_eval_artifacts
from ml.skin_cancer.paths import MODELS_DIR, REPORTS_DIR, ensure_dirs
from ml.skin_cancer.quantum.quantum_derma import QuantumDerma
from ml.skin_cancer.seed import get_device
import torch


def train_fusion() -> None:
    ensure_dirs()
    feat_dir = REPORTS_DIR / "features" / "DermisNova"
    xtr = np.load(feat_dir / "train_x.npy")
    ytr = np.load(feat_dir / "train_y.npy")
    xv = np.load(feat_dir / "val_x.npy")
    yv = np.load(feat_dir / "val_y.npy")
    xt = np.load(feat_dir / "test_x.npy")
    yt = np.load(feat_dir / "test_y.npy")
    xvp = np.load(feat_dir / "val_pca.npy")
    xtp = np.load(feat_dir / "test_pca.npy")
    class_names = [HAM10000_LABELS[i] for i in range(int(ytr.max()) + 1)]

    clf = LogisticRegression(max_iter=400, class_weight="balanced")
    clf.fit(xtr, ytr)
    c_val = clf.predict_proba(xv)
    c_test = clf.predict_proba(xt)

    device = get_device()
    qckpt = torch.load(MODELS_DIR / "quantum" / "QuantumDerma" / "best.pt", map_location=device, weights_only=False)
    qmodel = QuantumDerma(
        qckpt["num_classes"],
        n_qubits=int(qckpt["config"]["qubits"]),
        n_layers=int(qckpt["config"]["layers"]),
        in_dim=int(qckpt["in_dim"]),
    ).to(device)
    qmodel.load_state_dict(qckpt["model"])
    qmodel.eval()
    with torch.no_grad():
        q_val = torch.softmax(qmodel(torch.tensor(xvp, dtype=torch.float32, device=device)), dim=1).cpu().numpy()
        q_test = torch.softmax(qmodel(torch.tensor(xtp, dtype=torch.float32, device=device)), dim=1).cpu().numpy()

    head = LogisticRegression(max_iter=400)
    head.fit(np.concatenate([c_val, q_val], axis=1), yv)
    test_prob = head.predict_proba(np.concatenate([c_test, q_test], axis=1))
    test_idx = load_manifest().loc[lambda d: d["split"] == "test", "index"].to_numpy()
    metrics = write_eval_artifacts(
        REPORTS_DIR / "QDermaFusion",
        yt,
        test_prob,
        class_names,
        indices=test_idx,
        extra={"model": "QDermaFusion"},
    )
    out = MODELS_DIR / "quantum" / "QDermaFusion"
    out.mkdir(parents=True, exist_ok=True)
    joblib.dump({"cnn_head": clf, "fusion": head}, out / "fusion.pkl")
    (out / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps({k: metrics[k] for k in ("accuracy", "macro_f1")}, indent=2))


if __name__ == "__main__":
    train_fusion()
