import { useEffect, useRef } from "react";
import { X, Info, Sparkles } from "lucide-react";
import { animateModalOpen } from "../../utils/motion";
import { useLanguage } from "../../context/LanguageContext";

export default function SectionGuideModal({ isOpen, onClose, guideData }) {
  const { t } = useLanguage();
  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      animateModalOpen(overlayRef.current, modalRef.current);
    }
  }, [isOpen]);

  if (!isOpen || !guideData) return null;

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        ref={modalRef}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "600px",
          width: "90%",
          padding: "24px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-default)",
          borderTop: "3px solid var(--accent-blue)",
          background: "var(--bg-surface)",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingBottom: "14px",
            marginBottom: "16px",
            borderBottom: "1px solid var(--border-default)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "var(--primary-soft)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "1rem",
              }}
            >
              <Info size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    background: "var(--bg-card-sky)",
                    color: "var(--primary)",
                    border: "1px solid var(--border-light-blue)",
                    padding: "2px 6px",
                  }}
                >
                  PATIENT USER GUIDE
                </span>
                <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {guideData.sectionId || "GUIDE-INFO"}
                </span>
              </div>
              <h2
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 900,
                  color: "var(--text-primary)",
                  margin: "4px 0 0 0",
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                }}
              >
                {guideData.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px",
            }}
            title="Close Guide"
          >
            <X size={20} />
          </button>
        </div>

        {/* Overview Summary */}
        <div
          style={{
            background: "var(--bg-card-sky)",
            border: "1px solid var(--border-light-blue)",
            padding: "12px 14px",
            marginBottom: "16px",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.82rem", lineHeight: 1.5, color: "var(--text-primary)" }}>
            {guideData.summary}
          </p>
        </div>

        {/* Step-by-Step "How to Use" */}
        {guideData.steps && guideData.steps.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <h4
              style={{
                fontSize: "0.72rem",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--primary)",
                marginBottom: "8px",
              }}
            >
              How to Use This Section (Step-by-Step):
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {guideData.steps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    background: "var(--bg-canvas)",
                    padding: "8px 12px",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span
                    style={{
                      background: "var(--primary)",
                      color: "#FFFFFF",
                      fontSize: "0.68rem",
                      fontWeight: 900,
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-primary)", lineHeight: 1.4 }}>
                    <strong>{step.heading}: </strong>
                    <span>{step.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What the Results & Numbers Mean */}
        {guideData.metrics && guideData.metrics.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <h4
              style={{
                fontSize: "0.72rem",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--primary)",
                marginBottom: "8px",
              }}
            >
              Understanding Your Results & Key Indicators:
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {guideData.metrics.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid var(--border-default)",
                    padding: "8px 10px",
                    background: "var(--bg-canvas)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        background: m.color || "var(--primary)",
                        display: "inline-block",
                      }}
                    />
                    <strong style={{ fontSize: "0.75rem", color: "var(--text-primary)" }}>{m.label}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.70rem", color: "var(--text-secondary)", lineHeight: 1.35 }}>
                    {m.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Why Quantum AI Benefit Callout */}
        {guideData.quantumBenefit && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderTop: "1px solid var(--border-default)",
              paddingTop: "12px",
              fontSize: "0.74rem",
              color: "var(--text-secondary)",
            }}
          >
            <Sparkles size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Quantum Advantage: </strong>
              {guideData.quantumBenefit}
            </span>
          </div>
        )}

        {/* Close Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
            style={{ padding: "8px 20px", fontSize: "0.78rem", fontWeight: 800, borderRadius: "var(--radius-sm)" }}
          >
            Got It, Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
