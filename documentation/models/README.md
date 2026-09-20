# Q-RAKSHAK Machine Learning & Quantum Model Suite

This directory contains the clinical architectures, circuit formulations, mathematical proofs, and empirical benchmark evaluations for all disease modules in Q-RAKSHAK.

---

## 🔬 Disease Evaluation Tracks

The platform implements 4 primary clinical disease evaluation modules comparing quantum circuits against rigorous classical sentinels:

```
documentation/models/
├── breast_cancer.md          # WDBC: OncoPulse-VQC, OncoPulse-QSVM vs Sentinel-RF, Sentinel-SVM
├── heart_disease.md          # Cardio: CardioWave-VQC vs Sentinel-XGB, Sentinel-MLP
├── parkinsons.md             # UPDRS: NeuroSynapse-VQC vs Sentinel-RF, Sentinel-LogReg
├── diabetes.md               # Pima: Diabetes-VQC vs Sentinel-RF, Sentinel-XGB
├── quantum_algorithms.md     # Circuit ansatzes, angle embeddings, Pauli-Z expectations
└── benchmarks_and_metrics.md # Consolidated evaluation tables and performance audits
```

---

## 📊 Summary of Evaluated Models

| Disease | Quantum Model(s) | Classical Baselines | Champion Architecture |
|---|---|---|---|
| **Breast Cancer** | `OncoPulse-VQC`, `OncoPulse-QSVM` | `Sentinel-RF`, `Sentinel-SVM` | **Sentinel-SVM** (96.51% Acc, 0.9948 AUC) |
| **Heart Disease** | `CardioWave-VQC` | `Sentinel-XGB`, `Sentinel-MLP` | **Sentinel-MLP** (97.83% Acc, 1.0000 AUC) |
| **Parkinson's** | `NeuroSynapse-VQC` | `Sentinel-RF`, `Sentinel-LogReg` | Tied (73.33% Acc, LogReg leads AUC 0.5114) |
| **Diabetes** | `Diabetes-VQC` | `Sentinel-RF`, `Sentinel-XGB` | **Sentinel-RF** (91.38% Acc, 0.9693 AUC) |

---

## ⚖️ Scientific Integrity & Guardrail Fallbacks
In clinical medicine, safety supersedes novelty. Where classical models outperform quantum models in specificity or AUC, Q-RAKSHAK automatically designates the classical model as the active clinical predictor and treats the quantum circuit as an exploratory shadow pipeline.
