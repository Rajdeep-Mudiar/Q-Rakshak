import { useState, useEffect, useRef } from "react";
import { ChevronDown, Stethoscope, Sparkles, Languages, Menu, X, Cpu } from "lucide-react";
import { DISEASE_LIST, getLocalizedDiseaseById } from "../../data/diseaseRegistry.js";
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
          style={{
            background: "var(--surface-sunken, #F4F4F5)",
            border: "1px solid var(--border-subtle, #E4E4E7)",
            borderRadius: 0,
            padding: "8px",
            minWidth: "40px",
            minHeight: "40px",
            cursor: "pointer",
            color: "var(--ink-primary, #09090B)",
            display: "none",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
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
              color: "var(--ink-primary, #09090B)",
            }}
          >
            QRakshak
          </span>
          <span
            style={{
              fontSize: "0.68rem",
              color: "var(--accent-cobalt, #0052FF)",
              background: "var(--surface-sunken, #F4F4F5)",
              border: "1px solid var(--border-subtle, #E4E4E7)",
              padding: "2px 8px",
              borderRadius: 0,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontFamily: "var(--font-mono)",
            }}
          >
            {t("header.clinical_platform", "Clinical Platform")}
          </span>
        </button>

        <div
          className="header-divider-desktop"
          style={{
            width: "1px",
            height: "18px",
            background: "var(--border-subtle, #E4E4E7)",
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
            color: "var(--ink-secondary, #71717A)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: 0,
              background: "var(--state-success, #059669)",
            }}
          />
          <span style={{ fontWeight: 700, letterSpacing: "0.04em" }}>{t("header.system_ready", "SYSTEM READY")}</span>
          <span style={{ color: "var(--border-subtle, #E4E4E7)" }}>•</span>
          <span className="tabular-nums">{timeString}</span>
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
            <span>{t("header.diseases", "Diseases")}</span>
            <ChevronDown size={12} color="var(--text-muted)" style={{ transform: diseaseMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }} />
          </button>

          {diseaseMenuOpen && (
            <div className="header-dropdown-menu">
              <div style={{ padding: "6px 8px", borderBottom: "1px solid var(--border-default)", fontSize: "0.64rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                {t("header.select_disease_protocol", "Select Disease Protocol")}
              </div>
              {DISEASE_LIST.map((d) => {
                const locD = getLocalizedDiseaseById(d.id, t);
                return (
                  <button
                    key={d.id}
                    type="button"
                    className="header-dropdown-item"
                    onClick={() => {
                      setDiseaseMenuOpen(false);
                      onSelectDisease && onSelectDisease(d.id);
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{locD.name || d.name}</span>
                    <span style={{ fontSize: "0.62rem", color: d.accentColor, background: d.accentBg, padding: "2px 6px", borderRadius: 0, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                      {locD.category || d.category}
                    </span>
                  </button>
                );
              })}
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
            <Sparkles size={13} color="var(--accent-cobalt, #0052FF)" />
            <span>{t("header.modules", "Modules")}</span>
            <ChevronDown size={12} color="var(--ink-secondary, #71717A)" style={{ transform: moduleMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }} />
          </button>

          {moduleMenuOpen && (
            <div className="header-dropdown-menu">
              <div style={{ padding: "6px 8px", borderBottom: "1px solid var(--border-subtle, #E4E4E7)", fontSize: "0.64rem", fontWeight: 800, textTransform: "uppercase", color: "var(--ink-secondary, #71717A)", letterSpacing: "0.06em", fontFamily: "var(--font-mono)" }}>
                {t("header.platform_modules", "Platform Modules")}
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
                  <span style={{ fontWeight: 600 }}>{(f?.title || f?.id || "Module").split("&")[0].trim()}</span>
                  <span style={{ fontSize: "0.62rem", color: f.accentColor || "var(--accent-cobalt, #0052FF)", background: f.accentBg || "var(--surface-sunken, #F4F4F5)", padding: "2px 6px", borderRadius: 0, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    Intro
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Model Accuracy Classical vs Quantum AI Link Route */}
        <a
          href="#CLASSICALvsQUANTUMN"
          style={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "var(--accent-cobalt, #0052FF)",
            background: "var(--surface-sunken, #F4F4F5)",
            border: "1px solid var(--border-subtle, #E4E4E7)",
            borderRadius: 0,
            padding: "5px 10px",
            transition: "all 0.15s ease",
            fontFamily: "var(--font-mono)",
          }}
          title="Open Classical vs Quantum Model Accuracy Benchmarks (#CLASSICALvsQUANTUMN)"
        >
          <Cpu size={13} color="var(--accent-cobalt, #0052FF)" />
          <span>Classical vs Quantum</span>
        </a>
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
              background: langMenuOpen ? "var(--surface-sunken, #F4F4F5)" : "var(--surface-base, #FFFFFF)",
              color: "var(--ink-primary, #09090B)",
              border: "1px solid var(--border-subtle, #E4E4E7)",
              borderRadius: 0,
              fontSize: "0.76rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Languages size={15} color="var(--accent-cobalt, #0052FF)" />
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
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
                marginTop: "4px",
                width: "190px",
                background: "var(--surface-base, #FFFFFF)",
                border: "1px solid var(--border-subtle, #E4E4E7)",
                borderRadius: 0,
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.08)",
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
                  color: "var(--ink-secondary, #71717A)",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
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
                      background: isSelected ? "var(--surface-sunken, #F4F4F5)" : "transparent",
                      color: isSelected ? "var(--accent-cobalt, #0052FF)" : "var(--ink-primary, #09090B)",
                      border: "none",
                      borderRadius: 0,
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
                        fontFamily: "var(--font-mono)",
                        padding: "2px 5px",
                        borderRadius: 0,
                        background: isSelected ? "var(--accent-cobalt, #0052FF)" : "var(--surface-sunken, #F4F4F5)",
                        color: isSelected ? "#FFFFFF" : "var(--ink-secondary, #71717A)",
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
              background: "var(--surface-sunken, #F4F4F5)",
              border: "1px solid var(--border-subtle, #E4E4E7)",
              borderRadius: 0,
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
                  color: "var(--ink-primary, #09090B)",
                  lineHeight: 1.1,
                }}
              >
                {currentUser?.name || "User"}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.58rem",
                  color: "var(--accent-cobalt, #0052FF)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 700,
                }}
              >
                {currentUser?.role || "GUEST"}
              </div>
            </div>
            <span className="header-more">{t("header.more", "More")}</span>
          </button>

          {/* Menu dropdown */}
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "4px",
                width: "230px",
                background: "var(--surface-base, #FFFFFF)",
                border: "1px solid var(--border-subtle, #E4E4E7)",
                borderRadius: 0,
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.08)",
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
                  {t("header.authenticated_as", "AUTHENTICATED AS")}
                </span>
                <strong style={{ fontSize: "0.82rem", color: "var(--ink-primary)", display: "block" }}>
                  {currentUser?.name}
                </strong>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {t("header.role", "Role")}: {currentUser?.role?.toUpperCase()}
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
                  color: "var(--ink-primary, #09090B)",
                  borderRadius: 0,
                }}
              >
                <span>{t("header.profile_identity", "Profile & Identity")}</span>
              </button>

              <div style={{ height: "1px", background: "var(--border-subtle, #E4E4E7)", margin: "4px 0" }} />

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
                  color: "var(--state-error, #E11D48)",
                  borderRadius: 0,
                }}
                title="Log out to switch role or account"
              >
                <span>{t("header.sign_out_switch", "Sign Out / Switch Persona")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
