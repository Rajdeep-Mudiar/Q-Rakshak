# Pneumonia QML Module — Complete Implementation Plan

## Extension of the Existing Skin Cancer QML Project

> **Module:** Chest X-Ray Images (Pneumonia)  
> **Dataset location:** `datasets/pneumonia`  
> **Task:** Binary chest X-ray classification — `NORMAL` vs `PNEUMONIA`  
> **Dataset size:** 5,863 JPEG X-ray images  
> **Integration point:** Add this module **after the complete Skin Cancer implementation** is finished.  
> **Primary objective:** Extend the existing project without breaking the Skin Cancer pipeline, while reusing the same architecture, training/evaluation conventions, model registry, API patterns, UI patterns, experiment tracking, and deployment infrastructure.

---

# 1. Purpose

The existing project is being built around a scalable medical-imaging architecture with:

- Classical deep-learning models
- Hybrid Quantum Machine Learning (QML)
- Dataset-specific preprocessing
- Training/evaluation separation
- Model registry and versioning
- Explainability
- FastAPI inference
- React frontend
- Docker/deployment
- Reproducible experiments

After the Skin Cancer module is fully implemented and validated, the **Pneumonia module** should be added as a second disease-specific feature.

The final system should conceptually become:

```text
Medical AI Platform
│
├── Skin Cancer
│   ├── Dataset
│   ├── Classical Models
│   ├── QML Models
│   ├── Training
│   ├── Evaluation
│   ├── Explainability
│   └── Inference
│
└── Pneumonia
    ├── Dataset
    ├── Classical Models
    ├── QML Models
    ├── Training
    ├── Evaluation
    ├── Explainability
    └── Inference
```

The two modules must remain logically independent.

---

# 2. Existing Project Integration Principle

Do **not** copy the entire Skin Cancer project and rename files.

Instead, separate the project into:

```text
shared infrastructure
+
disease-specific implementations
```

Shared infrastructure should contain:

- Configuration
- Logging
- Seed management
- Dataset interfaces
- Generic training utilities
- Generic evaluation utilities
- Model registry
- Artifact management
- API infrastructure
- Authentication
- Storage
- Monitoring
- Common UI components

Disease-specific code should contain:

- Dataset loader
- Image preprocessing
- Augmentation
- Disease-specific models
- Quantum circuit
- Disease-specific feature extraction
- Disease-specific evaluation
- Disease-specific explainability
- Disease-specific inference configuration

---

# 3. Dataset

The provided dataset must be used from:

```text
datasets/pneumonia
```

Expected structure:

```text
datasets/
└── pneumonia/
    ├── train/
    │   ├── NORMAL/
    │   └── PNEUMONIA/
    │
    ├── test/
    │   ├── NORMAL/
    │   └── PNEUMONIA/
    │
    └── val/
        ├── NORMAL/
        └── PNEUMONIA/
```

The implementation must first inspect the actual directory structure instead of assuming it is exactly as above.

Run:

```bash
python -m ml.pneumonia.data.audit_dataset \
    --root datasets/pneumonia
```

If the real folder names differ by capitalization or nesting, the loader must normalize them through configuration rather than modifying the original dataset.

---

# 4. Dataset Characteristics

The supplied dataset contains:

```text
Total images: 5,863
Classes: 2

NORMAL
PNEUMONIA
```

The images are chest X-rays from pediatric patients approximately 1–5 years old, as described by the dataset documentation.

This has an important consequence:

> The resulting model must be documented as a research model trained on this dataset. It must not be represented as a universally validated pneumonia detector for adults or other populations without external validation.

---

# 5. Integration After Skin Cancer

The recommended development order is:

```text
PHASE 1
Complete Skin Cancer
        ↓
PHASE 2
Freeze/refactor shared infrastructure
        ↓
PHASE 3
Create Pneumonia module
        ↓
PHASE 4
Audit datasets/pneumonia
        ↓
PHASE 5
Implement classical baselines
        ↓
PHASE 6
Implement CNN feature extraction
        ↓
PHASE 7
Implement QuantumPneu
        ↓
PHASE 8
Run QML experiments
        ↓
PHASE 9
Evaluation + explainability
        ↓
PHASE 10
API integration
        ↓
PHASE 11
React integration
        ↓
PHASE 12
Cross-disease testing
        ↓
PHASE 13
Docker/deployment
```

---

# 6. Do Not Modify the Skin Cancer Pipeline Unnecessarily

The following Skin Cancer paths should remain intact:

```text
datasets/SKIN_CANCER/
ml/skin_cancer/
models/skin_cancer/
reports/skin_cancer/
```

Add:

```text
datasets/pneumonia/
ml/pneumonia/
models/pneumonia/
reports/pneumonia/
```

Shared utilities may be refactored only when both modules genuinely benefit.

---

# 7. Final Project Structure

A recommended final structure is:

```text
MEDICAL-AI-QML/
│
├── datasets/
│   ├── SKIN_CANCER/
│   │   ├── train/
│   │   ├── val/
│   │   └── test/
│   │
│   └── pneumonia/
│       ├── train/
│       │   ├── NORMAL/
│       │   └── PNEUMONIA/
│       ├── val/
│       │   ├── NORMAL/
│       │   └── PNEUMONIA/
│       └── test/
│           ├── NORMAL/
│           └── PNEUMONIA/
│
├── ml/
│   ├── common/
│   │   ├── config.py
│   │   ├── seeds.py
│   │   ├── logger.py
│   │   ├── checkpoints.py
│   │   ├── metrics.py
│   │   ├── registry.py
│   │   ├── device.py
│   │   └── reproducibility.py
│   │
│   ├── skin_cancer/
│   │   └── ...
│   │
│   └── pneumonia/
│       ├── __init__.py
│       │
│       ├── configs/
│       │   ├── data.yaml
│       │   ├── classical.yaml
│       │   ├── quantum.yaml
│       │   ├── experiments.yaml
│       │   └── production.yaml
│       │
│       ├── data/
│       │   ├── __init__.py
│       │   ├── audit_dataset.py
│       │   ├── build_manifest.py
│       │   ├── dataset_loader.py
│       │   ├── detect_duplicates.py
│       │   ├── validate_splits.py
│       │   ├── image_quality.py
│       │   └── dataset_statistics.py
│       │
│       ├── preprocessing/
│       │   ├── __init__.py
│       │   ├── transforms.py
│       │   ├── normalize.py
│       │   ├── augmentation.py
│       │   └── xray_preprocessing.py
│       │
│       ├── features/
│       │   ├── __init__.py
│       │   ├── extract_cnn_features.py
│       │   ├── pca_features.py
│       │   ├── feature_scaling.py
│       │   └── feature_projection.py
│       │
│       ├── classical/
│       │   ├── __init__.py
│       │   ├── pneu_vision.py
│       │   ├── thorax_net.py
│       │   └── pulmo_lumen.py
│       │
│       ├── quantum/
│       │   ├── __init__.py
│       │   ├── quantum_pneu.py
│       │   ├── quantum_thorax.py
│       │   ├── pneuq_vision.py
│       │   ├── thoraxq_vortex.py
│       │   ├── quantum_pneu_fusion.py
│       │   ├── encodings.py
│       │   ├── ansatz.py
│       │   ├── quantum_layers.py
│       │   └── quantum_utils.py
│       │
│       ├── training/
│       │   ├── __init__.py
│       │   ├── train_pneu_vision.py
│       │   ├── train_thorax_net.py
│       │   ├── train_pulmo_lumen.py
│       │   ├── train_quantum_pneu.py
│       │   ├── train_quantum_thorax.py
│       │   ├── train_pneuq_vision.py
│       │   ├── train_thoraxq_vortex.py
│       │   └── train_quantum_pneu_fusion.py
│       │
│       ├── evaluation/
│       │   ├── __init__.py
│       │   ├── evaluate_classical.py
│       │   ├── evaluate_quantum.py
│       │   ├── evaluate_all.py
│       │   ├── metrics.py
│       │   ├── confusion_matrix.py
│       │   ├── roc_pr.py
│       │   ├── calibration.py
│       │   └── error_analysis.py
│       │
│       ├── explainability/
│       │   ├── __init__.py
│       │   ├── gradcam.py
│       │   ├── integrated_gradients.py
│       │   ├── quantum_explanations.py
│       │   └── feature_importance.py
│       │
│       ├── experiments/
│       │   ├── __init__.py
│       │   ├── compare_qubit_counts.py
│       │   ├── compare_embeddings.py
│       │   ├── compare_ansatz.py
│       │   ├── compare_backbones.py
│       │   ├── compare_classical_quantum.py
│       │   ├── compare_augmentation.py
│       │   └── ablation_study.py
│       │
│       ├── inference/
│       │   ├── __init__.py
│       │   ├── predictor.py
│       │   ├── quantum_predictor.py
│       │   ├── quality_gate.py
│       │   └── schemas.py
│       │
│       └── export/
│           ├── export_model.py
│           └── package_model.py
│
├── models/
│   ├── skin_cancer/
│   │   ├── classical/
│   │   ├── quantum/
│   │   └── production/
│   │
│   └── pneumonia/
│       ├── classical/
│       ├── quantum/
│       ├── candidates/
│       ├── staging/
│       └── production/
│
├── reports/
│   ├── skin_cancer/
│   └── pneumonia/
│       ├── dataset_audit/
│       ├── training/
│       ├── evaluation/
│       ├── experiments/
│       ├── explainability/
│       └── error_analysis/
│
├── backend/
│   └── app/
│       ├── core/
│       └── features/
│           ├── skin_cancer/
│           └── pneumonia/
│
├── frontend/
│   └── src/
│       └── features/
│           ├── skinCancer/
│           └── pneumonia/
│
├── tests/
│   ├── skin_cancer/
│   ├── pneumonia/
│   └── integration/
│
├── docker/
├── requirements.txt
├── docker-compose.yml
└── README.md
```

---

# 8. Model Naming

The Pneumonia module should use consistent, distinctive names.

## Classical Models

### PneuVision

```text
Architecture: EfficientNet-B0
File: ml/pneumonia/classical/pneu_vision.py
Training: train_pneu_vision.py
```

Purpose:

- Primary classical baseline
- Feature extractor for QML
- Lightweight inference candidate

---

### ThoraxNet

```text
Architecture: EfficientNet-B2
File: ml/pneumonia/classical/thorax_net.py
Training: train_thorax_net.py
```

Purpose:

- Higher-capacity classical baseline
- Strong transfer-learning comparison

---

### PulmoLumen

```text
Architecture: ConvNeXt-Tiny
File: ml/pneumonia/classical/pulmo_lumen.py
Training: train_pulmo_lumen.py
```

Purpose:

- Modern convolutional baseline
- Independent comparison against EfficientNet

---

# 9. Quantum Models

## QuantumPneu

Primary QML model.

```text
File:
ml/pneumonia/quantum/quantum_pneu.py

Training:
ml/pneumonia/training/train_quantum_pneu.py
```

Architecture:

```text
X-Ray
  ↓
EfficientNet-B0
  ↓
Compact feature vector
  ↓
StandardScaler
  ↓
PCA
  ↓
8 features
  ↓
8-qubit quantum circuit
  ↓
Variational layers
  ↓
Measurements
  ↓
Binary classifier
```

---

## QuantumThorax

Higher-capacity hybrid model.

```text
ml/pneumonia/quantum/quantum_thorax.py
```

Architecture:

```text
EfficientNet-B2
  ↓
Feature projection
  ↓
PCA
  ↓
8–12 quantum features
  ↓
Quantum circuit
  ↓
MLP classifier
```

---

## PneuQ-Vision

Trainable projection + QML.

```text
ml/pneumonia/quantum/pneuq_vision.py
```

Architecture:

```text
CNN
 ↓
Trainable projection
 ↓
8-dimensional representation
 ↓
Quantum layer
 ↓
Measurement
 ↓
MLP
```

---

## ThoraxQ-Vortex

Deeper research-oriented QML architecture.

```text
ml/pneumonia/quantum/thoraxq_vortex.py
```

Use only after the simpler QML pipeline is stable.

---

## QuantumPneuFusion

Prediction-level fusion:

```text
PneuVision
    +
QuantumPneu
    ↓
Validation-optimized fusion
    ↓
Final probability
```

File:

```text
ml/pneumonia/quantum/quantum_pneu_fusion.py
```

---

# 10. First Implementation: Dataset Audit

Before training anything:

```bash
python -m ml.pneumonia.data.audit_dataset \
    --root datasets/pneumonia
```

The audit must report:

```text
Total images
Train count
Validation count
Test count
NORMAL count
PNEUMONIA count
Image dimensions
Color channels
Corrupt files
Unreadable files
Duplicate files
Near duplicates
Class imbalance
```

Save:

```text
reports/pneumonia/dataset_audit/
├── dataset_summary.json
├── class_distribution.csv
├── image_statistics.csv
├── class_distribution.png
└── audit.log
```

---

# 11. Verify the Existing Dataset Splits

The supplied dataset already provides:

```text
train
val
test
```

Do not automatically perform another random train/test split.

The first objective is to determine whether the existing split is usable.

Run:

```bash
python -m ml.pneumonia.data.validate_splits \
    --root datasets/pneumonia
```

Verify:

```text
No duplicate image across splits
No obvious leakage
All classes represented
No unreadable images
Correct directory labels
```

---

# 12. Duplicate Detection

Implement:

```text
detect_duplicates.py
```

Use multiple levels:

### Exact duplicate

SHA-256.

### Perceptual duplicate

pHash/dHash/aHash.

### Near duplicate

CNN embedding similarity.

This is important because medical imaging datasets may contain highly similar or repeated studies.

Output:

```text
reports/pneumonia/dataset_audit/duplicates.csv
```

Do not remove files automatically during the first audit.

Generate a review report first.

---

# 13. Manifest

Create:

```text
build_manifest.py
```

Output:

```text
reports/pneumonia/dataset_audit/manifest.csv
```

Suggested columns:

```text
image_id
filepath
split
class
width
height
channels
file_size
sha256
phash
```

The manifest becomes the canonical dataset index.

---

# 14. Class Mapping

Use a stable mapping:

```python
CLASS_TO_INDEX = {
    "NORMAL": 0,
    "PNEUMONIA": 1
}
```

Never depend on arbitrary filesystem ordering.

Store:

```text
models/pneumonia/.../labels.json
```

with the same mapping.

---

# 15. X-Ray Preprocessing

Chest X-rays require a different preprocessing pipeline from Skin Cancer.

Recommended baseline:

```text
JPEG
 ↓
Read image
 ↓
Validate image
 ↓
Convert to grayscale
 ↓
Replicate grayscale into 3 channels
 ↓
Resize 224×224
 ↓
Normalize
```

The RGB replication is useful when using ImageNet-pretrained RGB backbones.

Do not blindly use the Skin Cancer preprocessing pipeline.

---

# 16. Image Size

Start with:

```text
224 × 224
```

because it is computationally practical for:

- EfficientNet
- ConvNeXt
- CNN feature extraction
- QML experiments

Later experiment with:

```text
256 × 256
384 × 384
```

only if the computational budget permits and validation performance justifies it.

---

# 17. Augmentation

Use conservative augmentation.

Recommended:

```text
RandomHorizontalFlip
Small Rotation
Small Translation
Mild Brightness
Mild Contrast
Random Crop
```

Example:

```python
RandomHorizontalFlip(p=0.5)
RandomRotation(degrees=7)
```

Keep medical plausibility as the constraint.

Avoid aggressive transformations.

---

# 18. Horizontal Flip Experiment

Horizontal flipping can change left/right orientation.

Therefore make it an explicit experiment rather than assuming it is always beneficial.

Compare:

```text
Experiment A:
No horizontal flip

Experiment B:
Horizontal flip
```

Run:

```bash
python -m ml.pneumonia.experiments.compare_augmentation
```

Keep the augmentation policy selected using validation results and clinical plausibility.

---

# 19. Image Quality

Implement:

```text
image_quality.py
```

Check:

```text
Resolution
Blur
Exposure
Contrast
Blank images
Extreme intensity
Unreadable files
```

A quality gate should exist during inference as well.

---

# 20. Important Shortcut-Learning Checks

Chest X-ray models can learn unintended cues.

Inspect:

```text
Image borders
Markers
Labels
Text
Equipment
Positioning
Background
```

Use Grad-CAM later to verify that predictions are influenced by medically relevant regions.

---

# 21. Classical Model 1 — PneuVision

Architecture:

```text
EfficientNet-B0
 ↓
Global Average Pooling
 ↓
Dropout
 ↓
Linear
 ↓
2-class logits
```

Implementation:

```text
ml/pneumonia/classical/pneu_vision.py
```

Training:

```text
ml/pneumonia/training/train_pneu_vision.py
```

Command:

```bash
python -m ml.pneumonia.training.train_pneu_vision
```

---

# 22. Classical Model 2 — ThoraxNet

Architecture:

```text
EfficientNet-B2
 ↓
Global Pooling
 ↓
Dropout
 ↓
Linear
 ↓
2-class logits
```

Training:

```bash
python -m ml.pneumonia.training.train_thorax_net
```

---

# 23. Classical Model 3 — PulmoLumen

Architecture:

```text
ConvNeXt-Tiny
 ↓
Global Pooling
 ↓
Dropout
 ↓
Linear
 ↓
2-class logits
```

Training:

```bash
python -m ml.pneumonia.training.train_pulmo_lumen
```

---

# 24. Transfer Learning Strategy

Do not immediately train the entire network from scratch.

Use:

```text
Stage 1
Pretrained backbone frozen
        ↓
Train classifier
        ↓
Stage 2
Unfreeze final backbone block
        ↓
Small learning rate
        ↓
Fine-tune
```

Recommended initial learning rates:

```text
Classifier: 1e-3
Final CNN block: 1e-5
```

These are starting points, not guaranteed optimal values.

---

# 25. Loss Function

Because the classes are imbalanced, begin with weighted binary cross entropy or weighted cross entropy.

For two-class logits:

```python
CrossEntropyLoss(weight=class_weights)
```

or binary formulation:

```python
BCEWithLogitsLoss(pos_weight=...)
```

Do not apply both weighting mechanisms simultaneously without a controlled experiment.

---

# 26. Focal Loss Experiment

If the baseline has poor minority-class recall, test:

```text
Focal Loss
```

against:

```text
Weighted Cross Entropy
```

Do not assume Focal Loss is automatically better.

---

# 27. Evaluation Metrics

Accuracy alone is insufficient.

Report:

```text
Accuracy
Precision
Recall
Sensitivity
Specificity
F1
Macro F1
ROC-AUC
PR-AUC
Brier Score
ECE
```

Primary clinical-performance metrics should include:

```text
Pneumonia Sensitivity
Pneumonia Specificity
```

---

# 28. Why Sensitivity Matters

A model that classifies many normal images correctly but misses many pneumonia cases may have a deceptively good accuracy.

Therefore compare:

```text
Accuracy
vs
Sensitivity
vs
Specificity
vs
Macro F1
```

rather than optimizing only accuracy.

---

# 29. Feature Extraction for QML

After training `PneuVision`:

```text
X-Ray
 ↓
EfficientNet-B0
 ↓
Feature vector
```

Save the extracted features.

Example:

```text
models/pneumonia/features/
├── train_features.npy
├── val_features.npy
└── test_features.npy
```

Never fit PCA or scaling using test features.

---

# 30. Leakage-Safe PCA

Correct:

```text
TRAIN FEATURES
      ↓
fit StandardScaler
      ↓
fit PCA
      ↓
transform TRAIN

VALIDATION
      ↓
transform using training scaler/PCA

TEST
      ↓
transform using training scaler/PCA
```

Incorrect:

```text
TRAIN + VAL + TEST
       ↓
fit PCA
```

The latter leaks information from the test set.

---

# 31. PCA Dimensionality

Test:

```text
4 components
6 components
8 components
10 components
12 components
```

Primary starting configuration:

```text
8 PCA components
```

because 8 dimensions map naturally to an 8-qubit circuit.

---

# 32. QuantumPneu Architecture

Primary pipeline:

```text
Chest X-Ray
     ↓
EfficientNet-B0
     ↓
Feature vector
     ↓
StandardScaler
     ↓
PCA → 8
     ↓
Scale to quantum angle range
     ↓
8-qubit circuit
     ↓
Variational layers
     ↓
Expectation values
     ↓
Linear classifier
     ↓
PNEUMONIA probability
```

---

# 33. Quantum Encoding

Start with angle encoding.

For feature vector:

```text
x = [x0, x1, ..., x7]
```

encode:

```text
RY(x0)
RY(x1)
...
RY(x7)
```

Optionally combine:

```text
RY(xi)
RZ(xi)
```

Compare these variants experimentally.

---

# 34. Entanglement

Use a ring topology initially:

```text
q0 ── q1
│      │
q7 ── q2
│      │
q6 ── q3
│      │
q5 ── q4
```

Apply CNOT connections around the ring.

This provides entanglement without unnecessarily increasing circuit complexity.

---

# 35. Variational Circuit

Start with:

```text
8 qubits
3 layers
```

Each layer:

```text
RY(theta)
RZ(theta)
CNOT ring
```

Then measure:

```text
⟨Z0⟩
⟨Z1⟩
...
⟨Z7⟩
```

These values become the classical feature vector.

---

# 36. Avoid Deep Quantum Circuits Initially

Do not begin with:

```text
20+ layers
```

because deeper circuits can:

- Increase simulation cost
- Increase optimization difficulty
- Increase barren-plateau risk
- Increase hardware noise sensitivity

Start small and increase depth only through experiments.

---

# 37. QuantumPneu Training

File:

```text
ml/pneumonia/training/train_quantum_pneu.py
```

Training stages:

```text
Stage 1
Freeze CNN

Stage 2
Extract CNN features

Stage 3
Fit scaler + PCA on train only

Stage 4
Train QML classifier

Stage 5
Evaluate validation set

Stage 6
Optional final-block CNN fine-tuning
```

---

# 38. Hybrid Fine-Tuning

Only after the frozen-feature QML pipeline is stable:

```text
CNN final block
      +
Quantum layer
      +
Classifier
```

Train jointly using:

```text
CNN LR ≈ 1e-5
Quantum/classifier LR ≈ 1e-3
```

Tune experimentally.

Do not unfreeze the entire CNN immediately.

---

# 39. QuantumThorax

Use:

```text
EfficientNet-B2
 ↓
Feature vector
 ↓
PCA
 ↓
8/12 components
 ↓
Quantum circuit
 ↓
MLP
```

This tests whether a stronger CNN representation improves QML.

---

# 40. PneuQ-Vision

Instead of fixed PCA:

```text
CNN
 ↓
Linear projection
 ↓
8 features
 ↓
Quantum layer
 ↓
MLP
```

The projection becomes trainable.

This can potentially learn a representation better suited to the quantum circuit, but it introduces more trainable parameters.

---

# 41. ThoraxQ-Vortex

Research configuration:

```text
Angle Encoding
 ↓
RY/RZ
 ↓
Ring Entanglement
 ↓
Trainable RY/RZ
 ↓
Ring Entanglement
 ↓
Trainable RY/RZ
 ↓
Measurement
```

Test:

```text
2 layers
3 layers
4 layers
```

---

# 42. QuantumPneuFusion

Combine predictions:

```text
PneuVision probability
        +
QuantumPneu probability
        ↓
Fusion
```

Start with weighted averaging:

```text
Pfinal =
α * Pclassical +
(1-α) * Pquantum
```

Tune `α` using validation data only.

Do not optimize fusion weights on the test set.

---

# 43. Quantum Experiment Matrix

Run:

| Qubits | Layers |
|---:|---:|
| 4 | 2 |
| 4 | 3 |
| 6 | 2 |
| 6 | 3 |
| 8 | 2 |
| 8 | 3 |
| 8 | 4 |
| 10 | 3 |
| 12 | 3 |

Record:

```text
Accuracy
Sensitivity
Specificity
Macro F1
ROC-AUC
PR-AUC
Training time
Inference time
Parameter count
Gradient norm
```

---

# 44. Embedding Experiment

Compare:

```text
AngleEmbedding
RY-only
RY/RZ custom encoding
AmplitudeEmbedding
```

Use compact features.

Do not attempt to map the raw 224×224 image directly into thousands of qubits.

---

# 45. Ansatz Experiment

Compare:

```text
BasicEntangler
StronglyEntangling
Hardware-efficient
Custom RY/RZ Ring
```

The final selection must be evidence-based.

---

# 46. Barren Plateau Analysis

During QML training record:

```text
Gradient mean
Gradient standard deviation
Gradient norm
Loss
```

Plot:

```text
Epoch vs Gradient Norm
```

If gradients become extremely small:

```text
reduce circuit depth
change initialization
reduce entanglement
use a simpler ansatz
```

---

# 47. Random Seeds

Final experiments should use multiple seeds.

Example:

```text
42
123
2024
3407
```

At least three independent seeds should be used for the final reported experiment.

Report:

```text
mean ± standard deviation
```

rather than only one lucky run.

---

# 48. Reproducibility

Every experiment must record:

```text
Seed
Dataset version
Git commit
Model name
Model version
Image size
Augmentation configuration
Learning rate
Batch size
Optimizer
Loss
Qubits
Quantum depth
Embedding
Ansatz
PCA components
Framework versions
Device
```

Save:

```text
metadata.json
```

with each trained model.

---

# 49. Evaluation Pipeline

Run:

```bash
python -m ml.pneumonia.evaluation.evaluate_classical
```

Then:

```bash
python -m ml.pneumonia.evaluation.evaluate_quantum
```

Finally:

```bash
python -m ml.pneumonia.evaluation.evaluate_all
```

---

# 50. Evaluation Outputs

Each model should generate:

```text
metrics.json
predictions.csv
confusion_matrix.png
roc_curve.png
precision_recall_curve.png
calibration_curve.png
errors.csv
```

Example:

```text
reports/pneumonia/evaluation/QuantumPneu/
├── metrics.json
├── predictions.csv
├── confusion_matrix.png
├── roc_curve.png
├── precision_recall_curve.png
├── calibration_curve.png
└── errors.csv
```

---

# 51. Confusion Matrix

Use:

```text
                 Predicted
             NORMAL  PNEUMONIA

Actual NORMAL

Actual PNEUMONIA
```

Calculate:

```text
TP
TN
FP
FN
```

Then:

```text
Sensitivity = TP / (TP + FN)

Specificity = TN / (TN + FP)

Precision = TP / (TP + FP)

Accuracy = (TP + TN) / Total
```

---

# 52. ROC-AUC

Generate:

```text
reports/pneumonia/evaluation/<model>/roc_curve.png
```

Use prediction probabilities rather than hard labels.

---

# 53. PR-AUC

Because the classes are imbalanced, also report:

```text
Precision-Recall AUC
```

This provides additional information about positive-class performance.

---

# 54. Calibration

Evaluate:

```text
Brier Score
Expected Calibration Error
Reliability Diagram
```

Compare:

```text
Raw predictions
vs
Temperature-scaled predictions
```

Calibration must be fitted using validation data.

---

# 55. Threshold Optimization

Do not assume 0.5 is the best threshold.

Test validation thresholds:

```text
0.30
0.40
0.50
0.60
0.70
```

Select according to the intended operating point.

For a screening-oriented research prototype, sensitivity may be prioritized, but the choice must be explicitly documented.

Never select the threshold using the final test set.

---

# 56. Explainability

Implement Grad-CAM:

```text
ml/pneumonia/explainability/gradcam.py
```

Command:

```bash
python -m ml.pneumonia.explainability.gradcam \
    --model PneuVision \
    --image sample.jpg
```

Generate:

```text
original.png
heatmap.png
overlay.png
```

---

# 57. Grad-CAM Validation

For randomly selected:

```text
NORMAL
PNEUMONIA
TRUE POSITIVE
TRUE NEGATIVE
FALSE POSITIVE
FALSE NEGATIVE
```

inspect Grad-CAM.

The objective is to determine whether the model attends to relevant lung regions.

---

# 58. High-Confidence Error Analysis

Create:

```text
reports/pneumonia/error_analysis/
├── false_positive/
├── false_negative/
├── high_confidence_errors/
└── low_confidence/
```

Prioritize analysis of:

```text
False negatives
High-confidence false positives
High-confidence false negatives
```

---

# 59. Shortcut-Learning Analysis

Explicitly inspect whether the model is using:

```text
Image labels
Borders
Markers
Text
Equipment
Positioning artifacts
```

rather than pulmonary abnormalities.

Grad-CAM is one tool for this; it is not proof of causal reasoning.

---

# 60. Quantum Explainability

For QuantumPneu:

```text
CNN features
 ↓
PCA features
 ↓
Quantum circuit
```

perturb each PCA feature:

```text
xi → xi + δ
```

and observe:

```text
Δ prediction
```

Generate:

```text
quantum_feature_importance.csv
quantum_feature_importance.png
```

This explains the compact quantum representation, not individual X-ray pixels.

---

# 61. Out-of-Distribution Detection

Add an inference quality/OOD gate.

Possible methods:

```text
Feature-space distance
Mahalanobis distance
Confidence threshold
Energy score
```

If an image is clearly outside the training distribution:

```text
REJECT / REVIEW REQUIRED
```

rather than forcing:

```text
NORMAL
```

or:

```text
PNEUMONIA
```

---

# 62. Inference Architecture

Production inference:

```text
X-Ray Upload
    ↓
File Validation
    ↓
Image Quality Gate
    ↓
Preprocessing
    ↓
Model Registry
    ↓
CNN Feature Extraction
    ↓
Scaler
    ↓
PCA
    ↓
Quantum Circuit
    ↓
Prediction
    ↓
Calibration
    ↓
OOD Check
    ↓
Response
```

---

# 63. FastAPI Integration

Add:

```text
backend/app/features/pneumonia/
├── controller.py
├── service.py
├── repository.py
├── schemas.py
└── model_registry.py
```

Endpoint:

```http
POST /api/v1/pneumonia/predict
```

Input:

```text
multipart/form-data
image=<xray>
model=QuantumPneu
explain=true
```

---

# 64. API Response

Example structure:

```json
{
  "request_id": "uuid",
  "model": {
    "name": "QuantumPneu",
    "version": "1.0.0"
  },
  "prediction": {
    "class": "PNEUMONIA",
    "probability": 0.91
  },
  "probabilities": {
    "NORMAL": 0.09,
    "PNEUMONIA": 0.91
  },
  "quality": {
    "valid": true,
    "ood": false
  },
  "explanation": {
    "available": true
  },
  "review_required": true
}
```

The numbers are API examples only and must not be interpreted as actual model performance.

---

# 65. React Integration

Add:

```text
frontend/src/features/pneumonia/
├── pages/
│   └── PneumoniaAnalysisPage.jsx
├── components/
│   ├── XRayUploader.jsx
│   ├── XRayPreview.jsx
│   ├── ImageQualityCard.jsx
│   ├── PredictionCard.jsx
│   ├── ProbabilityChart.jsx
│   ├── GradCAMViewer.jsx
│   ├── QuantumModelCard.jsx
│   └── MedicalDisclaimer.jsx
├── services/
│   └── pneumoniaApi.js
└── hooks/
    └── usePneumoniaPrediction.js
```

---

# 66. Frontend Result

Display:

```text
CHEST X-RAY ANALYSIS

Model
QuantumPneu v1.0.0

Prediction
PNEUMONIA

Probability
Pneumonia: XX%
Normal: XX%

Image Quality
Acceptable

Quantum Configuration
8 Qubits
3 Variational Layers

Explanation
[Grad-CAM]

Status
Research Prediction

IMPORTANT
This AI output is not a medical diagnosis.
Professional clinical/radiological assessment is required.
```

Do not display fake confidence values.

---

# 67. Model Registry

Use:

```text
models/pneumonia/
├── candidates/
├── staging/
└── production/
```

A model moves through:

```text
Training
 ↓
Candidate
 ↓
Evaluation
 ↓
Validation Gate
 ↓
Staging
 ↓
Smoke Test
 ↓
Production
```

---

# 68. Model Artifact

Example:

```text
models/pneumonia/quantum/QuantumPneu/v1.0.0/
├── model.pt
├── quantum_weights.pt
├── backbone_weights.pt
├── scaler.pkl
├── pca.pkl
├── labels.json
├── config.yaml
├── metrics.json
├── training_history.json
└── metadata.json
```

---

# 69. Model Metadata

Example:

```json
{
  "model": "QuantumPneu",
  "version": "1.0.0",
  "task": "binary_chest_xray_classification",
  "classes": {
    "NORMAL": 0,
    "PNEUMONIA": 1
  },
  "backbone": "EfficientNet-B0",
  "image_size": 224,
  "pca_components": 8,
  "qubits": 8,
  "quantum_layers": 3,
  "embedding": "RY_RZ",
  "ansatz": "RY_RZ_RING"
}
```

---

# 70. Production Model Selection

Do not automatically select the quantum model.

Compare:

```text
PneuVision
ThoraxNet
PulmoLumen
QuantumPneu
QuantumThorax
PneuQ-Vision
ThoraxQ-Vortex
QuantumPneuFusion
```

If a classical model performs better and is more stable:

```text
Classical model → production
```

If QML demonstrates a reliable advantage:

```text
QML model → production candidate
```

The goal is evidence, not forcing QML to win.

---

# 71. Final Comparison

Generate:

```text
reports/pneumonia/evaluation/model_comparison.csv
```

Columns:

```text
model
version
parameters
qubits
quantum_layers
accuracy
precision
recall
sensitivity
specificity
macro_f1
roc_auc
pr_auc
brier_score
ece
latency_ms
```

Example structure:

| Model | Qubits | Layers | Accuracy | Sensitivity | Specificity | Macro F1 | ROC-AUC | PR-AUC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| PneuVision | — | — | measured | measured | measured | measured | measured | measured |
| ThoraxNet | — | — | measured | measured | measured | measured | measured | measured |
| PulmoLumen | — | — | measured | measured | measured | measured | measured | measured |
| QuantumPneu | 8 | 3 | measured | measured | measured | measured | measured | measured |
| QuantumThorax | 8/12 | 3 | measured | measured | measured | measured | measured | measured |
| PneuQ-Vision | 8 | 3 | measured | measured | measured | measured | measured | measured |
| ThoraxQ-Vortex | 8 | 3 | measured | measured | measured | measured | measured | measured |
| QuantumPneuFusion | 8 | 3 | measured | measured | measured | measured | measured | measured |

Never fill this table with assumed or target accuracy.

---

# 72. Experiment Commands

## Dataset

```bash
python -m ml.pneumonia.data.audit_dataset \
    --root datasets/pneumonia
```

```bash
python -m ml.pneumonia.data.build_manifest \
    --root datasets/pneumonia
```

```bash
python -m ml.pneumonia.data.detect_duplicates \
    --root datasets/pneumonia
```

```bash
python -m ml.pneumonia.data.validate_splits \
    --root datasets/pneumonia
```

---

## Classical Training

```bash
python -m ml.pneumonia.training.train_pneu_vision
```

```bash
python -m ml.pneumonia.training.train_thorax_net
```

```bash
python -m ml.pneumonia.training.train_pulmo_lumen
```

---

## Feature Extraction

```bash
python -m ml.pneumonia.features.extract_cnn_features \
    --model PneuVision
```

```bash
python -m ml.pneumonia.features.pca_features
```

---

## QML Training

```bash
python -m ml.pneumonia.training.train_quantum_pneu
```

```bash
python -m ml.pneumonia.training.train_quantum_thorax
```

```bash
python -m ml.pneumonia.training.train_pneuq_vision
```

```bash
python -m ml.pneumonia.training.train_thoraxq_vortex
```

---

## Evaluation

```bash
python -m ml.pneumonia.evaluation.evaluate_classical
```

```bash
python -m ml.pneumonia.evaluation.evaluate_quantum
```

```bash
python -m ml.pneumonia.evaluation.evaluate_all
```

---

## Experiments

```bash
python -m ml.pneumonia.experiments.compare_qubit_counts
```

```bash
python -m ml.pneumonia.experiments.compare_embeddings
```

```bash
python -m ml.pneumonia.experiments.compare_ansatz
```

```bash
python -m ml.pneumonia.experiments.compare_backbones
```

```bash
python -m ml.pneumonia.experiments.compare_classical_quantum
```

```bash
python -m ml.pneumonia.experiments.compare_augmentation
```

```bash
python -m ml.pneumonia.experiments.ablation_study
```

---

# 73. Recommended Experiment Order

Do not run every expensive QML experiment immediately.

Use:

```text
1. Dataset audit
       ↓
2. Split validation
       ↓
3. Duplicate detection
       ↓
4. PneuVision
       ↓
5. ThoraxNet
       ↓
6. PulmoLumen
       ↓
7. Classical evaluation
       ↓
8. CNN feature extraction
       ↓
9. PCA + classical classifier sanity check
       ↓
10. QuantumPneu
       ↓
11. Qubit count experiments
       ↓
12. Embedding experiments
       ↓
13. Ansatz experiments
       ↓
14. QuantumThorax
       ↓
15. PneuQ-Vision
       ↓
16. ThoraxQ-Vortex
       ↓
17. QuantumPneuFusion
       ↓
18. Calibration
       ↓
19. Explainability
       ↓
20. Error analysis
       ↓
21. Final multi-seed evaluation
       ↓
22. Production candidate
```

---

# 74. Accuracy Optimization Strategy

The implementation should maximize **reliable generalization**, not simply maximize training accuracy.

Priority order:

```text
1. Prevent leakage
2. Validate dataset quality
3. Strong pretrained baseline
4. Appropriate augmentation
5. Correct class balancing
6. Transfer learning
7. Compact CNN features
8. Leakage-safe PCA
9. Stable QML circuit
10. Multiple-seed evaluation
11. Calibration
12. Error analysis
13. External validation
```

---

# 75. What Not to Do

Do not:

```text
Train only on accuracy
```

Do not:

```text
Fit PCA on train + test
```

Do not:

```text
Tune thresholds on test
```

Do not:

```text
Select the best model using test performance
```

Do not:

```text
Claim QML is better merely because it is quantum
```

Do not:

```text
Use extremely deep quantum circuits without experiments
```

Do not:

```text
Feed raw 224×224 pixels directly into a huge quantum circuit
```

Do not:

```text
Copy Skin Cancer preprocessing blindly
```

Do not:

```text
Claim adult/general clinical performance from this pediatric dataset
```

Do not:

```text
Present a research model as a medical diagnostic system
```

---

# 76. Ablation Study

At minimum compare:

```text
A. CNN only
B. CNN + PCA + classical classifier
C. CNN + 4 qubits
D. CNN + 6 qubits
E. CNN + 8 qubits
F. CNN + 8 qubits + deeper circuit
G. CNN + trainable quantum projection
H. CNN + quantum fusion
```

This determines whether improvements actually come from the quantum component.

---

# 77. Classical Sanity Baseline for QML

Before QML, use:

```text
CNN features
 ↓
PCA
 ↓
Logistic Regression
```

and:

```text
CNN features
 ↓
PCA
 ↓
MLP
```

Then compare:

```text
CNN + classical classifier
vs
CNN + QML
```

This is essential.

If QML cannot beat a simple classical classifier on the same representation, the quantum architecture needs justification.

---

# 78. Compute Efficiency

Record:

```text
Training time
Inference time
GPU memory
CPU memory
Number of parameters
Quantum circuit evaluations
Number of shots
```

A model that gains a tiny metric improvement while being dramatically slower may not be a useful production model.

---

# 79. Simulator Configuration

Development should start with:

```text
PennyLane
PyTorch
default.qubit
```

For faster simulation where available:

```text
lightning.qubit
```

Quantum hardware should be treated as a separate experiment.

---

# 80. Hardware Experiment

Only after simulator validation:

```text
QuantumPneu
    ↓
Hardware-compatible circuit
    ↓
Quantum backend
    ↓
Noisy evaluation
```

Record separately:

```text
Simulator metrics
Hardware metrics
```

Do not mix them.

---

# 81. Model Versioning

Use:

```text
QuantumPneu-v1.0.0
QuantumPneu-v1.1.0
QuantumPneu-v2.0.0
```

Version changes:

```text
Major
Architecture change

Minor
Training/configuration improvement

Patch
Bug fix/reproducibility correction
```

---

# 82. Cross-Disease Architecture

After Pneumonia is added, the platform should support:

```text
/api/v1/skin-cancer/predict
/api/v1/pneumonia/predict
```

and potentially:

```text
/api/v1/models
```

returning:

```json
{
  "models": [
    {
      "disease": "skin_cancer",
      "model": "QuantumDerma"
    },
    {
      "disease": "pneumonia",
      "model": "QuantumPneu"
    }
  ]
}
```

---

# 83. Shared Model Registry

The global registry can eventually look like:

```text
Model Registry
│
├── skin_cancer
│   ├── classical
│   ├── quantum
│   └── production
│
└── pneumonia
    ├── classical
    ├── quantum
    └── production
```

---

# 84. Backend MVC Pattern

For Pneumonia:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Model Registry
    ↓
Inference Engine
```

### Controller

Handles HTTP.

### Service

Handles prediction workflow.

### Repository

Handles persistence/history if required.

### Model Registry

Loads the requested model/version.

### Inference Engine

Runs preprocessing + model prediction.

This preserves the existing MVC/service architecture.

---

# 85. Frontend Feature Architecture

Use:

```text
features/
├── skinCancer/
└── pneumonia/
```

Each feature owns:

```text
pages
components
services
hooks
types
```

Shared components should live separately:

```text
components/common/
```

Do not duplicate authentication, navigation, notifications, or upload primitives.

---

# 86. Docker

The existing Docker infrastructure should be extended rather than duplicated.

Suggested services:

```text
frontend
api
worker
postgres
redis
object-storage
```

Training jobs should not block the API server.

Recommended:

```text
Training container
        ↓
Model artifact
        ↓
Registry
        ↓
Inference container
```

---

# 87. Testing

Add:

```text
tests/pneumonia/
├── test_dataset.py
├── test_preprocessing.py
├── test_pneu_vision.py
├── test_thorax_net.py
├── test_pulmo_lumen.py
├── test_quantum_pneu.py
├── test_quantum_thorax.py
├── test_inference.py
├── test_metrics.py
└── test_api.py
```

---

# 88. Quantum Unit Tests

At minimum verify:

```text
Correct input shape
Correct number of qubits
Correct output shape
Finite outputs
No NaN
Gradient exists
Gradient is finite
Deterministic inference under fixed configuration
```

---

# 89. Integration Tests

Test:

```text
X-ray upload
 ↓
API
 ↓
Preprocessing
 ↓
Model registry
 ↓
PneuVision
 ↓
QuantumPneu
 ↓
Response
```

Also test:

```text
invalid file
corrupt image
oversized image
unknown model
missing model artifact
OOD input
```

---

# 90. Security

Implement:

```text
HTTPS
Authentication
RBAC
MIME validation
Maximum upload size
Safe filenames
Private model storage
Private image storage
Audit logging
Rate limiting
```

Never expose model paths or storage credentials.

---

# 91. Privacy

Chest X-rays may contain patient-related information.

The production architecture should therefore:

```text
avoid unnecessary image persistence
use private storage
encrypt stored data
restrict access
log access
remove metadata where appropriate
```

If images are retained for research, retention rules must be explicitly documented.

---

# 92. Monitoring

Track:

```text
Prediction latency
API latency
Model version
Prediction distribution
Confidence distribution
Image rejection rate
OOD rate
Error rate
Quantum execution time
```

Also monitor:

```text
Feature distribution
```

for drift.

---

# 93. Drift Detection

Monitor:

```text
CNN feature distribution
PCA feature distribution
Quantum feature distribution
Prediction distribution
Confidence distribution
```

Large distribution changes should trigger review.

---

# 94. External Validation

The supplied dataset should be treated as internal development/evaluation data.

For stronger research validation:

```text
Training dataset
      ↓
Internal validation
      ↓
Internal test
      ↓
External chest X-ray dataset
```

The external dataset should not be used for tuning the original model.

---

# 95. Clinical Scope

The model should be documented as:

```text
Research / educational AI model
```

trained on:

```text
Pediatric chest X-ray images
```

It should not claim:

```text
Universal pneumonia diagnosis
```

or:

```text
Adult clinical validation
```

without appropriate independent validation.

---

# 96. Final Production Decision

The production model must be selected using a validation gate.

Example conceptual gate:

```text
Minimum validation requirements
        ↓
Sensitivity acceptable
Specificity acceptable
Calibration acceptable
No major shortcut-learning issue
No leakage
Stable across seeds
Acceptable latency
        ↓
Candidate
```

Then:

```text
Candidate
 ↓
Staging
 ↓
Smoke tests
 ↓
Production
```

The exact numerical thresholds must be defined based on the intended application rather than invented arbitrarily.

---

# 97. Final Research Question

The Pneumonia module should answer:

> **Does a compact hybrid quantum-classical representation provide a reproducible and useful advantage over strong classical chest-X-ray baselines on the supplied pneumonia dataset?**

The correct comparison is:

```text
PneuVision
      vs
ThoraxNet
      vs
PulmoLumen
      vs
QuantumPneu
      vs
QuantumThorax
      vs
PneuQ-Vision
      vs
ThoraxQ-Vortex
      vs
QuantumPneuFusion
```

under the same leakage-safe evaluation protocol.

---

# 98. Final Deliverables

When this module is complete, the project should contain:

```text
1. Dataset audit
2. Clean manifest
3. Validated train/val/test split
4. Three classical models
5. Primary QuantumPneu model
6. Additional QML architectures
7. CNN feature extraction pipeline
8. PCA/scaling pipeline
9. Quantum encoding modules
10. Variational circuit modules
11. Training scripts
12. Evaluation scripts
13. Multi-seed experiments
14. Ablation studies
15. Calibration
16. OOD detection
17. Grad-CAM
18. Quantum feature explainability
19. Error analysis
20. Model registry
21. FastAPI endpoint
22. React interface
23. Tests
24. Docker integration
25. Monitoring
26. Model metadata
27. Reproducible reports
```

---

# 99. Definition of Done

The Pneumonia module is considered complete only when:

- [ ] `datasets/pneumonia` is audited.
- [ ] Train/validation/test integrity is verified.
- [ ] Duplicate/near-duplicate analysis is completed.
- [ ] Dataset manifest is generated.
- [ ] Class imbalance is documented.
- [ ] Image preprocessing is implemented.
- [ ] PneuVision is trained.
- [ ] ThoraxNet is trained.
- [ ] PulmoLumen is trained.
- [ ] Classical models are evaluated.
- [ ] CNN features are extracted.
- [ ] PCA is fitted only on training data.
- [ ] QuantumPneu is implemented.
- [ ] QuantumPneu is trained.
- [ ] QuantumThorax is implemented.
- [ ] PneuQ-Vision is implemented.
- [ ] ThoraxQ-Vortex is implemented.
- [ ] QuantumPneuFusion is implemented.
- [ ] Qubit-count experiments are completed.
- [ ] Embedding experiments are completed.
- [ ] Ansatz experiments are completed.
- [ ] Multiple seeds are evaluated.
- [ ] Sensitivity and specificity are reported.
- [ ] ROC-AUC and PR-AUC are reported.
- [ ] Calibration is evaluated.
- [ ] OOD strategy is implemented.
- [ ] Grad-CAM is implemented.
- [ ] Error analysis is completed.
- [ ] Classical vs QML comparison is completed.
- [ ] Model artifacts are versioned.
- [ ] FastAPI integration is complete.
- [ ] React integration is complete.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] Docker integration works.
- [ ] Documentation is complete.
- [ ] The model's dataset scope and limitations are explicitly documented.

---

# 100. Important Final Principle

The Pneumonia module is an **extension of the completed Skin Cancer QML system**, not a separate application.

The final architecture should therefore look like:

```text
                         MEDICAL AI PLATFORM
                                │
                ┌───────────────┴────────────────┐
                │                                │
                ▼                                ▼
          SKIN CANCER                       PNEUMONIA
                │                                │
        ┌───────┴────────┐               ┌───────┴────────┐
        │                │               │                │
   Classical          QML          Classical           QML
        │                │               │                │
        └───────┬────────┘               └───────┬────────┘
                │                                │
                └───────────────┬────────────────┘
                                │
                       SHARED INFRASTRUCTURE
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
       Registry               API                  Frontend
          │                     │                     │
       Docker                Auth                 Monitoring
          │                     │                     │
       Logging              Storage               Reports
```

The most important implementation rule is:

> **Finish and validate the Skin Cancer pipeline first. Then reuse its proven shared infrastructure while implementing Pneumonia as an isolated disease-specific module under `datasets/pneumonia`, `ml/pneumonia`, `models/pneumonia`, and `reports/pneumonia`.**

Do not assume that the best model is quantum, and do not hard-code a target accuracy. The final model should be selected from the actual experimental results on the supplied dataset, with leakage-safe evaluation, multiple seeds, sensitivity/specificity, calibration, explainability, and documented limitations.
