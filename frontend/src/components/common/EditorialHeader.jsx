import { useState, useEffect, useRef } from "react";
import { ChevronDown, Stethoscope, Sparkles, Languages } from "lucide-react";
import { DISEASE_LIST } from "../../data/diseaseRegistry.js";
import { FEATURE_INTRO_REGISTRY } from "../../data/featureIntroRegistry.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

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
  onSelectDisease,
  onNavigateFeature,
}) {
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const [timeString, setTimeString] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [diseaseMenuOpen, setDiseaseMenuOpen] = useState(false);
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef(null);

  const currentLangConfig =
    availableLanguages.find((l) => l.code === language) || availableLanguages[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


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

        {/* Quick Disease Selector Dropdown */}
        <div className="header-nav-dropdown" style={{ position: "relative" }}>
          <button
            type="button"
            className="header-dropdown-btn"
            onClick={() => {
              setDiseaseMenuOpen(!diseaseMenuOpen);
              setModuleMenuOpen(false);
              setMenuOpen(false);
            }}
            title="Browse Disease Protocols"
          >
            <Stethoscope size={13} color="var(--primary)" />
            <span>Diseases</span>
            <ChevronDown size={12} color="var(--text-muted)" style={{ transform: diseaseMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }} />
          </button>

          {diseaseMenuOpen && (
            <div className="header-dropdown-menu">
              <div style={{ padding: "6px 8px", borderBottom: "1px solid var(--border-default)", fontSize: "0.64rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                Select Disease Protocol
              </div>
              {DISEASE_LIST.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="header-dropdown-item"
                  onClick={() => {
                    setDiseaseMenuOpen(false);
                    onSelectDisease && onSelectDisease(d.id);
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{d.name}</span>
                  <span style={{ fontSize: "0.62rem", color: d.accentColor, background: d.accentBg, padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                    {d.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Platform Modules Dropdown */}
        <div className="header-nav-dropdown" style={{ position: "relative" }}>
          <button
            type="button"
            className="header-dropdown-btn"
            onClick={() => {
              setModuleMenuOpen(!moduleMenuOpen);
              setDiseaseMenuOpen(false);
              setMenuOpen(false);
            }}
            title="Explore Platform Features"
          >
            <Sparkles size={13} color="var(--accent-violet)" />
            <span>Modules</span>
            <ChevronDown size={12} color="var(--text-muted)" style={{ transform: moduleMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }} />
          </button>

          {moduleMenuOpen && (
            <div className="header-dropdown-menu">
              <div style={{ padding: "6px 8px", borderBottom: "1px solid var(--border-default)", fontSize: "0.64rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                Platform Modules
              </div>
              {Object.values(FEATURE_INTRO_REGISTRY).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="header-dropdown-item"
                  onClick={() => {
                    setModuleMenuOpen(false);
                    onNavigateFeature && onNavigateFeature(f.id);
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{f.title.split("&")[0].trim()}</span>
                  <span style={{ fontSize: "0.62rem", color: f.accentColor, background: f.accentBg, padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                    Intro
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Language Switcher, A11y & User Profile ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Language Switcher Dropdown (English / हिंदी / অসমীয়া) */}
        <div style={{ position: "relative" }} ref={langMenuRef}>
          <button
            type="button"
            className="lang-switcher-btn"
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            aria-expanded={langMenuOpen}
            aria-label="Select Interface Language"
            title="Switch Language / भाषा बदलें"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 10px",
              background: langMenuOpen ? "var(--primary-soft, rgba(14, 165, 233, 0.1))" : "var(--bg-surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
              borderRadius: "8px",
              fontSize: "0.76rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Languages size={15} color="var(--primary, #0EA5E9)" />
            <span style={{ fontFamily: "var(--font-sans, inherit)", fontWeight: 700 }}>
              {currentLangConfig?.shortBadge || "EN"}
            </span>
            <ChevronDown
              size={12}
              style={{
                transform: langMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
                opacity: 0.7,
              }}
            />
          </button>

          {langMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "6px",
                width: "190px",
                background: "var(--bg-surface, #FFFFFF)",
                border: "1px solid var(--border-default, #E2E8F0)",
                borderRadius: "10px",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
                padding: "6px",
                zIndex: 120,
              }}
            >
              <div
                style={{
                  padding: "6px 8px 4px",
                  fontSize: "0.62rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-muted, #64748B)",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                {t("header.language", "Language / भाषा")}
              </div>

              {availableLanguages.map((l) => {
                const isSelected = l.code === language;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLanguage(l.code);
                      setLangMenuOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "8px 10px",
                      background: isSelected ? "var(--primary-soft, rgba(14, 165, 233, 0.08))" : "transparent",
                      color: isSelected ? "var(--primary, #0EA5E9)" : "var(--text-primary, #0F172A)",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.78rem",
                      fontWeight: isSelected ? 700 : 500,
                      textAlign: "left",
                      transition: "background 0.12s ease",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>{l.flag}</span>
                      <span>{l.nativeName}</span>
                    </span>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontFamily: "var(--font-mono, monospace)",
                        padding: "2px 5px",
                        borderRadius: "4px",
                        background: isSelected ? "var(--primary, #0EA5E9)" : "var(--border-subtle, #F1F5F9)",
                        color: isSelected ? "#FFFFFF" : "var(--text-muted, #64748B)",
                        fontWeight: 700,
                      }}
                    >
                      {l.shortBadge}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

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
