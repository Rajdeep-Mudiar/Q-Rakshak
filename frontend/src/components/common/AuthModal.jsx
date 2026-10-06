import { useState, useEffect, useRef } from "react";
import { Lock, User, Shield, X, CheckCircle2, Eye, EyeOff, KeyRound, LogIn, Sparkles, UserPlus, Stethoscope, Languages } from "lucide-react";
import { authApi } from "../../api/auth";
import { animateModalOpen } from "../../utils/motion";
import { useLanguage } from "../../context/LanguageContext";

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const { language, setLanguage, availableLanguages, t } = useLanguage();
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState("patient"); // 'patient' | 'doctor' | 'admin'
  const [username, setUsername] = useState("alex.patient");
  const [password, setPassword] = useState("patient123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Register Form State
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAffiliation, setRegAffiliation] = useState("");
  const [regSpecialty, setRegSpecialty] = useState("General Medicine & Clinical AI");
  const [regFee, setRegFee] = useState("600");
  const [regExp, setRegExp] = useState("6");

  function handleRoleSelect(role) {
    setSelectedRole(role);
    setError(null);
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

  useEffect(() => {
    if (isOpen) {
      animateModalOpen(overlayRef.current, modalRef.current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleLogin(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login(username, password, selectedRole);
      if (onLoginSuccess) onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message || "Sign in failed. Please check your username and password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    if (e) e.preventDefault();
    if (!regUsername || !regPassword || !regName || !regEmail) {
      setError("Please fill in your name, username, email, and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ts = Date.now().toString().slice(-5);
      const defaultLicense = selectedRole === "doctor"
        ? `DOC-LIC-${ts}`
        : selectedRole === "admin"
        ? `ADM-SEC-${ts}`
        : `PT-REC-${ts}`;

      const data = await authApi.register({
        username: regUsername.trim().toLowerCase(),
        password: regPassword,
        name: regName.trim(),
        email: regEmail.trim(),
        role: selectedRole,
        emergency_phone: regPhone ? regPhone.trim() : "",
        hospital_affiliation: regAffiliation || (selectedRole === "doctor" ? "Q-Rakshak" : "Community Hospital"),
        license_number: defaultLicense,
        specialty: selectedRole === "doctor" ? (regSpecialty || "General Medicine & Clinical AI") : undefined,
        fee_inr: selectedRole === "doctor" ? (parseFloat(regFee) || 600.0) : undefined,
        experience_years: selectedRole === "doctor" ? (parseInt(regExp, 10) || 6) : undefined,
      });
      if (onLoginSuccess) onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message || "Registration failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "600px",
          padding: "24px 28px",
          borderRadius: "0px",
          border: "1px solid #E4E4E7",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
          background: "#FFFFFF",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #E4E4E7", paddingBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "0px", background: "#0052FF", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <KeyRound size={16} />
            </div>
            <div>
              <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "#0052FF", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)" }}>
                CLINICAL ACCESS GATEWAY
              </div>
              <h2 id="auth-modal-title" style={{ fontSize: "1.10rem", fontWeight: 800, color: "#18181B", margin: "2px 0 0 0", letterSpacing: "-0.01em", textTransform: "uppercase" }}>
                {authMode === "register" ? t("login.create_account", "Register Account") : t("login.sign_in", "Sign In")}
              </h2>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Language Switcher */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "2px", background: "#F4F4F5", padding: "2px", borderRadius: "0px", border: "1px solid #E4E4E7" }}>
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
                    style={{
                      padding: "2px 6px",
                      fontSize: "0.68rem",
                      fontWeight: isActive ? 800 : 600,
                      borderRadius: "0px",
                      border: "none",
                      fontFamily: "var(--font-mono, monospace)",
                      background: isActive ? "#0052FF" : "transparent",
                      color: isActive ? "#FFFFFF" : "#71717A",
                      cursor: "pointer",
                    }}
                  >
                    {lang.code.toUpperCase()}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{ background: "transparent", border: 0, cursor: "pointer", color: "#71717A", padding: "4px" }}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", marginBottom: "12px", background: "#F4F4F5", padding: "2px", borderRadius: "0px", border: "1px solid #E4E4E7" }}>
          <button
            type="button"
            onClick={() => setAuthMode("login")}
            style={{
              padding: "7px 10px",
              background: authMode === "login" ? "#FFFFFF" : "transparent",
              color: authMode === "login" ? "#0052FF" : "#71717A",
              border: 0,
              borderRadius: "0px",
              boxShadow: authMode === "login" ? "0 1px 3px rgba(0, 0, 0, 0.06)" : "none",
              fontSize: "0.76rem",
              fontWeight: 800,
              fontFamily: "var(--font-mono, monospace)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.16s ease",
            }}
          >
            {t("login.sign_in", "Sign In")}
          </button>

          <button
            type="button"
            onClick={() => setAuthMode("register")}
            style={{
              padding: "7px 10px",
              background: authMode === "register" ? "#FFFFFF" : "transparent",
              color: authMode === "register" ? "#0052FF" : "#71717A",
              border: 0,
              borderRadius: "0px",
              boxShadow: authMode === "register" ? "0 1px 3px rgba(0, 0, 0, 0.06)" : "none",
              fontSize: "0.76rem",
              fontWeight: 800,
              fontFamily: "var(--font-mono, monospace)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.16s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <Sparkles size={12} /> {t("login.create_account", "Register")}
          </button>
        </div>

        {/* Persona Selector (Patient, Doctor, Admin) */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
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
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px 4px",
                    borderRadius: "0px",
                    border: isSelected ? "1.5px solid #0052FF" : "1px solid #E4E4E7",
                    background: isSelected ? "#FFFFFF" : "#F8FAFC",
                    color: isSelected ? "#0052FF" : "#52525B",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isSelected && (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "#0052FF" }} />
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Icon size={13} color={isSelected ? "#0052FF" : "#71717A"} />
                    <span style={{ fontSize: "0.76rem", fontWeight: 800 }}>{roleItem.label}</span>
                  </div>
                  <span style={{ fontSize: "0.62rem", color: isSelected ? "#0052FF" : "#A1A1AA", marginTop: "2px", fontFamily: "var(--font-mono, monospace)" }}>
                    {roleItem.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MODE: Sign In Form */}
        {authMode === "login" && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", textAlign: "left" }}>
              <label style={{ fontSize: "0.68rem", fontWeight: 800, color: "#71717A", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)" }}>
                Username or Registered Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Enter username or email"
                style={{ width: "100%", padding: "9px 10px", border: "1px solid #E4E4E7", borderRadius: "0px", fontSize: "0.84rem", fontFamily: "var(--font-mono, monospace)", outline: "none", boxSizing: "border-box" }}
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", textAlign: "left" }}>
              <label style={{ fontSize: "0.68rem", fontWeight: 800, color: "#71717A", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)" }}>
                Password
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  style={{ width: "100%", padding: "9px 36px 9px 10px", border: "1px solid #E4E4E7", borderRadius: "0px", fontSize: "0.84rem", outline: "none", boxSizing: "border-box" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "8px", background: "transparent", border: 0, cursor: "pointer", color: "#A1A1AA" }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "4px",
                minHeight: "38px",
                background: "#0052FF",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "0px",
                fontWeight: 800,
                fontSize: "0.84rem",
                fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <LogIn size={15} />
              <span>{loading ? "Authenticating..." : "Authenticate Session"}</span>
            </button>
          </form>
        )}

        {/* MODE: Create Account Form */}
        {authMode === "register" && (
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "left" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <label style={{ fontSize: "0.68rem", fontWeight: 800, color: "#71717A", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)", display: "block", marginBottom: "3px" }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  autoComplete="name"
                  placeholder="e.g. Dr. Maya Patel"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #E4E4E7", borderRadius: "0px", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.68rem", fontWeight: 800, color: "#71717A", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)", display: "block", marginBottom: "3px" }}>
                  Username *
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="handle"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #E4E4E7", borderRadius: "0px", fontSize: "0.82rem", fontFamily: "var(--font-mono, monospace)", outline: "none", boxSizing: "border-box" }}
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <label style={{ fontSize: "0.68rem", fontWeight: 800, color: "#71717A", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)", display: "block", marginBottom: "3px" }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="name@hospital.org"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #E4E4E7", borderRadius: "0px", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.68rem", fontWeight: 800, color: "#71717A", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)", display: "block", marginBottom: "3px" }}>
                  Password *
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #E4E4E7", borderRadius: "0px", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.68rem", fontWeight: 800, color: "#71717A", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)", display: "block", marginBottom: "3px" }}>
                Phone Number (Optional)
              </label>
              <input
                type="text"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+91 98XXX XXXXX"
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #E4E4E7", borderRadius: "0px", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Doctor Profile Specific Fields */}
            {selectedRole === "doctor" && (
              <div style={{ background: "#F8FAFC", border: "1px solid #E4E4E7", borderLeft: "3px solid #0052FF", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "8px", marginTop: "2px" }}>
                <div style={{ fontSize: "0.66rem", fontWeight: 800, color: "#0052FF", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)" }}>
                  Clinical Practice Details
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "0.66rem", fontWeight: 800, color: "#71717A", display: "block", marginBottom: "2px", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)" }}>
                      Medical Specialty *
                    </label>
                    <select
                      value={regSpecialty}
                      onChange={(e) => setRegSpecialty(e.target.value)}
                      style={{ width: "100%", padding: "7px 8px", border: "1px solid #E4E4E7", borderRadius: "0px", fontSize: "0.76rem", outline: "none", background: "#FFFFFF" }}
                    >
                      <option value="General Medicine & Clinical AI">General Medicine & Clinical AI</option>
                      <option value="Cardiology & Preventive Medicine">Cardiology & Preventive Medicine</option>
                      <option value="Medical Oncology">Medical Oncology</option>
                      <option value="Pulmonary & Respiratory Medicine">Pulmonary & Respiratory Medicine</option>
                      <option value="Dermatology & Skin Lesions">Dermatology & Skin Lesions</option>
                      <option value="Neurology & Neuro-imaging">Neurology & Neuro-imaging</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.66rem", fontWeight: 800, color: "#71717A", display: "block", marginBottom: "2px", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)" }}>
                      Hospital Affiliation
                    </label>
                    <input
                      type="text"
                      value={regAffiliation}
                      onChange={(e) => setRegAffiliation(e.target.value)}
                      placeholder="e.g. Q-Rakshak"
                      style={{ width: "100%", padding: "7px 8px", border: "1px solid #E4E4E7", borderRadius: "0px", fontSize: "0.76rem", outline: "none" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "4px",
                minHeight: "38px",
                background: "#0052FF",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "0px",
                fontWeight: 800,
                fontSize: "0.84rem",
                fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <UserPlus size={15} />
              <span>{loading ? "Registering..." : `Register ${selectedRole.toUpperCase()} & Sign In`}</span>
            </button>
          </form>
        )}

        {error && (
          <div style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", padding: "8px 12px", fontSize: "0.74rem", marginTop: "10px", fontWeight: 600, textAlign: "left", borderRadius: "0px" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
