# Quantum Engine & VQC Inference API Specification

The **Quantum Engine API** provides low-latency execution interfaces for PennyLane variational quantum circuits, quantum kernel computations, Pauli-Z expectation extractions, and hardware noise simulator telemetry.

Base Path: `/api/v1/quantum`

---

## Table of Contents
1. [Quantum Inference (`POST /infer`)](#1-quantum-inference-post-infer)
2. [Quantum Kernel Matrix Computation (`POST /kernel-matrix`)](#2-quantum-kernel-matrix-computation-post-kernel-matrix)
3. [Circuit Telemetry & Barren Plateau Monitoring (`GET /models/{name}/telemetry`)](#3-circuit-telemetry--barren-plateau-monitoring-get-modelsnametelemetry)
4. [Hardware Backend Profiles (`GET /backends`)](#4-hardware-backend-profiles-get-backends)
5. [Client Examples (Python & cURL)](#5-client-examples-python--curl)

---

## 1. Quantum Inference (`POST /infer`)

Executes parameterized variational quantum inference on normalized biomedical feature vectors ($x \in [0, \pi]^n$).

### Request Body
```json
{
  "disease_type": "breast_cancer",
  "features": [0.382, 0.741, 0.129, 0.902, 0.445, 0.621, 0.289, 0.834],
  "backend": "default.qubit",
  "shots": null,
  "enable_conformal_calibration": true
}
```

### Parameters
- `disease_type` (string, required): One of `breast_cancer`, `heart_disease`, `parkinsons`, `diabetes`.
- `features` (array of floats, required): MinMax normalized float vector matching model qubit count $N_q \in \{6, 8\}$.
- `backend` (string, optional): `default.qubit` (analytic statevector), `default.mixed` (density matrix with noise), or `qiskit.aer` (shot-based).
- `shots` (integer, optional): Number of Monte Carlo shots. If `null`, computes exact analytic statevector expectations.
- `enable_conformal_calibration` (boolean, optional): Default `true`. Computes inductive split-conformal prediction intervals.

### Response (`200 OK`)
```json
{
  "model_name": "OncoPulse-VQC",
  "prediction": 1,
  "label": "Malignant",
  "raw_expectation_value": 0.5284,
  "calibrated_probability": 0.7674,
  "conformal_prediction_set": ["Malignant"],
  "marginal_coverage_guarantee": 0.90,
  "qubit_measurements": [
    {"qubit": 0, "pauli_z_expectation": 0.4321},
    {"qubit": 1, "pauli_z_expectation": -0.8124},
    {"qubit": 2, "pauli_z_expectation": 0.1542},
    {"qubit": 3, "pauli_z_expectation": -0.6391},
    {"qubit": 4, "pauli_z_expectation": 0.7210},
    {"qubit": 5, "pauli_z_expectation": -0.4019},
    {"qubit": 6, "pauli_z_expectation": 0.2988},
    {"qubit": 7, "pauli_z_expectation": -0.5843}
  ],
  "circuit_metadata": {
    "num_qubits": 8,
    "circuit_depth": 3,
    "total_gates": 56,
    "cnot_gates": 16,
    "single_qubit_rotations": 40,
    "execution_time_ms": 1.45,
    "backend_device": "PennyLane default.qubit (statevector simulator)"
  },
  "safety_routing": {
    "recommended_deployment": "Sentinel-SVM",
    "reason": "Classical Sentinel-SVM achieves superior specificity (0.9062 vs 0.4688) and accuracy (96.51% vs 76.74%) on tabular WDBC."
  }
}
```

---

## 2. Quantum Kernel Matrix Computation (`POST /kernel-matrix`)

Computes fidelity transition overlap matrices for Quantum Support Vector Machines (QSVM):

$$K_{i,j} = |\langle \Phi(x_i) | \Phi(x_j) \rangle|^2$$

### Request Body
```json
{
  "samples_a": [
    [0.12, 0.45, 0.78, 0.33],
    [0.65, 0.21, 0.09, 0.87]
  ],
  "samples_b": [
    [0.12, 0.45, 0.78, 0.33],
    [0.91, 0.82, 0.73, 0.64]
  ],
  "feature_map": "ZZFeatureMap",
  "reps": 2
}
```

### Response (`200 OK`)
```json
{
  "kernel_matrix": [
    [1.000000, 0.241829],
    [0.312948, 0.198421]
  ],
  "dimension": [2, 2],
  "gram_matrix_condition_number": 4.128,
  "symmetric": false
}
```

---

## 3. Circuit Telemetry & Barren Plateau Monitoring (`GET /models/{name}/telemetry`)

Returns live variance of the cost function gradients across training updates:

$$\text{Var}[\partial_\theta \mathcal{L}]$$

When gradient variance drops below $10^{-6}$, the system automatically flags a **Barren Plateau Risk** and triggers layer-wise initialization.

### Response (`200 OK`)
```json
{
  "model_name": "OncoPulse-VQC",
  "gradient_variance": 0.003418,
  "barren_plateau_detected": false,
  "average_gate_fidelity": 0.9982,
  "coherence_time_t1_us": 120.5,
  "coherence_time_t2_us": 85.2,
  "parameter_count": 48,
  "trainable_weights": [
    0.142, -0.984, 0.512, 1.284, -0.321, 0.879
  ]
}
```

---

## 4. Hardware Backend Profiles (`GET /backends`)

Lists available PennyLane simulation backends and emulated hardware adapters:

```json
{
  "available_backends": [
    {
      "id": "default.qubit",
      "type": "Ideal Statevector Simulator",
      "max_qubits": 28,
      "noise_supported": false,
      "latency_profile": "Ultra-Low (<2ms)"
    },
    {
      "id": "noisy.ibm_eagle",
      "type": "Emulated Superconducting QPU (127Q)",
      "max_qubits": 16,
      "noise_supported": true,
      "depolarizing_error_1q": 0.0002,
      "depolarizing_error_2q": 0.0085,
      "readout_error": 0.0150
    },
    {
      "id": "noisy.ionq_forte",
      "type": "Emulated Trapped-Ion QPU (36Q)",
      "max_qubits": 16,
      "noise_supported": true,
      "depolarizing_error_1q": 0.00005,
      "depolarizing_error_2q": 0.0030,
      "readout_error": 0.0040
    }
  ]
}
```

---

## 5. Client Examples (Python & cURL)

### cURL
```bash
curl -X POST http://localhost:8000/api/v1/quantum/infer \
  -H "Content-Type: application/json" \
  -d '{
    "disease_type": "breast_cancer",
    "features": [0.38, 0.74, 0.12, 0.90, 0.44, 0.62, 0.28, 0.83]
  }'
```

### Python
```python
import requests

url = "http://localhost:8000/api/v1/quantum/infer"
payload = {
    "disease_type": "heart_disease",
    "features": [0.45, 0.88, 0.32, 0.67, 0.51, 0.29],
    "backend": "default.qubit"
}

response = requests.post(url, json=payload)
data = response.json()

print(f"Model: {data['model_name']}")
print(f"Prediction: {data['label']} (Prob: {data['calibrated_probability']:.4f})")
print(f"Circuit Depth: {data['circuit_metadata']['circuit_depth']}")
```
