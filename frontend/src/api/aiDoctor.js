/**
 * AI Doctor & Vapi Voice Consultation API Service
 */

import apiClient from "./client";
import { ENDPOINTS } from "./config";

export const aiDoctorApi = {
  /**
   * Fetch server-side Vapi configuration and supported voice personas
   */
  async getConfig() {
    try {
      return await apiClient.get(ENDPOINTS.AI_DOCTOR_CONFIG);
    } catch (err) {
      console.warn("Using local fallback config for AI Doctor:", err);
      return {
        status: "success",
        has_vapi_key: false,
        vapi_public_key: "",
        vapi_assistant_id: "",
        service_name: "Q-RAKSHAK Vapi Voice AI Engine",
        supported_voices: [
          { id: "sarah", name: "Dr. Sarah (Warm Clinical - Female)", provider: "11labs" },
          { id: "george", name: "Dr. George (Reassuring - Male)", provider: "11labs" },
          { id: "aura-asteria-en", name: "Dr. Asteria (Crisp Medical)", provider: "deepgram" },
          { id: "alloy", name: "Dr. Quantum (Neutral Specialist)", provider: "openai" },
        ],
      };
    }
  },

  /**
   * Fetch patient clinical dossier & system prompt tailored for AI Doctor
   */
  async getPatientContext(patientId) {
    if (!patientId) return null;
    return apiClient.get(ENDPOINTS.AI_DOCTOR_CONTEXT(patientId));
  },

  /**
   * Generate Vapi Assistant config with dynamically injected clinical history
   */
  async generateAssistantConfig({
    patientId,
    patientName,
    assistantName = "Dr. Quantum — AI Clinical Specialist",
    voiceProvider = "11labs",
    voiceId = "clara",
    modelName = "gpt-4o",
    temperature = 0.3,
  } = {}) {
    return apiClient.post(ENDPOINTS.AI_DOCTOR_ASSISTANT_CONFIG, {
      patient_id: patientId,
      patient_name: patientName,
      assistant_name: assistantName,
      voice_provider: voiceProvider,
      voice_id: voiceId,
      model_name: modelName,
      temperature,
    });
  },

  /**
   * Interactive text / fallback consultation chat query
   */
  async sendChatMessage({ patientId, patientName, message, history = [] }) {
    return apiClient.post(ENDPOINTS.AI_DOCTOR_CHAT, {
      patient_id: patientId,
      patient_name: patientName,
      message,
      history,
    });
  },
};

export default aiDoctorApi;
