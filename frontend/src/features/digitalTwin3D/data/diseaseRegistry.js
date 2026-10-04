export const DISEASE_REGISTRY = {
  BREAST_CANCER: {
    id: "BREAST_CANCER",
    name: "Breast Cancer",
    category: "Oncology",
    badgeColor: "from-pink-500 to-rose-600",
    description: "Mammary neoplasm visualization supporting bilateral involvement %, lesion coordinates, and anatomical quadrant mapping.",
    targetOrgans: ["BREAST_LEFT", "BREAST_RIGHT"],
    supportedSexes: ["female", "male"],
    supportedAgeGroups: ["<18", "18-40", "40-60", "60+"],
    visualizationModes: ["overlay", "lesion_marker", "quadrant_segmentation"],
    quadrants: [
      { id: "UO", label: "Upper Outer Quadrant" },
      { id: "UI", label: "Upper Inner Quadrant" },
      { id: "LO", label: "Lower Outer Quadrant" },
      { id: "LI", label: "Lower Inner Quadrant" },
      { id: "CENTRAL", label: "Central / Subareolar" }
    ],
    defaultInvolvement: {
      BREAST_LEFT: 75,
      BREAST_RIGHT: 0
    },
    defaultLesion: {
      enabled: true,
      x: 0.42,
      y: 1.5,
      z: 0.6,
      radius: 0.12
    },
    clinicalDisclaimer: "Configured visual simulation of mammary involvement. Does not represent histological grade, receptor status, or clinical staging."
  },

  HEART_DISEASE: {
    id: "HEART_DISEASE",
    name: "Heart Disease",
    category: "Cardiovascular",
    badgeColor: "from-red-500 to-rose-700",
    description: "Cardiomyopathy, ischemic, or structural stress visualization with rhythmic pulsatile emissive feedback.",
    targetOrgans: ["HEART"],
    supportedSexes: ["female", "male"],
    supportedAgeGroups: ["<18", "18-40", "40-60", "60+"],
    visualizationModes: ["overlay", "pulse_intensity", "regional_stress"],
    subregions: [
      { id: "LV", label: "Left Ventricle" },
      { id: "RV", label: "Right Ventricle" },
      { id: "ATRIA", label: "Atria" },
      { id: "MYO", label: "Myocardium" }
    ],
    defaultInvolvement: {
      HEART: 70
    },
    clinicalDisclaimer: "Visual intensity reflects user-configured simulation parameters; not a diagnostic measurement of ejection fraction or vessel stenosis."
  },

  DIABETES: {
    id: "DIABETES",
    name: "Diabetes (Systemic)",
    category: "Endocrine & Metabolic",
    badgeColor: "from-amber-500 to-orange-600",
    description: "Multi-organ metabolic disorder visualizing configured involvement across pancreatic endocrine, renal, vascular, and cardiac targets.",
    targetOrgans: ["PANCREAS", "KIDNEY_LEFT", "KIDNEY_RIGHT", "HEART", "VASCULAR_SYSTEM"],
    supportedSexes: ["female", "male"],
    supportedAgeGroups: ["<18", "18-40", "40-60", "60+"],
    visualizationModes: ["multi_organ_systemic", "overlay"],
    defaultInvolvement: {
      PANCREAS: 60,
      KIDNEY_LEFT: 30,
      KIDNEY_RIGHT: 30,
      HEART: 20,
      VASCULAR_SYSTEM: 45
    },
    clinicalDisclaimer: "Systemic multi-organ visualization model; not indicative of clinical glycemic control (HbA1c) or microvascular nephropathy stage."
  },

  PNEUMONIA: {
    id: "PNEUMONIA",
    name: "Pneumonia",
    category: "Pulmonary",
    badgeColor: "from-cyan-500 to-blue-600",
    description: "Bilateral or lobar pulmonary inflammatory consolidation simulation with multi-zone distribution controls.",
    targetOrgans: ["LUNG_LEFT", "LUNG_RIGHT"],
    supportedSexes: ["female", "male"],
    supportedAgeGroups: ["<18", "18-40", "40-60", "60+"],
    visualizationModes: ["overlay", "lobar_consolidation"],
    lungZones: [
      { id: "LUL", label: "Left Upper Lobe", organ: "LUNG_LEFT" },
      { id: "LLL", label: "Left Lower Lobe", organ: "LUNG_LEFT" },
      { id: "RUL", label: "Right Upper Lobe", organ: "LUNG_RIGHT" },
      { id: "RML", label: "Right Middle Lobe", organ: "LUNG_RIGHT" },
      { id: "RLL", label: "Right Lower Lobe", organ: "LUNG_RIGHT" }
    ],
    defaultInvolvement: {
      LUNG_LEFT: 20,
      LUNG_RIGHT: 65
    },
    clinicalDisclaimer: "Configured pulmonary visual simulation; not a radiological assessment of lung consolidation or pulmonary function."
  },

  LIVER_DISEASE: {
    id: "LIVER_DISEASE",
    name: "Liver Disease",
    category: "Hepatology",
    badgeColor: "from-yellow-600 to-amber-700",
    description: "Hepatic parenchymal disease simulation with configured involvement and anatomical lobe selection.",
    targetOrgans: ["LIVER"],
    supportedSexes: ["female", "male"],
    supportedAgeGroups: ["<18", "18-40", "40-60", "60+"],
    visualizationModes: ["overlay", "lobe_segmentation"],
    lobes: [
      { id: "RIGHT_LOBE", label: "Right Hepatic Lobe" },
      { id: "LEFT_LOBE", label: "Left Hepatic Lobe" },
      { id: "CAUDATE", label: "Caudate Lobe" },
      { id: "QUADRATE", label: "Quadrate Lobe" }
    ],
    defaultInvolvement: {
      LIVER: 55
    },
    clinicalDisclaimer: "Simulated hepatic parenchymal visualization; does not correlate with liver function tests (LFTs) or METAVIR fibrosis staging."
  },

  PARKINSONS: {
    id: "PARKINSONS",
    name: "Parkinson's Disease (Neurodegeneration)",
    category: "Neurology",
    badgeColor: "from-purple-500 to-indigo-700",
    description: "Dopaminergic neurodegeneration and basal ganglia motor circuitry assessment via phonation and neuromotor acoustic telemetry.",
    targetOrgans: ["BRAIN"],
    supportedSexes: ["female", "male"],
    supportedAgeGroups: ["<18", "18-40", "40-60", "60+"],
    visualizationModes: ["overlay"],
    defaultInvolvement: {
      BRAIN: 65
    },
    clinicalDisclaimer: "Neuromotor and basal ganglia visual telemetry based on clinical voice biomarkers; does not represent DaTscan radiotracer uptake."
  },

  SKIN_CANCER: {
    id: "SKIN_CANCER",
    name: "Dermatological Melanoma",
    category: "Dermatology & Oncology",
    badgeColor: "from-amber-600 to-rose-700",
    description: "Cutaneous melanocytic lesion and epidermal dermoscopy assessment with ABCD architectural lesion grading.",
    targetOrgans: ["SKIN"],
    supportedSexes: ["female", "male"],
    supportedAgeGroups: ["<18", "18-40", "40-60", "60+"],
    visualizationModes: ["overlay"],
    defaultInvolvement: {
      SKIN: 70
    },
    clinicalDisclaimer: "Dermatological skin surface visual telemetry; does not replace full-thickness excisional biopsy histology."
  }
};

export const DISEASE_TO_ORGAN = {
  breast_cancer: "BREAST_LEFT",
  heart: "HEART",
  diabetes: "PANCREAS",
  pneumonia: "LUNG_RIGHT",
  skin: "SKIN",
  parkinsons: "BRAIN",
  BREAST_CANCER: "BREAST_LEFT",
  HEART_DISEASE: "HEART",
  DIABETES: "PANCREAS",
  PNEUMONIA: "LUNG_RIGHT",
  LIVER_DISEASE: "LIVER",
  PARKINSONS: "BRAIN",
  SKIN_CANCER: "SKIN",
};

