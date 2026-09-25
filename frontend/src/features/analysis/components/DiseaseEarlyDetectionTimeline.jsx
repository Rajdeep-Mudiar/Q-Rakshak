import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Zap,
  ArrowRight,
  Compass,
  Layers,
  Info,
  Calendar,
  Sparkles,
  ChevronRight,
  Play,
  Heart,
  Stethoscope
} from "lucide-react";
import { getDiseaseById, getLocalizedDiseaseById, DISEASE_LIST } from "../../../data/diseaseRegistry.js";
import { earlyDetectionApi } from "../../../api/earlyDetection.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";

/**
 * DiseaseEarlyDetectionTimeline
 * High-contrast, interactive early detection trajectory & progression graph
 * tailored for each disease. Visualizes the pre-clinical lead time window,
 * quantum intervention vs unmonitored risk divergence, and stage biomarkers.
 */
export default function DiseaseEarlyDetectionTimeline({
  diseaseId = "breast_cancer",
  patientRiskScore = null,
  patientPrediction = null,
  onStartAnalysis = null,
  showDiseaseSelector = false,
  onSelectDisease = null,
}) {
  const { t } = useLanguage();
  const disease = getLocalizedDiseaseById(diseaseId, t);
  const earlyDet = disease.earlyDetection || {};
  const [selectedStageId, setSelectedStageId] = useState(
    earlyDet.stages?.[0]?.id || "stage_0"
  );
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [activeDiseaseId, setActiveDiseaseId] = useState(diseaseId);

  // Sync internal state when diseaseId changes
  useEffect(() => {
    setActiveDiseaseId(diseaseId);
    const d = getLocalizedDiseaseById(diseaseId, t);
    if (d?.earlyDetection?.stages?.[0]?.id) {
      setSelectedStageId(d.earlyDetection.stages[0].id);
    }
  }, [diseaseId]);

  const activeDisease = getLocalizedDiseaseById(activeDiseaseId, t);
  const currentEarlyDet = activeDisease.earlyDetection || earlyDet;
  const stages = currentEarlyDet.stages || [];
  const activeStage = stages.find((s) => s.id === selectedStageId) || stages[0] || {};
  const timelineSeries = currentEarlyDet.timelineSeries || [];

  // SVG Chart Geometry
  const svgWidth = 640;
  const svgHeight = 240;
  const padLeft = 52;
  const padRight = 32;
  const padTop = 28;
  const padBottom = 42;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Time bounds
  const times = timelineSeries.map((p) => p.time);
  const minTime = times.length > 0 ? Math.min(...times) : -24;
  const maxTime = times.length > 0 ? Math.max(...times) : 12;
  const timeSpan = maxTime - minTime || 1;

  // Coordinate mappers
  const getX = (t) => padLeft + ((t - minTime) / timeSpan) * chartW;
  const getY = (risk) => padTop + chartH - (Math.max(0, Math.min(100, risk)) / 100) * chartH;

  // Trajectory SVG paths
  const unmonitoredPoints = timelineSeries.map((p) => ({ x: getX(p.time), y: getY(p.unmonitoredRisk), p }));
  const quantumPoints = timelineSeries.map((p) => ({ x: getX(p.time), y: getY(p.quantumInterventionRisk), p }));

  const unmonitoredPathD = unmonitoredPoints.length > 0
    ? unmonitoredPoints.map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ")
    : "";

  const quantumPathD = quantumPoints.length > 0
    ? quantumPoints.map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ")
    : "";

  // Divergence shaded polygon
  let divergenceAreaD = "";
  if (unmonitoredPoints.length > 0 && quantumPoints.length > 0) {
    const forward = unmonitoredPoints.map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ");
    const backward = [...quantumPoints].reverse().map((pt) => `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ");
    divergenceAreaD = `${forward} ${backward} Z`;
  }

  // Pre-clinical window shading (from minTime to time 0)
  const windowX0 = getX(minTime);
  const windowX1 = getX(0);
  const windowW = Math.max(0, windowX1 - windowX0);

  // Threshold lines
  const clinicalThresholdVal = timelineSeries[0]?.clinicalThreshold || 72;
  const qmlThresholdVal = timelineSeries[0]?.qmlThreshold || 22;
  const clinicalThresholdY = getY(clinicalThresholdVal);
  const qmlThresholdY = getY(qmlThresholdVal);

  if (patientRiskScore === null && patientPrediction === null) {
    return (
      <div
        className="disease-early-timeline-card"
        style={{
          background: "var(--bg-surface, #FFFFFF)",
          border: "1px solid var(--border-default, #E2E8F0)",
          borderRadius: "var(--radius-md, 6px)",
          padding: "36px 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "var(--primary-soft, #E0F2FE)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--primary, #0284C7)",
          }}
        >
          <Activity size={24} />
        </div>
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary, #0F172A)", margin: "0 0 6px" }}>
            {t("early_detection.no_analysis_title", "No Clinical Analysis Performed Yet")}
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary, #64748B)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.5 }}>
            {t("early_detection.no_analysis_desc", "Personal longitudinal early detection curves and risk trajectories are only generated after completing a verified diagnostic screening. Run an instant checkup to establish your baseline.")}
          </p>
        </div>
        {onStartAnalysis && (
          <button
            type="button"
            className="btn-primary"
            onClick={onStartAnalysis}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              fontSize: "0.85rem",
              fontWeight: 600,
              borderRadius: "var(--radius-sm, 4px)",
              cursor: "pointer",
            }}
          >
            <Activity size={16} />
            <span>{t("actions.run_checkup", "Run Instant Quantum AI Checkup")}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="disease-early-timeline-card"
      style={{
        background: "var(--bg-surface, #FFFFFF)",
        border: "1px solid var(--border-default, #E2E8F0)",
        borderRadius: "var(--radius-lg, 12px)",
        boxShadow: "var(--shadow-card, 0 2px 8px rgba(0,0,0,0.04))",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        overflow: "hidden",
      }}
    >
      {/* ── 1. PROTOCOL SWITCHER (If requested) ── */}
      {showDiseaseSelector && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", paddingBottom: "12px", borderBottom: "1px solid var(--border-subtle, #F1F5F9)" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {t("early_detection.select_trajectory", "Select Disease Trajectory:")}
          </span>
          {DISEASE_LIST.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setActiveDiseaseId(d.id);
                if (onSelectDisease) onSelectDisease(d.id);
              }}
              style={{
                fontSize: "0.74rem",
                padding: "5px 12px",
                borderRadius: "var(--radius-pill, 9999px)",
                border: d.id === activeDiseaseId ? `1px solid ${d.accentColor}` : "1px solid var(--border-default, #E2E8F0)",
                background: d.id === activeDiseaseId ? d.accentColor : "transparent",
                color: d.id === activeDiseaseId ? "#FFFFFF" : "var(--text-primary, #0F172A)",
                fontWeight: d.id === activeDiseaseId ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {d.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* ── 2. HEADER: Early Detection Window & Key Metric Badges ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: activeDisease.accentColor,
                background: activeDisease.accentBg || "rgba(0, 242, 254, 0.1)",
                padding: "3px 8px",
                borderRadius: "4px",
              }}
            >
              {t("early_detection.pathway_badge", "Early Detection Pathway")}
            </span>
            {patientRiskScore !== null && !isNaN(patientRiskScore) ? (
              <span
                style={{
                  fontSize: "0.66rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#059669",
                  background: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  padding: "2px 7px",
                  borderRadius: "4px",
                }}
              >
                {t("early_detection.personalized_assessment", "Personalized Assessment")}
              </span>
            ) : (
              <span
                style={{
                  fontSize: "0.66rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#475569",
                  background: "#F1F5F9",
                  border: "1px solid #CBD5E1",
                  padding: "2px 7px",
                  borderRadius: "4px",
                }}
              >
                {t("early_detection.population_model", "Reference Population Model")}
              </span>
            )}
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
              {currentEarlyDet.targetOrgan}
            </span>
          </div>

          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "2px 0 4px", color: "var(--text-primary)" }}>
            {activeDisease.name} {t("early_detection.timeline_title_suffix", "— Early Detection Timeline")}
          </h3>
          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, maxWidth: "680px", lineHeight: 1.45 }}>
            {currentEarlyDet.keyInsight}
          </p>
        </div>

        {/* 3 Metric Pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {/* Pre-Clinical Lead Time */}
          <div
            style={{
              background: "var(--bg-canvas, #F8FAFC)",
              border: "1px solid var(--border-default, #E2E8F0)",
              borderRadius: "8px",
              padding: "8px 12px",
              minWidth: "110px",
            }}
          >
            <div style={{ fontSize: "0.64rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              {t("early_detection.lead_time_window", "Lead Time Window")}
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: activeDisease.accentColor, fontFamily: "var(--font-mono)" }}>
              {currentEarlyDet.leadTime}
            </div>
            <div style={{ fontSize: "0.62rem", color: "var(--risk-low, #16A34A)", fontWeight: 600 }}>
              {t("early_detection.pre_clinical_lead", "Pre-clinical lead")}
            </div>
          </div>

          {/* Survival / Reversal Lift */}
          <div
            style={{
              background: "var(--bg-canvas, #F8FAFC)",
              border: "1px solid var(--border-default, #E2E8F0)",
              borderRadius: "8px",
              padding: "8px 12px",
              minWidth: "120px",
            }}
          >
            <div style={{ fontSize: "0.64rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              {t("early_detection.stage_0_impact", "Stage 0 Impact")}
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--risk-low, #16A34A)", fontFamily: "var(--font-mono)" }}>
              {currentEarlyDet.stages?.[0]?.outcomeMetric?.split(" ")[0] || "99%"}
            </div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              {currentEarlyDet.stages?.[0]?.outcomeMetric?.split(" ").slice(1).join(" ") || "Survival / Reversal"}
            </div>
          </div>

          {/* Quantum Advantage Lift */}
          <div
            style={{
              background: "var(--bg-canvas, #F8FAFC)",
              border: "1px solid var(--border-default, #E2E8F0)",
              borderRadius: "8px",
              padding: "8px 12px",
              minWidth: "120px",
            }}
          >
            <div style={{ fontSize: "0.64rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              {t("early_detection.sensitivity_gain", "Sensitivity Gain")}
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--primary, #0284C7)", fontFamily: "var(--font-mono)" }}>
              {currentEarlyDet.sensitivityGain?.split(" ")[0] || "+4.2%"}
            </div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              {t("early_detection.vs_standard", "vs Standard Screening")}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. INTERACTIVE PROGRESSION & INTERVENTION GRAPH (SVG) ── */}
      <div
        style={{
          background: "var(--bg-canvas, #F8FAFC)",
          border: "1px solid var(--border-default, #E2E8F0)",
          borderRadius: "10px",
          padding: "16px 12px 10px",
          position: "relative",
        }}
      >
        {/* Top Legend Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", paddingBottom: "8px", fontSize: "0.72rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "12px", height: "3px", background: "#DC2626", borderRadius: "2px" }} />
              <strong style={{ color: "#DC2626" }}>{t("early_detection.unmonitored_progression", "Unmonitored Progression")}</strong>
              <span style={{ color: "var(--text-muted)", fontSize: "0.66rem" }}>(Crosses severe threshold)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "12px", height: "3px", background: "#16A34A", borderRadius: "2px" }} />
              <strong style={{ color: "#16A34A" }}>{t("early_detection.quantum_intervention", "Quantum Early Intervention")}</strong>
              <span style={{ color: "var(--text-muted)", fontSize: "0.66rem" }}>(Intercepted & stabilized)</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#D97706", fontSize: "0.68rem", fontWeight: 600 }}>
              <span style={{ width: "8px", height: "1px", borderTop: "2px dashed #D97706" }} />
              <span>{t("early_detection.standard_threshold", `Standard Symptom Threshold (${clinicalThresholdVal}%)`)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--primary, #0284C7)", fontSize: "0.68rem", fontWeight: 600 }}>
              <span style={{ width: "8px", height: "1px", borderTop: "2px dashed var(--primary, #0284C7)" }} />
              <span>{t("early_detection.quantum_horizon", `Quantum Detection Horizon (${qmlThresholdVal}%)`)}</span>
            </div>
          </div>
        </div>

        {/* SVG Canvas */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
        >
          <defs>
            {/* Shading for Early Detection Opportunity Window */}
            <linearGradient id={`windowGrad-${activeDiseaseId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary, #0284C7)" stopOpacity="0.10" />
              <stop offset="100%" stopColor="var(--primary, #0284C7)" stopOpacity="0.02" />
            </linearGradient>

            {/* Shading for Risk Divergence Zone */}
            <linearGradient id={`divergenceGrad-${activeDiseaseId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#16A34A" stopOpacity="0.06" />
            </linearGradient>
          </defs>

          {/* ── Background Grid & Y-Axis Labels ── */}
          {[0, 25, 50, 75, 100].map((risk) => {
            const y = getY(risk);
            return (
              <g key={risk}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="var(--border-subtle, #E2E8F0)"
                  strokeWidth="1"
                  strokeDasharray={risk === 0 || risk === 100 ? "none" : "2,4"}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="var(--text-muted, #94A3B8)"
                  fontFamily="var(--font-mono, monospace)"
                  fontWeight="600"
                >
                  {risk}%
                </text>
              </g>
            );
          })}

          {/* ── Early Detection Window Shaded Zone ── */}
          {windowW > 0 && (
            <g>
              <rect
                x={windowX0}
                y={padTop}
                width={windowW}
                height={chartH}
                fill={`url(#windowGrad-${activeDiseaseId})`}
                rx="4"
              />
              <line
                x1={windowX1}
                y1={padTop}
                x2={windowX1}
                y2={padTop + chartH}
                stroke="var(--primary, #0284C7)"
                strokeWidth="1.5"
                strokeDasharray="3,3"
                opacity="0.6"
              />
              <text
                x={windowX0 + windowW / 2}
                y={padTop + 14}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill="var(--primary, #0284C7)"
                letterSpacing="0.04em"
              >
                {t("early_detection.window_label", `EARLY DETECTION WINDOW (${currentEarlyDet.leadTime?.toUpperCase()})`, { months: currentEarlyDet.leadTime?.toUpperCase() })}
              </text>
            </g>
          )}

          {/* ── Standard Clinical Symptom Threshold (Dashed Orange Line) ── */}
          <line
            x1={padLeft}
            y1={clinicalThresholdY}
            x2={svgWidth - padRight}
            y2={clinicalThresholdY}
            stroke="#D97706"
            strokeWidth="1.5"
            strokeDasharray="4,4"
            opacity="0.75"
          />

          {/* ── Quantum AI Detection Horizon (Dashed Cyan Line) ── */}
          <line
            x1={padLeft}
            y1={qmlThresholdY}
            x2={svgWidth - padRight}
            y2={qmlThresholdY}
            stroke="var(--primary, #0284C7)"
            strokeWidth="1.5"
            strokeDasharray="4,4"
            opacity="0.8"
          />

          {/* ── Risk Divergence Area Between Curves ── */}
          {divergenceAreaD && (
            <path
              d={divergenceAreaD}
              fill={`url(#divergenceGrad-${activeDiseaseId})`}
            />
          )}

          {/* ── Unmonitored Path Curve (Red) ── */}
          {unmonitoredPathD && (
            <path
              d={unmonitoredPathD}
              fill="none"
              stroke="#DC2626"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* ── Quantum Intervention Path Curve (Green) ── */}
          {quantumPathD && (
            <path
              d={quantumPathD}
              fill="none"
              stroke="#16A34A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* ── Stage Landmark Marker Points ── */}
          {stages.map((stg) => {
            const cx = getX(stg.timeOffset);
            const cy = getY(stg.riskScore);
            const isSelected = stg.id === selectedStageId;
            return (
              <g
                key={stg.id}
                onClick={() => setSelectedStageId(stg.id)}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredPoint({ ...stg, cx, cy })}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Outer Ring Animation for Stage 0 (Opportunity Point) */}
                {stg.id === "stage_0" && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="12"
                    fill="none"
                    stroke="var(--primary, #0284C7)"
                    strokeWidth="1.5"
                    opacity="0.45"
                    className="animate-pulse"
                  />
                )}

                {/* Main Node */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? "7" : "5"}
                  fill={isSelected ? "#FFFFFF" : stg.badgeColor || "var(--primary)"}
                  stroke={stg.badgeColor || "var(--primary)"}
                  strokeWidth={isSelected ? "3.5" : "2"}
                  style={{ transition: "all 0.15s ease" }}
                />

                {/* Stage Label on Graph */}
                <text
                  x={cx}
                  y={cy - 10}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight={isSelected ? "800" : "600"}
                  fill={isSelected ? "var(--text-primary)" : "var(--text-secondary)"}
                >
                  {stg.name}
                </text>
              </g>
            );
          })}

          {/* ── X-Axis Time Labels ── */}
          {timelineSeries.map((p, idx) => {
            const x = getX(p.time);
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={padTop + chartH}
                  x2={x}
                  y2={padTop + chartH + 4}
                  stroke="var(--border-default, #CBD5E1)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padTop + chartH + 16}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--text-secondary, #64748B)"
                  fontFamily="var(--font-mono, monospace)"
                  fontWeight={p.stage ? "700" : "500"}
                >
                  {p.label}
                </text>
              </g>
            );
          })}

          {/* ── Patient Current Risk Pin (If checkup result passed) ── */}
          {patientRiskScore !== null && !isNaN(patientRiskScore) && (
            <g>
              {(() => {
                const pinRisk = Math.max(0, Math.min(100, patientRiskScore));
                const pinY = getY(pinRisk);
                // Estimate time on unmonitored curve closest to risk
                const pinX = getX(0); // Mark at present evaluation boundary
                return (
                  <g>
                    <line
                      x1={padLeft}
                      y1={pinY}
                      x2={svgWidth - padRight}
                      y2={pinY}
                      stroke="#8B5CF6"
                      strokeWidth="1.5"
                      strokeDasharray="2,2"
                      opacity="0.85"
                    />
                    <circle
                      cx={pinX}
                      cy={pinY}
                      r="8"
                      fill="#8B5CF6"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      className="animate-pulse"
                    />
                    <text
                      x={pinX + 12}
                      y={pinY + 3}
                      fontSize="9.5"
                      fontWeight="800"
                      fill="#8B5CF6"
                    >
                      Your Result: {pinRisk.toFixed(1)}% Risk
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            style={{
              position: "absolute",
              top: `${Math.max(10, hoveredPoint.cy - 70)}px`,
              left: `${Math.min(svgWidth - 220, Math.max(20, hoveredPoint.cx - 90))}px`,
              background: "#0F172A",
              color: "#FFFFFF",
              padding: "8px 12px",
              borderRadius: "6px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
              fontSize: "0.72rem",
              pointerEvents: "none",
              zIndex: 10,
              maxWidth: "220px",
            }}
          >
            <div style={{ fontWeight: 800, color: "var(--primary, #38BDF8)", marginBottom: "2px" }}>
              {hoveredPoint.stage}
            </div>
            <div style={{ fontSize: "0.68rem", color: "#CBD5E1" }}>
              {hoveredPoint.timeLabel} • Risk Score: <strong>{hoveredPoint.riskScore}%</strong>
            </div>
            <div style={{ fontSize: "0.65rem", color: "#94A3B8", marginTop: "3px" }}>
              Click to view cellular biomarkers & intervention plan
            </div>
          </div>
        )}
      </div>

      {/* ── 4. STAGE STEPPER BUTTONS ── */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${stages.length}, 1fr)`, gap: "8px" }}>
        {stages.map((stg, idx) => {
          const isSelected = stg.id === selectedStageId;
          return (
            <button
              key={stg.id}
              type="button"
              onClick={() => setSelectedStageId(stg.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "3px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: isSelected ? `2px solid ${stg.badgeColor || "var(--primary)"}` : "1px solid var(--border-default, #E2E8F0)",
                background: isSelected ? "var(--bg-surface, #FFFFFF)" : "var(--bg-canvas, #F8FAFC)",
                boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    color: stg.badgeColor || "var(--primary)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {stg.name}
                </span>
                <span
                  style={{
                    fontSize: "0.64rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {stg.timeLabel}
                </span>
              </div>
              <strong style={{ fontSize: "0.78rem", color: "var(--text-primary)", margin: "1px 0" }}>
                {stg.stage.split("(")[1]?.replace(")", "") || stg.stage}
              </strong>
              <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                Risk: <strong>{stg.riskScore}%</strong> • {stg.outcomeMetric?.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 5. ACTIVE STAGE DEEP-DIVE INSPECTOR PANEL ── */}
      {activeStage && (
        <div
          style={{
            background: "var(--bg-canvas, #F8FAFC)",
            border: `1px solid ${activeStage.badgeColor || "var(--border-default)"}44`,
            borderRadius: "10px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: activeStage.badgeColor || "var(--primary)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                }}
              >
                {activeStage.name?.replace(/[^0-9]/g, "") || "0"}
              </div>
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                  {activeStage.stage}
                </h4>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Clinical Timeline Offset: <strong>{activeStage.timeLabel}</strong>
                </span>
              </div>
            </div>

            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "var(--radius-pill, 9999px)",
                background: `${activeStage.badgeColor || "var(--primary)"}22`,
                color: activeStage.badgeColor || "var(--primary)",
              }}
            >
              Prognosis: {activeStage.outcomeMetric}
            </div>
          </div>

          {/* 4 Clinical Dimension Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
            {/* Cellular Biomarkers */}
            <div
              style={{
                background: "var(--bg-surface, #FFFFFF)",
                border: "1px solid var(--border-default, #E2E8F0)",
                borderRadius: "8px",
                padding: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                <Activity size={13} color={activeDisease.accentColor} />
                <span>{t("early_detection.cellular_biomarker_title", "Cellular Biomarkers & Shape Shifts")}</span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-primary)", margin: 0, lineHeight: 1.4 }}>
                {activeStage.cellularBiomarker}
              </p>
            </div>

            {/* Symptoms & Clinical Signs */}
            <div
              style={{
                background: "var(--bg-surface, #FFFFFF)",
                border: "1px solid var(--border-default, #E2E8F0)",
                borderRadius: "8px",
                padding: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                <Info size={13} color="#F59E0B" />
                <span>{t("early_detection.symptoms_title", "Patient Symptoms & Detectability")}</span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-primary)", margin: 0, lineHeight: 1.4 }}>
                {activeStage.symptoms}
              </p>
            </div>

            {/* Quantum AI Detection Mechanism */}
            <div
              style={{
                background: "var(--bg-surface, #FFFFFF)",
                border: "1px solid var(--border-default, #E2E8F0)",
                borderRadius: "8px",
                padding: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                <Zap size={13} color="var(--primary, #0284C7)" />
                <span>{t("early_detection.detection_engine_title", "Quantum AI Detection Engine")}</span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-primary)", margin: 0, lineHeight: 1.4 }}>
                {activeStage.detectionMethod}
              </p>
            </div>

            {/* Recommended Clinical Intervention */}
            <div
              style={{
                background: "var(--bg-surface, #FFFFFF)",
                border: "1px solid var(--border-default, #E2E8F0)",
                borderRadius: "8px",
                padding: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                <ShieldCheck size={13} color="var(--risk-low, #16A34A)" />
                <span>{t("early_detection.recommended_action_title", "Recommended Clinical Action")}</span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-primary)", margin: 0, lineHeight: 1.4 }}>
                {activeStage.recommendedIntervention}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. CLINICAL PREVENTIVE ACTIONS STRIP ── */}
      {currentEarlyDet.preventiveActions && currentEarlyDet.preventiveActions.length > 0 && (
        <div
          style={{
            background: "rgba(2, 132, 199, 0.04)",
            border: "1px solid rgba(2, 132, 199, 0.2)",
            borderRadius: "8px",
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: "0.70rem", fontWeight: 800, color: "var(--primary, #0284C7)", textTransform: "uppercase", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Compass size={14} />
            <span>{t("early_detection.prevention_rules_title", "Key Research-Backed Prevention Rules:")}</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.74rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "4px" }}>
            {currentEarlyDet.preventiveActions.map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── 7. FOOTER ACTION: Start Analysis for this Protocol ── */}
      {onStartAnalysis && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderTop: "1px solid var(--border-default, #E2E8F0)", paddingTop: "12px" }}>
          <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
            Ready to test your biometric parameters against the <strong>{activeDisease.name}</strong> early trajectory?
          </div>

          <button
            type="button"
            onClick={() => onStartAnalysis(activeDisease.studyKey)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: activeDisease.accentColor,
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              padding: "9px 18px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: `0 2px 8px ${activeDisease.accentColor}44`,
              transition: "all 0.15s ease",
            }}
          >
            <Play size={14} fill="#FFFFFF" />
            <span>{t("early_detection.start_checkup_btn", `Start ${activeDisease.name} Checkup`, { name: activeDisease.name })}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
