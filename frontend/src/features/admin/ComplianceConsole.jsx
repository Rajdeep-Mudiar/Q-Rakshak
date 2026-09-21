import { useState, useEffect, useRef } from "react";
import { ShieldCheck, Lock, Database, CheckCircle2 } from "lucide-react";
import { complianceApi } from "../../api/compliance";
import { animateEntrance, animateCardStagger } from "../../utils/motion";
import { useLanguage } from "../../context/LanguageContext";

export default function ComplianceConsole({ patientId = "USR-5EF52B" }) {
  const { t } = useLanguage();
  const [auditLogs, setAuditLogs] = useState([]);
  const [registry, setRegistry] = useState([]);
  const [consent, setConsent] = useState({ storage: true, research: true, sharing: false });
  const [saved, setSaved] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    complianceApi.getAuditLogs()
      .then((data) => setAuditLogs(data.logs || []))
      .catch(() => {});

    complianceApi.getModelRegistry()
      .then((data) => setRegistry(data.models || []))
      .catch(() => {});

    if (containerRef.current) {
      animateEntrance(containerRef.current, { y: 15, duration: 0.35 });
      animateCardStagger(containerRef.current, ".card-panel");
    }
  }, []);

  async function handleConsentSave() {
    try {
      await complianceApi.updateConsent(patientId, {
        consent_storage: consent.storage,
        consent_research: consent.research,
        consent_sharing: consent.sharing,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  }

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%", overflowY: "auto", padding: "6px" }}>
      {/* DPDP Act 2023 Consent Management Card (SRS Section 9.1) */}
      <div className="card-panel" style={{ borderLeft: "3px solid var(--primary)", borderRadius: "var(--radius-md)" }}>
        <div className="card-header">
          <span className="card-title">
            <Lock size={15} color="var(--primary)" /> DPDP Act, 2023 — Granular Patient Consent Controls
          </span>
          <span style={{ fontSize: "0.68rem", color: "var(--primary)", fontWeight: 700 }}>
            DPDP-2023-v2 Verified
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "8px" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 12px", background: "var(--bg-canvas)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={consent.storage}
              onChange={(e) => setConsent({ ...consent, storage: e.target.checked })}
              style={{ accentColor: "var(--primary)", marginTop: "2px" }}
            />
            <div>
              <strong style={{ fontSize: "0.78rem", display: "block", color: "var(--ink-primary)" }}>Clinical Data Storage</strong>
              <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>Retain encrypted PHI for direct diagnostic care.</span>
            </div>
          </label>

          <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 12px", background: "var(--bg-canvas)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={consent.research}
              onChange={(e) => setConsent({ ...consent, research: e.target.checked })}
              style={{ accentColor: "var(--primary)", marginTop: "2px" }}
            />
            <div>
              <strong style={{ fontSize: "0.78rem", display: "block", color: "var(--ink-primary)" }}>QML Research & Retraining</strong>
              <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>Allow de-identified vectors in QNN benchmarks.</span>
            </div>
          </label>

          <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 12px", background: "var(--bg-canvas)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={consent.sharing}
              onChange={(e) => setConsent({ ...consent, sharing: e.target.checked })}
              style={{ accentColor: "var(--primary)", marginTop: "2px" }}
            />
            <div>
              <strong style={{ fontSize: "0.78rem", display: "block", color: "var(--ink-primary)" }}>ABDM Inter-Hospital Exchange</strong>
              <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>Federated sharing via Ayushman Bharat FHIR.</span>
            </div>
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
          <button
            type="button"
            className="btn-primary"
            onClick={handleConsentSave}
            style={{ width: "auto", padding: "6px 16px", fontSize: "0.76rem" }}
          >
            {saved ? "Consent Logged to Immutable Ledger" : "Update Consent Directives"}
          </button>
        </div>
      </div>

      {/* Immutable Audit Log Table (SRS Section 9.1 & 10) */}
      <div className="card-panel" style={{ borderRadius: "var(--radius-md)" }}>
        <div className="card-header">
          <span className="card-title">
            <ShieldCheck size={15} color="var(--state-success)" /> Immutable Audit Trail (WORM Ledger)
          </span>
          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            100% PHI Access Tracked
          </span>
        </div>

        <div className="data-table-wrap table-responsive editorial-table-scroll" style={{ maxHeight: "240px", overflowY: "auto", overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "var(--radius-sm)" }}>
          <table className="clinical-data-table" style={{ minWidth: "680px" }}>
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Timestamp</th>
                <th>Operator</th>
                <th>Role</th>
                <th>Action Type</th>
                <th>Resource Target</th>
                <th>Compliance Status</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontFamily: "var(--font-mono)", color: "var(--primary)", fontWeight: 700 }}>{log.id}</td>
                  <td>{log.timestamp}</td>
                  <td><strong>{log.operator}</strong></td>
                  <td>{log.role}</td>
                  <td>{log.action}</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{log.target}</td>
                  <td>
                    <span style={{
                      fontSize: "0.64rem",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "var(--radius-xs)",
                      background: "var(--state-success-bg)",
                      color: "var(--state-success)",
                      border: "1px solid rgba(22, 134, 106, 0.25)",
                    }}>
                      {log.compliance}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Registry (SRS Section 9.3) */}
      <div className="card-panel" style={{ borderRadius: "var(--radius-md)" }}>
        <div className="card-header">
          <span className="card-title">
            <Database size={15} color="var(--primary)" /> Model Governance & Lineage Registry
          </span>
          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
            Version Lineage & Validation Checkpoints
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "10px", marginTop: "10px" }}>
          {registry.map((mod) => (
            <div
              key={mod.version}
              style={{
                background: "var(--bg-canvas)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <strong style={{ fontSize: "0.78rem", color: "var(--ink-primary)" }}>{mod.model_name}</strong>
                <span style={{ fontSize: "0.64rem", padding: "2px 6px", borderRadius: "var(--radius-xs)", background: "var(--primary-soft)", color: "var(--primary)", fontWeight: 700 }}>
                  {mod.version}
                </span>
              </div>
              <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                Trained: {mod.training_date}
              </p>
              <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Dataset: <strong>{mod.dataset_lineage}</strong>
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "6px" }}>
                <span>ROC-AUC: <strong style={{ color: "var(--primary)" }}>{mod.metrics?.auc_roc}</strong></span>
                <span>Status: <strong style={{ color: "var(--state-success)" }}>{mod.status}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
