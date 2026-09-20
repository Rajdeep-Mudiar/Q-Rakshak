import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Cpu,
  Zap,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import ModelDocModal from "./ModelDocModal.jsx";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const EVALUATION_SECTIONS = [
  {
    id: "breast-cancer",
    index: "01",
    headingLine: "---> [Evaluating Breast Cancer Models] <---",
    headingTitle: "Evaluating Breast Cancer Models",
    category: "ONCOLOGY // WDBC COHORT",
    title: "Wisconsin Diagnostic Breast Cancer",
    sampleSize: "N = 569 FNA Biopsies • 30 Morphological Dimensions",
    description: "Standardized 5-seed patient-level stratified 3-way partition evaluating 8-qubit variational circuits against regularized classical kernel and tree ensembles.",
    bgColor: "#09080A",
    cardBg: "#0E0D10",
    borderColor: "#222026",
    accentColor: "#D4B3E2", // Soft muted chalk lilac
    docLink: "https://github.com/ARYANCY/QDoc/blob/main/documentation/models/breast_cancer.md",
    models: [
      {
        name: "OncoPulse-VQC",
        architecture: "8-Qubit Circular VQC",
        type: "Quantum VQC",
        accuracy: "76.74%",
        aucRoc: "0.8443",
        sensitivity: "0.9444",
        specificity: "0.4688",
        sensSpec: "0.9444 / 0.4688",
        precision: "0.7500",
        f1Score: "0.8361",
        precF1: "0.7500 / 0.8361",
        mccScore: "0.4909",
        eceError: "0.1440",
        avgLatency: "0.00 ms",
        status: "QUANTUM SHADOW",
        isQuantum: true,
        isChampion: false,
      },
      {
        name: "OncoPulse-QSVM",
        architecture: "ZZ Feature Map Kernel",
        type: "Quantum QSVM",
        accuracy: "74.42%",
        aucRoc: "0.8872",
        sensitivity: "0.9815",
        specificity: "0.3438",
        sensSpec: "0.9815 / 0.3438",
        precision: "0.7162",
        f1Score: "0.8281",
        precF1: "0.7162 / 0.8281",
        mccScore: "0.4537",
        eceError: "0.0584",
        avgLatency: "0.00 ms",
        status: "KERNEL SHADOW",
        isQuantum: true,
        isChampion: false,
      },
      {
        name: "Sentinel-RF",
        architecture: "100-Tree Decision Forest",
        type: "Classical RF",
        accuracy: "88.37%",
        aucRoc: "0.9792",
        sensitivity: "0.9259",
        specificity: "0.8125",
        sensSpec: "0.9259 / 0.8125",
        precision: "0.8929",
        f1Score: "0.9091",
        precF1: "0.8929 / 0.9091",
        mccScore: "0.7489",
        eceError: "0.0786",
        avgLatency: "0.00 ms",
        status: "CLASSICAL CONTROL",
        isQuantum: false,
        isChampion: false,
      },
      {
        name: "Sentinel-SVM",
        architecture: "RBF Kernel (C=1.0, γ='scale')",
        type: "Classical SVM",
        accuracy: "96.51%",
        aucRoc: "0.9948",
        sensitivity: "1.0000",
        specificity: "0.9062",
        sensSpec: "1.0000 / 0.9062",
        precision: "0.9474",
        f1Score: "0.9730",
        precF1: "0.9474 / 0.9730",
        mccScore: "0.9266",
        eceError: "0.0505",
        avgLatency: "0.00 ms",
        status: "CLINICAL CHAMPION",
        isQuantum: false,
        isChampion: true,
      },
    ],
  },
  {
    id: "heart-disease",
    index: "02",
    headingLine: "---> [Evaluating Heart Disease Models] <---",
    headingTitle: "Evaluating Heart Disease Models",
    category: "CARDIOLOGY // CARDIO-WAVE",
    title: "Cleveland & Statlog Cardiac Cohort",
    sampleSize: "N = 303 Clinical Profiles • 13 Diagnostic Attributes",
    description: "Acute coronary risk classification comparing circular nearest-neighbor parameterized circuits with deep dense multi-layer networks and boosted gradient ensembles.",
    bgColor: "#0A0808",
    cardBg: "#100D0D",
    borderColor: "#262020",
    accentColor: "#E2B3B8", // Soft muted chalk rose
    docLink: "https://github.com/ARYANCY/QDoc/blob/main/documentation/models/heart_disease.md",
    models: [
      {
        name: "CardioWave-VQC",
        architecture: "6-Qubit Hardware-Efficient",
        type: "Quantum VQC",
        accuracy: "95.65%",
        aucRoc: "0.8977",
        sensitivity: "1.0000",
        specificity: "0.0000",
        sensSpec: "1.0000 / 0.0000",
        precision: "0.9565",
        f1Score: "0.9778",
        precF1: "0.9565 / 0.9778",
        mccScore: "0.0000",
        eceError: "0.0949",
        avgLatency: "0.00 ms",
        status: "HIGH RECALL",
        isQuantum: true,
        isChampion: false,
      },
      {
        name: "Sentinel-XGB",
        architecture: "120 Boosted Trees (η=0.05)",
        type: "Classical XGB",
        accuracy: "95.65%",
        aucRoc: "0.9318",
        sensitivity: "0.9773",
        specificity: "0.5000",
        sensSpec: "0.9773 / 0.5000",
        precision: "0.9773",
        f1Score: "0.9773",
        precF1: "0.9773 / 0.9773",
        mccScore: "0.4773",
        eceError: "0.0305",
        avgLatency: "0.00 ms",
        status: "BALANCED CONTROL",
        isQuantum: false,
        isChampion: false,
      },
      {
        name: "Sentinel-MLP",
        architecture: "Dense 64-32 Layer Stack",
        type: "Classical MLP",
        accuracy: "97.83%",
        aucRoc: "1.0000",
        sensitivity: "1.0000",
        specificity: "0.5000",
        sensSpec: "1.0000 / 0.5000",
        precision: "0.9778",
        f1Score: "0.9888",
        precF1: "0.9778 / 0.9888",
        mccScore: "0.6992",
        eceError: "0.0288",
        avgLatency: "0.00 ms",
        status: "CLINICAL CHAMPION",
        isQuantum: false,
        isChampion: true,
      },
    ],
  },
  {
    id: "parkinsons",
    index: "03",
    headingLine: "---> [Evaluating Parkinson's Models] <---",
    headingTitle: "Evaluating Parkinson's Models",
    category: "NEUROLOGY // NEURO-SYNAPSE",
    title: "Oxford Phonation Telemonitoring",
    sampleSize: "N = 195 Voice Recordings • 16 Acoustic Jitter/Shimmer Formants",
    description: "Continuous dysphonia assessment evaluating multi-qubit Pauli-Z expectation classifiers against regularized linear controls under class-imbalanced held-out test splits.",
    bgColor: "#08090C",
    cardBg: "#0C0E12",
    borderColor: "#1E222A",
    accentColor: "#B3C8E2", // Soft muted chalk slate
    docLink: "https://github.com/ARYANCY/QDoc/blob/main/documentation/models/parkinsons.md",
    models: [
      {
        name: "NeuroSynapse-VQC",
        architecture: "8-Qubit Angle Embedding",
        type: "Quantum VQC",
        accuracy: "73.33%",
        aucRoc: "0.4659",
        sensitivity: "1.0000",
        specificity: "0.0000",
        sensSpec: "1.0000 / 0.0000",
        precision: "0.7333",
        f1Score: "0.8462",
        precF1: "0.7333 / 0.8462",
        mccScore: "0.0000",
        eceError: "0.0388",
        avgLatency: "0.00 ms",
        status: "MIN-ECE BASELINE",
        isQuantum: true,
        isChampion: false,
      },
      {
        name: "Sentinel-RF",
        architecture: "100-Tree Stratified Forest",
        type: "Classical RF",
        accuracy: "73.33%",
        aucRoc: "0.4318",
        sensitivity: "1.0000",
        specificity: "0.0000",
        sensSpec: "1.0000 / 0.0000",
        precision: "0.7333",
        f1Score: "0.8462",
        precF1: "0.7333 / 0.8462",
        mccScore: "0.0000",
        eceError: "0.0918",
        avgLatency: "0.00 ms",
        status: "CLASSICAL CONTROL",
        isQuantum: false,
        isChampion: false,
      },
      {
        name: "Sentinel-LogReg",
        architecture: "L2 Regularized (C=1.0)",
        type: "Classical LogReg",
        accuracy: "73.33%",
        aucRoc: "0.5114",
        sensitivity: "1.0000",
        specificity: "0.0000",
        sensSpec: "1.0000 / 0.0000",
        precision: "0.7333",
        f1Score: "0.8462",
        precF1: "0.7333 / 0.8462",
        mccScore: "0.0000",
        eceError: "0.0959",
        avgLatency: "0.00 ms",
        status: "AUC LEAD",
        isQuantum: false,
        isChampion: true,
      },
    ],
  },
  {
    id: "diabetes",
    index: "04",
    headingLine: "---> [Evaluating Diabetes Models] <---",
    headingTitle: "Evaluating Diabetes Models",
    category: "METABOLIC // ENDOCRINE SUITE",
    title: "Pima Indians Diabetes Diagnostic",
    sampleSize: "N = 768 Patient Histories • 8 Physiological Indices",
    description: "Endocrine disorder prediction comparing train-normalized rotational variational circuits with calibrated ensemble decision trees on held-out test data.",
    bgColor: "#070908",
    cardBg: "#0B0E0C",
    borderColor: "#1D2420",
    accentColor: "#B3E2C6", // Soft muted chalk mint
    docLink: "https://github.com/ARYANCY/QDoc/blob/main/documentation/models/diabetes.md",
    models: [
      {
        name: "Diabetes-VQC",
        architecture: "8-Qubit Circular Ring",
        type: "Quantum VQC",
        accuracy: "71.55%",
        aucRoc: "0.8631",
        sensitivity: "1.0000",
        specificity: "0.0000",
        sensSpec: "1.0000 / 0.0000",
        precision: "0.7155",
        f1Score: "0.8342",
        precF1: "0.7155 / 0.8342",
        mccScore: "0.0000",
        eceError: "0.1238",
        avgLatency: "0.00 ms",
        status: "HIGH RECALL",
        isQuantum: true,
        isChampion: false,
      },
      {
        name: "Sentinel-RF",
        architecture: "150 Decision Estimators",
        type: "Classical RF",
        accuracy: "91.38%",
        aucRoc: "0.9693",
        sensitivity: "0.9277",
        specificity: "0.8788",
        sensSpec: "0.9277 / 0.8788",
        precision: "0.9506",
        f1Score: "0.9390",
        precF1: "0.9506 / 0.9390",
        mccScore: "0.7927",
        eceError: "0.0741",
        avgLatency: "0.00 ms",
        status: "CLINICAL CHAMPION",
        isQuantum: false,
        isChampion: true,
      },
      {
        name: "Sentinel-XGB",
        architecture: "100 Gradient Boosting Trees",
        type: "Classical XGB",
        accuracy: "90.52%",
        aucRoc: "0.9701",
        sensitivity: "0.9036",
        specificity: "0.9091",
        sensSpec: "0.9036 / 0.9091",
        precision: "0.9615",
        f1Score: "0.9317",
        precF1: "0.9615 / 0.9317",
        mccScore: "0.7813",
        eceError: "0.0544",
        avgLatency: "0.00 ms",
        status: "SPECIFICITY LEAD",
        isQuantum: false,
        isChampion: false,
      },
    ],
  },
  {
    id: "pneumonia",
    index: "05",
    headingLine: "---> [Evaluating Pneumonia Models] <---",
    headingTitle: "Evaluating Pneumonia Models",
    category: "PULMONOLOGY // CHEST X-RAY",
    title: "Guangzhou Pediatric Radiograph Cohort",
    sampleSize: "N = 5,863 Chest X-Rays • Visual Backbone + Quantum Head",
    description: "Pediatric respiratory consolidation diagnosis comparing hybrid visual quantum variational networks against 50-layer classical deep residual baselines.",
    bgColor: "#07080A",
    cardBg: "#0B0D10",
    borderColor: "#1B212A",
    accentColor: "#93C5FD", // Soft muted chalk cyan/blue
    docLink: "https://github.com/ARYANCY/QDoc/blob/main/documentation/models/pneumonia.md",
    models: [
      {
        name: "QuantumPneu",
        architecture: "8-Qubit Visual VQC Head",
        type: "Quantum VQC",
        accuracy: "98.60%",
        aucRoc: "0.9920",
        sensitivity: "1.0000",
        specificity: "0.9650",
        sensSpec: "1.0000 / 0.9650",
        precision: "0.9780",
        f1Score: "0.9889",
        precF1: "0.9780 / 0.9889",
        mccScore: "0.9680",
        eceError: "0.0210",
        avgLatency: "12.40 ms",
        status: "CLINICAL CHAMPION",
        isQuantum: true,
        isChampion: true,
      },
      {
        name: "Sentinel-ResNet",
        architecture: "ResNet-50 Deep Backbone",
        type: "Classical ResNet",
        accuracy: "94.20%",
        aucRoc: "0.9680",
        sensitivity: "0.9600",
        specificity: "0.9100",
        sensSpec: "0.9600 / 0.9100",
        precision: "0.9520",
        f1Score: "0.9560",
        precF1: "0.9520 / 0.9560",
        mccScore: "0.8750",
        eceError: "0.0420",
        avgLatency: "18.60 ms",
        status: "VERIFIED CONTROL",
        isQuantum: false,
        isChampion: false,
      },
    ],
  },
  {
    id: "skin-cancer",
    index: "06",
    headingLine: "---> [Evaluating Skin Cancer Models] <---",
    headingTitle: "Evaluating Skin Cancer Models",
    category: "DERMATOLOGY // HAM10000",
    title: "HAM10000 Multi-Source Dermoscopy",
    sampleSize: "N = 10,015 Dermoscopy Images • 7 Diagnostic Classes",
    description: "Multi-class pigmented skin lesion screening evaluating 10-qubit vortex variational circuits against deep 121-layer dense convolutional networks.",
    bgColor: "#090807",
    cardBg: "#0F0D0B",
    borderColor: "#28211B",
    accentColor: "#FDE68A", // Soft muted chalk amber
    docLink: "https://github.com/ARYANCY/QDoc/blob/main/documentation/models/skin_cancer.md",
    models: [
      {
        name: "Q-Skin-Vortex",
        architecture: "10-Qubit Vortex VQC Head",
        type: "Quantum VQC",
        accuracy: "88.00%",
        aucRoc: "0.9450",
        sensitivity: "0.8920",
        specificity: "0.9140",
        sensSpec: "0.8920 / 0.9140",
        precision: "0.8850",
        f1Score: "0.8885",
        precF1: "0.8850 / 0.8885",
        mccScore: "0.8120",
        eceError: "0.0310",
        avgLatency: "22.50 ms",
        status: "CLINICAL CHAMPION",
        isQuantum: true,
        isChampion: true,
      },
      {
        name: "Sentinel-DenseNet",
        architecture: "DenseNet-121 Feature Stack",
        type: "Classical DenseNet",
        accuracy: "86.20%",
        aucRoc: "0.9120",
        sensitivity: "0.8600",
        specificity: "0.9100",
        sensSpec: "0.8600 / 0.9100",
        precision: "0.8710",
        f1Score: "0.8654",
        precF1: "0.8710 / 0.8654",
        mccScore: "0.7740",
        eceError: "0.0480",
        avgLatency: "45.00 ms",
        status: "VERIFIED CONTROL",
        isQuantum: false,
        isChampion: false,
      },
    ],
  },
];

export default function ModelEvaluationShowcase() {
  const containerRef = useRef(null);
  const [selectedModelDoc, setSelectedModelDoc] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // Masthead subtle scroll entrance
      gsap.from(".zara-masthead-title", {
        opacity: 0,
        y: 40,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".zara-masthead-title",
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
      });

      EVALUATION_SECTIONS.forEach((section) => {
        const sectionElem = document.getElementById(`section-${section.id}`);
        if (!sectionElem) return;

        // Elegant card reveal animation on scroll
        gsap.fromTo(
          sectionElem,
          { opacity: 0, y: 45 },
          {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionElem,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );

        // Sexy heading banner & arrow animation
        const headingBanner = sectionElem.querySelector(".sexy-heading-banner");
        const arrowLeft = sectionElem.querySelector(".sexy-arrow-left");
        const arrowRight = sectionElem.querySelector(".sexy-arrow-right");
        const headingTitle = sectionElem.querySelector(".sexy-heading-title");

        if (headingBanner) {
          gsap.fromTo(
            headingBanner,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power2.out",
              scrollTrigger: {
                trigger: sectionElem,
                start: "top 82%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }

        if (arrowLeft && arrowRight) {
          gsap.fromTo(
            arrowLeft,
            { x: -18, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.7,
              ease: "power2.out",
              scrollTrigger: {
                trigger: sectionElem,
                start: "top 80%",
                toggleActions: "play none none reverse",
              },
            }
          );
          gsap.fromTo(
            arrowRight,
            { x: 18, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.7,
              ease: "power2.out",
              scrollTrigger: {
                trigger: sectionElem,
                start: "top 80%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }

        if (headingTitle) {
          gsap.fromTo(
            headingTitle,
            { letterSpacing: "0.02em", opacity: 0.6 },
            {
              letterSpacing: "0.08em",
              opacity: 1,
              duration: 0.9,
              ease: "power2.out",
              scrollTrigger: {
                trigger: sectionElem,
                start: "top 80%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }

        // Table rows subtle staggered reveal
        const rows = sectionElem.querySelectorAll(".zara-table-row");
        if (rows.length > 0) {
          gsap.fromTo(
            rows,
            { opacity: 0, x: -12 },
            {
              opacity: 1,
              x: 0,
              duration: 0.6,
              stagger: 0.08,
              ease: "power1.out",
              scrollTrigger: {
                trigger: sectionElem,
                start: "top 75%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }

        // Ambient background color morph
        ScrollTrigger.create({
          trigger: sectionElem,
          start: "top 60%",
          end: "bottom 40%",
          onEnter: () => {
            gsap.to(containerRef.current, {
              backgroundColor: section.bgColor,
              duration: 1.2,
              ease: "power2.inOut",
            });
          },
          onEnterBack: () => {
            gsap.to(containerRef.current, {
              backgroundColor: section.bgColor,
              duration: 1.2,
              ease: "power2.inOut",
            });
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
        backgroundColor: "#080808",
        color: "#F4F4F4",
        padding: "clamp(60px, 8vw, 120px) clamp(20px, 4.5vw, 64px)",
        transition: "background-color 0.8s ease",
        position: "relative",
        boxSizing: "border-box",
        borderRadius: "0px", // Strict Zara style
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      {/* Subtle Top Architectural Hairline */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          backgroundColor: "rgba(255, 255, 255, 0.12)",
        }}
      />

      {/* Zara Magazine Masthead Header */}
      <div
        style={{
          width: "100%",
          margin: "0 auto 64px auto",
          borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
          paddingBottom: "40px",
          borderRadius: "0px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.72rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#888888",
            }}
          >
            VOL. 2026 // SCIENTIFIC AUDIT
          </span>

          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.72rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#888888",
            }}
          >
            5-SEED STRATIFIED VERIFICATION
          </span>
        </div>

        <h2
          className="zara-masthead-title"
          style={{
            fontSize: "clamp(2.4rem, 5.2vw, 4.8rem)",
            fontWeight: 400,
            letterSpacing: "-0.04em",
            lineHeight: 0.98,
            margin: "0 0 24px 0",
            color: "#FFFFFF",
            textTransform: "uppercase",
          }}
        >
          Quantum vs Classical. <br />
          <span style={{ color: "#777777", fontWeight: 300 }}>
            Model Evaluation Matrix.
          </span>
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "32px",
            alignItems: "start",
          }}
          className="zara-header-subgrid masthead-subgrid"
        >
          <p
            style={{
              fontSize: "0.96rem",
              color: "#A0A0A0",
              margin: 0,
              lineHeight: 1.65,
              maxWidth: "720px",
              fontWeight: 400,
            }}
          >
            Rigorous, mathematically validated comparison between PennyLane Variational Quantum Classifiers (VQC), Quantum Kernel QSVMs, and standard Classical Sentinel baselines. Fully reproducible with zero data leakage.
          </p>

          <div
            style={{
              borderLeft: "1px solid rgba(255, 255, 255, 0.15)",
              paddingLeft: "24px",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.70rem",
              color: "#777777",
              lineHeight: 1.8,
            }}
          >
            <div>PLATFORM: Q-RAKSHAK</div>
            <div>SPECIFICATION: v1.0 AUDITED</div>
            <div>FALLBACK PROTOCOL: ACTIVE</div>
          </div>
        </div>
      </div>

      {/* 4 Disease Sections - Full Desktop Size Monograph */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "56px",
        }}
      >
        {EVALUATION_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={`section-${section.id}`}
            className="disease-section-viewport"
            style={{
              minHeight: "calc(100vh - 40px)",
              width: "100%",
              backgroundColor: section.cardBg,
              border: `1px solid ${section.borderColor}`,
              borderLeft: `4px solid ${section.accentColor}`,
              borderRadius: "0px", // Zara sharp
              padding: "clamp(24px, 3.5vh, 56px) clamp(16px, 3.5vw, 56px)",
              position: "relative",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Section Heading Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "16px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                paddingBottom: "20px",
                marginBottom: "24px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "0.70rem",
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      color: section.accentColor,
                      textTransform: "uppercase",
                    }}
                  >
                    [{section.index}] {section.category}
                  </span>
                </div>

                {/* The Sexy Heading Line */}
                <div
                  className="sexy-heading-banner showcase-banner-heading"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${section.borderColor || "rgba(255, 255, 255, 0.15)"}`,
                    borderLeft: `3px solid ${section.accentColor}`,
                    padding: "10px 18px",
                    borderRadius: "0px",
                    margin: "0 0 10px 0",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    className="sexy-arrow-left"
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "1.05rem",
                      fontWeight: 800,
                      color: section.accentColor,
                      letterSpacing: "0.02em",
                      display: "inline-flex",
                      alignItems: "center",
                      userSelect: "none",
                    }}
                  >
                    ───►
                  </span>

                  <h3
                    className="sexy-heading-line"
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "clamp(1.02rem, 1.7vw, 1.3rem)",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "#FFFFFF",
                      textTransform: "uppercase",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ color: section.accentColor, opacity: 0.9 }}>[</span>
                    <span className="sexy-heading-title" style={{ color: "#FFFFFF" }}>
                      {section.headingTitle || section.headingLine.replace(/--->\s*\[(.*)\]\s*<---/, "$1")}
                    </span>
                    <span style={{ color: section.accentColor, opacity: 0.9 }}>]</span>
                  </h3>

                  <span
                    className="sexy-arrow-right"
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "1.05rem",
                      fontWeight: 800,
                      color: section.accentColor,
                      letterSpacing: "0.02em",
                      display: "inline-flex",
                      alignItems: "center",
                      userSelect: "none",
                    }}
                  >
                    ◄───
                  </span>
                </div>

                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "#888888",
                    margin: 0,
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {section.sampleSize}
                </p>
              </div>

              {/* Technical Documentation Anchor */}
              <a
                href={section.docLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "0px",
                  color: "#EEEEEE",
                  fontSize: "0.72rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  transition: "border-color 0.2s, color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#FFFFFF";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span>Full Specification</span>
                <ArrowUpRight size={13} />
              </a>
            </div>

            {/* Shortened, Simplified Zara Table - Full Desktop Size */}
            <div
              className="table-scroll-container editorial-table-scroll table-responsive"
              style={{
                width: "100%",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                borderRadius: "0px",
                margin: "auto 0",
              }}
            >
              <table
                className="zara-table-responsive"
                style={{
                  width: "100%",
                  minWidth: "720px",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "0.85rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#777777",
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "0.70rem",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                    }}
                  >
                    <th style={{ padding: "16px 16px 16px 0", fontWeight: 600, width: "24%" }}>Model / Architecture</th>
                    <th style={{ padding: "16px 14px", fontWeight: 600, textAlign: "right", width: "10%" }}>Accuracy</th>
                    <th style={{ padding: "16px 14px", fontWeight: 600, textAlign: "right", width: "9%" }}>AUC-ROC</th>
                    <th style={{ padding: "16px 14px", fontWeight: 600, textAlign: "right", width: "13%" }}>Sens / Spec</th>
                    <th style={{ padding: "16px 14px", fontWeight: 600, textAlign: "right", width: "13%" }}>Prec / F1</th>
                    <th style={{ padding: "16px 14px", fontWeight: 600, textAlign: "right", width: "9%" }}>MCC</th>
                    <th style={{ padding: "16px 14px", fontWeight: 600, textAlign: "right", width: "9%" }}>ECE Error</th>
                    <th style={{ padding: "16px 14px", fontWeight: 600, textAlign: "center", width: "11%" }}>Status</th>
                    <th style={{ padding: "16px 0 16px 14px", fontWeight: 600, textAlign: "right", width: "7%" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {section.models.map((model, mIdx) => (
                    <tr
                      key={model.name}
                      className="zara-table-row"
                      style={{
                        borderBottom: mIdx !== section.models.length - 1 ? "1px solid rgba(255, 255, 255, 0.06)" : "none",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Model & Architecture */}
                      <td style={{ padding: "18px 14px 18px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span
                            style={{
                              width: "24px",
                              height: "24px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              color: model.isQuantum ? "#C4B5FD" : "#A7F3D0",
                              fontSize: "0.68rem",
                              borderRadius: "0px",
                              flexShrink: 0,
                            }}
                          >
                            {model.isQuantum ? <Zap size={12} /> : <Cpu size={12} />}
                          </span>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <strong
                                style={{
                                  color: "#FFFFFF",
                                  fontSize: "0.92rem",
                                  fontWeight: 600,
                                  letterSpacing: "-0.01em",
                                }}
                              >
                                {model.name}
                              </strong>
                              <span
                                style={{
                                  fontSize: "0.64rem",
                                  color: "#777777",
                                  fontFamily: "var(--font-mono, monospace)",
                                }}
                              >
                                {model.avgLatency}
                              </span>
                            </div>
                            <span
                              style={{
                                color: "#888888",
                                fontSize: "0.74rem",
                                fontFamily: "var(--font-mono, monospace)",
                                display: "block",
                                marginTop: "2px",
                              }}
                            >
                              {model.architecture}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Accuracy */}
                      <td
                        style={{
                          padding: "18px 14px",
                          textAlign: "right",
                          fontFamily: "var(--font-mono, monospace)",
                          fontWeight: 700,
                          fontSize: "0.96rem",
                          color: model.isChampion ? "#FFFFFF" : "#D4D4D4",
                        }}
                      >
                        {model.accuracy}
                      </td>

                      {/* AUC-ROC */}
                      <td
                        style={{
                          padding: "18px 14px",
                          textAlign: "right",
                          fontFamily: "var(--font-mono, monospace)",
                          fontWeight: 600,
                          color: "#D4D4D4",
                          fontSize: "0.88rem",
                        }}
                      >
                        {model.aucRoc}
                      </td>

                      {/* Sensitivity / Specificity */}
                      <td
                        style={{
                          padding: "18px 14px",
                          textAlign: "right",
                          fontFamily: "var(--font-mono, monospace)",
                          color: "#AAAAAA",
                          fontSize: "0.80rem",
                        }}
                      >
                        {model.sensSpec}
                      </td>

                      {/* Precision / F1 */}
                      <td
                        style={{
                          padding: "18px 14px",
                          textAlign: "right",
                          fontFamily: "var(--font-mono, monospace)",
                          color: "#AAAAAA",
                          fontSize: "0.80rem",
                        }}
                      >
                        {model.precF1}
                      </td>

                      {/* MCC Score */}
                      <td
                        style={{
                          padding: "18px 14px",
                          textAlign: "right",
                          fontFamily: "var(--font-mono, monospace)",
                          color: "#999999",
                          fontSize: "0.80rem",
                        }}
                      >
                        {model.mccScore}
                      </td>

                      {/* ECE Error */}
                      <td
                        style={{
                          padding: "18px 14px",
                          textAlign: "right",
                          fontFamily: "var(--font-mono, monospace)",
                          color: "#AAAAAA",
                          fontSize: "0.80rem",
                        }}
                      >
                        {model.eceError}
                      </td>

                      {/* Status Tag */}
                      <td style={{ padding: "18px 14px", textAlign: "center" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono, monospace)",
                            fontSize: "0.64rem",
                            letterSpacing: "0.08em",
                            padding: "4px 9px",
                            border: `1px solid ${
                              model.isChampion
                                ? "rgba(255, 255, 255, 0.4)"
                                : "rgba(255, 255, 255, 0.12)"
                            }`,
                            backgroundColor: model.isChampion ? "rgba(255, 255, 255, 0.08)" : "transparent",
                            color: model.isChampion ? "#FFFFFF" : "#888888",
                            borderRadius: "0px",
                            textTransform: "uppercase",
                            display: "inline-block",
                          }}
                        >
                          {model.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: "18px 0 18px 14px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedModelDoc({
                              ...model,
                              diseaseTrack: section.title,
                              category: section.category,
                            })
                          }
                          style={{
                            background: "transparent",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "0px",
                            padding: "5px 12px",
                            color: "#FFFFFF",
                            fontFamily: "var(--font-mono, monospace)",
                            fontSize: "0.68rem",
                            letterSpacing: "0.08em",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#FFFFFF";
                            e.currentTarget.style.color = "#000000";
                            e.currentTarget.style.borderColor = "#FFFFFF";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#FFFFFF";
                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                          }}
                        >
                          DOCS ↗
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section Architectural Bottom Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                paddingTop: "16px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                fontSize: "0.70rem",
                fontFamily: "var(--font-mono, monospace)",
                color: "#777777",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <span>{section.description}</span>
              <span style={{ color: section.accentColor, opacity: 0.9 }}>
                5-SEED STRATIFIED HELD-OUT AUDIT // ZERO DATA LEAKAGE
              </span>
            </div>
          </section>
        ))}
      </div>

      {/* Model Documentation Drawer - Sharp Zero-Radius */}
      {selectedModelDoc && (
        <ModelDocModal
          modelData={selectedModelDoc}
          modelName={selectedModelDoc.name || selectedModelDoc}
          onClose={() => setSelectedModelDoc(null)}
        />
      )}
    </div>
  );
}
