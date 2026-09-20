# Q-RAKSHAK Machine Learning and Quantum Model Suite

This directory contains the clinical architectures, circuit formulations, mathematical proofs, empirical convergence curves, and audited benchmark evaluations for all disease modules in Q-RAKSHAK.

---

## 1. Clinical Evaluation Tracks

The platform implements 6 standardized disease evaluation tracks comparing quantum variational circuits and quantum kernels against classical sentinels:

```
documentation/models/
 breast_cancer.md          # WDBC: OncoPulse-VQC, OncoPulse-QSVM vs Sentinel-RF, Sentinel-SVM
 heart_disease.md          # Cardio: CardioWave-VQC vs Sentinel-XGB, Sentinel-MLP
 parkinsons.md             # UPDRS: NeuroSynapse-VQC vs Sentinel-RF, Sentinel-LogReg
 diabetes.md               # Pima: Diabetes-VQC vs Sentinel-RF, Sentinel-XGB
 pneumonia.md              # Chest X-Ray: QuantumPneu vs Sentinel-ResNet
 skin_cancer.md            # HAM10000: Q-Skin-Vortex vs Sentinel-DenseNet
 quantum_algorithms.md     # Circuit ansatzes, angle embeddings, Pauli-Z expectations
 safety_and_fallback.md    # Autonomous guardrails and fallback protocols
 benchmarks_and_metrics.md # Consolidated evaluation tables and performance audits
 screenshots/              # Audited empirical loss vs epochs and accuracy curves
     breast_cancer/image.png
     heart_disease/image.png
     parkinson/image.png
     diabetes/image.png
     pneumonia/image.png
     skin_cancer/image.png
```

---

## 2. Summary of Evaluated Disease Models

| Clinical Track | Evaluated Quantum Model(s) | Evaluated Classical Baseline(s) | Audited Champion Architecture | Active Routing Policy |
|---|---|---|---|---|
| **Breast Cancer (WDBC)** | `OncoPulse-VQC`, `OncoPulse-QSVM` | `Sentinel-RF`, `Sentinel-SVM` | **Sentinel-SVM** (96.51% Acc, 0.9948 AUC) | Production Champion: Sentinel-SVM; Quantum Shadow: OncoPulse-VQC |
| **Heart Disease (Cleveland)** | `CardioWave-VQC` | `Sentinel-XGB`, `Sentinel-MLP` | **Sentinel-MLP** (97.83% Acc, 1.0000 AUC) | Production Champion: Sentinel-MLP; Screening Triage: CardioWave-VQC |
| **Parkinson's (Acoustics)** | `NeuroSynapse-VQC` | `Sentinel-RF`, `Sentinel-LogReg` | Tied (73.33% Acc, LogReg leads AUC 0.5114) | Min-ECE Baseline: NeuroSynapse-VQC (0.0388); Linear Lead: Sentinel-LogReg |
| **Diabetes (Pima NIDDK)** | `Diabetes-VQC` | `Sentinel-RF`, `Sentinel-XGB` | **Sentinel-RF** (91.38% Acc, 0.9693 AUC) | Production Champion: Sentinel-RF; Specificity Lead: Sentinel-XGB |
| **Pneumonia (Pediatric X-Ray)**| `QuantumPneu` | `Sentinel-ResNet` | **QuantumPneu** (98.60% Acc, 0.9920 AUC) | Production Champion: QuantumPneu (100% Val Accuracy) |
| **Skin Cancer (HAM10000)** | `Q-Skin-Vortex` | `Sentinel-DenseNet` | **Q-Skin-Vortex** (88.00% Acc, 0.9450 AUC) | Production Champion: Q-Skin-Vortex (22.5 ms Latency) |

---

## 3. Scientific Integrity and Autonomous Guardrail Fallbacks

In clinical diagnostics, patient safety strictly supersedes algorithmic novelty. Where classical machine learning models demonstrate superior specificity, higher AUC-ROC, or reduced calibration error on tabular records, Q-RAKSHAK automatically designates the classical model as the active clinical predictor and maintains the quantum circuit as an exploratory shadow verification pipeline. Conversely, where hybrid visual-quantum heads establish superior generalization (e.g., in Pediatric Pneumonia and Dermatoscopic Screening), the quantum hybrid model is elevated to active clinical champion status.
