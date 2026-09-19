import apiClient from "./client";
import { ENDPOINTS } from "./config";

export const authApi = {
  async login(username, password, role = "patient") {
    const data = await apiClient.post(ENDPOINTS.AUTH_LOGIN, { username, password, role });
    if (data.access_token) {
      localStorage.setItem("qmed_token", data.access_token);
      localStorage.setItem("qmed_user", JSON.stringify(data.user));
    }
    return data;
  },

  async register(registrationData) {
    const data = await apiClient.post(ENDPOINTS.AUTH_REGISTER, registrationData);
    if (data.access_token) {
      localStorage.setItem("qmed_token", data.access_token);
      localStorage.setItem("qmed_user", JSON.stringify(data.user));
    }
    return data;
  },

  async loginWithGoogleToken(token) {
    if (!token) return null;
    localStorage.setItem("qmed_token", token);
    try {
      const me = await this.getCurrentUser();
      if (me && me.user) {
        localStorage.setItem("qmed_user", JSON.stringify(me.user));
        return me.user;
      }
    } catch (err) {
      console.warn("Failed to fetch user profile with Google token:", err);
    }
    return null;
  },

  async getCurrentUser() {
    return apiClient.get(ENDPOINTS.AUTH_ME);
  },

  getToken() {
    return localStorage.getItem("qmed_token");
  },

  hasToken() {
    return Boolean(localStorage.getItem("qmed_token"));
  },

  isAuthenticated() {
    return Boolean(this.getToken() && this.getStoredUser());
  },

  clearSession() {
    localStorage.removeItem("qmed_token");
    localStorage.removeItem("qmed_user");
  },

  logout() {
    this.clearSession();
  },

  getStoredUser() {
    try {
      const u = localStorage.getItem("qmed_user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  async validateSession() {
    const token = this.getToken();
    const storedUser = this.getStoredUser();
    if (!token || !storedUser) {
      this.clearSession();
      return null;
    }
    try {
      const me = await this.getCurrentUser();
      if (me && me.user) {
        localStorage.setItem("qmed_user", JSON.stringify(me.user));
        return me.user;
      }
      return storedUser;
    } catch (err) {
      if (err.status === 401) {
        this.clearSession();
        return null;
      }
      // On offline / cold start network glitch, keep stored user so patient is not logged out prematurely
      return storedUser;
    }
  },
};
