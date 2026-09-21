import { useEffect, useRef } from "react";
import { Activity, Atom, FileText, Sparkles } from "lucide-react";
import { animateEntrance } from "../../utils/motion";
import { useLanguage } from "../../context/LanguageContext";

export default function ExplainabilityView({ explainability, diseaseName = "Health Screening" }) {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const topFeatures = explainability?.top_features || [];
  const narrative = explainability?.clinical_narrative || t("checkup.awaiting_checkup", "Awaiting instant Quantum AI checkup (ready to evaluate).");

  useEffect(() => {
    if (containerRef.current) {
      animateEntrance(containerRef.current, { y: 12, duration: 0.35 });
    }
  }, [explainability]);

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Patient Natural Language Summary Card */}
      <div className="narrative-card" style={{ borderRadius: "var(--radius-xs)", border: "1px solid var(--border-default)", borderLeft: "3px solid var(--accent-blue)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <Sparkles size={16} color="var(--primary)" />
          <strong style={{ fontSize: "0.85rem", color: "var(--primary)" }}>{t("checkup.ai_summary_guidance", "AI Health Summary & Guidance:")}</strong>
        </div>
        <p style={{ margin: 0, fontSize: "0.82rem", lineHeight: 1.5, color: "var(--text-primary)" }}>{narrative}</p>
      </div>

      {/* Feature Attribution Bar Charts */}
      <div className="card-panel" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)" }}>
        <div className="card-header">
          <span className="card-title">
            <Atom size={16} color="var(--primary)" /> {t("checkup.biological_factors", "Key Biological Factors Influencing Your Result")}
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {t("checkup.factor_weights", "Factor Weight Distribution (%)")}
          </span>
        </div>

        {topFeatures.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
            {topFeatures.map((feat, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "4px" }}>
                <span style={{ fontSize: "0.80rem", fontWeight: 600, color: "var(--text-primary)", wordBreak: "break-word" }}>
                  {feat.feature}
                </span>
                <span style={{ fontSize: "0.80rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                  {feat.percentage || 0}% weight
                </span>
                <div style={{ gridColumn: "1 / -1", height: "6px", background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${feat.percentage || 0}%`,
                      background: idx < 2 ? "var(--primary)" : (idx < 4 ? "var(--accent-teal)" : "var(--accent-violet)"),
                      borderRadius: "var(--radius-sm)",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "16px", textAlign: "center", background: "var(--bg-canvas)", marginTop: "12px", border: "1px solid var(--border-subtle)" }}>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              No health checkup run yet. Click "Run Instant Quantum AI Checkup" above to evaluate your biomarkers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
