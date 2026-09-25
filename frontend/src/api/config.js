// frontend/src/api/config.js
// Centralized API configuration and route catalog for Q-RAKSHAK

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "/api/v1";
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export const API_KEY = import.meta.env.VITE_API_KEY || "";
export const EMERGENCY_PORTAL_BASE =
  import.meta.env.VITE_EMERGENCY_PORTAL_BASE || "https://q-rakshak.vercel.app/#triage";

/**
 * Returns a globally accessible URL for physical QR codes and emergency cards.
 * When running locally on `localhost` or `127.0.0.1`, defaults to the live deployed
 * cloud production domain (https://q-rakshak.vercel.app) so mobile devices scanning the QR
 * code can reach the emergency passport without localhost connection refused errors.
 */
export function getEmergencyPortalUrl(patientId) {
  const pid = String(patientId || "USR-ARYAN").trim();
  const envBase = import.meta.env.VITE_EMERGENCY_PORTAL_BASE || import.meta.env.VITE_APP_URL;
  if (envBase) {
    const clean = envBase.replace(/\/+$/, "");
    return clean.includes("#triage") ? `${clean}/${pid}` : `${clean}/#triage/${pid}`;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1" && host !== "0.0.0.0") {
      return `${window.location.origin}/#triage/${pid}`;
    }
  }
  return `https://q-rakshak.vercel.app/#triage/${pid}`;
}

// On free-tier platforms like Render, cold starts can take 40-90+ seconds.
// Set default timeout to 0 (no abort timer) unless explicitly configured via environment variable.
export const API_TIMEOUT_MS = import.meta.env.VITE_API_TIMEOUT_MS !== undefined
  ? Number(import.meta.env.VITE_API_TIMEOUT_MS)
  : 0; // 0 = no timeout timer

export function getWebSocketUrl(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (API_BASE_URL.startsWith("http://")) {
    return API_BASE_URL.replace("http://", "ws://") + cleanPath;
  }
  if (API_BASE_URL.startsWith("https://")) {
    return API_BASE_URL.replace("https://", "wss://") + cleanPath;
  }
  // Relative path fallback (reads window.location)
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}${API_BASE_URL}${cleanPath}`;
  }
  return `ws://localhost:8000${API_BASE_URL}${cleanPath}`;
}

export const ENDPOINTS = {
  // Auth
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  AUTH_REGISTER: `${API_BASE_URL}/auth/register`,
  AUTH_ME: `${API_BASE_URL}/auth/me`,
  AUTH_GOOGLE: `${API_BASE_URL}/auth/google`,
  AUTH_GOOGLE_VERIFY: `${API_BASE_URL}/auth/google/verify`,

  // Clinical & Diagnosis
  CLINICAL_DIAGNOSE: `${API_BASE_URL}/clinical/diagnose`,
  CLINICAL_DIAGNOSE_IMAGE: `${API_BASE_URL}/clinical/diagnose-image`,
  CLINICAL_RECORD: `${API_BASE_URL}/clinical/record`,
  CLINICAL_TIMELINE: (patientId) => `${API_BASE_URL}/clinical/timeline/${encodeURIComponent(patientId || "")}`,
  CLINICAL_PATIENT: (patientId) => `${API_BASE_URL}/clinical/patient/${encodeURIComponent(patientId || "")}`,
  CLINICAL_FEATURES: (patientId, disease = "breast_cancer") =>
    `${API_BASE_URL}/clinical/patient/${encodeURIComponent(patientId || "")}/features/${encodeURIComponent(disease)}`,
  CLINICAL_STATUS: `${API_BASE_URL}/clinical/status`,

  // Vision & Disease Models
  PNEUMONIA_PREDICT: `${API_BASE_URL}/pneumonia/predict`,
  PNEUMONIA_HEALTH: `${API_BASE_URL}/pneumonia/health`,
  SKIN_CANCER_PREDICT: `${API_BASE_URL}/skin-cancer/predict`,
  SKIN_CANCER_HISTORY: `${API_BASE_URL}/skin-cancer/history`,
  SKIN_CANCER_HEALTH: `${API_BASE_URL}/skin-cancer/health`,

  // Digital Twin & Early Detection
  TWIN_STATE: (patientId, visitIndex = -1, view = "all") =>
    `${API_BASE_URL}/digital-twin/state/${encodeURIComponent(patientId || "")}?visit_index=${visitIndex}&view=${encodeURIComponent(view)}`,
  EARLY_DETECTION_PATHWAY: (diseaseKey = "breast_cancer") =>
    `${API_BASE_URL}/early-detection/pathway/${encodeURIComponent(diseaseKey)}`,
  EARLY_DETECTION_INGEST_FHIR: `${API_BASE_URL}/early-detection/ingest-fhir`,
  EARLY_DETECTION_INGEST_VCF: `${API_BASE_URL}/early-detection/ingest-vcf`,

  // Emergency & QR
  EMERGENCY_PATIENT: (patientId) => `${API_BASE_URL}/emergency/${encodeURIComponent(patientId)}`,
  EMERGENCY_CARD: (patientId) => `${API_BASE_URL}/emergency/${encodeURIComponent(patientId)}/card-data`,
  EMERGENCY_QR_PNG: (patientId) => `${API_BASE_URL}/emergency/${encodeURIComponent(patientId)}/qr.png`,
  EMERGENCY_QR_SVG: (patientId) => `${API_BASE_URL}/emergency/${encodeURIComponent(patientId)}/qr.svg`,

  // Consultations & WebRTC
  CONSULTATIONS_DOCTORS: (specialty = null, status = "verified") => {
    let url = `${API_BASE_URL}/consultations/doctors?status=${encodeURIComponent(status)}`;
    if (specialty && specialty !== "all") {
      url += `&specialty=${encodeURIComponent(specialty)}`;
    }
    return url;
  },
  CONSULTATIONS_DOCTOR_PROFILE: (doctorId) => `${API_BASE_URL}/consultations/doctors/${encodeURIComponent(doctorId)}`,
  CONSULTATIONS_SLOTS_HOLD: `${API_BASE_URL}/consultations/slots/hold`,
  CONSULTATIONS_TRIAGE: `${API_BASE_URL}/consultations/triage-check`,
  CONSULTATIONS_BOOK: `${API_BASE_URL}/consultations/book`,
  CONSULTATIONS_BOOKINGS: (patientId = null, doctorId = null) => {
    let url = `${API_BASE_URL}/consultations/bookings`;
    const params = [];
    if (patientId) params.push(`patient_id=${encodeURIComponent(patientId)}`);
    if (doctorId) params.push(`doctor_id=${encodeURIComponent(doctorId)}`);
    if (params.length > 0) url += "?" + params.join("&");
    return url;
  },
  CONSULTATIONS_BOOKING_DETAILS: (bookingId) => `${API_BASE_URL}/consultations/bookings/${encodeURIComponent(bookingId)}`,
  CONSULTATIONS_BOOKING_TRANSITION: (bookingId) => `${API_BASE_URL}/consultations/bookings/${encodeURIComponent(bookingId)}/transition`,
  CONSULTATIONS_ROOM: (bookingId) => `${API_BASE_URL}/consultations/rooms/${encodeURIComponent(bookingId)}`,
  CONSULTATIONS_ROOM_ADMIT: (bookingId) => `${API_BASE_URL}/consultations/rooms/${encodeURIComponent(bookingId)}/admit`,
  CONSULTATIONS_ROOM_CHAT: (bookingId) => `${API_BASE_URL}/consultations/rooms/${encodeURIComponent(bookingId)}/chat`,
  CONSULTATIONS_WS_ROOM: (bookingId) => getWebSocketUrl(`/consultations/ws/${encodeURIComponent(bookingId)}`),
  CONSULTATIONS_ROOM_SIGNALS: (bookingId, afterId = 0, role = null) => {
    let url = `${API_BASE_URL}/consultations/rooms/${encodeURIComponent(bookingId)}/signals?after_id=${afterId}`;
    if (role) url += `&role=${encodeURIComponent(role)}`;
    return url;
  },
  CONSULTATIONS_ROOM_PUBLISH_SIGNAL: (bookingId) => `${API_BASE_URL}/consultations/rooms/${encodeURIComponent(bookingId)}/signals`,
  CONSULTATIONS_DRUG_INTERACTIONS: `${API_BASE_URL}/consultations/prescriptions/check-interactions`,
  CONSULTATIONS_PHARMA_CATALOG: `${API_BASE_URL}/consultations/pharma/catalog`,
  CONSULTATIONS_PHARMA_ANALYZE: `${API_BASE_URL}/consultations/pharma/analyze`,
  CONSULTATIONS_PRESCRIPTIONS: (patientId = null, doctorId = null) => {
    let url = `${API_BASE_URL}/consultations/prescriptions`;
    const params = [];
    if (patientId) params.push(`patient_id=${encodeURIComponent(patientId)}`);
    if (doctorId) params.push(`doctor_id=${encodeURIComponent(doctorId)}`);
    if (params.length > 0) url += "?" + params.join("&");
    return url;
  },
  CONSULTATIONS_PRESCRIPTION_CREATE: `${API_BASE_URL}/consultations/prescriptions`,
  CONSULTATIONS_PRESCRIPTION_DETAILS: (prescriptionId) =>
    `${API_BASE_URL}/consultations/prescriptions/${encodeURIComponent(prescriptionId)}`,

  // Admin & Compliance
  ADMIN_USERS: `${API_BASE_URL}/admin/users`,
  ADMIN_USER_DETAIL: (userId) => `${API_BASE_URL}/admin/users/${encodeURIComponent(userId)}`,
  ADMIN_DOCTOR_QUEUE: `${API_BASE_URL}/admin/doctor-verification-queue`,
  ADMIN_DOCTOR_VERIFY: (doctorId) => `${API_BASE_URL}/admin/doctor-verification/${encodeURIComponent(doctorId)}/verify`,
  COMPLIANCE_AUDIT: `${API_BASE_URL}/compliance/audit-logs`,
  COMPLIANCE_REGISTRY: `${API_BASE_URL}/compliance/model-registry`,
  COMPLIANCE_CONSENT: `${API_BASE_URL}/compliance/consent`,

  // Telemetry, Benchmarks & Researcher
  QUANTUM_CIRCUIT: (modelName) => `${API_BASE_URL}/quantum-telemetry/circuit/${encodeURIComponent(modelName)}`,
  BENCHMARKS_MATRIX: (disease) => `${API_BASE_URL}/benchmarks/matrix?disease=${encodeURIComponent(disease)}`,
  RESEARCHER_TRAIN: `${API_BASE_URL}/researcher/train`,
  REPORTS_GENERATE: `${API_BASE_URL}/reports/generate`,
  REPORTS_LIST: (patientId = null) => {
    if (patientId) return `${API_BASE_URL}/reports/patient/${encodeURIComponent(patientId)}`;
    return `${API_BASE_URL}/reports`;
  },
  NOTIFICATIONS: (limit = 20) => `${API_BASE_URL}/notifications?limit=${limit}`,
  NOTIFICATIONS_READ: (notificationId) => `${API_BASE_URL}/notifications/${encodeURIComponent(notificationId)}/read`,
  NOTIFICATIONS_SEND_ALERT: `${API_BASE_URL}/notifications/send-alert`,

  // Profile & Graphs
  PROFILE: (userId) => `${API_BASE_URL}/profile/${encodeURIComponent(userId || "")}`,
  GRAPHS: `${API_BASE_URL}/graphs`,
  GRAPHS_FILE: (disease, filename) => `${API_BASE_URL}/graphs/${encodeURIComponent(disease)}/${encodeURIComponent(filename)}`,

  // AI Doctor & Voice Consultation (Vapi)
  AI_DOCTOR_CONFIG: `${API_BASE_URL}/ai-doctor/config`,
  AI_DOCTOR_CONTEXT: (patientId) => `${API_BASE_URL}/ai-doctor/context/${encodeURIComponent(patientId || "")}`,
  AI_DOCTOR_ASSISTANT_CONFIG: `${API_BASE_URL}/ai-doctor/assistant-config`,
  AI_DOCTOR_CHAT: `${API_BASE_URL}/ai-doctor/chat`,
};
