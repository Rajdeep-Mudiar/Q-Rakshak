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
    const hash = window.location.hash;
    const path = window.location.pathname;

    if (hash.startsWith("#emergency/") || hash.startsWith("#/emergency/")) {
      const parts = hash.split("/");
      return { isEmergency: true, patientId: parts[parts.length - 1] || "USR-5EF52B" };
    }
    if (path.startsWith("/emergency/")) {
      const parts = path.split("/");
      return { isEmergency: true, patientId: parts[parts.length - 1] || "USR-5EF52B" };
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
