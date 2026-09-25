import apiClient from "./client";
import { ENDPOINTS } from "./config";

export const twinApi = {
  async getTwinState(patientId, visitIndex = -1, view = "all") {
    if (!patientId) return null;
    return apiClient.get(ENDPOINTS.TWIN_STATE(patientId, visitIndex, view));
  },
};
