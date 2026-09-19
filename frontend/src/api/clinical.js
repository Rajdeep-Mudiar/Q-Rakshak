import apiClient from "./client";
import { ENDPOINTS } from "./config";

export const clinicalApi = {
  async runDiagnosis(disease = "breast_cancer", patientId = "USR-5EF52B", features = null) {
    return apiClient.post(ENDPOINTS.CLINICAL_DIAGNOSE, { disease, patient_id: patientId, features });
  },

  async diagnoseImage(file, disease = "breast_cancer", patientId = "USR-5EF52B") {
    const body = new FormData();
    body.append("image", file);
    body.append("disease", disease);
    body.append("patient_id", patientId);
    return apiClient.post(ENDPOINTS.CLINICAL_DIAGNOSE_IMAGE, body);
  },

  async getPatientRecord(patientId = "USR-5EF52B") {
    return apiClient.get(ENDPOINTS.CLINICAL_PATIENT(patientId));
  },

  async updatePatientRecord(patientId = "USR-5EF52B", patientData = {}) {
    return apiClient.put(ENDPOINTS.CLINICAL_PATIENT(patientId), patientData);
  },

  async getDiseaseFeatures(disease = "breast_cancer", patientId = "USR-5EF52B") {
    return apiClient.get(ENDPOINTS.CLINICAL_FEATURES(patientId, disease));
  },

  async getPatientTimeline(patientId = "USR-5EF52B", timeFilter = "30 Days", startDate = null, endDate = null, disease = null) {
    const params = new URLSearchParams();
    if (timeFilter) params.append("time_filter", timeFilter);
    if (disease && disease !== "all" && disease !== "All Diseases") params.append("disease", disease);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get(`${ENDPOINTS.CLINICAL_TIMELINE(patientId)}${query}`);
  },

  async saveDiagnosticRecord(record) {
    return apiClient.post(ENDPOINTS.CLINICAL_RECORD, record);
  },

  async predictPneumonia(file, patientId = "USR-5EF52B") {
    const body = new FormData();
    body.append("image", file);
    body.append("patient_id", patientId);
    return apiClient.post(ENDPOINTS.PNEUMONIA_PREDICT, body);
  },

  async predictSkinCancer(file, model = "QuantumDerma", patientId = "USR-5EF52B") {
    const body = new FormData();
    body.append("image", file);
    body.append("model", model);
    body.append("patient_id", patientId);
    return apiClient.post(ENDPOINTS.SKIN_CANCER_PREDICT, body);
  },
};

