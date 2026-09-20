import React from "react";

export default function EditorialFooter() {
  return (
    <footer
      className="editorial-footer editorial-footer-container"
      style={{
        borderTop: "1px solid var(--border-default)",
        backgroundColor: "var(--bg-surface)",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        flexShrink: 0,
        zIndex: 30,
        fontSize: "0.75rem",
        color: "var(--text-secondary)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          QRakshak Medical Technology © 2026
        </span>
        <span style={{ color: "var(--border-default)" }}>|</span>
        <span style={{ fontSize: "0.70rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
          HIPAA Safe Harbor 18 • DPDP Act 2023 • WORM Audit Trail
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <a 
          href="mailto:support@qrakshak.health" 
          style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}
        >
          support@qrakshak.health
        </a>
        <span style={{ color: "var(--border-default)" }}>•</span>
        <span style={{ color: "var(--text-secondary)", fontSize: "0.72rem" }}>
          Protected Healthcare Environment
        </span>
      </div>
    </footer>
  );
}
