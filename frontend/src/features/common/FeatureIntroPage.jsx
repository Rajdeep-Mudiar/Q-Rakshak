import React, { useEffect, useRef } from "react";
import {
  ArrowRight,
  Play,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Clock,
  Share2,
  FileCheck,
  Video,
  Mic,
  Cpu,
  AlertOctagon,
  Zap,
  QrCode,
  Shield,
  Eye,
  Layers,
  Calendar,
  Activity,
  ChevronRight,
  UserCheck,
  Check,
  Users
} from "lucide-react";
import { getFeatureIntroById, getLocalizedFeatureIntroById, FEATURE_INTRO_REGISTRY } from "../../data/featureIntroRegistry.js";
import { animateEditorialHero, animateCardStagger, animateCounter } from "../../utils/motion.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

const ICON_MAP = {
  Clock,
  Share2,
  FileCheck,
  Video,
  Mic,
  Cpu,
  AlertOctagon,
  Zap,
  Lock,
  QrCode,
  Shield,
  Eye,
  Layers,
  Calendar,
  Activity,
  CheckCircle: CheckCircle2,
};

export default function FeatureIntroPage({
  featureId = "doctor_consultation",
  onProceed,
  onSecondaryAction,
  onSwitchFeature,
}) {
  const { t } = useLanguage();
  const feature = getLocalizedFeatureIntroById(featureId, t);

  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (heroRef.current) {
      animateEditorialHero(heroRef.current);
    }
    if (statsRef.current) {
      const statElements = statsRef.current.querySelectorAll(".feature-stat-val");
      statElements.forEach((el) => {
        const raw = el.getAttribute("data-value") || "";
        const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
        if (!isNaN(num) && num > 0) {
          const suffix = raw.includes("%") ? "%" : raw.includes("+") ? "+" : raw.includes("ms") ? " ms" : raw.includes("Mins") ? " Mins" : "";
          const decimals = raw.includes(".") ? 1 : 0;
          animateCounter(el, 0, num, decimals, suffix);
        }
      });
    }
    if (cardsRef.current) {
      animateCardStagger(cardsRef.current, ".feature-stagger-card");
    }
  }, [featureId]);

  return (
    <div
      className="feature-intro-wrapper"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "20px 24px 60px",
        maxWidth: "1320px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* ── Breadcrumb & Feature Switcher Strip ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
          <span style={{ fontWeight: 600, color: "var(--primary)" }}>{t("features.ui.platform_modules", "Platform Modules")}</span>
          <ChevronRight size={14} color="var(--text-muted)" />
          <span style={{ fontWeight: 500 }}>{feature.category}</span>
          <ChevronRight size={14} color="var(--text-muted)" />
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{feature.title}</span>
        </div>

        {/* Feature Pill Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: "4px" }}>
            {t("features.ui.explore_module", "Explore Module:")}
          </span>
          {Object.values(FEATURE_INTRO_REGISTRY).map((f) => {
            const locF = getLocalizedFeatureIntroById(f.id, t);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSwitchFeature && onSwitchFeature(f.id)}
                style={{
                  background: f.id === feature.id ? "var(--primary)" : "var(--bg-surface)",
                  color: f.id === feature.id ? "#FFFFFF" : "var(--text-secondary)",
                  border: f.id === feature.id ? "1px solid var(--primary)" : "1px solid var(--border-default)",
                  borderRadius: "var(--radius-pill)",
                  padding: "4px 10px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                {locF.title.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── HERO BANNER: Feature Visual & High-Impact Headlines ── */}
      <div
        ref={heroRef}
        className="editorial-card"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-card)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div style={{ height: "4px", background: `linear-gradient(90deg, ${feature.accentColor}, #0284C7)` }} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "28px",
            padding: "32px",
            alignItems: "center",
          }}
        >
          {/* Left Column: Headlines & CTAs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.70rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-pill)",
                  background: feature.accentBg,
                  color: feature.accentColor,
                  border: `1px solid ${feature.accentColor}33`,
                }}
              >
                <Sparkles size={12} />
                {feature.badge}
              </span>
            </div>

            <div>
              <h1
                className="editorial-reveal"
                style={{
                  fontSize: "clamp(1.8rem, 3.2vw, 2.5rem)",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: "-0.025em",
                  color: "var(--text-primary)",
                  margin: "0 0 8px",
                }}
              >
                {feature.title}
              </h1>
              <p
                className="editorial-reveal"
                style={{
                  fontSize: "1.02rem",
                  fontWeight: 500,
                  color: feature.accentColor,
                  margin: 0,
                }}
              >
                {feature.tagline}
              </p>
            </div>

            <p
              className="editorial-reveal"
              style={{
                fontSize: "0.92rem",
                lineHeight: 1.6,
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              {feature.overview.summary}
            </p>

            {/* Primary Action Buttons */}
            <div
              className="editorial-reveal"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                flexWrap: "wrap",
                marginTop: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => onProceed && onProceed(feature.targetTab)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  background: `linear-gradient(135deg, ${feature.accentColor} 0%, #075E66 100%)`,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  padding: "13px 26px",
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: `0 4px 18px ${feature.accentColor}44`,
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow = `0 8px 24px ${feature.accentColor}66`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = `0 4px 18px ${feature.accentColor}44`;
                }}
              >
                <Play size={16} fill="#FFFFFF" />
                <span>{feature.primaryCta}</span>
                <ArrowRight size={16} />
              </button>

              {feature.secondaryTab && (
                <button
                  type="button"
                  onClick={() => onSecondaryAction && onSecondaryAction(feature.secondaryTab)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 20px",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = feature.accentColor;
                    e.currentTarget.style.background = "var(--bg-surface-alt)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-default)";
                    e.currentTarget.style.background = "var(--bg-surface)";
                  }}
                >
                  <span>{feature.secondaryCta}</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Visual Gemini Illustration Card */}
          <div
            className="editorial-reveal"
            style={{
              position: "relative",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-md)",
              background: "#F8FAFC",
              minHeight: "280px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={feature.heroImage}
              alt={`${feature.title} Illustration`}
              style={{
                width: "100%",
                height: "100%",
                maxHeight: "360px",
                objectFit: "cover",
                display: "block",
                transition: "transform 0.4s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
            />
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                left: "12px",
                background: "rgba(255, 255, 255, 0.94)",
                backdropFilter: "blur(8px)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <ShieldCheck size={14} color="var(--risk-low)" />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {t("features.ui.verified_interface", "Verified Medical Interface")}
              </span>
            </div>
          </div>
        </div>

        {/* ── FAST STATS BAR ── */}
        <div
          ref={statsRef}
          style={{
            borderTop: "1px solid var(--border-default)",
            background: "var(--bg-surface-alt)",
            padding: "16px 32px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "16px",
          }}
        >
          {Object.values(feature.stats).map((st, sIdx) => (
            <div key={sIdx}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                {st.label}
              </div>
              <div
                className="feature-stat-val"
                data-value={st.value}
                style={{ fontSize: "1.4rem", fontWeight: 800, color: feature.accentColor, fontFamily: "var(--font-mono)", marginTop: "2px" }}
              >
                {st.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4 KEY BENEFITS / CAPABILITIES GRID ── */}
      <div ref={cardsRef} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          {t("features.ui.core_capabilities", "Core Capabilities & Clinical Advantage")}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          {feature.benefits.map((b, bIdx) => {
            const IconComp = ICON_MAP[b.icon] || ShieldCheck;
            return (
              <div
                key={bIdx}
                className="feature-stagger-card editorial-card"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  padding: "20px",
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: feature.accentBg,
                    color: feature.accentColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconComp size={18} />
                </div>
                <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {b.title}
                </h4>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
                  {b.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4-STEP HOW IT WORKS WORKFLOW ── */}
      <div
        className="editorial-card"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)",
          padding: "28px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 20px" }}>
          {t("features.ui.how_it_works", "How This Module Works (Step-by-Step)")}
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          {feature.howItWorks.map((step, sIdx) => (
            <div
              key={sIdx}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 900,
                  color: feature.accentColor,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {step.step}
              </div>
              <h4 style={{ fontSize: "0.90rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {step.title}
              </h4>
              <p style={{ fontSize: "0.80rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CLINICAL & REGULATORY COMPLIANCE BANNER ── */}
      <div
        style={{
          background: "var(--bg-surface-alt)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <ShieldCheck size={24} color="var(--risk-low)" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 2px" }}>
            {t("features.ui.compliance_title", "Clinical Rigor & Zero-Trust Privacy Compliance")}
          </h4>
          <p style={{ fontSize: "0.80rem", color: "var(--text-secondary)", margin: 0 }}>
            {feature.overview.clinicalStandards}
          </p>
        </div>
      </div>

      {/* ── BOTTOM CONVERSION CARD ── */}
      <div
        className="editorial-card"
        style={{
          background: `linear-gradient(135deg, ${feature.accentBg} 0%, rgba(255, 255, 255, 0.95) 100%)`,
          border: `1px solid ${feature.accentColor}33`,
          borderRadius: "var(--radius-lg)",
          padding: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: feature.accentColor,
              display: "block",
              marginBottom: "4px",
            }}
          >
            {t("features.ui.ready_to_proceed", "READY TO PROCEED")}
          </span>
          <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px" }}>
            {t("features.ui.launch_module", `Launch ${feature.title}`, { title: feature.title })}
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
            {t("features.ui.launch_desc", "Enter the active working environment with all verified privacy protections active.")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onProceed && onProceed(feature.targetTab)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            background: `linear-gradient(135deg, ${feature.accentColor} 0%, #075E66 100%)`,
            color: "#FFFFFF",
            border: "none",
            borderRadius: "var(--radius-md)",
            padding: "14px 28px",
            fontSize: "0.94rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: `0 4px 20px ${feature.accentColor}44`,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
            e.currentTarget.style.boxShadow = `0 8px 24px ${feature.accentColor}66`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = `0 4px 20px ${feature.accentColor}44`;
          }}
        >
          <Play size={16} fill="#FFFFFF" />
          <span>{t("features.ui.launch_btn", "Launch Module Now")}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
