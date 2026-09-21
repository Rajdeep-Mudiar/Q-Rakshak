import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ShieldCheck,
  Activity,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  Layers,
  FileText,
  Info,
  CheckCircle2,
  CalendarDays,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Stethoscope,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { clinicalApi } from "../../../api/clinical";
import { useLanguage } from "../../../context/LanguageContext.jsx";

export default function PredictionTimeline({
  patientId = "USR-5EF52B",
  currentUser = null,
  lastPredictionResult = null,
  activeStudy = null,
}) {
  const { t } = useLanguage();
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState("30 Days");
  const [selectedDisease, setSelectedDisease] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [expandedDates, setExpandedDates] = useState({});
  const [viewMode, setViewMode] = useState("aggregated"); // "aggregated" | "all_runs"

  const fetchTimeline = useCallback(
    async (isManualRefresh = false) => {
      if (!patientId) return;
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await clinicalApi.getPatientTimeline(
          patientId,
          timeFilter,
          timeFilter === "Custom Range" ? customStart : null,
          timeFilter === "Custom Range" ? customEnd : null,
          selectedDisease
        );

        if (res && res.timeline) {
          setTimelineData(res.timeline);
        } else {
          setTimelineData(null);
        }
      } catch (err) {
        console.error("Failed to load patient longitudinal timeline:", err);
        setError(
          err.response?.data?.detail ||
            "Unable to retrieve longitudinal prediction timeline. Please ensure you are authorized."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [patientId, timeFilter, customStart, customEnd, selectedDisease]
  );

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // When a new prediction is executed above in the cockpit, automatically reload timeline
  useEffect(() => {
    if (lastPredictionResult && lastPredictionResult.patient_id === patientId) {
      const timer = setTimeout(() => {
        fetchTimeline(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [lastPredictionResult, patientId, fetchTimeline]);

  const toggleDateExpansion = (dateStr) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  const hasHistory =
    timelineData?.has_history &&
    Array.isArray(timelineData?.daily_aggregates) &&
    timelineData.daily_aggregates.length > 0;

  const dailyAggregates = timelineData?.daily_aggregates || [];
  const trend = timelineData?.trend || {};
  const earlyWarning = timelineData?.early_warning || {};
  const weekly = timelineData?.weekly_analysis;
  const monthly = timelineData?.monthly_analysis;

  // Synchronize disease filter when parent cockpit activeStudy changes
  useEffect(() => {
    if (!activeStudy) return;
    const studyMap = {
      breast_cancer: "Breast Oncology (WDBC)",
      heart: "Cardiology (Cleveland)",
      diabetes: "Metabolic / Diabetes (PIMA)",
      pneumonia: "Chest Radiography (Pneu)",
      skin: "Dermatoscopy (Skin Cancer)",
      parkinsons: "Neurodegeneration (Parkinson's Voice)",
    };
    if (studyMap[activeStudy]) {
      setSelectedDisease(studyMap[activeStudy]);
    }
  }, [activeStudy]);

  const canonicalDiseases = [
    "Breast Oncology (WDBC)",
    "Cardiology (Cleveland)",
    "Metabolic / Diabetes (PIMA)",
    "Chest Radiography (Pneu)",
    "Dermatoscopy (Skin Cancer)",
    "Neurodegeneration (Parkinson's Voice)",
  ];
  const availableDiseases = Array.from(
    new Set([
      ...canonicalDiseases,
      ...(timelineData?.available_diseases || []),
    ])
  );

  // Formatting helper
  const formatDate = (dStr) => {
    if (!dStr) return "";
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: dStr.length > 7 ? "numeric" : undefined,
      });
    } catch {
      return dStr;
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "N/A";
    try {
      if (ts.includes("T") || ts.endsWith("Z")) {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        }
      }
      if (ts.includes(" ")) {
        return ts.split(" ")[1] || ts;
      }
      return ts;
    } catch {
      return ts;
    }
  };

  // Severity color helper
  const getRiskColor = (score) => {
    if (score >= 70) return "#dc2626"; // high / danger
    if (score >= 40) return "#d97706"; // moderate / amber
    return "#16a34a"; // optimal / green
  };

  return (
    <section
      className="prediction-timeline-section"
      style={{
        marginTop: "16px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.05)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >
      {/* ── SECTION HEADER ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          borderBottom: "1px solid #f1f5f9",
          paddingBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Activity size={20} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                Longitudinal Prediction Timeline & Health Trajectory
              </h3>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: hasHistory ? "#dbeafe" : "#f1f5f9",
                  color: hasHistory ? "#1d4ed8" : "#64748b",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                Patient: {patientId}
              </span>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: selectedDisease === "all" ? "#eff6ff" : "#fef3c7",
                  color: selectedDisease === "all" ? "#1d4ed8" : "#b45309",
                  border: `1px solid ${selectedDisease === "all" ? "#bfdbfe" : "#fde68a"}`,
                }}
              >
                {selectedDisease === "all" ? "Protocol: All Diseases (Combined)" : `Protocol: ${selectedDisease}`}
              </span>
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                margin: "3px 0 0 0",
              }}
            >
              Calibrated longitudinal tracking of genuine quantum-classical AI predictions across calendar dates with OLS trend analysis.
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={() => fetchTimeline(true)}
            disabled={refreshing || loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#334155",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: refreshing || loading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
            title="Reload latest patient prediction timeline"
          >
            <RefreshCw
              size={13}
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh Timeline"}</span>
          </button>
        </div>
      </div>

      {/* ── FILTER TOOLBAR ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          background: "#f8fafc",
          padding: "8px 12px",
          borderRadius: "8px",
          border: "1px solid #edf2f7",
        }}
      >
        {/* Left Controls: Disease Dropdown + Time Window Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Disease Protocol Dropdown Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Stethoscope size={13} color="#2563eb" />
              <span>Disease:</span>
            </span>
            <select
              value={selectedDisease}
              onChange={(e) => setSelectedDisease(e.target.value)}
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                cursor: "pointer",
              }}
              title="Filter longitudinal timeline by specific disease protocol"
            >
              <option value="all">All Diseases (Holistic View)</option>
              {availableDiseases.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <span style={{ color: "#cbd5e1" }}>|</span>

          {/* Time Window Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#475569",
                marginRight: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Window:
            </span>
          {["7 Days", "30 Days", "3 Months", "6 Months", "1 Year", "Custom Range"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setTimeFilter(opt)}
              style={{
                fontSize: "0.72rem",
                fontWeight: timeFilter === opt ? 700 : 500,
                padding: "4px 10px",
                borderRadius: "6px",
                border: timeFilter === opt ? "1px solid #2563eb" : "1px solid #e2e8f0",
                background: timeFilter === opt ? "#2563eb" : "#ffffff",
                color: timeFilter === opt ? "#ffffff" : "#475569",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {opt}
            </button>
          ))}
          </div>
        </div>

        {/* View mode toggle */}
        {hasHistory && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              View:
            </span>
            <button
              type="button"
              onClick={() => setViewMode("aggregated")}
              style={{
                fontSize: "0.72rem",
                fontWeight: viewMode === "aggregated" ? 700 : 500,
                padding: "4px 10px",
                borderRadius: "6px",
                border: viewMode === "aggregated" ? "1px solid #0f172a" : "1px solid #e2e8f0",
                background: viewMode === "aggregated" ? "#0f172a" : "#ffffff",
                color: viewMode === "aggregated" ? "#ffffff" : "#475569",
                cursor: "pointer",
              }}
            >
              Daily Averages
            </button>
            <button
              type="button"
              onClick={() => setViewMode("all_runs")}
              style={{
                fontSize: "0.72rem",
                fontWeight: viewMode === "all_runs" ? 700 : 500,
                padding: "4px 10px",
                borderRadius: "6px",
                border: viewMode === "all_runs" ? "1px solid #0f172a" : "1px solid #e2e8f0",
                background: viewMode === "all_runs" ? "#0f172a" : "#ffffff",
                color: viewMode === "all_runs" ? "#ffffff" : "#475569",
                cursor: "pointer",
              }}
            >
              Individual Runs
            </button>
          </div>
        )}
      </div>

      {/* Custom date range inputs if selected */}
      {timeFilter === "Custom Range" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 14px",
            background: "#eff6ff",
            borderRadius: "8px",
            border: "1px solid #bfdbfe",
          }}
        >
          <label style={{ fontSize: "0.72rem", color: "#1e40af", fontWeight: 600 }}>
            Start Date:
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              style={{
                marginLeft: "6px",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #93c5fd",
                fontSize: "0.72rem",
              }}
            />
          </label>
          <label style={{ fontSize: "0.72rem", color: "#1e40af", fontWeight: 600 }}>
            End Date:
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              style={{
                marginLeft: "6px",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #93c5fd",
                fontSize: "0.72rem",
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => fetchTimeline()}
            style={{
              padding: "4px 12px",
              background: "#2563eb",
              color: "#ffffff",
              borderRadius: "4px",
              border: 0,
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Apply Filter
          </button>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "0.78rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertTriangle size={16} color="#dc2626" />
          <span>{error}</span>
        </div>
      )}

      {/* ── STATE 1: LOADING ── */}
      {loading && !timelineData && (
        <div
          style={{
            padding: "40px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            color: "#64748b",
          }}
        >
          <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", color: "#2563eb" }} />
          <p style={{ fontSize: "0.8rem", margin: 0 }}>
            Querying clinical ledger for genuine patient prediction history...
          </p>
        </div>
      )}

      {/* ── STATE 2: ZERO HISTORICAL DATA (EXPLICIT EMPTY STATE - NO DUMMY DATA) ── */}
      {!loading && !hasHistory && (
        <div
          style={{
            padding: "36px 20px",
            background: "#f8fafc",
            border: "1.5px dashed #cbd5e1",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#e2e8f0",
              color: "#475569",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CalendarDays size={24} />
          </div>
          <div>
            <h4
              style={{
                fontSize: "0.95rem",
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
              }}
            >
              {selectedDisease === "all"
                ? "No Previous Prediction Analyses Available"
                : `No Previous ${selectedDisease} Analyses Available`}
            </h4>
            <p
              style={{
                fontSize: "0.78rem",
                color: "#64748b",
                maxWidth: "520px",
                margin: "6px auto 0 auto",
                lineHeight: 1.5,
              }}
            >
              {selectedDisease === "all" ? (
                <>
                  No previous prediction analyses are available for patient{" "}
                  <strong style={{ color: "#0f172a" }}>{patientId}</strong> yet. Run your first health checkup evaluation using the diagnostic cockpit above to start your genuine longitudinal health timeline.
                </>
              ) : (
                <>
                  No previous prediction analyses for <strong style={{ color: "#0f172a" }}>{selectedDisease}</strong> are available for patient{" "}
                  <strong style={{ color: "#0f172a" }}>{patientId}</strong> yet. Run a {selectedDisease} checkup using the diagnostic cockpit above to begin tracking this protocol.
                </>
              )}
            </p>
          </div>
          {selectedDisease !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedDisease("all")}
              style={{
                background: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              View All Disease Records
            </button>
          )}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#eff6ff",
              color: "#1d4ed8",
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "0.72rem",
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            <Sparkles size={13} />
            <span>Zero Simulated Data: Points appear automatically after actual diagnostic execution.</span>
          </div>
        </div>
      )}

      {/* ── STATE 3: REAL PATIENT LONGITUDINAL HISTORY ── */}
      {!loading && hasHistory && (
        <>
          {/* Top Metric Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            {/* Card 1: Latest Daily Average Risk */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Latest Daily Risk Score
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 900,
                    color: getRiskColor(dailyAggregates[dailyAggregates.length - 1].risk_score),
                    letterSpacing: "-0.02em",
                  }}
                >
                  {dailyAggregates[dailyAggregates.length - 1].risk_score}%
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background:
                      dailyAggregates[dailyAggregates.length - 1].risk_score >= 70
                        ? "#fee2e2"
                        : dailyAggregates[dailyAggregates.length - 1].risk_score >= 40
                        ? "#fef3c7"
                        : "#dcfce7",
                    color:
                      dailyAggregates[dailyAggregates.length - 1].risk_score >= 70
                        ? "#b91c1c"
                        : dailyAggregates[dailyAggregates.length - 1].risk_score >= 40
                        ? "#b45309"
                        : "#15803d",
                  }}
                >
                  {dailyAggregates[dailyAggregates.length - 1].risk_score >= 70
                    ? "Elevated"
                    : dailyAggregates[dailyAggregates.length - 1].risk_score >= 40
                    ? "Moderate"
                    : "Optimal"}
                </span>
              </div>
              <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                As of {formatDate(dailyAggregates[dailyAggregates.length - 1].date)} ({dailyAggregates[dailyAggregates.length - 1].count} {dailyAggregates[dailyAggregates.length - 1].count === 1 ? "run" : "runs averaged"})
              </span>
            </div>

            {/* Card 2: Longitudinal Trend Direction & Slope */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Longitudinal Trend Direction
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {trend.trend_direction === "Increasing" ? (
                  <TrendingUp size={22} color="#dc2626" />
                ) : trend.trend_direction === "Decreasing" ? (
                  <TrendingDown size={22} color="#16a34a" />
                ) : trend.trend_direction === "Stable" ? (
                  <Minus size={22} color="#2563eb" />
                ) : (
                  <Clock size={22} color="#64748b" />
                )}
                <span
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 800,
                    color:
                      trend.trend_direction === "Increasing"
                        ? "#dc2626"
                        : trend.trend_direction === "Decreasing"
                        ? "#16a34a"
                        : trend.trend_direction === "Stable"
                        ? "#2563eb"
                        : "#64748b",
                  }}
                >
                  {trend.trend_direction || "Evaluating"}
                </span>
              </div>
              <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                {trend.slope !== null && trend.slope !== undefined ? (
                  <>
                    OLS Slope:{" "}
                    <strong>
                      {trend.slope > 0 ? `+${trend.slope}` : trend.slope}%/day
                    </strong>{" "}
                    (R² = {trend.r_squared ?? "N/A"})
                  </>
                ) : (
                  "Requires ≥ 2 distinct calendar days"
                )}
              </span>
            </div>

            {/* Card 3: Historical Baseline Net Change */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Baseline Net Change
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 900,
                    color:
                      trend.absolute_change > 0
                        ? "#dc2626"
                        : trend.absolute_change < 0
                        ? "#16a34a"
                        : "#0f172a",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {trend.absolute_change > 0
                    ? `+${trend.absolute_change}%`
                    : `${trend.absolute_change}%`}
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: trend.percentage_change > 0 ? "#dc2626" : "#16a34a",
                  }}
                >
                  ({trend.percentage_change > 0 ? `+${trend.percentage_change}%` : `${trend.percentage_change}%`} relative)
                </span>
              </div>
              <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                {timelineData.total_records} total analyses across {dailyAggregates.length} calendar {dailyAggregates.length === 1 ? "day" : "days"}
              </span>
            </div>

            {/* Card 4: 90% Risk Threshold Crossing Trajectory */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                90% Risk Threshold Forecast
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 800,
                    color:
                      earlyWarning.days_to_threshold && earlyWarning.days_to_threshold < 60
                        ? "#dc2626"
                        : "#0f172a",
                  }}
                >
                  {earlyWarning.days_to_threshold
                    ? `In ${earlyWarning.days_to_threshold} Days`
                    : "No Crossing Trajectory"}
                </span>
              </div>
              <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                {earlyWarning.threshold_crossing_date
                  ? `Est. Date: ${earlyWarning.threshold_crossing_date}`
                  : "Patient maintains sub-critical equilibrium"}
              </span>
            </div>
          </div>

          {/* ── DEDICATED EARLY WARNING INDICATOR BANNER ── */}
          <div
            style={{
              background:
                earlyWarning.severity === "danger"
                  ? "#fef2f2"
                  : earlyWarning.severity === "warning"
                  ? "#fffbeb"
                  : "#f0fdf4",
              borderLeft: `4px solid ${
                earlyWarning.severity === "danger"
                  ? "#dc2626"
                  : earlyWarning.severity === "warning"
                  ? "#d97706"
                  : "#16a34a"
              }`,
              borderTop: "1px solid #f1f5f9",
              borderRight: "1px solid #f1f5f9",
              borderBottom: "1px solid #f1f5f9",
              borderRadius: "6px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            {earlyWarning.severity === "danger" ? (
              <AlertTriangle size={20} color="#dc2626" style={{ marginTop: "2px", flexShrink: 0 }} />
            ) : earlyWarning.severity === "warning" ? (
              <AlertTriangle size={20} color="#d97706" style={{ marginTop: "2px", flexShrink: 0 }} />
            ) : (
              <ShieldCheck size={20} color="#16a34a" style={{ marginTop: "2px", flexShrink: 0 }} />
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    color:
                      earlyWarning.severity === "danger"
                        ? "#991b1b"
                        : earlyWarning.severity === "warning"
                        ? "#92400e"
                        : "#166534",
                  }}
                >
                  Early Disease Risk Trajectory Indicator: {earlyWarning.status?.replace(/_/g, " ")}
                </span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "4px",
                    background: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.1)",
                    color: "#475569",
                  }}
                >
                  Decision-Support Calibrated
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#334155",
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {earlyWarning.narrative}
              </p>
              {earlyWarning.recommendation && (
                <div
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "#1e40af",
                    marginTop: "2px",
                  }}
                >
                  Recommendation: {earlyWarning.recommendation}
                </div>
              )}
            </div>
          </div>

          {/* ── WEEKLY & MONTHLY WINDOW COMPARISONS ── */}
          {(weekly || monthly) && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "12px",
              }}
            >
              {weekly && (
                <div
                  style={{
                    background: weekly.is_elevated_jump ? "#fff7ed" : "#f8fafc",
                    border: `1px solid ${weekly.is_elevated_jump ? "#fed7aa" : "#e2e8f0"}`,
                    borderRadius: "8px",
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569" }}>
                      7-Day Window Comparison
                    </span>
                    {weekly.direction === "Increasing" ? (
                      <span style={{ display: "flex", alignItems: "center", fontSize: "0.7rem", color: "#ea580c", fontWeight: 700 }}>
                        <ArrowUpRight size={14} /> +{weekly.percentage_change}%
                      </span>
                    ) : weekly.direction === "Decreasing" ? (
                      <span style={{ display: "flex", alignItems: "center", fontSize: "0.7rem", color: "#16a34a", fontWeight: 700 }}>
                        <ArrowDownRight size={14} /> {weekly.percentage_change}%
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700 }}>
                        Stable
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#334155" }}>
                    <span>Current 7d Mean: <strong>{weekly.current_week_avg}%</strong></span>
                    <span>Prior 7d Mean: <strong>{weekly.previous_week_avg !== null ? `${weekly.previous_week_avg}%` : "None"}</strong></span>
                  </div>
                  {weekly.alert && (
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#c2410c" }}>
                      ⚠ {weekly.alert}
                    </span>
                  )}
                </div>
              )}

              {monthly && (
                <div
                  style={{
                    background: monthly.is_elevated_jump ? "#fff7ed" : "#f8fafc",
                    border: `1px solid ${monthly.is_elevated_jump ? "#fed7aa" : "#e2e8f0"}`,
                    borderRadius: "8px",
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569" }}>
                      30-Day Window Comparison
                    </span>
                    {monthly.direction === "Increasing" ? (
                      <span style={{ display: "flex", alignItems: "center", fontSize: "0.7rem", color: "#ea580c", fontWeight: 700 }}>
                        <ArrowUpRight size={14} /> +{monthly.percentage_change}%
                      </span>
                    ) : monthly.direction === "Decreasing" ? (
                      <span style={{ display: "flex", alignItems: "center", fontSize: "0.7rem", color: "#16a34a", fontWeight: 700 }}>
                        <ArrowDownRight size={14} /> {monthly.percentage_change}%
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700 }}>
                        Stable
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#334155" }}>
                    <span>Current 30d Mean: <strong>{monthly.current_month_avg}%</strong></span>
                    <span>Prior 30d Mean: <strong>{monthly.previous_month_avg !== null ? `${monthly.previous_month_avg}%` : "None"}</strong></span>
                  </div>
                  {monthly.alert && (
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#c2410c" }}>
                      ⚠ {monthly.alert}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Model Drift Warning if detected */}
          {timelineData.version_drift_detected && (
            <div
              style={{
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                color: "#0369a1",
                padding: "10px 14px",
                borderRadius: "6px",
                fontSize: "0.72rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Info size={14} />
              <span>{timelineData.version_drift_note}</span>
            </div>
          )}

          {/* ── LINEAR TREND VISUALIZATION (RECHARTS) ── */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div>
                <h4 style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Longitudinal Risk Trajectory Curve
                </h4>
                <p style={{ fontSize: "0.7rem", color: "#64748b", margin: 0 }}>
                  {viewMode === "aggregated"
                    ? "Plotting same-day daily average risk scores across calendar dates."
                    : "Plotting individual diagnostic execution events chronologically."}
                </p>
              </div>

              {dailyAggregates.length < 2 && (
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    background: "#f1f5f9",
                    color: "#475569",
                    padding: "3px 8px",
                    borderRadius: "4px",
                  }}
                >
                  Single observation — minimum 2 distinct dates required for OLS slope
                </span>
              )}
            </div>

            {/* Chart Area */}
            <div style={{ width: "100%", height: "260px", minWidth: 0, marginTop: "8px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={
                    viewMode === "aggregated"
                      ? dailyAggregates.map((da) => ({
                          date: formatDate(da.date),
                          rawDate: da.date,
                          risk_score: da.risk_score,
                          confidence: Math.round(da.confidence * 100),
                          count: da.count,
                          diseases: da.diseases?.join(", "),
                        }))
                      : (timelineData.history || []).map((h) => ({
                          date: formatDate(h.date),
                          rawDate: h.timestamp?.slice(11, 16) || h.date,
                          risk_score: h.risk_score,
                          confidence: Math.round(h.confidence * 100),
                          count: 1,
                          diseases: h.disease,
                        }))
                  }
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#cbd5e1" }}
                    unit="%"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div
                            style={{
                              background: "#0f172a",
                              color: "#ffffff",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "0.72rem",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            }}
                          >
                            <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                              {label} {data.rawDate ? `(${data.rawDate})` : ""}
                            </div>
                            <div>
                              Daily Mean Risk: <strong>{data.risk_score}%</strong>
                            </div>
                            <div>
                              Model Confidence: <strong>{data.confidence}%</strong>
                            </div>
                            <div>
                              Analyses Executed: <strong>{data.count}</strong>
                            </div>
                            {data.diseases && (
                              <div style={{ color: "#93c5fd", marginTop: "2px" }}>
                                {data.diseases}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Critical 90% Threshold Line */}
                  <ReferenceLine
                    y={90}
                    label={{
                      value: "90% Risk Threshold",
                      position: "insideTopRight",
                      fill: "#dc2626",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="risk_score"
                    name="Risk Score"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ fill: "#2563eb", r: 4, strokeWidth: 1, stroke: "#ffffff" }}
                    activeDot={{ r: 6, fill: "#1d4ed8" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── EXPANDABLE SAME-DAY ANALYSIS DRAWER ── */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Same-Day Analysis Aggregations & Inspection Drawer
                </h4>
                <p style={{ fontSize: "0.7rem", color: "#64748b", margin: 0 }}>
                  Multiple analyses performed on the same calendar day are combined into a daily average while preserving all raw diagnostic records below.
                </p>
              </div>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: "#475569",
                  background: "#f1f5f9",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                {dailyAggregates.length} calendar {dailyAggregates.length === 1 ? "day" : "days"} recorded
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
              {dailyAggregates.map((da) => {
                const isExpanded = !!expandedDates[da.date];
                return (
                  <div
                    key={da.date}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      overflow: "hidden",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {/* Header Row */}
                    <button
                      type="button"
                      onClick={() => toggleDateExpansion(da.date)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: isExpanded ? "#f8fafc" : "#ffffff",
                        border: 0,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Calendar size={15} color="#2563eb" />
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a" }}>
                          {formatDate(da.date)}
                        </span>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                          }}
                        >
                          {da.count} {da.count === 1 ? "Analysis" : "Analyses Averaged"}
                        </span>
                        {da.diseases?.map((dis) => (
                          <span
                            key={dis}
                            style={{
                              fontSize: "0.65rem",
                              fontWeight: 500,
                              color: "#64748b",
                              background: "#f1f5f9",
                              padding: "1px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {dis}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Mean Risk: </span>
                          <strong
                            style={{
                              fontSize: "0.82rem",
                              color: getRiskColor(da.risk_score),
                            }}
                          >
                            {da.risk_score}%
                          </strong>
                        </div>
                        {isExpanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                      </div>
                    </button>

                    {/* Expanded table of individual raw runs */}
                    {isExpanded && (
                      <div
                        style={{
                          borderTop: "1px solid #e2e8f0",
                          padding: "10px 14px",
                          background: "#fafafa",
                        }}
                      >
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                              <th style={{ padding: "6px 8px" }}>Time</th>
                              <th style={{ padding: "6px 8px" }}>Modality / Disease</th>
                              <th style={{ padding: "6px 8px" }}>Architecture</th>
                              <th style={{ padding: "6px 8px" }}>Classification</th>
                              <th style={{ padding: "6px 8px" }}>Confidence</th>
                              <th style={{ padding: "6px 8px" }}>Risk Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {da.raw_analyses?.map((run, idx) => (
                              <tr
                                key={run.id || idx}
                                style={{
                                  borderBottom: "1px solid #f1f5f9",
                                  color: "#334155",
                                }}
                              >
                                <td style={{ padding: "6px 8px", fontFamily: "var(--font-mono, monospace)" }}>
                                  {formatTime(run.timestamp)}
                                </td>
                                <td style={{ padding: "6px 8px", fontWeight: 600 }}>
                                  {run.disease}
                                </td>
                                <td style={{ padding: "6px 8px", color: "#64748b" }}>
                                  {run.model} (v{run.model_version || "1.0"})
                                </td>
                                <td style={{ padding: "6px 8px" }}>
                                  <span
                                    style={{
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      fontSize: "0.68rem",
                                      fontWeight: 700,
                                      background:
                                        run.risk_score >= 70
                                          ? "#fee2e2"
                                          : run.risk_score >= 40
                                          ? "#fef3c7"
                                          : "#dcfce7",
                                      color:
                                        run.risk_score >= 70
                                          ? "#b91c1c"
                                          : run.risk_score >= 40
                                          ? "#b45309"
                                          : "#15803d",
                                    }}
                                  >
                                    {run.prediction_class}
                                  </span>
                                </td>
                                <td style={{ padding: "6px 8px" }}>
                                  {Math.round(run.confidence * 100)}%
                                </td>
                                <td
                                  style={{
                                    padding: "6px 8px",
                                    fontWeight: 700,
                                    color: getRiskColor(run.risk_score),
                                  }}
                                >
                                  {run.risk_score}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── CLINICAL DECISION SUPPORT GOVERNANCE DISCLAIMER ── */}
      <div
        style={{
          borderTop: "1px solid #f1f5f9",
          paddingTop: "12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#94a3b8",
          fontSize: "0.68rem",
          lineHeight: 1.4,
        }}
      >
        <Info size={14} style={{ flexShrink: 0 }} />
        <span>
          <strong>Non-Diagnostic Clinical Decision Support:</strong> Longitudinal trend analysis and threshold forecasting are calculated using Ordinary Least Squares linear regression over genuine historical prediction records. This tool provides predictive indications and does not constitute a definitive medical diagnosis. All clinical decisions must be confirmed by a licensed medical practitioner.
        </span>
      </div>
    </section>
  );
}
