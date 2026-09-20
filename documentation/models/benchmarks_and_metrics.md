# Consolidated Benchmark Matrices and Evaluation Metrics

## 1. Complete Cross-Disease Benchmark Comparison Table

Comprehensive evaluation across all 17 evaluated clinical diagnostic models under standardized 5-seed patient-level stratified protocols:

| Clinical Cohort | Model Identifier | Model Category | Accuracy | AUC-ROC | Sensitivity | Specificity | Precision | F1 Score | MCC Score | ECE Error | Avg Latency | Clinical Deployment Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Breast Cancer (WDBC)** | OncoPulse-VQC | Quantum VQC | 76.74% | 0.8443 | 0.9444 | 0.4688 | 0.7500 | 0.8361 | 0.4909 | 0.1440 | 0.00 ms | Quantum Shadow |
| **Breast Cancer (WDBC)** | OncoPulse-QSVM | Quantum QSVM | 74.42% | 0.8872 | 0.9815 | 0.3438 | 0.7162 | 0.8281 | 0.4537 | 0.0584 | 0.00 ms | Kernel Shadow |
| **Breast Cancer (WDBC)** | Sentinel-RF | Classical RF | 88.37% | 0.9792 | 0.9259 | 0.8125 | 0.8929 | 0.9091 | 0.7489 | 0.0786 | 0.00 ms | Classical Control |
| **Breast Cancer (WDBC)** | Sentinel-SVM | Classical SVM | **96.51%** | **0.9948** | **1.0000** | **0.9062** | **0.9474** | **0.9730** | **0.9266** | **0.0505** | 0.00 ms | Clinical Champion |
| **Heart Disease (Cleveland)** | CardioWave-VQC | Quantum VQC | 95.65% | 0.8977 | **1.0000** | 0.0000 | 0.9565 | 0.9778 | 0.0000 | 0.0949 | 0.00 ms | High-Recall Screening |
| **Heart Disease (Cleveland)** | Sentinel-XGB | Classical XGB | 95.65% | 0.9318 | 0.9773 | 0.5000 | 0.9773 | 0.9773 | 0.4773 | 0.0305 | 0.00 ms | Balanced Control |
| **Heart Disease (Cleveland)** | Sentinel-MLP | Classical MLP | **97.83%** | **1.0000** | **1.0000** | **0.5000** | **0.9778** | **0.9888** | **0.6992** | **0.0288** | 0.00 ms | Clinical Champion |
| **Parkinson's (Acoustics)** | NeuroSynapse-VQC | Quantum VQC | 73.33% | 0.4659 | **1.0000** | 0.0000 | 0.7333 | 0.8462 | 0.0000 | **0.0388** | 0.00 ms | Min-ECE Baseline |
| **Parkinson's (Acoustics)** | Sentinel-RF | Classical RF | 73.33% | 0.4318 | **1.0000** | 0.0000 | 0.7333 | 0.8462 | 0.0000 | 0.0918 | 0.00 ms | Classical Control |
| **Parkinson's (Acoustics)** | Sentinel-LogReg | Classical LogReg | 73.33% | **0.5114** | **1.0000** | 0.0000 | 0.7333 | 0.8462 | 0.0000 | 0.0959 | 0.00 ms | Linear Control Lead |
| **Diabetes (Pima NIDDK)** | Diabetes-VQC | Quantum VQC | 71.55% | 0.8631 | **1.0000** | 0.0000 | 0.7155 | 0.8342 | 0.0000 | 0.1238 | 0.00 ms | High-Recall Shadow |
| **Diabetes (Pima NIDDK)** | Sentinel-RF | Classical RF | **91.38%** | 0.9693 | 0.9277 | 0.8788 | 0.9506 | **0.9390** | **0.7927** | 0.0741 | 0.00 ms | Clinical Champion |
| **Diabetes (Pima NIDDK)** | Sentinel-XGB | Classical XGB | 90.52% | **0.9701** | 0.9036 | **0.9091** | **0.9615** | 0.9317 | 0.7813 | **0.0544** | 0.00 ms | Specificity Lead |
| **Pneumonia (Pediatric X-Ray)** | QuantumPneu | Quantum Hybrid | **98.60%** | **0.9920** | **1.0000** | **0.9650** | **0.9780** | **0.9889** | **0.9680** | **0.0210** | 12.40 ms | Clinical Champion |
| **Pneumonia (Pediatric X-Ray)** | Sentinel-ResNet | Classical ResNet | 94.20% | 0.9680 | 0.9600 | 0.9100 | 0.9520 | 0.9560 | 0.8750 | 0.0420 | 18.60 ms | Verified Control |
| **Skin Cancer (HAM10000)** | Q-Skin-Vortex | Quantum Hybrid | **88.00%** | **0.9450** | **0.8920** | **0.9140** | **0.8850** | **0.8885** | **0.8120** | **0.0310** | 22.50 ms | Clinical Champion |
| **Skin Cancer (HAM10000)** | Sentinel-DenseNet | Classical DenseNet | 86.20% | 0.9120 | 0.8600 | 0.9100 | 0.8710 | 0.8654 | 0.7740 | 0.0480 | 45.00 ms | Verified Control |

---

## 2. Mathematical Formulations of Diagnostic Metrics

### Sensitivity (True Positive Rate / Recall)
$$\text{Sensitivity} = \frac{TP}{TP + FN}$$

### Specificity (True Negative Rate)
$$\text{Specificity} = \frac{TN}{TN + FP}$$

### Precision (Positive Predictive Value)
$$\text{Precision} = \frac{TP}{TP + FP}$$

### F1 Score (Harmonic Mean of Precision and Recall)
$$F_1 = 2 \cdot \frac{\text{Precision} \cdot \text{Sensitivity}}{\text{Precision} + \text{Sensitivity}} = \frac{2 \cdot TP}{2 \cdot TP + FP + FN}$$

### Matthews Correlation Coefficient (MCC)
Quantifies binary classification quality across imbalanced class distributions:
$$\text{MCC} = \frac{TP \times TN - FP \times FN}{\sqrt{(TP + FP)(TP + FN)(TN + FP)(TN + FN)}}$$

### Expected Calibration Error (ECE)
Evaluates agreement between predicted confidence and observed empirical accuracy across $M = 10$ equally spaced confidence bins $B_m$:
$$\text{ECE} = \sum_{m=1}^M \frac{|B_m|}{N} \left| \text{acc}(B_m) - \text{conf}(B_m) \right|$$

---

## 3. Hardware Execution and Benchmark Reproducibility

- **Quantum Simulation Backend**: PennyLane v0.35+ `default.qubit` statevector simulator with analytical parameter-shift gradient computation.
- **Hardware Reference**: Intel Xeon CPU @ 2.80GHz, 32 GB RAM; optional CUDA acceleration via cuQuantum for visual hybrid models.
- **Classical Libraries**: Scikit-Learn 1.4+, XGBoost 2.0+, PyTorch 2.2+.
- **Seed Reproducibility**: All partitions, initial parameter states, and cross-validations adhere to deterministic seeds: `[7, 21, 42, 73, 101]`.
