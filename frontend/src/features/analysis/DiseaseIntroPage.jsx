import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  ArrowRight,
  Sparkles,
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
  Play,
  FileText,
  Binary,
  Clock,
  Check,
  TrendingUp,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import { getDiseaseById, getLocalizedDiseaseById, DISEASE_LIST } from "../../data/diseaseRegistry.js";
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

  // GSAP Entry Animations on disease change or mount
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
        padding: "20px 24px 60px",
        maxWidth: "1320px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* ── Breadcrumb & Quick Switcher Strip ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
          <span style={{ fontWeight: 600, color: "var(--primary)" }}>{t("diseases.clinical_screening", "Clinical Screening")}</span>
          <ChevronRight size={14} color="var(--text-muted)" />
          <span style={{ fontWeight: 500 }}>{disease.category}</span>
          <ChevronRight size={14} color="var(--text-muted)" />
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{disease.name}</span>
        </div>

        {/* Quick Disease Pill Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: "4px" }}>
            {t("diseases.switch_protocol", "Switch Protocol:")}
          </span>
          {DISEASE_LIST.map((d) => {
            const diseaseKey = d.id === "skin" ? "skin_cancer" : d.id === "heart" ? "heart_disease" : d.id === "parkinson" ? "parkinsons" : d.id;
            const localizedName = t(`diseases.${diseaseKey}.short_name`, d.name);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelectOtherDisease && onSelectOtherDisease(d.id)}
                style={{
                  background: d.id === disease.id ? "var(--primary)" : "var(--bg-surface)",
                  color: d.id === disease.id ? "#FFFFFF" : "var(--text-secondary)",
                  border: d.id === disease.id ? "1px solid var(--primary)" : "1px solid var(--border-default)",
                  borderRadius: "var(--radius-pill)",
                  padding: "4px 10px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                {localizedName.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── HERO BANNER: Clinical Visual & High-Impact Title ── */}
      <div
        ref={heroRef}
        className="editorial-card"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-card)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Subtle accent bar at top */}
        <div style={{ height: "4px", background: `linear-gradient(90deg, ${disease.accentColor}, #0284C7)` }} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "28px",
            padding: "32px",
            alignItems: "center",
          }}
        >
          {/* Left Column: Headlines, Clinical Context & CTA */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Badges */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.70rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-pill)",
                  background: disease.accentBg,
                  color: disease.accentColor,
                  border: `1px solid ${disease.accentColor}33`,
                }}
              >
                <Sparkles size={12} />
                {disease.badge}
              </span>
              <span
                style={{
                  fontSize: "0.70rem",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--bg-surface-alt)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {disease.modality === "image" ? "📸 Medical Scan Ingestion" : "📊 Laboratory Biomarkers"}
              </span>
            </div>

            {/* Title & Tagline */}
            <div>
              <h1
                className="editorial-reveal"
                style={{
                  fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: "-0.025em",
                  color: "var(--text-primary)",
                  margin: "0 0 8px",
                }}
              >
                {disease.name}
              </h1>
              <p
                className="editorial-reveal"
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 500,
                  color: disease.accentColor,
                  margin: 0,
                }}
              >
                {disease.tagline}
              </p>
            </div>

            {/* Quick summary */}
            <p
              className="editorial-reveal"
              style={{
                fontSize: "0.92rem",
                lineHeight: 1.6,
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              {disease.overview.patientSummary}
            </p>

            {/* Primary Action Button Bar */}
            <div
              className="editorial-reveal"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                flexWrap: "wrap",
                marginTop: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => onStartAnalysis && onStartAnalysis(disease.studyKey)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  background: `linear-gradient(135deg, ${disease.accentColor} 0%, #075E66 100%)`,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  padding: "13px 26px",
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: `0 4px 18px ${disease.accentColor}44`,
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow = `0 8px 24px ${disease.accentColor}66`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = `0 4px 18px ${disease.accentColor}44`;
                }}
              >
                <Play size={16} fill="#FFFFFF" />
                <span>{t("actions.start_checkup", "Start AI Analysis & Detection")}</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("benchmarks")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 20px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = disease.accentColor;
                  e.currentTarget.style.background = "var(--bg-surface-alt)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.background = "var(--bg-surface)";
                }}
              >
                <BarChart3 size={15} color={disease.accentColor} />
                <span>{t("diseases.tab_benchmarks", "Inspect Benchmarks")}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Visual Gemini Clinical Illustration Card */}
          <div
            className="editorial-reveal"
            style={{
              position: "relative",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-md)",
              background: "#F8FAFC",
              minHeight: "280px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={disease.heroImage}
              alt={`${disease.name} Clinical Illustration`}
              style={{
                width: "100%",
                height: "100%",
                maxHeight: "360px",
                objectFit: "cover",
                display: "block",
                transition: "transform 0.4s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
            />
            {/* Floating verification badge */}
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                left: "12px",
                background: "rgba(255, 255, 255, 0.94)",
                backdropFilter: "blur(8px)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <ShieldCheck size={14} color="var(--risk-low)" />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {t("features.ui.verified_interface", "Verified Medical Visualization")}
              </span>
            </div>
          </div>
        </div>

        {/* ── FAST STATS BAR ── */}
        <div
          ref={statsRef}
          style={{
            borderTop: "1px solid var(--border-default)",
            background: "var(--bg-surface-alt)",
            padding: "16px 32px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              {t("disease_intro.fast_stats.diagnostic_accuracy", "Diagnostic Accuracy")}
            </div>
            <div
              className="disease-stat-val"
              data-value={disease.stats.accuracy}
              style={{ fontSize: "1.5rem", fontWeight: 800, color: disease.accentColor, fontFamily: "var(--font-mono)" }}
            >
              {disease.stats.accuracy}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              {t("disease_intro.fast_stats.quantum_sensitivity", "Quantum Sensitivity")}
            </div>
            <div
              className="disease-stat-val"
              data-value={disease.stats.quantumSensitivity}
              style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--risk-low)", fontFamily: "var(--font-mono)" }}
            >
              {disease.stats.quantumSensitivity}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              {t("disease_intro.fast_stats.quantum_register", "Quantum Register")}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
              {disease.stats.qubits}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              {t("disease_intro.fast_stats.early_detection_impact", "Early Detection Impact")}
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "3px" }}>
              {disease.stats.earlyDetectionSurvival}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              {t("disease_intro.fast_stats.inference_latency", "Inference Latency")}
            </div>
            <div
              className="disease-stat-val"
              data-value={disease.stats.latency}
              style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
            >
              {disease.stats.latency}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION NAVIGATION TABS ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          borderBottom: "1px solid var(--border-default)",
          paddingBottom: "4px",
        }}
      >
        {[
          { id: "overview", label: t("disease_intro.tab_overview", "1. Clinical Overview & Facts"), icon: FileText },
          { id: "quantum", label: t("disease_intro.tab_ai", "2. How Our Quantum AI Works"), icon: Cpu },
          { id: "benchmarks", label: t("disease_intro.tab_benchmarks", "3. Accuracy & Test Scores"), icon: BarChart3 },
          { id: "prep", label: t("disease_intro.tab_prep", "4. Patient Checklist & File Types"), icon: CheckCircle2 },
          { id: "early_detection", label: t("disease_intro.tab_timeline", "5. Early Detection Timeline"), icon: TrendingUp },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                border: "none",
                background: "transparent",
                color: isActive ? disease.accentColor : "var(--text-secondary)",
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.86rem",
                cursor: "pointer",
                position: "relative",
                borderBottom: isActive ? `2px solid ${disease.accentColor}` : "2px solid transparent",
                marginBottom: "-5px",
                transition: "all 0.15s ease",
              }}
            >
              <TabIcon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT ── */}
      <div ref={contentRef} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* ── TAB 1: OVERVIEW & CLINICAL FACTS ── */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* 4 Key Facts Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
              }}
            >
              {disease.facts.map((fact, idx) => (
                <div
                  key={idx}
                  className="fade-stagger-card editorial-card"
                  style={{
                    background: fact.highlight ? disease.accentBg : "var(--bg-surface)",
                    border: fact.highlight ? `1px solid ${disease.accentColor}44` : "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    padding: "20px",
                    boxShadow: "var(--shadow-sm)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                    {fact.label}
                  </span>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: fact.highlight ? disease.accentColor : "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                    {fact.value}
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                    {fact.subtext}
                  </p>
                </div>
              ))}
            </div>

            {/* Early Detection Lead Time Highlight Banner */}
            {disease.earlyDetection && (
              <div
                className="fade-stagger-card editorial-card"
                style={{
                  background: `linear-gradient(135deg, ${disease.accentBg} 0%, var(--bg-surface) 100%)`,
                  border: `1px solid ${disease.accentColor}44`,
                  borderRadius: "var(--radius-md)",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      background: disease.accentColor,
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "0.92rem", color: "var(--text-primary)" }}>
                        {t("disease_intro.lead_time_prefix", "Early Detection Lead Time:")} {disease.earlyDetection.leadTime}
                      </strong>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          background: "var(--risk-low-bg)",
                          color: "var(--risk-low)",
                        }}
                      >
                        {disease.earlyDetection.survivalLift?.split(" ")[0]} Survival at Stage 0
                      </span>
                    </div>
                    <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", margin: "2px 0 0" }}>
                      {disease.earlyDetection.leadTimeSubtext} • {disease.earlyDetection.sensitivityGain}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("early_detection")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--bg-surface)",
                    color: disease.accentColor,
                    border: `1px solid ${disease.accentColor}`,
                    borderRadius: "6px",
                    padding: "8px 14px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Clock size={14} />
                  <span>{t("disease_intro.inspect_timeline_graph", "Inspect Timeline Graph")}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}

            {/* Clinical Definition & Pathology */}
            <div
              className="fade-stagger-card editorial-card"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Microscope size={18} color={disease.accentColor} />
                {t("disease_intro.clinical_pathology_title", "Clinical Pathology & Diagnostic Target")}
              </h3>
              <p style={{ fontSize: "0.90rem", lineHeight: 1.65, color: "var(--text-secondary)", margin: 0 }}>
                {disease.overview.clinicalDefinition}
              </p>
            </div>

            {/* Risk Factors & Warning Signs Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {/* Early Warning Signs */}
              <div
                className="fade-stagger-card editorial-card"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  padding: "24px",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertTriangle size={17} color="var(--risk-mid)" />
                  {t("disease_intro.warning_signs_title", "Key Clinical Signs & Symptoms")}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {disease.overview.warningSigns.map((sign, sIdx) => (
                    <div key={sIdx} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: disease.accentColor,
                          marginTop: "8px",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {sign}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Predisposing Risk Factors */}
              <div
                className="fade-stagger-card editorial-card"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  padding: "24px",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Activity size={17} color={disease.accentColor} />
                  {t("disease_intro.risk_factors_title", "Epidemiological Risk Factors")}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {disease.overview.riskFactors.map((rf, rIdx) => (
                    <div key={rIdx} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "var(--risk-high)",
                          marginTop: "8px",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {rf}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: QUANTUM MODEL ARCHITECTURE & PROCESSING ── */}
        {activeTab === "quantum" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Visual Quantum Architecture Banner */}
            <div
              className="fade-stagger-card editorial-card"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Cpu size={18} color={disease.accentColor} />
                    Quantum Variational Architecture: {disease.quantumModel.name}
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                    {disease.quantumModel.type}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <span style={{ background: "var(--bg-surface-alt)", border: "1px solid var(--border-default)", padding: "4px 10px", borderRadius: "6px", fontSize: "0.74rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    {disease.quantumModel.qubitCount} Qubits
                  </span>
                  <span style={{ background: "var(--bg-surface-alt)", border: "1px solid var(--border-default)", padding: "4px 10px", borderRadius: "6px", fontSize: "0.74rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    {disease.quantumModel.parameters} Parameters
                  </span>
                  <span style={{ background: "var(--bg-surface-alt)", border: "1px solid var(--border-default)", padding: "4px 10px", borderRadius: "6px", fontSize: "0.74rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    {disease.quantumModel.layers} Ansatz Layers
                  </span>
                </div>
              </div>

              {/* Quantum Circuit Graphic */}
              <div
                style={{
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  border: "1px solid var(--border-default)",
                  marginBottom: "16px",
                  background: "#F8FAFC",
                }}
              >
                <img
                  src={disease.quantumCircuitImage}
                  alt="Quantum Circuit & VQC Architecture"
                  style={{ width: "100%", maxHeight: "380px", objectFit: "contain", display: "block" }}
                />
              </div>

              <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "var(--text-secondary)", margin: 0 }}>
                {disease.quantumModel.trainingProtocol}
              </p>
            </div>

            {/* 4-Step Patient Data Processing Pipeline */}
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 14px" }}>
                How {disease.quantumModel.name} Processes Patient Data
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "16px",
                }}
              >
                {[
                  {
                    step: "01",
                    title: "Ingestion & Zero-Leakage Scaling",
                    desc: "Patient indicators are normalized using train-fitted parameters strictly without data leakage. Continuous values map into [0, π].",
                    tag: "Preprocessing",
                  },
                  {
                    step: "02",
                    title: "Quantum Angle State Preparation",
                    desc: "Features are mapped via single-qubit rotations Ry(π · x) onto the Bloch sphere, preparing the superposed statevector |ψ₀⟩.",
                    tag: "Hilbert Space",
                  },
                  {
                    step: "03",
                    title: "Entanglement & Circular Coupling",
                    desc: "Hardware-efficient circular CNOT gates entangle the qubits, evaluating multi-biomarker correlations across 2ⁿ dimensions.",
                    tag: "VQC Ansatz",
                  },
                  {
                    step: "04",
                    title: "Observable Readout & Calibration",
                    desc: "Expectation values ⟨Zᵢ⟩ are measured and scaled via temperature/Platt calibration to produce verified posterior confidence scores.",
                    tag: "Calibrated Output",
                  },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className="fade-stagger-card editorial-card"
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "var(--radius-md)",
                      padding: "20px",
                      boxShadow: "var(--shadow-sm)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.95rem", fontWeight: 900, color: disease.accentColor, fontFamily: "var(--font-mono)" }}>
                        {s.step}
                      </span>
                      <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", padding: "2px 6px", borderRadius: "4px", background: "var(--bg-surface-alt)", color: "var(--text-muted)" }}>
                        {s.tag}
                      </span>
                    </div>
                    <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                      {s.title}
                    </h4>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mathematical Foundations */}
            <div
              className="fade-stagger-card editorial-card"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Binary size={17} color={disease.accentColor} />
                Mathematical Formulation & Quantum Operators
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {disease.quantumModel.mathematicalDetails.map((math, mIdx) => (
                  <div
                    key={mIdx}
                    style={{
                      background: "var(--bg-surface-alt)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "var(--radius-sm)",
                      padding: "14px 18px",
                    }}
                  >
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
                      {math.title}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.85rem",
                        color: disease.accentColor,
                        padding: "6px 0",
                        fontWeight: 600,
                        overflowX: "auto",
                      }}
                    >
                      <code>{math.formula}</code>
                    </div>
                    <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", margin: "4px 0 0" }}>
                      {math.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: AUDITED BENCHMARKS & TRAINING CURVES ── */}
        {activeTab === "benchmarks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Audited Multi-Model Benchmark Table */}
            <div
              className="fade-stagger-card editorial-card"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                boxShadow: "var(--shadow-sm)",
                overflowX: "auto",
              }}
            >
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>
                  Audited 5-Seed Multi-Model Benchmark Matrix
                </h3>
                <p style={{ fontSize: "0.80rem", color: "var(--text-secondary)", margin: 0 }}>
                  Held-out test split performance across 5 fixed random seeds (7, 21, 42, 73, 101) with zero data leakage.
                </p>
              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.82rem",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-default)", color: "var(--text-muted)", fontSize: "0.70rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    <th style={{ padding: "10px 12px" }}>Model Identifier</th>
                    <th style={{ padding: "10px 12px" }}>Architecture</th>
                    <th style={{ padding: "10px 12px" }}>Accuracy</th>
                    <th style={{ padding: "10px 12px" }}>AUC-ROC</th>
                    <th style={{ padding: "10px 12px" }}>Sensitivity</th>
                    <th style={{ padding: "10px 12px" }}>Specificity</th>
                    <th style={{ padding: "10px 12px" }}>MCC</th>
                    <th style={{ padding: "10px 12px" }}>ECE</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {disease.benchmarks.map((row, bIdx) => (
                    <tr
                      key={bIdx}
                      style={{
                        borderBottom: "1px solid var(--border-default)",
                        background: row.isQuantum ? disease.accentBg : "transparent",
                      }}
                    >
                      <td style={{ padding: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                        {row.model}
                      </td>
                      <td style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                        {row.architecture}
                      </td>
                      <td style={{ padding: "12px", fontWeight: 800, color: row.isQuantum ? disease.accentColor : "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                        {row.accuracy}
                      </td>
                      <td style={{ padding: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                        {row.aucRoc}
                      </td>
                      <td style={{ padding: "12px", fontWeight: 700, color: "var(--risk-low)", fontFamily: "var(--font-mono)" }}>
                        {row.sensitivity}
                      </td>
                      <td style={{ padding: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                        {row.specificity}
                      </td>
                      <td style={{ padding: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                        {row.mcc}
                      </td>
                      <td style={{ padding: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                        {row.ece}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            fontSize: "0.66rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "var(--radius-pill)",
                            background: row.isQuantum ? "rgba(8, 127, 140, 0.14)" : "var(--bg-surface-alt)",
                            color: row.isQuantum ? disease.accentColor : "var(--text-secondary)",
                            border: "1px solid var(--border-default)",
                          }}
                        >
                          {row.badge}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empirical Convergence & Training Curves */}
            <div
              className="fade-stagger-card editorial-card"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <TrendingUp size={18} color={disease.accentColor} />
                Empirical Optimization Curves: Loss Minimization & Accuracy Progression
              </h3>

              <div
                style={{
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  border: "1px solid var(--border-default)",
                  background: "#FFFFFF",
                  marginBottom: "16px",
                  padding: "8px",
                }}
              >
                <img
                  src={disease.trainingCurveImage}
                  alt={`${disease.quantumModel.name} Convergence Curves`}
                  style={{ width: "100%", maxHeight: "360px", objectFit: "contain", display: "block" }}
                />
              </div>

              <div
                style={{
                  background: "var(--bg-surface-alt)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  padding: "14px 18px",
                }}
              >
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
                  Empirical Trajectory Analysis
                </div>
                <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "var(--text-secondary)", margin: 0 }}>
                  {disease.convergenceNotes}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: TESTING CHECKLIST & LAUNCH ── */}
        {activeTab === "prep" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Dynamic Accepted File Types Banner */}
            {disease.inputConfig && (
              <div
                className="fade-stagger-card editorial-card"
                style={{
                  background: "var(--bg-surface)",
                  border: `1px solid ${disease.accentColor}44`,
                  borderLeft: `4px solid ${disease.accentColor}`,
                  borderRadius: "var(--radius-md)",
                  padding: "20px 24px",
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>
                      Accepted File Types for this Checkup
                    </h3>
                    <p style={{ fontSize: "0.80rem", color: "var(--text-secondary)", margin: 0 }}>
                      {disease.inputConfig.dropzoneSubtitle || "Upload your patient file or medical scan to begin analysis."}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "0.70rem",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: "9999px",
                      background: "var(--bg-surface-alt)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Max File Size: {disease.inputConfig.maxSizeMb || 15} MB
                  </span>
                </div>

                {/* Badges */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Formats:
                  </span>
                  {(disease.inputConfig.displayExtensions || []).map((ext, eIdx) => (
                    <span
                      key={eIdx}
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        background: `${disease.accentColor}18`,
                        border: `1px solid ${disease.accentColor}55`,
                        color: disease.accentColor,
                      }}
                    >
                      {ext}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div
              className="fade-stagger-card editorial-card"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={18} color="var(--risk-low)" />
                Checkup Preparation Checklist
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                {[
                  {
                    title: `Input Type: ${disease.modality === "image" ? "Medical Image Scan" : disease.id === "parkinsons" ? "Voice Audio Recording or Numbers" : "Lab Numbers or Data Table"}`,
                    desc: disease.inputFormat,
                  },
                  {
                    title: "1-Click Patient Samples Available",
                    desc: "You can test this checkup immediately with pre-loaded healthy or elevated-risk patient samples without uploading personal files.",
                  },
                  {
                    title: "Client-Side Privacy Guarantee",
                    desc: "Your files and medical values are normalized securely with client-side encryption. No unencrypted personal details are exposed.",
                  },
                  {
                    title: "Reliable AI Confidence Rating",
                    desc: "Every checkup comes with an AI certainty percentage and highlights the top biological factors so you know why the assessment was made.",
                  },
                ].map((item, iIdx) => (
                  <div
                    key={iIdx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      background: "var(--bg-surface-alt)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "var(--radius-sm)",
                      padding: "12px 16px",
                    }}
                  >
                    <Check size={16} color="var(--risk-low)" style={{ marginTop: "3px", flexShrink: 0 }} />
                    <div>
                      <strong style={{ fontSize: "0.84rem", color: "var(--text-primary)", display: "block" }}>
                        {item.title}
                      </strong>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                        {item.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: EARLY DETECTION TIMELINE GRAPH ── */}
        {activeTab === "early_detection" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <DiseaseEarlyDetectionTimeline
              diseaseId={disease.id}
              onStartAnalysis={onStartAnalysis}
            />
          </div>
        )}
      </div>

      {/* ── FINAL FULL-WIDTH CONVERSION CARD ── */}
      <div
        className="editorial-card"
        style={{
          background: `linear-gradient(135deg, ${disease.accentBg} 0%, rgba(255, 255, 255, 0.95) 100%)`,
          border: `1px solid ${disease.accentColor}33`,
          borderRadius: "var(--radius-lg)",
          padding: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: disease.accentColor,
              display: "block",
              marginBottom: "4px",
            }}
          >
            {t("disease_intro.ready_evaluate_tag", "READY TO EVALUATE BIOLOGICAL DATA")}
          </span>
          <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px" }}>
            {t("disease_intro.launch_cockpit_title", `Launch ${disease.name} Screening Cockpit`, { name: disease.name })}
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
            {t("disease_intro.launch_cockpit_desc", `Execute ${disease.quantumModel.name} on sample profiles or upload custom patient test records.`, { model: disease.quantumModel.name })}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onStartAnalysis && onStartAnalysis(disease.studyKey)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            background: `linear-gradient(135deg, ${disease.accentColor} 0%, #075E66 100%)`,
            color: "#FFFFFF",
            border: "none",
            borderRadius: "var(--radius-md)",
            padding: "14px 28px",
            fontSize: "0.94rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: `0 4px 20px ${disease.accentColor}44`,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
            e.currentTarget.style.boxShadow = `0 8px 24px ${disease.accentColor}66`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = `0 4px 20px ${disease.accentColor}44`;
          }}
        >
          <Play size={16} fill="#FFFFFF" />
          <span>{t("disease_intro.launch_cockpit_btn", "Launch Analysis & Detection Now")}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
