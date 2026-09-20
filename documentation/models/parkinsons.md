# Evaluating Parkinson's Models (NeuroSynapse Suite)

## 📌 Module Overview
The Parkinson's Disease Evaluation Module processes vocal acoustic features and telemonitoring phonation metrics (MDVP jitter, shimmer, NHR, HNR, RPDE, DFA, PPE) to classify Parkinsonian impairment and track disease progression.

---

## 📊 Comprehensive Benchmark Evaluation Summary

```
---> [Evaluating Parkinson's Models] <---
```

| Model | Type | Accuracy | AUC-ROC | Sensitivity | Specificity | Precision | F1 Score | MCC Score | ECE Error | Avg Latency | Status / Routing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **NeuroSynapse-VQC** | Quantum VQC | 73.33% | 0.4659 | **1.0000** | 0.0000 | 0.7333 | 0.8462 | 0.0000 | **0.0388** | 0.00 ms | Quantum Baseline |
| **Sentinel-RF** | Classical RF | 73.33% | 0.4318 | **1.0000** | 0.0000 | 0.7333 | 0.8462 | 0.0000 | 0.0918 | 0.00 ms | Classical RF |
| **Sentinel-LogReg** | Classical LogReg | 73.33% | **0.5114** | **1.0000** | 0.0000 | 0.7333 | 0.8462 | 0.0000 | 0.0959 | 0.00 ms | 🏆 Linear Control Lead |

---

## 🔬 Architecture Specifications

### 1. NeuroSynapse-VQC (Quantum Variational Classifier)
- **Qubit Register**: 8 qubits with amplitude and angle hybrid encoding.
- **Circuit**: 2 variational layers with parameter-shift optimization.
- **Observation**: Features low Expected Calibration Error (0.0388), but like classical models in this small held-out test split, suffers from dataset class imbalance leading to zero specificity.

### 2. Sentinel-RF (Random Forest Baseline)
- **Trees**: 100 trees, stratified bootstrap.

### 3. Sentinel-LogReg (Logistic Regression Control)
- **Regularization**: L2 penalty ($C = 1.0$), L-BFGS solver.
- **Performance**: Holds the highest AUC-ROC (0.5114) among evaluated baselines.
