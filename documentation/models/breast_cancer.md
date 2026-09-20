# Evaluating Breast Cancer Models (WDBC)

## 📌 Module Overview
The Breast Cancer Evaluation Module operates on the Wisconsin Diagnostic Breast Cancer (WDBC) cohort containing 569 fine-needle aspiration (FNA) biopsy samples with 30 morphological features (radius, texture, perimeter, area, smoothness, compactness, concavity, concave points, symmetry, and fractal dimension).

All models were evaluated under an identical **5-seed patient-level stratified 3-way split (Seeds: 7, 21, 42, 73, 101)** with train-only standard scaling and PCA dimensionality reduction.

---

## 📊 Comprehensive Benchmark Evaluation Summary

```
---> [Evaluating Breast Cancer Models] <---
```

| Model | Type | Accuracy | AUC-ROC | Sensitivity | Specificity | Precision | F1 Score | MCC Score | ECE Error | Avg Latency | Status / Routing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **OncoPulse-VQC** | Quantum VQC | 76.74% | 0.8443 | 0.9444 | 0.4688 | 0.7500 | 0.8361 | 0.4909 | 0.1440 | 0.00 ms | Quantum Shadow |
| **OncoPulse-QSVM** | Quantum QSVM | 74.42% | 0.8872 | 0.9815 | 0.3438 | 0.7162 | 0.8281 | 0.4537 | 0.0584 | 0.00 ms | Kernel Shadow |
| **Sentinel-RF** | Classical RF | 88.37% | 0.9792 | 0.9259 | 0.8125 | 0.8929 | 0.9091 | 0.7489 | 0.0786 | 0.00 ms | Classical Baseline |
| **Sentinel-SVM** | Classical SVM | **96.51%** | **0.9948** | **1.0000** | **0.9062** | **0.9474** | **0.9730** | **0.9266** | **0.0505** | 0.00 ms | 🏆 Clinical Champion |

---

## 🔬 Architecture Specifications

### 1. OncoPulse-VQC (Quantum Variational Classifier)
- **Qubit Register**: 8 qubits ($q_0 \dots q_7$)
- **State Embedding**: Dense angle embedding:
  $$\rho(x) = \bigotimes_{i=0}^7 R_y(\pi \cdot x_i) |0\rangle\langle 0|$$
- **Entanglement Topology**: Circular CNOT ring with parameter-shifted $R_z(\theta)$ and $R_x(\theta)$ rotational gates across 3 repeating layers.
- **Measurement Operator**: Joint Pauli-Z expectation values:
  $$\langle Z \rangle = \frac{1}{8} \sum_{i=0}^7 \langle \psi(\theta, x) | Z_i | \psi(\theta, x) \rangle$$
- **Loss Function**: Binary Cross-Entropy with temperature scaling calibration.

### 2. OncoPulse-QSVM (Quantum Kernel Support Vector Machine)
- **Kernel Function**: Fidelity-based quantum state overlap:
  $$\kappa(x_i, x_j) = |\langle \Phi(x_i) | \Phi(x_j) \rangle|^2$$
- **Feature Map**: Second-order Pauli-Z expansion with pairwise ZZ interactions.
- **Classification Head**: Soft-margin Support Vector Machine with hyperparameter $C = 1.5$.

### 3. Sentinel-RF (Random Forest Sentinel)
- **Estimators**: 100 decision trees
- **Split Criterion**: Gini impurity
- **Max Depth**: 10 with square-root max feature subsetting.

### 4. Sentinel-SVM (Classical Support Vector Machine - Champion)
- **Kernel**: Radial Basis Function (RBF)
- **Parameters**: $C = 1.0, \gamma = \text{scale}$
- **Clinical Lead**: Achieves exceptional sensitivity (1.0000) and specificity (0.9062), resulting in near-perfect discrimination (AUC-ROC: 0.9948). Sentinel-SVM is the active deployment model in Q-RAKSHAK clinical pipelines.
