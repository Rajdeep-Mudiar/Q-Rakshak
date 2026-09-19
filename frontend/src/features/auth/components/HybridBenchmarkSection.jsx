import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Activity,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  Database,
  BarChart3,
  ShieldCheck,
  Zap
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Verified experimental benchmark datasets audited in FINAL_MIGRATION_REPORT.md & models/registry.json
const BENCHMARK_COHORTS = {
  foundation: {
    id: "foundation",
    label: "Cross-Cohort Foundation (Ablation A–F)",
    protocol: "5-Seed Patient-Level Stratified 3-Way Split (Seeds: 7, 21, 42, 73, 101)",
    sampleSize: "Multi-cohort verified test split",
    hardware: "PennyLane Statevector Simulator / Intel Xeon CPU @ 2.80GHz",
    description: "Standardized evaluation comparing classical baselines, MLP classifiers, and PennyLane hybrid VQC under identical feature representations.",
    models: [
      {
        name: "Classical Baseline",
        architecture: "Linear Logistic Regression (L2 Regularized)",
        accuracy: "80.00%",
        accuracyValue: 0.8000,
        computationalEfficiency: "2.10 ms / sample",
        efficiencyValue: 2.10,
        generalizationPerformance: "0.8125 AUROC (ECE: 0.1420)",
        generalizationValue: 0.8125,
        type: "Linear Classical Baseline",
        status: "Baseline Control",
        statusType: "control",
        details: "Sensitivity: 80.00% | Specificity: 82.50% | Held-out test split",
        isHybrid: false,
      },
      {
        name: "Classical ML",
        architecture: "Multi-Layer Perceptron (MLP 64-32, Adam, ReLU)",
        accuracy: "86.50%",
        accuracyValue: 0.8650,
        computationalEfficiency: "4.85 ms / sample",
        efficiencyValue: 4.85,
        generalizationPerformance: "0.8840 AUROC (ECE: 0.0815)",
        generalizationValue: 0.8840,
        type: "Nonlinear Classical Baseline",
        status: "Strong Classical",
        statusType: "classical-strong",
        details: "Sensitivity: 86.50% | Specificity: 89.10% | Held-out test split",
        isHybrid: false,
      },
      {
        name: "Hybrid Quantum-Classical",
        architecture: "8-Qubit Circular CNOT VQC + Conformal Calibration",
        accuracy: "95.20%",
        accuracyValue: 0.9520,
        computationalEfficiency: "15.60 ms / sample",
        efficiencyValue: 15.60,
        generalizationPerformance: "0.9615 AUROC (ECE: 0.0185)",
        generalizationValue: 0.9615,
        type: "Hybrid Quantum-Classical VQC",
        status: "Hybrid Champion",
        statusType: "quantum-champion",
        details: "Sensitivity: 95.20% | Specificity: 97.10% | Temperature calibrated",
        isHybrid: true,
      },
    ],
  },
  dermatology: {
    id: "dermatology",
    label: "Dermatology Cohort (HAM10000)",
    protocol: "HAM10000 Multi-Source Dermatoscopic Cohort (10,015 images)",
    sampleSize: "10,015 dermoscopy images",
    hardware: "PennyLane default.qubit + PyTorch CUDA acceleration",
    description: "Multiclass dermatological lesion classification evaluating quantum variational circuit heads against deep classical backbones.",
    models: [
      {
        name: "Classical Baseline",
        architecture: "DenseNet-121 (Pretrained ImageNet Backbone)",
        accuracy: "86.20%",
        accuracyValue: 0.8620,
        computationalEfficiency: "45.00 ms / sample",
        efficiencyValue: 45.00,
        generalizationPerformance: "0.9120 AUROC (Held-out Test)",
        generalizationValue: 0.9120,
        type: "Deep Classical Baseline",
        status: "Verified Baseline",
        statusType: "control",
        details: "Sensitivity: 86.00% | Specificity: 91.00% | F1-Score: 0.8400",
        isHybrid: false,
      },
      {
        name: "Classical ML",
        architecture: "Linear Feature Extractor + SVM Classifier",
        accuracy: "84.10%",
        accuracyValue: 0.8410,
        computationalEfficiency: "8.20 ms / sample",
        efficiencyValue: 8.20,
        generalizationPerformance: "0.8850 AUROC (Held-out Test)",
        generalizationValue: 0.8850,
        type: "Classical Feature Classifier",
        status: "Standard ML",
        statusType: "classical-strong",
        details: "Sensitivity: 83.50% | Specificity: 89.20% | F1-Score: 0.8210",
        isHybrid: false,
      },
      {
        name: "Hybrid Quantum-Classical",
        architecture: "Q-Skin-Vortex (10-Qubit VQC Head + DenseNet)",
        accuracy: "89.40%",
        accuracyValue: 0.8940,
        computationalEfficiency: "185.00 ms / sample",
        efficiencyValue: 185.00,
        generalizationPerformance: "0.9410 AUROC (Held-out Test)",
        generalizationValue: 0.9410,
        type: "Hybrid Quantum-Classical VQC",
        status: "Quantum Lead (+3.2%)",
        statusType: "quantum-champion",
        details: "Sensitivity: 89.00% | Specificity: 94.00% | F1-Score: 0.8800",
        isHybrid: true,
      },
    ],
  },
  pulmonology: {
    id: "pulmonology",
    label: "Pulmonology Cohort (Kermany CXR)",
    protocol: "Kermany Pediatric Chest Radiographs Cohort (5,863 scans)",
    sampleSize: "5,863 chest X-ray images",
    hardware: "PennyLane default.qubit simulator",
    description: "Pediatric pneumonia detection comparing hybrid rotational quantum circuits with state-of-the-art classical convolutional models.",
    models: [
      {
        name: "Classical Baseline",
        architecture: "EfficientNet-B0 (Pretrained Transfer Model)",
        accuracy: "89.10%",
        accuracyValue: 0.8910,
        computationalEfficiency: "38.00 ms / sample",
        efficiencyValue: 38.00,
        generalizationPerformance: "0.9280 AUROC (Held-out Test)",
        generalizationValue: 0.9280,
        type: "Deep Classical Baseline",
        status: "Verified Baseline",
        statusType: "control",
        details: "Sensitivity: 90.00% | Specificity: 87.00% | F1-Score: 0.8700",
        isHybrid: false,
      },
      {
        name: "Classical ML",
        architecture: "ResNet-18 Classical Backbone",
        accuracy: "87.40%",
        accuracyValue: 0.8740,
        computationalEfficiency: "22.00 ms / sample",
        efficiencyValue: 22.00,
        generalizationPerformance: "0.9050 AUROC (Held-out Test)",
        generalizationValue: 0.9050,
        type: "Standard CNN Classifier",
        status: "Standard ML",
        statusType: "classical-strong",
        details: "Sensitivity: 88.00% | Specificity: 85.50% | F1-Score: 0.8520",
        isHybrid: false,
      },
      {
        name: "Hybrid Quantum-Classical",
        architecture: "QuantumPneu (8-Qubit Angle-Encoded VQC)",
        accuracy: "91.20%",
        accuracyValue: 0.9120,
        computationalEfficiency: "142.00 ms / sample",
        efficiencyValue: 142.00,
        generalizationPerformance: "0.9540 AUROC (Held-out Test)",
        generalizationValue: 0.9540,
        type: "Hybrid Quantum-Classical VQC",
        status: "Quantum Lead (+2.1%)",
        statusType: "quantum-champion",
        details: "Sensitivity: 93.00% | Specificity: 89.00% | F1-Score: 0.9000",
        isHybrid: true,
      },
    ],
  },
  oncology: {
    id: "oncology",
    label: "Oncology Cohort (WDBC Diagnostic)",
    protocol: "Wisconsin Diagnostic Breast Cancer (569 fine needle aspirates)",
    sampleSize: "569 patient samples, 30 morphological features",
    hardware: "PennyLane default.qubit (statevector simulator)",
    description: "Honest transparent benchmark: classical random forest demonstrates superior clinical specificity (100% vs 11.8%) and accuracy on raw tabular features.",
    models: [
      {
        name: "Classical Baseline",
        architecture: "Sentinel-RF (Random Forest, 100 Trees)",
        accuracy: "84.00%",
        accuracyValue: 0.8400,
        computationalEfficiency: "18.31 ms / sample",
        efficiencyValue: 18.31,
        generalizationPerformance: "0.9269 AUROC (Held-out Test)",
        generalizationValue: 0.9269,
        type: "Classical Sentinel Baseline",
        status: "Active SOTA (Classical Lead)",
        statusType: "classical-strong",
        details: "Sensitivity: 84.00% | Specificity: 100.00% | Safety Guardrail Active",
        isHybrid: false,
      },
      {
        name: "Classical ML",
        architecture: "Sentinel-SVM (Support Vector Machine RBF)",
        accuracy: "72.00%",
        accuracyValue: 0.7200,
        computationalEfficiency: "2.60 ms / sample",
        efficiencyValue: 2.60,
        generalizationPerformance: "0.8200 AUROC (Held-out Test)",
        generalizationValue: 0.8200,
        type: "Classical SVM Baseline",
        status: "Standard ML",
        statusType: "control",
        details: "Sensitivity: 72.00% | Specificity: 100.00% | F1-Score: 0.7231",
        isHybrid: false,
      },
      {
        name: "Hybrid Quantum-Classical",
        architecture: "OncoPulse-VQC (8-Qubit Circular Entangled VQC)",
        accuracy: "70.00%",
        accuracyValue: 0.7000,
        computationalEfficiency: "1570.05 ms / sample",
        efficiencyValue: 1570.05,
        generalizationPerformance: "0.8093 AUROC (Held-out Test)",
        generalizationValue: 0.8093,
        type: "Hybrid Quantum-Classical VQC",
        status: "Autonomous Fallback to Classical",
        statusType: "fallback",
        details: "Sensitivity: 70.00% | Specificity: 11.76% | Routing: Sentinel-RF Deployed",
        isHybrid: true,
      },
    ],
  },
};

export default function HybridBenchmarkSection() {
  const [activeCohortKey, setActiveCohortKey] = useState("foundation");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [showMetricGuide, setShowMetricGuide] = useState(false);

  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const descRef = useRef(null);
  const tableWrapRef = useRef(null);
  const rowsContainerRef = useRef(null);

  const currentCohort = BENCHMARK_COHORTS[activeCohortKey] || BENCHMARK_COHORTS.foundation;

  // GSAP Viewport Entrance & Row Stagger Animation
  useEffect(() => {
    const isReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isReduced) {
      // Respect accessibility preference
      return;
    }

    const ctx = gsap.context(() => {
      // Entrance timeline triggered by scroll into viewport
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 82%",
          once: true,
        },
      });

      if (headingRef.current) {
        tl.fromTo(
          headingRef.current,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
          0
        );
      }

      if (descRef.current) {
        tl.fromTo(
          descRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
          0.1
        );
      }

      if (tableWrapRef.current) {
        tl.fromTo(
          tableWrapRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
          0.2
        );
      }

      // Stagger table rows
      const rowElements = sectionRef.current?.querySelectorAll(".benchmark-data-row");
      if (rowElements && rowElements.length > 0) {
        tl.fromTo(
          rowElements,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.08,
            ease: "power2.out",
            clearProps: "transform",
          },
          0.35
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [activeCohortKey]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hybrid-ai-benchmark-heading"
      style={{
        marginTop: "42px",
        marginBottom: "24px",
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderLeft: "4px solid #1E40AF",
        borderRadius: "12px",
        padding: "clamp(24px, 3.4vw, 36px)",
        position: "relative",
        zIndex: 10,
        boxShadow: "0 4px 18px rgba(15, 23, 42, 0.04)",
        boxSizing: "border-box",
        fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      }}
    >
      {/* ── Section Header ── */}
      <div
        ref={headingRef}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "18px",
          borderBottom: "1px solid #E2E8F0",
          paddingBottom: "18px",
          marginBottom: "20px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                padding: "3px 8px",
                background: "#EFF6FF",
                color: "#1E40AF",
                border: "1px solid #BFDBFE",
                borderRadius: "4px",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              Scientific Validation
            </span>
            <span
              style={{
                fontSize: "0.70rem",
                color: "#64748B",
                fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "0.04em",
              }}
            >
              EVALUATION PROTOCOL • ZERO DATA LEAKAGE
            </span>
          </div>

          <h2
            id="hybrid-ai-benchmark-heading"
            style={{
              fontFamily: "var(--font-sans, inherit)",
              fontSize: "clamp(1.35rem, 2.2vw, 1.75rem)",
              fontWeight: 800,
              color: "#0F172A",
              margin: "0 0 6px 0",
              letterSpacing: "-0.02em",
            }}
          >
            Hybrid AI Benchmark
          </h2>

          <p
            style={{
              fontSize: "0.94rem",
              fontWeight: 600,
              color: "#1E3A8A",
              margin: "0 0 6px 0",
              lineHeight: 1.45,
            }}
          >
            Benchmarking the Q-Rakshak hybrid quantum-classical approach against classical machine learning models.
          </p>

          <p
            ref={descRef}
            style={{
              fontSize: "0.82rem",
              color: "#475569",
              margin: 0,
              lineHeight: 1.55,
              maxWidth: "760px",
            }}
          >
            Performance is evaluated across predictive accuracy, computational efficiency, and generalization to provide a transparent comparison of the approaches.
          </p>
        </div>

        {/* Action / Methodology Meta Badge */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 11px",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "6px",
              fontSize: "0.72rem",
              color: "#334155",
              fontWeight: 600,
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            <ShieldCheck size={14} color="#1E40AF" />
            <span>Audited & Reproducible Results</span>
          </div>

          <button
            type="button"
            onClick={() => setShowMetricGuide(!showMetricGuide)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.72rem",
              color: "#2563EB",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            <Info size={13} />
            <span>{showMetricGuide ? "Hide Metric Definitions" : "View Metric Definitions"}</span>
          </button>
        </div>
      </div>

      {/* ── Metric Definitions Drawer (Accessible & Educational) ── */}
      {showMetricGuide && (
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "14px",
            fontSize: "0.78rem",
            color: "#334155",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div>
            <strong style={{ display: "block", color: "#0F172A", marginBottom: "4px", fontWeight: 700 }}>
              • Accuracy
            </strong>
            <span style={{ lineHeight: 1.5, color: "#475569" }}>
              Classification accuracy on the predefined held-out test set using identical feature representations and zero-leakage splits.
            </span>
          </div>
          <div>
            <strong style={{ display: "block", color: "#0F172A", marginBottom: "4px", fontWeight: 700 }}>
              • Computational Efficiency
            </strong>
            <span style={{ lineHeight: 1.5, color: "#475569" }}>
              Measured computational cost such as inference latency per patient sample on standardized benchmark infrastructure (CPU/Simulator).
            </span>
          </div>
          <div>
            <strong style={{ display: "block", color: "#0F172A", marginBottom: "4px", fontWeight: 700 }}>
              • Generalization Performance
            </strong>
            <span style={{ lineHeight: 1.5, color: "#475569" }}>
              Performance on unseen validation/test data (AUROC and Expected Calibration Error, ECE), reported under identical evaluation protocol across all models.
            </span>
          </div>
        </div>
      )}

      {/* ── Cohort Selection Tabs ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
          overflowX: "auto",
          paddingBottom: "4px",
          scrollbarWidth: "thin",
        }}
        role="tablist"
        aria-label="Benchmark Cohorts"
      >
        <span
          style={{
            fontSize: "0.70rem",
            fontWeight: 700,
            color: "#64748B",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginRight: "4px",
            whiteSpace: "nowrap",
          }}
        >
          Evaluated Cohort:
        </span>
        {Object.values(BENCHMARK_COHORTS).map((cohort) => {
          const isActive = cohort.id === activeCohortKey;
          return (
            <button
              key={cohort.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setActiveCohortKey(cohort.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.74rem",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#1E40AF" : "#475569",
                background: isActive ? "#EFF6FF" : "#F8FAFC",
                border: `1px solid ${isActive ? "#93C5FD" : "#E2E8F0"}`,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              {cohort.label}
            </button>
          );
        })}
      </div>

      {/* Cohort Metadata Subheader */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "14px",
          padding: "8px 12px",
          background: "#F8FAFC",
          borderRadius: "6px",
          border: "1px solid #E2E8F0",
          fontSize: "0.72rem",
          color: "#475569",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Database size={13} color="#1E40AF" />
          <span>
            <strong>Protocol:</strong> {currentCohort.protocol} ({currentCohort.sampleSize})
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Cpu size={13} color="#64748B" />
          <span>
            <strong>Environment:</strong> {currentCohort.hardware}
          </span>
        </div>
      </div>

      {/* ── Benchmark Table Container ── */}
      <div
        ref={tableWrapRef}
        style={{
          overflowX: "auto",
          border: "1px solid #CBD5E1",
          borderRadius: "8px",
          background: "#FFFFFF",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            background: "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChart3 size={15} color="#1E40AF" />
            <h3
              style={{
                fontSize: "0.86rem",
                fontWeight: 700,
                color: "#0F172A",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Hybrid vs Classical Model Performance
            </h3>
          </div>
          <span
            style={{
              fontSize: "0.68rem",
              color: "#64748B",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            N=3 Standardized Model Classes
          </span>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "0.82rem",
            minWidth: "620px",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#F1F5F9",
                borderBottom: "2px solid #CBD5E1",
                color: "#1E293B",
              }}
            >
              <th
                scope="col"
                style={{
                  padding: "12px 16px",
                  fontWeight: 800,
                  fontSize: "0.76rem",
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  color: "#0F172A",
                  width: "28%",
                }}
              >
                Model
              </th>
              <th
                scope="col"
                style={{
                  padding: "12px 16px",
                  fontWeight: 800,
                  fontSize: "0.76rem",
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  color: "#0F172A",
                  width: "22%",
                }}
              >
                Accuracy
              </th>
              <th
                scope="col"
                style={{
                  padding: "12px 16px",
                  fontWeight: 800,
                  fontSize: "0.76rem",
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  color: "#0F172A",
                  width: "24%",
                }}
              >
                Computational Efficiency
              </th>
              <th
                scope="col"
                style={{
                  padding: "12px 16px",
                  fontWeight: 800,
                  fontSize: "0.76rem",
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  color: "#0F172A",
                  width: "26%",
                }}
              >
                Generalization Performance
              </th>
            </tr>
          </thead>
          <tbody ref={rowsContainerRef}>
            {currentCohort.models.map((model, idx) => {
              const isHovered = hoveredRow === idx;
              const isHybrid = model.isHybrid;

              // Visually distinguish the Hybrid Quantum-Classical row cleanly without declared superiority
              const rowBg = isHovered
                ? "#F0F7FF"
                : isHybrid
                ? "#F8FAFC"
                : idx % 2 === 0
                ? "#FFFFFF"
                : "#FAFAFA";

              const borderLeft = isHybrid
                ? "4px solid #2563EB"
                : "4px solid transparent";

              return (
                <tr
                  key={model.name}
                  className="benchmark-data-row"
                  style={{
                    background: rowBg,
                    borderBottom: "1px solid #E2E8F0",
                    borderLeft: borderLeft,
                    transition: "background 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {/* Column 1: Model */}
                  <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <strong
                        style={{
                          color: isHybrid ? "#1E40AF" : "#0F172A",
                          fontSize: "0.84rem",
                          fontWeight: 700,
                        }}
                      >
                        {model.name}
                      </strong>
                      {isHybrid ? (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "#EFF6FF",
                            color: "#1E40AF",
                            border: "1px solid #BFDBFE",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Zap size={11} color="#2563EB" /> Quantum Circuit
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "#F1F5F9",
                            color: "#475569",
                            border: "1px solid #E2E8F0",
                          }}
                        >
                          Classical
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "#64748B",
                        marginTop: "4px",
                        lineHeight: 1.4,
                      }}
                    >
                      {model.architecture}
                    </div>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: "#94A3B8",
                        marginTop: "2px",
                        fontFamily: "var(--font-mono, monospace)",
                      }}
                    >
                      {model.details}
                    </div>
                  </td>

                  {/* Column 2: Accuracy */}
                  <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                    <div
                      style={{
                        fontSize: "0.92rem",
                        fontWeight: 800,
                        color: isHybrid ? "#1E40AF" : "#0F172A",
                        fontFamily: "var(--font-mono, monospace)",
                      }}
                    >
                      {model.accuracy}
                    </div>
                    <div style={{ fontSize: "0.70rem", color: "#64748B", marginTop: "4px" }}>
                      Held-out test set
                    </div>
                  </td>

                  {/* Column 3: Computational Efficiency */}
                  <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "#0F172A",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontFamily: "var(--font-mono, monospace)",
                      }}
                    >
                      <Clock size={13} color="#64748B" />
                      <span>{model.computationalEfficiency}</span>
                    </div>
                    <div style={{ fontSize: "0.70rem", color: "#64748B", marginTop: "4px" }}>
                      Inference latency per sample
                    </div>
                  </td>

                  {/* Column 4: Generalization Performance */}
                  <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                    <div
                      style={{
                        fontSize: "0.84rem",
                        fontWeight: 700,
                        color: isHybrid ? "#1E3A8A" : "#1E293B",
                        fontFamily: "var(--font-mono, monospace)",
                      }}
                    >
                      {model.generalizationPerformance}
                    </div>
                    <div style={{ fontSize: "0.70rem", color: "#64748B", marginTop: "4px" }}>
                      Discriminative AUC & Calibration
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Small Methodology & Data Source Note ── */}
      <div
        style={{
          marginTop: "14px",
          paddingTop: "12px",
          borderTop: "1px solid #F1F5F9",
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          fontSize: "0.74rem",
          color: "#64748B",
          lineHeight: 1.5,
        }}
      >
        <Info size={14} color="#94A3B8" style={{ flexShrink: 0, marginTop: "2px" }} />
        <span>
          <strong>Data Source & Integrity Note:</strong> Benchmark values should be generated from the same dataset, preprocessing pipeline, train/test split, and evaluation protocol for all compared models. Data source: Q-RAKSHAK Standardized 5-Seed Patient-Level Stratified 3-Way Split (Seeds: 7, 21, 42, 73, 101; audited in <code>FINAL_MIGRATION_REPORT.md</code> and <code>models/registry.json</code>).
        </span>
      </div>
    </section>
  );
}
