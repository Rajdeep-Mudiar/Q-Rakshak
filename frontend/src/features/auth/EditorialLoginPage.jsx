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
  ExternalLink
} from "lucide-react";
import { animateErrorShake } from "../../utils/motion.js";
import ModelEvaluationShowcase from "./components/ModelEvaluationShowcase.jsx";
import { authApi } from "../../api/auth.js";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function EditorialLoginPage({ onGoogleLogin, onGoogleVerifySuccess, loading, error }) {
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [gisLoading, setGisLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
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

    function initGoogleClient() {
      if (typeof window !== "undefined" && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: "985994695248-4615o9ba17tahv2q94ba01t322r3aunr.apps.googleusercontent.com",
            callback: async (response) => {
              if (response?.credential && isMounted) {
                try {
                  setGisLoading(true);
                  setLocalError(null);
                  const verifiedUser = await authApi.verifyGoogleCredential(response.credential);
                  if (verifiedUser) {
                    if (onGoogleVerifySuccess) {
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
          });
        } catch (e) {
          console.warn("Google Identity Services notice:", e);
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
  }, [onGoogleVerifySuccess]);

  const handleGoogleClick = () => {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            if (onGoogleLogin) onGoogleLogin();
          }
        });
        return;
      } catch {
        // Fallback to onGoogleLogin
      }
    }
    if (onGoogleLogin) {
      onGoogleLogin();
    }
  };

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
                Objective Triage.
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
            Fast and reliable clinical triage, verified medical records, and secure doctor consultations powered by Quantum AI.
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
                  Early Detection
                </span>
                <span style={{ fontSize: "0.68rem", color: "#059669", background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "2px 7px", borderRadius: "4px", fontWeight: 700 }}>
                  ESI 1-5
                </span>
              </div>
              <strong style={{ display: "block", fontSize: "0.92rem", color: "#0F172A", marginTop: "12px", fontWeight: 700 }}>
                Deterministic Triage
              </strong>
              <span style={{ display: "block", fontSize: "0.78rem", color: "#64748B", marginTop: "5px", lineHeight: 1.5 }}>
                Standardized priority screening with instant vital sign and anomaly checks.
              </span>
            </div>

            <div className="editorial-spec-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.70rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                  Secure Records
                </span>
                <span style={{ fontSize: "0.68rem", color: "#0284C7", background: "#F0F9FF", border: "1px solid #BAE6FD", padding: "2px 7px", borderRadius: "4px", fontWeight: 700 }}>
                  Audit Trail
                </span>
              </div>
              <strong style={{ display: "block", fontSize: "0.92rem", color: "#0F172A", marginTop: "12px", fontWeight: 700 }}>
                Tamper-Proof Audit
              </strong>
              <span style={{ display: "block", fontSize: "0.78rem", color: "#64748B", marginTop: "5px", lineHeight: 1.5 }}>
                End-to-end cryptographic logging with clinical protocol verification.
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", borderTop: "1px solid #E2E8F0", paddingTop: "16px" }}>
            <span style={{ fontSize: "0.72rem", color: "#475569", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
              <CheckCircle2 size={14} color="#059669" /> Verified Security
            </span>
            <span style={{ fontSize: "0.72rem", color: "#475569", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
              <Lock size={14} color="#059669" /> Encrypted Data
            </span>
            <span style={{ fontSize: "0.72rem", color: "#475569", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
              <Cpu size={14} color="#059669" /> Fast Triage
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
            borderRadius: "12px",
            padding: "clamp(28px, 4vw, 54px) clamp(20px, 4vw, 42px)",
            position: "relative",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.06)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            width: "100%",
            maxWidth: "520px",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          <div style={{ marginBottom: "32px" }}>
            <div style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              justifyContent: "center", 
              width: "60px", 
              height: "60px", 
              background: "#F0FDF4", 
              border: "1px solid #BBF7D0", 
              borderRadius: "50%",
              marginBottom: "20px"
            }}>
              <ShieldCheck size={28} color="#059669" />
            </div>
            <h2
              style={{
                fontFamily: "var(--font-sans, inherit)",
                fontSize: "1.8rem",
                fontWeight: 800,
                color: "#0F172A",
                letterSpacing: "-0.02em",
                margin: "0 0 12px 0",
              }}
            >
              Sign in to Q-RAKSHAK
            </h2>
            <p style={{ fontSize: "0.95rem", color: "#64748B", margin: 0, lineHeight: 1.5, maxWidth: "300px" }}>
              Your Google account secures your clinical workspace.
            </p>
          </div>

          <div style={{ width: "100%", maxWidth: "320px", marginBottom: "26px" }}>
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading || gisLoading}
              className="editorial-google-btn"
            >
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
              </svg>
              <span>{loading || gisLoading ? "Connecting..." : "Sign in with Google"}</span>
            </button>
          </div>

          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "6px", padding: "12px", maxWidth: "320px" }}>
            <p style={{ fontSize: "0.75rem", color: "#15803D", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
              A security notification will be sent to your Gmail upon successful sign-in.
            </p>
          </div>

          {(error || localError) && (
            <div style={{ marginTop: "20px", color: "#DC2626", fontSize: "0.85rem", fontWeight: 600 }}>
              {error || localError}
            </div>
          )}
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
            Scroll down to explore Quantum vs Classical Models & Clinical Benchmarks
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
        background: "#0A0A0A",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderLeft: "2px solid #FFFFFF",
        borderRadius: "0px",
        padding: "clamp(18px, 3vw, 40px)",
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
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          paddingBottom: "20px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "3px 8px",
                background: "transparent",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: "0px",
                letterSpacing: "0.12em",
                fontFamily: "var(--font-mono, monospace)",
                textTransform: "uppercase",
              }}
            >
              RESEARCH COMPLIANCE
            </span>
            <span
              style={{
                fontSize: "0.70rem",
                color: "#777777",
                fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "0.08em",
              }}
            >
              HYBRID QUANTUM-CLASSICAL MACHINE LEARNING AUDIT
            </span>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-sans, inherit)",
              fontSize: "clamp(1.25rem, 2.2vw, 1.8rem)",
              fontWeight: 400,
              color: "#FFFFFF",
              margin: "0 0 8px 0",
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            Research Objectives Compliance Matrix (OBJ-01 – OBJ-06)
          </h2>
          <p
            style={{
              fontSize: "0.85rem",
              color: "#888888",
              margin: 0,
              lineHeight: 1.6,
              maxWidth: "780px",
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
              color: "#FFFFFF",
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              padding: "6px 14px",
              borderRadius: "0px",
              fontFamily: "var(--font-mono, monospace)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
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
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#FFFFFF";
            }}
          >
            <ExternalLink size={12} />
            <span>Documentation Portal</span>
          </a>
          <span
            style={{
              fontSize: "0.72rem",
              color: "#FFFFFF",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              padding: "6px 14px",
              borderRadius: "0px",
              fontFamily: "var(--font-mono, monospace)",
              letterSpacing: "0.08em",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CheckCircle2 size={13} color="#FFFFFF" /> 6 / 6 SATISFIED
          </span>
        </div>
      </div>

      {/* Objectives Data Table - Zara Minimalist */}
      <div
        style={{
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "0px",
          background: "#0A0A0A",
        }}
      >
        <table style={{ width: "100%", minWidth: "780px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.80rem" }}>
          <thead>
            <tr
              style={{
                background: "#111111",
                borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#777777",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.68rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              <th style={{ padding: "12px 14px", width: "80px" }}>ID</th>
              <th style={{ padding: "12px 14px", fontWeight: 600, color: "#FFFFFF", width: "230px" }}>Research Objective</th>
              <th style={{ padding: "12px 14px", fontWeight: 600, color: "#FFFFFF" }}>Implementation & Code Evidence</th>
              <th style={{ padding: "12px 14px", fontWeight: 600, color: "#FFFFFF", width: "190px" }}>Repository Reference</th>
              <th style={{ padding: "12px 14px", fontWeight: 600, color: "#FFFFFF", textAlign: "right", width: "140px" }}>Status</th>
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
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                  background: index % 2 === 0 ? "#0A0A0A" : "#0E0E0E",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = index % 2 === 0 ? "#0A0A0A" : "#0E0E0E")}
              >
                <td style={{ padding: "14px", fontFamily: "var(--font-mono, monospace)", color: "#FFFFFF", fontSize: "0.74rem", fontWeight: 700 }}>
                  {item.id}
                </td>
                <td style={{ padding: "14px", color: "#EDEDED", fontWeight: 600, lineHeight: 1.4 }}>
                  {item.title}
                </td>
                <td style={{ padding: "14px", color: "#888888", lineHeight: 1.5, fontSize: "0.78rem" }}>
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
                      gap: "5px",
                      fontSize: "0.70rem",
                      color: "#CCCCCC",
                      background: "transparent",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      padding: "4px 8px",
                      borderRadius: "0px",
                      textDecoration: "none",
                      fontFamily: "var(--font-mono, monospace)",
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
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "0px",
                      background: "rgba(255, 255, 255, 0.06)",
                      color: "#FFFFFF",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      fontFamily: "var(--font-mono, monospace)",
                    }}
                  >
                    <CheckCircle2 size={11} color="#FFFFFF" />
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>


    {/* Zara High-Fashion Minimalist Footer */}
    <footer
      style={{
        margin: "80px clamp(24px, 3.5vw, 48px) 0 clamp(24px, 3.5vw, 48px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.12)",
        paddingTop: "32px",
        paddingBottom: "40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        position: "relative",
        zIndex: 10,
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "0.72rem",
        color: "#666666",
        letterSpacing: "0.08em",
      }}
    >
      <div>
        &copy; 2026 Q-RAKSHAK // CLINICAL AUDIT & QUANTUM BENCHMARKS.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
        <a
          href="https://github.com/Rajdeep-Mudiar/Q-Rakshak"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#EEEEEE",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#EEEEEE")}
        >
          <span>GITHUB REPOSITORY</span>
          <ExternalLink size={11} />
        </a>
        <span
          style={{ cursor: "pointer", transition: "color 0.15s ease" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#666666")}
        >
          PRIVACY PROTOCOL
        </span>
        <span
          style={{ cursor: "pointer", transition: "color 0.15s ease" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#666666")}
        >
          GOVERNANCE & TERMS
        </span>
      </div>
    </footer>
  </div>
);
}
