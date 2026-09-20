import React, { useEffect } from "react";
import { X, ExternalLink, Cpu, Zap, ArrowUpRight } from "lucide-react";
import { MODEL_DOCS_REGISTRY } from "./ModelDocModalRegistry.js";

export default function ModelDocModal({ modelName, modelData, onClose }) {
  const nameStr = typeof modelName === "string" ? modelName : modelData?.name || "Sentinel-SVM";
  const baseModel = MODEL_DOCS_REGISTRY[nameStr] || MODEL_DOCS_REGISTRY["Sentinel-SVM"];

  // Merge exact per-cohort benchmark metrics when modelData is passed
  const model = modelData
    ? {
        ...baseModel,
        name: modelData.name || baseModel.name,
        type: modelData.type || baseModel.type,
        category: modelData.category || baseModel.category,
        disease: modelData.diseaseTrack || modelData.disease || baseModel.disease,
        routingStatus: modelData.status || baseModel.routingStatus,
        metrics: {
          accuracy: modelData.accuracy || baseModel.metrics?.accuracy,
          aucRoc: modelData.aucRoc || baseModel.metrics?.aucRoc,
          sensitivity: modelData.sensitivity || baseModel.metrics?.sensitivity,
          specificity: modelData.specificity || baseModel.metrics?.specificity,
          precision: modelData.precision || baseModel.metrics?.precision,
          f1Score: modelData.f1Score || baseModel.metrics?.f1Score,
          mccScore: modelData.mccScore || baseModel.metrics?.mccScore,
          eceError: modelData.eceError || baseModel.metrics?.eceError,
          avgLatency: modelData.avgLatency || baseModel.metrics?.avgLatency || "0.00 ms",
        },
      }
    : baseModel;

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          height: "100%",
          backgroundColor: "#0A0A0A",
          borderLeft: "1px solid rgba(255, 255, 255, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          color: "#EDEDED",
          padding: "clamp(24px, 4vw, 40px)",
          position: "relative",
          borderRadius: "0px",
          boxSizing: "border-box",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            paddingBottom: "24px",
            marginBottom: "28px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.68rem",
                letterSpacing: "0.18em",
                color: "#888888",
                textTransform: "uppercase",
              }}
            >
              <span>{model.category}</span>
              <span>•</span>
              <span>{model.disease}</span>
            </div>

            <h2
              style={{
                fontSize: "1.8rem",
                fontWeight: 400,
                margin: 0,
                letterSpacing: "-0.02em",
                color: "#FFFFFF",
                textTransform: "uppercase",
              }}
            >
              {model.name}
            </h2>

            <p
              style={{
                fontSize: "0.82rem",
                color: "#888888",
                margin: "4px 0 0 0",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {model.type}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "0px",
              padding: "8px",
              color: "#FFFFFF",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#FFFFFF";
              e.currentTarget.style.color = "#000000";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#FFFFFF";
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Routing Policy Card */}
        <div
          style={{
            border: "1px solid rgba(255, 255, 255, 0.15)",
            backgroundColor: "#111111",
            borderRadius: "0px",
            padding: "16px 18px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.68rem",
              letterSpacing: "0.15em",
              color: "#AAAAAA",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            CLINICAL ROUTING // {model.routingStatus}
          </div>
          <p
            style={{
              fontSize: "0.82rem",
              color: "#D4D4D4",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {model.routingDetails}
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.68rem",
              letterSpacing: "0.18em",
              color: "#777777",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            01 // AUDITED BENCHMARK METRICS
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1px",
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "0px",
            }}
          >
            {[
              { label: "ACCURACY", val: model.metrics.accuracy },
              { label: "AUC-ROC", val: model.metrics.aucRoc },
              { label: "SENSITIVITY", val: model.metrics.sensitivity },
              { label: "SPECIFICITY", val: model.metrics.specificity },
              { label: "PRECISION", val: model.metrics.precision },
              { label: "F1 SCORE", val: model.metrics.f1Score },
              { label: "MCC SCORE", val: model.metrics.mccScore },
              { label: "ECE ERROR", val: model.metrics.eceError },
              { label: "AVG LATENCY", val: model.metrics.avgLatency },
            ].map((metric) => (
              <div
                key={metric.label}
                style={{
                  backgroundColor: "#0F0F0F",
                  padding: "14px 12px",
                  borderRadius: "0px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.62rem",
                    color: "#777777",
                    fontFamily: "var(--font-mono, monospace)",
                    display: "block",
                    letterSpacing: "0.1em",
                  }}
                >
                  {metric.label}
                </span>
                <strong
                  style={{
                    fontSize: "1.05rem",
                    color: "#FFFFFF",
                    fontFamily: "var(--font-mono, monospace)",
                    fontWeight: 600,
                  }}
                >
                  {metric.val}
                </strong>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Specification Rows */}
        <div style={{ marginBottom: "36px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.68rem",
              letterSpacing: "0.18em",
              color: "#777777",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            02 // ARCHITECTURE & HARDWARE SPECIFICATION
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1px",
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "0px",
            }}
          >
            {[
              { key: "COHORT DATASET", val: model.dataset },
              { key: "EXECUTION DEVICE", val: model.device },
              { key: "FEATURE MAP / EMBEDDING", val: model.featureEncoding },
              { key: "VARIATIONAL ANSATZ", val: model.ansatz },
              { key: "MEASUREMENT OPERATOR", val: model.measurement },
              { key: "LOSS & CALIBRATION", val: model.lossFunction },
            ].map((spec) => (
              <div
                key={spec.key}
                style={{
                  backgroundColor: "#0F0F0F",
                  padding: "14px 16px",
                  borderRadius: "0px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.64rem",
                    color: "#888888",
                    fontFamily: "var(--font-mono, monospace)",
                    letterSpacing: "0.12em",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {spec.key}
                </span>
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: "#E5E5E5",
                    fontFamily: "var(--font-mono, monospace)",
                    wordBreak: "break-word",
                  }}
                >
                  {spec.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Action */}
        <div
          style={{
            marginTop: "auto",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            paddingTop: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontSize: "0.68rem",
              color: "#666666",
              fontFamily: "var(--font-mono, monospace)",
              letterSpacing: "0.1em",
            }}
          >
            Q-RAKSHAK // SIH-26139
          </span>

          <a
            href={model.githubAnchor}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              background: "#FFFFFF",
              color: "#000000",
              borderRadius: "0px",
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#DDDDDD";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#FFFFFF";
            }}
          >
            <span>Read in GitHub</span>
            <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
