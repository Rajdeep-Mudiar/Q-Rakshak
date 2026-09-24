import { useState, useEffect, useRef } from "react";
import { Compass, ShieldAlert, CheckCircle2, ChevronRight, Activity } from "lucide-react";
import { earlyDetectionApi } from "../../api/earlyDetection";
import { animateEntrance, animateCardStagger } from "../../utils/motion";
import SquareLoader from "../common/SquareLoader.jsx";
import DiseaseEarlyDetectionTimeline from "../../features/analysis/components/DiseaseEarlyDetectionTimeline.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { getLocalizedDiseaseById } from "../../data/diseaseRegistry.js";

export default function EarlyDetectionMap({ patientId = "USR-5EF52B" }) {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const [selectedDisease, setSelectedDisease] = useState("breast_cancer");
  const [pathway, setPathway] = useState(null);
  const [loading, setLoading] = useState(false);

  const activeDisease = getLocalizedDiseaseById(selectedDisease, t);
  const currentEarlyDet = activeDisease.earlyDetection || {};

  useEffect(() => {
    setLoading(true);
    earlyDetectionApi.getPathway(selectedDisease)
      .then((res) => setPathway(res))
      .catch(() => {})
      .finally(() => setLoading(false));

    if (containerRef.current) {
      animateEntrance(containerRef.current, { y: 15, duration: 0.35 });
    }
  }, [selectedDisease]);

  const stages = currentEarlyDet.stages && currentEarlyDet.stages.length > 0 
    ? currentEarlyDet.stages 
    : (pathway?.stages || []);

  const preventiveActions = currentEarlyDet.preventiveActions && currentEarlyDet.preventiveActions.length > 0
    ? currentEarlyDet.preventiveActions
    : (pathway?.preventive_actions || []);

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%", overflowY: "auto", padding: "6px" }}>
      {/* Disease Pathway Selector across all 6 protocols */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { key: "breast_cancer", label: t("early_detection.protocols.breast_cancer", "Breast Oncology") },
          { key: "cardiovascular", label: t("early_detection.protocols.cardiovascular", "Heart & Cardio Plaque") },
          { key: "diabetes", label: t("early_detection.protocols.diabetes", "Diabetes & Metabolism") },
          { key: "pneumonia", label: t("early_detection.protocols.pneumonia", "Pulmonary Infection (Pneu)") },
          { key: "skin", label: t("early_detection.protocols.skin", "Skin Spot & Melanoma") },
          { key: "parkinsons", label: t("early_detection.protocols.parkinsons", "Parkinson's Voice & Motor") },
        ].map((d) => (
          <button
            key={d.key}
            type="button"
            className={`btn-secondary ${selectedDisease === d.key ? "active" : ""}`}
            style={{
              padding: "7px 14px",
              borderRadius: "var(--radius-sm)",
              background: selectedDisease === d.key ? "var(--primary)" : "var(--bg-surface)",
              color: selectedDisease === d.key ? "#fff" : "var(--text-secondary)",
              borderColor: selectedDisease === d.key ? "var(--primary)" : "var(--border-default)",
              fontWeight: selectedDisease === d.key ? 700 : 500,
              fontSize: "0.78rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onClick={() => setSelectedDisease(d.key)}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* ── Interactive Early Detection Timeline Graph for Selected Disease ── */}
      <DiseaseEarlyDetectionTimeline
        diseaseId={selectedDisease}
        showDiseaseSelector={false}
      />

      {/* Pathway Header KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px" }}>
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "12px 14px" }}>
          <p style={{ fontSize: "0.64rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            {t("early_detection.target_disease_organ", "Target Disease & Organ System")}
          </p>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--ink-primary)", margin: "4px 0" }}>
            {activeDisease.name}
          </h3>
          <p style={{ fontSize: "0.74rem", color: "var(--text-secondary)", margin: 0 }}>
            {currentEarlyDet.targetOrgan || pathway?.organ_system}
          </p>
        </div>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "12px 14px" }}>
          <p style={{ fontSize: "0.64rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            {t("early_detection.lead_time_window", "Early Detection Window")}
          </p>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--primary)", fontFamily: "var(--font-mono)", margin: "4px 0" }}>
            {currentEarlyDet.leadTime || `${pathway?.early_detection_window_months || 24} Months`}
          </h3>
          <p style={{ fontSize: "0.74rem", color: "var(--state-success)", fontWeight: 600, margin: 0 }}>
            {t("early_detection.pre_clinical_lead_time", "Pre-clinical lead time")}
          </p>
        </div>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "12px 14px" }}>
          <p style={{ fontSize: "0.64rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            {t("early_detection.sensitivity_gain", "Quantum Sensitivity Gain")}
          </p>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--primary)", margin: "4px 0" }}>
            {currentEarlyDet.sensitivityGain || pathway?.qml_sensitivity_gain || "+3.8%"}
          </h3>
          <p style={{ fontSize: "0.74rem", color: "var(--text-secondary)", margin: 0 }}>
            {t("early_detection.vs_classical", "vs Classical Screen")}
          </p>
        </div>
      </div>

      {/* Sequential Trajectory Progression Cards */}
      <div className="card-panel" style={{ borderRadius: "var(--radius-md)" }}>
        <div className="card-header">
          <span className="card-title">
            <Compass size={15} color="var(--primary)" /> {t("early_detection.progression_trajectory_title", "Multi-Stage Progression Trajectory & Cellular Biomarkers")}
          </span>
          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
            {t("early_detection.progression_trajectory_subtitle", "Asymptomatic Stage 0 to Stage II Clinical Intervention")}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px", marginTop: "10px" }}>
          {stages.map((st, i) => {
            const riskVal = st.riskScore || st.risk_score || 0;
            return (
              <div
                key={i}
                style={{
                  background: "var(--bg-canvas)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
                  <strong style={{ fontSize: "0.82rem", color: "var(--ink-primary)" }}>{st.stage}</strong>
                  <span style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "var(--radius-xs)",
                    background: riskVal > 60 ? "var(--state-error-bg)" : (riskVal > 30 ? "var(--state-warning-bg)" : "var(--state-success-bg)"),
                    color: riskVal > 60 ? "var(--state-error)" : (riskVal > 30 ? "var(--state-warning)" : "var(--state-success)"),
                    border: "1px solid var(--border-default)",
                  }}>
                    {t("early_detection.risk_label", `${riskVal}% Risk`, { risk: riskVal })}
                  </span>
                </div>

                <div>
                  <p style={{ fontSize: "0.64rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 2px" }}>
                    {t("early_detection.cellular_biomarker", "Cellular Biomarker:")}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", margin: 0 }}>
                    {st.cellularBiomarker || st.cellular_biomarker}
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: "0.64rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 2px" }}>
                    {t("early_detection.clinical_presentation", "Clinical Presentation:")}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: 0 }}>
                    {st.symptoms}
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: "0.64rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 2px" }}>
                    {t("early_detection.detection_method", "Detection Method:")}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: 600, margin: 0 }}>
                    {st.detectionMethod || st.detection_method}
                  </p>
                </div>

                <div style={{ marginTop: "auto", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-xs)", padding: "8px" }}>
                  <p style={{ fontSize: "0.64rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", margin: "0 0 2px" }}>
                    {t("early_detection.recommended_protocol", "Recommended Protocol:")}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "var(--ink-primary)", margin: 0 }}>
                    {st.recommendedIntervention || st.recommended_intervention}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preventive Action Guidelines */}
      <div className="card-panel">
        <div className="card-header">
          <span className="card-title">
            <CheckCircle2 size={15} color="var(--risk-low)" /> {t("early_detection.preventative_strategy_title", "Research-Backed Clinical Interventions & Preventative Strategy")}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px" }}>
          {preventiveActions.map((act, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", color: "var(--text-secondary)", background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", padding: "6px 8px" }}>
              <span style={{ color: "var(--risk-low)", fontWeight: 700 }}>
                {t("early_detection.complete_badge", "Complete")}
              </span>
              <span>{act}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
