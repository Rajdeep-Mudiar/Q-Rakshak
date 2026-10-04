import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import UnifiedAnalysisPage from "./features/analysis/UnifiedAnalysisPage.jsx";
import EmergencyCardView from "./features/clinical/EmergencyCardView.jsx";
import NotFoundPage from "./components/common/NotFoundPage.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import ConnectivityBanner from "./components/common/ConnectivityBanner.jsx";
import ModelEvaluationShowcase from "./features/auth/components/ModelEvaluationShowcase.jsx";
import EditorialFooter from "./components/common/EditorialFooter.jsx";
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

    const cleanHash = hash.replace(/^#\/?/, "");
    const normalizedHash = cleanHash.toLowerCase().split("?")[0].replace(/\/+$/, "");

    // 0. Model Accuracy Classical vs Quantum AI Link Route (#CLASSICALvsQUANTUMN, #CLASSICALvsQUANTUM, #classical-vs-quantum)
    if (
      normalizedHash === "classicalvsquantumn" ||
      normalizedHash === "classicalvsquantum" ||
      normalizedHash === "classical-vs-quantum" ||
      normalizedHash === "classical_vs_quantum" ||
      normalizedHash === "quantum-model-benchmarks"
    ) {
      return { isBenchmarks: true, isEmergency: false, patientId: null };
    }

    // 1. Hash-based triage and emergency routes (e.g. #triage, #triage/PT-89421, #triage?patient=PT-89421)
    if (cleanHash === "triage" || cleanHash.startsWith("triage/") || cleanHash.startsWith("triage?")) {
      const parts = cleanHash.split("?")[0].split("/").filter(Boolean);
      return { isEmergency: true, patientId: sanitizeId(extractPatientId(parts)) };
    }
    if (cleanHash === "emergency" || cleanHash.startsWith("emergency/") || cleanHash.startsWith("emergency?")) {
      const parts = cleanHash.split("?")[0].split("/").filter(Boolean);
      return { isEmergency: true, patientId: sanitizeId(extractPatientId(parts)) };
    }

    // 2. Path-based triage, emergency, and benchmark routes (e.g. /triage/PT-89421, /emergency, /CLASSICALvsQUANTUMN)
    const cleanPath = path.toLowerCase().replace(/^\/+/, "").replace(/\/+$/, "");
    if (
      cleanPath === "classicalvsquantumn" ||
      cleanPath === "classicalvsquantum" ||
      cleanPath === "benchmarks"
    ) {
      return { isBenchmarks: true, isEmergency: false, patientId: null };
    }
    if (path.startsWith("/triage/") || path === "/triage") {
      const parts = path.split("/").filter(Boolean);
      return { isEmergency: true, patientId: sanitizeId(extractPatientId(parts)) };
    }
    if (path.startsWith("/emergency/") || path === "/emergency") {
      const parts = path.split("/").filter(Boolean);
      return { isEmergency: true, patientId: sanitizeId(extractPatientId(parts)) };
    }

    // 3. Query-parameter based triage and benchmark routing (e.g. ?tab=emergency, ?route=CLASSICALvsQUANTUMN)
    const tabParam = (search.get("tab") || "").toLowerCase();
    if (
      tabParam === "classicalvsquantumn" ||
      tabParam === "classicalvsquantum" ||
      tabParam === "benchmarks" ||
      search.get("CLASSICALvsQUANTUMN") !== null ||
      search.get("classicalvsquantumn") !== null
    ) {
      return { isBenchmarks: true, isEmergency: false, patientId: null };
    }
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

    return { isEmergency: false, isBenchmarks: false, patientId: null, isNotFound: !["/", "/index.html"].includes(path) };
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

  if (route.isBenchmarks) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 24px",
            backgroundColor: "#0F172A",
            borderBottom: "1px solid #1E293B",
            color: "#FFFFFF",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontWeight: 800, fontSize: "0.95rem", letterSpacing: "0.05em", color: "#38BDF8", textTransform: "uppercase" }}>
              QRakshak
            </span>
            <span style={{ color: "#64748B", fontSize: "0.85rem" }}>/</span>
            <span style={{ fontSize: "0.82rem", color: "#E2E8F0", fontWeight: 700, letterSpacing: "0.02em" }}>
              Model Accuracy • Classical vs Quantum AI Benchmark Matrix
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <a
              href="#triage"
              style={{
                fontSize: "0.76rem",
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: "6px",
                backgroundColor: "#1E293B",
                color: "#E2E8F0",
                textDecoration: "none",
                transition: "background 0.2s",
              }}
            >
              Emergency Triage
            </a>
            <button
              type="button"
              onClick={() => {
                window.location.hash = "";
                window.history.pushState(null, "", window.location.pathname);
                window.dispatchEvent(new Event("hashchange"));
              }}
              style={{
                fontSize: "0.76rem",
                fontWeight: 700,
                padding: "6px 14px",
                borderRadius: "6px",
                backgroundColor: "#0284C7",
                color: "#FFFFFF",
                border: "none",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              ← Return to Clinical Cockpit / Sign In
            </button>
          </div>
        </header>

        <main style={{ flex: 1 }}>
          <ModelEvaluationShowcase />
        </main>

        <EditorialFooter />
      </div>
    );
  }

  if (route.isNotFound) return <NotFoundPage />;

  return <UnifiedAnalysisPage />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <ConnectivityBanner />
        <AppRouter />
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
