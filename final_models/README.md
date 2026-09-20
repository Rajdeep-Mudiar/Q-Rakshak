# 🧬 Q-RAKSHAK: Unified Model & Clinical AI Hub (`final_models/`)

This directory is the single, centralized, production-grade repository for all **Clinical Machine Learning**, **Quantum Hybrid Circuits**, **Fine-Tuning Pipelines**, **Model Checkpoints**, and **Diagnostic Inference Engines** in Q-RAKSHAK.

---

## 📂 Architecture Overview

```text
final_models/
├── checkpoints/                        # 🧠 Production Model Checkpoints & Preprocessors
│   ├── quantum/                       # Fine-Tuned Quantum Hybrid VQCs & QSVMs (QuantumPneu, Q-Skin-Vortex, etc.)
│   ├── classical/                     # Classical Baseline Models (Sentinel-RF, Sentinel-SVM, Sentinel-XGB, etc.)
│   ├── preprocessors/                 # Fitted MinMaxScalers, PCA Projections, Encoders
│   └── registry.json                  # Centralized Model Registry (Version, Accuracy, QAS, Checkpoint paths)
│
├── pipelines/                         # 🔬 Training & Fine-Tuning Pipelines (Vision + Tabular)
│   ├── common/                        # quantum_circuits.py, metrics_evaluator.py, lr_schedulers.py
│   ├── vision/                        # train_pneumonia.py, train_skin_cancer.py
│   └── tabular/                       # train_breast_cancer.py, train_heart_disease.py, train_parkinsons.py, train_diabetes.py
│
├── engine/                            # ⚙️ Core Clinical AI & Quantum Engines
│   ├── quantum/                       # PennyLane VQC, Parameter-Shift optimizers, QSVM Kernels
│   ├── digital_twin/                  # Patient physiological response simulation
│   ├── uncertainty/                   # Conformal calibration & Dirichlet uncertainty bounds
│   ├── explainability/                # Grad-CAM, Quantum Saliency & Attention Maps
│   ├── pneumonia/                     # Chest X-Ray inference & feature backbones
│   ├── skin_cancer/                   # Dermoscopy inference & fusion layers
│   └── service.py                     # Standalone Model Microservice
│
├── lab/                               # 🧪 Research Lab & Experimentation
│   ├── configs/                       # Hyperparameter sweeps & experiment configs
│   └── scripts/                       # Benchmark runners & research ablations
│
├── cli/                               # 🖥️ Developer CLI Suite
│   ├── train.py                       # Master Training CLI (`python -m final_models.cli.train`)
│   ├── evaluate.py                    # Master Benchmark CLI (`python -m final_models.cli.evaluate`)
│   ├── visualize.py                   # Plotting & 2-Panel Diagnostic Visualizer
│   └── export.py                      # Checkpoint sync & verification utility
│
├── outputs/                           # 📊 Exported training histories, benchmark summaries, and charts
└── requirements_kaggle.txt            # Environment dependencies for Kaggle & CUDA execution
```

---

## 🚀 Common Commands

### 1. Training & Fine-Tuning
```bash
# Train a specific disease module
python -m final_models.cli.train --disease breast_cancer --epochs 30

# Train the entire medical suite (6 diseases)
python -m final_models.cli.train --disease all --epochs 15
```

### 2. Clinical Benchmark Evaluation
```bash
python -m final_models.cli.evaluate --disease all --weights-dir final_models/checkpoints
```

### 3. Generate Diagnostic Training Curves & Dashboards
```bash
python -m final_models.cli.visualize --disease all --output-dir final_models/outputs
```

### 4. Sync Weights to Backend
```bash
python -m final_models.cli.export --weights-dir final_models/outputs
```
