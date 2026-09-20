from __future__ import annotations

import json

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score

from ml.skin_cancer.paths import REPORTS_DIR


def main() -> None:
    feat_dir = REPORTS_DIR / "features" / "DermisNova"
    xtr, ytr = np.load(feat_dir / "train_x.npy"), np.load(feat_dir / "train_y.npy")
    xv, yv = np.load(feat_dir / "val_x.npy"), np.load(feat_dir / "val_y.npy")
    xp_tr, xp_v = np.load(feat_dir / "train_pca.npy"), np.load(feat_dir / "val_pca.npy")
    cnn_mlp = LogisticRegression(max_iter=400, class_weight="balanced").fit(xtr, ytr)
    pca_mlp = LogisticRegression(max_iter=400, class_weight="balanced").fit(xp_tr, ytr)
    rows = {
        "A_CNN_compact_linear": float(f1_score(yv, cnn_mlp.predict(xv), average="macro")),
        "B_CNN_PCA_MLP": float(f1_score(yv, pca_mlp.predict(xp_v), average="macro")),
    }
    qpath = REPORTS_DIR / "QuantumDerma" / "metrics.json"
    if qpath.exists():
        rows["C_CNN_PCA_quantum"] = json.loads(qpath.read_text(encoding="utf-8")).get("macro_f1")
    (REPORTS_DIR / "ablation_study.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
    print(json.dumps(rows, indent=2))


if __name__ == "__main__":
    main()
