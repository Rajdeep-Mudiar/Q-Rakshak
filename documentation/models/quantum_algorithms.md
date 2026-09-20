# Quantum Algorithms & Circuit Topologies

This document explains the mathematical foundations and PennyLane circuit implementations for Variational Quantum Classifiers (VQC) and Quantum Support Vector Machines (QSVM) in Q-RAKSHAK.

---

## 1. Feature Map & State Encoding

For a classical input vector $x = [x_1, x_2, \dots, x_n]^T \in [0, \pi]^n$, the system applies angle embedding:

$$|\psi_0(x)\rangle = \bigotimes_{i=1}^n R_y(x_i) |0\rangle$$

For pairwise quantum feature interactions (used in QSVM), second-order Pauli feature maps are applied:

$$U_{\Phi(x)} = \exp\left( i \sum_{j=1}^n x_j Z_j + i \sum_{j=1}^n \sum_{k=j+1}^n (\pi - x_j)(\pi - x_k) Z_j Z_k \right)$$

---

## 2. Variational Quantum Ansatz

The parameterizable ansatz $W(\theta)$ comprises $L$ layers of single-qubit rotations followed by entangling CNOT gates:

$$W(\theta) = \prod_{l=1}^L \left[ U_{\text{ent}} \cdot \left( \bigotimes_{i=1}^n R_z(\theta_{l,i,2}) R_x(\theta_{l,i,1}) R_y(\theta_{l,i,0}) \right) \right]$$

### Circular CNOT Entanglement:
```
q_0: X
                      
q_1: X
                      
q_2: X
                      
q_3: X
```

---

## 3. Parameter-Shift Optimization Rule

Gradients with respect to variational parameters $\theta_j$ are calculated analytically on quantum simulators and hardware via the parameter-shift rule without numerical finite-difference errors:

$$\frac{\partial \langle \hat{O} \rangle}{\partial \theta_j} = \frac{1}{2} \left[ \langle \hat{O} \rangle_{\theta_j + \frac{\pi}{2}} - \langle \hat{O} \rangle_{\theta_j - \frac{\pi}{2}} \right]$$

---

## 4. Quantum Kernel Construction

The quantum kernel computes the inner product Hilbert space transition probability between clinical samples:

$$K(x_a, x_b) = |\langle \Phi(x_a) | \Phi(x_b) \rangle|^2 = \text{Tr}\left[ \rho(x_a) \rho(x_b) \right]$$
