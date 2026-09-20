import React, { useEffect } from "react";
import { X, ArrowUpRight } from "lucide-react";
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
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(5px)",
      }}
      onClick={onClose}
    >
      <div
        className="model-doc-drawer"
        style={{
          width: "100%",
          maxWidth: "680px",
          height: "100%",
          backgroundColor: "#0A0A0A",
          borderLeft: "1px solid rgba(255, 255, 255, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          color: "#EDEDED",
          padding: "clamp(18px, 3.5vw, 36px)",
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
            paddingBottom: "20px",
            marginBottom: "24px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.68rem",
                letterSpacing: "0.18em",
                color: "#888888",
                textTransform: "uppercase",
              }}
            >
              <span>{model.category}</span>
              <span>//</span>
              <span>{model.disease}</span>
            </div>

            <h2
              style={{
                fontSize: "clamp(1.5rem, 3.2vw, 2.0rem)",
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
                fontSize: "0.80rem",
                color: "#999999",
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
            aria-label="Close documentation drawer"
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "0px",
              padding: "8px",
              minWidth: "44px",
              minHeight: "44px",
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
            padding: "14px 16px",
            marginBottom: "24px",
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
        <div style={{ marginBottom: "26px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.68rem",
              letterSpacing: "0.18em",
              color: "#777777",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            01 // AUDITED BENCHMARK METRICS
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(95px, 1fr))",
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
                  padding: "12px 10px",
                  borderRadius: "0px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.60rem",
                    color: "#777777",
                    fontFamily: "var(--font-mono, monospace)",
                    display: "block",
                    letterSpacing: "0.08em",
                    marginBottom: "4px",
                  }}
                >
                  {metric.label}
                </span>
                <strong
                  style={{
                    fontSize: "0.98rem",
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
        <div style={{ marginBottom: "26px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.68rem",
              letterSpacing: "0.18em",
              color: "#777777",
              textTransform: "uppercase",
              marginBottom: "10px",
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
                  padding: "12px 14px",
                  borderRadius: "0px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.62rem",
                    color: "#888888",
                    fontFamily: "var(--font-mono, monospace)",
                    letterSpacing: "0.10em",
                    display: "block",
                    marginBottom: "3px",
                  }}
                >
                  {spec.key}
                </span>
                <span
                  style={{
                    fontSize: "0.80rem",
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

        {/* 03 // EMPIRICAL TRAINING & VALIDATION CONVERGENCE DYNAMICS */}
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.68rem",
              letterSpacing: "0.18em",
              color: "#777777",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            03 // EMPIRICAL CONVERGENCE DYNAMICS: LOSS & ACCURACY PROFILES
          </div>

          <div
            style={{
              border: "1px solid rgba(255, 255, 255, 0.15)",
              backgroundColor: "#0D0D0D",
              padding: "16px",
              borderRadius: "0px",
              boxSizing: "border-box",
            }}
          >
            {/* Proper Graph Heading */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "12px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                paddingBottom: "10px",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    color: "#FFFFFF",
                    textTransform: "uppercase",
                    display: "block",
                  }}
                >
                  {model.graphHeading || "EMPIRICAL CONVERGENCE DYNAMICS"}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.68rem",
                    color: "#888888",
                    display: "block",
                    marginTop: "2px",
                  }}
                >
                  {model.graphSubtitle || "Training Loss vs Validation Loss & Accuracy Progression"}
                </span>
              </div>

              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.62rem",
                  color: "#A7F3D0",
                  letterSpacing: "0.08em",
                  border: "1px solid rgba(167, 243, 208, 0.3)",
                  padding: "3px 8px",
                  borderRadius: "0px",
                  textTransform: "uppercase",
                }}
              >
                {model.convergenceStatus || "AUDITED EMPIRICAL RUN"}
              </span>
            </div>

            {/* Embedded Training & Validation Graph Screenshot */}
            {model.screenshotUrl && (
              <div
                style={{
                  width: "100%",
                  backgroundColor: "#FFFFFF",
                  padding: "4px",
                  boxSizing: "border-box",
                  borderRadius: "0px",
                  overflow: "hidden",
                  marginBottom: "14px",
                }}
              >
                <img
                  src={model.screenshotUrl}
                  alt={model.graphHeading || "Empirical Convergence Curves"}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    borderRadius: "0px",
                  }}
                />
              </div>
            )}

            {/* Loss Trajectory Metrics Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                marginBottom: "14px",
              }}
            >
              <div style={{ backgroundColor: "#141414", padding: "8px 10px" }}>
                <span
                  style={{
                    fontSize: "0.58rem",
                    color: "#888888",
                    fontFamily: "var(--font-mono, monospace)",
                    display: "block",
                    letterSpacing: "0.06em",
                  }}
                >
                  INITIAL LOSS
                </span>
                <strong
                  style={{
                    fontSize: "0.85rem",
                    color: "#E2E8F0",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {model.initialLoss || "N/A"}
                </strong>
              </div>

              <div style={{ backgroundColor: "#141414", padding: "8px 10px" }}>
                <span
                  style={{
                    fontSize: "0.58rem",
                    color: "#888888",
                    fontFamily: "var(--font-mono, monospace)",
                    display: "block",
                    letterSpacing: "0.06em",
                  }}
                >
                  FINAL TRAIN LOSS
                </span>
                <strong
                  style={{
                    fontSize: "0.85rem",
                    color: "#93C5FD",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {model.finalLoss || "N/A"}
                </strong>
              </div>

              <div style={{ backgroundColor: "#141414", padding: "8px 10px" }}>
                <span
                  style={{
                    fontSize: "0.58rem",
                    color: "#888888",
                    fontFamily: "var(--font-mono, monospace)",
                    display: "block",
                    letterSpacing: "0.06em",
                  }}
                >
                  FINAL VAL LOSS
                </span>
                <strong
                  style={{
                    fontSize: "0.85rem",
                    color: "#FCA5A5",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {model.valLoss || "N/A"}
                </strong>
              </div>
            </div>

            {/* Detailed Convergence Explanation Text */}
            <p
              style={{
                fontSize: "0.78rem",
                color: "#C4C4C4",
                margin: 0,
                lineHeight: 1.65,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              }}
            >
              {model.graphAnalysis}
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <div
          style={{
            marginTop: "auto",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            paddingTop: "20px",
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
            Q-RAKSHAK // SIH-26139 AUDITED
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
            <span>Read Specification in GitHub</span>
            <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
