import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Cpu,
  Zap,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Award,
} from "lucide-react";
import ModelDocModal from "./ModelDocModal.jsx";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const EVALUATION_SECTIONS = [
  {
    id: "breast-cancer",
    index: "01",
    headingTitle: "Evaluating Breast Cancer Models",
    category: "ONCOLOGY // WDBC COHORT",
    title: "Wisconsin Diagnostic Breast Cancer",
    sampleSize: "N = 569 FNA Biopsies • 30 Morphological Dimensions",
    description: "Standardized 5-seed patient-level stratified 3-way partition evaluating 8-qubit variational circuits against regularized classical kernel and tree ensembles.",
    accentColor: "#0284C7",
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
    headingTitle: "Evaluating Heart Disease Models",
    category: "CARDIOLOGY // CARDIO-WAVE",
    title: "Cleveland & Statlog Cardiac Cohort",
    sampleSize: "N = 303 Clinical Profiles • 13 Diagnostic Attributes",
    description: "Acute coronary risk classification comparing circular nearest-neighbor parameterized circuits with deep dense multi-layer networks and boosted gradient ensembles.",
    accentColor: "#0284C7",
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
    headingTitle: "Evaluating Parkinson's Models",
    category: "NEUROLOGY // NEURO-SYNAPSE",
    title: "Oxford Phonation Telemonitoring",
    sampleSize: "N = 195 Voice Recordings • 16 Acoustic Jitter/Shimmer Formants",
    description: "Continuous dysphonia assessment evaluating multi-qubit Pauli-Z expectation classifiers against regularized linear controls under class-imbalanced held-out test splits.",
    accentColor: "#0284C7",
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
    headingTitle: "Evaluating Diabetes Models",
    category: "METABOLIC // ENDOCRINE SUITE",
    title: "Pima Indians Diabetes Diagnostic",
    sampleSize: "N = 768 Patient Histories • 8 Physiological Indices",
    description: "Endocrine disorder prediction comparing train-normalized rotational variational circuits with calibrated ensemble decision trees on held-out test data.",
    accentColor: "#0284C7",
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
    headingTitle: "Evaluating Pneumonia Models",
    category: "PULMONOLOGY // CHEST X-RAY",
    title: "Guangzhou Pediatric Radiograph Cohort",
    sampleSize: "N = 5,863 Chest X-Rays • Visual Backbone + Quantum Head",
    description: "Pediatric respiratory consolidation diagnosis comparing hybrid visual quantum variational networks against 50-layer classical deep residual baselines.",
    accentColor: "#0284C7",
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
    headingTitle: "Evaluating Skin Cancer Models",
    category: "DERMATOLOGY // HAM10000",
    title: "HAM10000 Multi-Source Dermoscopy",
    sampleSize: "N = 10,015 Dermoscopy Images • 7 Diagnostic Classes",
    description: "Multi-class pigmented skin lesion screening evaluating 10-qubit vortex variational circuits against deep 121-layer dense convolutional networks.",
    accentColor: "#0284C7",
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
      gsap.from(".eval-masthead-title", {
        opacity: 0,
        y: 30,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".eval-masthead-title",
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
      });

      EVALUATION_SECTIONS.forEach((section) => {
        const sectionElem = document.getElementById(`section-${section.id}`);
        if (!sectionElem) return;

        gsap.fromTo(
          sectionElem,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionElem,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
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
        backgroundColor: "#F8FAFC",
        color: "#0F172A",
        padding: "clamp(60px, 8vw, 100px) clamp(20px, 4.5vw, 64px)",
        position: "relative",
        boxSizing: "border-box",
        fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        borderTop: "1px solid #E2E8F0",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto 48px auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#0284C7",
              backgroundColor: "#E0F2FE",
              border: "1px solid #BAE6FD",
              padding: "4px 12px",
              borderRadius: "9999px",
            }}
          >
            Scientific Audit Matrix
          </span>

          <span
            style={{
              fontSize: "0.8rem",
              color: "#64748B",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <ShieldCheck size={16} color="#059669" />
            5-Seed Patient Stratified Verification • Zero Leakage
          </span>
        </div>

        <h2
          className="eval-masthead-title"
          style={{
            fontSize: "clamp(1.8rem, 3.2vw, 2.8rem)",
            fontWeight: 800,
            letterSpacing: "-0.025em",
            lineHeight: 1.2,
            margin: "0 0 16px 0",
            color: "#0F172A",
          }}
        >
          Quantum vs Classical Benchmark Matrix
        </h2>

        <p
          style={{
            fontSize: "1rem",
            color: "#475569",
            margin: 0,
            lineHeight: 1.6,
            maxWidth: "800px",
          }}
        >
          Direct empirical performance comparison across all 6 clinical modalities. Evaluates PennyLane Variational Quantum Classifiers (VQC) and Quantum SVMs against classical gradient boosting and deep ensemble baselines.
        </p>
      </div>

      {/* 6 Disease Modality Sections */}
      <div
        style={{
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        {EVALUATION_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={`section-${section.id}`}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderLeft: `4px solid ${section.accentColor}`,
              borderRadius: "12px",
              padding: "clamp(20px, 3vh, 32px)",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
              boxSizing: "border-box",
            }}
          >
            {/* Section Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "16px",
                borderBottom: "1px solid #F1F5F9",
                paddingBottom: "16px",
                marginBottom: "20px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    color: section.accentColor,
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {section.index} • {section.category}
                </span>

                <h3
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#0F172A",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {section.headingTitle || section.title}
                </h3>

                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "#64748B",
                    margin: 0,
                  }}
                >
                  {section.title} — {section.sampleSize}
                </p>
              </div>

              <a
                href={section.docLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  background: "#F8FAFC",
                  border: "1px solid #CBD5E1",
                  borderRadius: "6px",
                  color: "#334155",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span>Full Specification</span>
                <ArrowUpRight size={13} />
              </a>
            </div>

            {/* Performance Benchmark Table */}
            <div
              style={{
                width: "100%",
                overflowX: "auto",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                marginBottom: "16px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "680px",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "0.85rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#F8FAFC",
                      borderBottom: "1px solid #E2E8F0",
                      color: "#475569",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                    }}
                  >
                    <th style={{ padding: "12px 16px", width: "32%" }}>Model / Architecture</th>
                    <th style={{ padding: "12px 14px", textAlign: "right", width: "12%" }}>Accuracy</th>
                    <th style={{ padding: "12px 14px", textAlign: "right", width: "11%" }}>AUC-ROC</th>
                    <th style={{ padding: "12px 14px", textAlign: "right", width: "12%" }}>Sensitivity</th>
                    <th style={{ padding: "12px 14px", textAlign: "right", width: "12%" }}>Specificity</th>
                    <th style={{ padding: "12px 14px", textAlign: "center", width: "12%" }}>Routing Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", width: "9%" }}>Specs</th>
                  </tr>
                </thead>
                <tbody>
                  {section.models.map((model, mIdx) => (
                    <tr
                      key={model.name}
                      style={{
                        borderBottom: mIdx !== section.models.length - 1 ? "1px solid #F1F5F9" : "none",
                        backgroundColor: model.isChampion ? "#F0FDF4" : "#FFFFFF",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            style={{
                              width: "28px",
                              height: "28px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: `1px solid ${model.isQuantum ? "#BAE6FD" : "#CBD5E1"}`,
                              backgroundColor: model.isQuantum ? "#F0F9FF" : "#F8FAFC",
                              color: model.isQuantum ? "#0284C7" : "#475569",
                              borderRadius: "6px",
                              flexShrink: 0,
                            }}
                          >
                            {model.isQuantum ? <Zap size={14} /> : <Cpu size={14} />}
                          </span>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <strong
                                style={{
                                  color: "#0F172A",
                                  fontSize: "0.88rem",
                                  fontWeight: 700,
                                }}
                              >
                                {model.name}
                              </strong>
                              {model.isChampion && (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px",
                                    fontSize: "0.65rem",
                                    fontWeight: 700,
                                    color: "#059669",
                                    backgroundColor: "#D1FAE5",
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  <Award size={10} /> Champion
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                color: "#64748B",
                                fontSize: "0.75rem",
                                display: "block",
                                marginTop: "2px",
                              }}
                            >
                              {model.architecture} • Latency {model.avgLatency}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          fontSize: "0.92rem",
                          color: model.isChampion ? "#059669" : "#0F172A",
                        }}
                      >
                        {model.accuracy}
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontWeight: 600,
                          color: "#334155",
                          fontSize: "0.86rem",
                        }}
                      >
                        {model.aucRoc}
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          color: "#334155",
                          fontSize: "0.86rem",
                        }}
                      >
                        {model.sensitivity ? (parseFloat(model.sensitivity) * 100).toFixed(1) + "%" : "-"}
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          color: "#334155",
                          fontSize: "0.86rem",
                        }}
                      >
                        {model.specificity ? (parseFloat(model.specificity) * 100).toFixed(1) + "%" : "-"}
                      </td>

                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            border: `1px solid ${
                              model.isChampion ? "#A7F3D0" : "#E2E8F0"
                            }`,
                            backgroundColor: model.isChampion ? "#ECFDF5" : "#F8FAFC",
                            color: model.isChampion ? "#047857" : "#64748B",
                            borderRadius: "9999px",
                            textTransform: "uppercase",
                            display: "inline-block",
                          }}
                        >
                          {model.status}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
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
                            background: "#F1F5F9",
                            border: "1px solid #CBD5E1",
                            borderRadius: "6px",
                            padding: "4px 10px",
                            color: "#334155",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#E2E8F0";
                            e.currentTarget.style.color = "#0F172A";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#F1F5F9";
                            e.currentTarget.style.color = "#334155";
                          }}
                        >
                          <span>Docs</span>
                          <ExternalLink size={10} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section Bottom Summary */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
                fontSize: "0.78rem",
                color: "#64748B",
              }}
            >
              <span>{section.description}</span>
              <span style={{ color: "#0284C7", fontWeight: 600 }}>
                Stratified 5-Seed Evaluation
              </span>
            </div>
          </section>
        ))}
      </div>

      {/* Model Documentation Drawer Modal */}
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
