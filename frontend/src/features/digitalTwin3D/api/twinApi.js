/**
 * Digital Twin API Client
 * Connects to Q-RAKSHAK FastAPI backend via centralized apiClient and config
 */

import apiClient from "../../../api/client";
import { ENDPOINTS, API_BASE_URL } from "../../../api/config";
import { authApi } from "../../../api/auth";

function resolveTargetPatientId(patientId) {
  if (patientId && typeof patientId === "string" && patientId.trim()) return patientId.trim();
  const stored = authApi.getStoredUser();
  return stored?.patient_id || stored?.user_id || stored?.id || null;
}

/**
 * Fetch the 3D digital twin state for a specific patient from the DB.
 * Returns module_risks, organ_heatmap, timeline_visits, top_biomarkers.
 */
export async function fetchPatientTwinState(patientId) {
  const pid = resolveTargetPatientId(patientId);
  if (!pid) return null;
  return apiClient.get(ENDPOINTS.TWIN_STATE(pid));
}

/**
 * Fetch clinical records for a patient.
 */
export async function fetchClinicalPatient(patientId) {
  const pid = resolveTargetPatientId(patientId);
  if (!pid) return null;
  return apiClient.get(ENDPOINTS.CLINICAL_PATIENT(pid));
}

/**
 * Fetch all clinical reports for a patient.
 */
export async function fetchPatientReports(patientId) {
  const pid = resolveTargetPatientId(patientId);
  if (!pid) return [];
  try {
    return await apiClient.get(ENDPOINTS.REPORTS_LIST(pid));
  } catch (err) {
    console.warn("Could not fetch reports for patient:", err);
    return [];
  }
}

/**
 * Generate a clinical report via backend and get HTML + metadata back.
 */
export async function generateClinicalReport(payload) {
  return apiClient.post(ENDPOINTS.REPORTS_GENERATE, payload);
}

/**
 * Maps API module_risks (0.0-1.0 floats) to involvementMap (0-100 integers).
 * Auto-detects the primary disease from the highest risk module.
 */
export function mapRisksToInvolvement(moduleRisks = {}) {
  const cv   = Math.round((moduleRisks.cardiovascular   || 0) * 100);
  const pulm = Math.round((moduleRisks.pulmonary        || 0) * 100);
  const bc   = Math.round((moduleRisks.oncology_breast  || 0) * 100);
  const meta = Math.round((moduleRisks.metabolic        || 0) * 100);
  const skin = Math.round((moduleRisks.oncology_skin    || 0) * 100);

  const involvement = {};

  if (cv > 0) {
    involvement['HEART'] = cv;
    involvement['VASCULAR_SYSTEM'] = Math.round(cv * 0.7);
  }
  if (pulm > 0) {
    involvement['LUNG_LEFT']  = Math.round(pulm * 0.8);
    involvement['LUNG_RIGHT'] = pulm;
    involvement['BRONCHUS']   = Math.round(pulm * 0.5);
    involvement['TRACHEA']    = Math.round(pulm * 0.3);
  }
  if (bc > 0) {
    involvement['BREAST_LEFT']  = bc;
    involvement['BREAST_RIGHT'] = Math.round(bc * 0.3);
  }
  if (meta > 0) {
    involvement['PANCREAS']      = meta;
    involvement['KIDNEY_LEFT']   = Math.round(meta * 0.6);
    involvement['KIDNEY_RIGHT']  = Math.round(meta * 0.6);
    involvement['LIVER']         = Math.round(meta * 0.4);
  }
  if (skin > 0) {
    involvement['SKIN'] = skin;
  }

  return involvement;
}

/**
 * Auto-detects which disease key to set from module_risks.
 */
export function detectPrimaryDisease(moduleRisks = {}) {
  const mapping = [
    ['HEART_DISEASE', moduleRisks.cardiovascular || 0],
    ['PNEUMONIA',     moduleRisks.pulmonary       || 0],
    ['BREAST_CANCER', moduleRisks.oncology_breast || 0],
    ['DIABETES',      moduleRisks.metabolic       || 0],
    ['LIVER_DISEASE', (moduleRisks.metabolic || 0) * 0.5]
  ];
  mapping.sort((a, b) => b[1] - a[1]);
  return mapping[0][1] > 0.1 ? mapping[0][0] : null;
}
