import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Activity,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Zap,
  BookOpen,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Heart,
  Eye,
  Brain,
  Layers,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import ModelDocModal from "./ModelDocModal.jsx";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const EVALUATION_SECTIONS = [
  {
    id: "breast-cancer",
    headingLine: "---> [Evaluating Breast Cancer Models] <---",
    title: "Wisconsin Diagnostic Breast Cancer (WDBC)",
    badge: "ONCOLOGICAL DIAGNOSTICS",
    badgeColor: "#D946EF",
    badgeBg: "rgba(217, 70, 239, 0.12)",
    badgeBorder: "rgba(217, 70, 239, 0.3)",
    description: "Multi-parameter comparative audit evaluating quantum variational circuits against classical kernel and tree baselines on 569 fine-needle aspirates.",
    theme: {
      bg: "#090514",
      orbColor: "#D946EF",
      cardBg: "rgba(20, 10, 38, 0.65)",
      accent: "#E879F9",
      glow: "rgba(217, 70, 239, 0.22)",
      border: "rgba(217, 70, 239, 0.28)",
      gradient: "linear-gradient(135deg, rgba(217, 70, 239, 0.15) 0%, transparent 60%)",
    },
    docLink: "https://github.com/ARYANCY/QDoc/blob/main/documentation/models/breast_cancer.md",
    models: [
      {
        name: "OncoPulse-VQC",
        type: "Quantum VQC",
        accuracy: "76.74%",
        accuracyNum: 76.74,
        aucRoc: "0.8443",
        sensitivity: "0.9444",
        specificity: "0.4688",
        precision: "0.7500",
        f1Score: "0.8361",
        mccScore: "0.4909",
        eceError: "0.1440",
        avgLatency: "0.00 ms",
        status: "Quantum Shadow",
        isQuantum: true,
        isChampion: false,
      },
      {
        name: "OncoPulse-QSVM",
        type: "Quantum QSVM",
        accuracy: "74.42%",
        accuracyNum: 74.42,
        aucRoc: "0.8872",
        sensitivity: "0.9815",
        specificity: "0.3438",
        precision: "0.7162",
        f1Score: "0.8281",
        mccScore: "0.4537",
        eceError: "0.0584",
        avgLatency: "0.00 ms",
        status: "Kernel Shadow",
        isQuantum: true,
        isChampion: false,
      },
      {
        name: "Sentinel-RF",
        type: "Classical RF",
        accuracy: "88.37%",
        accuracyNum: 88.37,
        aucRoc: "0.9792",
        sensitivity: "0.9259",
        specificity: "0.8125",
        precision: "0.8929",
        f1Score: "0.9091",
        mccScore: "0.7489",
        eceError: "0.0786",
        avgLatency: "0.00 ms",
        status: "Classical Baseline",
        isQuantum: false,
        isChampion: false,
      },
      {
        name: "Sentinel-SVM",
        type: "Classical SVM",
        accuracy: "96.51%",
        accuracyNum: 96.51,
        aucRoc: "0.9948",
        sensitivity: "1.0000",
        specificity: "0.9062",
        precision: "0.9474",
        f1Score: "0.9730",
        mccScore: "0.9266",
        eceError: "0.0505",
        avgLatency: "0.00 ms",
        status: "🏆 Clinical Champion",
        isQuantum: false,
        isChampion: true,
      },
    ],
  },
  {
    id: "heart-disease",
    headingLine: "---> [Evaluating Heart Disease Models] <---",
    title: "CardioWave Cardiovascular Cohort (Cleveland & Statlog)",
    badge: "CARDIOLOGY VITALITY",
    badgeColor: "#F43F5E",
    badgeBg: "rgba(244, 63, 94, 0.12)",
    badgeBorder: "rgba(244, 63, 94, 0.3)",
    description: "Acute cardiac risk evaluation comparing circular entangled VQC with deep multi-layer perceptrons and gradient boosted decision forests.",
    theme: {
      bg: "#120509",
      orbColor: "#F43F5E",
      cardBg: "rgba(32, 10, 20, 0.65)",
      accent: "#FB7185",
      glow: "rgba(244, 63, 94, 0.22)",
      border: "rgba(244, 63, 94, 0.28)",
      gradient: "linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, transparent 60%)",
    },
    docLink: "https://github.com/ARYANCY/QDoc/blob/main/documentation/models/heart_disease.md",
    models: [
      {
        name: "CardioWave-VQC",
        type: "Quantum VQC",
        accuracy: "95.65%",
        accuracyNum: 95.65,
        aucRoc: "0.8977",
        sensitivity: "1.0000",
        specificity: "0.0000",
        precision: "0.9565",
        f1Score: "0.9778",
        mccScore: "0.0000",
        eceError: "0.0949",
        avgLatency: "0.00 ms",
        status: "Quantum High-Recall",
        isQuantum: true,
        isChampion: false,
      },
      {
        name: "Sentinel-XGB",
        type: "Classical XGB",
        accuracy: "95.65%",
        accuracyNum: 95.65,
        aucRoc: "0.9318",
        sensitivity: "0.9773",
        specificity: "0.5000",
        precision: "0.9773",
        f1Score: "0.9773",
        mccScore: "0.4773",
        eceError: "0.0305",
        avgLatency: "0.00 ms",
        status: "Classical Balanced",
        isQuantum: false,
        isChampion: false,
      },
      {
        name: "Sentinel-MLP",
        type: "Classical MLP",
        accuracy: "97.83%",
        accuracyNum: 97.83,
        aucRoc: "1.0000",
        sensitivity: "1.0000",
        specificity: "0.5000",
        precision: "0.9778",
        f1Score: "0.9888",
        mccScore: "0.6992",
        eceError: "0.0288",
        avgLatency: "0.00 ms",
        status: "🏆 Clinical Champion",
        isQuantum: false,
        isChampion: true,
      },
    ],
  },
  {
    id: "parkinsons",
    headingLine: "---> [Evaluating Parkinson's Models] <---",
    title: "NeuroSynapse Speech Phonation Cohort (Oxford Telemonitoring)",
    badge: "NEUROLOGICAL DYSKINESIA",
    badgeColor: "#06B6D4",
    badgeBg: "rgba(6, 182, 212, 0.12)",
    badgeBorder: "rgba(6, 182, 212, 0.3)",
    description: "Continuous acoustic voice dyskinesia analysis evaluating parameterized quantum circuits and regularized linear controls.",
    theme: {
      bg: "#040A18",
      orbColor: "#06B6D4",
      cardBg: "rgba(10, 20, 48, 0.65)",
      accent: "#38BDF8",
      glow: "rgba(6, 182, 212, 0.22)",
      border: "rgba(6, 182, 212, 0.28)",
      gradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, transparent 60%)",
    },
    docLink: "https://github.com/ARYANCY/QDoc/blob/main/documentation/models/parkinsons.md",
    models: [
      {
        name: "NeuroSynapse-VQC",
        type: "Quantum VQC",
        accuracy: "73.33%",
        accuracyNum: 73.33,
        aucRoc: "0.4659",
        sensitivity: "1.0000",
        specificity: "0.0000",
        precision: "0.7333",
        f1Score: "0.8462",
        mccScore: "0.0000",
        eceError: "0.0388",
        avgLatency: "0.00 ms",
        status: "Quantum Baseline",
        isQuantum: true,
        isChampion: false,
      },
      {
        name: "Sentinel-RF",
        type: "Classical RF",
        accuracy: "73.33%",
        accuracyNum: 73.33,
        aucRoc: "0.4318",
        sensitivity: "1.0000",
        specificity: "0.0000",
        precision: "0.7333",
        f1Score: "0.8462",
        mccScore: "0.0000",
        eceError: "0.0918",
        avgLatency: "0.00 ms",
        status: "Classical RF",
        isQuantum: false,
        isChampion: false,
      },
      {
        name: "Sentinel-LogReg",
        type: "Classical LogReg",
        accuracy: "73.33%",
        accuracyNum: 73.33,
        aucRoc: "0.5114",
        sensitivity: "1.0000",
        specificity: "0.0000",
        precision: "0.7333",
        f1Score: "0.8462",
        mccScore: "0.0000",
        eceError: "0.0959",
        avgLatency: "0.00 ms",
        status: "🏆 Linear Control Lead",
        isQuantum: false,
        isChampion: true,
      },
    ],
  },
  {
    id: "diabetes",
    headingLine: "---> [Evaluating Diabetes Models] <---",
    title: "Endocrine Metabolic Diagnostic Cohort (Pima Indians)",
    badge: "METABOLIC HOMEOSTASIS",
    badgeColor: "#10B981",
    badgeBg: "rgba(16, 185, 129, 0.12)",
    badgeBorder: "rgba(16, 185, 129, 0.3)",
    description: "Metabolic risk triage evaluating 8-qubit variational Hamiltonian expectation models against calibrated random forest ensembles.",
    theme: {
      bg: "#03140C",
      orbColor: "#10B981",
      cardBg: "rgba(6, 32, 22, 0.65)",
      accent: "#34D399",
      glow: "rgba(16, 185, 129, 0.22)",
      border: "rgba(16, 185, 129, 0.28)",
      gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, transparent 60%)",
    },
    docLink: "https://github.com/ARYANCY/QDoc/blob/main/documentation/models/diabetes.md",
    models: [
      {
        name: "Diabetes-VQC",
        type: "Quantum VQC",
        accuracy: "71.55%",
        accuracyNum: 71.55,
        aucRoc: "0.8631",
        sensitivity: "1.0000",
        specificity: "0.0000",
        precision: "0.7155",
        f1Score: "0.8342",
        mccScore: "0.0000",
        eceError: "0.1238",
        avgLatency: "0.00 ms",
        status: "Quantum Shadow",
        isQuantum: true,
        isChampion: false,
      },
      {
        name: "Sentinel-RF",
        type: "Classical RF",
        accuracy: "91.38%",
        accuracyNum: 91.38,
        aucRoc: "0.9693",
        sensitivity: "0.9277",
        specificity: "0.8788",
        precision: "0.9506",
        f1Score: "0.9390",
        mccScore: "0.7927",
        eceError: "0.0741",
        avgLatency: "0.00 ms",
        status: "🏆 Clinical Champion",
        isQuantum: false,
        isChampion: true,
      },
      {
        name: "Sentinel-XGB",
        type: "Classical XGB",
        accuracy: "90.52%",
        accuracyNum: 90.52,
        aucRoc: "0.9701",
        sensitivity: "0.9036",
        specificity: "0.9091",
        precision: "0.9615",
        f1Score: "0.9317",
        mccScore: "0.7813",
        eceError: "0.0544",
        avgLatency: "0.00 ms",
        status: "High Specificity Lead",
        isQuantum: false,
        isChampion: false,
      },
    ],
  },
];

export default function ModelEvaluationShowcase() {
  const containerRef = useRef(null);
  const orbRef = useRef(null);
  const [selectedModelDoc, setSelectedModelDoc] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Entrance animation for the master heading
      gsap.from(".showcase-header", {
        opacity: 0,
        y: 40,
        duration: 1.0,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".showcase-header",
          start: "top 80%",
        },
      });

      // 2. Animate each disease section card with stagger and background color shift
      EVALUATION_SECTIONS.forEach((section, idx) => {
        const sectionElem = document.getElementById(`section-${section.id}`);
        if (!sectionElem) return;

        // Animate card entrance
        gsap.from(sectionElem, {
          opacity: 0,
          y: 50,
          scale: 0.98,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionElem,
            start: "top 78%",
          },
        });

        // Stagger table rows inside section
        const rows = sectionElem.querySelectorAll(".model-row");
        if (rows.length) {
          gsap.from(rows, {
            opacity: 0,
            x: -25,
            stagger: 0.08,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionElem,
              start: "top 70%",
            },
          });
        }

        // Background Color Shift & Dynamic Ambient Orb
        ScrollTrigger.create({
          trigger: sectionElem,
          start: "top 55%",
          end: "bottom 45%",
          onEnter: () => {
            gsap.to(containerRef.current, {
              backgroundColor: section.theme.bg,
              duration: 1.2,
              ease: "power2.out",
            });
            if (orbRef.current) {
              gsap.to(orbRef.current, {
                background: `radial-gradient(circle, ${section.theme.glow} 0%, transparent 70%)`,
                top: `${sectionElem.offsetTop + 100}px`,
                duration: 1.4,
                ease: "power2.out",
              });
            }
          },
          onEnterBack: () => {
            gsap.to(containerRef.current, {
              backgroundColor: section.theme.bg,
              duration: 1.2,
              ease: "power2.out",
            });
            if (orbRef.current) {
              gsap.to(orbRef.current, {
                background: `radial-gradient(circle, ${section.theme.glow} 0%, transparent 70%)`,
                top: `${sectionElem.offsetTop + 100}px`,
                duration: 1.4,
                ease: "power2.out",
              });
            }
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      id="quantum-model-benchmarks"
      style={{
        width: "100%",
        backgroundColor: "#090514",
        color: "#F8FAFC",
        padding: "clamp(60px, 8vw, 110px) clamp(20px, 4vw, 48px)",
        transition: "background-color 0.9s ease",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Dynamic Floating Ambient Light Orb */}
      <div
        ref={orbRef}
        style={{
          position: "absolute",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(217, 70, 239, 0.22) 0%, transparent 70%)",
          filter: "blur(120px)",
          pointerEvents: "none",
          zIndex: 0,
          left: "50%",
          transform: "translateX(-50%)",
          transition: "background 1.2s ease, top 1.2s ease",
        }}
      />

      {/* Cyber Grid Texture Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Top Border Accent Line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.3), rgba(217, 70, 239, 0.3), transparent)",
        }}
      />

      {/* Master Section Header */}
      <div className="showcase-header" style={{ maxWidth: "1280px", margin: "0 auto 72px auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "30px",
            fontSize: "0.72rem",
            fontWeight: 800,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            color: "#38BDF8",
            marginBottom: "18px",
            boxShadow: "0 4px 16px rgba(56, 189, 248, 0.15)",
          }}
        >
          <Sparkles size={13} color="#38BDF8" />
          Audited Clinical Intelligence Suite
        </div>

        <h2
          style={{
            fontSize: "clamp(2.2rem, 4.2vw, 3.8rem)",
            fontWeight: 900,
            letterSpacing: "-0.035em",
            lineHeight: 1.08,
            margin: "0 0 18px 0",
            color: "#FFFFFF",
          }}
        >
          Quantum vs. Classical <br />
          <span
            style={{
              background: "linear-gradient(135deg, #38BDF8 0%, #C084FC 45%, #F43F5E 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Empirical Model Evaluations
          </span>
        </h2>

        <p
          style={{
            fontSize: "clamp(0.96rem, 1.3vw, 1.15rem)",
            color: "#94A3B8",
            maxWidth: "780px",
            margin: "0 auto",
            lineHeight: 1.65,
          }}
        >
          Rigorous 5-seed patient-level stratified benchmarking evaluating PennyLane Variational Quantum Classifiers (VQC) and Quantum Support Vector Machines (QSVM) alongside classical sentinel baselines under identical feature representations.
        </p>
      </div>

      {/* 4 Disease Sections */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "88px", position: "relative", zIndex: 1 }}>
        {EVALUATION_SECTIONS.map((section, idx) => (
          <section
            key={section.id}
            id={`section-${section.id}`}
            style={{
              position: "relative",
              padding: "clamp(28px, 4vw, 48px)",
              background: section.theme.cardBg,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: `1px solid ${section.theme.border}`,
              borderRadius: "20px",
              boxShadow: `0 24px 64px -16px ${section.theme.glow}`,
              backgroundImage: section.theme.gradient,
              transition: "border-color 0.4s ease, box-shadow 0.4s ease, background 0.4s ease",
            }}
          >
            {/* Header Line with Sexy ASCII Style */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                marginBottom: "20px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                paddingBottom: "18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                {/* Glowing ASCII Terminal Header */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(0, 0, 0, 0.45)",
                    border: `1px solid ${section.theme.border}`,
                    borderRadius: "8px",
                    padding: "6px 14px",
                    boxShadow: `0 0 20px ${section.theme.glow}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "clamp(0.85rem, 1.4vw, 1.05rem)",
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      color: section.theme.accent,
                      textShadow: `0 0 12px ${section.theme.glow}`,
                    }}
                  >
                    {section.headingLine}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: section.badgeBg,
                    color: section.badgeColor,
                    border: `1px solid ${section.badgeBorder}`,
                    letterSpacing: "0.06em",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {section.badge}
                </span>
              </div>

              {/* Documentation Link Button */}
              <a
                href={section.docLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  textDecoration: "none",
                  transition: "background 0.2s, border-color 0.2s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.14)";
                  e.currentTarget.style.borderColor = section.theme.accent;
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.14)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <BookOpen size={14} color={section.theme.accent} />
                <span>Technical Model Docs</span>
                <ArrowUpRight size={13} />
              </a>
            </div>

            <p style={{ fontSize: "0.90rem", color: "#CBD5E1", margin: "0 0 24px 0", lineHeight: 1.6, maxWidth: "880px" }}>
              {section.description}
            </p>

            {/* Benchmark Table */}
            <div
              style={{
                overflowX: "auto",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(5, 8, 18, 0.55)",
                boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.3)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94A3B8" }}>
                    <th style={{ padding: "16px 18px", fontWeight: 700 }}>Model Name & Architecture</th>
                    <th style={{ padding: "16px 12px", fontWeight: 700, textAlign: "right" }}>Accuracy</th>
                    <th style={{ padding: "16px 12px", fontWeight: 700, textAlign: "right" }}>AUC-ROC</th>
                    <th style={{ padding: "16px 12px", fontWeight: 700, textAlign: "right" }}>Sensitivity</th>
                    <th style={{ padding: "16px 12px", fontWeight: 700, textAlign: "right" }}>Specificity</th>
                    <th style={{ padding: "16px 12px", fontWeight: 700, textAlign: "right" }}>Precision</th>
                    <th style={{ padding: "16px 12px", fontWeight: 700, textAlign: "right" }}>F1 Score</th>
                    <th style={{ padding: "16px 12px", fontWeight: 700, textAlign: "right" }}>MCC</th>
                    <th style={{ padding: "16px 12px", fontWeight: 700, textAlign: "right" }}>ECE Error</th>
                    <th style={{ padding: "16px 12px", fontWeight: 700, textAlign: "right" }}>Avg Latency</th>
                    <th style={{ padding: "16px 18px", fontWeight: 700, textAlign: "center" }}>Specification</th>
                  </tr>
                </thead>
                <tbody>
                  {section.models.map((model, mIdx) => (
                    <tr
                      key={model.name}
                      className="model-row"
                      style={{
                        borderBottom: mIdx !== section.models.length - 1 ? "1px solid rgba(255, 255, 255, 0.04)" : "none",
                        background: model.isChampion ? "rgba(16, 185, 129, 0.06)" : "transparent",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = model.isChampion ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.035)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = model.isChampion ? "rgba(16, 185, 129, 0.06)" : "transparent";
                      }}
                    >
                      {/* Model Name */}
                      <td style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: model.isQuantum ? "rgba(168, 85, 247, 0.15)" : "rgba(16, 185, 129, 0.15)",
                              border: `1px solid ${model.isQuantum ? "rgba(168, 85, 247, 0.35)" : "rgba(16, 185, 129, 0.35)"}`,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: model.isQuantum ? "#C084FC" : "#34D399",
                              flexShrink: 0,
                            }}
                          >
                            {model.isQuantum ? <Zap size={16} /> : <Cpu size={16} />}
                          </span>
                          <div>
                            <strong style={{ fontSize: "0.90rem", color: "#FFFFFF", display: "block" }}>
                              {model.name}
                            </strong>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                              <span style={{ fontSize: "0.68rem", color: "#94A3B8" }}>
                                {model.type}
                              </span>
                              {model.isChampion && (
                                <span
                                  style={{
                                    fontSize: "0.62rem",
                                    color: "#34D399",
                                    background: "rgba(16, 185, 129, 0.18)",
                                    border: "1px solid rgba(16, 185, 129, 0.4)",
                                    padding: "1px 6px",
                                    borderRadius: "3px",
                                    fontWeight: 800,
                                  }}
                                >
                                  CHAMPION
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Accuracy */}
                      <td style={{ padding: "16px 12px", textAlign: "right", fontFamily: "var(--font-mono, monospace)" }}>
                        <strong style={{ color: model.isChampion ? "#34D399" : "#FFFFFF", fontSize: "0.94rem" }}>
                          {model.accuracy}
                        </strong>
                        <div
                          style={{
                            width: "70px",
                            height: "3px",
                            background: "rgba(255, 255, 255, 0.1)",
                            borderRadius: "2px",
                            margin: "4px 0 0 auto",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${model.accuracyNum}%`,
                              height: "100%",
                              background: model.isChampion
                                ? "linear-gradient(90deg, #10B981, #34D399)"
                                : model.isQuantum
                                ? "linear-gradient(90deg, #A855F7, #D946EF)"
                                : "linear-gradient(90deg, #3B82F6, #38BDF8)",
                            }}
                          />
                        </div>
                      </td>

                      {/* AUC-ROC */}
                      <td style={{ padding: "16px 12px", textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#38BDF8", fontWeight: 700 }}>
                        {model.aucRoc}
                      </td>

                      {/* Sensitivity */}
                      <td style={{ padding: "16px 12px", textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: parseFloat(model.sensitivity) >= 0.95 ? "#34D399" : "#F8FAFC", fontWeight: 600 }}>
                        {model.sensitivity}
                      </td>

                      {/* Specificity */}
                      <td style={{ padding: "16px 12px", textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: parseFloat(model.specificity) === 0 ? "#F43F5E" : "#F8FAFC", fontWeight: 600 }}>
                        {model.specificity}
                      </td>

                      {/* Precision */}
                      <td style={{ padding: "16px 12px", textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#E2E8F0" }}>
                        {model.precision}
                      </td>

                      {/* F1 Score */}
                      <td style={{ padding: "16px 12px", textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#E2E8F0" }}>
                        {model.f1Score}
                      </td>

                      {/* MCC */}
                      <td style={{ padding: "16px 12px", textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#E2E8F0" }}>
                        {model.mccScore}
                      </td>

                      {/* ECE Error */}
                      <td style={{ padding: "16px 12px", textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#FBBF24" }}>
                        {model.eceError}
                      </td>

                      {/* Avg Latency */}
                      <td style={{ padding: "16px 12px", textAlign: "right", fontFamily: "var(--font-mono, monospace)", color: "#C084FC" }}>
                        {model.avgLatency}
                      </td>

                      {/* Doc Specs Button */}
                      <td style={{ padding: "16px 18px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedModelDoc(model.name)}
                          style={{
                            background: "rgba(255, 255, 255, 0.08)",
                            border: "1px solid rgba(255, 255, 255, 0.16)",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            color: "#FFFFFF",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)";
                            e.currentTarget.style.borderColor = section.theme.accent;
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = `0 4px 12px ${section.theme.glow}`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.2)";
                          }}
                        >
                          <Eye size={12} color={section.theme.accent} />
                          <span>View Doc</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      {/* Model Documentation Slide-over Drawer / Modal */}
      {selectedModelDoc && (
        <ModelDocModal
          modelName={selectedModelDoc}
          onClose={() => setSelectedModelDoc(null)}
        />
      )}
    </div>
  );
}
