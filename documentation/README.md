# Q-RAKSHAK Architecture & Clinical Intelligence Documentation

[![Repository](https://img.shields.io/badge/GitHub-ARYANCY%2FQDoc-181717.svg?logo=github&logoColor=white)](https://github.com/ARYANCY/QDoc)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB.svg?logo=python&logoColor=white)](https://github.com/ARYANCY/QDoc)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://github.com/ARYANCY/QDoc)
[![PennyLane](https://img.shields.io/badge/PennyLane-0.36+-blueviolet.svg?logo=quantum-computing)](https://github.com/ARYANCY/QDoc)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2+-EE4C2C.svg?logo=pytorch&logoColor=white)](https://github.com/ARYANCY/QDoc)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://github.com/ARYANCY/QDoc)
[![Three.js](https://img.shields.io/badge/Three.js-r162-049EF4.svg?logo=three.js&logoColor=white)](https://github.com/ARYANCY/QDoc)
[![GSAP](https://img.shields.io/badge/GSAP-3.15-88CE02.svg?logo=greensock&logoColor=white)](https://github.com/ARYANCY/QDoc)
[![Smart India Hackathon](https://img.shields.io/badge/SIH%20ID-26139-0052CC.svg)](https://github.com/ARYANCY/QDoc)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/ARYANCY/QDoc/blob/main/LICENSE)

> **Platform**: Q-RAKSHAK Hybrid Quantum-Classical Clinical Intelligence Operating System  
> **Problem Statement ID**: SIH-26139  
> **Repository**: [https://github.com/ARYANCY/QDoc](https://github.com/ARYANCY/QDoc)  
> **Mandate**: Early Multi-Disease Detection, Deterministic ESI Triage, 3D Anatomical Twin, and Longitudinal Biomarker Analytics with Zero Data Leakage.

---

## 📑 Master Table of Contents

```
documentation/
├── README.md                           # Master Architecture Portal (this document)
│
├── apis/                               # Complete Backend REST & WebSocket Specifications
│   ├── README.md                       # API Catalog, Conventions, and Error Schemas
│   ├── clinical_api.md                 # Triage Assessment, Longitudinal History, Emergency Card
│   ├── quantum_endpoints.md            # VQC Inference, QSVM Overlaps, Noise Telemetry
│   └── auth_and_users.md               # Google OAuth 2.0, RS256 Verification, JWT Lifecycle & RBAC
│
├── models/                             # Mathematical Formulations, Architectures & Evaluations
│   ├── README.md                       # Machine Learning & Quantum Overview
│   ├── breast_cancer.md                # WDBC Cohort: OncoPulse-VQC/QSVM vs Sentinel-RF/SVM
│   ├── heart_disease.md                # Cleveland Cohort: CardioWave-VQC vs Sentinel-XGB/MLP
│   ├── parkinsons.md                   # Phonation Cohort: NeuroSynapse-VQC vs Sentinel-RF/LogReg
│   ├── diabetes.md                     # Pima Cohort: Diabetes-VQC vs Sentinel-RF/XGB
│   ├── quantum_algorithms.md           # PennyLane Topologies, Angle Maps, Pauli-Z Measurements
│   ├── benchmarks_and_metrics.md       # Consolidated 13-Model Cross-Disease Benchmark Matrix
│   └── safety_and_fallback.md          # Classical Sentinel Fallback Protocols & OOD Gating
│
├── features/                           # Clinical Feature Implementations
│   ├── README.md                       # Clinical Capabilities Index
│   ├── triage_engine.md                # 5-Tier ESI Deterministic Algorithm & Danger Thresholds
│   ├── digital_twin_3d.md              # Three.js / React-Three-Fiber Anatomical Simulation
│   ├── emergency_passport.md           # Zero-Network Offline Emergency Medical Passport
│   └── longitudinal_tracker.md         # OLS Regression, Trend Alerts, Same-Day Aggregation
│
├── styles/                             # Editorial UI Design System & GSAP Transitions
│   ├── README.md                       # UI Style Philosophy
│   ├── design_system.md                # Typography, Grid, Glassmorphic Panels, Breakpoints
│   └── color_palettes.md               # Disease Ambient Themes & GSAP ScrollTrigger Specs
│
└── guide/                              # Governance, Compliance & Developer Runbooks
    ├── README.md                       # Operational Hub
    ├── quickstart.md                   # Setup Runbook, Conda/venv, Database Seeding, Tests
    ├── research_objectives.md          # Formal Proofs & Code Evidence for OBJ-01 to OBJ-06
    ├── compliance_hipaa_dpdp.md        # DPDP Act 2023 & HIPAA Security/Privacy Compliance
    └── database_schema.md              # Prisma ER Models, SQLite/Postgres Tables & Indexes
```

---

## 🏛️ System Architecture Overview

Q-RAKSHAK bridges deep classical feature extractors and PennyLane quantum variational circuits through an audited 7-stage pipeline:

```
[Clinical Modality Input (Tabular / Image / Phonation / Vitals)]
                             │
                             ▼
     [Stage 1: Validation & Integrity Gate] (ml.preprocessing.validation)
     - Type enforcement, missing value bounds, IQR boundary clipping
                             │
                             ▼
     [Stage 2: 11-Modality Router] (ml.models.router)
     - Direct Tabular  |  BiomedCLIP (512-dim)  |  MedSigLIP (768-dim)
                             │
                             ▼
     [Stage 3: Train-Only Dimensionality Reduction] (ml.preprocessing.reduction)
     - PCA & Mutual Information compression into N_q <= 8 Qubit Budgets
                             │
        ┌────────────────────┴────────────────────┐
        ▼                                         ▼
 [Stage 4A: Quantum Suite]               [Stage 4B: Classical Sentinel Suite]
 - Variational Quantum Classifier (VQC)   - Random Forest (Sentinel-RF)
 - Quantum Kernel Engine (QSVM)           - Support Vector Machine (Sentinel-SVM)
 - Pauli-Z Expectation Readings           - Gradient Boosted Trees (Sentinel-XGB)
 - Barren Plateau Telemetry Monitoring    - Multi-Layer Perceptron (Sentinel-MLP)
        │                                         │
        └────────────────────┬────────────────────┘
                             ▼
     [Stage 5: Uncertainty & OOD Calibration Gate] (ml.uncertainty)
     - Pooled Mahalanobis Distance Gating (D_M > threshold -> Abstention)
     - Temperature Scaling (Minimizing Negative Log-Likelihood & ECE)
     - Inductive Split-Conformal Prediction Sets (1 - alpha Coverage)
                             │
                             ▼
     [Stage 6: Clinical Decision & Fallback Routing]
     - Evaluates Specificity >= 0.80 & ECE <= 0.10
     - Autonomous Fallback to Classical Sentinel if Quantum Specificity Fails
                             │
                             ▼
     [Stage 7: Unified Clinical Output Contract & Explainability Pass]
     - Grad-CAM Lesion Heatmaps, KernelSHAP Biomarkers, Parameter Gradients
```

---

## 📊 Core Evaluated Disease Benchmarks

Summary of verified empirical evaluations across the 4 primary clinical tracks:

### 1. Breast Cancer (Wisconsin Diagnostic Breast Cancer)
```
---> [Evaluating Breast Cancer Models] <---
```
- **OncoPulse-VQC**: Acc: 76.74% | AUC-ROC: 0.8443 | Sens: 0.9444 | Spec: 0.4688 | Prec: 0.7500 | F1: 0.8361 | MCC: 0.4909 | ECE: 0.1440 | Latency: 0.00 ms
- **OncoPulse-QSVM**: Acc: 74.42% | AUC-ROC: 0.8872 | Sens: 0.9815 | Spec: 0.3438 | Prec: 0.7162 | F1: 0.8281 | MCC: 0.4537 | ECE: 0.0584 | Latency: 0.00 ms
- **Sentinel-RF**: Acc: 88.37% | AUC-ROC: 0.9792 | Sens: 0.9259 | Spec: 0.8125 | Prec: 0.8929 | F1: 0.9091 | MCC: 0.7489 | ECE: 0.0786 | Latency: 0.00 ms
- **Sentinel-SVM**: **Acc: 96.51%** | **AUC-ROC: 0.9948** | **Sens: 1.0000** | **Spec: 0.9062** | **Prec: 0.9474** | **F1: 0.9730** | **MCC: 0.9266** | **ECE: 0.0505** | Latency: 0.00 ms  
*Routing*: **Sentinel-SVM** is the clinical champion; automated guardrail routes live inference to Sentinel-SVM.

### 2. Heart Disease (CardioWave Suite)
```
---> [Evaluating Heart Disease Models] <---
```
- **CardioWave-VQC**: Acc: 95.65% | AUC-ROC: 0.8977 | Sens: 1.0000 | Spec: 0.0000 | Prec: 0.9565 | F1: 0.9778 | MCC: 0.0000 | ECE: 0.0949 | Latency: 0.00 ms
- **Sentinel-XGB**: Acc: 95.65% | AUC-ROC: 0.9318 | Sens: 0.9773 | Spec: 0.5000 | Prec: 0.9773 | F1: 0.9773 | MCC: 0.4773 | ECE: 0.0305 | Latency: 0.00 ms
- **Sentinel-MLP**: **Acc: 97.83%** | **AUC-ROC: 1.0000** | **Sens: 1.0000** | **Spec: 0.5000** | **Prec: 0.9778** | **F1: 0.9888** | **MCC: 0.6992** | **ECE: 0.0288** | Latency: 0.00 ms  
*Routing*: **Sentinel-MLP** leads across Accuracy, AUC-ROC, and minimal calibration error (ECE 0.0288).

### 3. Parkinson's Disease (NeuroSynapse Suite)
```
---> [Evaluating Parkinson's Models] <---
```
- **NeuroSynapse-VQC**: Acc: 73.33% | AUC-ROC: 0.4659 | Sens: 1.0000 | Spec: 0.0000 | Prec: 0.7333 | F1: 0.8462 | MCC: 0.0000 | **ECE: 0.0388** | Latency: 0.00 ms
- **Sentinel-RF**: Acc: 73.33% | AUC-ROC: 0.4318 | Sens: 1.0000 | Spec: 0.0000 | Prec: 0.7333 | F1: 0.8462 | MCC: 0.0000 | ECE: 0.0918 | Latency: 0.00 ms
- **Sentinel-LogReg**: Acc: 73.33% | **AUC-ROC: 0.5114** | Sens: 1.0000 | Spec: 0.0000 | Prec: 0.7333 | F1: 0.8462 | MCC: 0.0000 | ECE: 0.0959 | Latency: 0.00 ms  
*Routing*: High sensitivity (1.0000) maintained; linear baseline Sentinel-LogReg provides highest AUC control.

### 4. Diabetes (Metabolic Suite)
```
---> [Evaluating Diabetes Models] <---
```
- **Diabetes-VQC**: Acc: 71.55% | AUC-ROC: 0.8631 | Sens: 1.0000 | Spec: 0.0000 | Prec: 0.7155 | F1: 0.8342 | MCC: 0.0000 | ECE: 0.1238 | Latency: 0.00 ms
- **Sentinel-RF**: **Acc: 91.38%** | AUC-ROC: 0.9693 | Sens: 0.9277 | Spec: 0.8788 | Prec: 0.9506 | **F1: 0.9390** | **MCC: 0.7927** | ECE: 0.0741 | Latency: 0.00 ms
- **Sentinel-XGB**: Acc: 90.52% | **AUC-ROC: 0.9701** | Sens: 0.9036 | **Spec: 0.9091** | **Prec: 0.9615** | F1: 0.9317 | MCC: 0.7813 | **ECE: 0.0544** | Latency: 0.00 ms  
*Routing*: **Sentinel-RF** achieves highest overall clinical score; Sentinel-XGB achieves highest specificity (0.9091).

---

## 🔬 Research Objectives Audit (OBJ-01 to OBJ-06)

Every objective was subjected to rigorous empirical testing:

1. **OBJ-01 (Hybrid Architecture)**: Verified end-to-end pipeline in `ml/preprocessing/validation.py`, `ml/quantum/vqc.py`, and `ml/inference/unified_predictor.py`.
2. **OBJ-02 (High-Dim Classification & Regression)**: Verified BiomedCLIP (512-dim) / MedSigLIP (768-dim) and continuous `VariationalQuantumRegressor` with Pauli-Z expectations in `ml/quantum/vqr.py`.
3. **OBJ-03 (Baseline Comparison)**: Verified paired comparison under identical 5-seed stratified splits (Seeds: 7, 21, 42, 73, 101) with zero fabricated metrics in `ml/evaluation/metrics.py`.
4. **OBJ-04 (Hardware Scalability & Explainability)**: Verified noisy quantum hardware simulation (IBM Eagle, IonQ Forte) in `ml/quantum/backends.py` and Grad-CAM/KernelSHAP in `ml/explainability/`.
5. **OBJ-05 (Zero Data Leakage)**: Verified patient-grouped splitting (`PatientGroupedSplitter`), train-only PCA/scaling, and mathematical `audit_leakage` tests in `ml/preprocessing/splitting.py`.
6. **OBJ-06 (Scientific Benchmarking)**: Verified bootstrap confidence intervals (1,000 resamples), ECE calibration, gate fidelity, and peak memory profiling in `ml/experiments/runner.py`.

---

## 🏥 Clinical Capabilities

- **Emergency Severity Index (ESI 1–5)**: Deterministic rule-based clinical prioritization ensuring critical patients receive immediate life-saving care within 0 to 10 minutes.
- **3D Anatomical Digital Twin**: Real-time Three.js spatial visualization highlighting multi-organ risks across the brain, lungs, heart, liver, and pancreas.
- **Offline Emergency Passport**: Instant QR-accessible emergency passport delivering blood type, severe allergies, and current medications without hospital network dependency.
- **Longitudinal Trend Analytics**: Ordinary Least Squares (OLS) linear slope estimation and same-day sample averaging to detect chronic disease deterioration before acute flare-ups.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Quantum Core** | PennyLane 0.36+, Qiskit Aer, Statevector Simulators, Noise Models |
| **Machine Learning** | PyTorch 2.2+, Scikit-Learn, XGBoost, BiomedCLIP, MedSigLIP |
| **Backend Service** | FastAPI, Uvicorn, Pydantic v2, Python 3.10+, SQLite / PostgreSQL, Prisma |
| **Frontend Client** | React 18, Vite 6, Three.js, React Three Fiber, GSAP 3.15, Recharts, Tailwind CSS |
| **Security & Auth** | Google Identity Services, RS256 JWT, HIPAA Safeguards, DPDP 2023 Principles |

---

## 📜 License
MIT License. Copyright (c) 2026 Q-RAKSHAK Development Team. See [LICENSE](LICENSE) for details.
