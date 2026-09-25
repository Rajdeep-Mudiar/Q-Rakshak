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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Register Form State
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("patient");
  const [regPhone, setRegPhone] = useState("");
  const [regAffiliation, setRegAffiliation] = useState("");
  const [regSpecialty, setRegSpecialty] = useState("General Medicine & Clinical AI");
  const [regFee, setRegFee] = useState("600");
  const [regExp, setRegExp] = useState("6");

  function handleRoleSelect(role) {
    setSelectedRole(role);
    setRegRole(role);
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
      const defaultLicense = regRole === "doctor"
        ? `DOC-LIC-${Math.floor(10000 + Math.random() * 90000)}`
        : regRole === "admin"
        ? `ADM-SEC-${Math.floor(1000 + Math.random() * 9000)}`
        : `PT-REC-${Math.floor(10000 + Math.random() * 90000)}`;

      const data = await authApi.register({
        username: regUsername.trim().toLowerCase(),
        password: regPassword,
        name: regName.trim(),
        email: regEmail.trim(),
        role: regRole,
        emergency_phone: regPhone || "+91 98765 43210",
        hospital_affiliation: regAffiliation || (regRole === "doctor" ? "Q-Rakshak" : "Community Hospital"),
        license_number: defaultLicense,
        specialty: regRole === "doctor" ? (regSpecialty || "General Medicine & Clinical AI") : undefined,
        fee_inr: regRole === "doctor" ? (parseFloat(regFee) || 600.0) : undefined,
        experience_years: regRole === "doctor" ? (parseInt(regExp, 10) || 6) : undefined,
      });
      if (onLoginSuccess) onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message || "Registration failed. Username may already be in use.");
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
          maxWidth: "640px",
          padding: "24px 28px",
          borderRadius: "14px",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-modal)",
          background: "var(--bg-surface)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--border-default)", paddingBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--primary)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <KeyRound size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.64rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
                CLINICAL ACCESS
              </div>
              <h2 id="auth-modal-title" style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", margin: "2px 0 0 0", letterSpacing: "-0.01em" }}>
                {authMode === "register" ? t("login.create_account", "Register Account") : t("login.sign_in", "Sign In")}
              </h2>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Language Switcher */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "2px", background: "var(--bg-surface-alt)", padding: "2px 4px", borderRadius: "6px" }}>
              <Languages size={13} color="var(--text-muted)" style={{ marginRight: "2px" }} />
              {(availableLanguages || [
                { code: "en", label: "English", nativeName: "EN" },
                { code: "hi", label: "Hindi", nativeName: "हिं" },
                { code: "as", label: "Assamese", nativeName: "অ" },
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
                      fontWeight: isActive ? 700 : 500,
                      borderRadius: "4px",
                      border: "none",
                      background: isActive ? "var(--primary)" : "transparent",
                      color: isActive ? "#FFFFFF" : "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    {lang.nativeName || lang.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", marginBottom: "12px", background: "var(--bg-surface-alt)", padding: "4px", borderRadius: "9px" }}>
          <button
            type="button"
            onClick={() => setAuthMode("login")}
            style={{
              padding: "8px 10px",
              background: authMode === "login" ? "#FFFFFF" : "transparent",
              color: authMode === "login" ? "var(--primary)" : "var(--text-secondary)",
              border: 0,
              borderRadius: "7px",
              boxShadow: authMode === "login" ? "0 1px 3px rgba(15, 23, 42, 0.08)" : "none",
              fontSize: "0.76rem",
              fontWeight: 600,
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
              padding: "8px 10px",
              background: authMode === "register" ? "#FFFFFF" : "transparent",
              color: authMode === "register" ? "var(--primary)" : "var(--text-secondary)",
              border: 0,
              borderRadius: "7px",
              boxShadow: authMode === "register" ? "0 1px 3px rgba(15, 23, 42, 0.08)" : "none",
              fontSize: "0.76rem",
              fontWeight: 600,
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

        {/* Role Switcher Option (Patient, Doctor, Admin) */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
            {[
              { id: "patient", label: t("login.role_patient", "Patient"), icon: User, desc: "Health" },
              { id: "doctor", label: t("login.role_doctor", "Doctor"), icon: Stethoscope, desc: "OPD" },
              { id: "admin", label: t("login.role_admin", "Admin"), icon: Shield, desc: "Admin" },
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
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "7px 4px",
                    borderRadius: "7px",
                    border: isSelected ? "1.5px solid var(--primary)" : "1px solid var(--border-default)",
                    background: isSelected ? "var(--primary-subtle, #F0FDF4)" : "var(--bg-surface-alt)",
                    color: isSelected ? "var(--primary)" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon size={13} />
                  <span>{roleItem.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MODE: Sign In Form */}
        {authMode === "login" && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.70rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                Username or Registered Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Enter username or email address"
                style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", fontSize: "0.80rem" }}
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.70rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                Password
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  style={{ width: "100%", padding: "8px 36px 8px 10px", border: "1px solid var(--border-default)", fontSize: "0.80rem" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "8px", background: "transparent", border: 0, cursor: "pointer", color: "var(--text-muted)" }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", padding: "10px", marginTop: "4px", minHeight: "38px" }}
            >
              <LogIn size={15} />
              <span>{loading ? "Signing In..." : "Sign In"}</span>
            </button>
          </form>
        )}

        {/* MODE 3: Create Account Form */}
        {authMode === "register" && (
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.70rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  autoComplete="name"
                  placeholder="e.g. Dr. Maya Patel"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", fontSize: "0.78rem" }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.70rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>
                  Username *
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="e.g. maya.patel"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", fontSize: "0.78rem" }}
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.70rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="maya@example.com"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", fontSize: "0.78rem" }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.70rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>
                  Password *
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", fontSize: "0.78rem" }}
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.70rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>
                  I am registering as: *
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", fontSize: "0.78rem" }}
                >
                  <option value="patient">Patient (Personal Health & Checkups)</option>
                  <option value="doctor">Doctor / Clinician (Clinical Diagnosis & Consultations)</option>
                  <option value="admin">Administrator (Security & Audits)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.70rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "3px" }}>
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", fontSize: "0.78rem" }}
                />
              </div>
            </div>

            {/* Doctor Profile Specific Fields */}
            {regRole === "doctor" && (
              <div style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-default)", borderLeft: "3px solid var(--accent-blue)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--gold)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Clinical Practice Details (Appears in Find Doctors & Consultations)
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>
                      Medical Specialty *
                    </label>
                    <select
                      value={regSpecialty}
                      onChange={(e) => setRegSpecialty(e.target.value)}
                      style={{ width: "100%", padding: "7px 8px", border: "1px solid var(--border-default)", fontSize: "0.74rem" }}
                    >
                      <option value="General Medicine & Clinical AI">General Medicine & Clinical AI</option>
                      <option value="Cardiology & Preventive Medicine">Cardiology & Preventive Medicine</option>
                      <option value="Medical Oncology">Medical Oncology</option>
                      <option value="Pulmonary & Respiratory Medicine">Pulmonary & Respiratory Medicine</option>
                      <option value="Dermatology & Skin Lesions">Dermatology & Skin Lesions</option>
                      <option value="Neurology & Neuro-imaging">Neurology & Neuro-imaging</option>
                      <option value="Endocrinology & Diabetes">Endocrinology & Diabetes</option>
                      <option value="Orthopedics & Joint Care">Orthopedics & Joint Care</option>
                      <option value="Pediatrics & Child Health">Pediatrics & Child Health</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>
                      Hospital / Clinic Affiliation
                    </label>
                    <input
                      type="text"
                      value={regAffiliation}
                      onChange={(e) => setRegAffiliation(e.target.value)}
                      placeholder="e.g. Q-Rakshak"
                      style={{ width: "100%", padding: "7px 8px", border: "1px solid var(--border-default)", fontSize: "0.74rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>
                      Consultation Fee (INR)
                    </label>
                    <input
                      type="number"
                      value={regFee}
                      onChange={(e) => setRegFee(e.target.value)}
                      placeholder="600"
                      style={{ width: "100%", padding: "7px 8px", border: "1px solid var(--border-default)", fontSize: "0.74rem" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      value={regExp}
                      onChange={(e) => setRegExp(e.target.value)}
                      placeholder="6"
                      style={{ width: "100%", padding: "7px 8px", border: "1px solid var(--border-default)", fontSize: "0.74rem" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", padding: "10px", marginTop: "4px", minHeight: "38px" }}
            >
              <UserPlus size={15} />
              <span>{loading ? "Creating Account..." : `Create ${regRole.toUpperCase()} Account & Sign In`}</span>
            </button>
          </form>
        )}

        {error && (
          <div style={{ background: "var(--risk-high-bg)", color: "var(--risk-high)", border: "1px solid rgba(220, 38, 38, 0.4)", padding: "8px 12px", fontSize: "0.72rem", marginTop: "10px", fontWeight: 600 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
