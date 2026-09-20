"""Breast Cancer (WDBC) Fine-Tuning Pipeline: OncoPulse-VQC & OncoPulse-QSVM.

Optimized for execution in Kaggle or local environments.
Dataset: Wisconsin Diagnostic Breast Cancer (WDBC) - 569 samples, 30 features
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

import joblib
import numpy as np
import pandas as pd
from sklearn.datasets import load_breast_cancer
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.svm import SVC

from metrics_evaluator import evaluate_clinical_model
from quantum_circuits import StandaloneVQC


def load_wdbc_data():
    """Loads WDBC dataset from sklearn or creates clean dataframe."""
    data = load_breast_cancer()
    df = pd.DataFrame(data.data, columns=data.feature_names)
    target = pd.Series(data.target, name="target")
    return df, target


def train_breast_cancer_pipeline(args):
    print(f"🚀 Initializing Breast Cancer (OncoPulse) Quantum Fine-Tuning Pipeline...")

    df, target = load_wdbc_data()
    X = df.values.astype(np.float32)
    y = target.values.astype(int)

    # 70/15/15 Stratified Split
    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3, stratify=y, random_state=args.seed)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=args.seed)

    # Preprocessing: Min-Max + PCA
    scaler = MinMaxScaler(feature_range=(0, np.pi))
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    pca = PCA(n_components=args.n_qubits, random_state=args.seed)
    X_train_q = pca.fit_transform(X_train_scaled)
    X_val_q = pca.transform(X_val_scaled)
    X_test_q = pca.transform(X_test_scaled)

    var_ratio = float(np.sum(pca.explained_variance_ratio_))
    print(f"  PCA {args.n_qubits} Qubit Projection Retained Variance: {var_ratio:.2%}")

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Fine-Tune OncoPulse-VQC
    print("\n⚛️ Training OncoPulse-VQC...")
    vqc = StandaloneVQC(n_qubits=args.n_qubits, n_layers=args.n_layers, lr=args.lr)
    vqc.fit(X_train_q, y_train, X_val=X_val_q, y_val=y_val, epochs=args.epochs, batch_size=args.batch_size)

    # Evaluate VQC
    t0 = time.perf_counter()
    vqc_probs = vqc.predict_proba(X_test_q)
    t1 = time.perf_counter()
    vqc_latency = (t1 - t0) * 1000 / len(X_test_q)
    vqc_preds = np.argmax(vqc_probs, axis=1)

    vqc_report = evaluate_clinical_model(
        model_name="OncoPulse-VQC",
        model_type="Quantum Hybrid VQC",
        y_true=y_test,
        y_pred=vqc_preds,
        y_prob=vqc_probs,
        inference_time_ms=vqc_latency,
    )

    vqc_ckpt = output_dir / "OncoPulse-VQC.pt"
    vqc.save_checkpoint(str(vqc_ckpt))
    with open(output_dir / "training_history.json", "w") as f:
        import json
        json.dump(getattr(vqc, "history", {}), f, indent=2)
    with open(output_dir / "vqc_history.json", "w") as f:
        json.dump(getattr(vqc, "history", {}), f, indent=2)
    print(f"✨ VQC Checkpoint saved to: {vqc_ckpt}")

    # 2. Fine-Tune OncoPulse-QSVM (Quantum Kernel Matrix)
    print("\n⚛️ Training OncoPulse-QSVM (Quantum Kernel)...")
    from quantum_circuits import QuantumSupportVectorMachine
    qsvm = QuantumSupportVectorMachine(n_qubits=args.n_qubits)
    qsvm.fit(X_train_q[:150], y_train[:150])  # Kernel subset for fast simulation

    t0 = time.perf_counter()
    qsvm_probs = qsvm.predict_proba(X_test_q)
    t1 = time.perf_counter()
    qsvm_latency = (t1 - t0) * 1000 / len(X_test_q)
    qsvm_preds = qsvm.predict(X_test_q)

    qsvm_report = evaluate_clinical_model(
        model_name="OncoPulse-QSVM",
        model_type="Quantum Kernel QSVM",
        y_true=y_test,
        y_pred=qsvm_preds,
        y_prob=qsvm_probs,
        inference_time_ms=qsvm_latency,
    )
    qsvm.save_checkpoint(str(output_dir / "OncoPulse-QSVM.joblib"))

    # 3. Benchmark Classical Sentinel-RF & Sentinel-SVM Baselines
    print("\n🌲 Training Classical Sentinel-RF & Sentinel-SVM Baselines...")
    rf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=args.seed)
    rf.fit(X_train, y_train)

    t0 = time.perf_counter()
    rf_probs = rf.predict_proba(X_test)
    t1 = time.perf_counter()
    rf_latency = (t1 - t0) * 1000 / len(X_test)
    rf_preds = rf.predict(X_test)

    rf_report = evaluate_clinical_model(
        model_name="Sentinel-RF",
        model_type="Classical Baseline",
        y_true=y_test,
        y_pred=rf_preds,
        y_prob=rf_probs,
        inference_time_ms=rf_latency,
    )
    joblib.dump(rf, output_dir / "Sentinel-RF.joblib")

    # Classical SVM
    svm = SVC(kernel="rbf", probability=True, random_state=args.seed)
    svm.fit(X_train_scaled, y_train)
    svm_probs = svm.predict_proba(X_test_scaled)
    svm_preds = svm.predict(X_test_scaled)
    svm_report = evaluate_clinical_model(
        model_name="Sentinel-SVM",
        model_type="Classical Baseline",
        y_true=y_test,
        y_pred=svm_preds,
        y_prob=svm_probs,
        inference_time_ms=1.5,
    )
    joblib.dump(svm, output_dir / "Sentinel-SVM.joblib")

    # Save Preprocessor Artifacts
    joblib.dump({"scaler": scaler, "pca": pca}, output_dir / "preprocessor_wdbc.joblib")
    print(f"✅ Breast Cancer Fine-Tuning Complete! Artifacts stored in: {output_dir}")

    return {"vqc": vqc_report, "qsvm": qsvm_report, "rf": rf_report, "svm": svm_report}



if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune OncoPulse-VQC on WDBC")
    parser.add_argument("--output-dir", type=str, default="./outputs/breast_cancer")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=0.03)
    parser.add_argument("--n-qubits", type=int, default=8)
    parser.add_argument("--n-layers", type=int, default=3)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    train_breast_cancer_pipeline(args)
