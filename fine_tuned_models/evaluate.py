"""Q-RAKSHAK Universal Evaluation & Benchmark CLI.

Loads fine-tuned weights from outputs/ and runs test benchmarks with full clinical metrics:
- Accuracy, Sensitivity, Specificity, Precision, F1-Score, AUC-ROC, MCC, Calibration ECE.

Usage:
    python fine_tuned_models/evaluate.py --disease all --weights-dir ./outputs
"""

import argparse
import json
import sys
from pathlib import Path
import numpy as np

# Add project roots for imports
CURRENT_DIR = Path(__file__).resolve().parent
COMMON_DIR = CURRENT_DIR / "pipelines" / "common"
for p in [str(CURRENT_DIR), str(COMMON_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from pipelines.common.metrics_evaluator import evaluate_clinical_model
from pipelines.common.quantum_circuits import StandaloneVQC, QuantumSupportVectorMachine


def run_breast_cancer_evaluation(weights_dir: Path):
    import joblib
    from sklearn.datasets import load_breast_cancer
    from sklearn.model_selection import train_test_split
    
    data = load_breast_cancer()
    X = data.data.astype(np.float32)
    y = data.target.astype(int)
    _, X_temp, _, y_temp = train_test_split(X, y, test_size=0.3, stratify=y, random_state=42)
    _, X_test, _, y_test = train_test_split(X_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=42)
    
    prep_path = weights_dir / "breast_cancer" / "preprocessor_wdbc.joblib"
    results = {}
    if prep_path.exists():
        prep = joblib.load(prep_path)
        scaler, pca = prep["scaler"], prep["pca"]
        X_test_scaled = scaler.transform(X_test)
        X_test_q = pca.transform(X_test_scaled)
        
        # 1. OncoPulse-VQC
        vqc_path = weights_dir / "breast_cancer" / "OncoPulse-VQC.pt"
        if vqc_path.exists():
            vqc = StandaloneVQC(n_qubits=8, n_layers=3)
            vqc.load_checkpoint(str(vqc_path))
            vqc_probs = vqc.predict_proba(X_test_q)
            results["OncoPulse-VQC"] = evaluate_clinical_model("OncoPulse-VQC", "Quantum VQC", y_test, np.argmax(vqc_probs, axis=1), vqc_probs)

        # 2. OncoPulse-QSVM
        qsvm_path = weights_dir / "breast_cancer" / "OncoPulse-QSVM.joblib"
        if qsvm_path.exists():
            qsvm = QuantumSupportVectorMachine(n_qubits=8)
            qsvm.load_checkpoint(str(qsvm_path))
            qsvm_probs = qsvm.predict_proba(X_test_q)
            results["OncoPulse-QSVM"] = evaluate_clinical_model("OncoPulse-QSVM", "Quantum QSVM", y_test, qsvm.predict(X_test_q), qsvm_probs)

        # 3. Sentinel-RF
        rf_path = weights_dir / "breast_cancer" / "Sentinel-RF.joblib"
        if rf_path.exists():
            rf = joblib.load(rf_path)
            results["Sentinel-RF"] = evaluate_clinical_model("Sentinel-RF", "Classical RF", y_test, rf.predict(X_test), rf.predict_proba(X_test))

        # 4. Sentinel-SVM
        svm_path = weights_dir / "breast_cancer" / "Sentinel-SVM.joblib"
        if svm_path.exists():
            svm = joblib.load(svm_path)
            results["Sentinel-SVM"] = evaluate_clinical_model("Sentinel-SVM", "Classical SVM", y_test, svm.predict(X_test_scaled), svm.predict_proba(X_test_scaled))
            
    return results


def run_heart_disease_evaluation(weights_dir: Path):
    import joblib
    from pipelines.tabular.train_heart_disease import load_heart_data
    from sklearn.model_selection import train_test_split
    
    df, target = load_heart_data()
    X = df.values.astype(np.float32)
    y = target.values.astype(int)
    _, X_temp, _, y_temp = train_test_split(X, y, test_size=0.3, stratify=y, random_state=42)
    _, X_test, _, y_test = train_test_split(X_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=42)
    
    prep_path = weights_dir / "heart_disease" / "preprocessor_heart.joblib"
    results = {}
    if prep_path.exists():
        prep = joblib.load(prep_path)
        scaler, pca = prep["scaler"], prep["pca"]
        X_test_scaled = scaler.transform(X_test)
        X_test_q = pca.transform(X_test_scaled)
        
        vqc_path = weights_dir / "heart_disease" / "CardioWave-VQC.pt"
        if vqc_path.exists():
            vqc = StandaloneVQC(n_qubits=8, n_layers=3)
            vqc.load_checkpoint(str(vqc_path))
            vqc_probs = vqc.predict_proba(X_test_q)
            results["CardioWave-VQC"] = evaluate_clinical_model("CardioWave-VQC", "Quantum VQC", y_test, np.argmax(vqc_probs, axis=1), vqc_probs)

        xgb_path = weights_dir / "heart_disease" / "Sentinel-XGB.joblib"
        if xgb_path.exists():
            xgb = joblib.load(xgb_path)
            results["Sentinel-XGB"] = evaluate_clinical_model("Sentinel-XGB", "Classical XGB", y_test, xgb.predict(X_test), xgb.predict_proba(X_test))

        mlp_path = weights_dir / "heart_disease" / "Sentinel-MLP.joblib"
        if mlp_path.exists():
            mlp = joblib.load(mlp_path)
            results["Sentinel-MLP"] = evaluate_clinical_model("Sentinel-MLP", "Classical MLP", y_test, mlp.predict(X_test_scaled), mlp.predict_proba(X_test_scaled))
            
    return results


def run_parkinsons_evaluation(weights_dir: Path):
    import joblib
    from pipelines.tabular.train_parkinsons import load_parkinsons_data
    from sklearn.model_selection import train_test_split
    
    df, target = load_parkinsons_data()
    X = df.values.astype(np.float32)
    y = target.values.astype(int)
    _, X_temp, _, y_temp = train_test_split(X, y, test_size=0.3, stratify=y, random_state=42)
    _, X_test, _, y_test = train_test_split(X_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=42)
    
    prep_path = weights_dir / "parkinsons" / "preprocessor_parkinsons.joblib"
    results = {}
    if prep_path.exists():
        prep = joblib.load(prep_path)
        scaler, pca = prep["scaler"], prep["pca"]
        X_test_scaled = scaler.transform(X_test)
        X_test_q = pca.transform(X_test_scaled)
        
        vqc_path = weights_dir / "parkinsons" / "NeuroSynapse-VQC.pt"
        if vqc_path.exists():
            vqc = StandaloneVQC(n_qubits=6, n_layers=2)
            vqc.load_checkpoint(str(vqc_path))
            vqc_probs = vqc.predict_proba(X_test_q)
            results["NeuroSynapse-VQC"] = evaluate_clinical_model("NeuroSynapse-VQC", "Quantum VQC", y_test, np.argmax(vqc_probs, axis=1), vqc_probs)

        rf_path = weights_dir / "parkinsons" / "Sentinel-RF.joblib"
        if rf_path.exists():
            rf = joblib.load(rf_path)
            results["Sentinel-RF"] = evaluate_clinical_model("Sentinel-RF", "Classical RF", y_test, rf.predict(X_test), rf.predict_proba(X_test))

        lr_path = weights_dir / "parkinsons" / "Sentinel-LogReg.joblib"
        if lr_path.exists():
            lr = joblib.load(lr_path)
            results["Sentinel-LogReg"] = evaluate_clinical_model("Sentinel-LogReg", "Classical LogReg", y_test, lr.predict(X_test_scaled), lr.predict_proba(X_test_scaled))
            
    return results


def run_diabetes_evaluation(weights_dir: Path):
    import joblib
    from pipelines.tabular.train_diabetes import load_pima_data
    from sklearn.model_selection import train_test_split
    
    df, target = load_pima_data()
    X = df.values.astype(np.float32)
    y = target.values.astype(int)
    _, X_temp, _, y_temp = train_test_split(X, y, test_size=0.3, stratify=y, random_state=42)
    _, X_test, _, y_test = train_test_split(X_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=42)
    
    prep_path = weights_dir / "diabetes" / "preprocessor_diabetes.joblib"
    results = {}
    if prep_path.exists():
        prep = joblib.load(prep_path)
        scaler, pca = prep["scaler"], prep["pca"]
        X_test_scaled = scaler.transform(X_test)
        X_test_q = pca.transform(X_test_scaled)
        
        vqc_path = weights_dir / "diabetes" / "Diabetes-VQC.pt"
        if vqc_path.exists():
            vqc = StandaloneVQC(n_qubits=8, n_layers=2)
            vqc.load_checkpoint(str(vqc_path))
            vqc_probs = vqc.predict_proba(X_test_q)
            results["Diabetes-VQC"] = evaluate_clinical_model("Diabetes-VQC", "Quantum VQC", y_test, np.argmax(vqc_probs, axis=1), vqc_probs)

        rf_path = weights_dir / "diabetes" / "Sentinel-RF.joblib"
        if rf_path.exists():
            rf = joblib.load(rf_path)
            results["Sentinel-RF"] = evaluate_clinical_model("Sentinel-RF", "Classical RF", y_test, rf.predict(X_test), rf.predict_proba(X_test))

        xgb_path = weights_dir / "diabetes" / "Sentinel-XGB.joblib"
        if xgb_path.exists():
            xgb = joblib.load(xgb_path)
            results["Sentinel-XGB"] = evaluate_clinical_model("Sentinel-XGB", "Classical XGB", y_test, xgb.predict(X_test), xgb.predict_proba(X_test))
            
    return results


def main():
    parser = argparse.ArgumentParser(description="Q-RAKSHAK Master Evaluation CLI")
    parser.add_argument(
        "--disease",
        type=str,
        choices=["pneumonia", "skin_cancer", "breast_cancer", "heart_disease", "parkinsons", "diabetes", "all"],
        default="all",
        help="Disease module to benchmark",
    )
    parser.add_argument("--weights-dir", type=str, default="./outputs", help="Directory containing trained weights")
    args = parser.parse_args()

    weights_base = Path(args.weights_dir)
    print(f"🔬 Running Dynamic Clinical Benchmark Evaluation on weights in: {weights_base}")
    
    all_results = {}
    if args.disease in ["breast_cancer", "all"]:
        print("\n---> [Evaluating Breast Cancer Models] <---")
        all_results["breast_cancer"] = run_breast_cancer_evaluation(weights_base)
        
    if args.disease in ["heart_disease", "all"]:
        print("\n---> [Evaluating Heart Disease Models] <---")
        all_results["heart_disease"] = run_heart_disease_evaluation(weights_base)
        
    if args.disease in ["parkinsons", "all"]:
        print("\n---> [Evaluating Parkinson's Models] <---")
        all_results["parkinsons"] = run_parkinsons_evaluation(weights_base)
        
    if args.disease in ["diabetes", "all"]:
        print("\n---> [Evaluating Diabetes Models] <---")
        all_results["diabetes"] = run_diabetes_evaluation(weights_base)

    summary_file = weights_base / "benchmark_summary.json"
    with open(summary_file, "w") as f:
        json.dump(all_results, f, indent=2)
        
    print(f"\n✅ All Benchmark Evaluations Complete! Summary saved to: {summary_file}")


if __name__ == "__main__":
    main()
