import React, { useState, useEffect } from "react";
import { apiClient } from "../../api/client";
import { ENDPOINTS } from "../../api/config";

export default function ConnectivityBanner() {
  const [connectivity, setConnectivity] = useState({
    status: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "idle",
    message: "",
  });
  const [dismissed, setDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let autoDismissTimer = null;

    function handleStatusEvent(e) {
      const detail = e.detail || {};
      const status = detail.status;
      const message = detail.message;

      setDismissed(false);
      setConnectivity({ status, message });

      if (status === "online" || status === "fallback") {
        clearTimeout(autoDismissTimer);
        autoDismissTimer = setTimeout(() => {
          setConnectivity((prev) => (prev.status === "online" || prev.status === "fallback" ? { status: "idle", message: "" } : prev));
        }, 3500);
      }
    }

    function handleBrowserOnline() {
      setDismissed(false);
      setConnectivity({
        status: "online",
        message: "Network link restored. Clinical API synchronized.",
      });
      clearTimeout(autoDismissTimer);
      autoDismissTimer = setTimeout(() => {
        setConnectivity((prev) => (prev.status === "online" ? { status: "idle", message: "" } : prev));
      }, 3500);
    }

    function handleBrowserOffline() {
      setDismissed(false);
      setConnectivity({
        status: "offline",
        message: "No internet connection detected. Running in cached offline mode.",
      });
    }

    window.addEventListener("qmed:connectivity_status", handleStatusEvent);
    window.addEventListener("online", handleBrowserOnline);
    window.addEventListener("offline", handleBrowserOffline);

    return () => {
      window.removeEventListener("qmed:connectivity_status", handleStatusEvent);
      window.removeEventListener("online", handleBrowserOnline);
      window.removeEventListener("offline", handleBrowserOffline);
      clearTimeout(autoDismissTimer);
    };
  }, []);

  async function checkManualConnection() {
    setIsChecking(true);
    try {
      await apiClient.get(ENDPOINTS.HEALTH || "/health", null, { timeout: 4000, noDedupe: true });
      setConnectivity({
        status: "online",
        message: "Connection verified. All clinical microservices operational.",
      });
      setTimeout(() => {
        setConnectivity({ status: "idle", message: "" });
      }, 3000);
    } catch {
      setConnectivity({
        status: "offline",
        message: "Gateway still unreachable. Retrying automatically in background...",
      });
    } finally {
      setIsChecking(false);
    }
  }

  if (dismissed || connectivity.status === "idle") {
    return null;
  }

  const isOnline = connectivity.status === "online" || connectivity.status === "fallback";
  const isColdStart = connectivity.status === "cold_start" || connectivity.status === "retrying";
  const isOffline = connectivity.status === "offline";

  let bgClass = "bg-rose-950/90 border-rose-500/40 text-rose-200";
  let dotClass = "bg-rose-400";
  let label = "Network Disconnected";

  if (isOnline) {
    bgClass = "bg-emerald-950/90 border-emerald-500/40 text-emerald-200";
    dotClass = "bg-emerald-400";
    label = connectivity.status === "fallback" ? "Local Gateway Active" : "Online & Synchronized";
  } else if (isColdStart) {
    bgClass = "bg-amber-950/90 border-amber-500/40 text-amber-200";
    dotClass = "bg-amber-400 animate-ping";
    label = "Connecting to Clinical Engine...";
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-xl transition-all duration-300 ease-out"
    >
      <div
        className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-2xl shadow-black/40 text-xs sm:text-sm font-medium ${bgClass}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {isColdStart && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotClass}`} />
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotClass}`} />
          </span>
          <div className="truncate">
            <span className="font-semibold mr-1.5">{label}:</span>
            <span className="opacity-90">{connectivity.message || (isOffline ? "Operating in offline fallback mode." : "")}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOffline && (
            <button
              type="button"
              onClick={checkManualConnection}
              disabled={isChecking}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors border border-white/20 active:scale-95 disabled:opacity-50"
            >
              {isChecking ? "Checking..." : "Reconnect"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="p-1 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
