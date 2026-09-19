# SKIN_CANCER — Quantum Machine Learning Implementation Blueprint

## 1. Purpose

This document defines the complete implementation plan for the `SKIN_CANCER` module using the supplied dataset:

```text
datasets/SKIN_CANCER/
```

The system is designed as a **hybrid classical + Quantum Machine Learning (QML)** pipeline rather than attempting to send raw high-resolution images directly into a quantum circuit.

The objective is to build a reproducible skin-lesion classifier with:

- dataset auditing;
- leakage-safe splitting;
- high-quality image preprocessing;
- classical feature extraction;
- dimensionality reduction;
- a quantum feature/classification layer;
- hybrid classical-quantum training;
- model comparison;
- calibration;
- Grad-CAM / feature explainability where applicable;
- quantum-circuit diagnostics;
- rigorous evaluation;
- FastAPI inference;
- React integration;
- model versioning;
- experiment tracking;
- Docker deployment;
- tests and monitoring.

> **Medical limitation:** this is a research/decision-support system unless separately clinically validated and appropriately regulated. A model prediction is not a diagnosis.

---

# 2. Core Strategy for High Accuracy

A quantum model should **not** receive the original image directly.

A skin image can contain tens or hundreds of thousands of pixel values, while a practical near-term quantum circuit may have only a small number of usable qubits.

The recommended architecture is:

```text
Skin Image
    ↓
Image Quality Check
    ↓
Crop / Resize / Normalize
    ↓
Classical Vision Backbone
    ↓
Compact Learned Feature Vector
    ↓
PCA / Trainable Projection
    ↓
4–12 Quantum Features
    ↓
Quantum Embedding
    ↓
Variational Quantum Circuit
    ↓
Quantum Measurements
    ↓
Classical Classification Head
    ↓
Calibrated Probability
    ↓
Prediction + Explanation
```

This is a **Hybrid Quantum-Classical Neural Network (HQNN)**.

The quantum component should be treated as a trainable feature transformation/classifier, while the classical vision network handles the difficult high-dimensional image representation problem.

---

# 3. Why a Pure Quantum Image Classifier Is Not Recommended

A raw image such as:

```text
224 × 224 × 3
```

contains:

```text
150,528 pixel values
```

Encoding every pixel into independent qubits would require an impractical number of qubits.

Therefore, the recommended approach is:

```text
150,528 pixel values
        ↓
CNN feature extractor
        ↓
128–512 learned features
        ↓
PCA / projection
        ↓
4–12 quantum features
        ↓
Quantum circuit
```

This allows the quantum circuit to operate on a compact representation.

---

# 4. Recommended Model Family

The project should contain multiple models instead of assuming the QML model will automatically outperform a classical CNN.

## Classical baselines

### `DermisNova`

```text
EfficientNet-B0
```

Purpose:

- fast baseline;
- strong transfer-learning starting point;
- suitable for comparison against QML.

### `MelanoVanta`

```text
EfficientNet-B2
```

Purpose:

- stronger feature extractor;
- higher-capacity baseline.

### `DermaLumen`

```text
ConvNeXt-Tiny
```

Purpose:

- modern CNN comparison;
- strong learned image representation.

---

# 5. Quantum Models

## `QuantumDerma`

Primary hybrid QML model.

```text
EfficientNet-B0
      ↓
128 features
      ↓
PCA
      ↓
8 quantum features
      ↓
8-qubit variational circuit
      ↓
classification head
```

## `QuantumDermaX`

Higher-capacity hybrid model.

```text
EfficientNet-B2
      ↓
256 features
      ↓
PCA
      ↓
8–12 quantum features
      ↓
variational quantum circuit
      ↓
classification head
```

## `VitaQ-Derm`

Quantum feature-enhancement model.

```text
CNN feature vector
      ↓
trainable projection
      ↓
quantum feature map
      ↓
measurement vector
      ↓
MLP classifier
```

## `QSkin-Vortex`

Research model using stronger quantum entanglement.

```text
Angle embedding
      ↓
RY/RZ rotations
      ↓
ring entanglement
      ↓
multiple variational layers
      ↓
expectation values
      ↓
classifier
```

## `QDermaFusion`

Ensemble/hybrid fusion model.

```text
Classical CNN probability
          +
Quantum model probability
          ↓
Fusion layer
          ↓
Final probability
```

This should only be used if validation experiments show that fusion improves generalization.

---

# 6. Recommended Final Candidate

Start with:

```text
QuantumDerma
```

because it provides the most practical balance between:

```text
image representation
+
quantum complexity
+
training stability
+
runtime
```

Do not begin with a large quantum circuit.

The first target should be:

```text
8 qubits
2–4 quantum layers
```

Then compare:

```text
4 qubits
6 qubits
8 qubits
10 qubits
12 qubits
```

Only increase circuit size when validation results justify it.

---

# 7. Complete Repository Structure

```text
medical-ai/
│
├── datasets/
│   └── SKIN_CANCER/
│       ├── class_1/
│       ├── class_2/
│       ├── ...
│       └── README.md
│
├── models/
│   └── skin_cancer/
│       ├── classical/
│       │   ├── DermisNova/
│       │   ├── MelanoVanta/
│       │   └── DermaLumen/
│       │
│       ├── quantum/
│       │   ├── QuantumDerma/
│       │   ├── QuantumDermaX/
│       │   ├── VitaQ-Derm/
│       │   └── QSkin-Vortex/
│       │
│       └── production/
│
├── ml/
│   └── skin_cancer/
│       │
│       ├── configs/
│       │   ├── classical.yaml
│       │   ├── quantum.yaml
│       │   └── production.yaml
│       │
│       ├── data/
│       │   ├── audit_dataset.py
│       │   ├── build_manifest.py
│       │   ├── detect_duplicates.py
│       │   ├── split_dataset.py
│       │   ├── dataset_loader.py
│       │   └── image_quality.py
│       │
│       ├── preprocessing/
│       │   ├── transforms.py
│       │   ├── normalize.py
│       │   └── augmentation.py
│       │
│       ├── features/
│       │   ├── extract_cnn_features.py
│       │   ├── pca_features.py
│       │   └── feature_projection.py
│       │
│       ├── classical/
│       │   ├── dermis_nova.py
│       │   ├── melano_vanta.py
│       │   └── derma_lumen.py
│       │
│       ├── quantum/
│       │   ├── quantum_derma.py
│       │   ├── quantum_derma_x.py
│       │   ├── vitaq_derm.py
│       │   ├── qskin_vortex.py
│       │   ├── qderma_fusion.py
│       │   ├── encodings.py
│       │   ├── ansatz.py
│       │   ├── quantum_layers.py
│       │   └── quantum_utils.py
│       │
│       ├── training/
│       │   ├── train_dermis_nova.py
│       │   ├── train_melano_vanta.py
│       │   ├── train_derma_lumen.py
│       │   ├── train_quantum_derma.py
│       │   ├── train_quantum_derma_x.py
│       │   ├── train_vitaq_derm.py
│       │   ├── train_qskin_vortex.py
│       │   └── train_qderma_fusion.py
│       │
│       ├── evaluation/
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
│       │   ├── gradcam.py
│       │   ├── quantum_explanations.py
│       │   └── feature_importance.py
│       │
│       ├── experiments/
│       │   ├── compare_qubit_counts.py
│       │   ├── compare_embeddings.py
│       │   ├── compare_ansatz.py
│       │   ├── compare_classical_quantum.py
│       │   └── ablation_study.py
│       │
│       ├── export/
│       │   ├── export_torchscript.py
│       │   ├── export_onnx.py
│       │   └── package_model.py
│       │
│       └── inference/
│           ├── predictor.py
│           ├── quantum_predictor.py
│           └── schemas.py
│
├── backend/
│   └── app/
│       ├── main.py
│       ├── features/
│       │   └── skin_cancer/
│       │       ├── controller.py
│       │       ├── service.py
│       │       ├── schemas.py
│       │       └── repository.py
│       └── core/
│
├── frontend/
│   └── src/
│       └── features/
│           └── skinCancer/
│               ├── pages/
│               ├── components/
│               ├── services/
│               └── hooks/
│
├── reports/
│   └── skin_cancer/
│
├── tests/
│   ├── data/
│   ├── classical/
│   ├── quantum/
│   ├── api/
│   └── integration/
│
├── docker/
├── requirements.txt
├── docker-compose.yml
└── README.md
```

---

# 8. Important File Naming Convention

The Python filenames intentionally match the model names.

| Model | Main Python file | Training file |
|---|---|---|
| DermisNova | `dermis_nova.py` | `train_dermis_nova.py` |
| MelanoVanta | `melano_vanta.py` | `train_melano_vanta.py` |
| DermaLumen | `derma_lumen.py` | `train_derma_lumen.py` |
| QuantumDerma | `quantum_derma.py` | `train_quantum_derma.py` |
| QuantumDermaX | `quantum_derma_x.py` | `train_quantum_derma_x.py` |
| VitaQ-Derm | `vitaq_derm.py` | `train_vitaq_derm.py` |
| QSkin-Vortex | `qskin_vortex.py` | `train_qskin_vortex.py` |
| QDermaFusion | `qderma_fusion.py` | `train_qderma_fusion.py` |

This makes the project easy to maintain.

---

# 9. Dataset Discovery

The loader should automatically inspect:

```text
datasets/SKIN_CANCER/
```

and discover:

```python
class_names = sorted(
    folder.name
    for folder in dataset_root.iterdir()
    if folder.is_dir()
)
```

Never hard-code:

```python
num_classes = 2
```

unless the supplied dataset is explicitly configured as binary.

Correct:

```python
num_classes = len(class_names)
```

---

# 10. Dataset Audit

Run:

```bash
python -m ml.skin_cancer.data.audit_dataset
```

The audit must calculate:

```text
Total images
Classes
Images per class
Image dimensions
File formats
Corrupted images
Duplicate hashes
Near duplicates
Class imbalance
Missing metadata
```

Generate:

```text
reports/skin_cancer/dataset_audit.json
reports/skin_cancer/class_distribution.png
reports/skin_cancer/image_dimensions.csv
```

---

# 11. Dataset Manifest

Generate:

```bash
python -m ml.skin_cancer.data.build_manifest
```

Output:

```text
reports/skin_cancer/manifest.csv
```

Example:

```csv
path,class,split
class_a/img001.jpg,class_a,train
class_a/img002.jpg,class_a,val
class_b/img003.jpg,class_b,test
```

If patient/lesion identifiers exist, include:

```csv
patient_id
lesion_id
```

---

# 12. Leakage Prevention

This is one of the most important accuracy requirements.

If several images belong to the same patient:

```text
Patient A
 ├── image1
 ├── image2
 └── image3
```

they must not be split like:

```text
train → image1
validation → image2
test → image3
```

Instead:

```text
Patient A → train
```

or:

```text
Patient A → validation
```

or:

```text
Patient A → test
```

as one group.

This prevents inflated test accuracy.

---

# 13. Recommended Data Split

Default:

```text
70% train
15% validation
15% test
```

Alternative for limited data:

```text
80% train
10% validation
10% test
```

For small datasets, use repeated stratified cross-validation during model development while retaining an untouched final test set.

---

# 14. Image Preprocessing

Recommended:

```text
Load
 ↓
RGB
 ↓
Quality check
 ↓
Resize
 ↓
Center crop / controlled crop
 ↓
Tensor
 ↓
Normalization
```

Baseline:

```text
224 × 224
```

Do not aggressively alter:

```text
color
lesion boundaries
texture
asymmetry
pigmentation
```

because these may contain useful information.

---

# 15. Training Augmentation

Use only on the training set:

```text
Horizontal flip
Vertical flip
Small rotation
Random resized crop
Mild affine transform
Mild brightness/contrast
Mild saturation
```

Example:

```python
RandomRotation(15)
RandomHorizontalFlip()
RandomVerticalFlip()
ColorJitter(
    brightness=0.15,
    contrast=0.15,
    saturation=0.10
)
```

Avoid unrealistic augmentation.

---

# 16. Classical Baseline — DermisNova

Architecture:

```text
EfficientNet-B0 pretrained
        ↓
Global Average Pooling
        ↓
Dropout
        ↓
Linear
        ↓
K classes
```

This is the first model that must be trained.

Why?

Because QML cannot be evaluated meaningfully without a strong classical baseline.

If:

```text
DermisNova = 91%
QuantumDerma = 84%
```

then the quantum model is not currently superior.

That result must be reported honestly.

---

# 17. Strong Classical Baselines

Train:

```text
DermisNova
MelanoVanta
DermaLumen
```

before finalizing the quantum architecture.

Compare:

```text
Accuracy
Macro F1
Weighted F1
Sensitivity
Specificity
ROC-AUC
PR-AUC
Calibration
Inference time
Parameter count
```

---

# 18. Quantum Feature Pipeline

The recommended quantum input is not raw pixels.

Use:

```text
Image
 ↓
EfficientNet-B0
 ↓
128/256 feature vector
 ↓
StandardScaler
 ↓
PCA
 ↓
8 dimensions
 ↓
Quantum encoding
```

The PCA transformation must be fitted on training data only.

Correct:

```text
TRAIN features → fit PCA
VALIDATION → transform
TEST → transform
```

Never fit PCA using the entire dataset.

---

# 19. Why PCA Is Used

Suppose the CNN generates:

```text
128 features
```

but the quantum circuit has:

```text
8 qubits
```

PCA reduces:

```text
128 → 8
```

while retaining as much variance as possible according to the training data.

Record:

```text
explained_variance_ratio_
```

and save the PCA object.

---

# 20. Quantum Feature Normalization

Quantum angle encoding is sensitive to the scale of the input.

Recommended:

```text
CNN features
 ↓
StandardScaler
 ↓
PCA
 ↓
MinMax scaling to [-π, π]
 ↓
Quantum circuit
```

Save:

```text
scaler.pkl
pca.pkl
```

alongside the model.

The exact preprocessing must be identical during inference.

---

# 21. Quantum Encoding

Recommended baseline:

```text
AngleEmbedding
```

with:

```text
RX
RY
RZ
```

rotations.

Example conceptual circuit:

```text
q0 ──RY(x0)──RZ(x0)──●────────
                      │
q1 ──RY(x1)──RZ(x1)──X──●─────
                         │
q2 ──RY(x2)──RZ(x2)────X──●───
                            │
q3 ──RY(x3)──RZ(x3)───────X────
```

Use trainable rotations after data encoding.

---

# 22. QuantumDerma Circuit

Recommended starting architecture:

```text
8 qubits
3 variational layers
RY/RZ data encoding
ring entanglement
trainable RY/RZ gates
Pauli-Z measurements
```

Conceptually:

```text
Input features
     ↓
Angle encoding
     ↓
RY/RZ
     ↓
Entanglement ring
     ↓
Trainable layer
     ↓
Entanglement ring
     ↓
Trainable layer
     ↓
Entanglement ring
     ↓
Measurements
```

Output:

```text
8 expectation values
```

These become the input to:

```text
Linear / MLP
```

---

# 23. QuantumDerma Mathematical Structure

Let the CNN produce:

```text
z ∈ R^128
```

PCA produces:

```text
p ∈ R^8
```

Scale:

```text
x ∈ [-π, π]^8
```

Quantum state:

```text
|ψ(x, θ)⟩
```

where:

```text
x = encoded image features
θ = trainable circuit parameters
```

Measurement:

```text
q_i = ⟨ψ(x, θ)|Z_i|ψ(x, θ)⟩
```

Then:

```text
q ∈ R^8
```

and:

```text
logits = MLP(q)
```

Finally:

```text
probabilities = softmax(logits)
```

---

# 24. Hybrid Training

The entire model can be optimized jointly:

```text
CNN
 ↓
Projection
 ↓
Quantum Circuit
 ↓
Classifier
```

However, training a complete CNN and quantum circuit simultaneously can be unstable and expensive.

Recommended staged training:

## Stage A

Train:

```text
DermisNova
```

to obtain a strong visual representation.

## Stage B

Freeze most of the CNN.

Extract:

```text
CNN features
```

## Stage C

Train:

```text
PCA
+
QuantumDerma
```

## Stage D

Unfreeze the last CNN block and perform low-learning-rate hybrid fine-tuning.

This is the recommended path for the first implementation.

---

# 25. Hybrid Learning Rates

Example:

```text
Quantum/classifier:
1e-3

CNN last block:
1e-5

Earlier CNN layers:
frozen
```

This prevents the pretrained feature extractor from being destroyed by unstable quantum gradients.

---

# 26. Quantum Gradient Methods

Potential options:

```text
Parameter-shift
Backpropagation through simulator
Adjoint differentiation
```

For a simulator, use the framework's differentiable interface when available.

For real quantum hardware, parameter-shift or hardware-supported gradient strategies may be required.

Do not assume simulator performance equals real-device performance.

---

# 27. Quantum Simulator

Development should start on a simulator.

Possible stack:

```text
PennyLane
PyTorch
```

Backend:

```text
default.qubit
```

For experiments:

```text
lightning.qubit
```

may be used where compatible.

The production design should not depend on access to a physical quantum computer.

---

# 28. Optional Hardware Experiment

After simulator validation:

```text
QuantumDerma
      ↓
hardware-compatible circuit
      ↓
IBM / other supported backend
```

Hardware runs introduce:

```text
shot noise
gate errors
readout errors
queue time
hardware topology constraints
```

Therefore hardware accuracy should be evaluated separately.

---

# 29. Avoiding Barren Plateaus

Large random variational circuits can produce gradients that become extremely small.

To reduce the risk:

```text
small circuit depth
structured initialization
limited qubit count
local entanglement
small learning rate
layer-wise training
```

Start:

```text
2 layers
```

then test:

```text
3 layers
4 layers
```

Do not automatically use 10+ layers.

---

# 30. Quantum Circuit Initialization

Initialize parameters close to zero or use a carefully controlled initialization.

Example concept:

```text
θ ~ Normal(0, 0.01)
```

rather than very large random angles.

The purpose is to avoid immediately placing the circuit in an unstable highly entangled regime.

---

# 31. Quantum Model Experiments

Run:

```bash
python -m ml.skin_cancer.experiments.compare_qubit_counts
```

Compare:

```text
4 qubits
6 qubits
8 qubits
10 qubits
12 qubits
```

Record:

```text
validation accuracy
macro F1
ROC-AUC
training time
gradient norm
parameter count
```

---

# 32. Encoding Experiments

Run:

```bash
python -m ml.skin_cancer.experiments.compare_embeddings
```

Compare:

```text
AngleEmbedding
AmplitudeEmbedding
BasisEmbedding where appropriate
custom feature map
```

Angle encoding should be the baseline because it is easier to stabilize.

---

# 33. Ansatz Experiments

Run:

```bash
python -m ml.skin_cancer.experiments.compare_ansatz
```

Compare:

```text
BasicEntangler
StronglyEntanglingLayers
Hardware-efficient ansatz
Ring ansatz
Custom RY/RZ + CNOT
```

Choose based on validation performance and training stability.

---

# 34. QML Ablation Study

Run:

```bash
python -m ml.skin_cancer.experiments.ablation_study
```

Experiments:

```text
A. CNN only
B. CNN + PCA + classical MLP
C. CNN + PCA + quantum layer
D. CNN + quantum layer without PCA
E. 4-qubit QML
F. 8-qubit QML
G. 8-qubit QML + calibration
H. Classical + quantum fusion
```

This determines whether the quantum component provides actual value.

---

# 35. Critical Fair Comparison

Every model must use:

```text
same train/test split
same image preprocessing
same test set
same evaluation metrics
```

Do not compare:

```text
CNN on one split
```

against:

```text
QML on another split
```

because the comparison becomes invalid.

---

# 36. Accuracy Optimization Strategy

To achieve the best realistic accuracy with the supplied dataset:

## Step 1

Audit the dataset.

## Step 2

Remove corrupt files.

## Step 3

Check duplicates.

## Step 4

Prevent patient/lesion leakage.

## Step 5

Build a strong classical baseline.

## Step 6

Tune augmentation.

## Step 7

Use class-balanced loss if needed.

## Step 8

Use transfer learning.

## Step 9

Tune image resolution.

## Step 10

Extract robust features.

## Step 11

Train QML on compact features.

## Step 12

Tune qubit count.

## Step 13

Tune circuit depth.

## Step 14

Tune embedding.

## Step 15

Tune optimizer.

## Step 16

Calibrate probabilities.

## Step 17

Perform error analysis.

## Step 18

Use ensemble/fusion only if validation confirms improvement.

---

# 37. Do Not Optimize Only Accuracy

If the dataset is imbalanced, accuracy can be misleading.

For example:

```text
95 benign
5 malignant
```

A model predicting:

```text
benign
```

for every image obtains:

```text
95% accuracy
```

but:

```text
0% malignant recall
```

Therefore monitor:

```text
Macro F1
Sensitivity
Specificity
PR-AUC
ROC-AUC
```

---

# 38. Loss Functions

Start with:

```text
CrossEntropyLoss
```

with class weights when necessary.

For binary classification:

```text
BCEWithLogitsLoss
```

or a two-class cross-entropy formulation.

Optional:

```text
Focal Loss
```

Use focal loss only after establishing a baseline.

---

# 39. Optimizers

Classical CNN:

```text
AdamW
```

Quantum/hybrid:

```text
Adam
AdamW
```

Start with:

```text
learning_rate = 1e-3
```

for the small quantum/classifier component and a lower rate for the fine-tuned CNN.

Use:

```text
ReduceLROnPlateau
```

or:

```text
CosineAnnealing
```

after establishing a baseline.

---

# 40. Early Stopping

Monitor:

```text
validation macro F1
```

or a task-specific metric.

Example:

```text
patience = 7
```

Save:

```text
best_model.pt
```

rather than the final epoch automatically.

---

# 41. Seed and Repeated Runs

QML can have higher variance because of:

```text
parameter initialization
optimization
circuit initialization
```

Run at least:

```text
seed 42
seed 123
seed 2024
```

for final model comparison.

Report:

```text
mean ± standard deviation
```

instead of presenting only the best run.

---

# 42. Cross-Validation

If the supplied dataset is small, use:

```text
Stratified K-Fold
```

or patient-level grouped cross-validation if patient IDs exist.

Recommended:

```text
5-fold
```

during development.

Keep a final untouched test set if dataset size permits.

---

# 43. Test Set Policy

The final test set must remain untouched until:

```text
architecture
hyperparameters
threshold
calibration method
```

have been selected.

Do not repeatedly tune the model against the test set.

Otherwise the test set becomes part of training indirectly.

---

# 44. Required Evaluation Metrics

Every model:

```text
Accuracy
Precision
Recall
F1
Macro F1
Weighted F1
Specificity
Sensitivity
ROC-AUC
PR-AUC
```

Also report:

```text
confusion matrix
per-class metrics
```

For binary classification:

```text
TP
TN
FP
FN
```

---

# 45. Calibration

Measure:

```text
Expected Calibration Error
Brier Score
Reliability Curve
```

If necessary use:

```text
Temperature Scaling
```

Calibration must be fitted using validation data.

The test set is used only for final evaluation.

---

# 46. Prediction Policy

Example:

```text
confidence >= calibrated_threshold
```

does not mean:

```text
confirmed diagnosis
```

Instead:

```text
AI prediction
+
confidence
+
clinical review recommendation
```

should be returned.

---

# 47. Image Quality Model

Before classification:

```text
Image
 ↓
Quality Check
```

Possible features:

```text
blur
brightness
contrast
resolution
exposure
```

If unacceptable:

```json
{
  "status": "rejected",
  "reason": "Image quality is insufficient."
}
```

Do not force a prediction from a poor image.

---

# 48. Grad-CAM for Classical Backbone

For:

```text
DermisNova
MelanoVanta
DermaLumen
```

generate:

```text
original image
heatmap
overlay
```

Command:

```bash
python -m ml.skin_cancer.explainability.gradcam \
    --model DermisNova \
    --image sample.jpg
```

---

# 49. Quantum Explainability

Grad-CAM does not directly explain a quantum circuit.

Instead, record:

```text
PCA feature contribution
quantum measurement sensitivity
parameter sensitivity
input perturbation response
```

Possible method:

```text
feature x_i
 ↓
small perturbation
 ↓
run quantum circuit
 ↓
observe output change
```

This gives:

```text
quantum feature sensitivity
```

rather than a medical heatmap.

---

# 50. Quantum Feature Importance

For each quantum input:

```text
x0
x1
...
x7
```

calculate:

```text
Δprediction
```

after controlled perturbation.

Generate:

```text
quantum_feature_importance.csv
quantum_feature_importance.png
```

---

# 51. Quantum Model Evaluation Script

Run:

```bash
python -m ml.skin_cancer.evaluation.evaluate_quantum \
    --model QuantumDerma \
    --checkpoint models/skin_cancer/quantum/QuantumDerma/best.pt \
    --test-manifest reports/skin_cancer/manifest.csv
```

Generate:

```text
metrics.json
confusion_matrix.png
roc_curve.png
pr_curve.png
calibration.png
predictions.csv
```

---

# 52. Evaluate Everything

Use:

```bash
python -m ml.skin_cancer.evaluation.evaluate_all
```

Output:

```text
reports/skin_cancer/
├── model_comparison.csv
├── model_comparison.png
├── DermisNova/
├── MelanoVanta/
├── DermaLumen/
├── QuantumDerma/
├── QuantumDermaX/
├── VitaQ-Derm/
├── QSkin-Vortex/
└── QDermaFusion/
```

---

# 53. Model Comparison Table

Generate:

| Model | Accuracy | Macro F1 | Sensitivity | Specificity | ROC-AUC | PR-AUC | Params | Time |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| DermisNova | measured | measured | measured | measured | measured | measured | measured | measured |
| MelanoVanta | measured | measured | measured | measured | measured | measured | measured | measured |
| DermaLumen | measured | measured | measured | measured | measured | measured | measured | measured |
| QuantumDerma | measured | measured | measured | measured | measured | measured | measured | measured |
| QuantumDermaX | measured | measured | measured | measured | measured | measured | measured | measured |
| VitaQ-Derm | measured | measured | measured | measured | measured | measured | measured | measured |
| QSkin-Vortex | measured | measured | measured | measured | measured | measured | measured | measured |
| QDermaFusion | measured | measured | measured | measured | measured | measured | measured | measured |

**Never insert invented accuracy numbers.**

---

# 54. Training Files

## Classical

```bash
python -m ml.skin_cancer.training.train_dermis_nova
python -m ml.skin_cancer.training.train_melano_vanta
python -m ml.skin_cancer.training.train_derma_lumen
```

## Quantum

```bash
python -m ml.skin_cancer.training.train_quantum_derma
python -m ml.skin_cancer.training.train_quantum_derma_x
python -m ml.skin_cancer.training.train_vitaq_derm
python -m ml.skin_cancer.training.train_qskin_vortex
python -m ml.skin_cancer.training.train_qderma_fusion
```

---

# 55. Training `QuantumDerma`

Command:

```bash
python -m ml.skin_cancer.training.train_quantum_derma \
    --config ml/skin_cancer/configs/quantum.yaml
```

Pipeline:

```text
Load split
 ↓
Load pretrained CNN
 ↓
Extract features
 ↓
Fit scaler on train
 ↓
Fit PCA on train
 ↓
Transform validation/test
 ↓
Scale angles
 ↓
Initialize quantum circuit
 ↓
Train quantum head
 ↓
Validation
 ↓
Save best checkpoint
```

---

# 56. Quantum Checkpoint

Save:

```text
models/skin_cancer/quantum/QuantumDerma/
├── model.pt
├── quantum_weights.pt
├── cnn_weights.pt
├── scaler.pkl
├── pca.pkl
├── labels.json
├── config.json
├── metrics.json
└── training_history.json
```

This is necessary because the QML model depends on preprocessing state.

Saving only:

```text
quantum_weights.pt
```

is insufficient.

---

# 57. Model Metadata

Example:

```json
{
  "name": "QuantumDerma",
  "version": "1.0.0",
  "architecture": "EfficientNet-B0 + 8-Qubit VQC",
  "qubits": 8,
  "quantum_layers": 3,
  "embedding": "AngleEmbedding",
  "ansatz": "RY-RZ Ring",
  "image_size": 224,
  "pca_components": 8,
  "framework": "PyTorch + PennyLane"
}
```

---

# 58. Inference Pipeline

```text
Image
 ↓
Image validation
 ↓
Image quality
 ↓
Resize
 ↓
Normalization
 ↓
CNN
 ↓
Feature vector
 ↓
Saved scaler
 ↓
Saved PCA
 ↓
Angle scaling
 ↓
Quantum circuit
 ↓
Classifier
 ↓
Softmax
 ↓
Calibration
 ↓
Prediction
```

The inference pipeline must exactly match training preprocessing.

---

# 59. FastAPI Endpoint

Endpoint:

```http
POST /api/v1/skin-cancer/predict
```

Request:

```text
multipart/form-data
image=<file>
model=QuantumDerma
explain=true
```

Response:

```json
{
  "request_id": "uuid",
  "model": {
    "name": "QuantumDerma",
    "version": "1.0.0"
  },
  "prediction": {
    "class": "example_class",
    "confidence": 0.91
  },
  "probabilities": {},
  "quality": {
    "valid": true
  },
  "quantum": {
    "qubits": 8,
    "layers": 3
  },
  "review_required": true
}
```

Class names must come from the trained dataset mapping.

---

# 60. Backend Feature Structure

```text
backend/app/features/skin_cancer/
├── controller.py
├── service.py
├── repository.py
├── schemas.py
└── model.py
```

Controller:

```text
HTTP request
 ↓
validation
 ↓
service
```

Service:

```text
image
 ↓
predictor
 ↓
response
```

Repository:

```text
prediction history
model metadata
```

---

# 61. Frontend

React page:

```text
SkinCancerPage.jsx
```

Components:

```text
SkinCancerUploader.jsx
LesionPreview.jsx
PredictionCard.jsx
ProbabilityChart.jsx
ConfidenceBadge.jsx
QuantumInfoCard.jsx
ExplanationViewer.jsx
MedicalDisclaimer.jsx
```

---

# 62. Frontend Result

Display:

```text
Model:
QuantumDerma v1.0.0

Prediction:
[Class]

Confidence:
91%

Probability distribution:
[chart]

Quantum configuration:
8 qubits
3 layers

Explanation:
[heatmap if classical backbone explanation is available]

Warning:
This AI result is not a diagnosis.
Professional evaluation is required.
```

Do not display:

```text
Cancer confirmed
```

---

# 63. API Model Selection

For development:

```text
model=QuantumDerma
```

For production:

```text
model=production
```

The production alias should resolve through the model registry.

Do not allow arbitrary filesystem paths from the API request.

---

# 64. Model Registry

Recommended:

```text
models/skin_cancer/
├── candidates/
├── staging/
└── production/
```

Promotion:

```text
candidate
   ↓
evaluation
   ↓
validation gate
   ↓
staging
   ↓
smoke test
   ↓
production
```

---

# 65. Production Promotion Rules

A model should not become production solely because:

```text
training accuracy increased
```

Require:

```text
test performance
calibration
per-class performance
error analysis
reproducibility
inference test
```

If QML does not beat the best classical model, keep the classical model as production and retain QML as a research candidate.

This is a critical scientific requirement.

---

# 66. Hyperparameter Search

Recommended search space:

```text
qubits:
4, 6, 8, 10

quantum layers:
1, 2, 3, 4

learning rate:
1e-4
3e-4
1e-3

PCA dimensions:
4, 6, 8, 10, 12

dropout:
0.1
0.2
0.3
0.4

weight decay:
1e-5
1e-4
1e-3
```

Do not search everything simultaneously at the beginning.

Use staged experiments.

---

# 67. Recommended Experiment Order

### Experiment 1

```text
DermisNova
```

### Experiment 2

```text
CNN + PCA + MLP
```

This determines whether PCA itself harms useful information.

### Experiment 3

```text
CNN + 4-qubit QML
```

### Experiment 4

```text
CNN + 6-qubit QML
```

### Experiment 5

```text
CNN + 8-qubit QML
```

### Experiment 6

```text
8 qubits + 2 layers
8 qubits + 3 layers
8 qubits + 4 layers
```

### Experiment 7

```text
different embeddings
```

### Experiment 8

```text
QDermaFusion
```

---

# 68. Quantum vs Classical Benchmark

The benchmark should answer:

```text
Does the quantum layer improve classification?
```

not:

```text
Can a quantum circuit classify an image?
```

A meaningful result is:

```text
Classical baseline:
Macro F1 = X

Quantum:
Macro F1 = Y

Difference:
Y - X
```

and ideally:

```text
mean ± standard deviation
```

over multiple seeds.

---

# 69. Statistical Comparison

For repeated runs:

```text
Seed 42
Seed 123
Seed 2024
```

calculate:

```text
mean
standard deviation
```

Example:

```text
QuantumDerma:
Macro F1 = 0.873 ± 0.012

DermisNova:
Macro F1 = 0.881 ± 0.008
```

The numbers above are examples only.

Never use them as actual project results.

---

# 70. Error Analysis

Generate:

```text
False positives
False negatives
Low-confidence images
High-confidence wrong predictions
Poor-quality images
Class-specific errors
```

The most valuable samples to inspect are:

```text
high-confidence incorrect predictions
```

because they reveal systematic model failure.

---

# 71. Data Augmentation Search

Test:

```text
No augmentation
Basic geometric
Geometric + color
Stronger augmentation
```

Do not automatically assume stronger augmentation produces better results.

Use validation performance.

---

# 72. Class Imbalance

If class counts differ substantially:

```text
N1 >> N2
```

try:

```text
weighted cross entropy
```

first.

Then compare:

```text
weighted sampler
focal loss
```

Monitor minority-class recall.

---

# 73. Ensemble Strategy

Only after individual models are stable.

Example:

```text
DermisNova probability
          +
QuantumDerma probability
          ↓
weighted average
          ↓
QDermaFusion
```

Weights should be learned or selected using validation data only.

Do not optimize ensemble weights on the final test set.

---

# 74. Model Serving

For CPU:

```text
classical model
```

may be significantly easier to serve.

For QML simulator:

```text
quantum inference
```

can be computationally expensive as qubit count and circuit depth increase.

Therefore benchmark:

```text
latency/image
throughput
memory
```

before choosing production deployment.

---

# 75. Quantum Hardware Deployment

A physical quantum backend should be treated as an optional research deployment.

Production inference should initially use:

```text
simulator
```

unless hardware benchmarking demonstrates acceptable:

```text
latency
cost
availability
accuracy
```

---

# 76. Dependencies

Recommended:

```text
torch
torchvision
pennylane
pennylane-lightning
numpy
pandas
scikit-learn
Pillow
opencv-python
matplotlib
seaborn
tqdm
PyYAML
joblib
fastapi
uvicorn
python-multipart
pydantic
```

Optional:

```text
mlflow
optuna
grad-cam
```

For hardware-specific experiments, install only the SDK required by the selected provider.

---

# 77. Environment

Example:

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Install:

```bash
pip install -r requirements.txt
```

---

# 78. Dataset Audit Command

```bash
python -m ml.skin_cancer.data.audit_dataset \
    --root datasets/SKIN_CANCER
```

---

# 79. Build Manifest

```bash
python -m ml.skin_cancer.data.build_manifest \
    --root datasets/SKIN_CANCER
```

---

# 80. Split Dataset

```bash
python -m ml.skin_cancer.data.split_dataset \
    --manifest reports/skin_cancer/manifest.csv
```

---

# 81. Train Classical Models

```bash
python -m ml.skin_cancer.training.train_dermis_nova
python -m ml.skin_cancer.training.train_melano_vanta
python -m ml.skin_cancer.training.train_derma_lumen
```

---

# 82. Extract Features

```bash
python -m ml.skin_cancer.features.extract_cnn_features \
    --model DermisNova
```

---

# 83. PCA

```bash
python -m ml.skin_cancer.features.pca_features \
    --features reports/skin_cancer/features/
```

Save:

```text
pca.pkl
scaler.pkl
```

---

# 84. Train Quantum Models

```bash
python -m ml.skin_cancer.training.train_quantum_derma
python -m ml.skin_cancer.training.train_quantum_derma_x
python -m ml.skin_cancer.training.train_vitaq_derm
python -m ml.skin_cancer.training.train_qskin_vortex
```

---

# 85. Evaluate

```bash
python -m ml.skin_cancer.evaluation.evaluate_quantum
```

All models:

```bash
python -m ml.skin_cancer.evaluation.evaluate_all
```

---

# 86. Explainability

Classical Grad-CAM:

```bash
python -m ml.skin_cancer.explainability.gradcam
```

Quantum feature sensitivity:

```bash
python -m ml.skin_cancer.explainability.quantum_explanations
```

---

# 87. Model Packaging

```bash
python -m ml.skin_cancer.export.package_model \
    --model QuantumDerma
```

Output:

```text
models/skin_cancer/production/
```

---

# 88. FastAPI

Development:

```bash
uvicorn backend.app.main:app --reload --port 8000
```

Swagger:

```text
/docs
```

ReDoc:

```text
/redoc
```

---

# 89. Docker

Recommended services:

```text
frontend
api
worker
postgres
redis
minio
```

Training should normally remain separate from the production API container.

---

# 90. Database

PostgreSQL tables:

```text
users
model_versions
predictions
audit_events
```

Prediction record:

```text
id
user_id
model_version
predicted_class
confidence
probabilities
image_reference
explanation_reference
created_at
```

---

# 91. Object Storage

Use:

```text
S3
MinIO
R2
```

Store:

```text
input image
Grad-CAM
generated artifacts
```

only when required.

Use database references instead of binary blobs in PostgreSQL.

---

# 92. Security

Implement:

```text
HTTPS
JWT/session authentication
role-based access
file size limits
MIME validation
server-side filenames
rate limiting
audit logs
environment secrets
private storage
```

Never log:

```text
password
JWT
raw medical image
private storage credential
```

---

# 93. Monitoring

Track:

```text
prediction latency
API errors
model version
class distribution
confidence distribution
low-confidence rate
image rejection rate
quantum circuit execution time
```

For QML:

```text
average circuit runtime
number of qubits
number of layers
backend
```

---

# 94. Drift Monitoring

Monitor:

```text
image embedding distribution
PCA distribution
quantum feature distribution
class distribution
confidence distribution
```

If production distribution changes substantially:

```text
trigger investigation
```

Do not automatically retrain without data-quality review.

---

# 95. Retraining

Retraining workflow:

```text
New labeled data
 ↓
Data audit
 ↓
Deduplication
 ↓
Leakage check
 ↓
Version dataset
 ↓
Train
 ↓
Evaluate
 ↓
Compare with production
 ↓
Calibration
 ↓
Review
 ↓
Promotion
```

---

# 96. Model Versioning

Example:

```text
QuantumDerma-v1.0.0
QuantumDerma-v1.1.0
QuantumDerma-v2.0.0
```

Version should change when:

```text
architecture changes
preprocessing changes
class mapping changes
training dataset changes materially
```

---

# 97. Dataset Versioning

Example:

```text
SKIN_CANCER-v1
SKIN_CANCER-v2
SKIN_CANCER-v3
```

Record:

```text
dataset hash
number of images
class distribution
split hash
source
date
```

---

# 98. Experiment Tracking

Every experiment should save:

```text
experiment ID
seed
dataset version
model
qubits
layers
embedding
ansatz
optimizer
learning rate
batch size
epochs
metrics
runtime
```

Example:

```json
{
  "experiment": "QD-008",
  "model": "QuantumDerma",
  "seed": 42,
  "qubits": 8,
  "layers": 3,
  "embedding": "angle",
  "ansatz": "ring",
  "lr": 0.001
}
```

---

# 99. Reproducibility

Save:

```text
requirements.txt
config.yaml
seed
dataset manifest
PCA
scaler
model weights
labels
metrics
```

A model should be reproducible from its metadata.

---

# 100. Testing

## Dataset tests

```text
class discovery
image loading
corrupt files
split integrity
duplicate detection
```

## Quantum tests

```text
circuit output shape
qubit count
gradient existence
finite loss
no NaN
measurement range
```

## Model tests

```text
checkpoint loads
class count matches
prediction shape
probability sum
```

## API tests

```text
valid image
invalid image
oversized image
unauthorized request
model unavailable
```

---

# 101. Quantum Unit Test Example

The circuit should satisfy:

```text
input shape = [batch, n_qubits]
output shape = [batch, n_qubits]
```

and measurement values should normally lie in the expected observable range.

For Pauli-Z expectation:

```text
-1 <= expectation <= 1
```

---

# 102. Accuracy Expectations

There is **no scientifically valid fixed accuracy number** that can be promised before running experiments on the supplied dataset.

The final accuracy depends on:

```text
dataset size
class balance
label quality
image quality
patient diversity
disease distribution
data leakage
train/test split
architecture
hyperparameters
hardware
```

Therefore the project should report:

```text
measured test accuracy
measured macro F1
measured sensitivity
measured specificity
measured ROC-AUC
```

rather than claiming:

```text
95% accuracy guaranteed
```

---

# 103. What "High Accuracy" Means Here

The practical objective is:

```text
strong classical baseline
+
well-designed feature extraction
+
stable QML layer
+
leakage-free evaluation
+
calibration
+
error analysis
```

not:

```text
maximum training accuracy
```

The best model is the model with the best trustworthy generalization.

---

# 104. Recommended Final Model Selection

Use this decision:

```text
                 Compare
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
     Classical             Quantum
          │                   │
          └─────────┬─────────┘
                    ▼
             Validation gate
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
 Quantum improves         Classical better
 meaningfully                 or equal
        │                       │
        ▼                       ▼
 QML candidate/production   Classical production
```

There is no requirement that the quantum model must win.

A scientifically correct project can conclude:

```text
QML did not outperform the strongest classical baseline on this dataset.
```

That is a valid experimental result.

---

# 105. Recommended Production Candidate

The production alias should point to whichever model wins the complete evaluation.

Potential candidates:

```text
DermisNova
MelanoVanta
DermaLumen
QuantumDerma
QuantumDermaX
QDermaFusion
```

The system must not hard-code:

```text
QuantumDerma = production
```

before evaluation.

---

# 106. Full End-to-End Workflow

```text
                DATASET
                   │
                   ▼
          audit_dataset.py
                   │
                   ▼
          build_manifest.py
                   │
                   ▼
          split_dataset.py
                   │
                   ▼
             preprocessing
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
 Classical                 Feature
 training                  extraction
        │                     │
        ▼                     ▼
 DermisNova              PCA + scaling
 MelanoVanta                  │
 DermaLumen                   ▼
        │                QuantumDerma
        │                QuantumDermaX
        │                VitaQ-Derm
        │                QSkin-Vortex
        │                     │
        └──────────┬──────────┘
                   ▼
             evaluation
                   │
                   ▼
          calibration + error
             analysis
                   │
                   ▼
            model comparison
                   │
                   ▼
            model registry
                   │
                   ▼
              FastAPI
                   │
                   ▼
              React UI
                   │
                   ▼
          prediction + review
```

---

# 107. Final Implementation Checklist

## Dataset

- [ ] `datasets/SKIN_CANCER` exists.
- [ ] Classes discovered dynamically.
- [ ] Dataset audit completed.
- [ ] Corrupt images handled.
- [ ] Duplicates checked.
- [ ] Patient/lesion leakage checked.
- [ ] Manifest generated.
- [ ] Split frozen.

## Classical ML

- [ ] DermisNova trained.
- [ ] MelanoVanta trained.
- [ ] DermaLumen trained.
- [ ] Best checkpoint saved.
- [ ] Metrics generated.

## QML

- [ ] QuantumDerma implemented.
- [ ] QuantumDermaX implemented.
- [ ] VitaQ-Derm implemented.
- [ ] QSkin-Vortex implemented.
- [ ] QDermaFusion implemented.
- [ ] PCA fitted only on training data.
- [ ] Quantum features normalized.
- [ ] Circuit gradients verified.
- [ ] Multiple seeds tested.
- [ ] Qubit ablation performed.
- [ ] Ansatz ablation performed.
- [ ] Embedding ablation performed.

## Evaluation

- [ ] Accuracy.
- [ ] Precision.
- [ ] Recall.
- [ ] Sensitivity.
- [ ] Specificity.
- [ ] F1.
- [ ] Macro F1.
- [ ] ROC-AUC.
- [ ] PR-AUC.
- [ ] Confusion matrix.
- [ ] Calibration.
- [ ] Error analysis.
- [ ] Model comparison.

## Production

- [ ] Model registry.
- [ ] Versioned artifacts.
- [ ] FastAPI endpoint.
- [ ] Input validation.
- [ ] Authentication.
- [ ] Authorization.
- [ ] React UI.
- [ ] Explainability.
- [ ] Logging.
- [ ] Monitoring.
- [ ] Docker.
- [ ] Tests.
- [ ] CI/CD.

---

# 108. Final Recommended Project Structure

```text
SKIN-CANCER-QML/
│
├── datasets/
│   └── SKIN_CANCER/
│
├── ml/
│   └── skin_cancer/
│       ├── data/
│       │   ├── audit_dataset.py
│       │   ├── build_manifest.py
│       │   ├── detect_duplicates.py
│       │   ├── split_dataset.py
│       │   ├── dataset_loader.py
│       │   └── image_quality.py
│       │
│       ├── preprocessing/
│       │   ├── transforms.py
│       │   ├── normalize.py
│       │   └── augmentation.py
│       │
│       ├── classical/
│       │   ├── dermis_nova.py
│       │   ├── melano_vanta.py
│       │   └── derma_lumen.py
│       │
│       ├── quantum/
│       │   ├── quantum_derma.py
│       │   ├── quantum_derma_x.py
│       │   ├── vitaq_derm.py
│       │   ├── qskin_vortex.py
│       │   ├── qderma_fusion.py
│       │   ├── encodings.py
│       │   ├── ansatz.py
│       │   └── quantum_layers.py
│       │
│       ├── training/
│       │   ├── train_dermis_nova.py
│       │   ├── train_melano_vanta.py
│       │   ├── train_derma_lumen.py
│       │   ├── train_quantum_derma.py
│       │   ├── train_quantum_derma_x.py
│       │   ├── train_vitaq_derm.py
│       │   ├── train_qskin_vortex.py
│       │   └── train_qderma_fusion.py
│       │
│       ├── evaluation/
│       │   ├── evaluate_classical.py
│       │   ├── evaluate_quantum.py
│       │   ├── evaluate_all.py
│       │   ├── metrics.py
│       │   ├── confusion_matrix.py
│       │   ├── roc_pr.py
│       │   ├── calibration.py
│       │   └── error_analysis.py
│       │
│       ├── experiments/
│       │   ├── compare_qubit_counts.py
│       │   ├── compare_embeddings.py
│       │   ├── compare_ansatz.py
│       │   ├── compare_classical_quantum.py
│       │   └── ablation_study.py
│       │
│       ├── explainability/
│       │   ├── gradcam.py
│       │   ├── quantum_explanations.py
│       │   └── feature_importance.py
│       │
│       ├── export/
│       │   ├── export_onnx.py
│       │   ├── export_torchscript.py
│       │   └── package_model.py
│       │
│       └── inference/
│           ├── predictor.py
│           ├── quantum_predictor.py
│           └── schemas.py
│
├── models/
│   └── skin_cancer/
│
├── backend/
├── frontend/
├── reports/
├── tests/
├── docker/
├── requirements.txt
└── README.md
```

---

# 109. Bottom Line

The correct implementation for the supplied `SKIN_CANCER` dataset is:

```text
             SKIN_CANCER DATASET
                      │
                      ▼
               DATA QUALITY
                      │
                      ▼
              LEAKAGE-SAFE SPLIT
                      │
                      ▼
             STRONG CNN BASELINE
                      │
             ┌────────┴────────┐
             ▼                 ▼
        Classical          CNN FEATURES
        benchmark              │
                               ▼
                           PCA / SCALE
                               │
                               ▼
                         4–12 FEATURES
                               │
                               ▼
                     QUANTUM ENCODING
                               │
                               ▼
                       VARIATIONAL QNN
                               │
                               ▼
                         CLASSIFIER
                               │
                               ▼
                   CALIBRATION + OOD
                               │
                               ▼
                      FINAL EVALUATION
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
          QML genuinely better          Classical better
                 │                           │
                 ▼                           ▼
          QML candidate                  Classical
          / production                  production
```

The strongest scientifically defensible target is **not a promised percentage**. It is a reproducible experiment that determines whether `QuantumDerma`, `QuantumDermaX`, or another QML architecture genuinely improves over `DermisNova`, `MelanoVanta`, and `DermaLumen` on the exact supplied dataset.

All reported accuracy, F1, sensitivity, specificity, and AUC values must be generated from the actual dataset after training and evaluation.
