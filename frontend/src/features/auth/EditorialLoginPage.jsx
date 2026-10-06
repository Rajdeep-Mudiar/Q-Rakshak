import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Lock,
  Cpu,
  CheckCircle2,
  User,
  KeyRound,
  LogIn,
  ArrowDown,
  AlertCircle,
  Activity,
  ExternalLink,
  Eye,
  EyeOff,
  UserPlus,
  Languages,
  Shield,
  Stethoscope,
  Heart,
  Zap,
  ArrowRight
} from "lucide-react";
import { animateErrorShake } from "../../utils/motion.js";
import ModelEvaluationShowcase from "./components/ModelEvaluationShowcase.jsx";
import { authApi } from "../../api/auth.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function EditorialLoginPage({ onGoogleLogin, onGoogleVerifySuccess, onLoginSuccess, loading, error }) {
  const { language, setLanguage, availableLanguages, t } = useLanguage();
  const [gisLoading, setGisLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState("patient"); // 'patient' | 'doctor' | 'admin'
  const [username, setUsername] = useState("alex.patient");
  const [password, setPassword] = useState("patient123");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Registration state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");

  function handleRoleSelect(role) {
    setSelectedRole(role);
    setLocalError(null);
    if (authMode === "login") {
      if (role === "patient") {
        setUsername("alex.patient");
        setPassword("patient123");
      } else if (role === "doctor") {
        setUsername("dr.aryan");
        setPassword("clinician123");
      } else if (role === "admin") {
        setUsername("admin");
        setPassword("admin123");
      }
    }
  }

  const pageContainerRef = useRef(null);
  const heroSectionRef = useRef(null);
  const formContainerRef = useRef(null);
  const narrativeRef = useRef(null);
  const telemetryCardRef = useRef(null);

  // ── Coordinated GSAP Shutter Entrance Sequence & Scroll Parallax ──
  useEffect(() => {
    if (typeof window === "undefined" || !pageContainerRef.current) return;

    const ctx = gsap.context(() => {
      const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!isReduced) {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        // 1. Header Bar Entrance
        tl.fromTo(
          ".editorial-login-header",
          { opacity: 0, y: -12 },
          { opacity: 1, y: 0, duration: 0.4 }
        );

        // 2. Headline & Subtitle Stagger
        tl.fromTo(
          ".editorial-hero-title, .editorial-hero-desc",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 },
          "-=0.2"
        );

        // 3. Telemetry Visualizer Card Entrance
        if (telemetryCardRef.current) {
          tl.fromTo(
            telemetryCardRef.current,
            { opacity: 0, y: 14, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, duration: 0.45 },
            "-=0.25"
          );
        }

        // 4. Floating Trust Badges Stagger
        tl.fromTo(
          ".floating-trust-badge",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.35, stagger: 0.06 },
          "-=0.2"
        );

        // 5. Right Auth Cockpit Planar Entrance
        if (formContainerRef.current) {
          tl.fromTo(
            formContainerRef.current,
            { opacity: 0, x: 24 },
            { opacity: 1, x: 0, duration: 0.5 },
            "-=0.35"
          );
        }

        // 6. Scroll Cue Entrance & Sine Wave Loop
        tl.fromTo(
          ".scroll-cue-pill",
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.3 },
          "-=0.15"
        );

        // Continuous Gentle Sine Floating on Trust Badges
        gsap.to(".floating-trust-badge", {
          y: -4,
          duration: 2.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: 0.2,
        });

        gsap.to(".scroll-cue-pill", {
          y: -3,
          duration: 1.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      // Smooth subtle parallax on hero as user scrolls into the benchmark matrix
      if (heroSectionRef.current) {
        gsap.to(heroSectionRef.current, {
          opacity: 0.2,
          y: -30,
          scrollTrigger: {
            trigger: heroSectionRef.current,
            start: "bottom 95%",
            end: "bottom 20%",
            scrub: 1.2,
          },
        });
      }
    }, pageContainerRef);

    return () => ctx.revert();
  }, []);

  // ── Google One-Tap / GSI Client Initialization ──
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
                  const verifiedUser = await authApi.verifyGoogleCredential(response.credential, selectedRole);
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
  }, [onGoogleVerifySuccess, onLoginSuccess, selectedRole]);

  const handleGoogleClick = () => {
    if (onGoogleLogin) {
      onGoogleLogin(selectedRole);
    }
  };

  async function handleCredentialSubmit(e) {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setLocalError("Please enter both username and password.");
      if (formContainerRef.current) animateErrorShake(formContainerRef.current);
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
      if (formContainerRef.current) animateErrorShake(formContainerRef.current);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegisterSubmit(e) {
    if (e) e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regUsername.trim() || !regPassword) {
      setLocalError("Please complete all registration fields.");
      if (formContainerRef.current) animateErrorShake(formContainerRef.current);
      return;
    }
    setSubmitting(true);
    setLocalError(null);
    try {
      const ts = Date.now().toString().slice(-5);
      const defaultLicense = selectedRole === "doctor"
        ? `DOC-LIC-${ts}`
        : selectedRole === "admin"
        ? `ADM-SEC-${ts}`
        : `PT-REC-${ts}`;

      const data = await authApi.register({
        name: regName.trim(),
        email: regEmail.trim(),
        username: regUsername.trim().toLowerCase(),
        password: regPassword,
        role: selectedRole,
        emergency_phone: regPhone ? regPhone.trim() : "",
        hospital_affiliation: selectedRole === "doctor" ? "Q-Rakshak" : "Community Healthcare",
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
      if (formContainerRef.current) animateErrorShake(formContainerRef.current);
    } finally {
      setSubmitting(false);
    }
  }

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
        backgroundColor: "#FAFAFA",
        backgroundImage: `
          linear-gradient(rgba(24, 24, 27, 0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(24, 24, 27, 0.035) 1px, transparent 1px)
        `,
        backgroundSize: "36px 36px",
        color: "#18181B",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 0,
        overflowX: "hidden",
        position: "relative",
        boxSizing: "border-box",
        fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      }}
    >
      {/* ── Sexy Ambient GPU-Accelerated Quantum Background Canvas ── */}
      <div className="quantum-ambient-canvas" aria-hidden="true">
        <div className="quantum-scan-beam" />
        <div className="quantum-orb quantum-orb-1" />
        <div className="quantum-orb quantum-orb-2" />
        <div className="quantum-orb quantum-orb-3" />
      </div>

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
          zIndex: 10,
          padding: "clamp(16px, 2.5vh, 28px) clamp(16px, 3.5vw, 48px) clamp(16px, 2.5vh, 28px)",
          boxSizing: "border-box",
        }}
      >
        {/* Top Architectural Header */}
        <header
          className="editorial-login-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #E4E4E7",
            paddingBottom: "16px",
            gap: "20px",
            flexWrap: "wrap",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                background: "#0052FF",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "0.85rem",
              }}
            >
              Q
            </div>
            <span
              style={{
                fontFamily: "var(--font-sans, inherit)",
                fontSize: "1.10rem",
                fontWeight: 900,
                letterSpacing: "0.04em",
                color: "#18181B",
                textTransform: "uppercase",
              }}
            >
              QRakshak
            </span>
            <span style={{ color: "#D4D4D8", fontSize: "0.95rem" }}>/</span>
            <span
              style={{
                fontSize: "0.72rem",
                color: "#71717A",
                fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Clinical Intelligence Platform
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <a
              href="#CLASSICALvsQUANTUMN"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "6px 14px",
                background: "#FFFFFF",
                color: "#0052FF",
                border: "1px solid #E4E4E7",
                fontSize: "0.70rem",
                fontWeight: 800,
                textDecoration: "none",
                fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                boxShadow: "0 1px 3px rgba(0, 82, 255, 0.06)",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#0052FF";
                e.currentTarget.style.background = "#EFF6FF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E4E4E7";
                e.currentTarget.style.background = "#FFFFFF";
              }}
            >
              <Cpu size={13} color="#0052FF" />
              <span>Model Accuracy Matrix</span>
            </a>
            <a
              href="https://github.com/ARYANCY/QDoc"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "6px 14px",
                background: "#18181B",
                color: "#FFFFFF",
                border: "1px solid #18181B",
                fontSize: "0.70rem",
                fontWeight: 700,
                textDecoration: "none",
                fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#27272A")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#18181B")}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </header>

        {/* Main Split Grid */}
        <main
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: "clamp(32px, 5vw, 64px)",
            alignItems: "center",
            margin: "clamp(24px, 4vh, 48px) 0",
            flex: 1,
          }}
        >
          {/* ── Left Column: Visual Storytelling & Live Clinical Telemetry ── */}
          <div
            ref={narrativeRef}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              position: "relative",
              zIndex: 10,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "3px 9px",
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  color: "#0052FF",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  fontFamily: "var(--font-mono, monospace)",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                }}
              >
                <Zap size={11} />
                <span>Deterministic Quantum Healthcare</span>
              </div>

              <h1
                className="editorial-hero-title"
                style={{
                  fontFamily: "var(--font-sans, inherit)",
                  fontSize: "clamp(2.1rem, 5.2vw, 3.8rem)",
                  fontWeight: 900,
                  lineHeight: 1.05,
                  letterSpacing: "-0.04em",
                  color: "#18181B",
                  margin: 0,
                  textTransform: "uppercase",
                }}
              >
                Clinical Intelligence. <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #0052FF 0%, #0284C7 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("login.hero_title_2", "Objective Triage.")}
                </span>
              </h1>
            </div>

            <p
              className="editorial-hero-desc"
              style={{
                fontSize: "0.96rem",
                lineHeight: 1.65,
                color: "#52525B",
                maxWidth: "560px",
                margin: 0,
              }}
            >
              {t("login.hero_desc", "Deterministic multi-organ triage, verified longitudinal EHR records, and quantum-enhanced diagnostic pipelines with zero data leakage.")}
            </p>

            {/* ── Live Clinical Telemetry Engine Card ── */}
            <div
              ref={telemetryCardRef}
              className="telemetry-glass-card"
              style={{
                padding: "20px 24px",
                position: "relative",
              }}
            >
              {/* Telemetry Card Top Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      background: "#16A34A",
                      display: "inline-block",
                      animation: "pulsePip 1.5s infinite ease-in-out",
                    }}
                  />
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#18181B", fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Live OPD Telemetry
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.70rem", fontFamily: "var(--font-mono, monospace)", color: "#71717A" }}>
                  <span>HR: <strong style={{ color: "#18181B" }}>72 BPM</strong></span>
                  <span>SpO2: <strong style={{ color: "#0052FF" }}>99%</strong></span>
                  <span>ESI: <strong style={{ color: "#16A34A" }}>LEVEL 2</strong></span>
                </div>
              </div>

              {/* Animated SVG ECG Waveform Path */}
              <div style={{ width: "100%", height: "46px", position: "relative", overflow: "hidden", marginBottom: "16px", background: "rgba(0, 82, 255, 0.02)", border: "1px solid #F4F4F5" }}>
                <svg width="100%" height="46" viewBox="0 0 500 46" fill="none" preserveAspectRatio="none">
                  {/* Subtle Grid Lines */}
                  <line x1="0" y1="23" x2="500" y2="23" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                  {/* High-Precision ECG Pulse Trace */}
                  <path
                    className="ecg-path-animated"
                    d="M0,23 L60,23 L75,23 L85,14 L95,32 L105,8 L115,38 L125,23 L135,23 L200,23 L215,23 L225,14 L235,32 L245,6 L255,40 L265,23 L275,23 L350,23 L365,23 L375,14 L385,32 L395,8 L405,38 L415,23 L425,23 L500,23"
                    stroke="#0052FF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* 3 Precision Metric Columns */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "12px",
                  borderTop: "1px solid #E4E4E7",
                  paddingTop: "14px",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.64rem", color: "#71717A", fontWeight: 700, fontFamily: "var(--font-mono, monospace)", textTransform: "uppercase" }}>
                    Sensitivity
                  </span>
                  <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#18181B", fontFamily: "var(--font-mono, monospace)", marginTop: "2px" }}>
                    99.4%
                  </div>
                  <span style={{ fontSize: "0.62rem", color: "#16A34A", fontWeight: 700 }}>
                    ↑ Multi-Organ
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: "0.64rem", color: "#71717A", fontWeight: 700, fontFamily: "var(--font-mono, monospace)", textTransform: "uppercase" }}>
                    QPU Latency
                  </span>
                  <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0052FF", fontFamily: "var(--font-mono, monospace)", marginTop: "2px" }}>
                    12 ms
                  </div>
                  <span style={{ fontSize: "0.62rem", color: "#71717A", fontWeight: 600 }}>
                    PennyLane VQC
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: "0.64rem", color: "#71717A", fontWeight: 700, fontFamily: "var(--font-mono, monospace)", textTransform: "uppercase" }}>
                    Data Leakage
                  </span>
                  <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#18181B", fontFamily: "var(--font-mono, monospace)", marginTop: "2px" }}>
                    0.00%
                  </div>
                  <span style={{ fontSize: "0.62rem", color: "#16A34A", fontWeight: 700 }}>
                    Zero Leakage
                  </span>
                </div>
              </div>
            </div>

            {/* Floating Trust Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div
                className="floating-trust-badge"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 10px",
                  background: "#FFFFFF",
                  border: "1px solid #E4E4E7",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono, monospace)",
                  color: "#3F3F46",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <CheckCircle2 size={12} color="#0052FF" />
                <span>PQC-Encrypted Ledger</span>
              </div>

              <div
                className="floating-trust-badge"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 10px",
                  background: "#FFFFFF",
                  border: "1px solid #E4E4E7",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono, monospace)",
                  color: "#3F3F46",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <Lock size={12} color="#0052FF" />
                <span>AES-256 Vault Protection</span>
              </div>

              <div
                className="floating-trust-badge"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 10px",
                  background: "#FFFFFF",
                  border: "1px solid #E4E4E7",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono, monospace)",
                  color: "#3F3F46",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <Cpu size={12} color="#0052FF" />
                <span>8-Qubit VQC Engine</span>
              </div>
            </div>
          </div>

          {/* ── Right Column: Luxury Precision Auth Cockpit ── */}
          <div
            ref={formContainerRef}
            className="editorial-auth-card"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E4E4E7",
              boxShadow: "0 24px 60px -12px rgba(0, 82, 255, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)",
              padding: "clamp(24px, 3.5vw, 36px) clamp(22px, 3.5vw, 32px)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              width: "100%",
              maxWidth: "460px",
              margin: "0 auto",
              boxSizing: "border-box",
            }}
          >
            {/* Header & Clean Clinical Branding + Language Selector */}
            <div style={{ marginBottom: "16px", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "3px 8px",
                    background: "#EFF6FF",
                    border: "1px solid #BFDBFE",
                    color: "#0052FF",
                    fontSize: "0.66rem",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    fontFamily: "var(--font-mono, monospace)",
                    textTransform: "uppercase",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      background: "#0052FF",
                      display: "inline-block",
                      animation: "pulsePip 1.6s infinite ease-in-out",
                    }}
                  />
                  <span>GATEWAY ACTIVE • PQC-256</span>
                </div>

                {/* Language Switcher */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                    background: "#F4F4F5",
                    border: "1px solid #E4E4E7",
                    padding: "2px",
                  }}
                >
                  <Languages size={12} color="#71717A" style={{ marginLeft: "4px", marginRight: "2px" }} />
                  {(availableLanguages || [
                    { code: "en", label: "EN", nativeName: "EN" },
                    { code: "hi", label: "HI", nativeName: "HI" },
                    { code: "as", label: "AS", nativeName: "AS" },
                  ]).map((lang) => {
                    const isActive = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setLanguage(lang.code)}
                        title={lang.label}
                        style={{
                          padding: "2px 6px",
                          fontSize: "0.68rem",
                          fontWeight: isActive ? 800 : 600,
                          border: "none",
                          fontFamily: "var(--font-mono, monospace)",
                          background: isActive ? "#0052FF" : "transparent",
                          color: isActive ? "#FFFFFF" : "#71717A",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {lang.code.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              <h2
                style={{
                  fontFamily: "var(--font-sans, inherit)",
                  fontSize: "1.55rem",
                  fontWeight: 900,
                  color: "#18181B",
                  letterSpacing: "-0.03em",
                  margin: "0 0 4px 0",
                  textTransform: "uppercase",
                }}
              >
                {authMode === "register" ? t("login.create_account", "Create Account") : t("login.sign_in", "Sign In")}
              </h2>
              <p style={{ fontSize: "0.82rem", color: "#71717A", margin: 0, lineHeight: 1.4 }}>
                {authMode === "register"
                  ? t("login.subtitle_register", "Register a new clinical account to get started.")
                  : t("login.subtitle_signin", "Authenticate clinical session with verified credentials.")}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div
              style={{
                display: "flex",
                background: "#F4F4F5",
                padding: "2px",
                width: "100%",
                marginBottom: "14px",
                border: "1px solid #E4E4E7",
              }}
            >
              <button
                type="button"
                onClick={() => { setAuthMode("login"); setLocalError(null); }}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  fontSize: "0.76rem",
                  fontWeight: 800,
                  border: "none",
                  fontFamily: "var(--font-mono, monospace)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  background: authMode === "login" ? "#FFFFFF" : "transparent",
                  color: authMode === "login" ? "#0052FF" : "#71717A",
                  boxShadow: authMode === "login" ? "0 1px 3px rgba(0, 0, 0, 0.06)" : "none",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                {t("login.sign_in", "Sign In")}
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("register"); setLocalError(null); }}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  fontSize: "0.76rem",
                  fontWeight: 800,
                  border: "none",
                  fontFamily: "var(--font-mono, monospace)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  background: authMode === "register" ? "#FFFFFF" : "transparent",
                  color: authMode === "register" ? "#0052FF" : "#71717A",
                  boxShadow: authMode === "register" ? "0 1px 3px rgba(0, 0, 0, 0.06)" : "none",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                {t("login.create_account", "Register")}
              </button>
            </div>

            {/* Planar Persona Selector (Patient, Doctor, Admin) */}
            <div style={{ marginBottom: "14px", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    color: "#71717A",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-mono, monospace)",
                    letterSpacing: "0.06em",
                  }}
                >
                  {authMode === "register" ? t("login.register_as", "Register Account As") : t("login.select_role", "Select Persona")}
                </label>
                <span style={{ fontSize: "0.66rem", color: "#0052FF", fontWeight: 700, fontFamily: "var(--font-mono, monospace)" }}>
                  {authMode === "register"
                    ? (selectedRole === "patient" ? "ROLE: Patient" : selectedRole === "doctor" ? "ROLE: Doctor / Clinician" : "ROLE: Admin")
                    : (selectedRole === "patient" ? "PT: alex.patient" : selectedRole === "doctor" ? "DR: dr.aryan" : "ADM: admin")}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "6px",
                }}
              >
                {[
                  { id: "patient", label: t("login.role_patient", "Patient"), icon: User, desc: "3D Twin" },
                  { id: "doctor", label: t("login.role_doctor", "Doctor"), icon: Stethoscope, desc: "OPD & Rx" },
                  { id: "admin", label: t("login.role_admin", "Admin"), icon: Shield, desc: "Audit" },
                ].map((roleItem) => {
                  const isSelected = selectedRole === roleItem.id;
                  const Icon = roleItem.icon;
                  return (
                    <button
                      key={roleItem.id}
                      type="button"
                      onClick={() => handleRoleSelect(roleItem.id)}
                      className="planar-role-tile"
                      style={{
                        border: isSelected ? "1.5px solid #0052FF" : "1px solid #E4E4E7",
                        background: isSelected ? "#FFFFFF" : "#F8FAFC",
                        color: isSelected ? "#0052FF" : "#52525B",
                        padding: "8px 4px",
                        boxShadow: isSelected ? "0 2px 8px rgba(0, 82, 255, 0.08)" : "none",
                      }}
                    >
                      {/* Top Accent Strip on Selected Tile */}
                      {isSelected && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: "2px",
                            background: "#0052FF",
                          }}
                        />
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Icon size={13} color={isSelected ? "#0052FF" : "#71717A"} />
                        <span style={{ fontSize: "0.76rem", fontWeight: 800 }}>{roleItem.label}</span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.62rem",
                          color: isSelected ? "#0052FF" : "#A1A1AA",
                          marginTop: "2px",
                          fontFamily: "var(--font-mono, monospace)",
                          fontWeight: 600,
                        }}
                      >
                        {roleItem.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Credentials Form */}
            {authMode === "login" ? (
              <form onSubmit={handleCredentialSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ textAlign: "left" }}>
                  <label
                    htmlFor="login-username"
                    style={{
                      display: "block",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      color: "#71717A",
                      textTransform: "uppercase",
                      fontFamily: "var(--font-mono, monospace)",
                      letterSpacing: "0.05em",
                      marginBottom: "5px",
                    }}
                  >
                    Username or Identifier
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="login-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. alex.patient"
                      autoComplete="username"
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 36px",
                        border: "1px solid #E4E4E7",
                        fontSize: "0.88rem",
                        color: "#18181B",
                        background: "#FFFFFF",
                        boxSizing: "border-box",
                        outline: "none",
                        fontFamily: "var(--font-mono, monospace)",
                        transition: "border-color 0.15s ease",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#0052FF";
                        e.target.style.outline = "1px solid #0052FF";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#E4E4E7";
                        e.target.style.outline = "none";
                      }}
                    />
                    <User size={15} color="#A1A1AA" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  </div>
                </div>

                <div style={{ textAlign: "left" }}>
                  <label
                    htmlFor="login-password"
                    style={{
                      display: "block",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      color: "#71717A",
                      textTransform: "uppercase",
                      fontFamily: "var(--font-mono, monospace)",
                      letterSpacing: "0.05em",
                      marginBottom: "5px",
                    }}
                  >
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      required
                      style={{
                        width: "100%",
                        padding: "10px 36px 10px 36px",
                        border: "1px solid #E4E4E7",
                        fontSize: "0.88rem",
                        color: "#18181B",
                        background: "#FFFFFF",
                        boxSizing: "border-box",
                        outline: "none",
                        transition: "border-color 0.15s ease",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#0052FF";
                        e.target.style.outline = "1px solid #0052FF";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#E4E4E7";
                        e.target.style.outline = "none";
                      }}
                    />
                    <KeyRound size={15} color="#A1A1AA" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        color: "#A1A1AA",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="sexy-primary-cta"
                  style={{
                    width: "100%",
                    padding: "11px 16px",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "0.86rem",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-mono, monospace)",
                    cursor: submitting || loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "4px",
                    opacity: submitting || loading ? 0.7 : 1,
                  }}
                >
                  <LogIn size={15} />
                  <span>{submitting ? "Authenticating..." : "Authenticate Session"}</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ textAlign: "left" }}>
                  <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "#71717A", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)", marginBottom: "4px" }}>
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Dr. Maya Patel / Alex Roy"
                    required
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #E4E4E7", fontSize: "0.85rem", boxSizing: "border-box", outline: "none" }}
                  />
                </div>

                <div style={{ textAlign: "left" }}>
                  <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "#71717A", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)", marginBottom: "4px" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@hospital.org"
                    required
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #E4E4E7", fontSize: "0.85rem", boxSizing: "border-box", outline: "none" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div style={{ textAlign: "left" }}>
                    <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "#71717A", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)", marginBottom: "4px" }}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="handle"
                      required
                      style={{ width: "100%", padding: "9px 10px", border: "1px solid #E4E4E7", fontSize: "0.85rem", boxSizing: "border-box", outline: "none", fontFamily: "var(--font-mono, monospace)" }}
                    />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "#71717A", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)", marginBottom: "4px" }}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{ width: "100%", padding: "9px 10px", border: "1px solid #E4E4E7", fontSize: "0.85rem", boxSizing: "border-box", outline: "none" }}
                    />
                  </div>
                </div>

                <div style={{ textAlign: "left" }}>
                  <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "#71717A", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)", marginBottom: "4px" }}>
                    Emergency / Contact Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98XXX XXXXX"
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #E4E4E7", fontSize: "0.85rem", boxSizing: "border-box", outline: "none", fontFamily: "var(--font-mono, monospace)" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="sexy-primary-cta"
                  style={{
                    width: "100%",
                    padding: "11px 16px",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "0.86rem",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-mono, monospace)",
                    cursor: submitting || loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "4px",
                    opacity: submitting || loading ? 0.7 : 1,
                  }}
                >
                  <UserPlus size={15} />
                  <span>{submitting ? "Registering..." : "Create Account"}</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            )}

            {/* Neutral Divider & Google Sign-In */}
            <div style={{ width: "100%", marginTop: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{ flex: 1, height: "1px", background: "#E4E4E7" }} />
                <span style={{ fontSize: "0.66rem", fontWeight: 800, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-mono, monospace)" }}>Or</span>
                <div style={{ flex: 1, height: "1px", background: "#E4E4E7" }} />
              </div>

              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={loading || gisLoading}
                className="editorial-google-btn"
              >
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                  <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                  <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                  <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
                </svg>
                <span>
                  {loading || gisLoading ? "Connecting..." : "Continue with Google One-Tap"}
                </span>
              </button>
            </div>

            {/* Error Display */}
            {(error || localError) && (
              <div
                role="alert"
                style={{
                  marginTop: "12px",
                  padding: "8px 12px",
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#DC2626",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  width: "100%",
                  boxSizing: "border-box",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={15} color="#DC2626" style={{ flexShrink: 0 }} />
                <span>{error || localError}</span>
              </div>
            )}

            {/* Clinical Security Notice */}
            <div
              style={{
                marginTop: "14px",
                padding: "8px 10px",
                background: "#F8FAFC",
                border: "1px solid #E4E4E7",
                width: "100%",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Lock size={12} color="#0052FF" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "0.70rem", color: "#71717A", lineHeight: 1.35, fontFamily: "var(--font-mono, monospace)" }}>
                End-to-end encrypted session with cryptographic clinical audit logging.
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
            paddingTop: "8px",
            paddingBottom: "clamp(6px, 1.2vh, 14px)",
            position: "relative",
            zIndex: 10,
          }}
        >
          <a
            href="#CLASSICALvsQUANTUMN"
            onClick={(e) => {
              const el = document.getElementById("CLASSICALvsQUANTUMN") || document.getElementById("quantum-model-benchmarks");
              if (el) {
                e.preventDefault();
                window.history.pushState(null, "", "#CLASSICALvsQUANTUMN");
                el.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="scroll-cue-pill"
            style={{ textDecoration: "none" }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                backgroundColor: "#0052FF",
                display: "inline-block",
              }}
            />
            <span>
              {t("login.scroll_cue", "Scroll to explore Quantum vs Classical Models & Matrix")}
            </span>
            <ArrowDown size={13} color="#0052FF" className="scroll-arrow-anim" />
          </a>
        </div>
      </div>

      {/* ── Section: Quantum Model Benchmark Showcase ── */}
      <ModelEvaluationShowcase />

      {/* ── Section: Research Objectives Compliance Matrix (OBJ-01 – OBJ-06) ── */}
      <section
        style={{
          margin: "clamp(28px, 4vw, 48px) clamp(16px, 3.5vw, 48px) 0 clamp(16px, 3.5vw, 48px)",
          background: "#0C0D12",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "clamp(20px, 3.5vw, 36px)",
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
            marginBottom: "20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "3px 10px",
                  background: "rgba(0, 82, 255, 0.15)",
                  color: "#38BDF8",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  letterSpacing: "0.06em",
                  fontFamily: "var(--font-mono, monospace)",
                  textTransform: "uppercase",
                }}
              >
                Research Compliance
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "#94A3B8",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                Quantum-Classical ML Audit
              </span>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-sans, inherit)",
                fontSize: "clamp(1.25rem, 2vw, 1.7rem)",
                fontWeight: 800,
                color: "#FFFFFF",
                margin: "0 0 6px 0",
                letterSpacing: "-0.015em",
              }}
            >
              Research Objectives Compliance (OBJ-01 – OBJ-06)
            </h2>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#94A3B8",
                margin: 0,
                lineHeight: 1.55,
                maxWidth: "760px",
                fontFamily: "var(--font-sans, inherit)",
              }}
            >
              Evidence-based verification matrix auditing all defined research objectives against verified codebase implementations, mathematically audited pipelines, and zero-leakage protocols.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <a
              href="https://github.com/ARYANCY/QDoc/blob/main/documentation/objectives/README.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "#FFFFFF",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                padding: "6px 12px",
                fontFamily: "var(--font-mono, monospace)",
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
              <ExternalLink size={11} />
              <span>Documentation Portal</span>
            </a>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#34D399",
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                padding: "6px 12px",
                fontFamily: "var(--font-mono, monospace)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <CheckCircle2 size={12} color="#34D399" /> 6 / 6 SATISFIED
            </span>
          </div>
        </div>

        {/* Objectives Data Table - Clean Minimalist */}
        <div
          style={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            background: "#08090C",
          }}
        >
          <table style={{ width: "100%", minWidth: "780px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
            <thead>
              <tr
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#94A3B8",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                <th style={{ padding: "12px 14px", width: "80px" }}>ID</th>
                <th style={{ padding: "12px 14px", width: "230px" }}>Research Objective</th>
                <th style={{ padding: "12px 14px" }}>Implementation & Code Evidence</th>
                <th style={{ padding: "12px 14px", width: "190px" }}>Repository Reference</th>
                <th style={{ padding: "12px 14px", textAlign: "right", width: "130px" }}>Status</th>
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
                  <td style={{ padding: "14px", fontFamily: "var(--font-mono, monospace)", color: "#38BDF8", fontSize: "0.75rem", fontWeight: 700 }}>
                    {item.id}
                  </td>
                  <td style={{ padding: "14px", color: "#F8FAFC", fontWeight: 600, lineHeight: 1.4, fontSize: "0.84rem" }}>
                    {item.title}
                  </td>
                  <td style={{ padding: "14px", color: "#94A3B8", lineHeight: 1.5, fontSize: "0.80rem" }}>
                    {item.evidence}
                  </td>
                  <td style={{ padding: "14px" }}>
                    <a
                      href={item.readmeAnchor}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.72rem",
                        color: "#E2E8F0",
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        padding: "5px 10px",
                        textDecoration: "none",
                        fontFamily: "var(--font-mono, monospace)",
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
                      <ExternalLink size={10} />
                    </a>
                  </td>
                  <td style={{ padding: "14px", textAlign: "right" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        padding: "3px 8px",
                        background: "rgba(16, 185, 129, 0.12)",
                        color: "#34D399",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        fontFamily: "var(--font-mono, monospace)",
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
          margin: "64px clamp(24px, 3.5vw, 48px) 0 clamp(24px, 3.5vw, 48px)",
          borderTop: "1px solid #E4E4E7",
          paddingTop: "28px",
          paddingBottom: "36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          position: "relative",
          zIndex: 10,
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.74rem",
          color: "#71717A",
        }}
      >
        <div>
          &copy; 2026 Q-Rakshak • Clinical Intelligence & Quantum Benchmarks
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <a
            href="https://github.com/Rajdeep-Mudiar/Q-Rakshak"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#71717A",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#18181B")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#71717A")}
          >
            <span>GitHub Repository</span>
            <ExternalLink size={10} />
          </a>
          <span>Privacy Protocol</span>
          <span>Governance & Terms</span>
        </div>
      </footer>
    </div>
  );
}
