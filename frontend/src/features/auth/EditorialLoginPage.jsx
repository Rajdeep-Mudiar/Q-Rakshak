import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ShieldCheck,
  Lock,
  Play,
  Cpu,
  CheckCircle2,
  User,
  KeyRound,
  LogIn,
  Stethoscope,
  Sparkles,
  ArrowRight,
  ArrowDown,
  AlertCircle,
  Activity,
  Layers,
  ExternalLink,
  Eye,
  EyeOff,
  UserPlus,
  ChevronDown
} from "lucide-react";
import { animateErrorShake } from "../../utils/motion.js";
import ModelEvaluationShowcase from "./components/ModelEvaluationShowcase.jsx";
import { authApi } from "../../api/auth.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function EditorialLoginPage({ onGoogleLogin, onGoogleVerifySuccess, onLoginSuccess, loading, error }) {
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [gisLoading, setGisLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [selectedRole, setSelectedRole] = useState("patient"); // 'patient' | 'doctor' | 'admin'
  const selectedRoleRef = useRef(selectedRole);
  useEffect(() => {
    selectedRoleRef.current = selectedRole;
  }, [selectedRole]);

  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Registration state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");

  const modalContainerRef = useRef(null);
  const narrativeRef = useRef(null);
  const formContainerRef = useRef(null);
  const pageContainerRef = useRef(null);
  const heroSectionRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || !pageContainerRef.current || !heroSectionRef.current) return;

    const ctx = gsap.context(() => {
      // Smooth light-to-dark transition as user scrolls down from hero
      gsap.to(pageContainerRef.current, {
        backgroundColor: "#080808",
        scrollTrigger: {
          trigger: heroSectionRef.current,
          start: "bottom 95%",
          end: "bottom 15%",
          scrub: 1.4,
        },
      });

      // Subtle parallax fade on hero cockpit as user scrolls into the benchmark showcase
      gsap.to(heroSectionRef.current, {
        opacity: 0.12,
        y: -35,
        scrollTrigger: {
          trigger: heroSectionRef.current,
          start: "top top",
          end: "bottom 20%",
          scrub: 1.4,
        },
      });

      // Floating gentle animation on the scroll cue pill
      gsap.to(".scroll-cue-pill, .zara-scroll-cue-pill", {
        y: -4,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, pageContainerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const scriptId = "google-jssdk-gsi";
    let isMounted = true;
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "985994695248-4615o9ba17tahv2q94ba01t322r3aunr.apps.googleusercontent.com";

    function initGoogleClient() {
      if (typeof window !== "undefined" && window.google?.accounts?.id && googleClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response) => {
              if (response?.credential && isMounted) {
                try {
                  setGisLoading(true);
                  setLocalError(null);
                  const verifiedUser = await authApi.verifyGoogleCredential(response.credential, selectedRoleRef.current);
                  if (verifiedUser) {
                    if (onLoginSuccess) {
                      onLoginSuccess(verifiedUser);
                    } else if (onGoogleVerifySuccess) {
                      onGoogleVerifySuccess(verifiedUser);
                    } else {
                      window.location.reload();
                    }
                  }
                } catch (err) {
                  setLocalError(err?.message || "Google authentication verification failed. Please try again.");
                } finally {
                  if (isMounted) setGisLoading(false);
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: true,
          });
        } catch {
          // Graceful fallback if GSI initialization fails
        }
      }
    }

    if (typeof document !== "undefined") {
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          initGoogleClient();
        };
        document.body.appendChild(script);
      } else {
        initGoogleClient();
      }
    }

    return () => {
      isMounted = false;
    };
  }, [onGoogleVerifySuccess, onLoginSuccess]);

  const handleGoogleClick = () => {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
            if (onGoogleLogin) onGoogleLogin(selectedRoleRef.current);
          }
        });
        return;
      } catch {
        if (onGoogleLogin) onGoogleLogin(selectedRoleRef.current);
        return;
      }
    }
    if (onGoogleLogin) {
      onGoogleLogin(selectedRoleRef.current);
    }
  };

  async function handleCredentialSubmit(e) {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setLocalError("Please enter both username and password.");
      return;
    }
    setSubmitting(true);
    setLocalError(null);
    try {
      const data = await authApi.login(username.trim(), password, selectedRole);
      if (data?.user) {
        if (onLoginSuccess) onLoginSuccess(data.user);
        else if (onGoogleVerifySuccess) onGoogleVerifySuccess(data.user);
        else window.location.reload();
      }
    } catch (err) {
      setLocalError(err?.message || "Invalid credentials. Please verify your handle and password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegisterSubmit(e) {
    if (e) e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regUsername.trim() || !regPassword) {
      setLocalError("Please complete all registration fields.");
      return;
    }
    setSubmitting(true);
    setLocalError(null);
    try {
      const defaultLicense = selectedRole === "doctor"
        ? `DOC-LIC-${Math.floor(10000 + Math.random() * 90000)}`
        : selectedRole === "admin"
        ? `ADM-SEC-${Math.floor(1000 + Math.random() * 9000)}`
        : `PT-REC-${Math.floor(10000 + Math.random() * 90000)}`;

      const data = await authApi.register({
        name: regName.trim(),
        email: regEmail.trim(),
        username: regUsername.trim().toLowerCase(),
        password: regPassword,
        role: selectedRole,
        emergency_phone: regPhone || "+91 98765 43210",
        hospital_affiliation: selectedRole === "doctor" ? "AIIMS Clinical AI OPD" : "Community Healthcare",
        license_number: defaultLicense,
        specialty: selectedRole === "doctor" ? "General Medicine & Clinical AI" : undefined,
      });
      if (data?.user) {
        if (onLoginSuccess) onLoginSuccess(data.user);
        else if (onGoogleVerifySuccess) onGoogleVerifySuccess(data.user);
        else window.location.reload();
      }
    } catch (err) {
      setLocalError(err?.message || "Registration failed. Username may already be taken.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && showGuideModal) {
        setShowGuideModal(false);
      }
    }
    if (showGuideModal) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [showGuideModal]);

  useEffect(() => {
    if (error && formContainerRef.current) {
      animateErrorShake(formContainerRef.current);
    }
  }, [error]);

  return (
    <div
      ref={pageContainerRef}
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "#FFFFFF",
        backgroundImage: `
          linear-gradient(rgba(15, 23, 42, 0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(15, 23, 42, 0.035) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        color: "#0F172A",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 0,
        overflowX: "hidden",
        position: "relative",
        boxSizing: "border-box",
        fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        transition: "background-color 0.4s ease",
      }}
    >
      <style>{`
        @keyframes pulseDot {
          0% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.7); }
          70% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 0 8px rgba(5, 150, 105, 0); }
          100% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 0 0 rgba(5, 150, 105, 0); }
        }
        @keyframes pingRing {
          0% { transform: scale(0.8); opacity: 0.9; }
          75%, 100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes bounceArrow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
        .scroll-cue-pill {
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 10px 22px;
          background: #FFFFFF;
          color: #0F172A;
          border: 1px solid #E2E8F0;
          border-radius: 9999px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scroll-cue-pill:hover {
          background: #F8FAFC !important;
          border-color: #CBD5E1 !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
          transform: translateY(-2px);
        }
        .zara-scroll-cue-pill {
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 14px;
          padding: 12px 24px;
          background: #000000;
          color: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.9);
          border-radius: 0px;
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .zara-scroll-cue-pill:hover {
          background: #FFFFFF !important;
          color: #000000 !important;
          border-color: #000000 !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
        }
        .zara-pulse-square {
          width: 7px;
          height: 7px;
          background: #FFFFFF;
          display: inline-block;
          transition: background 0.2s ease;
        }
        .zara-scroll-cue-pill:hover .zara-pulse-square {
          background: #000000;
        }
        .scroll-arrow-anim {
          animation: bounceArrow 1.5s infinite ease-in-out;
        }
        .editorial-google-btn {
          width: 100%;
          min-height: 52px;
          padding: 13px 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #FFFFFF;
          color: #0F172A;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .editorial-google-btn:hover {
          background: #F8FAFC;
          border-color: #059669;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(5, 150, 105, 0.15);
        }
        .editorial-spec-card {
          padding: 22px 24px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .editorial-spec-card:hover {
          border-color: #CBD5E1;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.07);
        }
        .editorial-main-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: clamp(32px, 5vw, 64px);
          align-items: center;
          margin: 40px 0;
        }
        @media (max-width: 960px) {
          .editorial-main-grid {
            grid-template-columns: 1fr;
            gap: 24px;
            margin: 20px 0;
          }
        }
        @media (max-width: 480px) {
          .scroll-cue-pill {
            padding: 8px 14px !important;
            gap: 8px !important;
          }
          .scroll-cue-pill span {
            font-size: 0.72rem !important;
          }
        }
      `}</style>

      {/* ── Desktop Full-Height Hero Section (100vh) ── */}
      <div
        ref={heroSectionRef}
        className="editorial-login-hero"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          padding: "clamp(16px, 2.5vh, 28px) clamp(16px, 3.5vw, 48px) clamp(20px, 3.5vh, 36px)",
          boxSizing: "border-box",
        }}
      >
        {/* Top Architectural Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #E2E8F0",
            paddingBottom: "20px",
            gap: "20px",
            flexWrap: "wrap",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                fontFamily: "var(--font-sans, inherit)",
                fontSize: "1.15rem",
                fontWeight: 800,
                letterSpacing: "0.03em",
                color: "#0F172A",
                textTransform: "uppercase",
              }}
            >
              QRakshak
            </span>
            <span style={{ color: "#CBD5E1", fontSize: "0.95rem" }}>/</span>
            <span
              style={{
                fontSize: "0.74rem",
                color: "#64748B",
                fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Clinical Intelligence Platform
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Language Selector Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 12px",
                  background: "#F8FAFC",
                  color: "#0F172A",
                  border: "1px solid #CBD5E1",
                  borderRadius: "0px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <span>{availableLanguages.find((l) => l.code === language)?.flag || "🌐"}</span>
                <span>{availableLanguages.find((l) => l.code === language)?.nativeName || "English"}</span>
                <ChevronDown size={12} />
              </button>

              {langDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    right: 0,
                    minWidth: "150px",
                    background: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                    zIndex: 100,
                    padding: "4px",
                  }}
                >
                  {availableLanguages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLanguage(l.code);
                        setLangDropdownOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "8px 10px",
                        background: l.code === language ? "#F0FDF4" : "transparent",
                        color: l.code === language ? "#059669" : "#0F172A",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.76rem",
                        fontWeight: l.code === language ? 700 : 500,
                        textAlign: "left",
                      }}
                    >
                      <span>{l.flag} {l.nativeName}</span>
                      <span style={{ fontSize: "0.65rem", color: "#64748B", fontFamily: "monospace" }}>{l.shortBadge}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <a
              href="https://github.com/ARYANCY/QDoc"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "7px 14px",
                background: "#0F172A",
                color: "#FFFFFF",
                border: "1px solid #0F172A",
                borderRadius: "0px",
                fontSize: "0.72rem",
                fontWeight: 700,
                textDecoration: "none",
                letterSpacing: "0.02em",
                transition: "background 0.2s, transform 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1E293B")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#0F172A")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub: ARYANCY/QDoc</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </header>

      {/* Main Split Grid */}
      <main className="editorial-main-grid" style={{ flex: 1 }}>
        {/* Left Column Narrative */}
        <div
          ref={narrativeRef}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "28px",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-sans, inherit)",
                fontSize: "clamp(1.85rem, 5.5vw, 3.8rem)",
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
                color: "#0F172A",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              Clinical Precision. <br />
              <span style={{ color: "#059669" }}>
                {t("login.hero_title_2", "Objective Triage.")}
              </span>
            </h1>
          </div>

          <p
            style={{
              fontSize: "0.96rem",
              lineHeight: 1.7,
              color: "#475569",
              maxWidth: "560px",
              margin: 0,
            }}
          >
            {t("login.hero_desc", "Fast and reliable clinical triage, verified medical records, and secure doctor consultations powered by Quantum AI.")}
          </p>

          {/* Spec Cards */}
          <div
            className="editorial-spec-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
              borderTop: "1px solid #E2E8F0",
              paddingTop: "24px",
            }}
          >
            <div className="editorial-spec-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.70rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                  {t("login.early_detection_badge", "Early Detection")}
                </span>
                <span style={{ fontSize: "0.68rem", color: "#059669", background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "2px 7px", borderRadius: "4px", fontWeight: 700 }}>
                  ESI 1-5
                </span>
              </div>
              <strong style={{ display: "block", fontSize: "0.92rem", color: "#0F172A", marginTop: "12px", fontWeight: 700 }}>
                {t("login.deterministic_triage", "Deterministic Triage")}
              </strong>
              <span style={{ display: "block", fontSize: "0.78rem", color: "#64748B", marginTop: "5px", lineHeight: 1.5 }}>
                {t("login.deterministic_triage_desc", "Standardized priority screening with instant vital sign and anomaly checks.")}
              </span>
            </div>

            <div className="editorial-spec-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.70rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                  {t("login.secure_records", "Secure Records")}
                </span>
                <span style={{ fontSize: "0.68rem", color: "#0284C7", background: "#F0F9FF", border: "1px solid #BAE6FD", padding: "2px 7px", borderRadius: "4px", fontWeight: 700 }}>
                  {t("login.audit_trail", "Audit Trail")}
                </span>
              </div>
              <strong style={{ display: "block", fontSize: "0.92rem", color: "#0F172A", marginTop: "12px", fontWeight: 700 }}>
                {t("login.tamper_proof_audit", "Tamper-Proof Audit")}
              </strong>
              <span style={{ display: "block", fontSize: "0.78rem", color: "#64748B", marginTop: "5px", lineHeight: 1.5 }}>
                {t("login.tamper_proof_audit_desc", "End-to-end cryptographic logging with clinical protocol verification.")}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", borderTop: "1px solid #E2E8F0", paddingTop: "16px" }}>
            <span style={{ fontSize: "0.72rem", color: "#475569", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
              <CheckCircle2 size={14} color="#059669" /> {t("login.verified_security", "Verified Security")}
            </span>
            <span style={{ fontSize: "0.72rem", color: "#475569", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
              <Lock size={14} color="#059669" /> {t("login.encrypted_data", "Encrypted Data")}
            </span>
            <span style={{ fontSize: "0.72rem", color: "#475569", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
              <Cpu size={14} color="#059669" /> {t("login.fast_triage", "Fast Triage")}
            </span>
          </div>
        </div>

        {/* Right Authentication Cockpit */}
        <div
          ref={formContainerRef}
          className="editorial-auth-card"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "14px",
            padding: "clamp(24px, 3.5vw, 40px) clamp(20px, 3.5vw, 36px)",
            position: "relative",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.07)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: "480px",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          {/* Header & Icon */}
          <div style={{ marginBottom: "20px", textAlign: "center" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "52px",
                height: "52px",
                background: selectedRole === "doctor" ? "#F0F9FF" : selectedRole === "admin" ? "#FAF5FF" : "#F0FDF4",
                border: `1px solid ${selectedRole === "doctor" ? "#BAE6FD" : selectedRole === "admin" ? "#E9D5FF" : "#BBF7D0"}`,
                borderRadius: "50%",
                marginBottom: "14px",
                transition: "all 0.3s ease",
              }}
            >
              {selectedRole === "doctor" ? (
                <Stethoscope size={24} color="#0284C7" />
              ) : selectedRole === "admin" ? (
                <ShieldCheck size={24} color="#7C3AED" />
              ) : (
                <User size={24} color="#059669" />
              )}
            </div>
            <h2
              style={{
                fontFamily: "var(--font-sans, inherit)",
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "#0F172A",
                letterSpacing: "-0.02em",
                margin: "0 0 6px 0",
              }}
            >
              {authMode === "register" ? t("login.create_account", "Create Q-RAKSHAK Account") : t("login.title", "Sign in to Q-RAKSHAK")}
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748B", margin: 0, lineHeight: 1.4 }}>
              {t("login.role_desc", "Select your clinical role to access your dedicated workspace.")}
            </p>
          </div>

          {/* Language Switcher Bar on Login Card */}
          <div
            style={{
              width: "100%",
              marginBottom: "16px",
              padding: "8px 12px",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              boxSizing: "border-box",
            }}
          >
            <span style={{ fontSize: "0.70rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: "5px" }}>
              🌐 {t("header.language", "Language")}:
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              {availableLanguages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: l.code === language ? "1.5px solid #059669" : "1px solid #CBD5E1",
                    background: l.code === language ? "#ECFDF5" : "#FFFFFF",
                    color: l.code === language ? "#059669" : "#334155",
                    fontSize: "0.74rem",
                    fontWeight: l.code === language ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {l.flag} {l.shortBadge || l.nativeName}
                </button>
              ))}
            </div>
          </div>

          {/* 1. Explicit Role Selector Dropdown */}
          <div style={{ width: "100%", marginBottom: "14px", textAlign: "left" }}>
            <label
              htmlFor="login-role-select"
              style={{
                display: "block",
                fontSize: "0.70rem",
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "5px",
              }}
            >
              {t("login.workspace_role", "Workspace Role")}
            </label>
            <div style={{ position: "relative" }}>
              <select
                id="login-role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  paddingRight: "36px",
                  borderRadius: "8px",
                  border: `1.5px solid ${selectedRole === "doctor" ? "#0284C7" : selectedRole === "admin" ? "#7C3AED" : "#059669"}`,
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "#0F172A",
                  background: "#FFFFFF",
                  appearance: "none",
                  cursor: "pointer",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
              >
                <option value="patient">👤 {t("login.role_patient_opt", "Patient — Health Checkups & 3D Digital Twin")}</option>
                <option value="doctor">🩺 {t("login.role_doctor_opt", "Doctor / Clinician — OPD Queue & Telemedicine")}</option>
                <option value="admin">🛡️ {t("login.role_admin_opt", "System Administrator — Governance & Audit Trail")}</option>
              </select>
              <ChevronDown
                size={16}
                color="#64748B"
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
            </div>
          </div>

          {/* 2. Visual Role Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
              width: "100%",
              marginBottom: "16px",
            }}
          >
            {[
              { id: "patient", label: t("login.role_patient", "Patient"), sub: t("login.role_patient_sub", "Personal"), color: "#059669", bg: "#F0FDF4", border: "#A7F3D0", icon: User },
              { id: "doctor", label: t("login.role_doctor", "Doctor"), sub: t("login.role_doctor_sub", "Clinician"), color: "#0284C7", bg: "#F0F9FF", border: "#BAE6FD", icon: Stethoscope },
              { id: "admin", label: t("login.role_admin", "Admin"), sub: t("login.role_admin_sub", "Security"), color: "#7C3AED", bg: "#FAF5FF", border: "#E9D5FF", icon: ShieldCheck },
            ].map((r) => {
              const Icon = r.icon;
              const isActive = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "3px",
                    padding: "8px 4px",
                    borderRadius: "8px",
                    border: isActive ? `2px solid ${r.color}` : "1px solid #E2E8F0",
                    background: isActive ? r.bg : "#F8FAFC",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Icon size={16} color={isActive ? r.color : "#64748B"} />
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: isActive ? r.color : "#334155" }}>
                    {r.label}
                  </span>
                  <span style={{ fontSize: "0.62rem", color: "#64748B" }}>{r.sub}</span>
                </button>
              );
            })}
          </div>

          {/* 3. Auth Mode Switcher (Sign In vs Register) */}
          <div
            style={{
              display: "flex",
              background: "#F1F5F9",
              padding: "3px",
              borderRadius: "8px",
              width: "100%",
              marginBottom: "16px",
            }}
          >
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              style={{
                flex: 1,
                padding: "6px 0",
                fontSize: "0.78rem",
                fontWeight: 700,
                borderRadius: "6px",
                border: "none",
                background: authMode === "login" ? "#FFFFFF" : "transparent",
                color: authMode === "login" ? "#0F172A" : "#64748B",
                boxShadow: authMode === "login" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {t("login.sign_in", "Sign In")}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("register")}
              style={{
                flex: 1,
                padding: "6px 0",
                fontSize: "0.78rem",
                fontWeight: 700,
                borderRadius: "6px",
                border: "none",
                background: authMode === "register" ? "#FFFFFF" : "transparent",
                color: authMode === "register" ? "#0F172A" : "#64748B",
                boxShadow: authMode === "register" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {t("login.register", "Create Account")}
            </button>
          </div>

          {/* 4. Credentials Form */}
          {authMode === "login" ? (
            <form onSubmit={handleCredentialSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ textAlign: "left" }}>
                <label style={{ display: "block", fontSize: "0.70rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "4px" }}>
                  {t("login.username_label", "Username / Handle")}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={
                      selectedRole === "doctor"
                        ? t("login.username_ph_doctor", "e.g. dr.kavita")
                        : selectedRole === "admin"
                        ? t("login.username_ph_admin", "e.g. admin.audit")
                        : t("login.username_ph_patient", "e.g. alex.patient")
                    }
                    autoComplete="username"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      paddingLeft: "36px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.88rem",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                  <User size={16} color="#94A3B8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                </div>
              </div>

              <div style={{ textAlign: "left" }}>
                <label style={{ display: "block", fontSize: "0.70rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "4px" }}>
                  {t("login.password_label", "Password")}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("login.password_placeholder", "Enter account password")}
                    autoComplete="current-password"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      paddingLeft: "36px",
                      paddingRight: "36px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.88rem",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                  <KeyRound size={16} color="#94A3B8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      color: "#94A3B8",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || loading}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    selectedRole === "doctor"
                      ? "#0284C7"
                      : selectedRole === "admin"
                      ? "#7C3AED"
                      : "#059669",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "4px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  transition: "opacity 0.2s ease",
                }}
              >
                <LogIn size={16} />
                <span>
                  {submitting ? t("login.signing_in", "Authenticating...") : `${t("login.sign_in_as", "Sign in as")} ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
                </span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ textAlign: "left" }}>
                <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "3px" }}>
                  {t("login.full_name_label", "Full Legal Name")}
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Dr. Aryan Sharma / Alex Patient"
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.84rem", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ textAlign: "left" }}>
                <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "3px" }}>
                  {t("login.email_label", "Email Address")}
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@hospital.org"
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.84rem", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div style={{ textAlign: "left" }}>
                  <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "3px" }}>
                    {t("login.username_label", "Username")}
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="handle"
                    required
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.84rem", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ textAlign: "left" }}>
                  <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "3px" }}>
                    {t("login.password_label", "Password")}
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.84rem", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || loading}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: selectedRole === "doctor" ? "#0284C7" : selectedRole === "admin" ? "#7C3AED" : "#059669",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "4px",
                }}
              >
                <UserPlus size={16} />
                <span>{submitting ? t("login.registering", "Registering...") : `${t("login.register_as", "Register as")} ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}</span>
              </button>
            </form>
          )}

          {/* Google Sign-In with Selected Role */}
          <div style={{ width: "100%", marginTop: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} />
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>{t("common.or", "Or")}</span>
              <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} />
            </div>

            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading || gisLoading}
              className="editorial-google-btn"
              style={{ width: "100%", boxSizing: "border-box" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
              </svg>
              <span>
                  {loading || gisLoading
                    ? t("common.loading", "Connecting...")
                    : `${t("login.google_btn", "Continue with Google as")} ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
              </span>
            </button>
          </div>

          {/* 7. Error Display */}
          {(error || localError) && (
            <div
              style={{
                marginTop: "14px",
                padding: "8px 12px",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "6px",
                color: "#DC2626",
                fontSize: "0.80rem",
                fontWeight: 600,
                width: "100%",
                boxSizing: "border-box",
                textAlign: "left",
              }}
            >
              {error || localError}
            </div>
          )}

          {/* 8. HIPAA & ABDM Compliance Footer Badge */}
          <div
            style={{
              marginTop: "16px",
              padding: "8px 10px",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "6px",
              width: "100%",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ShieldCheck size={14} color="#059669" />
            <span style={{ fontSize: "0.70rem", color: "#64748B", lineHeight: 1.3 }}>
              {t("login.hipaa_notice", "Protected under HIPAA, ABDM M1-M3 & ISO 27001 cryptographic security protocols.")}
            </span>
          </div>
        </div>
      </main>

      {/* ── Sign to Scroll Down to Quantum Models ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "auto",
          paddingTop: "12px",
          paddingBottom: "clamp(8px, 1.5vh, 16px)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          onClick={() => {
            const el = document.getElementById("quantum-model-benchmarks");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="scroll-cue-pill"
        >
          {/* Pulsing Radar Dot Matching User Screenshot */}
          <span
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "16px",
              height: "16px",
            }}
          >
            <span
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                backgroundColor: "#10B981",
                opacity: 0.35,
                animation: "pingRing 2s cubic-bezier(0, 0, 0.2, 1) infinite",
              }}
            />
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#059669",
                display: "inline-block",
              }}
            />
          </span>

          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "#0F172A",
              fontFamily: "var(--font-sans, inherit)",
              letterSpacing: "-0.01em",
            }}
          >
            {t("login.scroll_cue", "Scroll down to explore Quantum vs Classical Models & Clinical Benchmarks")}
          </span>

          <ArrowDown size={14} color="#059669" className="scroll-arrow-anim" />
        </div>
      </div>
    </div>

    {/* ── Section: Quantum Model Benchmark Showcase (Directly below hero with per-disease theme transitions) ── */}
    <ModelEvaluationShowcase />

    {/* ── Section: Research Objectives Compliance Matrix (OBJ-01 – OBJ-06) ── */}
    <section
      style={{
        margin: "clamp(32px, 5vw, 64px) clamp(16px, 3.5vw, 48px) 0 clamp(16px, 3.5vw, 48px)",
        background: "#0C0D12",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        padding: "clamp(20px, 3.5vw, 40px)",
        position: "relative",
        zIndex: 10,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "20px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "4px 12px",
                background: "rgba(56, 189, 248, 0.1)",
                color: "#38BDF8",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                borderRadius: "9999px",
                letterSpacing: "0.06em",
                fontFamily: "var(--font-sans, inherit)",
                textTransform: "uppercase",
              }}
            >
              Research Compliance
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                color: "#94A3B8",
                fontFamily: "var(--font-sans, inherit)",
              }}
            >
              Quantum-Classical ML Audit
            </span>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-sans, inherit)",
              fontSize: "clamp(1.3rem, 2.2vw, 1.8rem)",
              fontWeight: 700,
              color: "#FFFFFF",
              margin: "0 0 8px 0",
              letterSpacing: "-0.015em",
            }}
          >
            Research Objectives Compliance (OBJ-01 – OBJ-06)
          </h2>
          <p
            style={{
              fontSize: "0.88rem",
              color: "#94A3B8",
              margin: 0,
              lineHeight: 1.6,
              maxWidth: "780px",
              fontFamily: "var(--font-sans, inherit)",
            }}
          >
            Evidence-based verification matrix auditing all defined research objectives against verified codebase implementations, mathematically audited pipelines, and zero-leakage protocols.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <a
            href="https://github.com/ARYANCY/QDoc/blob/main/documentation/objectives/README.md"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "#FFFFFF",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              padding: "7px 14px",
              borderRadius: "8px",
              fontFamily: "var(--font-sans, inherit)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#FFFFFF";
              e.currentTarget.style.color = "#000000";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
              e.currentTarget.style.color = "#FFFFFF";
            }}
          >
            <ExternalLink size={12} />
            <span>Documentation Portal</span>
          </a>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#34D399",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              padding: "7px 14px",
              borderRadius: "9999px",
              fontFamily: "var(--font-sans, inherit)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CheckCircle2 size={13} color="#34D399" /> 6 / 6 SATISFIED
          </span>
        </div>
      </div>

      {/* Objectives Data Table - Clean Minimalist */}
      <div
        style={{
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "12px",
          background: "#08090C",
        }}
      >
        <table style={{ width: "100%", minWidth: "780px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
          <thead>
            <tr
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                color: "#94A3B8",
                fontFamily: "var(--font-sans, inherit)",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              <th style={{ padding: "14px 16px", width: "80px" }}>ID</th>
              <th style={{ padding: "14px 16px", width: "230px" }}>Research Objective</th>
              <th style={{ padding: "14px 16px" }}>Implementation & Code Evidence</th>
              <th style={{ padding: "14px 16px", width: "190px" }}>Repository Reference</th>
              <th style={{ padding: "14px 16px", textAlign: "right", width: "130px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                id: "OBJ-01",
                title: "Hybrid Quantum-Classical Architecture for Early Disease Detection",
                evidence: "Classical preprocessing pipeline (ml/preprocessing/validation.py), train-only PCA dimensionality reduction, PennyLane VQC/VQR circuits, and UnifiedMedicalPredictor with conformal calibration.",
                readmeAnchor: "https://github.com/ARYANCY/QDoc/blob/main/documentation/objectives/OBJ-01_hybrid_quantum_classical_pipeline.md",
                readmeLabel: "objectives / obj-01",
                status: "SATISFIED",
              },
              {
                id: "OBJ-02",
                title: "High-Dimensional Quantum Classification & Continuous Regression",
                evidence: "BiomedCLIP (512-dim) / MedSigLIP (768-dim) foundation encoders, train-only compression into <=8 qubits, and VariationalQuantumRegressor with Pauli-Z expectations for continuous targets (Parkinson's UPDRS).",
                readmeAnchor: "https://github.com/ARYANCY/QDoc/blob/main/documentation/objectives/OBJ-02_high_dimensional_encoders_continuous_regression.md",
                readmeLabel: "objectives / obj-02",
                status: "SATISFIED",
              },
              {
                id: "OBJ-03",
                title: "Accuracy, Sensitivity, and Specificity vs Classical Baselines",
                evidence: "Standardized ClassicalBaselineSuite and ClassicalRegressionSuite under identical 5-seed patient-level stratified split (Seeds: 7, 21, 42, 73, 101); full metrics and confusion matrices with zero fabricated claims.",
                readmeAnchor: "https://github.com/ARYANCY/QDoc/blob/main/documentation/objectives/OBJ-03_benchmarks_vs_classical_baselines.md",
                readmeLabel: "objectives / obj-03",
                status: "SATISFIED",
              },
              {
                id: "OBJ-04",
                title: "Scalability, Interpretability & Quantum Hardware Compatibility",
                evidence: "HardwareProviderRegistry modeling IBM Quantum Eagle (127Q), AWS Rigetti (80Q), and IonQ Forte (36Q) with T1/T2 noise; Grad-CAM Turbo saliency, KernelSHAP feature contributions, and qubit sensitivity.",
                readmeAnchor: "https://github.com/ARYANCY/QDoc/blob/main/documentation/objectives/OBJ-04_scalability_interpretability_qpu_compatibility.md",
                readmeLabel: "objectives / obj-04",
                status: "SATISFIED",
              },
              {
                id: "OBJ-05",
                title: "Preprocessing, Feature Selection & Zero Data Leakage",
                evidence: "ClinicalTabularPreprocessor (median imputation, IQR outlier clipping, MinMax scaling) + PatientGroupedSplitter (GroupShuffleSplit across patient_id) with automated mathematical leakage audits.",
                readmeAnchor: "https://github.com/ARYANCY/QDoc/blob/main/documentation/objectives/OBJ-05_preprocessing_feature_selection_zero_leakage.md",
                readmeLabel: "objectives / obj-05",
                status: "SATISFIED",
              },
              {
                id: "OBJ-06",
                title: "Scientific Benchmarking (Accuracy, Efficiency & Generalization)",
                evidence: "AblationMatrixRunner executing standard Experiments A-F; tracemalloc peak memory profiling, 1000-resample bootstrap 95% CIs, quantum gate/depth telemetry, and continuous regression benchmarking.",
                readmeAnchor: "https://github.com/ARYANCY/QDoc/blob/main/documentation/objectives/OBJ-06_scientific_benchmarking_telemetry_bootstrapping.md",
                readmeLabel: "objectives / obj-06",
                status: "SATISFIED",
              },
            ].map((item, index) => (
              <tr
                key={item.id}
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  background: index % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = index % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)")}
              >
                <td style={{ padding: "16px", fontFamily: "var(--font-sans, inherit)", color: "#38BDF8", fontSize: "0.78rem", fontWeight: 700 }}>
                  {item.id}
                </td>
                <td style={{ padding: "16px", color: "#F8FAFC", fontWeight: 600, lineHeight: 1.4, fontFamily: "var(--font-sans, inherit)", fontSize: "0.88rem" }}>
                  {item.title}
                </td>
                <td style={{ padding: "16px", color: "#94A3B8", lineHeight: 1.55, fontSize: "0.82rem", fontFamily: "var(--font-sans, inherit)" }}>
                  {item.evidence}
                </td>
                <td style={{ padding: "16px" }}>
                  <a
                    href={item.readmeAnchor}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.74rem",
                      color: "#E2E8F0",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      padding: "5px 10px",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontFamily: "var(--font-sans, inherit)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#FFFFFF";
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
                    }}
                  >
                    <span>{item.readmeLabel}</span>
                    <ExternalLink size={11} />
                  </a>
                </td>
                <td style={{ padding: "16px", textAlign: "right" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "0.70rem",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      background: "rgba(16, 185, 129, 0.12)",
                      color: "#34D399",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      fontFamily: "var(--font-sans, inherit)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    <CheckCircle2 size={11} color="#34D399" />
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>


    {/* Clean Minimalist Footer */}
    <footer
      style={{
        margin: "80px clamp(24px, 3.5vw, 48px) 0 clamp(24px, 3.5vw, 48px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        paddingTop: "32px",
        paddingBottom: "40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        position: "relative",
        zIndex: 10,
        fontFamily: "var(--font-sans, inherit)",
        fontSize: "0.78rem",
        color: "#64748B",
      }}
    >
      <div>
        &copy; 2026 Q-Rakshak • Clinical Audit & Quantum Benchmarks
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
        <a
          href="https://github.com/Rajdeep-Mudiar/Q-Rakshak"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#94A3B8",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
        >
          <span>GitHub Repository</span>
          <ExternalLink size={11} />
        </a>
        <span
          style={{ cursor: "pointer", transition: "color 0.15s ease" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
        >
          Privacy Protocol
        </span>
        <span
          style={{ cursor: "pointer", transition: "color 0.15s ease" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
        >
          Governance & Terms
        </span>
      </div>
    </footer>
  </div>
);
}
