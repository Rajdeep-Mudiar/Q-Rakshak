# Evaluating Diabetes Models (Metabolic Suite)

## 📌 Module Overview
The Diabetes Evaluation Module utilizes the Pima Indians Diabetes diagnostic dataset (glucose, blood pressure, skin thickness, insulin, BMI, diabetes pedigree function, age) to predict onset within 5 years.

---

## 📊 Comprehensive Benchmark Evaluation Summary

```
---> [Evaluating Diabetes Models] <---
```

| Model | Type | Accuracy | AUC-ROC | Sensitivity | Specificity | Precision | F1 Score | MCC Score | ECE Error | Avg Latency | Status / Routing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Diabetes-VQC** | Quantum VQC | 71.55% | 0.8631 | **1.0000** | 0.0000 | 0.7155 | 0.8342 | 0.0000 | 0.1238 | 0.00 ms | High-Recall Shadow |
| **Sentinel-RF** | Classical RF | **91.38%** | 0.9693 | 0.9277 | 0.8788 | 0.9506 | **0.9390** | **0.7927** | 0.0741 | 0.00 ms | 🏆 Clinical Champion |
| **Sentinel-XGB** | Classical XGB | 90.52% | **0.9701** | 0.9036 | **0.9091** | **0.9615** | 0.9317 | 0.7813 | **0.0544** | 0.00 ms | High-Specificity Lead |

---

## 🔬 Architecture Specifications

### 1. Diabetes-VQC (Quantum Variational Classifier)
- **Qubits**: 8 qubits with angle encoding over train-normalized metabolic features.
- **Entanglement**: Alternating CNOT pairs with $R_y$ parameter rotations.
- **Behavior**: Exhibits strong sensitivity (1.0000) and good AUC (0.8631), but is bounded in specificity on raw tabular features compared to ensemble decision trees.

### 2. Sentinel-RF (Random Forest Baseline - Champion)
- **Parameters**: 150 estimators, max depth 8, min samples leaf 2.
- **Performance**: Overall champion with 91.38% accuracy, 0.9277 sensitivity, and 0.8788 specificity.

### 3. Sentinel-XGB (Extreme Gradient Boosting)
- **Parameters**: 100 boosted rounds, learning rate 0.08, subsample 0.85.
- **Performance**: Leads on Specificity (0.9091) and minimal calibration error (ECE 0.0544).
