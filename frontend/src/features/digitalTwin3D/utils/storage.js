/**
 * Serverless Client-Side Storage & Simulation Engine
 * Persists Digital Twins, simulation snapshots, and reports in localStorage.
 */

const STORAGE_KEYS = {
  TWINS: 'digital_twin_profiles',
  SIMULATIONS: 'digital_twin_simulations',
  REPORTS: 'digital_twin_reports'
};

export const StorageService = {
  // Save or update a digital twin
  saveTwin: (twinData) => {
    try {
      const twins = StorageService.getTwins();
      const id = twinData.id || `DT-${Date.now().toString(36).toUpperCase()}`;
      const record = { ...twinData, id, updatedAt: new Date().toISOString() };
      twins[id] = record;
      localStorage.setItem(STORAGE_KEYS.TWINS, JSON.stringify(twins));
      return record;
    } catch (e) {
      console.warn('Storage saveTwin failed:', e);
      return twinData;
    }
  },

  // Get all saved twins
  getTwins: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TWINS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },

  // Save a generated report
  saveReport: (reportData) => {
    try {
      const reports = StorageService.getReports();
      const id = reportData.id || `RPT-${Date.now().toString(36).toUpperCase()}`;
      const record = { ...reportData, id, createdAt: new Date().toISOString() };
      reports[id] = record;
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
      return record;
    } catch (e) {
      console.warn('Storage saveReport failed:', e);
      return reportData;
    }
  },

  // Get all saved reports
  getReports: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }
};
