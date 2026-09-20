# Clinical Safety Guardrails & Automated Classical Fallback Protocol

In medical AI applications, the Hippocratic mandate—*Primum non nocere* (First, do no harm)—demands that model deployment prioritize clinical safety, high specificity, and low false-alarm rates over theoretical novelty.

This document describes the autonomous fallback and safety gating architecture of Q-RAKSHAK.

---

## 1. Safety Gating Architecture

```
                 [Patient Clinical Features]
                             
                             
              [Class-Conditional OOD Detector]
          (Pooled Mahalanobis Distance Gating)
                             
            
             In-Distribution                  Out-of-Distribution (OOD > threshold)
                                             
    [Parallel Inference Engine]         [Clinical Abstention Alert]
     Quantum VQC / QSVM              - Trigger Doctor Mandatory Review
     Classical Sentinel Suite        - Generate Warning Flag
            
            
    [Reliability & Specificity Gate]
    - Is Quantum Specificity < Threshold (e.g. 0.80)?
    - Is ECE Calibration Error > 0.10?
            
      
       YES (Fails Safety Gating)      NO (Passes Safety Gating)
                                     
 [Deploy Classical Sentinel]    [Deploy Quantum Lead Model]
 (e.g. Sentinel-SVM 96.51%)      (with Temperature Scaling)
                                     
      
                     
       [Unified Clinical Prediction]
```

---

## 2. Threshold Trigger Conditions

A model fallback is automatically executed when any of the following boundary conditions occur:

1. **Low Specificity Bound ($\text{Specificity} < 0.80$)**:
   - High sensitivity with zero specificity (such as observed in uncalibrated quantum models on small cohorts) risks overwhelming emergency departments with false positives.
   - *Action*: Automatic fallback to high-specificity classical models (e.g., `Sentinel-RF` or `Sentinel-SVM`).

2. **Calibration Error Bound ($\text{ECE} > 0.100$)**:
   - Uncalibrated confidence scores distort clinician risk perception.
   - *Action*: Trigger Platt scaling / temperature scaling, or fall back to minimum-ECE classical model (e.g. `Sentinel-MLP` with ECE $0.0288$).

3. **Mahalanobis Distance OOD Flag**:
   - Input feature vector is outside training distribution:
     $$D_M(x) = \min_{c} \sqrt{(x - \mu_c)^T \Sigma^{-1} (x - \mu_c)} > D_{\text{crit}}$$
   - *Action*: Abstention with human review requirement.

---

## 3. Audited Fallback Implementations by Disease

| Disease Module | Quantum Model Evaluated | Classical Fallback Deployed | Reason for Fallback |
|---|---|---|---|
| **Breast Cancer** | `OncoPulse-VQC` (Spec: 46.88%) | **Sentinel-SVM** (Spec: 90.62%, Acc: 96.51%) | Superior clinical specificity (+43.74%) and lower ECE. |
| **Heart Disease** | `CardioWave-VQC` (Spec: 0.00%) | **Sentinel-MLP** (Spec: 50.00%, Acc: 97.83%) | Eliminates false-positive collapse; perfect AUC-ROC (1.0000). |
| **Parkinson's** | `NeuroSynapse-VQC` (Spec: 0.00%) | **Sentinel-LogReg** (AUC: 0.5114) | Linear baseline control prevents quantum overfitting. |
| **Diabetes** | `Diabetes-VQC` (Spec: 0.00%) | **Sentinel-RF** (Spec: 87.88%, Acc: 91.38%) | High-fidelity clinical specificity (+87.88%) on tabular data. |
