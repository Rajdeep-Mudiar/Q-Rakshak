import { useState, useEffect } from "react";

export default function EditorialHeader({
  currentUser,
  onLogout,
  onOpenProfile,
  highContrast,
  setHighContrast,
  activeTab,
  setActiveTab,
  mobileSidebarOpen,
  setMobileSidebarOpen,
}) {
  const [timeString, setTimeString] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    }
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      className="editorial-header"
      style={{
        height: "58px",
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-default)",
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        zIndex: 40,
        position: "relative",
      }}
    >
      {/* ── Left: Mobile Hamburger & Editorial Masthead Tag ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          aria-label="Toggle Navigation Drawer"
          style={{ background: "none", border: "1px solid var(--border-default)", borderRadius: "var(--radius-xs)", padding: "8px 12px", minWidth: "44px", minHeight: "44px", cursor: "pointer", color: "var(--ink-primary)", display: "none", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: "0.76rem", fontWeight: 700 }}
        >
          {mobileSidebarOpen ? "Close" : "Menu"}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("home")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: 0,
          }}
          title="Return to QRakshak Overview"
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            QRakshak
          </span>
          <span
            style={{
              fontSize: "0.68rem",
              color: "var(--primary-dark)",
              background: "var(--primary-soft)",
              padding: "2px 8px",
              borderRadius: "6px",
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            Clinical Platform
          </span>
        </button>

        <div
          className="header-divider-desktop"
          style={{
            width: "1px",
            height: "18px",
            background: "var(--border-default)",
          }}
        />

        {/* Live System Status & Telemetry */}
        <div
          className="header-telemetry-desktop"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "var(--font-mono)",
            fontSize: "0.66rem",
            color: "var(--text-secondary)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "var(--risk-low)",
            }}
          />
          <span style={{ fontWeight: 600 }}>SYSTEM READY</span>
          <span style={{ color: "var(--border-hover)" }}>•</span>
          <span>{timeString}</span>
        </div>
      </div>

      {/* ── Right: User Profile & A11y ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* A11y Contrast Toggle */}
        <button
          type="button"
          className={`a11y-pill-btn ${highContrast ? "active" : ""}`}
          onClick={() => setHighContrast(!highContrast)}
          title="Toggle High Contrast Mode"
          style={{
            background: highContrast ? "var(--text-primary)" : "var(--bg-surface)",
            color: highContrast ? "#FFFFFF" : "var(--text-secondary)",
            border: "1px solid var(--border-default)",
            borderRadius: "8px",
            padding: "6px 10px",
            fontSize: "0.74rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          Aa
        </button>

        {/* User Profile Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 10px",
              background: "var(--bg-surface-alt)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  color: "var(--ink-primary)",
                  lineHeight: 1.1,
                }}
              >
                {currentUser?.name || "User"}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.58rem",
                  color: "var(--accent-blue)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 700,
                }}
              >
                {currentUser?.role || "GUEST"}
              </div>
            </div>
            <span className="header-more">More</span>
          </button>

          {/* Menu dropdown */}
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "6px",
                width: "230px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-xs)",
                boxShadow: "var(--shadow-md)",
                padding: "8px",
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: "8px 10px",
                  borderBottom: "1px solid var(--border-subtle)",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.58rem",
                    color: "var(--text-gold)",
                    fontWeight: 800,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    display: "block",
                  }}
                >
                  AUTHENTICATED AS
                </span>
                <strong style={{ fontSize: "0.82rem", color: "var(--ink-primary)", display: "block" }}>
                  {currentUser?.name}
                </strong>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  Role: {currentUser?.role?.toUpperCase()}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenProfile();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 10px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.76rem",
                  textAlign: "left",
                  color: "var(--text-primary)",
                  borderRadius: "var(--radius-xs)",
                }}
              >
                <span>Profile & Identity</span>
              </button>

              <div style={{ height: "1px", background: "var(--border-subtle)", margin: "4px 0" }} />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 10px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.76rem",
                  textAlign: "left",
                  color: "var(--risk-high)",
                  borderRadius: "var(--radius-xs)",
                }}
                title="Log out to switch role or account"
              >
                <span>Sign Out / Switch Persona</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
