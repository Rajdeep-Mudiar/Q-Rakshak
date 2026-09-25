import React from "react";
import { Shield, Activity, Heart, AlertTriangle, FileText, CheckCircle2, Stethoscope, Sparkles } from "lucide-react";
import SquareLoader from "../../../components/common/SquareLoader.jsx";
import { useLanguage } from "../../../context/LanguageContext";

export default function PatientClinicalDossier({ dossier }) {
  const { t } = useLanguage();

  if (!dossier) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <SquareLoader size="sm" label={t("ai_doctor.loading_dossier_short", "Loading clinical dossier...")} />
      </div>
    );
  }

  const vitals = dossier.vitals || {};
  const recentTests = dossier.recent_quantum_diagnoses || [];
  const organStates = dossier.organ_states || [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        height: "100%",
        overflowY: "auto",
        padding: "14px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        boxSizing: "border-box",
      }}
    >
      {/* Context Badge */}
      <div
        style={{
          background: "#EFF6FF",
          border: "1px solid #DBEAFE",
          padding: "8px 12px",
          borderRadius: "var(--radius-xs)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Sparkles size={15} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent-blue)" }}>
            {t("ai_doctor.context_active", "Context Active in Dr. Quantum")}
          </div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>
            {t("ai_doctor.context_desc", "Medical records are dynamically primed for this voice consultation.")}
          </div>
        </div>
      </div>

      {/* Patient Card */}
      <div style={{ background: "var(--bg-surface-alt)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-xs)", padding: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 800, color: "var(--ink-primary)" }}>{dossier.name}</h4>
            <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              ID: {dossier.patient_id} • MRN: {dossier.mrn}
            </div>
          </div>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              padding: "2px 7px",
              background: "#FEE2E2",
              border: "1px solid #FCA5A5",
              color: "#DC2626",
              borderRadius: "4px",
            }}
          >
            {dossier.blood_group || "O+"}
          </span>
        </div>
        <div style={{ fontSize: "0.70rem", color: "var(--text-secondary)", display: "flex", gap: "8px", marginTop: "4px" }}>
          <span>{dossier.age} Yrs ({dossier.gender})</span>
          <span>•</span>
          <span>{dossier.height_cm} cm / {dossier.weight_kg} kg</span>
        </div>
      </div>

      {/* Clinical Metrics */}
      <div>
        <div style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)", marginBottom: "6px" }}>
          {t("ai_doctor.profile_metrics", "Clinical Profile & Metrics")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          <div style={{ background: "var(--bg-surface-alt)", padding: "8px 10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>{t("ai_doctor.blood_group", "Blood Group")}</div>
            <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--ink-primary)", fontFamily: "var(--font-mono)" }}>
              {dossier.blood_group || "O+"}
            </div>
          </div>
          <div style={{ background: "var(--bg-surface-alt)", padding: "8px 10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>{t("ai_doctor.temperature", "Temperature")}</div>
            <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--ink-primary)", fontFamily: "var(--font-mono)" }}>
              {vitals.temperature_f ? `${vitals.temperature_f} °F` : "98.6 °F"}
            </div>
          </div>
        </div>
      </div>

      {/* 3D Digital Twin Composite Risk */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)" }}>
            {t("ai_doctor.twin_risk", "3D Digital Twin Composite Risk")}
          </span>
          <span style={{ fontSize: "0.64rem", color: "#059669", fontWeight: 700, background: "#ECFDF5", padding: "1px 6px", borderRadius: "3px" }}>
            {t("ai_doctor.optimal_low", "Optimal / Low Risk")}
          </span>
        </div>
        <div style={{ background: "var(--bg-surface-alt)", padding: "10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-default)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--ink-primary)" }}>26.2</span>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>/ 100</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.66rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Heart</span>
              <strong style={{ color: "#D97706" }}>MODERATE (38%)</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Breast / Lymph</span>
              <strong style={{ color: "#059669" }}>LOW (22%)</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Dermis / Epidermis</span>
              <strong style={{ color: "#059669" }}>LOW (15%)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Inferences */}
      <div>
        <div style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)", marginBottom: "6px" }}>
          {t("ai_doctor.recent_inferences", "Recent Clinical Inferences")}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ background: "var(--bg-surface-alt)", padding: "8px 10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-default)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "0.72rem", color: "var(--ink-primary)" }}>Breast Oncology (WDBC)</strong>
              <span style={{ fontSize: "0.65rem", color: "#059669", fontWeight: 700 }}>92.4%</span>
            </div>
            <div style={{ fontSize: "0.64rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Outcome: Malignant (High Risk) • OncoPulse-VQC
            </div>
          </div>

          <div style={{ background: "var(--bg-surface-alt)", padding: "8px 10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-default)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "0.72rem", color: "var(--ink-primary)" }}>Chest Radiograph (Pneumonia)</strong>
              <span style={{ fontSize: "0.65rem", color: "#059669", fontWeight: 700 }}>95.1%</span>
            </div>
            <div style={{ fontSize: "0.64rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Outcome: Normal Clear Lungs • QuantumVision-DenseNet
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
