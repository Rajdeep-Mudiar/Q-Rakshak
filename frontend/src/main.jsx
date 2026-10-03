import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import UnifiedAnalysisPage from "./features/analysis/UnifiedAnalysisPage.jsx";
import EmergencyCardView from "./features/clinical/EmergencyCardView.jsx";
import NotFoundPage from "./components/common/NotFoundPage.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import "./styles.css";

function AppRouter() {
  const [route, setRoute] = useState(getRouteInfo());

  function getRouteInfo() {
    const hash = window.location.hash || "";
    const path = window.location.pathname || "";
    const search = new URLSearchParams(window.location.search || "");

    function sanitizeId(raw) {
      if (!raw) return null;
      const clean = decodeURIComponent(raw).split("?")[0].split("#")[0].replace(/\/+$/, "").trim();
      return clean || null;
    }

    // Extract potential query parameters embedded inside the hash
    const hashQueryString = hash.includes("?") ? hash.substring(hash.indexOf("?") + 1) : "";
    const hashParams = new URLSearchParams(hashQueryString);

    function extractPatientId(parts) {
      if (parts.length > 1 && parts[1]) return parts[1];
      const fromHash = hashParams.get("patient") || hashParams.get("id") || hashParams.get("patient_id");
      if (fromHash) return fromHash;
      const fromSearch = search.get("patient") || search.get("id") || search.get("patient_id");
      if (fromSearch) return fromSearch;
      try {
        return localStorage.getItem("qmed_selected_patient");
      } catch (_) {
        return null;
      }
    }

    // 1. Hash-based triage and emergency routes (e.g. #triage, #triage/PT-89421, #triage?patient=PT-89421)
    const cleanHash = hash.replace(/^#\/?/, "");
    if (cleanHash === "triage" || cleanHash.startsWith("triage/") || cleanHash.startsWith("triage?")) {
      const parts = cleanHash.split("?")[0].split("/").filter(Boolean);
      return { isEmergency: true, patientId: sanitizeId(extractPatientId(parts)) };
    }
    if (cleanHash === "emergency" || cleanHash.startsWith("emergency/") || cleanHash.startsWith("emergency?")) {
      const parts = cleanHash.split("?")[0].split("/").filter(Boolean);
      return { isEmergency: true, patientId: sanitizeId(extractPatientId(parts)) };
    }

    // 2. Path-based triage and emergency routes (e.g. /triage/PT-89421, /emergency)
    if (path.startsWith("/triage/") || path === "/triage") {
      const parts = path.split("/").filter(Boolean);
      return { isEmergency: true, patientId: sanitizeId(extractPatientId(parts)) };
    }
    if (path.startsWith("/emergency/") || path === "/emergency") {
      const parts = path.split("/").filter(Boolean);
      return { isEmergency: true, patientId: sanitizeId(extractPatientId(parts)) };
    }

    // 3. Query-parameter based triage routing (e.g. ?tab=emergency&patient=USR-ALEX)
    const tabParam = (search.get("tab") || "").toLowerCase();
    if (tabParam === "triage" || tabParam === "emergency") {
      const pid = search.get("patient") || search.get("id") || search.get("patient_id");
      return { isEmergency: true, patientId: sanitizeId(pid) };
    }
    if (search.get("triage")) {
      return { isEmergency: true, patientId: sanitizeId(search.get("triage")) };
    }
    if (search.get("emergency")) {
      return { isEmergency: true, patientId: sanitizeId(search.get("emergency")) };
    }

    return { isEmergency: false, patientId: null, isNotFound: !["/", "/index.html"].includes(path) };
  }

  useEffect(() => {
    function handleNavigation() {
      setRoute(getRouteInfo());
    }
    window.addEventListener("hashchange", handleNavigation);
    window.addEventListener("popstate", handleNavigation);
    return () => {
      window.removeEventListener("hashchange", handleNavigation);
      window.removeEventListener("popstate", handleNavigation);
    };
  }, []);

  if (route.isEmergency) {
    return <EmergencyCardView patientId={route.patientId} />;
  }

  if (route.isNotFound) return <NotFoundPage />;

  return <UnifiedAnalysisPage />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <AppRouter />
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
