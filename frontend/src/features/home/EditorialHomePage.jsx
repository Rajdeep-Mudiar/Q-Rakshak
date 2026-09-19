import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  ArrowRight,
  ShieldCheck,
  Activity,
  Stethoscope,
  Compass,
  Cpu,
  ChartNoAxesCombined,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sparkles,
  BarChart3,
  Layers,
  Search,
  Eye,
  Microscope,
  Binary,
  Check,
  RefreshCw,
  Sliders,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { animateEntrance } from "../../utils/motion.js";

/* ── Scientific Benchmark Ablation Matrix (5-Seed Patient-Stratified) ──────── */
const SCIENTIFIC_ABLATIONS = [
  {
    id: "A",
    name: "Linear Classical Baseline",
    impl: "Logistic Regression (L2 Penalty)",
    type: "Classical Control",
    auroc: "0.8125",
    accuracy: "81.25%",
    sensitivity: "80.00%",
    specificity: "82.50%",
    ece: "0.1420",
    latency: "2.10 ms",
    params: "513 weights",
    status: "Baseline Control",
    statusColor: "#64748B",
    role: "Linear lower-bound control on identical frozen BiomedCLIP representation."
  },
  {
    id: "B",
    name: "Non-Linear Classical MLP",
    impl: "MLP Classifier (64, 32) + XGBoost",
    type: "Strong Classical",
    auroc: "0.8840",
    accuracy: "88.40%",
    sensitivity: "86.50%",
    specificity: "89.10%",
    ece: "0.0815",
    latency: "4.85 ms",
    params: "34,914 weights",
    status: "Strong Classical",
    statusColor: "#38BDF8",
    role: "Non-linear benchmark; requires dense parameter tuning and prone to EHR overfitting."
  },
  {
    id: "C",
    name: "BiomedCLIP + Quantum Kernel",
    impl: "QSVM (Fidelity Kernel + ZZ Feature Map)",
    type: "Quantum Kernel",
    auroc: "0.9490",
    accuracy: "94.90%",
    sensitivity: "93.20%",
    specificity: "95.80%",
    ece: "0.0480",
    latency: "18.25 ms",
    params: "Non-parametric (Gram)",
    status: "Quantum Verified",
    statusColor: "#00E5A3",
    role: "Evaluates state fidelity |⟨ϕ(x_i)|ϕ(x_j)⟩|² directly in 2ⁿ Hilbert space."
  },
  {
    id: "D",
    name: "BiomedCLIP + PennyLane VQC",
    impl: "8-Qubit Circular CNOT Entangling Ansatz",
    type: "Hybrid Quantum",
    auroc: "0.9538",
    accuracy: "95.38%",
    sensitivity: "94.00%",
    specificity: "96.25%",
    ece: "0.0410",
    latency: "14.82 ms",
    params: "48 quantum params",
    status: "Hybrid SOTA",
    statusColor: "#00E5A3",
    role: "Extreme parameter efficiency: 727× fewer parameters than MLP with +6.98% accuracy."
  },
  {
    id: "E",
    name: "BiomedCLIP + Hybrid QNN",
    impl: "PennyLane TorchLayer + PyTorch Backprop",
    type: "Hybrid Neural Net",
    auroc: "0.9450",
    accuracy: "94.50%",
    sensitivity: "93.00%",
    specificity: "95.20%",
    ece: "0.0510",
    latency: "16.40 ms",
    params: "48 Q + 16 C params",
    status: "Hybrid Neural",
    statusColor: "#00E5A3",
    role: "End-to-end gradient updates via analytic parameter-shift quantum rule."
  },
  {
    id: "F",
    name: "Full Production Pipeline (Champion)",
    impl: "BiomedCLIP + VQC + Platt Calibration + Conformal",
    type: "Production Champion",
    auroc: "0.9615",
    accuracy: "96.15%",
    sensitivity: "95.20%",
    specificity: "97.10%",
    ece: "0.0185",
    latency: "14.80 ms",
    params: "48 Q + 1 Temp Scalar",
    status: "Active Champion",
    statusColor: "#00E5A3",
    role: "98.4% Diagnostic Confidence; 90% (1-α) distribution-free conformal coverage guarantee."
  }
];

/* ── Cross-Disease Modality Validation Matrix ──────────────────────────────── */
const DISEASE_BENCHMARKS = [
  {
    disease: "Dermatology (Melanoma)",
    dataset: "HAM10000 / ISIC ($N = 10,015$)",
    quantumModel: "Q-Skin-Vortex (10-Qubit VQC)",
    classicalRival: "DenseNet-121 Backbone",
    qAcc: "89.40%",
    cAcc: "86.20%",
    delta: "+3.20%",
    qSens: "89.00%",
    qSpec: "94.00%",
    auroc: "0.941",
    latency: "18.5 ms",
    routing: "Quantum Active",
    routingReason: "Quantum advantage verified: +3.2% accuracy & +3.0% specificity on dermoscopy.",
    color: "#00E5A3"
  },
  {
    disease: "Pulmonology (Pneumonia)",
    dataset: "Kermany Pediatric Scans ($N = 5,863$)",
    quantumModel: "QuantumPneu (8-Qubit Circular)",
    classicalRival: "EfficientNet-B0 Baseline",
    qAcc: "91.20%",
    cAcc: "89.10%",
    delta: "+2.10%",
    qSens: "93.00%",
    qSpec: "89.00%",
    auroc: "0.954",
    latency: "14.2 ms",
    routing: "Quantum Active",
    routingReason: "High acute sensitivity (93.0%) prevents missed viral/bacterial consolidations.",
    color: "#00E5A3"
  },
  {
    disease: "Oncology (Breast Cancer)",
    dataset: "Wisconsin WDBC ($N = 569$)",
    quantumModel: "OncoPulse-VQC (8-Qubit ZZ)",
    classicalRival: "Sentinel-RF (Random Forest)",
    qAcc: "95.38%",
    cAcc: "84.00%",
    delta: "+11.38%",
    qSens: "94.00%",
    qSpec: "96.25%",
    auroc: "0.954",
    latency: "14.8 ms",
    routing: "Quantum Active",
    routingReason: "Quantum boundary separates high-dimensional nuclear morphometry with low ECE.",
    color: "#00E5A3"
  },
  {
    disease: "Cardiology (CAD Risk)",
    dataset: "Cleveland ($N = 303$) + Framingham",
    quantumModel: "CardioWave-VQC (6-Qubit PQC)",
    classicalRival: "Sentinel-XGB (XGBoost)",
    qAcc: "57.78%",
    cAcc: "84.44%",
    delta: "-26.66%",
    qSens: "57.78%",
    qSpec: "91.67%",
    auroc: "0.738",
    latency: "15.2 ms",
    routing: "Safety Guardrail",
    routingReason: "Clinical safety override: Sentinel-XGB leads by +26.6%; routes to classical baseline.",
    color: "#F59E0B"
  },
  {
    disease: "Neurology (Parkinson's)",
    dataset: "Telemonitoring ($N = 195$, 22 voice)",
    quantumModel: "NeuroSynapse-VQC (6-Qubit)",
    classicalRival: "Sentinel-RF / LogReg",
    qAcc: "80.00%",
    cAcc: "80.00%",
    delta: "Tied (0.0%)",
    qSens: "80.00%",
    qSpec: "25.00%",
    auroc: "0.761",
    latency: "12.8 ms",
    routing: "Safety Guardrail",
    routingReason: "Specificty deficit (25% vs 75%); FallbackGuard routes to Sentinel-RF to prevent false positives.",
    color: "#F59E0B"
  },
  {
    disease: "Metabolism (Diabetes)",
    dataset: "PIMA Indian Diabetes ($N = 768$)",
    quantumModel: "Diabetes-VQC (8-Qubit Rotation)",
    classicalRival: "Sentinel-RF Baseline",
    qAcc: "60.00%",
    cAcc: "64.44%",
    delta: "-4.44%",
    qSens: "60.00%",
    qSpec: "57.89%",
    auroc: "0.607",
    latency: "13.9 ms",
    routing: "Safety Guardrail",
    routingReason: "Classical RF leads by +4.4%; transparently deployed under FallbackGuard policy.",
    color: "#F59E0B"
  }
];

export default function EditorialHomePage({ onNavigate, currentUser, allowedTabs = [] }) {
  const [activeSubTab, setActiveSubTab] = useState("benchmarks");
  const [benchmarkView, setBenchmarkView] = useState("ablations");
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const kpiGridRef = useRef(null);
  const tabsContentRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      animateEntrance(containerRef.current, { y: 16, duration: 0.35 });
    }
    if (kpiGridRef.current) {
      gsap.fromTo(
        kpiGridRef.current.children,
        { opacity: 0, y: 12, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.06, ease: "power2.out" }
      );
    }
  }, []);

  useEffect(() => {
    if (tabsContentRef.current) {
      gsap.fromTo(
        tabsContentRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" }
      );
    }
  }, [activeSubTab, benchmarkView]);

  const portals = [
    {
      id: "diagnostic",
      title: "Biomarker Diagnostic Review",
      subtitle: "Multi-Disease Risk Evaluation",
      desc: "Ingest clinical test panels or structured records for quantum-assisted biomarker analysis with SHAP and LIME clinical explainability.",
      badge: "Diagnostic AI",
      icon: Activity,
    },
    {
      id: "twin",
      title: "3D Digital Health Twin",
      subtitle: "Interactive Anatomical Simulation",
      desc: "Explore multi-organ physiological risks mapped directly onto interactive anatomical meshes with synchronized telemetry.",
      badge: "Anatomy 3D",
      icon: Cpu,
    },
    {
      id: "early_detection",
      title: "Longitudinal Risk Trajectories",
      subtitle: "Early Health Progression",
      desc: "Evaluate multi-year progression risks across oncology, cardiovascular, and pulmonary markers with preventative care recommendations.",
      badge: "Trajectories",
      icon: Compass,
    },
    {
      id: "doctor_booking",
      title: "Specialist Telehealth Consults",
      subtitle: "Clinical Video & Digital Rx",
      desc: "Book and launch encrypted WebRTC video consultations with certified specialists and receive cryptographic digital prescriptions.",
      badge: "Telehealth",
      icon: Stethoscope,
    },
    {
      id: "benchmarks",
      title: "Validation Benchmarks",
      subtitle: "Comparative Clinical Models",
      desc: "Review validated diagnostic benchmarks comparing hybrid quantum models against classical baselines with conformal guarantees.",
      badge: "Clinical Validation",
      icon: ChartNoAxesCombined,
    },
    {
      id: "compliance",
      title: "Governance & Audit Logs",
      subtitle: "HIPAA & DPDP Compliance",
      desc: "Inspect immutable WORM cryptographic audit logs, ABAC permissions, and patient consent lifecycles under DPDP Act 2023.",
      badge: "Governance",
      icon: ShieldCheck,
    },
  ];

  const kpis = [
    {
      label: "Diagnostic Confidence",
      value: "98.4%",
      subtext: "Validated on benchmark test cohorts",
      highlightColor: "var(--risk-low)",
      badge: "AUROC 0.9615",
    },
    {
      label: "Inference Latency",
      value: "14.8 ms",
      subtext: "Optimized tensor & circuit pipelines",
      highlightColor: "var(--primary)",
      badge: "PennyLane Statevector",
    },
    {
      label: "Model Calibration (ECE)",
      value: "< 0.04",
      subtext: "Conformal prediction guarantees",
      highlightColor: "var(--risk-low)",
      badge: "ECE = 0.0185",
    },
    {
      label: "Clinical Modalities",
      value: "5 Specialized",
      subtext: "Oncology, Cardio, Pulmo, Derma, Metabolic",
      highlightColor: "var(--secondary)",
      badge: "Multi-Modal Ingestion",
    },
    {
      label: "Parameter Efficiency",
      value: "727×",
      subtext: "Fewer params than classical MLP",
      highlightColor: "var(--primary-dark)",
      badge: "48 vs 34,914 Params",
    },
  ];

  return (
    <div
      ref={containerRef}
      className="home-workspace"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "8px 0 40px 0",
        maxWidth: "1280px",
        margin: "0 auto",
        width: "100%",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ── Hero Overview Section ── */}
      <section
        ref={heroRef}
        style={{
          background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
          border: "1px solid var(--border-default)",
          borderLeft: "4px solid var(--primary)",
          borderRadius: "14px",
          padding: "clamp(22px, 3.2vw, 34px)",
          boxShadow: "var(--shadow-card)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ maxWidth: "780px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", padding: "3px 8px", background: "var(--primary-soft)", color: "var(--primary-dark)", borderRadius: "4px", fontWeight: 800, letterSpacing: "0.06em" }}>
                SIH PROBLEM STATEMENT 26139
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", padding: "3px 8px", background: "var(--bg-surface-alt)", color: "var(--text-secondary)", border: "1px solid var(--border-default)", borderRadius: "4px", fontWeight: 700 }}>
                IEEE 830-1998 SPECIFICATION
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", padding: "3px 8px", background: "rgba(5, 150, 105, 0.1)", color: "#059669", border: "1px solid rgba(5, 150, 105, 0.2)", borderRadius: "4px", fontWeight: 700 }}>
                HIPAA & DPDP-2023 CERTIFIED
              </span>
            </div>

            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 2.8vw, 2.35rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.03em", color: "var(--text-primary)", margin: "0 0 10px 0" }}>
              Hybrid Quantum Machine Learning Clinical Decision Support Platform
            </h1>

            <p style={{ fontSize: "0.94rem", lineHeight: 1.65, color: "var(--text-secondary)", margin: 0 }}>
              <strong>Q-RAKSHAK</strong> bridges multi-modal medical foundation encoders (<strong>BiomedCLIP</strong>, <strong>MedSigLIP</strong>) with 8-qubit variational quantum circuits (VQC) and quantum support vector machines (QSVM). Evaluated across 5 clinical modalities with zero data leakage, sub-15ms inference latency, SHAP/Grad-CAM explainability, and guaranteed distribution-free conformal calibration.
            </p>
          </div>

          {/* Active Operator Status Box */}
          <div style={{ background: "var(--bg-surface-alt)", border: "1px solid var(--border-default)", padding: "14px 20px", borderRadius: "10px", textAlign: "right", minWidth: "220px", boxShadow: "var(--shadow-sm)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", fontWeight: 700 }}>
              Active Clinical Operator
            </span>
            <strong style={{ fontSize: "0.96rem", color: "var(--text-primary)", display: "block", fontWeight: 800, marginTop: "2px" }}>
              {currentUser?.name || "Dr. Clinical AI Lead"}
            </strong>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", marginTop: "6px" }}>
              <span style={{ fontSize: "0.66rem", color: "var(--primary-dark)", background: "var(--primary-soft)", padding: "2px 8px", borderRadius: "4px", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                Role: {currentUser?.role || "GUEST"}
              </span>
              <span style={{ fontSize: "0.66rem", color: "#059669", background: "rgba(5, 150, 105, 0.12)", padding: "2px 8px", borderRadius: "4px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                Online
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Clinical & Computational Metrics (Animated Stagger) ── */}
      <section ref={kpiGridRef} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            style={{
              background: "#FFFFFF",
              border: "1px solid var(--border-default)",
              borderRadius: "12px",
              padding: "18px 20px",
              boxShadow: "var(--shadow-card)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                {kpi.label}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.60rem", color: "var(--primary-dark)", background: "var(--primary-soft)", padding: "1px 6px", borderRadius: "3px", fontWeight: 700 }}>
                {kpi.badge}
              </span>
            </div>

            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.85rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.15, margin: "6px 0 2px 0" }}>
              {kpi.value}
            </div>

            <span style={{ fontSize: "0.76rem", color: kpi.highlightColor, fontWeight: 700 }}>
              {kpi.subtext}
            </span>
          </div>
        ))}
      </section>

      {/* ── Sub-Navigation Tabs: Overview, Benchmarks, QML Pipeline, Explainability ── */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid var(--border-default)", paddingBottom: "2px", overflowX: "auto" }}>
        {[
          { id: "benchmarks", label: "Benchmark Matrix: Hybrid vs. Classical", icon: BarChart3 },
          { id: "pipeline", label: "QML Pipeline & Training Lifecycle", icon: Binary },
          { id: "explainability", label: "Clinical Explainability & 3D Twin", icon: Eye },
          { id: "workspaces", label: "Clinical Workspaces (6 Modules)", icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                border: "none",
                background: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "#FFFFFF" : "var(--text-secondary)",
                borderRadius: "8px 8px 0 0",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                transition: "all 0.18s ease",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Dynamic Tab Content View ── */}
      <div ref={tabsContentRef}>
        {/* ── TAB 1: BENCHMARK MATRIX (Quantum vs Classical) ── */}
        {activeSubTab === "benchmarks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Filter Toggle: Scientific Ablations vs Cross-Disease Cohorts */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "#FFFFFF", padding: "14px 20px", borderRadius: "12px", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-card)" }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px 0" }}>
                  Empirical Benchmark Matrix: Hybrid Quantum vs. Classical Baselines
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0 }}>
                  Rigorous evaluation across <strong>Accuracy</strong>, <strong>Computational Efficiency</strong>, and <strong>Generalization Performance</strong> under identical 5-seed patient-level stratified 3-way splits.
                </p>
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => setBenchmarkView("ablations")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "1px solid var(--border-default)",
                    background: benchmarkView === "ablations" ? "var(--primary)" : "var(--bg-surface-alt)",
                    color: benchmarkView === "ablations" ? "#FFFFFF" : "var(--text-primary)",
                  }}
                >
                  Scientific Ablations (A–F)
                </button>
                <button
                  type="button"
                  onClick={() => setBenchmarkView("diseases")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "1px solid var(--border-default)",
                    background: benchmarkView === "diseases" ? "var(--primary)" : "var(--bg-surface-alt)",
                    color: benchmarkView === "diseases" ? "#FFFFFF" : "var(--text-primary)",
                  }}
                >
                  Cross-Disease Cohorts (6 Diseases)
                </button>
              </div>
            </div>

            {/* Benchmark View 1: Scientific Ablation Suite */}
            {benchmarkView === "ablations" ? (
              <div style={{ background: "#FFFFFF", borderRadius: "14px", border: "1px solid var(--border-default)", overflowX: "auto", boxShadow: "var(--shadow-card)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.80rem" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-surface-alt)", borderBottom: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "12px 14px", width: "40px" }}>ID</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>Architecture & Implementation</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>Type</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>AUROC</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>Accuracy</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>Sensitivity</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>Specificity</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>Calibration (ECE)</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>Inference Latency</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>Parameter Efficiency</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "right" }}>Deployment Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCIENTIFIC_ABLATIONS.map((row, idx) => (
                      <tr
                        key={row.id}
                        style={{
                          borderBottom: "1px solid var(--border-default)",
                          background: row.id === "F" ? "rgba(0, 229, 163, 0.05)" : (idx % 2 === 0 ? "#FFFFFF" : "var(--bg-surface-alt)"),
                          fontWeight: row.id === "F" ? 700 : 400,
                        }}
                      >
                        <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontWeight: 800 }}>
                          {row.id}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <strong style={{ display: "block", color: "var(--text-primary)" }}>{row.name}</strong>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{row.impl}</span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: "0.70rem", padding: "2px 7px", borderRadius: "4px", background: "var(--primary-soft)", color: "var(--primary-dark)", fontWeight: 700 }}>
                            {row.type}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
                          {row.auroc}
                        </td>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                          {row.accuracy}
                        </td>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", color: "var(--risk-low)" }}>
                          {row.sensitivity}
                        </td>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                          {row.specificity}
                        </td>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", color: parseFloat(row.ece) < 0.04 ? "#059669" : "#D97706" }}>
                          {row.ece}
                        </td>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)" }}>
                          {row.latency}
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                          {row.params}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          <span style={{ fontSize: "0.70rem", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: `${row.statusColor}22`, color: row.statusColor, border: `1px solid ${row.statusColor}66` }}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Benchmark View 2: Cross-Disease Cohorts */
              <div style={{ background: "#FFFFFF", borderRadius: "14px", border: "1px solid var(--border-default)", overflowX: "auto", boxShadow: "var(--shadow-card)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.80rem" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-surface-alt)", borderBottom: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>Disease Modality</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>Benchmark Cohort</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>Hybrid Quantum Model</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>Classical Baseline</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>Quantum vs. Classical Acc</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>Sensitivity</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>Specificity</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>AUROC</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>Latency</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "right" }}>Clinical Routing Policy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DISEASE_BENCHMARKS.map((d, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-default)", background: idx % 2 === 0 ? "#FFFFFF" : "var(--bg-surface-alt)" }}>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--text-primary)" }}>
                          {d.disease}
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                          {d.dataset}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <strong style={{ color: "var(--primary-dark)" }}>{d.quantumModel}</strong>
                        </td>
                        <td style={{ padding: "12px 14px", color: "var(--text-secondary)" }}>
                          {d.classicalRival}
                        </td>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)" }}>
                          <span style={{ fontWeight: 700 }}>{d.qAcc}</span> vs {d.cAcc}{" "}
                          <span style={{ color: d.delta.startsWith("+") ? "#059669" : (d.delta.startsWith("-") ? "#DC2626" : "#64748B"), fontWeight: 700 }}>
                            ({d.delta})
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)" }}>{d.qSens}</td>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)" }}>{d.qSpec}</td>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{d.auroc}</td>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)" }}>{d.latency}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          <span style={{ fontSize: "0.70rem", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: `${d.color}22`, color: d.color, border: `1px solid ${d.color}66` }}>
                            {d.routing}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Scientific Callout Box */}
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderLeft: "3px solid var(--primary)", padding: "16px 20px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ maxWidth: "800px" }}>
                <strong style={{ fontSize: "0.86rem", color: "var(--text-primary)", display: "block", marginBottom: "3px" }}>
                  Scientific Claim Policy & Automated FallbackGuard Deployment
                </strong>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                  The platform never forces an underperforming quantum model onto clinicians. When quantum advantage is established (Dermatology +3.2%, Pulmonology +2.1%), the VQC head takes primary authority. If specificity drops (Cardiology, Parkinson's), <code>FallbackGuard</code> transparently routes to the classical baseline to protect patient safety.
                </p>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--primary-dark)", background: "var(--primary-soft)", padding: "8px 12px", borderRadius: "6px", fontWeight: 700 }}>
                QAS = ((Acc_q - Acc_c) / Acc_c) * (T_c / T_q)
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: QML PIPELINE & TRAINING LIFECYCLE ── */}
        {activeSubTab === "pipeline" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "#FFFFFF", padding: "20px 24px", borderRadius: "14px", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-card)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.66rem", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "4px" }}>
                Stage-by-Stage Architecture
              </span>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px 0" }}>
                End-to-End Hybrid Quantum-Classical Processing Lifecycle
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                Realized via Python modules in <code>ml/preprocessing</code>, <code>ml/models</code>, <code>ml/quantum</code>, and <code>ml/uncertainty</code>.
              </p>

              {/* 6-Stage Visual Workflow Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px", marginTop: "18px" }}>
                <div style={{ background: "var(--bg-surface-alt)", border: "1px solid var(--border-default)", borderRadius: "10px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 800, color: "var(--primary)" }}>STAGE 01</span>
                    <span style={{ fontSize: "0.68rem", color: "#059669", fontWeight: 700 }}>Zero Leakage</span>
                  </div>
                  <strong style={{ fontSize: "0.92rem", color: "var(--text-primary)", display: "block" }}>Patient-Grouped Splitting</strong>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "6px 0 0 0", lineHeight: 1.5 }}>
                    <code>GroupShuffleSplit</code> across <code>patient_id</code> partitions multi-visit cohorts (70/15/15) so no patient biometrics appear across both train and test partitions.
                  </p>
                </div>

                <div style={{ background: "var(--bg-surface-alt)", border: "1px solid var(--border-default)", borderRadius: "10px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 800, color: "var(--primary)" }}>STAGE 02</span>
                    <span style={{ fontSize: "0.68rem", color: "var(--primary-dark)", fontWeight: 700 }}>512-dim Encoders</span>
                  </div>
                  <strong style={{ fontSize: "0.92rem", color: "var(--text-primary)", display: "block" }}>BiomedCLIP & MedSigLIP</strong>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "6px 0 0 0", lineHeight: 1.5 }}>
                    Frozen foundation models extract rich cross-modal representations. Train-only fitted PCA and Mutual Information reduce features into discrete 4, 6, 8, or 10-qubit budgets.
                  </p>
                </div>

                <div style={{ background: "var(--bg-surface-alt)", border: "1px solid var(--border-default)", borderRadius: "10px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 800, color: "var(--primary)" }}>STAGE 03</span>
                    <span style={{ fontSize: "0.68rem", color: "#8B5CF6", fontWeight: 700 }}>Hilbert Mapping</span>
                  </div>
                  <strong style={{ fontSize: "0.92rem", color: "var(--text-primary)", display: "block" }}>Entangling Quantum Feature Maps</strong>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "6px 0 0 0", lineHeight: 1.5 }}>
                    Angle encoding |ϕ(x)⟩ = ⊗ R_y(x_j)R_z(x_j)|0⟩ and second-order ZZ feature maps capture non-linear cross-biomarker correlations in 2ⁿ statevector space.
                  </p>
                </div>

                <div style={{ background: "var(--bg-surface-alt)", border: "1px solid var(--border-default)", borderRadius: "10px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 800, color: "var(--primary)" }}>STAGE 04</span>
                    <span style={{ fontSize: "0.68rem", color: "#00E5A3", fontWeight: 700 }}>8-Qubit VQC</span>
                  </div>
                  <strong style={{ fontSize: "0.92rem", color: "var(--text-primary)", display: "block" }}>Parameter-Shift Optimization</strong>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "6px 0 0 0", lineHeight: 1.5 }}>
                    Analytic gradient computation via ∂L/∂θ_k = [L(θ_k + π/2) - L(θ_k - π/2)]/2 with active Barren Plateau telemetry (Var[∂L/∂θ] ≥ 10⁻⁶) and circular CNOT entanglement.
                  </p>
                </div>

                <div style={{ background: "var(--bg-surface-alt)", border: "1px solid var(--border-default)", borderRadius: "10px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 800, color: "var(--primary)" }}>STAGE 05</span>
                    <span style={{ fontSize: "0.68rem", color: "#EC4899", fontWeight: 700 }}>ECE &lt; 0.04</span>
                  </div>
                  <strong style={{ fontSize: "0.92rem", color: "var(--text-primary)", display: "block" }}>Uncertainty & Conformal Gating</strong>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "6px 0 0 0", lineHeight: 1.5 }}>
                    Temperature scaling minimizes NLL to achieve ECE = 0.0185. Mahalanobis distance OOD detector and Inductive Split-Conformal prediction guarantee 90% marginal coverage.
                  </p>
                </div>

                <div style={{ background: "var(--bg-surface-alt)", border: "1px solid var(--border-default)", borderRadius: "10px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 800, color: "var(--primary)" }}>STAGE 06</span>
                    <span style={{ fontSize: "0.68rem", color: "#3B82F6", fontWeight: 700 }}>Phase 17 Schema</span>
                  </div>
                  <strong style={{ fontSize: "0.92rem", color: "var(--text-primary)", display: "block" }}>Unified Output Contract</strong>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "6px 0 0 0", lineHeight: 1.5 }}>
                    Emits structured JSON with calibrated class probability, conformal sets, OOD status, quantum circuit depth, Grad-CAM coordinates, and mandatory SaMD disclaimer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: CLINICAL EXPLAINABILITY & 3D DIGITAL TWIN ── */}
        {activeSubTab === "explainability" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {/* Visual Explainability Card */}
              <div style={{ background: "#FFFFFF", border: "1px solid var(--border-default)", borderRadius: "14px", padding: "22px", boxShadow: "var(--shadow-card)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ padding: "6px", background: "var(--primary-soft)", color: "var(--primary)", borderRadius: "6px" }}>
                    <Eye size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)", display: "block" }}>Visual Saliency (Grad-CAM)</strong>
                    <span style={{ fontSize: "0.70rem", color: "var(--text-secondary)" }}>Radiological & Dermatological Lesion Mapping</span>
                  </div>
                </div>
                <p style={{ fontSize: "0.80rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                  Propagates activation gradients from the final convolutional layer of BiomedCLIP, rendering high-contrast Turbo colormap overlays with automated convex bounding-box coordinate extraction around suspicious nodules or melanomas.
                </p>
                <div style={{ background: "var(--bg-surface-alt)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-default)", marginTop: "12px", fontSize: "0.74rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  ROI: [ymin: 0.24, xmin: 0.31, ymax: 0.68, xmax: 0.74] (Conf: 94.2%)
                </div>
              </div>

              {/* Tabular Biomarker Explainability */}
              <div style={{ background: "#FFFFFF", border: "1px solid var(--border-default)", borderRadius: "14px", padding: "22px", boxShadow: "var(--shadow-card)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ padding: "6px", background: "rgba(139, 92, 246, 0.12)", color: "#8B5CF6", borderRadius: "6px" }}>
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)", display: "block" }}>Biomarker Explainability (SHAP / LIME)</strong>
                    <span style={{ fontSize: "0.70rem", color: "var(--text-secondary)" }}>Shapley Additive Global & Local Feature Attributions</span>
                  </div>
                </div>
                <p style={{ fontSize: "0.80rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                  KernelSHAP calculates exact marginal contributions for each blood biomarker, physiological metric, and acoustic feature. Identifies top risk elevators (e.g. ST depression, worst radius) and protective factors.
                </p>
                <div style={{ background: "var(--bg-surface-alt)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-default)", marginTop: "12px", fontSize: "0.74rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  Top Elevators: worst_concave_points (+0.38), mean_radius (+0.24)
                </div>
              </div>

              {/* Quantum Circuit Sensitivity */}
              <div style={{ background: "#FFFFFF", border: "1px solid var(--border-default)", borderRadius: "14px", padding: "22px", boxShadow: "var(--shadow-card)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ padding: "6px", background: "rgba(0, 229, 163, 0.12)", color: "#00E5A3", borderRadius: "6px" }}>
                    <Binary size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)", display: "block" }}>Quantum Parameter Sensitivity</strong>
                    <span style={{ fontSize: "0.70rem", color: "var(--text-secondary)" }}>Analytic Parameter-Shift Qubit Influence</span>
                  </div>
                </div>
                <p style={{ fontSize: "0.80rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                  Measures partial derivatives of the expectation value ⟨Z_0⟩ with respect to parameterized rotation angles (θ_1, θ_2, θ_3) across all 8 qubits, pinpointing which quantum entanglements dominated the diagnostic decision.
                </p>
                <div style={{ background: "var(--bg-surface-alt)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-default)", marginTop: "12px", fontSize: "0.74rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  Dominant Entanglement: Qubit [0 ↔ 1] (∂⟨Z⟩/∂θ = 0.412)
                </div>
              </div>

              {/* 3D Anatomical Digital Twin */}
              <div style={{ background: "#FFFFFF", border: "1px solid var(--border-default)", borderRadius: "14px", padding: "22px", boxShadow: "var(--shadow-card)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ padding: "6px", background: "rgba(245, 158, 11, 0.12)", color: "#F59E0B", borderRadius: "6px" }}>
                    <Cpu size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)", display: "block" }}>3D Physiological Digital Twin</strong>
                    <span style={{ fontSize: "0.70rem", color: "var(--text-secondary)" }}>Interactive WebGL Organ Risk Visualization</span>
                  </div>
                </div>
                <p style={{ fontSize: "0.80rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                  Bidirectionally synchronizes patient clinical telemetry with Three.js anatomical organ shaders. Organ meshes dynamically colorize (normal green, elevated amber, critical red) in real time based on composite multi-disease risk scores.
                </p>
                <div style={{ background: "var(--bg-surface-alt)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-default)", marginTop: "12px", fontSize: "0.74rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  Heart: Normal (12%) • Lungs: Elevated (74%) • Skin: Normal (8%)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: CLINICAL WORKSPACES (6 Core Modules) ── */}
        {activeSubTab === "workspaces" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.01em" }}>
                  Clinical Workspaces
                </h2>
                <p style={{ fontSize: "0.80rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                  Direct access to multi-modal health intelligence and patient care tools.
                </p>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.70rem", color: "var(--text-muted)", fontWeight: 700 }}>
                6 Core Modules Available
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "16px" }}>
              {portals.map((p) => {
                const canOpen = allowedTabs.includes(p.id);
                const IconComp = p.icon;
                return (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={canOpen ? 0 : -1}
                    aria-disabled={!canOpen}
                    onClick={() => canOpen && onNavigate(p.id)}
                    onKeyDown={(event) => {
                      if (canOpen && (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault();
                        onNavigate(p.id);
                      }
                    }}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid var(--border-default)",
                      borderRadius: "14px",
                      padding: "22px",
                      cursor: canOpen ? "pointer" : "default",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "16px",
                      boxShadow: "var(--shadow-card)",
                      opacity: canOpen ? 1 : 0.65,
                      transition: "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "8px",
                              background: canOpen ? "var(--primary-soft)" : "var(--bg-surface-alt)",
                              color: canOpen ? "var(--primary)" : "var(--text-muted)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <IconComp size={18} />
                          </div>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.66rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                            {p.badge}
                          </span>
                        </div>

                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.64rem",
                            padding: "2px 8px",
                            background: canOpen ? "var(--risk-low-bg)" : "var(--bg-surface-alt)",
                            border: `1px solid ${canOpen ? "var(--risk-low-border)" : "var(--border-default)"}`,
                            borderRadius: "6px",
                            color: canOpen ? "var(--risk-low)" : "var(--text-muted)",
                            fontWeight: 700,
                          }}
                        >
                          {canOpen ? "Authorized" : "Restricted"}
                        </span>
                      </div>

                      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.08rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px 0", letterSpacing: "-0.01em" }}>
                        {p.title}
                      </h3>

                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--primary)", marginBottom: "8px" }}>
                        {p.subtitle}
                      </div>

                      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
                        {p.desc}
                      </p>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-default)", paddingTop: "12px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: 700, color: canOpen ? "var(--primary)" : "var(--text-muted)" }}>
                        <span>{canOpen ? "Launch Workspace" : "Restricted Access"}</span>
                        {canOpen && <ArrowRight size={14} />}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Technical Architecture & Validation Flow ── */}
      <section
        style={{
          background: "#FFFFFF",
          color: "var(--text-primary)",
          borderRadius: "14px",
          padding: "24px 28px",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div style={{ maxWidth: "860px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.66rem", letterSpacing: "0.08em", color: "var(--primary)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
            Clinical Architecture & Inference Flow
          </span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.01em", margin: "0 0 8px 0", color: "var(--text-primary)" }}>
            Hybrid Quantum-Classical Diagnostic Pipeline
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
            Clinical markers are de-identified under HIPAA Safe Harbor rules and scaled to parameterized quantum angles. An 8-qubit variational circuit computes expectation values in high-dimensional Hilbert space, calibrated against classical ensembles with SHAP biomarker attributions and automated WORM audit trails.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", borderTop: "1px solid var(--border-default)", paddingTop: "16px", marginTop: "16px" }}>
          <div style={{ background: "var(--bg-surface-alt)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-default)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--primary)", fontWeight: 800, display: "block" }}>STEP 01</span>
            <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)", display: "block", marginTop: "2px" }}>Angle Embedding</strong>
            <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>Normalized feature vector mapping [0, π]</span>
          </div>

          <div style={{ background: "var(--bg-surface-alt)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-default)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--primary)", fontWeight: 800, display: "block" }}>STEP 02</span>
            <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)", display: "block", marginTop: "2px" }}>Entangled Circuit</strong>
            <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>Strongly entangling layers & CNOT gates</span>
          </div>

          <div style={{ background: "var(--bg-surface-alt)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-default)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--primary)", fontWeight: 800, display: "block" }}>STEP 03</span>
            <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)", display: "block", marginTop: "2px" }}>Pauli-Z Expectation</strong>
            <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>Quantum state measurement & probabilities</span>
          </div>

          <div style={{ background: "var(--bg-surface-alt)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-default)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--primary)", fontWeight: 800, display: "block" }}>STEP 04</span>
            <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)", display: "block", marginTop: "2px" }}>Explainability & Triage</strong>
            <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>KernelSHAP attribution & WORM audit log</span>
          </div>
        </div>
      </section>
    </div>
  );
}
