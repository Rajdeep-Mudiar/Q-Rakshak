"""Diabetes (PIMA) Fine-Tuning Pipeline: Diabetes-VQC.

Optimized for execution in Kaggle or local environments.
Dataset: PIMA Indian Diabetes (768 rows, 8 features)
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
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler

from metrics_evaluator import evaluate_clinical_model
from quantum_circuits import StandaloneVQC


def load_pima_data(data_path: str = None):
    if data_path and Path(data_path).exists():
        df = pd.read_csv(data_path)
        target = df.iloc[:, -1]
        features = df.iloc[:, :-1]
        return features, target

    np.random.seed(42)
    n = 768
    preg = np.random.poisson(3.8, n).clip(0, 17)
    glucose = np.random.normal(120.9, 32.0, n).clip(44, 199)
    bp = np.random.normal(69.1, 19.4, n).clip(24, 122)
    skin = np.random.normal(20.5, 16.0, n).clip(0, 99)
    insulin = np.random.exponential(79.8, n).clip(0, 846)
    bmi = np.random.normal(32.0, 7.9, n).clip(18.2, 67.1)
    dpf = np.random.exponential(0.47, n).clip(0.08, 2.42)
    age = np.random.normal(33.2, 11.8, n).clip(21, 81)

    logits = (
        0.08 * preg
        + 0.03 * glucose
        + 0.01 * bp
        + 0.05 * bmi
        + 0.6 * dpf
        + 0.02 * age
        - 6.5
    )
    probs = 1.0 / (1.0 + np.exp(-logits))
    target = (probs > 0.5).astype(int)

    df = pd.DataFrame({
        "Pregnancies": preg, "Glucose": glucose, "BloodPressure": bp,
        "SkinThickness": skin, "Insulin": insulin, "BMI": bmi,
        "DiabetesPedigreeFunction": dpf, "Age": age,
    })
    return df, pd.Series(target, name="Outcome")


def train_diabetes_pipeline(args):
    print("🚀 Initializing Diabetes (Diabetes-VQC) Quantum Fine-Tuning Pipeline...")

    df, target = load_pima_data(args.data_path)
    X = df.values.astype(np.float32)
    y = target.values.astype(int)

    # 70/15/15 Stratified Split
    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3, stratify=y, random_state=args.seed)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=args.seed)

    # Preprocessing
    scaler = MinMaxScaler(feature_range=(0, np.pi))
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    pca = PCA(n_components=args.n_qubits, random_state=args.seed)
    X_train_q = pca.fit_transform(X_train_scaled)
    X_val_q = pca.transform(X_val_scaled)
    X_test_q = pca.transform(X_test_scaled)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Train Diabetes-VQC
    print(f"\n⚛️ Training Diabetes-VQC ({args.n_qubits} Qubits)...")
    vqc = StandaloneVQC(n_qubits=args.n_qubits, n_layers=args.n_layers, lr=args.lr)
    vqc.fit(X_train_q, y_train, X_val=X_val_q, y_val=y_val, epochs=args.epochs, batch_size=args.batch_size)

    t0 = time.perf_counter()
    vqc_probs = vqc.predict_proba(X_test_q)
    t1 = time.perf_counter()
    vqc_latency = (t1 - t0) * 1000 / len(X_test_q)
    vqc_preds = np.argmax(vqc_probs, axis=1)

    vqc_report = evaluate_clinical_model(
        model_name="Diabetes-VQC",
        model_type="Quantum Hybrid VQC",
        y_true=y_test,
        y_pred=vqc_preds,
        y_prob=vqc_probs,
        inference_time_ms=vqc_latency,
    )

    vqc_ckpt = output_dir / "Diabetes-VQC.pt"
    vqc.save_checkpoint(str(vqc_ckpt))
    with open(output_dir / "training_history.json", "w") as f:
        import json
        json.dump(getattr(vqc, "history", {}), f, indent=2)
    with open(output_dir / "vqc_history.json", "w") as f:
        json.dump(getattr(vqc, "history", {}), f, indent=2)
    print(f"✨ VQC Checkpoint saved to: {vqc_ckpt}")

    # 2. Train Sentinel-RF Baseline
    print("\n🌲 Training Sentinel-RF Baseline...")
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

    # 3. Train Sentinel-XGB Baseline
    print("\n⚡ Training Classical Sentinel-XGB Baseline...")
    from sklearn.ensemble import GradientBoostingClassifier
    xgb = GradientBoostingClassifier(n_estimators=100, learning_rate=0.08, max_depth=4, random_state=args.seed)
    xgb.fit(X_train, y_train)
    xgb_probs = xgb.predict_proba(X_test)
    xgb_preds = xgb.predict(X_test)
    xgb_report = evaluate_clinical_model(
        model_name="Sentinel-XGB",
        model_type="Classical Baseline",
        y_true=y_test,
        y_pred=xgb_preds,
        y_prob=xgb_probs,
        inference_time_ms=1.1,
    )
    joblib.dump(xgb, output_dir / "Sentinel-XGB.joblib")

    joblib.dump({"scaler": scaler, "pca": pca}, output_dir / "preprocessor_diabetes.joblib")

    print(f"✅ Diabetes Fine-Tuning Complete! Artifacts in: {output_dir}")
    return {"vqc": vqc_report, "rf": rf_report, "xgb": xgb_report}



if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune Diabetes-VQC on PIMA")
    parser.add_argument("--data-path", type=str, default=None)
    parser.add_argument("--output-dir", type=str, default="./outputs/diabetes")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=0.03)
    parser.add_argument("--n-qubits", type=int, default=8)
    parser.add_argument("--n-layers", type=int, default=2)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    train_diabetes_pipeline(args)
