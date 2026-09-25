/**
 * Platform Feature Intro Registry
 * Provides rich clinical, procedural, and factual context before entering active tools
 */

export const FEATURE_INTRO_REGISTRY = {
  doctor_consultation: {
    id: "doctor_consultation",
    targetTab: "doctor_booking",
    secondaryTab: "my_consultations",
    title: "Doctor Tele-Consultations & Clinical Triage",
    tagline: "Board-Certified Specialists • HIPAA & ABDM Verified Telemedicine",
    category: "Clinical Care",
    badge: "Tele-Medicine • Specialist Network",
    heroImage: "/images/features/doctor_consultation.jpg",
    accentColor: "#087F8C",
    accentBg: "rgba(8, 127, 140, 0.08)",
    primaryCta: "Find Specialists & Book Now",
    secondaryCta: "View My Appointments & Rx",

    stats: {
      stat1: { label: "Verified Specialists", value: "120+" },
      stat2: { label: "Avg Connection Time", value: "< 5 Mins" },
      stat3: { label: "Security Standard", value: "HIPAA / ABDM" },
      stat4: { label: "Patient Satisfaction", value: "99.2%" },
    },

    overview: {
      summary:
        "Connect directly with board-certified oncologists, cardiologists, pulmonologists, dermatologists, and neurologists through secure, low-latency tele-consultation rooms. Share your quantum diagnostic scans, review 3D physiological twins together, and receive cryptographically verified digital prescriptions and follow-up care pathways.",
      clinicalStandards:
        "All consultations operate over peer-to-peer encrypted WebRTC channels complying with ABDM (Ayushman Bharat Digital Mission) guidelines, HIPAA privacy standards, and DPDP Act 2023 regulations. Prescriptions are digitally signed with SHA-256 hash chains.",
    },

    benefits: [
      {
        title: "Immediate Specialist Access",
        desc: "Bypass months-long hospital queues. Connect with leading sub-specialists in minutes from anywhere in the world.",
        icon: "Clock",
      },
      {
        title: "Integrated Diagnostic Sharing",
        desc: "One-click sharing of your quantum AI health scans, biomarker timelines, and organ vitality metrics directly into the doctor's clinical console.",
        icon: "Share2",
      },
      {
        title: "Tamper-Proof e-Prescriptions",
        desc: "Receive digitally certified prescriptions recognized by pharmacies nationwide, complete with dosage instructions and diagnostic notes.",
        icon: "FileCheck",
      },
      {
        title: "Virtual Consultation Room",
        desc: "Includes interactive screen-sharing, collaborative medical scan annotation, and direct clinical note taking in real time.",
        icon: "Video",
      },
    ],

    howItWorks: [
      {
        step: "01",
        title: "Select Clinical Specialty",
        desc: "Filter doctors by specialty (Oncology, Cardiology, Pulmonology, Dermatology, Neurology), hospital affiliation, and consultation fees.",
      },
      {
        step: "02",
        title: "Reserve Consultation Slot",
        desc: "Choose an immediate emergency consult or schedule an upcoming appointment. Attach your latest Q-Rakshak diagnostic report.",
      },
      {
        step: "03",
        title: "Attend Virtual Session",
        desc: "Join the encrypted video room. Speak face-to-face with your physician while reviewing your 3D digital twin and lab records.",
      },
      {
        step: "04",
        title: "Receive Verified Rx & Plan",
        desc: "Download your cryptographically sealed prescription and personalized lifestyle, medication, or follow-up imaging regimen.",
      },
    ],
  },

  ai_doctor: {
    id: "ai_doctor",
    targetTab: "ai_doctor",
    title: "AI Doctor 1-on-1 Clinical Studio",
    tagline: "Conversational Multimodal Clinical Intelligence & Voice Triage",
    category: "AI Diagnostics",
    badge: "Artificial Intelligence • Voice & Vision",
    heroImage: "/images/features/ai_doctor.jpg",
    accentColor: "#6366F1",
    accentBg: "rgba(99, 102, 241, 0.08)",
    primaryCta: "Launch AI Doctor Studio",
    secondaryCta: "Inspect AI Safety Protocol",

    stats: {
      stat1: { label: "Availability", value: "24/7/365" },
      stat2: { label: "Response Latency", value: "< 250 ms" },
      stat3: { label: "Diagnostic Accord", value: "96.8%" },
      stat4: { label: "Languages", value: "14 Supported" },
    },

    overview: {
      summary:
        "Experience instantaneous, empathetic clinical triage with the Q-Rakshak AI Doctor Assistant. Powered by advanced medical foundation models and fine-tuned on peer-reviewed clinical pathways, the AI Doctor listens to your symptoms via speech or text, cross-references your quantum biomarker risk scores, and provides structured clinical guidance in plain English.",
      clinicalStandards:
        "The AI Doctor operates strictly under ethical clinical bounds as an assistive triage instrument. It adheres to WHO and ICMR clinical practice guidelines, automatically flags red-flag emergency symptoms, and facilitates 1-click handoffs to human physicians when urgent care is required.",
    },

    benefits: [
      {
        title: "Natural Voice & Text Dialogue",
        desc: "Converse freely in your native language. Speak your symptoms naturally or upload photos of rashes and lesions for instant visual triage.",
        icon: "Mic",
      },
      {
        title: "Quantum Risk Synthesis",
        desc: "Unlike standard chatbots, the AI Doctor cross-references your active quantum model outputs (e.g. OncoPulse-VQC or CardioWave) for hyper-personalized advice.",
        icon: "Cpu",
      },
      {
        title: "Red-Flag Emergency Detection",
        desc: "Immediately isolates acute life-threatening indicators (e.g. crushing chest pain, anaphylaxis, stroke signs) and directs emergency protocols.",
        icon: "AlertOctagon",
      },
      {
        title: "Zero Wait Time",
        desc: "Get answers to health concerns at 2 AM or during weekend travel without waiting for clinic opening hours.",
        icon: "Zap",
      },
    ],

    howItWorks: [
      {
        step: "01",
        title: "Describe Symptoms Naturally",
        desc: "Speak through your microphone or type your concerns. Share symptom onset, severity, and any associated pain or discomfort.",
      },
      {
        step: "02",
        title: "Multimodal Analysis",
        desc: "Upload medical photos or past test values. The AI processes visual indicators and clinical parameters simultaneously.",
      },
      {
        step: "03",
        title: "Differential Reasoning",
        desc: "The system generates probabilistic clinical considerations, cross-referenced with your historical health metrics and quantum scores.",
      },
      {
        step: "04",
        title: "Actionable Next Steps",
        desc: "Receive plain-English lifestyle recommendations, OTC guidance, or direct routing to book a board-certified specialist.",
      },
    ],
  },

  profile: {
    id: "profile",
    targetTab: "profile",
    title: "Profile, Identity & Cryptographic Security",
    tagline: "Zero-Trust Encryption, ABHA Health ID & Biometric Verification",
    category: "Security & Vault",
    badge: "Security • Identity & Credentials",
    heroImage: "/images/features/profile_security.jpg",
    accentColor: "#059669",
    accentBg: "rgba(5, 150, 105, 0.08)",
    primaryCta: "Open Profile & Security Settings",
    secondaryCta: "Manage Consent Directives",

    stats: {
      stat1: { label: "Encryption", value: "AES-256 GCM" },
      stat2: { label: "Hash Sealing", value: "SHA-256 WORM" },
      stat3: { label: "Compliance", value: "DPDP 2023" },
      stat4: { label: "ABDM Health ID", value: "Supported" },
    },

    overview: {
      summary:
        "Take complete ownership of your biological data and digital identity. Q-Rakshak utilizes zero-trust architecture where all personal health records, genetic markers, and biometric scans are encrypted at rest and in transit. Manage two-factor authentication, cryptographic passkeys, data sharing consents, and personalized assistive accessibility preferences.",
      clinicalStandards:
        "Complies fully with the Digital Personal Data Protection (DPDP) Act 2023 and Ayushman Bharat Digital Mission (ABDM). Features WORM (Write Once, Read Many) tamper-proof audit trails ensuring your medical record integrity cannot be compromised.",
    },

    benefits: [
      {
        title: "Zero-Knowledge Encryption",
        desc: "Your records are encrypted with your personal keys. Only you and your explicitly authorized clinicians can decrypt your data.",
        icon: "Lock",
      },
      {
        title: "ABHA Health ID Integration",
        desc: "Link your Ayushman Bharat Health Account to seamlessly pull historical records and port checkup summaries across any verified hospital.",
        icon: "QrCode",
      },
      {
        title: "Granular Consent Controls",
        desc: "Toggle exactly which doctors, researchers, or AI algorithms can access specific checkup modules with 1-click revoke capabilities.",
        icon: "Shield",
      },
      {
        title: "Assistive Accessibility",
        desc: "Customize dyslexia-friendly fonts, high-contrast visual themes, and reduced motion modes tailored to your ergonomic needs.",
        icon: "Eye",
      },
    ],

    howItWorks: [
      {
        step: "01",
        title: "Verify Identity & Role",
        desc: "Review authenticated clinical credentials, personal demographic records, and verified hospital affiliations.",
      },
      {
        step: "02",
        title: "Configure Security Keys",
        desc: "Enable Two-Factor Authentication (2FA), FIDO2 WebAuthn biometric security, or backup offline recovery passphrases.",
      },
      {
        step: "03",
        title: "Set Privacy Consents",
        desc: "Grant or revoke doctor access to specific organ records, biopsy imagery, or voice telemetry data at any moment.",
      },
      {
        step: "04",
        title: "Tune Visual Ergonomics",
        desc: "Customize display typography, high-contrast color palettes, and animation dynamics for optimal readability.",
      },
    ],
  },

  twin: {
    id: "twin",
    targetTab: "twin",
    title: "3D Physiological Digital Health Twin",
    tagline: "Organ-by-Organ Vitality Telemetry & Longitudinal Health Trajectory",
    category: "Physiological Twin",
    badge: "3D Avatar • Multi-Organ Telemetry",
    heroImage: "/images/features/digital_twin.jpg",
    accentColor: "#0284C7",
    accentBg: "rgba(2, 132, 199, 0.08)",
    primaryCta: "Launch 3D Digital Twin",
    secondaryCta: "View Organ Vitality Index",

    stats: {
      stat1: { label: "Organ Systems", value: "8 Mapped" },
      stat2: { label: "Timeline Window", value: "2020 - 2028" },
      stat3: { label: "3D Fidelity", value: "WebGL / Three.js" },
      stat4: { label: "Cellular Forecast", value: "18-24 Mo Ahead" },
    },

    overview: {
      summary:
        "Your 3D Digital Health Twin aggregates lab tests, imaging scans, and wearable biometric streams into a unified living physiological avatar. Orbit and inspect organs including the heart, lungs, brain, pancreas, and skin with color-coded vitality indicators, and scrub the chronological timeline to simulate past and future health trajectories.",
      clinicalStandards:
        "Synthesizes biomarker scores through validated anatomical meshes using Three.js and React Three Fiber. Dynamic lesion markers and organ involvement maps correlate directly with clinical oncology, cardiology, and pulmonology datasets.",
    },

    benefits: [
      {
        title: "Interactive Organ Inspection",
        desc: "Click on any organ in the 3D anatomical model to isolate its vital signs, cellular morphology, and risk projections.",
        icon: "Layers",
      },
      {
        title: "Longitudinal Timeline Scrubber",
        desc: "Drag the visit slider across past hospital checkups and projected future visits to visualize preventive intervention outcomes.",
        icon: "Calendar",
      },
      {
        title: "Early Cellular Shift Highlights",
        desc: "Visualizes subclinical biomarker drifts in vibrant green (optimal), amber (attention), or red (elevated) before symptoms arise.",
        icon: "Activity",
      },
      {
        title: "Doctor-Verified Guidance",
        desc: "Each organ panel provides actionable clinical lifestyle modifications and screening recommendations curated by specialists.",
        icon: "CheckCircle",
      },
    ],

    howItWorks: [
      {
        step: "01",
        title: "Load Patient Telemetry",
        desc: "Ingests recent laboratory test values, blood pressure records, and imaging results to calibrate organ vitality states.",
      },
      {
        step: "02",
        title: "Navigate 3D Model",
        desc: "Rotate, pan, and zoom into anatomical regions. Toggle vascular, muscular, and skeletal layers for deep clinical insight.",
      },
      {
        step: "03",
        title: "Examine Specific Organs",
        desc: "Select the heart, lungs, or pancreas to view detailed biomarker contribution charts and clinical stage classifications.",
      },
      {
        step: "04",
        title: "Simulate Interventions",
        desc: "Evaluate how targeted dietary changes, medication adherence, or smoking cessation reshape your multi-year health trajectory.",
      },
    ],
  },
};

export const FEATURE_ALIASES = {
  doctor_booking: "doctor_consultation",
  doctor: "doctor_consultation",
  consultation: "doctor_consultation",
  teleconsultation: "doctor_consultation",
  ai_doctor_studio: "ai_doctor",
  voice_doctor: "ai_doctor",
  digital_twin: "twin",
  "3d_twin": "twin",
  health_twin: "twin",
  profile_security: "profile",
  security: "profile",
  identity: "profile",
  feature_intro: "doctor_consultation",
};

export function getFeatureIntroById(id) {
  if (!id) return FEATURE_INTRO_REGISTRY.doctor_consultation;
  const normalized = String(id).toLowerCase().trim();
  const aliased = FEATURE_ALIASES[normalized];
  if (aliased && FEATURE_INTRO_REGISTRY[aliased]) {
    return FEATURE_INTRO_REGISTRY[aliased];
  }
  return FEATURE_INTRO_REGISTRY[normalized] || FEATURE_INTRO_REGISTRY.doctor_consultation;
}

export function getLocalizedFeatureIntroById(id, t) {
  const base = getFeatureIntroById(id);
  if (!base) return FEATURE_INTRO_REGISTRY.doctor_consultation;
  if (!t || typeof t !== "function") return base;

  const translationKey =
    base.id === "twin" ? "digital_twin" :
    base.id === "profile" ? "profile_security" :
    base.id;

  const localizedBenefits = t(`feature_intro.${translationKey}.benefits`);
  const localizedHowItWorks = t(`feature_intro.${translationKey}.howItWorks`);

  const mergedBenefits = (base.benefits || []).map((b, idx) => {
    const locB = Array.isArray(localizedBenefits) ? localizedBenefits[idx] : null;
    return {
      ...b,
      title: locB?.title || b.title,
      desc: locB?.desc || b.desc,
    };
  });

  const mergedHowItWorks = (base.howItWorks || []).map((h, idx) => {
    const locH = Array.isArray(localizedHowItWorks) ? localizedHowItWorks[idx] : null;
    return {
      ...h,
      title: locH?.title || h.title,
      desc: locH?.desc || h.desc,
    };
  });

  // Localized stats
  const localizedStats = {};
  if (base.stats) {
    Object.entries(base.stats).forEach(([k, st]) => {
      let locLabel = st.label;
      let locValue = st.value;
      if (st.label === "Verified Specialists") locLabel = t("feature_intro.stats.verified_specialists", st.label);
      else if (st.label === "Avg Connection Time") {
        locLabel = t("feature_intro.stats.avg_connection_time", st.label);
        locValue = t("feature_intro.stats.mins_unit", st.value);
      } else if (st.label === "Security Standard") locLabel = t("feature_intro.stats.security_standard", st.label);
      else if (st.label === "Patient Satisfaction") locLabel = t("feature_intro.stats.patient_satisfaction", st.label);
      else if (st.label === "Availability") {
        locLabel = t("feature_intro.stats.availability", st.label);
        locValue = t("feature_intro.stats.all_day", st.value);
      } else if (st.label === "Response Latency") {
        locLabel = t("feature_intro.stats.response_latency", st.label);
        locValue = t("feature_intro.stats.ms_unit", st.value);
      } else if (st.label === "Diagnostic Accord") locLabel = t("feature_intro.stats.diagnostic_accord", st.label);
      else if (st.label === "Languages") {
        locLabel = t("feature_intro.stats.languages", st.label);
        locValue = t("feature_intro.stats.supported_count", st.value);
      }
      localizedStats[k] = { label: locLabel, value: locValue };
    });
  }

  return {
    ...base,
    title: t(`features.${translationKey}.title`, t(`features.${base.id}.title`, base.title)),
    tagline: t(`features.${translationKey}.tagline`, t(`features.${base.id}.tagline`, base.tagline)),
    category: t(`features.${translationKey}.category`, t(`features.${base.id}.category`, base.category)),
    badge: t(`features.${translationKey}.badge`, t(`features.${base.id}.badge`, base.badge)),
    primaryCta: t(`features.${translationKey}.primaryCta`, t(`features.${base.id}.primaryCta`, base.primaryCta)),
    secondaryCta: t(`features.${translationKey}.secondaryCta`, t(`features.${base.id}.secondaryCta`, base.secondaryCta)),
    overview: {
      ...base.overview,
      summary: t(`features.${translationKey}.summary`, t(`features.${base.id}.summary`, base.overview?.summary)),
      clinicalStandards: t(`features.${translationKey}.clinicalStandards`, t(`features.${base.id}.clinicalStandards`, base.overview?.clinicalStandards)),
    },
    benefits: mergedBenefits,
    howItWorks: mergedHowItWorks,
    stats: Object.keys(localizedStats).length > 0 ? localizedStats : base.stats,
  };
}
