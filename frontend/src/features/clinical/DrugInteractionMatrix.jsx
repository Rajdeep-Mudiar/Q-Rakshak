import React, { useState, useEffect, useMemo } from "react";
import {
  Pill,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Apple,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  BookOpen,
  Zap,
  Info,
  Layers,
  FileSpreadsheet,
  Printer,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  X
} from "lucide-react";
import { consultationsApi } from "../../api/consultations";
import { useLanguage } from "../../context/LanguageContext";

const PRESET_REGIMENS = [
  {
    id: "cardiac_high_risk",
    name: "High-Risk Cardiac Regimen",
    subtitle: "Aspirin + Warfarin + Atorvastatin + Grapefruit",
    meds: ["Aspirin", "Warfarin", "Atorvastatin"],
    diet: ["grapefruit", "leafy_greens"],
  },
  {
    id: "hypertension_triple",
    name: "Hypertension & Renal Regimen",
    subtitle: "Lisinopril + Spironolactone + Potassium",
    meds: ["Lisinopril", "Spironolactone"],
    diet: ["high_potassium"],
  },
  {
    id: "gi_cardio",
    name: "Antiplatelet + PPI Regimen",
    subtitle: "Clopidogrel + Omeprazole",
    meds: ["Clopidogrel", "Omeprazole"],
    diet: [],
  },
  {
    id: "clean_safe",
    name: "Clean Baseline Regimen",
    subtitle: "Metformin + Pantoprazole",
    meds: ["Metformin", "Pantoprazole"],
    diet: [],
  },
];

const DIETARY_TAGS = [
  { key: "grapefruit", label: "Grapefruit / Citrus", icon: "🍊", desc: "Potent CYP3A4 inhibitor" },
  { key: "leafy_greens", label: "Spinach / Vitamin K", icon: "🥬", desc: "Warfarin clotting antagonist" },
  { key: "dairy_calcium", label: "Milk & Dairy (Calcium)", icon: "🥛", desc: "Chelates fluoroquinolones & T4" },
  { key: "high_potassium", label: "Bananas / K+ Substitutes", icon: "🍌", desc: "Compounded hyperkalemia risk" },
  { key: "tyramine_foods", label: "Aged Cheese / Fermented", icon: "🧀", desc: "MAO inhibitor hypertensive crisis" },
  { key: "alcohol", label: "Alcohol / Ethanol", icon: "🍷", desc: "Severe hepatotoxicity & CNS depression" },
  { key: "caffeine", label: "Coffee / Energy Drinks", icon: "☕", desc: "Exaggerated stimulant toxicity" },
  { key: "st_johns_wort", label: "St. John's Wort Herbal", icon: "🌿", desc: "CYP3A4 inducer & serotonin risk" },
];

export default function DrugInteractionMatrix({ patientId = null, initialMeds = [] }) {
  const { t } = useLanguage();
  const [selectedMeds, setSelectedMeds] = useState(
    initialMeds.length > 0 ? initialMeds : ["Aspirin", "Warfarin", "Atorvastatin"]
  );
  const [selectedDiet, setSelectedDiet] = useState(["grapefruit"]);
  const [customMedInput, setCustomMedInput] = useState("");
  const [catalog, setCatalog] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [activeTab, setActiveTab] = useState("workbench"); // 'workbench' | 'matrix' | 'food' | 'library'
  const [selectedCollisionDetail, setSelectedCollisionDetail] = useState(null);

  // Load Reference Catalog
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await consultationsApi.getPharmaCatalog();
        if (res?.status === "success") {
          setCatalog(res);
        }
      } catch {
        // Graceful fallback
      }
    }
    loadCatalog();
  }, []);

  // Run Analysis on Meds/Diet Change
  useEffect(() => {
    runAnalysis();
  }, [selectedMeds, selectedDiet]);

  async function runAnalysis() {
    if (selectedMeds.length === 0 && selectedDiet.length === 0) {
      setAnalysis(null);
      return;
    }
    setLoading(true);
    try {
      const res = await consultationsApi.analyzePharma(selectedMeds, selectedDiet, patientId);
      if (res?.status === "success") {
        setAnalysis(res);
      }
    } catch {
      // Retain previous state
    } finally {
      setLoading(false);
    }
  }

  function handleAddCustomMed(e) {
    if (e) e.preventDefault();
    const clean = customMedInput.trim();
    if (clean && !selectedMeds.some((m) => m.toLowerCase() === clean.toLowerCase())) {
      setSelectedMeds((prev) => [...prev, clean]);
      setCustomMedInput("");
    }
  }

  function handleToggleMed(medName) {
    if (selectedMeds.some((m) => m.toLowerCase() === medName.toLowerCase())) {
      setSelectedMeds((prev) => prev.filter((m) => m.toLowerCase() !== medName.toLowerCase()));
    } else {
      setSelectedMeds((prev) => [...prev, medName]);
    }
  }

  function handleToggleDiet(dietKey) {
    if (selectedDiet.includes(dietKey)) {
      setSelectedDiet((prev) => prev.filter((d) => d !== dietKey));
    } else {
      setSelectedDiet((prev) => [...prev, dietKey]);
    }
  }

  function handleLoadPreset(preset) {
    setSelectedMeds(preset.meds);
    setSelectedDiet(preset.diet);
  }

  function handleClearAll() {
    setSelectedMeds([]);
    setSelectedDiet([]);
    setAnalysis(null);
  }

  // Filtered Reference Library
  const filteredRules = useMemo(() => {
    if (!catalog?.drug_interactions_db) return [];
    if (!catalogSearch.trim()) return catalog.drug_interactions_db;
    const q = catalogSearch.toLowerCase().trim();
    return catalog.drug_interactions_db.filter(
      (r) =>
        r.drug_a.toLowerCase().includes(q) ||
        r.drug_b.toLowerCase().includes(q) ||
        r.mechanism?.toLowerCase().includes(q) ||
        r.warning.toLowerCase().includes(q)
    );
  }, [catalog, catalogSearch]);

  const riskTier = analysis?.safety_tier || "SAFE";
  const riskColor =
    riskTier === "CRITICAL_HAZARD" ? "#DC2626" : riskTier === "MODERATE_RISK" ? "#D97706" : "#059669";
  const riskBg =
    riskTier === "CRITICAL_HAZARD" ? "#FEF2F2" : riskTier === "MODERATE_RISK" ? "#FFFBEB" : "#ECFDF5";
  const riskBorder =
    riskTier === "CRITICAL_HAZARD" ? "#FECDD3" : riskTier === "MODERATE_RISK" ? "#FDE68A" : "#A7F3D0";

  return (
    <div
      style={{
        padding: "24px 28px",
        background: "var(--bg-canvas, #F8FAFC)",
        minHeight: "100%",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        boxSizing: "border-box",
      }}
    >
      {/* ── Top Clinical Header & Risk Score HUD ── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "14px",
          padding: "22px 28px",
          marginBottom: "20px",
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "18px",
        }}
      >
        <div style={{ maxWidth: "600px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "7px",
                background: "#ECFDF5",
                border: "1px solid #A7F3D0",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Pill size={16} />
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#059669",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {t("pharma.sa_md_badge", "Clinical Pharmacology & Safety SaMD")}
            </span>
          </div>

          <h1
            style={{
              fontSize: "1.45rem",
              fontWeight: 800,
              color: "#0F172A",
              margin: "0 0 6px 0",
              letterSpacing: "-0.02em",
            }}
          >
            {t("pharma.title", "Multi-Drug & Drug-Food Interaction Risk Matrix")}
          </h1>
          <p style={{ fontSize: "0.84rem", color: "#64748B", margin: 0, lineHeight: 1.5 }}>
            {t(
              "pharma.subtitle",
              "Proactive clinical pharmacology safety analyzer. Cross-references active medications, newly prescribed candidates, and dietary contraindications in real-time."
            )}
          </p>
        </div>

        {/* Right HUD: Real-time Composite Risk Index */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              padding: "12px 18px",
              background: riskBg,
              border: `1.5px solid ${riskBorder}`,
              borderRadius: "10px",
              minWidth: "160px",
            }}
          >
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              {t("pharma.regimen_safety", "Regimen Safety Status")}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              {riskTier === "SAFE" ? (
                <CheckCircle2 size={16} color={riskColor} />
              ) : (
                <AlertTriangle size={16} color={riskColor} />
              )}
              <strong style={{ fontSize: "1.05rem", fontWeight: 800, color: riskColor }}>
                {riskTier === "SAFE"
                  ? t("pharma.tier_safe", "SAFE / OPTIMAL")
                  : riskTier === "MODERATE_RISK"
                  ? t("pharma.tier_caution", "MODERATE CAUTION")
                  : t("pharma.tier_hazard", "CRITICAL HAZARD")}
              </strong>
            </div>
            <span style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "3px" }}>
              {analysis ? `${analysis.counts.total_warnings} warnings flagged` : "Evaluating..."}
            </span>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 14px",
              background: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: "8px",
              color: "#0F172A",
              fontSize: "0.80rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <Printer size={14} />
            <span>{t("pharma.print_report", "Export Rx Safety Sheet")}</span>
          </button>
        </div>
      </div>

      {/* ── Preset Regimens Quick Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "18px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          <Sparkles size={13} style={{ display: "inline", marginRight: "4px" }} />
          {t("pharma.quick_scenarios", "Clinical Scenarios:")}
        </span>
        {PRESET_REGIMENS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleLoadPreset(p)}
            style={{
              padding: "6px 12px",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "20px",
              fontSize: "0.76rem",
              fontWeight: 600,
              color: "#334155",
              cursor: "pointer",
              whiteSpace: "nowrap",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#059669";
              e.currentTarget.style.color = "#059669";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#E2E8F0";
              e.currentTarget.style.color = "#334155";
            }}
          >
            {p.name}
          </button>
        ))}

        <button
          type="button"
          onClick={handleClearAll}
          style={{
            padding: "6px 12px",
            background: "transparent",
            border: "1px dashed #CBD5E1",
            borderRadius: "20px",
            fontSize: "0.74rem",
            color: "#64748B",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {t("pharma.clear_all", "Clear All")}
        </button>
      </div>

      {/* ── Sub-Navigation Tabs ── */}
      <div
        style={{
          display: "flex",
          background: "#E2E8F0",
          padding: "3px",
          borderRadius: "10px",
          width: "fit-content",
          marginBottom: "20px",
        }}
      >
        {[
          { id: "workbench", label: t("pharma.tab_workbench", "Regimen Workbench & Alerts"), icon: Layers },
          { id: "matrix", label: t("pharma.tab_matrix", "2D Drug Collision Matrix"), icon: FileSpreadsheet },
          { id: "food", label: t("pharma.tab_food", "Dietary & Food Contraindications"), icon: Apple },
          { id: "library", label: t("pharma.tab_library", "Reference Pharmacology Library"), icon: BookOpen },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                fontSize: "0.80rem",
                fontWeight: isActive ? 700 : 600,
                borderRadius: "8px",
                border: "none",
                background: isActive ? "#FFFFFF" : "transparent",
                color: isActive ? "#0F172A" : "#64748B",
                boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={14} color={isActive ? "#059669" : "#64748B"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: WORKBENCH & ACTIVE REGIMEN ALERTS ── */}
      {activeTab === "workbench" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "22px", alignItems: "start" }}>
          {/* Left: Active Regimen Builder */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              padding: "20px 24px",
              boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #F1F5F9", paddingBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Stethoscope size={16} color="#059669" />
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                  {t("pharma.active_medications", "Patient Prescriptions & Candidate Drugs")}
                </h3>
              </div>
              <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>
                {selectedMeds.length} {t("pharma.selected_count", "medication(s) selected")}
              </span>
            </div>

            {/* Input for custom medication */}
            <form onSubmit={handleAddCustomMed} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input
                type="text"
                value={customMedInput}
                onChange={(e) => setCustomMedInput(e.target.value)}
                placeholder={t("pharma.type_med_placeholder", "Type drug name (e.g. Clopidogrel, Omeprazole)...")}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: "7px",
                  border: "1px solid #CBD5E1",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "9px 16px",
                  background: "#059669",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "7px",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Plus size={14} />
                <span>{t("pharma.add_btn", "Add")}</span>
              </button>
            </form>

            {/* Active Medication Tags */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "0.70rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "8px" }}>
                {t("pharma.current_regimen_label", "Current Active Regimen:")}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {selectedMeds.length === 0 ? (
                  <span style={{ fontSize: "0.82rem", color: "#94A3B8", fontStyle: "italic" }}>
                    {t("pharma.no_meds_selected", "No medications added yet. Click from common catalog below or type custom drug.")}
                  </span>
                ) : (
                  selectedMeds.map((med) => (
                    <span
                      key={med}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 10px",
                        background: "#F1F5F9",
                        border: "1px solid #CBD5E1",
                        borderRadius: "6px",
                        fontSize: "0.80rem",
                        fontWeight: 700,
                        color: "#0F172A",
                      }}
                    >
                      <Pill size={12} color="#059669" />
                      {med}
                      <button
                        type="button"
                        onClick={() => setSelectedMeds((prev) => prev.filter((m) => m !== med))}
                        style={{ background: "none", border: "none", padding: "1px", cursor: "pointer", color: "#94A3B8" }}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Quick Catalog Click Chips */}
            <div>
              <label style={{ display: "block", fontSize: "0.70rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "8px" }}>
                {t("pharma.quick_add_catalog", "Quick Add from Common Catalog:")}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "180px", overflowY: "auto" }}>
                {(catalog?.common_medications || []).map((item) => {
                  const isSelected = selectedMeds.some((m) => m.toLowerCase() === item.name.toLowerCase());
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleToggleMed(item.name)}
                      style={{
                        padding: "4px 9px",
                        borderRadius: "6px",
                        border: isSelected ? "1px solid #059669" : "1px solid #E2E8F0",
                        background: isSelected ? "#ECFDF5" : "#FFFFFF",
                        color: isSelected ? "#065F46" : "#475569",
                        fontSize: "0.75rem",
                        fontWeight: isSelected ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.12s ease",
                      }}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dietary Selection in Workbench */}
            <div style={{ marginTop: "20px", borderTop: "1px solid #F1F5F9", paddingTop: "14px" }}>
              <label style={{ display: "block", fontSize: "0.70rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "8px" }}>
                {t("pharma.patient_dietary_habits", "Patient Dietary Factors & Beverages:")}
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {DIETARY_TAGS.map((diet) => {
                  const isSelected = selectedDiet.includes(diet.key);
                  return (
                    <button
                      key={diet.key}
                      type="button"
                      onClick={() => handleToggleDiet(diet.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "7px 10px",
                        borderRadius: "7px",
                        border: isSelected ? "1.5px solid #059669" : "1px solid #E2E8F0",
                        background: isSelected ? "#F0FDF4" : "#F8FAFC",
                        color: isSelected ? "#065F46" : "#334155",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: "1rem" }}>{diet.icon}</span>
                      <div style={{ overflow: "hidden" }}>
                        <strong style={{ display: "block", fontSize: "0.76rem" }}>{diet.label}</strong>
                        <span style={{ fontSize: "0.64rem", color: "#64748B", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                          {diet.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Live Detected Interaction Alerts */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Summary Alert Banner */}
            <div
              style={{
                padding: "16px 20px",
                background: riskBg,
                border: `1px solid ${riskBorder}`,
                borderRadius: "12px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              {riskTier === "SAFE" ? (
                <ShieldCheck size={22} color={riskColor} style={{ flexShrink: 0, marginTop: "2px" }} />
              ) : (
                <ShieldAlert size={22} color={riskColor} style={{ flexShrink: 0, marginTop: "2px" }} />
              )}
              <div>
                <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: riskColor, margin: "0 0 4px 0" }}>
                  {riskTier === "SAFE"
                    ? t("pharma.safe_summary_title", "Pharmacological Safety Verified")
                    : t("pharma.hazard_summary_title", "Clinical Contraindication Warning")}
                </h4>
                <p style={{ fontSize: "0.80rem", color: "#334155", margin: 0, lineHeight: 1.45 }}>
                  {analysis?.summary || t("pharma.evaluating_state", "Evaluating active drugs and diet for metabolic collisions...")}
                </p>
              </div>
            </div>

            {/* Drug-Drug Collisions Card Stack */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "18px 20px",
                boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                  {t("pharma.drug_drug_collisions", "Drug-to-Drug Collisions")} ({analysis?.drug_interactions?.length || 0})
                </h4>
              </div>

              {!analysis || analysis.drug_interactions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8" }}>
                  <CheckCircle2 size={24} color="#059669" style={{ margin: "0 auto 6px auto" }} />
                  <span style={{ fontSize: "0.82rem", display: "block" }}>
                    {t("pharma.no_drug_collisions", "Zero drug-drug collisions found in active regimen.")}
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {analysis.drug_interactions.map((item, idx) => {
                    const isCritical = item.severity === "critical";
                    const isHigh = item.severity === "high";
                    const badgeColor = isCritical ? "#DC2626" : isHigh ? "#EA580C" : "#D97706";
                    const badgeBg = isCritical ? "#FEF2F2" : isHigh ? "#FFF7ED" : "#FFFBEB";

                    return (
                      <div
                        key={idx}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "8px",
                          background: "#FFFFFF",
                          border: `1px solid ${isCritical ? "#FECDD3" : isHigh ? "#FFEDD5" : "#E2E8F0"}`,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <strong style={{ fontSize: "0.85rem", color: "#0F172A" }}>
                              {item.matched_pair?.[0] || item.drug_a} ↔ {item.matched_pair?.[1] || item.drug_b}
                            </strong>
                          </div>
                          <span
                            style={{
                              fontSize: "0.65rem",
                              fontWeight: 800,
                              padding: "2px 7px",
                              borderRadius: "4px",
                              background: badgeBg,
                              color: badgeColor,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {item.severity} SEVERITY
                          </span>
                        </div>

                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B", marginBottom: "4px" }}>
                          Mechanism: <span style={{ color: "#0F172A", fontWeight: 600 }}>{item.mechanism || "Metabolic Interaction"}</span>
                        </div>

                        <p style={{ fontSize: "0.78rem", color: "#334155", margin: "0 0 8px 0", lineHeight: 1.45 }}>
                          {item.warning}
                        </p>

                        <div style={{ padding: "6px 10px", background: "#F8FAFC", borderRadius: "6px", borderLeft: `3px solid ${badgeColor}` }}>
                          <span style={{ fontSize: "0.72rem", color: "#0F172A", fontWeight: 600 }}>
                            Clinical Action: {item.recommendation || "Consult prescribing physician to adjust dosing interval or select substitute."}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Food Contraindications Stack */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "18px 20px",
                boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                  {t("pharma.food_contraindications", "Drug-Food Contraindications")} ({analysis?.food_interactions?.length || 0})
                </h4>
              </div>

              {!analysis || analysis.food_interactions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "16px 0", color: "#94A3B8" }}>
                  <CheckCircle2 size={22} color="#059669" style={{ margin: "0 auto 4px auto" }} />
                  <span style={{ fontSize: "0.80rem", display: "block" }}>
                    {t("pharma.no_food_warnings", "No active dietary contraindications detected.")}
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {analysis.food_interactions.map((food, fidx) => (
                    <div
                      key={fidx}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "8px",
                        background: "#FFFBEB",
                        border: "1px solid #FDE68A",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <strong style={{ fontSize: "0.84rem", color: "#92400E" }}>
                          🍎 {food.food_name} ↔ {food.matched_drugs?.join(", ") || "Active Drugs"}
                        </strong>
                        <span style={{ fontSize: "0.64rem", fontWeight: 800, padding: "2px 6px", background: "#FEF3C7", color: "#B45309", borderRadius: "4px" }}>
                          {food.severity?.toUpperCase()} CAUTION
                        </span>
                      </div>
                      <p style={{ fontSize: "0.76rem", color: "#78350F", margin: "0 0 6px 0", lineHeight: 1.4 }}>
                        {food.warning}
                      </p>
                      <div style={{ fontSize: "0.72rem", color: "#B45309", fontWeight: 700 }}>
                        Dietary Directive: <span style={{ fontWeight: 500, color: "#92400E" }}>{food.dietary_guidance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: 2D INTERACTION GRID MATRIX ── */}
      {activeTab === "matrix" && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 12px rgba(15, 23, 42, 0.04)",
            overflowX: "auto",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0F172A", margin: "0 0 4px 0" }}>
              {t("pharma.matrix_title", "2D Pharmacological Collision Cross-Table")}
            </h3>
            <p style={{ fontSize: "0.80rem", color: "#64748B", margin: 0 }}>
              {t("pharma.matrix_desc", "Visual cross-table comparing every selected medication against every other drug in the regimen. Click any intersection cell to inspect clinical pharmacology.")}
            </p>
          </div>

          {selectedMeds.length < 2 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>
              <Pill size={32} style={{ margin: "0 auto 10px auto", opacity: 0.5 }} />
              <p style={{ fontSize: "0.88rem", margin: 0 }}>
                {t("pharma.matrix_select_more", "Select at least 2 medications in the Workbench tab to generate the 2D collision matrix.")}
              </p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
              <thead>
                <tr>
                  <th style={{ padding: "10px", border: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: "0.76rem", color: "#64748B", textAlign: "left" }}>
                    DRUG / CROSS
                  </th>
                  {selectedMeds.map((med) => (
                    <th key={med} style={{ padding: "10px", border: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: "0.76rem", color: "#0F172A", fontWeight: 700, textAlign: "center" }}>
                      {med}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedMeds.map((medRow) => (
                  <tr key={medRow}>
                    <td style={{ padding: "10px", border: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: "0.78rem", fontWeight: 700, color: "#0F172A" }}>
                      {medRow}
                    </td>
                    {selectedMeds.map((medCol) => {
                      if (medRow === medCol) {
                        return (
                          <td key={medCol} style={{ padding: "10px", border: "1px solid #E2E8F0", background: "#F1F5F9", textAlign: "center", color: "#94A3B8", fontSize: "0.72rem" }}>
                            —
                          </td>
                        );
                      }

                      // Check if collision exists
                      const match = analysis?.matrix_pairs?.find(
                        (p) =>
                          (p.drug_a.toLowerCase() === medRow.toLowerCase() && p.drug_b.toLowerCase() === medCol.toLowerCase()) ||
                          (p.drug_a.toLowerCase() === medCol.toLowerCase() && p.drug_b.toLowerCase() === medRow.toLowerCase())
                      );

                      if (match) {
                        const isCrit = match.severity === "critical";
                        return (
                          <td
                            key={medCol}
                            onClick={() => setSelectedCollisionDetail(match)}
                            style={{
                              padding: "10px",
                              border: "1px solid #E2E8F0",
                              background: isCrit ? "#FEE2E2" : "#FEF3C7",
                              textAlign: "center",
                              cursor: "pointer",
                              transition: "transform 0.1s ease",
                            }}
                            title={match.warning}
                          >
                            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: isCrit ? "#DC2626" : "#D97706" }}>
                              ⚠ {match.severity.toUpperCase()}
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td key={medCol} style={{ padding: "10px", border: "1px solid #E2E8F0", background: "#F0FDF4", textAlign: "center" }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#059669" }}>
                            ✓ SAFE
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB 3: DIETARY & FOOD CONTRAINDICATIONS ── */}
      {activeTab === "food" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
          {(catalog?.food_interactions_db || []).map((rule, idx) => (
            <div
              key={idx}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "18px 20px",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h4 style={{ fontSize: "0.90rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                    {rule.food_name}
                  </h4>
                  <span
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: rule.severity === "critical" ? "#FEF2F2" : "#FFFBEB",
                      color: rule.severity === "critical" ? "#DC2626" : "#D97706",
                    }}
                  >
                    {rule.severity?.toUpperCase()}
                  </span>
                </div>

                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B", marginBottom: "6px" }}>
                  Affects: <span style={{ color: "#059669", fontWeight: 700 }}>{rule.drugs_affected?.join(", ")}</span>
                </div>

                <p style={{ fontSize: "0.78rem", color: "#475569", margin: "0 0 10px 0", lineHeight: 1.45 }}>
                  {rule.warning}
                </p>
              </div>

              <div style={{ padding: "8px 10px", background: "#F8FAFC", borderRadius: "6px", borderTop: "1px solid #E2E8F0" }}>
                <span style={{ fontSize: "0.72rem", color: "#0F172A", fontWeight: 600 }}>
                  Clinical Directive: {rule.dietary_guidance}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 4: PHARMACOLOGY REFERENCE LIBRARY ── */}
      {activeTab === "library" && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            padding: "20px 24px",
            boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ fontSize: "0.98rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                {t("pharma.library_title", "Evidence-Based Drug Interaction Ruleset")}
              </h3>
              <span style={{ fontSize: "0.76rem", color: "#64748B" }}>
                {filteredRules.length} verified pharmacological rules indexed.
              </span>
            </div>

            <div style={{ position: "relative", width: "260px" }}>
              <Search size={14} color="#94A3B8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search drug pair, mechanism..."
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 32px",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E1",
                  fontSize: "0.80rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredRules.map((rule, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px 16px",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  display: "grid",
                  gridTemplateColumns: "1.2fr 2fr 1fr",
                  gap: "14px",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ fontSize: "0.84rem", color: "#0F172A", textTransform: "capitalize" }}>
                    {rule.drug_a} + {rule.drug_b}
                  </strong>
                  <span style={{ fontSize: "0.70rem", color: "#64748B", display: "block" }}>
                    {rule.mechanism || "Metabolic Conflict"}
                  </span>
                </div>

                <div style={{ fontSize: "0.76rem", color: "#475569", lineHeight: 1.4 }}>
                  {rule.warning}
                </div>

                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: "4px",
                      background: rule.severity === "critical" ? "#FEF2F2" : "#FFF7ED",
                      color: rule.severity === "critical" ? "#DC2626" : "#EA580C",
                      textTransform: "uppercase",
                    }}
                  >
                    {rule.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal: Collision Detail Inspector ── */}
      {selectedCollisionDetail && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedCollisionDetail(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #E2E8F0", paddingBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={18} color="#DC2626" />
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  {selectedCollisionDetail.drug_a} ↔ {selectedCollisionDetail.drug_b}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCollisionDetail(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, padding: "2px 7px", borderRadius: "4px", background: "#FEF2F2", color: "#DC2626", textTransform: "uppercase" }}>
                {selectedCollisionDetail.severity} Severity Collision
              </span>
              <p style={{ fontSize: "0.84rem", color: "#334155", margin: "10px 0", lineHeight: 1.5 }}>
                {selectedCollisionDetail.warning}
              </p>
            </div>

            <div style={{ padding: "12px", background: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "18px" }}>
              <strong style={{ fontSize: "0.78rem", color: "#0F172A", display: "block", marginBottom: "4px" }}>
                Recommended Clinical Action:
              </strong>
              <p style={{ fontSize: "0.78rem", color: "#475569", margin: 0, lineHeight: 1.45 }}>
                {selectedCollisionDetail.recommendation || "Consult prescribing physician to adjust dosing interval or select a non-interacting pharmacological substitute."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCollisionDetail(null)}
              style={{
                width: "100%",
                padding: "10px",
                background: "#059669",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "0.84rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
