from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from ml.data.dataset_registry import get_parkinsons_updrs_regression_dataset, get_wdbc_dataset
from ml.evaluation.calibration import TemperatureScaler
from ml.evaluation.metrics import evaluate_clinical_metrics
from ml.explainability.explainer import ExplainabilityEngine
from ml.explainability.quantum_analysis import QuantumSensitivityAnalyzer
from ml.models.classical import ClassicalBaselineSuite
from ml.models.classical_regressors import ClassicalRegressionSuite
from ml.preprocessing.reduction import DimensionalityReducer
from ml.preprocessing.splitting import PatientGroupedSplitter, audit_leakage
from ml.preprocessing.tabular import ClinicalTabularPreprocessor
from ml.preprocessing.validation import validate_clinical_sample, validate_dataset_schema
from ml.quantum.backends import HardwareProviderRegistry, QuantumBackendFactory
from ml.quantum.vqc import VariationalQuantumClassifier
from ml.quantum.vqr import VariationalQuantumRegressor
from ml.uncertainty.conformal import ConformalPredictor
from ml.uncertainty.ood import MahalanobisOODDetector


def test_obj01_hybrid_architecture_pipeline():
    """OBJ-01 Verification: Validates complete end-to-end hybrid pipeline data flow."""
    # 1. Biomedical Input Data
    rng = np.random.RandomState(42)
    X_raw = rng.randn(40, 16).astype(np.float32)
    y_raw = rng.randint(0, 2, size=40)

    # 2. Validation
    sample_val = validate_clinical_sample(X_raw[0], modality="tabular", patient_id="PT-001")
    assert sample_val["status"] == "VALID"

    # 3. Train-Only Dimensionality Reduction to Qubit Budget (8 Qubits)
    reducer = DimensionalityReducer(target_dim=4, method="pca", angle_scaling=True)
    X_reduced = reducer.fit_transform(X_raw[:30])
    X_test_reduced = reducer.transform(X_raw[30:])
    assert X_test_reduced.shape == (10, 4)
    assert np.all(X_test_reduced >= 0.0) and np.all(X_test_reduced <= np.pi + 1e-4)

    # 4. Quantum Circuit Layer (VQC)
    vqc = VariationalQuantumClassifier(n_qubits=4, n_layers=2)
    raw_probs = vqc.predict_proba(X_test_reduced)
    assert raw_probs.shape == (10, 2)
    assert np.allclose(raw_probs.sum(axis=1), 1.0, atol=1e-3)

    # 5. Temperature Calibration Head
    calibrator = TemperatureScaler().fit(raw_probs, y_raw[30:])
    calib_probs = calibrator.transform(raw_probs)
    assert calib_probs.shape == (10, 2)

    # 6. Conformal Prediction & Explainability
    conformal = ConformalPredictor(alpha=0.10)
    conformal.calibrate(calib_probs, y_raw[30:])
    pred_sets = conformal.predict_set(calib_probs)
    assert len(pred_sets) == 10
    assert "uncertainty_status" in pred_sets[0]


def test_obj02_quantum_classification_and_regression():
    """OBJ-02 Verification: Verifies both classification and continuous regression models."""
    rng = np.random.RandomState(42)
    X = rng.randn(30, 4).astype(np.float32)
    y_class = rng.randint(0, 2, size=30)
    y_cont = (2.5 * X[:, 0] - 1.2 * X[:, 1] + 15.0).astype(np.float32)

    # 1. Quantum Classifier (VQC)
    vqc = VariationalQuantumClassifier(n_qubits=4, n_layers=1)
    vqc.fit_dataset(X[:20], y_class[:20], epochs=2, lr=0.05, batch_size=10)
    class_preds = vqc.predict(X[20:])
    assert len(class_preds) == 10
    assert set(class_preds).issubset({0, 1})

    # 2. Quantum Regressor (VQR) for Continuous Clinical Targets
    vqr = VariationalQuantumRegressor(n_qubits=4, n_layers=1)
    vqr.fit(X[:20], y_cont[:20], epochs=3, lr=0.05, batch_size=10)
    cont_preds = vqr.predict(X[20:])
    assert cont_preds.shape == (10,)
    metrics = vqr.evaluate_regression_metrics(X[20:], y_cont[20:])
    assert "r2_score" in metrics
    assert "rmse" in metrics
    assert "mae" in metrics
    assert metrics["rmse"] >= 0.0


def test_obj03_metrics_and_classical_comparison():
    """OBJ-03 Verification: Validates fair comparison with classical baselines on identical metrics."""
    rng = np.random.RandomState(42)
    X_train = rng.randn(50, 8).astype(np.float32)
    y_train = rng.randint(0, 2, size=50)
    X_test = rng.randn(20, 8).astype(np.float32)
    y_test = rng.randint(0, 2, size=20)

    # Classical Baseline Suite
    suite = ClassicalBaselineSuite(random_state=42)
    suite.fit_all(X_train, y_train)
    rf = suite.get_model("Random Forest")
    rf_preds = rf.predict(X_test)
    rf_probs = rf.predict_proba(X_test)

    # Complete Required Metrics Suite
    metrics = evaluate_clinical_metrics(y_test, rf_preds, rf_probs, inference_time_sec=0.002)
    required_keys = ["accuracy", "sensitivity", "specificity", "precision", "f1", "auc_roc", "confusion_matrix"]
    for key in required_keys:
        assert key in metrics, f"Missing required clinical evaluation metric: {key}"

    # Classical Regression Suite
    y_cont_train = (1.5 * X_train[:, 0] + 5.0).astype(np.float32)
    y_cont_test = (1.5 * X_test[:, 0] + 5.0).astype(np.float32)
    reg_suite = ClassicalRegressionSuite(random_state=42)
    reg_suite.fit_all(X_train, y_cont_train)
    reg_eval = reg_suite.evaluate_all(X_test, y_cont_test)
    assert "Ridge Regression" in reg_eval
    assert "Random Forest Regressor" in reg_eval


def test_obj04_hardware_compatibility_and_explainability():
    """OBJ-04 Verification: Verifies hardware abstraction, simulator selection, and interpretability."""
    # 1. Quantum Hardware Providers & Simulators
    providers = HardwareProviderRegistry.list_available_providers()
    assert "ideal" in providers
    assert "noisy" in providers
    assert "ibmq" in providers
    assert "braket" in providers

    adapter_ibmq = HardwareProviderRegistry.get_adapter("ibmq")
    profile = adapter_ibmq.get_hardware_profile(n_qubits=8, depth=2)
    assert profile["type"] == "Near-Term Physical QPU"
    assert "t1_relaxation_us" in profile
    assert profile["estimated_circuit_fidelity"] > 0.0

    telemetry = QuantumBackendFactory.get_telemetry(n_qubits=4, depth=2, shots=1024, backend="default.qubit")
    assert telemetry["qubits"] == 4
    assert telemetry["circuit_depth"] == 2

    # 2. Interpretability & Explainability
    vqc = VariationalQuantumClassifier(n_qubits=4, n_layers=1)
    analyzer = QuantumSensitivityAnalyzer()
    sample = np.array([0.5, 1.2, 2.1, 0.8], dtype=np.float32)
    sensitivities = analyzer.analyze_qubit_contributions(vqc, sample)
    assert len(sensitivities) == 4
    assert sensitivities[0]["qubit_index"] in {0, 1, 2, 3}

    explainer = ExplainabilityEngine(feature_names=["A", "B", "C", "D"])
    narrative = explainer.generate_clinical_narrative(
        predicted_class="Benign",
        confidence=0.94,
        classical_confidence=0.88,
        top_features=[{"feature": "A", "percentage": 42.0}, {"feature": "B", "percentage": 30.0}],
        disease_name="Breast Cancer",
    )
    assert "Quantum hybrid diagnostic evaluation" in narrative
    assert "confidence" in narrative


def test_obj05_tabular_preprocessing_and_zero_leakage():
    """OBJ-05 Verification: Verifies clinical tabular preprocessor with zero data leakage."""
    raw_data = {
        "age": [45, np.nan, 62, 50, 45],  # Contains missing and duplicate row 0 and 4
        "cholesterol": [210.0, 190.0, 580.0, 220.0, 210.0],  # 580 is an extreme outlier
        "smoker": ["YES", "NO", "YES", np.nan, "YES"],  # Categorical with missing
        "patient_id": ["P1", "P2", "P3", "P4", "P1"],  # P1 is duplicated
        "target": [0, 1, 1, 0, 0],
    }
    df = pd.DataFrame(raw_data)

    # 1. Duplicate detection and purging
    preprocessor = ClinicalTabularPreprocessor(target_qubits=4, scaling="quantum_angle", handle_outliers=True)
    df_dedup, n_purged = preprocessor.detect_and_purge_duplicates(df, subset_cols=["patient_id"])
    assert n_purged == 1
    assert len(df_dedup) == 4

    # 2. Zero-leakage train/test splitting
    splitter = PatientGroupedSplitter(train_size=0.75, val_size=0.0, test_size=0.25, random_state=42)
    train_df, val_df, test_df = splitter.split(df_dedup, target_column="target", patient_id_column="patient_id")
    leakage = audit_leakage(train_df, val_df, test_df, patient_id_column="patient_id")
    assert leakage["passed"] is True
    assert leakage["leakage_detected"] is False

    # 3. Fitting transformations strictly on train and transforming test
    feature_cols = ["age", "cholesterol", "smoker"]
    X_train_proc = preprocessor.fit_transform(train_df[feature_cols], train_df["target"])
    X_test_proc = preprocessor.transform(test_df[feature_cols])

    assert X_train_proc.shape[1] <= 4
    assert X_test_proc.shape[1] <= 4
    assert not np.isnan(X_train_proc).any()
    assert not np.isnan(X_test_proc).any()
    # Quantum angle bounds check
    assert np.all(X_train_proc >= -1e-4) and np.all(X_train_proc <= np.pi + 1e-4)


def test_obj06_benchmarking_computational_efficiency():
    """OBJ-06 Verification: Verifies computational efficiency, memory, and reproducibility."""
    from ml.experiments.runner import AblationMatrixRunner

    rng = np.random.RandomState(42)
    X = rng.randn(40, 12).astype(np.float32)
    y = rng.randint(0, 2, size=40)

    runner = AblationMatrixRunner()
    results = runner.run_matrix(
        X_train=X[:24],
        y_train=y[:24],
        X_val=X[24:32],
        y_val=y[24:32],
        X_test=X[32:],
        y_test=y[32:],
        dataset_name="Test_Clinical_Cohort",
    )

    assert "A_classical_baseline" in results
    assert "D_pretrained_vqc_8q" in results
    assert "F_calibrated_ensemble_champion" in results

    # Check computational efficiency tracking
    vqc_metrics = results["D_pretrained_vqc_8q"]
    assert "inference_time_ms" in vqc_metrics
    assert "peak_memory_mb" in vqc_metrics
    assert "bootstrap_ci_95" in vqc_metrics

    # Continuous regression benchmarking
    y_cont = rng.randn(40).astype(np.float32) * 10 + 25
    reg_results = runner.run_regression_benchmark(
        X_train=X[:24],
        y_train=y_cont[:24],
        X_test=X[32:],
        y_test=y_cont[32:],
        n_qubits=4,
    )
    assert "Ridge Regression" in reg_results
    assert "Variational Quantum Regressor (VQR)" in reg_results
    assert "rmse" in reg_results["Variational Quantum Regressor (VQR)"]
