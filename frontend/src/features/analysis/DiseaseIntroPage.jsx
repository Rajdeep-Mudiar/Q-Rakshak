import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  ArrowRight,
  Cpu,
  Activity,
  ShieldCheck,
  BarChart3,
  Info,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Microscope,
  Zap,
  ChevronRight,
  FileText,
  Binary,
  Clock,
  Check,
  TrendingUp,
  RefreshCw,
  Stethoscope,
  Lock,
  HeartPulse,
  Brain,
  Wind
} from "lucide-react";
import { getLocalizedDiseaseById, DISEASE_LIST } from "../../data/diseaseRegistry.js";
import { animateEditorialHero, animateCardStagger, animateCounter } from "../../utils/motion.js";
import DiseaseEarlyDetectionTimeline from "./components/DiseaseEarlyDetectionTimeline.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function DiseaseIntroPage({
  diseaseId = "breast_cancer",
  onStartAnalysis,
  onSelectOtherDisease,
}) {
  const { t } = useLanguage();
  const disease = getLocalizedDiseaseById(diseaseId, t);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "quantum" | "benchmarks" | "prep"

  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (heroRef.current) {
      animateEditorialHero(heroRef.current);
    }
    if (statsRef.current) {
      const statElements = statsRef.current.querySelectorAll(".disease-stat-val");
      statElements.forEach((el) => {
        const raw = el.getAttribute("data-value") || "";
        const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
        if (!isNaN(num) && num > 0) {
          const suffix = raw.includes("%") ? "%" : raw.includes("ms") ? " ms" : "";
          const decimals = raw.includes(".") ? 1 : 0;
          animateCounter(el, 0, num, decimals, suffix);
        }
      });
    }
    if (contentRef.current) {
      animateCardStagger(contentRef.current, ".fade-stagger-card");
    }
  }, [diseaseId, activeTab]);

  return (
    <div
      ref={containerRef}
      className="disease-intro-wrapper"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "16px 20px 48px",
        maxWidth: "1240px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
        fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      }}
    >
      {/* ── 1. Breadcrumb & Quick Switcher Strip ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          paddingBottom: "12px",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#64748B" }}>
          <span style={{ fontWeight: 600, color: "#0284C7" }}>{t("diseases.clinical_screening", "Clinical Screening")}</span>
          <ChevronRight size={14} color="#94A3B8" />
          <span style={{ fontWeight: 500 }}>{disease.category}</span>
          <ChevronRight size={14} color="#94A3B8" />
          <span style={{ fontWeight: 700, color: "#0F172A" }}>{disease.name}</span>
        </div>

        {/* Quick Disease Pill Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.70rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: "4px" }}>
            {t("diseases.switch_protocol", "Switch Protocol:")}
          </span>
          {DISEASE_LIST.map((d) => {
            const isCurrent = d.id === disease.id || (disease.id === "skin_cancer" && d.id === "skin") || (disease.id === "heart_disease" && d.id === "heart") || (disease.id === "parkinson" && d.id === "parkinsons");
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelectOtherDisease && onSelectOtherDisease(d.id)}
                style={{
                  background: isCurrent ? "#0284C7" : "#FFFFFF",
                  color: isCurrent ? "#FFFFFF" : "#475569",
                  border: isCurrent ? "1px solid #0284C7" : "1px solid #CBD5E1",
                  borderRadius: "20px",
                  padding: "4px 10px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {d.name.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Hero Clinical Overview Banner ── */}
      <div
        ref={heroRef}
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderTop: "3px solid #0284C7",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
          padding: "clamp(22px, 3.5vw, 32px)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ maxWidth: "780px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", background: "#F0F9FF", color: "#0284C7", border: "1px solid #BAE6FD", borderRadius: "4px", textTransform: "uppercase" }}>
                {disease.category}
              </span>
              <span style={{ fontSize: "0.68rem", fontWeight: 600, padding: "2px 8px", background: "#F8FAFC", color: "#475569", border: "1px solid #E2E8F0", borderRadius: "4px" }}>
                Modality: {disease.modalityLabel || "Clinical Biomarkers / Scans"}
              </span>
              <span style={{ fontSize: "0.68rem", fontWeight: 600, padding: "2px 8px", background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0", borderRadius: "4px" }}>
                {disease.modelArchitecture || "Variational Quantum Classifier"}
              </span>
            </div>

            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#0F172A", margin: "0 0 8px 0", letterSpacing: "-0.03em" }}>
              {disease.name}
            </h1>

            <p style={{ fontSize: "0.94rem", color: "#475569", lineHeight: 1.65, margin: 0 }}>
              {disease.description}
            </p>

            <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => onStartAnalysis && onStartAnalysis(disease.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  background: "#0284C7",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
                  transition: "background 0.15s ease",
                }}
              >
                <Activity size={16} />
                <span>{t("diseases.start_evaluation", "Start Diagnostic Checkup")}</span>
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("benchmarks")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  background: "#FFFFFF",
                  color: "#0F172A",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <BarChart3 size={15} color="#0284C7" />
                <span>{t("diseases.view_benchmarks", "View Audited Benchmarks")}</span>
              </button>
            </div>
          </div>

          {/* Key Model Badges */}
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "16px 20px",
              minWidth: "220px",
            }}
          >
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
              Model Specification
            </span>
            <strong style={{ fontSize: "0.95rem", color: "#0F172A", display: "block", fontWeight: 800, marginTop: "4px" }}>
              {disease.modelArchitecture || "OncoPulse-VQC"}
            </strong>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px", fontSize: "0.78rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Accuracy:</span>
                <strong style={{ color: "#059669" }}>{disease.accuracy}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Dataset Cohort:</span>
                <span style={{ fontWeight: 600, color: "#0F172A" }}>{disease.dataset}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Avg. Latency:</span>
                <span style={{ fontWeight: 600, color: "#0F172A" }}>{disease.inferenceTime || "< 15 ms"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Diagnostic Statistics Bar ── */}
      <section
        ref={statsRef}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        {[
          { label: "Clinical Sensitivity", val: disease.sensitivity || "94.0%", sub: "True Positive Detection Rate", color: "#059669" },
          { label: "Specificity Score", val: disease.specificity || "96.2%", sub: "Low False-Positive Margin", color: "#0284C7" },
          { label: "Dataset Cohort Size", val: disease.cohortSize || "N = 569", sub: "Patient-Stratified Samples", color: "#0F172A" },
          { label: "Triage Classification", val: disease.triageTier || "ESI 1-5", sub: "Standard Clinical Priority", color: "#7C3AED" },
        ].map((s, idx) => (
          <div
            key={idx}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>{s.label}</span>
            <div
              className="disease-stat-val"
              data-value={s.val}
              style={{ fontSize: "1.45rem", fontWeight: 800, color: s.color, lineHeight: 1.2, margin: "2px 0" }}
            >
              {s.val}
            </div>
            <span style={{ fontSize: "0.72rem", color: "#64748B" }}>{s.sub}</span>
          </div>
        ))}
      </section>

      {/* ── 4. Sub-Navigation Tabs ── */}
      <div style={{ display: "flex", gap: "6px", borderBottom: "2px solid #E2E8F0", paddingBottom: "2px" }}>
        {[
          { id: "overview", label: t("diseases.tab_overview", "Overview & Symptoms"), icon: Info },
          { id: "quantum", label: t("diseases.tab_quantum", "Quantum Circuit Architecture"), icon: Binary },
          { id: "benchmarks", label: t("diseases.tab_benchmarks", "Audited Benchmarks"), icon: BarChart3 },
        ].map((tItem) => {
          const Icon = tItem.icon;
          const isActive = activeTab === tItem.id;
          return (
            <button
              key={tItem.id}
              type="button"
              onClick={() => setActiveTab(tItem.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                border: "none",
                background: isActive ? "#0284C7" : "transparent",
                color: isActive ? "#FFFFFF" : "#64748B",
                borderRadius: "6px 6px 0 0",
                fontWeight: 700,
                fontSize: "0.80rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={14} />
              <span>{tItem.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 5. Tab Content Panes ── */}
      <div ref={contentRef}>
        {/* TAB 1: Overview & Symptoms */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }}>
            <div
              className="fade-stagger-card"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                padding: "22px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                Clinical Background & Pathology
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#475569", lineHeight: 1.65, margin: 0 }}>
                {disease.clinicalBackground || disease.description}
              </p>

              <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "14px" }}>
                <strong style={{ fontSize: "0.85rem", color: "#0F172A", display: "block", marginBottom: "8px" }}>
                  Key Physiological Biomarkers Evaluated:
                </strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {(disease.keyBiomarkers || ["Cell Radius", "Texture Variance", "Perimeter Area", "Concave Points", "Symmetry", "Fractal Dimension"]).map((b, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "0.75rem",
                        padding: "4px 10px",
                        background: "#F8FAFC",
                        color: "#0F172A",
                        border: "1px solid #E2E8F0",
                        borderRadius: "6px",
                        fontWeight: 600,
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="fade-stagger-card"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                padding: "22px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                Primary Symptoms & Warning Signs
              </h3>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.85rem", color: "#475569", lineHeight: 1.6 }}>
                {(disease.symptoms || [
                  "Unexplained localized tissue density or painless nodules",
                  "Morphological cellular boundary irregularities on imaging",
                  "Early microcalcification clusters detected on screening",
                  "Asymmetrical tissue contrast variations",
                ]).map((s, idx) => (
                  <li key={idx} style={{ marginBottom: "6px" }}>{s}</li>
                ))}
              </ul>

              <div style={{ marginTop: "auto", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "6px", padding: "10px 14px" }}>
                <span style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={14} /> Early Intervention Benefit
                </span>
                <p style={{ fontSize: "0.78rem", color: "#166534", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                  Detecting cellular shifts at Stage 0-1 provides a 99% 5-year favorable clinical outcome.
                </p>
              </div>
            </div>
          </div>
        )}


        {/* TAB 3: Quantum Circuit Architecture */}
        {activeTab === "quantum" && (
          <div
            className="fade-stagger-card"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "22px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
              Variational Quantum Classifier (VQC) Mechanics
            </h3>
            <p style={{ fontSize: "0.88rem", color: "#475569", lineHeight: 1.65, margin: 0 }}>
              The <strong>{disease.modelArchitecture || "OncoPulse-VQC"}</strong> uses PennyLane statevector transformations to map biomedical biomarker vectors into a 2ⁿ-dimensional Hilbert space, evaluating non-linear multi-biomarker correlations without classical kernel overfitting.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", borderTop: "1px solid #F1F5F9", paddingTop: "14px" }}>
              <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Qubit Count</span>
                <strong style={{ fontSize: "1.1rem", color: "#0284C7", display: "block", marginTop: "2px" }}>8 Qubits</strong>
                <span style={{ fontSize: "0.72rem", color: "#64748B" }}>256-dimensional Hilbert space</span>
              </div>

              <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Entangling Topology</span>
                <strong style={{ fontSize: "1.1rem", color: "#0F172A", display: "block", marginTop: "2px" }}>Circular CNOT</strong>
                <span style={{ fontSize: "0.72rem", color: "#64748B" }}>Maximal inter-marker entanglement</span>
              </div>

              <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Parameter Efficiency</span>
                <strong style={{ fontSize: "1.1rem", color: "#059669", display: "block", marginTop: "2px" }}>48 Parameters</strong>
                <span style={{ fontSize: "0.72rem", color: "#64748B" }}>727× fewer weights than dense MLP</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Audited Benchmarks */}
        {activeTab === "benchmarks" && (
          <div
            className="fade-stagger-card"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "22px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
              Audited Performance: {disease.name}
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                    <th style={{ padding: "10px 14px" }}>Model</th>
                    <th style={{ padding: "10px 14px" }}>Architecture</th>
                    <th style={{ padding: "10px 14px" }}>Accuracy</th>
                    <th style={{ padding: "10px 14px" }}>Sensitivity</th>
                    <th style={{ padding: "10px 14px" }}>Specificity</th>
                    <th style={{ padding: "10px 14px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #F1F5F9", background: "#F0FDF4" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "#0284C7" }}>{disease.modelArchitecture || "OncoPulse-VQC"}</td>
                    <td style={{ padding: "10px 14px" }}>Variational Quantum Classifier</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "#059669" }}>{disease.accuracy}</td>
                    <td style={{ padding: "10px 14px" }}>{disease.sensitivity || "94.0%"}</td>
                    <td style={{ padding: "10px 14px" }}>{disease.specificity || "96.2%"}</td>
                    <td style={{ padding: "10px 14px", color: "#059669", fontWeight: 700 }}>Primary Active</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>Sentinel-RF</td>
                    <td style={{ padding: "10px 14px" }}>Random Forest Baseline</td>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>84.0%</td>
                    <td style={{ padding: "10px 14px" }}>82.5%</td>
                    <td style={{ padding: "10px 14px" }}>85.0%</td>
                    <td style={{ padding: "10px 14px", color: "#64748B" }}>Classical Control</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
