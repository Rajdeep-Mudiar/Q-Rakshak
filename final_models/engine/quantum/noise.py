from __future__ import annotations

from typing import Any
import numpy as np


class NoiseTelemetry:
    """Simulates quantum noise channel parameters (T1 relaxation, T2 dephasing, gate error rate)."""

    def __init__(self, t1_us: float = 50.0, t2_us: float = 70.0, single_qubit_error: float = 1e-3, two_qubit_error: float = 1e-2):
        self.t1 = t1_us
        self.t2 = t2_us
        self.p_single = single_qubit_error
        self.p_two = two_qubit_error

    def compute_circuit_fidelity(self, n_qubits: int, depth: int) -> float:
        """Estimates circuit execution fidelity under parameterized depolarizing & dephasing noise."""
        total_single_gates = n_qubits * depth * 3
        total_two_gates = n_qubits * depth
        fid_single = (1.0 - self.p_single) ** total_single_gates
        fid_two = (1.0 - self.p_two) ** total_two_gates
        return float(np.clip(fid_single * fid_two, 0.0, 1.0))

    def get_noise_profile(self, n_qubits: int, depth: int) -> dict[str, Any]:
        return {
            "t1_relaxation_us": self.t1,
            "t2_dephasing_us": self.t2,
            "single_qubit_error_rate": self.p_single,
            "two_qubit_error_rate": self.p_two,
            "estimated_circuit_fidelity": round(self.compute_circuit_fidelity(n_qubits, depth), 4),
        }
