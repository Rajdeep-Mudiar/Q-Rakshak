import { useEffect, useRef, useState } from "react";
import { Activity, Sparkles, Shield, Maximize2, Layers, CheckCircle2, AlertTriangle, Crosshair } from "lucide-react";
import { clinicalApi } from "../../api/clinical";
import { authApi } from "../../api/auth";
import { animateEntrance } from "../../utils/motion";
import { DigitalTwinViewer, useTwinStore, DISEASE_TO_ORGAN } from "../../features/digitalTwin3D";

export default function DigitalTwin3D({ patientId, analysisResult = null, onOpenTwinTab = null }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [patientRecord, setPatientRecord] = useState(null);
  const [loadingRecord, setLoadingRecord] = useState(false);

  const storedUser = authApi.getStoredUser();
  const effectivePatientId = patientId || storedUser?.patient_id || storedUser?.user_id || storedUser?.id || "PATIENT";

  const setPatientAnalysis = useTwinStore((state) => state.setPatientAnalysis);
  const patientAnalysis = useTwinStore((state) => state.patientAnalysis);
  const selectedAnatomy = useTwinStore((state) => state.selectedAnatomy);
  const setSelectedAnatomy = useTwinStore((state) => state.setSelectedAnatomy);
  const involvementMap = useTwinStore((state) => state.involvementMap);

  // Synchronize incoming analysisResult prop to twinStore
  useEffect(() => {
    if (analysisResult) {
      setPatientAnalysis(analysisResult, effectivePatientId);
    }
  }, [analysisResult, effectivePatientId, setPatientAnalysis]);

  // Load patient baseline record if present without fabricating positive disease findings
  useEffect(() => {
    if (!analysisResult && !patientAnalysis && effectivePatientId && effectivePatientId !== "PATIENT") {
      let isMounted = true;
      setLoadingRecord(true);
      clinicalApi.getPatientRecord(effectivePatientId)
        .then((res) => {
          if (!isMounted || !res?.patient) return;
          setPatientRecord(res.patient);
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoadingRecord(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [effectivePatientId, analysisResult, patientAnalysis]);

  useEffect(() => {
    if (containerRef.current) {
      animateEntrance(containerRef.current, { y: 10, duration: 0.3 });
    }
  }, []);

  const organList = [
    { id: "HEART", label: "Heart" },
    { id: "LUNG_LEFT", label: "Lungs" },
    { id: "BRAIN", label: "Brain" },
    { id: "PANCREAS", label: "Pancreas" },
    { id: "LIVER", label: "Liver" },
    { id: "BREAST_LEFT", label: "Breast" },
  ];

  return (
    <div
      ref={containerRef}
      className="digital-twin-pure-workspace"
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "0px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        position: "relative",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
        borderRadius: "var(--radius-xs)",
        overflow: "hidden",
      }}
    >
      {/* Sleek Minimalist Studio Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          background: "var(--bg-surface-alt)",
          borderBottom: "1px solid var(--border-default)",
          fontSize: "0.74rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "inline-block",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: patientAnalysis?.severity === "danger" ? "var(--rose-couture)" : "var(--emerald-couture)",
              boxShadow: patientAnalysis?.severity === "danger" ? "0 0 8px rgba(225, 29, 72, 0.5)" : "0 0 8px rgba(15, 118, 110, 0.4)",
            }}
          />
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.04em", color: "var(--ink-primary)" }}>
            PATIENT TWIN // {effectivePatientId}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            className="step-badge"
            style={{
              padding: "2px 6px",
              fontSize: "0.62rem",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              color: "var(--ink-secondary)",
              fontWeight: 700,
            }}
          >
            WebGL 3D
          </span>
          {onOpenTwinTab && (
            <button
              type="button"
              onClick={onOpenTwinTab}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "var(--ink-primary)",
                color: "#FFFFFF",
                border: 0,
                padding: "3px 8px",
                borderRadius: "3px",
                fontSize: "0.62rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
              }}
              title="Open full 3D Explorer with Layer controls"
            >
              <Maximize2 size={10} />
              <span>Full Studio</span>
            </button>
          )}
        </div>
      </div>

      {/* Pure 3D WebGL Canvas Viewport */}
      <div
        className="twin-3d-pure-viewport"
        style={{
          width: "100%",
          height: "380px",
          position: "relative",
          background: "#07080A",
        }}
      >
        <DigitalTwinViewer canvasRef={canvasRef} compact={true} />
      </div>

      {/* Interactive Quick Organ Chips & Telemetry */}
      <div
        style={{
          padding: "8px 10px",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-default)",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.65rem" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Anatomical Telemetry
          </span>
          <span style={{ fontSize: "0.62rem", color: analysisResult ? "var(--accent-teal)" : "var(--emerald-couture)", fontWeight: 700 }}>
            {analysisResult ? (patientAnalysis?.disease || "Diagnostic Assessed") : "Healthy Baseline (Pending Checkup)"}
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {organList.map((org) => {
            const riskVal = involvementMap[org.id] || 0;
            const isSelected = selectedAnatomy === org.id;
            const isElevated = riskVal > 40;
            return (
              <button
                key={org.id}
                type="button"
                onClick={() => setSelectedAnatomy(isSelected ? null : org.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 6px",
                  borderRadius: "3px",
                  fontSize: "0.62rem",
                  fontFamily: "var(--font-mono)",
                  fontWeight: isSelected ? 800 : 600,
                  background: isSelected ? "var(--ink-primary)" : "var(--bg-surface-alt)",
                  color: isSelected ? "#FFFFFF" : isElevated ? "var(--rose-couture)" : "var(--text-primary)",
                  border: isSelected ? "1px solid var(--ink-primary)" : "1px solid var(--border-default)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{org.label}</span>
                <span
                  style={{
                    fontSize: "0.58rem",
                    padding: "1px 3px",
                    borderRadius: "2px",
                    background: isSelected ? "rgba(255,255,255,0.2)" : isElevated ? "rgba(225,29,72,0.1)" : "rgba(15,118,110,0.1)",
                    color: isSelected ? "#FFFFFF" : isElevated ? "var(--rose-couture)" : "var(--emerald-couture)",
                  }}
                >
                  {riskVal}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
