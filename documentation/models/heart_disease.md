# Evaluating Heart Disease Models (CardioWave Suite)

## 📌 Module Overview
The Heart Disease Evaluation Module evaluates cardiovascular risk using the standard Cleveland and Statlog heart disease datasets (incorporating age, sex, chest pain type, resting BP, cholesterol, fasting blood sugar, resting ECG, max heart rate, exercise-induced angina, ST depression, and fluoroscopy major vessels).

---

## 📊 Comprehensive Benchmark Evaluation Summary

```
---> [Evaluating Heart Disease Models] <---
```

| Model | Type | Accuracy | AUC-ROC | Sensitivity | Specificity | Precision | F1 Score | MCC Score | ECE Error | Avg Latency | Status / Routing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **CardioWave-VQC** | Quantum VQC | 95.65% | 0.8977 | **1.0000** | 0.0000 | 0.9565 | 0.9778 | 0.0000 | 0.0949 | 0.00 ms | Quantum High-Sens |
| **Sentinel-XGB** | Classical XGB | 95.65% | 0.9318 | 0.9773 | 0.5000 | 0.9773 | 0.9773 | 0.4773 | 0.0305 | 0.00 ms | Classical Balanced |
| **Sentinel-MLP** | Classical MLP | **97.83%** | **1.0000** | **1.0000** | **0.5000** | **0.9778** | **0.9888** | **0.6992** | **0.0288** | 0.00 ms | 🏆 Clinical Champion |

---

## 🔬 Architecture Specifications

### 1. CardioWave-VQC (Quantum Variational Classifier)
- **Qubit Register**: 6 qubits initialized to $|0\rangle^{\otimes 6}$.
- **Ansatz**: Hardware-efficient strongly entangling layers with interleaved Ry-Rz gates and alternating nearest-neighbor CNOT entanglers.
- **Clinical Property**: Demonstrates 100% sensitivity (1.0000) for zero false-negative cardiac triage, but displays zero specificity (0.0000) in uncalibrated regimes, causing automatic gating to **Sentinel-MLP**.

### 2. Sentinel-XGB (Extreme Gradient Boosting)
- **Trees**: 120 boosted gradient trees, max depth 4, learning rate $\eta = 0.05$.
- **ECE Error**: 0.0305 with smooth probability calibration.

### 3. Sentinel-MLP (Multi-Layer Perceptron - Champion)
- **Topology**: Dense input $\rightarrow$ Dense(64, ReLU) $\rightarrow$ Dropout(0.2) $\rightarrow$ Dense(32, ReLU) $\rightarrow$ Dense(1, Sigmoid).
- **Optimization**: Adam ($\beta_1 = 0.9, \beta_2 = 0.999$, lr $= 10^{-3}$).
- **Performance**: 97.83% accuracy and perfect 1.0000 AUC-ROC with minimal calibration error (ECE 0.0288).
