import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Pill,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
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
  X,
  Share2,
  SlidersHorizontal,
  Clock,
  ArrowRightLeft,
  Filter,
  Check,
  Leaf,
  Milk,
  Wine,
  Coffee,
  Sun,
  Flame,
  Activity,
  Heart,
  Network,
  Play,
  Pause,
  RotateCcw,
  Gauge,
  TrendingUp,
  TrendingDown,
  User,
  Sliders,
  Timer
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

const SIMULATION_SCENARIOS = [
  {
    id: "statin_grapefruit",
    name: "Statin + Grapefruit CYP3A4 Surge",
    meds: ["Atorvastatin"],
    diet: ["grapefruit"],
    desc: "Simulates intestinal CYP3A4 inhibition causing a 300% surge in systemic statin concentration and hepatic/muscular overload.",
  },
  {
    id: "hyperkalemia_synergy",
    name: "ACEi + Spironolactone + K+ Diet",
    meds: ["Lisinopril", "Spironolactone"],
    diet: ["high_potassium"],
    desc: "Simulates dual distal tubule potassium retention pushing serum K+ past 6.0 mEq/L cardiac arrhythmia threshold.",
  },
  {
    id: "antiplatelet_cyp_block",
    name: "Clopidogrel + Omeprazole Bio-Blockade",
    meds: ["Clopidogrel", "Omeprazole"],
    diet: [],
    desc: "Simulates CYP2C19 competitive inhibition dropping antiplatelet active thiol metabolite below therapeutic threshold.",
  },
  {
    id: "warfarin_vitk_crash",
    name: "Warfarin + High Vitamin K Antagonism",
    meds: ["Warfarin"],
    diet: ["leafy_greens"],
    desc: "Simulates exogenous Vitamin K1 overriding VKORC1 blockade, causing target INR to plunge from 2.5 to 1.2.",
  },
];

const DIETARY_TAGS = [
  { key: "grapefruit", label: "Grapefruit / Citrus", iconName: "citrus", desc: "Potent CYP3A4 inhibitor" },
  { key: "leafy_greens", label: "Spinach / Vitamin K", iconName: "leaf", desc: "Warfarin clotting antagonist" },
  { key: "dairy_calcium", label: "Milk & Dairy (Calcium)", iconName: "milk", desc: "Chelates fluoroquinolones & T4" },
  { key: "high_potassium", label: "Bananas / K+ Substitutes", iconName: "potassium", desc: "Compounded hyperkalemia risk" },
  { key: "tyramine_foods", label: "Aged Cheese / Fermented", iconName: "tyramine", desc: "MAO inhibitor hypertensive crisis" },
  { key: "alcohol", label: "Alcohol / Ethanol", iconName: "alcohol", desc: "Severe hepatotoxicity & CNS depression" },
  { key: "caffeine", label: "Coffee / Energy Drinks", iconName: "coffee", desc: "Exaggerated stimulant toxicity" },
  { key: "st_johns_wort", label: "St. John's Wort Herbal", iconName: "herbal", desc: "CYP3A4 inducer & serotonin risk" },
];

const DRUG_CATEGORIES = [
  { id: "all", label: "All Classes" },
  { id: "cardiac", label: "Cardiovascular & Blood" },
  { id: "gi", label: "Gastrointestinal" },
  { id: "anti_infective", label: "Antibiotics & Anti-Infective" },
  { id: "cns", label: "CNS & Psychotropic" },
  { id: "endocrine", label: "Endocrine & Diabetes" },
  { id: "pain", label: "Analgesic & Anti-Inflammatory" },
];

const ALTERNATIVE_SUGGESTIONS = {
  "omeprazole": { alternative: "Pantoprazole", reason: "Minimal CYP2C19 inhibition, preserving antiplatelet efficacy of Clopidogrel." },
  "clarithromycin": { alternative: "Azithromycin", reason: "Does not inhibit CYP3A4, avoiding toxic statin accumulation and rhabdomyolysis." },
  "ibuprofen": { alternative: "Paracetamol", reason: "Avoids renal tubular competition and bone marrow toxicity with Methotrexate." },
  "tramadol": { alternative: "Paracetamol", reason: "Non-serotonergic analgesic that eliminates serotonin syndrome risk with SSRIs." },
  "simvastatin": { alternative: "Rosuvastatin", reason: "Hydrophilic statin largely independent of CYP3A4 hepatic metabolism." },
};

function renderDietIcon(iconName, size = 16) {
  switch (iconName) {
    case "citrus":
      return <Sun size={size} color="#EA580C" />;
    case "leaf":
      return <Leaf size={size} color="#16A34A" />;
    case "milk":
      return <Milk size={size} color="#0284C7" />;
    case "potassium":
      return <Flame size={size} color="#D97706" />;
    case "tyramine":
      return <ShieldAlert size={size} color="#CA8A04" />;
    case "alcohol":
      return <Wine size={size} color="#DC2626" />;
    case "coffee":
      return <Coffee size={size} color="#78350F" />;
    case "herbal":
      return <Leaf size={size} color="#059669" />;
    default:
      return <Activity size={size} color="#0284C7" />;
  }
}

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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("simulation"); // default to simulation for high engagement
  const [selectedCollisionDetail, setSelectedCollisionDetail] = useState(null);
  const [hoveredMatrixCell, setHoveredMatrixCell] = useState(null);
  const [selectedNetworkNode, setSelectedNetworkNode] = useState(null);

  // ── Simulation Engine State ──
  const [simTimeHours, setSimTimeHours] = useState(8.0); // 0.0 to 24.0 hours
  const [simIsPlaying, setSimIsPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1); // 1x, 2x, 4x
  const [simPatientAge, setSimPatientAge] = useState(62); // years
  const [simEgfr, setSimEgfr] = useState(75); // mL/min (Kidney function)
  const [simStaggeredHours, setSimStaggeredHours] = useState(0); // 0 = same time, 4 = +4 hours gap
  const animFrameRef = useRef(null);

  // Load Reference Catalog
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await consultationsApi.getPharmaCatalog();
        if (res?.status === "success") {
          setCatalog(res);
        }
      } catch {
        // Fallback handled gracefully
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

  // ── Simulation Animation Loop ──
  useEffect(() => {
    if (!simIsPlaying) return;
    const interval = setInterval(() => {
      setSimTimeHours((prev) => {
        const next = prev + 0.25 * simSpeed;
        if (next >= 24) return 0;
        return Number(next.toFixed(2));
      });
    }, 150);
    return () => clearInterval(interval);
  }, [simIsPlaying, simSpeed]);

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
    setSelectedCollisionDetail(null);
  }

  function handleSwapMedication(oldMedName, newMedName) {
    setSelectedMeds((prev) =>
      prev.map((m) => (m.toLowerCase() === oldMedName.toLowerCase() ? newMedName : m))
    );
    setSelectedCollisionDetail(null);
  }

  // Filter Formulary by Search and Category
  const filteredFormulary = useMemo(() => {
    const list = catalog?.common_medications || [];
    return list.filter((item) => {
      const matchesSearch = !catalogSearch.trim() || item.name.toLowerCase().includes(catalogSearch.toLowerCase().trim()) || item.class.toLowerCase().includes(catalogSearch.toLowerCase().trim());
      if (!matchesSearch) return false;
      if (selectedCategory === "all") return true;
      if (selectedCategory === "cardiac") return /cardio|anticoagulant|antiplatelet|statin|ace|arb|beta|nitrate/i.test(item.class);
      if (selectedCategory === "gi") return /ppi|antacid|gastro|ulcer|h2/i.test(item.class);
      if (selectedCategory === "anti_infective") return /antibiotic|macrolide|fluoroquinolone|penicillin/i.test(item.class);
      if (selectedCategory === "cns") return /ssri|antidepressant|sedative|analgesic|opioid|mood/i.test(item.class);
      if (selectedCategory === "endocrine") return /diabetes|thyroid|metformin|hormone/i.test(item.class);
      if (selectedCategory === "pain") return /nsaid|analgesic|anti-inflammatory/i.test(item.class);
      return true;
    });
  }, [catalog, catalogSearch, selectedCategory]);

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

  // ── Dynamic Real-Time Pharmacokinetic (PK) Math Calculations ──
  const simCalculations = useMemo(() => {
    const t = simTimeHours;
    const hasGrapefruit = selectedDiet.includes("grapefruit");
    const hasLeafyGreens = selectedDiet.includes("leafy_greens");
    const hasHighK = selectedDiet.includes("high_potassium");
    const hasDairy = selectedDiet.includes("dairy_calcium");

    const hasStatin = selectedMeds.some((m) => /statin/i.test(m));
    const hasWarfarin = selectedMeds.some((m) => /warfarin/i.test(m));
    const hasAspirin = selectedMeds.some((m) => /aspirin/i.test(m));
    const hasLisinopril = selectedMeds.some((m) => /lisinopril/i.test(m));
    const hasSpironolactone = selectedMeds.some((m) => /spironolactone/i.test(m));
    const hasClopidogrel = selectedMeds.some((m) => /clopidogrel/i.test(m));
    const hasOmeprazole = selectedMeds.some((m) => /omeprazole/i.test(m));

    // Statin PK Curve (One-compartment model)
    const statinKa = 1.2;
    const statinKe = 0.12 * (simEgfr / 90);
    const statinMultiplier = hasGrapefruit ? 3.2 : 1.0;
    const statinT = Math.max(0, t - 8.0);
    const statinConcentration = hasStatin
      ? Math.max(0, statinMultiplier * 28 * (Math.exp(-statinKe * statinT) - Math.exp(-statinKa * statinT)))
      : 0;

    // Serum Potassium Level (Baseline 4.2 mEq/L)
    let kLevel = 4.2;
    if (hasLisinopril) kLevel += 0.5 * (1 + (90 - simEgfr) / 100);
    if (hasSpironolactone) kLevel += 0.8;
    if (hasHighK) kLevel += 0.7;
    // Time course modulation
    const kModulation = Math.sin((t / 24) * Math.PI) * 0.4;
    kLevel = Math.min(7.2, Math.max(3.5, kLevel + kModulation));

    // INR Level (Baseline 2.2 for Warfarin)
    let inrLevel = hasWarfarin ? 2.4 : 1.0;
    if (hasWarfarin && hasAspirin) inrLevel += 0.8;
    if (hasWarfarin && hasLeafyGreens) inrLevel -= 1.1; // Vitamin K antagonism
    const inrModulation = Math.sin(((t - 4) / 24) * Math.PI) * 0.3;
    inrLevel = Math.max(0.9, inrLevel + (hasWarfarin ? inrModulation : 0));

    // Antiplatelet Efficacy (%)
    let plateletInhibition = 0;
    if (hasClopidogrel) {
      plateletInhibition = hasOmeprazole ? 24 : 84; // CYP2C19 blockade
    }

    // Organ Stress Indicators (0 - 100%)
    const hepaticStress = Math.min(100, Math.round(
      (hasStatin && hasGrapefruit ? 82 : hasStatin ? 28 : 10) +
      (selectedMeds.length * 6) +
      (selectedDiet.includes("alcohol") ? 35 : 0)
    ));

    const renalStress = Math.min(100, Math.round(
      ((90 - simEgfr) * 0.8) +
      (hasLisinopril && hasSpironolactone ? 42 : hasLisinopril ? 18 : 8) +
      (hasHighK ? 15 : 0)
    ));

    const cardiacStress = Math.min(100, Math.round(
      (kLevel > 5.5 ? (kLevel - 5.5) * 45 : 12) +
      (hasAspirin && hasWarfarin ? 30 : 0)
    ));

    const bleedingRiskIndex = Math.min(100, Math.round(
      (inrLevel > 3.0 ? (inrLevel - 3.0) * 35 + 25 : (hasWarfarin ? 20 : 5)) +
      (hasAspirin ? 30 : 0)
    ));

    return {
      statinConcentration: Number(statinConcentration.toFixed(1)),
      kLevel: Number(kLevel.toFixed(2)),
      inrLevel: Number(inrLevel.toFixed(2)),
      plateletInhibition: Math.round(plateletInhibition),
      hepaticStress,
      renalStress,
      cardiacStress,
      bleedingRiskIndex,
      isToxicitySpike: statinConcentration > 45 || kLevel > 5.5 || inrLevel > 4.0,
    };
  }, [simTimeHours, selectedMeds, selectedDiet, simEgfr]);

  // Coordinates for Molecular Network Map
  const networkNodes = useMemo(() => {
    const allItems = [
      ...selectedMeds.map((m) => ({ id: m, label: m, type: "med" })),
      ...selectedDiet.map((d) => {
        const tag = DIETARY_TAGS.find((t) => t.key === d);
        return { id: d, label: tag?.label || d, type: "food", iconName: tag?.iconName };
      }),
    ];
    if (allItems.length === 0) return [];
    const radius = Math.min(170, Math.max(120, allItems.length * 28));
    const centerX = 260;
    const centerY = 190;
    return allItems.map((item, idx) => {
      const angle = (idx / allItems.length) * 2 * Math.PI - Math.PI / 2;
      return {
        ...item,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
  }, [selectedMeds, selectedDiet]);

  const networkLinks = useMemo(() => {
    if (!analysis) return [];
    const links = [];
    (analysis.matrix_pairs || []).forEach((pair) => {
      const sourceNode = networkNodes.find((n) => n.id.toLowerCase() === pair.drug_a.toLowerCase());
      const targetNode = networkNodes.find((n) => n.id.toLowerCase() === pair.drug_b.toLowerCase());
      if (sourceNode && targetNode) {
        links.push({
          source: sourceNode,
          target: targetNode,
          severity: pair.severity,
          warning: pair.warning,
          pairData: pair,
        });
      }
    });
    (analysis.food_interactions || []).forEach((food) => {
      const foodNode = networkNodes.find((n) => n.id.toLowerCase() === food.food_key.toLowerCase());
      (food.matched_drugs || []).forEach((dName) => {
        const drugNode = networkNodes.find((n) => n.id.toLowerCase() === dName.toLowerCase());
        if (foodNode && drugNode) {
          links.push({
            source: foodNode,
            target: drugNode,
            severity: food.severity,
            warning: food.warning,
            foodData: food,
          });
        }
      });
    });
    return links;
  }, [analysis, networkNodes]);

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
        <div style={{ maxWidth: "620px" }}>
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
              "Proactive clinical pharmacology safety analyzer and dynamic pharmacokinetic bio-simulation suite."
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
              minWidth: "165px",
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
            <span>{t("pharma.print_report", "Export Rx Audit")}</span>
          </button>
        </div>
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
          flexWrap: "wrap",
          gap: "2px",
        }}
      >
        {[
          { id: "simulation", label: "Dynamic Bio-Simulation Engine", icon: Play },
          { id: "workbench", label: t("pharma.tab_workbench", "Regimen Workbench"), icon: Layers },
          { id: "matrix", label: t("pharma.tab_matrix", "2D Collision Matrix"), icon: FileSpreadsheet },
          { id: "network", label: "Pathway Map", icon: Network },
          { id: "food", label: t("pharma.tab_food", "Dietary Hazards"), icon: Leaf },
          { id: "library", label: t("pharma.tab_library", "Pharmacology Database"), icon: BookOpen },
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

      {/* ── TAB: DYNAMIC PHARMACOKINETIC BIO-SIMULATION ENGINE ── */}
      {activeTab === "simulation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Simulation Header & Quick Scenarios */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              padding: "18px 22px",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Activity size={18} color="#059669" />
                <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  Pharmacokinetic Time-Course & Physiological Collision Simulator
                </h3>
              </div>
              <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>
                Simulating: {selectedMeds.join(", ") || "No Active Drugs"} + {selectedDiet.join(", ") || "Normal Diet"}
              </span>
            </div>

            {/* Scenario Buttons */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>
                Preset Case Studies:
              </span>
              {SIMULATION_SCENARIOS.map((scen) => (
                <button
                  key={scen.id}
                  type="button"
                  onClick={() => {
                    setSelectedMeds(scen.meds);
                    setSelectedDiet(scen.diet);
                    setSimTimeHours(8.0);
                  }}
                  style={{
                    padding: "5px 11px",
                    background: "#F8FAFC",
                    border: "1px solid #CBD5E1",
                    borderRadius: "6px",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    color: "#334155",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {scen.name}
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Cockpit: Graph + Live Telemetry */}
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: "20px", alignItems: "start" }}>
            {/* Left: 24-Hour Time-Course Curve Graph */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "20px 24px",
                boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div>
                  <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0F172A", margin: "0 0 2px 0" }}>
                    24-Hour Dynamic Plasma Concentration & Biomarker Trajectory
                  </h4>
                  <span style={{ fontSize: "0.74rem", color: "#64748B" }}>
                    Real-time simulation of absorption, metabolic enzyme competition, and toxicity threshold breaches.
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#F1F5F9", padding: "4px 8px", borderRadius: "6px" }}>
                  <Timer size={14} color="#059669" />
                  <strong style={{ fontSize: "0.82rem", color: "#0F172A", fontFamily: "var(--font-mono, monospace)" }}>
                    {String(Math.floor(simTimeHours)).padStart(2, "0")}:{String(Math.round((simTimeHours % 1) * 60)).padStart(2, "0")} HRS
                  </strong>
                </div>
              </div>

              {/* SVG Curve Plotter */}
              <div style={{ position: "relative", width: "100%", height: "240px", background: "#0F172A", borderRadius: "8px", overflow: "hidden", padding: "10px", boxSizing: "border-box" }}>
                <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[40, 80, 120, 160].map((y) => (
                    <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="#1E293B" strokeWidth="1" />
                  ))}
                  {[100, 200, 300, 400].map((x) => (
                    <line key={x} x1={x} y1="0" x2={x} y2="200" stroke="#1E293B" strokeWidth="1" />
                  ))}

                  {/* Red Shaded Danger Zone (Toxicity Threshold) */}
                  <rect x="0" y="0" width="500" height="50" fill="rgba(220, 38, 38, 0.18)" />
                  <line x1="0" y1="50" x2="500" y2="50" stroke="#DC2626" strokeDasharray="4,4" strokeWidth="1.5" />
                  <text x="8" y="42" fill="#F87171" fontSize="10px" fontWeight="700">TOXICITY DANGER THRESHOLD</text>

                  {/* Green Safe Therapeutic Corridor */}
                  <rect x="0" y="50" width="500" height="80" fill="rgba(5, 150, 105, 0.08)" />
                  <text x="8" y="110" fill="#34D399" fontSize="10px" fontWeight="700">OPTIMAL THERAPEUTIC WINDOW</text>

                  {/* Sub-therapeutic Zone */}
                  <text x="8" y="180" fill="#94A3B8" fontSize="10px" fontWeight="700">SUB-THERAPEUTIC / INEFFECTIVE</text>

                  {/* Simulated Statin / Drug Curve (Cyan line) */}
                  <path
                    d={(() => {
                      const points = [];
                      const statinMultiplier = selectedDiet.includes("grapefruit") ? 3.2 : 1.0;
                      for (let hr = 0; hr <= 24; hr += 0.5) {
                        const px = (hr / 24) * 500;
                        const tOffset = Math.max(0, hr - 8.0);
                        const conc = selectedMeds.some((m) => /statin/i.test(m))
                          ? Math.max(0, statinMultiplier * 28 * (Math.exp(-0.1 * tOffset) - Math.exp(-1.2 * tOffset)))
                          : 12 + Math.sin(hr * 0.4) * 8;
                        const py = 200 - (conc / 80) * 180;
                        points.push(`${px},${Math.max(10, Math.min(190, py))}`);
                      }
                      return `M ${points.join(" L ")}`;
                    })()}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="3"
                  />

                  {/* Simulated Potassium / Second Marker Curve (Amber line) */}
                  <path
                    d={(() => {
                      const points = [];
                      for (let hr = 0; hr <= 24; hr += 0.5) {
                        const px = (hr / 24) * 500;
                        const hasLisin = selectedMeds.some((m) => /lisinopril/i.test(m));
                        const hasSpir = selectedMeds.some((m) => /spironolactone/i.test(m));
                        let k = 4.2;
                        if (hasLisin) k += 0.5;
                        if (hasSpir) k += 0.8;
                        if (selectedDiet.includes("high_potassium")) k += 0.7;
                        k += Math.sin((hr / 24) * Math.PI) * 0.4;
                        const py = 200 - ((k - 3.0) / 4.5) * 180;
                        points.push(`${px},${Math.max(10, Math.min(190, py))}`);
                      }
                      return `M ${points.join(" L ")}`;
                    })()}
                    fill="none"
                    stroke="#FBBF24"
                    strokeWidth="2.5"
                    strokeDasharray="5,3"
                  />

                  {/* Current Simulation Time Vertical Scrubber Bar */}
                  <line
                    x1={(simTimeHours / 24) * 500}
                    y1="0"
                    x2={(simTimeHours / 24) * 500}
                    y2="200"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx={(simTimeHours / 24) * 500}
                    cy="40"
                    r="5"
                    fill="#EF4444"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              {/* Interactive Player Controls */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setSimIsPlaying(!simIsPlaying)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 14px",
                      background: simIsPlaying ? "#DC2626" : "#059669",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {simIsPlaying ? <Pause size={14} /> : <Play size={14} />}
                    <span>{simIsPlaying ? "Pause Simulation" : "Run Dynamic Simulation"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimIsPlaying(false);
                      setSimTimeHours(8.0);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "7px 10px",
                      background: "#F1F5F9",
                      border: "1px solid #CBD5E1",
                      borderRadius: "6px",
                      fontSize: "0.76rem",
                      color: "#334155",
                      cursor: "pointer",
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Scrubber Slider */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, maxWidth: "260px" }}>
                  <Clock size={14} color="#64748B" />
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="0.25"
                    value={simTimeHours}
                    onChange={(e) => setSimTimeHours(parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: "#059669", cursor: "pointer" }}
                  />
                </div>

                {/* Speed Toggles */}
                <div style={{ display: "flex", gap: "4px" }}>
                  {[1, 2, 4].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSimSpeed(s)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "1px solid #CBD5E1",
                        background: simSpeed === s ? "#0F172A" : "#FFFFFF",
                        color: simSpeed === s ? "#FFFFFF" : "#334155",
                        fontSize: "0.70rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient Physiology Modifiers */}
              <div style={{ marginTop: "18px", borderTop: "1px solid #F1F5F9", paddingTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700, color: "#64748B" }}>Renal Function (eGFR):</span>
                    <strong style={{ color: simEgfr < 60 ? "#DC2626" : "#059669" }}>{simEgfr} mL/min ({simEgfr < 60 ? "Impaired" : "Normal"})</strong>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="120"
                    value={simEgfr}
                    onChange={(e) => setSimEgfr(parseInt(e.target.value))}
                    style={{ width: "100%", accentColor: "#0284C7", cursor: "pointer" }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700, color: "#64748B" }}>Patient Age Factor:</span>
                    <strong style={{ color: "#0F172A" }}>{simPatientAge} Years</strong>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="90"
                    value={simPatientAge}
                    onChange={(e) => setSimPatientAge(parseInt(e.target.value))}
                    style={{ width: "100%", accentColor: "#0284C7", cursor: "pointer" }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Live Simulated Vitals & Organ Stress Gauges */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Vitals Telemetry Card */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  padding: "18px 20px",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                  <Heart size={16} color="#DC2626" />
                  <h4 style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                    Live Virtual Patient Biomarkers
                  </h4>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ padding: "10px", background: simCalculations.kLevel > 5.5 ? "#FEF2F2" : "#F8FAFC", border: `1px solid ${simCalculations.kLevel > 5.5 ? "#FECDD3" : "#E2E8F0"}`, borderRadius: "8px" }}>
                    <span style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: 700, display: "block" }}>Serum K+ Level</span>
                    <strong style={{ fontSize: "1.1rem", color: simCalculations.kLevel > 5.5 ? "#DC2626" : "#0F172A" }}>
                      {simCalculations.kLevel} <span style={{ fontSize: "0.68rem" }}>mEq/L</span>
                    </strong>
                    <span style={{ fontSize: "0.62rem", color: simCalculations.kLevel > 5.5 ? "#DC2626" : "#059669", display: "block" }}>
                      {simCalculations.kLevel > 5.5 ? "Hyperkalemia Alert" : "Normal: 3.5 - 5.0"}
                    </span>
                  </div>

                  <div style={{ padding: "10px", background: simCalculations.inrLevel > 3.5 || simCalculations.inrLevel < 1.5 ? "#FEF2F2" : "#F8FAFC", border: `1px solid ${simCalculations.inrLevel > 3.5 || simCalculations.inrLevel < 1.5 ? "#FECDD3" : "#E2E8F0"}`, borderRadius: "8px" }}>
                    <span style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: 700, display: "block" }}>INR Coagulation</span>
                    <strong style={{ fontSize: "1.1rem", color: simCalculations.inrLevel > 3.5 || simCalculations.inrLevel < 1.5 ? "#DC2626" : "#0F172A" }}>
                      {simCalculations.inrLevel} <span style={{ fontSize: "0.68rem" }}>INR</span>
                    </strong>
                    <span style={{ fontSize: "0.62rem", color: simCalculations.inrLevel > 3.5 ? "#DC2626" : "#059669", display: "block" }}>
                      {simCalculations.inrLevel > 3.5 ? "High Bleed Risk" : simCalculations.inrLevel < 1.5 && selectedMeds.includes("Warfarin") ? "Clot Hazard" : "Target: 2.0 - 3.0"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Organ Load Stress Gauges */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  padding: "18px 20px",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                  <Gauge size={16} color="#059669" />
                  <h4 style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                    Simulated Organ Stress & Clearance Load
                  </h4>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {/* Hepatic CYP Load */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "2px" }}>
                      <span style={{ color: "#334155", fontWeight: 600 }}>Hepatic CYP3A4 / Metabolic Load</span>
                      <strong style={{ color: simCalculations.hepaticStress > 60 ? "#DC2626" : "#059669" }}>{simCalculations.hepaticStress}%</strong>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${simCalculations.hepaticStress}%`, height: "100%", background: simCalculations.hepaticStress > 60 ? "#DC2626" : "#059669", transition: "width 0.2s ease" }} />
                    </div>
                  </div>

                  {/* Renal Clearance Burden */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "2px" }}>
                      <span style={{ color: "#334155", fontWeight: 600 }}>Renal Tubular Secretion Burden</span>
                      <strong style={{ color: simCalculations.renalStress > 60 ? "#DC2626" : "#059669" }}>{simCalculations.renalStress}%</strong>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${simCalculations.renalStress}%`, height: "100%", background: simCalculations.renalStress > 60 ? "#DC2626" : "#0284C7", transition: "width 0.2s ease" }} />
                    </div>
                  </div>

                  {/* Cardiovascular Risk Index */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "2px" }}>
                      <span style={{ color: "#334155", fontWeight: 600 }}>Cardiovascular Arrhythmia Risk</span>
                      <strong style={{ color: simCalculations.cardiacStress > 50 ? "#DC2626" : "#059669" }}>{simCalculations.cardiacStress}%</strong>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${simCalculations.cardiacStress}%`, height: "100%", background: simCalculations.cardiacStress > 50 ? "#DC2626" : "#10B981", transition: "width 0.2s ease" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

            {/* Custom Drug Input Field */}
            <form onSubmit={handleAddCustomMed} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={14} color="#94A3B8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  value={customMedInput}
                  onChange={(e) => setCustomMedInput(e.target.value)}
                  placeholder={t("pharma.type_med_placeholder", "Type custom drug name (e.g. Aspirin, Warfarin, Metformin)...")}
                  style={{
                    width: "100%",
                    padding: "9px 12px 9px 34px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.82rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: "9px 16px",
                  background: "#059669",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.80rem",
                  fontWeight: 700,
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

            {/* Currently Active Medication Chips */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "0.70rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "8px" }}>
                {t("pharma.current_regimen_label", "Current Active Regimen:")}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", minHeight: "38px", padding: "8px", background: "#F8FAFC", borderRadius: "8px", border: "1px dashed #CBD5E1" }}>
                {selectedMeds.length === 0 ? (
                  <span style={{ fontSize: "0.76rem", color: "#94A3B8", fontStyle: "italic", margin: "auto 0" }}>
                    {t("pharma.no_meds_selected", "No medications selected. Click items from catalog below.")}
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
                        background: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        borderRadius: "6px",
                        fontSize: "0.80rem",
                        fontWeight: 700,
                        color: "#0F172A",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
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

            {/* Category Filter for Formulary */}
            <div style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
                {DRUG_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: "3px 8px",
                      borderRadius: "12px",
                      fontSize: "0.68rem",
                      fontWeight: selectedCategory === cat.id ? 700 : 500,
                      background: selectedCategory === cat.id ? "#0F172A" : "#F1F5F9",
                      color: selectedCategory === cat.id ? "#FFFFFF" : "#475569",
                      border: "none",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Catalog Click Chips */}
            <div>
              <label style={{ display: "block", fontSize: "0.70rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "8px" }}>
                {t("pharma.quick_add_catalog", "Quick Add from Formulary Catalog:")}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
                {filteredFormulary.map((item) => {
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
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "all 0.12s ease",
                      }}
                    >
                      {isSelected ? <Check size={12} color="#059669" /> : <Plus size={12} color="#94A3B8" />}
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dietary Selection in Workbench */}
            <div style={{ marginTop: "20px", borderTop: "1px solid #F1F5F9", paddingTop: "14px" }}>
              <label style={{ display: "block", fontSize: "0.70rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "8px" }}>
                {t("pharma.patient_dietary_habits", "Patient Dietary Factors & Nutritional Intake:")}
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
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "6px",
                          background: isSelected ? "#DCFCE7" : "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {renderDietIcon(diet.iconName, 14)}
                      </div>
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
                <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                  <Activity size={16} color="#059669" />
                  {t("pharma.drug_drug_collisions", "Drug-to-Drug Collisions Detected")} ({analysis?.drug_interactions?.length || 0})
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

                    const targetDrugA = (item.matched_pair?.[0] || item.drug_a).toLowerCase();
                    const targetDrugB = (item.matched_pair?.[1] || item.drug_b).toLowerCase();
                    const altA = ALTERNATIVE_SUGGESTIONS[targetDrugA];
                    const altB = ALTERNATIVE_SUGGESTIONS[targetDrugB];

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
                            <Pill size={14} color={badgeColor} />
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

                        <div style={{ padding: "6px 10px", background: "#F8FAFC", borderRadius: "6px", borderLeft: `3px solid ${badgeColor}`, marginBottom: altA || altB ? "8px" : "0" }}>
                          <span style={{ fontSize: "0.72rem", color: "#0F172A", fontWeight: 600 }}>
                            Clinical Action: {item.recommendation || "Consult prescribing physician to adjust dosing interval or select substitute."}
                          </span>
                        </div>

                        {/* Interactive Safe Alternative Swapper */}
                        {(altA || altB) && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ECFDF5", border: "1px dashed #A7F3D0", padding: "6px 10px", borderRadius: "6px" }}>
                            <div style={{ fontSize: "0.70rem", color: "#065F46" }}>
                              <strong>Safe Alternative:</strong> {altA ? `${item.matched_pair?.[0]} → ${altA.alternative}` : `${item.matched_pair?.[1]} → ${altB.alternative}`}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (altA) handleSwapMedication(item.matched_pair?.[0] || item.drug_a, altA.alternative);
                                else if (altB) handleSwapMedication(item.matched_pair?.[1] || item.drug_b, altB.alternative);
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 8px",
                                background: "#059669",
                                color: "#FFFFFF",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              <ArrowRightLeft size={11} />
                              <span>1-Click Swap</span>
                            </button>
                          </div>
                        )}
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
                <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                  <Leaf size={16} color="#D97706" />
                  {t("pharma.food_contraindications", "Drug-Food Dietary Contraindications")} ({analysis?.food_interactions?.length || 0})
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
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {renderDietIcon(food.food_key, 14)}
                          <strong style={{ fontSize: "0.84rem", color: "#92400E" }}>
                            {food.food_name} ↔ {food.matched_drugs?.join(", ") || "Active Drugs"}
                          </strong>
                        </div>
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
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0F172A", margin: "0 0 4px 0" }}>
                {t("pharma.matrix_title", "2D Pharmacological Collision Cross-Table")}
              </h3>
              <p style={{ fontSize: "0.80rem", color: "#64748B", margin: 0 }}>
                {t("pharma.matrix_desc", "Visual cross-table comparing every selected medication against every other drug in the regimen. Hover over cells to see crosshairs; click any cell to inspect and swap.")}
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", color: "#DC2626", fontWeight: 700 }}>
                <ShieldAlert size={12} /> Critical Hazard
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", color: "#D97706", fontWeight: 700 }}>
                <AlertTriangle size={12} /> Caution
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", color: "#059669", fontWeight: 700 }}>
                <CheckCircle2 size={12} /> Safe Pair
              </span>
            </div>
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
                  {selectedMeds.map((med) => {
                    const isColHovered = hoveredMatrixCell && hoveredMatrixCell.col === med;
                    return (
                      <th
                        key={med}
                        style={{
                          padding: "10px",
                          border: "1px solid #E2E8F0",
                          background: isColHovered ? "#E0F2FE" : "#F8FAFC",
                          fontSize: "0.76rem",
                          color: isColHovered ? "#0369A1" : "#0F172A",
                          fontWeight: 700,
                          textAlign: "center",
                          transition: "background 0.15s ease",
                        }}
                      >
                        {med}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {selectedMeds.map((medRow) => {
                  const isRowHovered = hoveredMatrixCell && hoveredMatrixCell.row === medRow;
                  return (
                    <tr key={medRow}>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #E2E8F0",
                          background: isRowHovered ? "#E0F2FE" : "#F8FAFC",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: isRowHovered ? "#0369A1" : "#0F172A",
                          transition: "background 0.15s ease",
                        }}
                      >
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
                              onMouseEnter={() => setHoveredMatrixCell({ row: medRow, col: medCol })}
                              onMouseLeave={() => setHoveredMatrixCell(null)}
                              style={{
                                padding: "10px",
                                border: "1px solid #E2E8F0",
                                background: isCrit ? "#FEE2E2" : "#FEF3C7",
                                textAlign: "center",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                outline: (hoveredMatrixCell?.row === medRow && hoveredMatrixCell?.col === medCol) ? "2px solid #0F172A" : "none",
                              }}
                              title={match.warning}
                            >
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.74rem", fontWeight: 800, color: isCrit ? "#DC2626" : "#D97706" }}>
                                {isCrit ? <ShieldAlert size={13} /> : <AlertTriangle size={13} />}
                                <span>{match.severity.toUpperCase()}</span>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={medCol}
                            onMouseEnter={() => setHoveredMatrixCell({ row: medRow, col: medCol })}
                            onMouseLeave={() => setHoveredMatrixCell(null)}
                            style={{
                              padding: "10px",
                              border: "1px solid #E2E8F0",
                              background: "#F0FDF4",
                              textAlign: "center",
                              transition: "all 0.15s ease",
                              outline: (hoveredMatrixCell?.row === medRow && hoveredMatrixCell?.col === medCol) ? "2px solid #059669" : "none",
                            }}
                          >
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", fontWeight: 700, color: "#059669" }}>
                              <CheckCircle2 size={12} />
                              <span>SAFE</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB 3: INTERACTIVE PATHWAY & NETWORK MAP ── */}
      {activeTab === "network" && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 12px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0F172A", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                <Network size={16} color="#059669" />
                Interactive Pharmacology Network & Pathway Graph
              </h3>
              <p style={{ fontSize: "0.80rem", color: "#64748B", margin: 0 }}>
                Visual biochemical interaction map connecting active medications and dietary agents. Red/Amber lines indicate metabolic enzyme interference.
              </p>
            </div>
            {selectedNetworkNode && (
              <button
                type="button"
                onClick={() => setSelectedNetworkNode(null)}
                style={{ fontSize: "0.74rem", padding: "4px 8px", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: "6px", cursor: "pointer" }}
              >
                Reset Node Filter
              </button>
            )}
          </div>

          {networkNodes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>
              <Network size={36} style={{ margin: "0 auto 10px auto", opacity: 0.5 }} />
              <p style={{ fontSize: "0.88rem", margin: 0 }}>Select medications or dietary items in the Workbench tab to render the interactive pathway network.</p>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", position: "relative" }}>
              <svg width="520" height="380" viewBox="0 0 520 380" style={{ overflow: "visible" }}>
                {/* Connecting Links */}
                {networkLinks.map((link, lIdx) => {
                  const isCritical = link.severity === "critical";
                  const isHigh = link.severity === "high";
                  const strokeColor = isCritical ? "#DC2626" : isHigh ? "#EA580C" : "#D97706";
                  const isHighlighted =
                    !selectedNetworkNode ||
                    selectedNetworkNode.id === link.source.id ||
                    selectedNetworkNode.id === link.target.id;

                  return (
                    <g key={lIdx} opacity={isHighlighted ? 1 : 0.15}>
                      <line
                        x1={link.source.x}
                        y1={link.source.y}
                        x2={link.target.x}
                        y2={link.target.y}
                        stroke={strokeColor}
                        strokeWidth={isCritical ? 3 : 2}
                        strokeDasharray={isCritical ? "6,4" : "none"}
                      />
                    </g>
                  );
                })}

                {/* Nodes */}
                {networkNodes.map((node) => {
                  const isSelected = selectedNetworkNode?.id === node.id;
                  const isMed = node.type === "med";
                  const nodeBg = isMed ? "#059669" : "#D97706";

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNetworkNode(isSelected ? null : node)}
                      style={{ cursor: "pointer" }}
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isSelected ? 26 : 22}
                        fill={nodeBg}
                        stroke="#FFFFFF"
                        strokeWidth="3"
                        style={{
                          filter: isSelected ? "drop-shadow(0 0 8px rgba(5,150,105,0.6))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                          transition: "all 0.15s ease",
                        }}
                      />
                      <text
                        x={node.x}
                        y={node.y + 4}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize={isMed ? "9px" : "8px"}
                        fontWeight="800"
                        pointerEvents="none"
                      >
                        {isMed ? "Rx" : "Diet"}
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 36}
                        textAnchor="middle"
                        fill="#0F172A"
                        fontSize="11px"
                        fontWeight="700"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: DIETARY & FOOD CONTRAINDICATIONS ── */}
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
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {renderDietIcon(rule.food_key, 14)}
                    </div>
                    <h4 style={{ fontSize: "0.90rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                      {rule.food_name}
                    </h4>
                  </div>
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

      {/* ── TAB 5: PHARMACOLOGY REFERENCE LIBRARY ── */}
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

      {/* ── Modal: Collision Detail Inspector with 1-Click Alternative Swapper ── */}
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
              maxWidth: "540px",
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

            <div style={{ padding: "12px", background: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "16px" }}>
              <strong style={{ fontSize: "0.78rem", color: "#0F172A", display: "block", marginBottom: "4px" }}>
                Recommended Clinical Action:
              </strong>
              <p style={{ fontSize: "0.78rem", color: "#475569", margin: 0, lineHeight: 1.45 }}>
                {selectedCollisionDetail.recommendation || "Consult prescribing physician to adjust dosing interval or select a non-interacting pharmacological substitute."}
              </p>
            </div>

            {/* 1-Click Swap Recommendation */}
            {(() => {
              const drugA = (selectedCollisionDetail.drug_a || "").toLowerCase();
              const drugB = (selectedCollisionDetail.drug_b || "").toLowerCase();
              const altA = ALTERNATIVE_SUGGESTIONS[drugA];
              const altB = ALTERNATIVE_SUGGESTIONS[drugB];
              if (altA || altB) {
                const target = altA ? selectedCollisionDetail.drug_a : selectedCollisionDetail.drug_b;
                const repl = altA ? altA.alternative : altB.alternative;
                const reason = altA ? altA.reason : altB.reason;
                return (
                  <div style={{ padding: "12px", background: "#ECFDF5", borderRadius: "8px", border: "1px solid #A7F3D0", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "0.80rem", color: "#065F46" }}>
                        1-Click Clinical Substitution:
                      </strong>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#059669" }}>Recommended</span>
                    </div>
                    <p style={{ fontSize: "0.76rem", color: "#047857", margin: "0 0 10px 0", lineHeight: 1.4 }}>
                      Replace <strong>{target}</strong> with <strong>{repl}</strong>: {reason}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSwapMedication(target, repl)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        background: "#059669",
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "0.80rem",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <ArrowRightLeft size={14} />
                      <span>Apply 1-Click Medication Swap ({target} → {repl})</span>
                    </button>
                  </div>
                );
              }
              return null;
            })()}

            <button
              type="button"
              onClick={() => setSelectedCollisionDetail(null)}
              style={{
                width: "100%",
                padding: "10px",
                background: "#0F172A",
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
