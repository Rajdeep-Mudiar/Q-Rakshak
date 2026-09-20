# Consolidated Benchmark Matrices & Evaluation Metrics

## 1. Complete Cross-Disease Benchmark Comparison Table

All 13 evaluated models under standardized evaluation protocols:

| Cohort | Model Name | Model Category | Accuracy | AUC-ROC | Sensitivity | Specificity | Precision | F1 Score | MCC Score | ECE Error | Avg Latency |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Breast Cancer** | OncoPulse-VQC | Quantum VQC | 76.74% | 0.8443 | 0.9444 | 0.4688 | 0.7500 | 0.8361 | 0.4909 | 0.1440 | 0.00 ms |
| **Breast Cancer** | OncoPulse-QSVM | Quantum QSVM | 74.42% | 0.8872 | 0.9815 | 0.3438 | 0.7162 | 0.8281 | 0.4537 | 0.0584 | 0.00 ms |
| **Breast Cancer** | Sentinel-RF | Classical RF | 88.37% | 0.9792 | 0.9259 | 0.8125 | 0.8929 | 0.9091 | 0.7489 | 0.0786 | 0.00 ms |
| **Breast Cancer** | Sentinel-SVM | Classical SVM | **96.51%** | **0.9948** | **1.0000** | **0.9062** | **0.9474** | **0.9730** | **0.9266** | **0.0505** | 0.00 ms |
| **Heart Disease** | CardioWave-VQC | Quantum VQC | 95.65% | 0.8977 | **1.0000** | 0.0000 | 0.9565 | 0.9778 | 0.0000 | 0.0949 | 0.00 ms |
| **Heart Disease** | Sentinel-XGB | Classical XGB | 95.65% | 0.9318 | 0.9773 | 0.5000 | 0.9773 | 0.9773 | 0.4773 | 0.0305 | 0.00 ms |
| **Heart Disease** | Sentinel-MLP | Classical MLP | **97.83%** | **1.0000** | **1.0000** | **0.5000** | **0.9778** | **0.9888** | **0.6992** | **0.0288** | 0.00 ms |
| **Parkinson's** | NeuroSynapse-VQC | Quantum VQC | 73.33% | 0.4659 | **1.0000** | 0.0000 | 0.7333 | 0.8462 | 0.0000 | **0.0388** | 0.00 ms |
| **Parkinson's** | Sentinel-RF | Classical RF | 73.33% | 0.4318 | **1.0000** | 0.0000 | 0.7333 | 0.8462 | 0.0000 | 0.0918 | 0.00 ms |
| **Parkinson's** | Sentinel-LogReg | Classical LogReg | 73.33% | **0.5114** | **1.0000** | 0.0000 | 0.7333 | 0.8462 | 0.0000 | 0.0959 | 0.00 ms |
| **Diabetes** | Diabetes-VQC | Quantum VQC | 71.55% | 0.8631 | **1.0000** | 0.0000 | 0.7155 | 0.8342 | 0.0000 | 0.1238 | 0.00 ms |
| **Diabetes** | Sentinel-RF | Classical RF | **91.38%** | 0.9693 | 0.9277 | 0.8788 | 0.9506 | **0.9390** | **0.7927** | 0.0741 | 0.00 ms |
| **Diabetes** | Sentinel-XGB | Classical XGB | 90.52% | **0.9701** | 0.9036 | **0.9091** | **0.9615** | 0.9317 | 0.7813 | **0.0544** | 0.00 ms |

---

## 2. Mathematical Definition of Clinical Metrics

- **Sensitivity (Recall)**: $\frac{TP}{TP + FN}$
- **Specificity**: $\frac{TN}{TN + FP}$
- **Matthews Correlation Coefficient (MCC)**:
  $$\text{MCC} = \frac{TP \times TN - FP \times FN}{\sqrt{(TP+FP)(TP+FN)(TN+FP)(TN+FN)}}$$
- **Expected Calibration Error (ECE)**:
  $$\text{ECE} = \sum_{m=1}^M \frac{|B_m|}{N} |\text{acc}(B_m) - \text{conf}(B_m)|$$
