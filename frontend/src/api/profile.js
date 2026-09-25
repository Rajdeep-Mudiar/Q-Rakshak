import apiClient from "./client";
import { ENDPOINTS } from "./config";

export const profileApi = {
  async getProfile(userId) {
    if (!userId) return null;
    return apiClient.get(ENDPOINTS.PROFILE(userId));
  },

  async updateProfile(userId, profileData = {}) {
    if (!userId) return null;
    return apiClient.put(ENDPOINTS.PROFILE(userId), profileData);
  },

  async deleteProfile(userId) {
    if (!userId) return null;
    return apiClient.delete(ENDPOINTS.PROFILE(userId));
  },
};
