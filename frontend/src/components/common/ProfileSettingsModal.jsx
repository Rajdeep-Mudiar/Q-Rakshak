import { useState, useEffect, useRef } from "react";
import { User, Mail, Phone, Shield, CheckCircle2, Save, X, Bell, Cpu, Building, Heart, Stethoscope } from "lucide-react";
import { profileApi } from "../../api/profile";
import { animateModalOpen } from "../../utils/motion";
import { useLanguage } from "../../context/LanguageContext";

export default function ProfileSettingsModal({ isOpen, onClose, userId = null, userRole = "patient", onProfileUpdated }) {
  const { t } = useLanguage();
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const [profile, setProfile] = useState({
    name: "",
    role: userRole || "patient",
    title: "",
    primary_email: "",
    extra_email: "",
    emergency_phone: "",
    phone: "",
    blood_group: "",
    clearance_level: "Standard Access",
    compliance_standard: "DPDP 2023 / HIPAA",
    attending_physician: "",
    notifications_sms: true,
    notifications_email: true,
    notifications_critical_qpu: true,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      animateModalOpen(overlayRef.current, modalRef.current);
      profileApi.getProfile(userId)
        .then((res) => {
          if (res.profile) {
            setProfile((prev) => ({ ...prev, ...res.profile }));
          }
        })
        .catch(() => {});
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await profileApi.updateProfile(userId, profile);
      setSaved(true);
      if (onProfileUpdated) onProfileUpdated(res.profile || profile);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to update profile settings.");
    } finally {
      setLoading(false);
    }
  }

  const effectiveRole = userRole || profile.role || "clinician";

  return (
    <div ref={overlayRef} className="modal-overlay" style={{ borderRadius: "var(--radius-sm)" }}>
      <div ref={modalRef} className="modal-content" style={{ maxWidth: "640px", padding: "24px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)", borderTop: "3px solid var(--accent-blue)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--border-default)", paddingBottom: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                User Profile & Authority Registry
              </h2>
              <span style={{ fontSize: "0.62rem", padding: "2px 6px", background: "var(--bg-card)", border: "1px solid var(--border-default)", fontWeight: 700, textTransform: "uppercase" }}>
                {effectiveRole}
              </span>
            </div>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Manage credentials, institutional routing, secondary alerts, and 24/7 emergency hotlines.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--text-muted)" }}
          >
            <X size={18} />
          </button>
        </div>

        {saved && (
          <div style={{ background: "var(--risk-low-bg)", color: "var(--risk-low)", padding: "6px 10px", fontSize: "0.72rem", border: "1px solid rgba(22, 163, 74, 0.4)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, borderRadius: "var(--radius-sm)" }}>
            <CheckCircle2 size={14} /> Profile & authority parameters saved successfully.
          </div>
        )}

        {error && (
          <div style={{ background: "var(--risk-high-bg)", color: "var(--risk-high)", padding: "6px 10px", fontSize: "0.72rem", border: "1px solid rgba(220, 38, 38, 0.3)", marginBottom: "10px", borderRadius: "var(--radius-sm)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Universal Profile Attributes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "3px" }}>
                Full Name / Institutional Identity
              </label>
              <input
                type="text"
                value={profile.name || ""}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                style={{ width: "100%", padding: "5px 8px", border: "1px solid var(--border-default)", fontSize: "0.74rem", borderRadius: "var(--radius-sm)" }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "3px" }}>
                Professional Title / Position
              </label>
              <input
                type="text"
                value={profile.title || profile.role || ""}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                style={{ width: "100%", padding: "5px 8px", border: "1px solid var(--border-default)", fontSize: "0.74rem", borderRadius: "var(--radius-sm)" }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "3px" }}>
                Primary Institutional Email
              </label>
              <input
                type="email"
                value={profile.primary_email || ""}
                onChange={(e) => setProfile({ ...profile, primary_email: e.target.value })}
                style={{ width: "100%", padding: "5px 8px", border: "1px solid var(--border-default)", fontSize: "0.74rem", borderRadius: "var(--radius-sm)" }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "3px" }}>
                Secondary / Alternate Notification Email
              </label>
              <input
                type="email"
                value={profile.extra_email || ""}
                onChange={(e) => setProfile({ ...profile, extra_email: e.target.value })}
                placeholder="alternate@hospital.org"
                style={{ width: "100%", padding: "5px 8px", border: "1px solid var(--border-default)", fontSize: "0.74rem", borderRadius: "var(--radius-sm)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "3px" }}>
                Primary Contact Direct Line
              </label>
              <input
                type="text"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                style={{ width: "100%", padding: "5px 8px", border: "1px solid var(--border-default)", fontSize: "0.74rem", borderRadius: "var(--radius-sm)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "var(--risk-high)", marginBottom: "3px" }}>
                Emergency Hotline (24/7 Pager)
              </label>
              <input
                type="text"
                value={profile.emergency_phone || ""}
                onChange={(e) => setProfile({ ...profile, emergency_phone: e.target.value })}
                placeholder="+91 98765 43210"
                style={{ width: "100%", padding: "5px 8px", border: "1px solid var(--risk-high)", fontSize: "0.74rem", background: "var(--risk-high-bg)", borderRadius: "var(--radius-sm)" }}
              />
            </div>
          </div>

          {/* Role-Adaptive Fieldset */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", padding: "10px", marginBottom: "14px", borderRadius: "var(--radius-sm)" }}>
            <p style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              {effectiveRole === "admin" && <Shield size={13} />}
              {effectiveRole === "patient" && <Heart size={13} />}
              <span>{effectiveRole === "admin" ? "Administrator" : "Patient"} Specific Credentials</span>
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>

              {effectiveRole === "admin" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "2px" }}>
                      Security Clearance Level
                    </label>
                    <input
                      type="text"
                      value={profile.clearance_level || ""}
                      onChange={(e) => setProfile({ ...profile, clearance_level: e.target.value })}
                      style={{ width: "100%", padding: "4px 8px", border: "1px solid var(--border-default)", fontSize: "0.72rem", borderRadius: "var(--radius-sm)" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "2px" }}>
                      Audit Compliance Standard
                    </label>
                    <input
                      type="text"
                      value={profile.compliance_standard || ""}
                      onChange={(e) => setProfile({ ...profile, compliance_standard: e.target.value })}
                      style={{ width: "100%", padding: "4px 8px", border: "1px solid var(--border-default)", fontSize: "0.72rem", borderRadius: "var(--radius-sm)" }}
                    />
                  </div>
                </>
              )}

              {effectiveRole === "patient" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "2px" }}>
                      Attending Primary Physician
                    </label>
                    <input
                      type="text"
                      value={profile.attending_physician || ""}
                      onChange={(e) => setProfile({ ...profile, attending_physician: e.target.value })}
                      style={{ width: "100%", padding: "4px 8px", border: "1px solid var(--border-default)", fontSize: "0.72rem", borderRadius: "var(--radius-sm)" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "2px" }}>
                      Blood Group
                    </label>
                    <input
                      type="text"
                      value={profile.blood_group || "O+"}
                      onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
                      style={{ width: "100%", padding: "4px 8px", border: "1px solid var(--border-default)", fontSize: "0.72rem", borderRadius: "var(--radius-sm)" }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", borderTop: "1px solid var(--border-default)", paddingTop: "10px" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "auto", padding: "6px 16px", borderRadius: "var(--radius-sm)" }}
            >
              <Save size={13} />
              <span>{loading ? "Saving..." : "Save Profile Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
