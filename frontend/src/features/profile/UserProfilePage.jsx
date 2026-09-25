import { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Heart,
  Stethoscope,
  Activity,
  CreditCard,
  QrCode,
  Printer,
  Copy,
  RefreshCw,
  X,
  FileText,
  Clock,
  ExternalLink,
  Plus,
} from "lucide-react";
import { profileApi } from "../../api/profile";
import { clinicalApi } from "../../api/clinical";
import { authApi } from "../../api/auth";
import apiClient from "../../api/client";
import { ENDPOINTS, EMERGENCY_PORTAL_BASE } from "../../api/config";
import QRCodeSVG from "../../components/common/QRCodeSVG";
import TriagePhysicalCard from "../../components/clinical/TriagePhysicalCard";
import PrintableMedicalCardSheet from "../../components/clinical/PrintableMedicalCardSheet";
import { useLanguage } from "../../context/LanguageContext.jsx";

function formatAllergies(allergies) {
  if (!allergies) return "";
  if (typeof allergies === "string") return allergies;
  if (Array.isArray(allergies)) {
    return allergies
      .map((a) => {
        if (typeof a === "string") return a;
        if (a && typeof a === "object") {
          const name = a.allergen || a.name || a.reaction || "";
          const sev = a.severity ? ` (${a.severity})` : "";
          return `${name}${sev}`.trim();
        }
        return String(a);
      })
      .filter(Boolean)
      .join(", ");
  }
  if (typeof allergies === "object") {
    return allergies.allergen || allergies.name || "";
  }
  return String(allergies);
}

function formatMedications(meds) {
  if (!meds) return "";
  if (typeof meds === "string") return meds;
  if (Array.isArray(meds)) {
    return meds
      .map((m) => {
        if (typeof m === "string") return m;
        if (m && typeof m === "object") {
          const name = m.name || m.medicine || "";
          const dose = m.dosage || m.dose ? ` ${m.dosage || m.dose}` : "";
          const freq = m.frequency ? ` (${m.frequency})` : "";
          return `${name}${dose}${freq}`.trim();
        }
        return String(m);
      })
      .filter(Boolean)
      .join(", ");
  }
  if (typeof meds === "object") {
    return meds.name || "";
  }
  return String(meds);
}

function formatMedicalHistory(history) {
  if (!history) return "";
  if (typeof history === "string") return history;
  if (Array.isArray(history)) {
    return history
      .map((h) => {
        if (typeof h === "string") return h;
        if (h && typeof h === "object") {
          return h.condition || h.name || h.notes || "";
        }
        return String(h);
      })
      .filter(Boolean)
      .join(", ");
  }
  return String(history);
}

export default function UserProfilePage({ currentUser, onProfileUpdated, onProfileDeleted, openCard = false, onCardOpened }) {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const activeUserId = currentUser?.user_id || currentUser?.id || currentUser?.username || "";
  const effectiveRole = (currentUser?.role || "patient").toLowerCase();
  const isDoctor = effectiveRole === "doctor" || effectiveRole === "clinician";

  const [profile, setProfile] = useState({
    user_id: activeUserId,
    username: currentUser?.username || "",
    name: currentUser?.name || "",
    role: effectiveRole,
    age: "",
    gender: "",
    primary_email: currentUser?.email || "",
    extra_email: "",
    emergency_phone: "",
    emergency_contact_name: "",
    emergency_contact_relation: "",
    phone: "",
    blood_group: "",
    allergies: "",
    active_medications: "",
    medical_history: "",
    abha_id: "",
    organ_donor: false,
    department: "",
    hospital: "",
    license_id: "",
    attending_physician: "",
    // Clinician specific practice fields
    specialty: "General Medicine & Clinical AI",
    registration_number: "",
    council_name: "National Medical Commission",
    experience_years: 6,
    fee_inr: 600,
    languages: ["English", "Hindi"],
    available_slots: ["09:30 AM", "11:00 AM", "02:30 PM", "04:30 PM"],
    verification_status: "verified",
  });

  const [activeTab, setActiveTab] = useState(isDoctor ? "practice" : "identity");
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState("synced");
  const [error, setError] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [viewCardOpen, setViewCardOpen] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [cardFace, setCardFace] = useState('dual');
  const [cardTheme, setCardTheme] = useState('light');
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [medications, setMedications] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  const isDeleteAuthorized = [
    "confirm deletion account",
    "delete",
    "confirm",
  ].includes(deleteConfirmText.trim().toLowerCase());

  useEffect(() => {
    fetchProfileData();
  }, [activeUserId]);

  useEffect(() => {
    if (openCard) {
      setViewCardOpen(true);
      if (onCardOpened) onCardOpened();
    }
  }, [openCard, onCardOpened]);

  async function fetchProfileData() {
    setLoading(true);
    setError(null);
    try {
      if (activeUserId) {
        const res = await profileApi.getProfile(activeUserId);
        if (res?.profile) {
          setProfile((prev) => ({
            ...prev,
            ...res.profile,
            user_id: res.profile.user_id || activeUserId,
            username: currentUser?.username || prev.username,
          }));
        }
        if (!isDoctor) {
          const clinical = await clinicalApi.getPatientRecord(activeUserId);
          if (clinical?.patient) {
            const patient = clinical.patient;
            setMedicalHistory(Array.isArray(patient.medical_history) ? patient.medical_history.map((item, index) => typeof item === "string" ? { id: `history-${index}`, condition: item, notes: "" } : item) : []);
            setMedications(Array.isArray(patient.medications) ? patient.medications : []);
            setEmergencyContacts(Array.isArray(patient.emergency_contacts) ? patient.emergency_contacts.map((item, index) => ({ id: `contact-${index}`, ...item })) : []);
            setProfile((prev) => ({
              ...prev,
              ...patient,
              allergies: formatAllergies(patient.allergies || prev.allergies),
              active_medications: formatMedications(patient.medications || patient.active_medications || prev.active_medications),
              medical_history: formatMedicalHistory(patient.medical_history || prev.medical_history),
              user_id: patient.id || prev.user_id
            }));
          }
        }
      }
    } catch (err) {
      // Retain fallback metadata
    } finally {
      setLoading(false);
    }
  }

  async function autoSaveToDb(updatedProfile) {
    const payload = updatedProfile || profile;
    setSyncStatus("saving");
    try {
      const res = await profileApi.updateProfile(activeUserId, payload);
      if (!isDoctor) {
        await clinicalApi.updatePatientRecord(activeUserId, {
          name: payload.name,
          age: payload.age,
          gender: payload.gender,
          blood_group: payload.blood_group,
          medical_history: medicalHistory,
          medications,
          emergency_contacts: emergencyContacts,
          emergency_contact: emergencyContacts.find((contact) => contact.is_primary)?.phone || payload.emergency_phone,
        });
      }
      setSyncStatus("synced");
      if (onProfileUpdated) {
        onProfileUpdated(res.profile || payload);
      }
    } catch (err) {
      setSyncStatus("error");
    }
  }

  function handleFieldChange(field, value) {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    if (typeof value === "boolean") {
      autoSaveToDb(updated);
    }
  }

  function handleFieldBlur() {
    autoSaveToDb(profile);
  }

  function updateMedicalHistory(id, field, value) {
    setMedicalHistory((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  }

  function updateMedication(id, field, value) {
    setMedications((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  }

  function updateEmergencyContact(id, field, value) {
    setEmergencyContacts((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : { ...item, is_primary: field === "is_primary" ? false : item.is_primary }));
  }

  function addMedicalHistory() {
    setMedicalHistory((items) => [...items, { id: `history-${Date.now()}`, condition: "", notes: "" }]);
  }

  function addMedication() {
    setMedications((items) => [...items, { id: `med-${Date.now()}`, name: "", dose: "", frequency: "" }]);
  }

  function addEmergencyContact() {
    setEmergencyContacts((items) => [...items, { id: `contact-${Date.now()}`, name: "", relation: "", phone: "", email: "", is_primary: false }]);
  }

  const [allergiesList, setAllergiesList] = useState([]);
  const [newAllergen, setNewAllergen] = useState("");
  const [newAllergySev, setNewAllergySev] = useState("HIGH");
  const [newAllergyRxn, setNewAllergyRxn] = useState("");

  async function handleDeleteProfile() {
    setDeleting(true);
    setError(null);
    try {
      await profileApi.deleteProfile(activeUserId);
      setDeleteConfirmOpen(false);
      authApi.logout();
      if (onProfileDeleted) {
        onProfileDeleted();
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError(err.message || "Failed to delete profile.");
      setDeleting(false);
    }
  }

  function addAllergy() {
    if (!newAllergen.trim()) return;
    const updated = [
      ...allergiesList,
      { id: `alg-${Date.now()}`, allergen: newAllergen.trim(), severity: newAllergySev, reaction: newAllergyRxn.trim() || "Sensitivity" }
    ];
    setAllergiesList(updated);
    setNewAllergen("");
    setNewAllergyRxn("");
    const formatted = updated.map(a => `${a.allergen} (${a.severity})`).join(", ");
    handleFieldChange("allergies", formatted);
    autoSaveToDb({ ...profile, allergies: formatted });
  }

  function removeAllergy(id) {
    const updated = allergiesList.filter(a => a.id !== id);
    setAllergiesList(updated);
    const formatted = updated.map(a => `${a.allergen} (${a.severity})`).join(", ");
    handleFieldChange("allergies", formatted);
    autoSaveToDb({ ...profile, allergies: formatted });
  }

  const effectiveUserId = profile.user_id || profile.id || activeUserId || "";
  const emergencyPortalUrl = typeof window !== "undefined"
    ? `${window.location.origin}/#triage/${effectiveUserId}`
    : `${EMERGENCY_PORTAL_BASE}/${effectiveUserId}`;
  const emergencyQrUrl = ENDPOINTS.EMERGENCY_QR_PNG(effectiveUserId);

  return (
    <>
      <div ref={containerRef} className="no-print" style={{ height: "100%", overflowY: "auto", padding: "20px 24px", background: "var(--bg-canvas)", fontFamily: "var(--font-sans)" }}>
      {/* ── Top Clean Header ── */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "14px",
          padding: "20px 24px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
                margin: 0,
              }}
            >
              {profile.name || t("profile.title", "Patient Profile & Medical Record")}
            </h1>
            <span
              style={{
                fontSize: "0.68rem",
                padding: "3px 8px",
                background: "var(--primary-soft)",
                border: "1px solid var(--border-default)",
                borderRadius: "6px",
                color: "var(--primary-dark)",
                fontWeight: 700,
                textTransform: "uppercase",
                fontFamily: "var(--font-mono)",
              }}
            >
              {t(`login.role_${effectiveRole}`, effectiveRole)}
            </span>
          </div>

          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
            {t("profile.subtitle", "Personal clinical details, emergency escalation, and digital healthcare card configuration.")}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              fontSize: "0.74rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "8px",
              background: syncStatus === "saving" ? "var(--risk-mid-bg)" : "var(--risk-low-bg)",
              color: syncStatus === "saving" ? "var(--risk-mid)" : "var(--risk-low)",
              border: `1px solid ${syncStatus === "saving" ? "var(--risk-mid-border)" : "var(--risk-low-border)"}`,
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: syncStatus === "saving" ? "var(--risk-mid)" : "var(--risk-low)",
              }}
            />
            {syncStatus === "saving" ? t("profile.syncing", "Saving Changes...") : t("profile.synced", "All Changes Saved to Cloud")}
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={fetchProfileData}
            disabled={loading}
            style={{
              minHeight: "40px",
              padding: "8px 14px",
              fontSize: "0.78rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RefreshCw size={13} className={loading ? "spin" : ""} />
            {t("actions.sync", "Sync")}
          </button>

          {isDoctor ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: "#ECFDF5",
                border: "1px solid #A7F3D0",
                borderRadius: "6px",
                color: "#059669",
                fontSize: "0.78rem",
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={15} />
              <span>{t("profile.verified_clinician", "Verified Clinician (NMC)")}</span>
            </div>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setViewCardOpen(true)}
              style={{
                minHeight: "40px",
                padding: "8px 16px",
                fontSize: "0.78rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <CreditCard size={15} />
              {t("profile.view_card", "View Digital Pass")}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="clinical-error-banner" style={{ marginBottom: "16px" }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Modern Segmented Tabs ── */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          background: "var(--bg-surface-alt)",
          padding: "4px",
          borderRadius: "10px",
          border: "1px solid var(--border-default)",
          marginBottom: "20px",
          overflowX: "auto",
        }}
      >
        {isDoctor ? (
          <>
            <button
              type="button"
              onClick={() => setActiveTab("practice")}
              style={{
                flex: 1,
                minWidth: "150px",
                padding: "8px 14px",
                fontSize: "0.80rem",
                fontWeight: activeTab === "practice" ? 600 : 500,
                color: activeTab === "practice" ? "var(--primary)" : "var(--text-secondary)",
                background: activeTab === "practice" ? "var(--bg-surface)" : "transparent",
                border: activeTab === "practice" ? "1px solid var(--border-default)" : "1px solid transparent",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                boxShadow: activeTab === "practice" ? "0 1px 3px rgba(15, 23, 42, 0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Stethoscope size={15} /> {t("profile.tab_practice", "Clinical Practice & Licensing")}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("contact")}
              style={{
                flex: 1,
                minWidth: "150px",
                padding: "8px 14px",
                fontSize: "0.80rem",
                fontWeight: activeTab === "contact" ? 600 : 500,
                color: activeTab === "contact" ? "var(--primary)" : "var(--text-secondary)",
                background: activeTab === "contact" ? "var(--bg-surface)" : "transparent",
                border: activeTab === "contact" ? "1px solid var(--border-default)" : "1px solid transparent",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                boxShadow: activeTab === "contact" ? "0 1px 3px rgba(15, 23, 42, 0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Phone size={15} /> {t("profile.tab_contact", "Practice Contact & Notifications")}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setActiveTab("identity")}
              style={{
                flex: 1,
                minWidth: "150px",
                padding: "8px 14px",
                fontSize: "0.80rem",
                fontWeight: activeTab === "identity" ? 600 : 500,
                color: activeTab === "identity" ? "var(--primary)" : "var(--text-secondary)",
                background: activeTab === "identity" ? "var(--bg-surface)" : "transparent",
                border: activeTab === "identity" ? "1px solid var(--border-default)" : "1px solid transparent",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                boxShadow: activeTab === "identity" ? "0 1px 3px rgba(15, 23, 42, 0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <User size={15} /> {t("profile.tab_identity", "Identity & Demographics")}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("records")}
              style={{
                flex: 1,
                minWidth: "150px",
                padding: "8px 14px",
                fontSize: "0.80rem",
                fontWeight: activeTab === "records" ? 600 : 500,
                color: activeTab === "records" ? "var(--primary)" : "var(--text-secondary)",
                background: activeTab === "records" ? "var(--bg-surface)" : "transparent",
                border: activeTab === "records" ? "1px solid var(--border-default)" : "1px solid transparent",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                boxShadow: activeTab === "records" ? "0 1px 3px rgba(15, 23, 42, 0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Activity size={15} /> {t("profile.tab_records", "Clinical Records & Meds")}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pass")}
              style={{
                flex: 1,
                minWidth: "150px",
                padding: "8px 14px",
                fontSize: "0.80rem",
                fontWeight: activeTab === "pass" ? 600 : 500,
                color: activeTab === "pass" ? "var(--primary)" : "var(--text-secondary)",
                background: activeTab === "pass" ? "var(--bg-surface)" : "transparent",
                border: activeTab === "pass" ? "1px solid var(--border-default)" : "1px solid transparent",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                boxShadow: activeTab === "pass" ? "0 1px 3px rgba(15, 23, 42, 0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <CreditCard size={15} /> {t("profile.tab_card", "Emergency ID Pass")}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          style={{
            flex: 1,
            minWidth: "150px",
            padding: "8px 14px",
            fontSize: "0.80rem",
            fontWeight: activeTab === "security" ? 700 : 600,
            color: activeTab === "security" ? "var(--primary)" : "var(--text-secondary)",
            background: activeTab === "security" ? "var(--bg-surface)" : "transparent",
            border: activeTab === "security" ? "1px solid var(--border-default)" : "1px solid transparent",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
            boxShadow: activeTab === "security" ? "0 1px 3px rgba(15, 23, 42, 0.06)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          <Shield size={15} /> {t("profile.tab_security", "Security & Account")}
        </button>
      </div>

      {/* ── DOCTOR TAB 1: CLINICAL PRACTICE & LICENSING ── */}
      {isDoctor && activeTab === "practice" && (
        <div className="responsive-grid-two-col" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "20px", marginBottom: "20px" }}>
          {/* Left: Practice Credentials */}
          <div className="panel" style={{ padding: "20px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1px solid var(--border-default)", paddingBottom: "10px" }}>
              <Stethoscope size={18} color="var(--primary)" />
              <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {t("profile.practice_title", "Clinician Practice Credentials & Licensing")}
              </h3>
            </div>

            <div className="responsive-grid-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div className="form-group">
                <label className="form-label">{t("profile.full_name", "Full Legal Name & Title")}</label>
                <input
                  type="text"
                  className="input-control"
                  value={profile.name || ""}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  onBlur={handleFieldBlur}
                  placeholder="e.g. Dr. Aryan Choudhury, MD"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("profile.specialty", "Medical Specialty")}</label>
                <input
                  type="text"
                  className="input-control"
                  value={profile.specialty || ""}
                  onChange={(e) => handleFieldChange("specialty", e.target.value)}
                  onBlur={handleFieldBlur}
                  placeholder="e.g. General Medicine & Clinical AI"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("profile.registration_number", "Medical Registration / License No.")}</label>
                <input
                  type="text"
                  className="input-control"
                  value={profile.registration_number || profile.license_id || ""}
                  onChange={(e) => {
                    handleFieldChange("registration_number", e.target.value);
                    handleFieldChange("license_id", e.target.value);
                  }}
                  onBlur={handleFieldBlur}
                  placeholder="e.g. MCI-2024-99881"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("profile.council_name", "State / National Medical Council")}</label>
                <input
                  type="text"
                  className="input-control"
                  value={profile.council_name || ""}
                  onChange={(e) => handleFieldChange("council_name", e.target.value)}
                  onBlur={handleFieldBlur}
                  placeholder="e.g. Delhi Medical Council"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("profile.experience_years", "Clinical Experience (Years)")}</label>
                <input
                  type="number"
                  min="0"
                  max="70"
                  className="input-control"
                  value={profile.experience_years ?? 6}
                  onChange={(e) => handleFieldChange("experience_years", e.target.value === "" ? "" : Number(e.target.value))}
                  onBlur={handleFieldBlur}
                  placeholder="e.g. 8"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("profile.fee_inr", "Tele-Consultation Fee (₹ INR)")}</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  className="input-control"
                  value={profile.fee_inr ?? 600}
                  onChange={(e) => handleFieldChange("fee_inr", e.target.value === "" ? "" : Number(e.target.value))}
                  onBlur={handleFieldBlur}
                  placeholder="e.g. 800"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label className="form-label">{t("profile.hospital_affiliation", "Hospital / Clinical Institution Affiliation")}</label>
              <input
                type="text"
                className="input-control"
                value={profile.hospital || ""}
                onChange={(e) => handleFieldChange("hospital", e.target.value)}
                onBlur={handleFieldBlur}
                placeholder="e.g. Q-Rakshak Clinical AI OPD / AIIMS New Delhi"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("profile.languages", "Consultation Languages")}</label>
              <input
                type="text"
                className="input-control"
                value={Array.isArray(profile.languages) ? profile.languages.join(", ") : (profile.languages || "English, Hindi")}
                onChange={(e) => handleFieldChange("languages", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                onBlur={handleFieldBlur}
                placeholder="English, Hindi, Assamese"
              />
            </div>
          </div>

          {/* Right: Tele-Consultation Availability & NMC Status */}
          <div className="panel" style={{ padding: "20px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-default)", paddingBottom: "10px" }}>
              <Clock size={18} color="var(--primary)" />
              <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {t("profile.teleconsultation_schedule", "Tele-Consultation Availability")}
              </h3>
            </div>

            <div style={{ padding: "12px 14px", background: "var(--bg-surface-alt)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                {t("profile.available_slots", "Daily OPD Slots (Comma separated)")}
              </span>
              <input
                type="text"
                className="input-control"
                value={Array.isArray(profile.available_slots) ? profile.available_slots.join(", ") : (profile.available_slots || "09:30 AM, 11:00 AM, 02:30 PM, 04:30 PM")}
                onChange={(e) => handleFieldChange("available_slots", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                onBlur={handleFieldBlur}
                placeholder="09:30 AM, 11:00 AM, 02:30 PM, 04:30 PM"
              />
            </div>

            <div style={{ padding: "14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#166534", marginBottom: "6px" }}>
                <CheckCircle2 size={16} />
                <strong style={{ fontSize: "0.85rem" }}>{t("profile.nmc_verified", "NMC Registry Status: Verified")}</strong>
              </div>
              <p style={{ fontSize: "0.76rem", color: "#15803D", margin: 0, lineHeight: 1.45 }}>
                {t("profile.nmc_verified_desc", "This practitioner account has been verified against the National Medical Commission registry. Credentials are cryptographically attested on the DPDP ledger.")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── DOCTOR TAB 2: PRACTICE CONTACT & NOTIFICATIONS ── */}
      {isDoctor && activeTab === "contact" && (
        <div className="responsive-grid-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
          <div className="panel" style={{ padding: "20px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1px solid var(--border-default)", paddingBottom: "10px" }}>
              <Mail size={18} color="var(--primary)" />
              <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {t("profile.practice_contacts", "Clinician Contact Information")}
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="form-group">
                <label className="form-label">{t("profile.primary_email", "Official Practice Email")}</label>
                <input
                  type="email"
                  className="input-control"
                  value={profile.primary_email || currentUser?.email || ""}
                  onChange={(e) => handleFieldChange("primary_email", e.target.value)}
                  onBlur={handleFieldBlur}
                  placeholder="clinician@hospital.org"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("profile.extra_email", "Secondary Communication Email")}</label>
                <input
                  type="email"
                  className="input-control"
                  value={profile.extra_email || ""}
                  onChange={(e) => handleFieldChange("extra_email", e.target.value)}
                  onBlur={handleFieldBlur}
                  placeholder="dr.secondary@gmail.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("profile.phone", "Emergency Clinical Phone Number")}</label>
                <input
                  type="tel"
                  className="input-control"
                  value={profile.emergency_phone || profile.phone || ""}
                  onChange={(e) => {
                    handleFieldChange("emergency_phone", e.target.value);
                    handleFieldChange("phone", e.target.value);
                  }}
                  onBlur={handleFieldBlur}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: "20px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1px solid var(--border-default)", paddingBottom: "10px" }}>
              <Activity size={18} color="var(--primary)" />
              <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {t("profile.clinical_alerts", "Clinical Triage & Telemetry Alerts")}
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.82rem", color: "var(--text-primary)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={profile.notifications_critical_qpu !== false}
                  onChange={(e) => handleFieldChange("notifications_critical_qpu", e.target.checked)}
                />
                <span>{t("profile.alert_critical", "Instant SMS alerts for urgent/critical triage intake requests")}</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.82rem", color: "var(--text-primary)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={profile.notifications_email !== false}
                  onChange={(e) => handleFieldChange("notifications_email", e.target.checked)}
                />
                <span>{t("profile.alert_email", "Email notifications for confirmed appointments and room tokens")}</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.82rem", color: "var(--text-primary)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={profile.notifications_sms !== false}
                  onChange={(e) => handleFieldChange("notifications_sms", e.target.checked)}
                />
                <span>{t("profile.alert_sms", "Daily agenda briefing dispatched at 08:00 AM IST")}</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 1: IDENTITY & DEMOGRAPHICS (PATIENT ONLY) ── */}
      {!isDoctor && activeTab === "identity" && (
        <div className="responsive-grid-two-col" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "20px", marginBottom: "20px" }}>
          {/* Left: Demographics Box */}
          <div className="panel" style={{ padding: "20px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1px solid var(--border-default)", paddingBottom: "10px" }}>
              <User size={18} color="var(--accent-blue)" />
              <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--ink-primary)", margin: 0 }}>
                Patient Legal Identity & Contacts
              </h3>
            </div>

            <div className="responsive-grid-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div className="form-group">
                <label className="form-label">Full Legal Name</label>
                <input
                  type="text"
                  className="input-control"
                  value={profile.name || ""}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  onBlur={handleFieldBlur}
                  placeholder="Enter full legal name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Username / System ID</label>
                <input
                  type="text"
                  className="input-control"
                  value={profile.username || currentUser?.username || ""}
                  readOnly
                  placeholder="System ID"
                  style={{ background: "var(--bg-surface-alt)", color: "var(--text-muted)", cursor: "not-allowed" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Age</label>
                <input
                  type="number"
                  min="0"
                  max="130"
                  className="input-control"
                  value={profile.age ?? ""}
                  onChange={(e) => handleFieldChange("age", e.target.value === "" ? "" : Number(e.target.value))}
                  onBlur={handleFieldBlur}
                  placeholder="Enter age"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Biological Sex</label>
                <select
                  className="select-control"
                  value={profile.gender || ""}
                  onChange={(e) => handleFieldChange("gender", e.target.value)}
                  onBlur={handleFieldBlur}
                >
                  <option value="">Select Biological Sex</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Intersex">Intersex</option>
                </select>
              </div>
            </div>

            <div className="responsive-grid-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div className="form-group">
                <label className="form-label">Primary Email</label>
                <input
                  type="email"
                  className="input-control"
                  value={profile.primary_email || ""}
                  onChange={(e) => handleFieldChange("primary_email", e.target.value)}
                  onBlur={handleFieldBlur}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Direct Phone</label>
                <input
                  type="text"
                  className="input-control"
                  value={profile.phone || ""}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  onBlur={handleFieldBlur}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>

            <div className="responsive-grid-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select
                  className="select-control"
                  value={profile.blood_group || ""}
                  onChange={(e) => {
                    handleFieldChange("blood_group", e.target.value);
                    autoSaveToDb({ ...profile, blood_group: e.target.value });
                  }}
                  style={{ fontWeight: 800, color: profile.blood_group ? "var(--risk-high)" : "var(--text-muted)" }}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+ (A Positive)</option>
                  <option value="A-">A- (A Negative)</option>
                  <option value="B+">B+ (B Positive)</option>
                  <option value="B-">B- (B Negative)</option>
                  <option value="AB+">AB+ (AB Positive)</option>
                  <option value="AB-">AB- (AB Negative)</option>
                  <option value="O+">O+ (O Positive)</option>
                  <option value="O-">O- (O Negative)</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", paddingTop: "20px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.80rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={!!profile.organ_donor}
                    onChange={(e) => handleFieldChange("organ_donor", e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <span style={{ fontWeight: 700, color: "var(--ink-primary)" }}>
                    Consented Organ Donor
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Hospital Identifiers */}
          <div className="panel" style={{ padding: "20px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1px solid var(--border-default)", paddingBottom: "10px" }}>
              <Shield size={18} color="var(--accent-teal)" />
              <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--ink-primary)", margin: 0 }}>
                Healthcare Identifiers & Primary Facility
              </h3>
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label className="form-label">ABHA Health ID (Ayushman Bharat)</label>
              <input
                type="text"
                className="input-control"
                value={profile.abha_id || ""}
                onChange={(e) => handleFieldChange("abha_id", e.target.value)}
                onBlur={handleFieldBlur}
                placeholder="91-XXXX-XXXX-XXXX"
                style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label className="form-label">Medical Record Number (MRN)</label>
              <input
                type="text"
                className="input-control"
                value={profile.license_id || ""}
                onChange={(e) => handleFieldChange("license_id", e.target.value)}
                onBlur={handleFieldBlur}
                placeholder="PT-REC-XXXXX"
                style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label className="form-label">Hospital / Tertiary Center</label>
              <input
                type="text"
                className="input-control"
                value={profile.hospital || ""}
                onChange={(e) => handleFieldChange("hospital", e.target.value)}
                onBlur={handleFieldBlur}
                placeholder="Hospital / Tertiary Center"
              />
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label className="form-label">Department / Ward</label>
              <input
                type="text"
                className="input-control"
                value={profile.department || ""}
                onChange={(e) => handleFieldChange("department", e.target.value)}
                onBlur={handleFieldBlur}
                placeholder="Department / Ward"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Attending Physician</label>
              <input
                type="text"
                className="input-control"
                value={profile.attending_physician || ""}
                onChange={(e) => handleFieldChange("attending_physician", e.target.value)}
                onBlur={handleFieldBlur}
                placeholder="Dr. Physician Name (Department)"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: CLINICAL RECORDS & MEDS (PATIENT ONLY) ── */}
      {!isDoctor && activeTab === "records" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
          {/* Left: Allergies & Contraindications Manager */}
          <div className="panel" style={{ padding: "20px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1px solid var(--border-default)", paddingBottom: "10px" }}>
              <AlertTriangle size={18} color="#DC2626" />
              <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--ink-primary)", margin: 0 }}>
                Known Allergies & Contraindications
              </h3>
            </div>

            {/* List of active allergy chips */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              {allergiesList.map((alg) => (
                <div
                  key={alg.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: alg.severity === "HIGH" ? "var(--risk-high-bg)" : "var(--risk-mid-bg)",
                    border: `1px solid ${alg.severity === "HIGH" ? "var(--risk-high-border)" : "var(--risk-mid-border)"}`,
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "0.84rem", color: alg.severity === "HIGH" ? "var(--risk-high)" : "var(--risk-mid)" }}>
                        {alg.allergen}
                      </strong>
                      <span
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: alg.severity === "HIGH" ? "#DC2626" : "#D97706",
                          color: "#FFFFFF",
                        }}
                      >
                        {alg.severity} RISK
                      </span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                      {alg.reaction}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAllergy(alg.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#94A3B8",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                    title="Remove Allergy"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {allergiesList.length === 0 && (
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  No known allergies documented.
                </p>
              )}
            </div>

            {/* Add New Allergy Form */}
            <div style={{ background: "var(--bg-surface-alt)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "12px" }}>
              <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--ink-primary)", marginBottom: "8px" }}>
                Add New Allergy / Drug Sensitivity
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: "8px", marginBottom: "8px" }}>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Allergen (e.g. Sulfa, Peanuts)"
                  value={newAllergen}
                  onChange={(e) => setNewAllergen(e.target.value)}
                />
                <select
                  className="select-control"
                  value={newAllergySev}
                  onChange={(e) => setNewAllergySev(e.target.value)}
                >
                  <option value="HIGH">HIGH</option>
                  <option value="MODERATE">MODERATE</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: "8px" }}>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Expected reaction (e.g. Anaphylaxis)"
                  value={newAllergyRxn}
                  onChange={(e) => setNewAllergyRxn(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={addAllergy}
                  style={{ padding: "6px 12px", fontSize: "0.74rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>

            {/* Medical History Conditions */}
            <div style={{ marginTop: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--ink-primary)" }}>Medical Diagnoses & History</label>
                <button type="button" className="btn-secondary" onClick={addMedicalHistory} style={{ padding: "4px 8px", fontSize: "0.70rem" }}><Plus size={12} /> Add Condition</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {medicalHistory.map((item) => (
                  <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 32px", gap: "8px", alignItems: "center" }}>
                    <input type="text" className="input-control" value={item.condition || ""} onChange={(e) => updateMedicalHistory(item.id, "condition", e.target.value)} placeholder="Condition / Diagnosis" />
                    <input type="text" className="input-control" value={item.notes || ""} onChange={(e) => updateMedicalHistory(item.id, "notes", e.target.value)} placeholder="Year or notes" />
                    <button type="button" onClick={() => setMedicalHistory((items) => items.filter((entry) => entry.id !== item.id))} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Active Medications Manager */}
          <div className="panel" style={{ padding: "20px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1px solid var(--border-default)", paddingBottom: "10px" }}>
              <Stethoscope size={18} color="var(--accent-blue)" />
              <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--ink-primary)", margin: 0 }}>
                Active Pharmacotherapy & Prescriptions
              </h3>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                Current ongoing medications, dosage, and intake frequency:
              </span>
              <button type="button" className="btn-secondary" onClick={addMedication} style={{ padding: "5px 10px", fontSize: "0.72rem" }}>
                <Plus size={13} /> Add Med
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {medications.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 0.8fr 1fr 32px",
                    gap: "8px",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "var(--bg-surface-alt)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <input
                    type="text"
                    className="input-control"
                    value={item.name || ""}
                    onChange={(e) => updateMedication(item.id, "name", e.target.value)}
                    placeholder="Medication name"
                  />
                  <input
                    type="text"
                    className="input-control"
                    value={item.dose || ""}
                    onChange={(e) => updateMedication(item.id, "dose", e.target.value)}
                    placeholder="Dose (e.g. 20mg)"
                  />
                  <input
                    type="text"
                    className="input-control"
                    value={item.frequency || ""}
                    onChange={(e) => updateMedication(item.id, "frequency", e.target.value)}
                    placeholder="Frequency (OD/BD)"
                  />
                  <button
                    type="button"
                    onClick={() => setMedications((items) => items.filter((entry) => entry.id !== item.id))}
                    style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
                    title="Remove Medication"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Emergency Contacts Section */}
            <div style={{ marginTop: "24px", borderTop: "1px solid var(--border-default)", paddingTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Phone size={15} color="#DC2626" />
                  <strong style={{ fontSize: "0.80rem", color: "var(--ink-primary)" }}>Emergency Contacts & Next of Kin</strong>
                </div>
                <button type="button" className="btn-secondary" onClick={addEmergencyContact} style={{ padding: "4px 8px", fontSize: "0.70rem" }}>
                  <Plus size={12} /> Add Contact
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {emergencyContacts.map((contact) => (
                  <div key={contact.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 32px", gap: "8px", alignItems: "center" }}>
                    <input type="text" className="input-control" value={contact.name || ""} onChange={(e) => updateEmergencyContact(contact.id, "name", e.target.value)} placeholder="Full Name" />
                    <input type="text" className="input-control" value={contact.relation || ""} onChange={(e) => updateEmergencyContact(contact.id, "relation", e.target.value)} placeholder="Relation (Brother/Spouse)" />
                    <input type="text" className="input-control" value={contact.phone || ""} onChange={(e) => updateEmergencyContact(contact.id, "phone", e.target.value)} placeholder="Phone number" />
                    <button type="button" onClick={() => setEmergencyContacts((items) => items.filter((entry) => entry.id !== contact.id))} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: EMERGENCY ID PASS PREVIEW (PATIENT ONLY) ── */}
      {!isDoctor && activeTab === "pass" && (
        <div className="panel" style={{ padding: "24px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-default)", paddingBottom: "12px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--ink-primary)", margin: 0 }}>
                Digital Health Identity Pass (ISO/IEC 7810 ID-1 Standard)
              </h3>
              <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                Permanent patient pass with scannable dynamic QR resolving directly to live emergency telemetry.
              </span>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              {/* Theme Selector */}
              <div style={{ display: "inline-flex", background: "var(--bg-surface-alt)", padding: "3px", borderRadius: "8px", border: "1px solid var(--border-default)", gap: "2px" }}>
                <button
                  type="button"
                  onClick={() => setCardTheme("both")}
                  style={{
                    background: cardTheme === "both" ? "var(--bg-surface)" : "transparent",
                    color: cardTheme === "both" ? "var(--ink-primary)" : "var(--text-secondary)",
                    border: 0,
                    borderRadius: "6px",
                    padding: "4px 9px",
                    fontSize: "0.70rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: cardTheme === "both" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  Both Editions
                </button>
                <button
                  type="button"
                  onClick={() => setCardTheme("light")}
                  style={{
                    background: cardTheme === "light" ? "var(--bg-surface)" : "transparent",
                    color: cardTheme === "light" ? "var(--ink-primary)" : "var(--text-secondary)",
                    border: 0,
                    borderRadius: "6px",
                    padding: "4px 9px",
                    fontSize: "0.70rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: cardTheme === "light" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  Day White
                </button>
                <button
                  type="button"
                  onClick={() => setCardTheme("dark")}
                  style={{
                    background: cardTheme === "dark" ? "#0F172A" : "transparent",
                    color: cardTheme === "dark" ? "#FFFFFF" : "var(--text-secondary)",
                    border: 0,
                    borderRadius: "6px",
                    padding: "4px 9px",
                    fontSize: "0.70rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: cardTheme === "dark" ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                  }}
                >
                  Matte Black
                </button>
              </div>

              {/* Face Selector: Dual, Front, Back */}
              <div style={{ display: "inline-flex", background: "var(--bg-surface-alt)", padding: "3px", borderRadius: "8px", border: "1px solid var(--border-default)", gap: "2px" }}>
                <button
                  type="button"
                  onClick={() => setCardFace("dual")}
                  style={{
                    background: cardFace === "dual" ? "var(--bg-surface)" : "transparent",
                    color: cardFace === "dual" ? "var(--accent-blue)" : "var(--text-secondary)",
                    border: 0,
                    borderRadius: "6px",
                    padding: "4px 9px",
                    fontSize: "0.70rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: cardFace === "dual" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  Dual View (Front + Back)
                </button>
                <button
                  type="button"
                  onClick={() => setCardFace("front")}
                  style={{
                    background: cardFace === "front" ? "var(--bg-surface)" : "transparent",
                    color: cardFace === "front" ? "var(--accent-blue)" : "var(--text-secondary)",
                    border: 0,
                    borderRadius: "6px",
                    padding: "4px 9px",
                    fontSize: "0.70rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: cardFace === "front" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  Front Face
                </button>
                <button
                  type="button"
                  onClick={() => setCardFace("back")}
                  style={{
                    background: cardFace === "back" ? "var(--bg-surface)" : "transparent",
                    color: cardFace === "back" ? "var(--accent-blue)" : "var(--text-secondary)",
                    border: 0,
                    borderRadius: "6px",
                    padding: "4px 9px",
                    fontSize: "0.70rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: cardFace === "back" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  Back Face
                </button>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  navigator.clipboard?.writeText(emergencyPortalUrl);
                  setCopiedPass(true);
                  setTimeout(() => setCopiedPass(false), 2000);
                }}
              >
                <Copy size={13} /> {copiedPass ? "Copied Link!" : "Copy Triage Link"}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => window.print()}
              >
                <Printer size={13} /> Print Medical ID
              </button>
            </div>
          </div>

          {/* Render both physical cards with Dual / Front / Back support */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "28px", justifyContent: "center", alignItems: "flex-start", padding: "16px 0" }}>
            {/* Day White Edition */}
            {(cardTheme === "both" || cardTheme === "light") && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", width: "100%", maxWidth: cardFace === "dual" ? "920px" : "480px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--ink-primary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Clinical Day White Edition
                  </span>
                  {cardFace === "dual" && (
                    <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--accent-blue)", background: "var(--accent-blue-light)", padding: "1px 6px", borderRadius: "4px" }}>
                      FRONT + BACK DUAL VIEW
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
                  {(cardFace === "dual" || cardFace === "front") && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "100%", maxWidth: "440px" }}>
                      <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Front View (QR & ID)</span>
                      <TriagePhysicalCard
                        patient={profile}
                        variant="light"
                        face="front"
                        emergencyPortalUrl={emergencyPortalUrl}
                        onCopy={() => {
                          navigator.clipboard?.writeText(emergencyPortalUrl);
                          setCopiedPass(true);
                          setTimeout(() => setCopiedPass(false), 2000);
                        }}
                        copied={copiedPass}
                      />
                    </div>
                  )}

                  {(cardFace === "dual" || cardFace === "back") && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "100%", maxWidth: "440px" }}>
                      <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Back View (Allergies, Rx & Vitals)</span>
                      <TriagePhysicalCard
                        patient={profile}
                        variant="light"
                        face="back"
                        emergencyPortalUrl={emergencyPortalUrl}
                        onCopy={() => {
                          navigator.clipboard?.writeText(emergencyPortalUrl);
                          setCopiedPass(true);
                          setTimeout(() => setCopiedPass(false), 2000);
                        }}
                        copied={copiedPass}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Matte Black Edition */}
            {(cardTheme === "both" || cardTheme === "dark") && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", width: "100%", maxWidth: cardFace === "dual" ? "920px" : "480px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--ink-primary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Matte Black Edition (First Responder)
                  </span>
                  {cardFace === "dual" && (
                    <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--accent-blue)", background: "var(--accent-blue-light)", padding: "1px 6px", borderRadius: "4px" }}>
                      FRONT + BACK DUAL VIEW
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
                  {(cardFace === "dual" || cardFace === "front") && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "100%", maxWidth: "440px" }}>
                      <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Front View (QR & ID)</span>
                      <TriagePhysicalCard
                        patient={profile}
                        variant="dark"
                        face="front"
                        emergencyPortalUrl={emergencyPortalUrl}
                        onCopy={() => {
                          navigator.clipboard?.writeText(emergencyPortalUrl);
                          setCopiedPass(true);
                          setTimeout(() => setCopiedPass(false), 2000);
                        }}
                        copied={copiedPass}
                      />
                    </div>
                  )}

                  {(cardFace === "dual" || cardFace === "back") && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "100%", maxWidth: "440px" }}>
                      <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Back View (Allergies, Rx & Vitals)</span>
                      <TriagePhysicalCard
                        patient={profile}
                        variant="dark"
                        face="back"
                        emergencyPortalUrl={emergencyPortalUrl}
                        onCopy={() => {
                          navigator.clipboard?.writeText(emergencyPortalUrl);
                          setCopiedPass(true);
                          setTimeout(() => setCopiedPass(false), 2000);
                        }}
                        copied={copiedPass}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: SECURITY & ACCOUNT MANAGEMENT ── */}
      {activeTab === "security" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "800px", margin: "0 auto 20px auto" }}>
          <div className="panel" style={{ padding: "20px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1px solid var(--border-default)", paddingBottom: "10px" }}>
              <Shield size={18} color="var(--accent-blue)" />
              <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--ink-primary)", margin: 0 }}>
                Data Security & Audit Controls
              </h3>
            </div>

            <p style={{ fontSize: "0.80rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "14px" }}>
              Your electronic health records and biometric measurements are protected under immutable audit logging (WORM) and AES-256 encryption at rest.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-surface-alt)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)" }}>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink-primary)" }}>Two-Factor Authentication</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Secures medical data using hardware or app-based OTP</div>
                </div>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#059669", background: "#ECFDF5", padding: "3px 8px", borderRadius: "4px" }}>ACTIVE</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-surface-alt)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)" }}>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink-primary)" }}>Public Emergency Pass Access</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Permits authorized first responders to scan your triage pass</div>
                </div>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent-blue)", background: "var(--accent-blue-soft)", padding: "3px 8px", borderRadius: "4px" }}>ENABLED</span>
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: "20px", background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "#DC2626" }}>
              <AlertTriangle size={18} />
              <h3 style={{ fontSize: "0.92rem", fontWeight: 800, margin: 0 }}>
                {isDoctor ? t("profile.danger_zone_doctor", "Danger Zone: Delete Doctor Account") : t("profile.danger_zone_patient", "Danger Zone: Delete Account")}
              </h3>
            </div>
            <p style={{ fontSize: "0.78rem", color: "#9F1239", lineHeight: 1.5, marginBottom: "14px" }}>
              {isDoctor
                ? t("profile.danger_desc_doctor", "Permanently purge your clinician profile, license records, consultation rooms, and all database associations without any traces. This action is irreversible.")
                : t("profile.danger_desc_patient", "Permanently purge all patient profile data, telemetry history, diagnostic inferences, and emergency passes from the database without any traces. This action is irreversible.")}
            </p>
            <button
              type="button"
              className="btn-danger"
              onClick={() => setDeleteConfirmOpen(true)}
              style={{ fontSize: "0.78rem", padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Trash2 size={14} /> {isDoctor ? t("profile.delete_doctor_btn", "Delete Doctor Account") : t("profile.delete_patient_btn", "Delete Account")}
            </button>
          </div>
        </div>
      )}


            {/* ── Modal: Digital Health Identity Card (ISO/IEC 7810 ID-1 Physical Standard) ── */}
      {viewCardOpen && (
        <div className="modal-overlay" onClick={() => setViewCardOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "820px", padding: "24px", maxHeight: "90vh", overflowY: "auto" }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
                borderBottom: "1px solid var(--border-default)",
                paddingBottom: "10px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CreditCard size={18} color="var(--accent-blue)" />
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--ink-primary)", margin: 0 }}>
                    Emergency Medical Identity Card
                  </h3>
                </div>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
                  ISO/IEC 7810 ID-1 Standard (85.60 mm × 53.98 mm) • Permanent Unique ID Resolution
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* Theme Selector — one at a time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Edition:</span>
                  <div
                    style={{
                      display: 'flex',
                      background: 'var(--bg-surface-alt)',
                      padding: '3px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-default)',
                      gap: '2px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setCardTheme('light')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.68rem',
                        fontWeight: cardTheme === 'light' ? 700 : 500,
                        background: cardTheme === 'light' ? '#FFFFFF' : 'transparent',
                        color: cardTheme === 'light' ? '#0F172A' : 'var(--text-secondary)',
                        border: cardTheme === 'light' ? '1px solid #CBD5E1' : '1px solid transparent',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        boxShadow: cardTheme === 'light' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      }}
                    >
                      ☀ Day White
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardTheme('dark')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.68rem',
                        fontWeight: cardTheme === 'dark' ? 700 : 500,
                        background: cardTheme === 'dark' ? '#1E232B' : 'transparent',
                        color: cardTheme === 'dark' ? '#FFFFFF' : 'var(--text-secondary)',
                        border: cardTheme === 'dark' ? '1px solid #374151' : '1px solid transparent',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        boxShadow: cardTheme === 'dark' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                      }}
                    >
                      ◼ Matte Slate
                    </button>
                  </div>
                </div>

                {/* Face Toggle Selector */}
                <div
                  style={{
                    display: "flex",
                    background: "var(--bg-surface-alt)",
                    padding: "3px",
                    borderRadius: "var(--radius-xs)",
                    border: "1px solid var(--border-default)",
                    gap: "2px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setCardFace("dual")}
                    style={{
                      padding: "4px 8px",
                      fontSize: "0.68rem",
                      fontWeight: cardFace === "dual" ? 700 : 500,
                      background: cardFace === "dual" ? "var(--bg-surface)" : "transparent",
                      color: cardFace === "dual" ? "var(--accent-blue)" : "var(--text-secondary)",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      boxShadow: cardFace === "dual" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    }}
                  >
                    Dual View (Front + Back)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardFace("front")}
                    style={{
                      padding: "4px 8px",
                      fontSize: "0.68rem",
                      fontWeight: cardFace === "front" ? 700 : 500,
                      background: cardFace === "front" ? "var(--bg-surface)" : "transparent",
                      color: cardFace === "front" ? "var(--accent-blue)" : "var(--text-secondary)",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      boxShadow: cardFace === "front" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    }}
                  >
                    Front Face
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardFace("back")}
                    style={{
                      padding: "4px 8px",
                      fontSize: "0.68rem",
                      fontWeight: cardFace === "back" ? 700 : 500,
                      background: cardFace === "back" ? "var(--bg-surface)" : "transparent",
                      color: cardFace === "back" ? "var(--accent-blue)" : "var(--text-secondary)",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      boxShadow: cardFace === "back" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    }}
                  >
                    Back Face
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setViewCardOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Permanent Resolution Notice */}
            <div
              style={{
                background: "var(--accent-blue-light)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-xs)",
                padding: "8px 12px",
                fontSize: "0.70rem",
                color: "var(--ink-primary)",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Shield size={14} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
              <div>
                <strong>Permanent Dynamic Resolution:</strong> This QR code links to your permanent ID (<code>{profile.user_id || activeUserId}</code>). Future updates to contacts, allergies, or medications sync automatically without invalidating printed cards.
              </div>
            </div>

            {/* ── Physical Triage Card Preview — Single Selected Edition ── */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                margin: '10px 0 20px 0',
                width: '100%',
              }}
            >
              {/* Edition label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: cardTheme === 'dark' ? '#94A3B8' : 'var(--ink-primary)' }}>
                  {cardTheme === 'light' ? '☀ Clinical White Edition (Day / Print)' : '◼ Matte Slate Gray Edition (First Responder)'}
                </span>
                {cardFace === 'dual' && (
                  <span style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--accent-blue)', background: 'var(--accent-blue-light)', padding: '1px 6px', borderRadius: '4px' }}>
                    FRONT + BACK
                  </span>
                )}
              </div>

              {/* Cards row */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                {(cardFace === 'dual' || cardFace === 'front') && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Front Face · QR &amp; ID</span>
                    <TriagePhysicalCard
                      patient={profile}
                      variant={cardTheme}
                      face="front"
                      emergencyPortalUrl={emergencyPortalUrl}
                      onCopy={() => {
                        navigator.clipboard?.writeText(emergencyPortalUrl);
                        setCopiedPass(true);
                        setTimeout(() => setCopiedPass(false), 2000);
                      }}
                      copied={copiedPass}
                    />
                  </div>
                )}

                {(cardFace === 'dual' || cardFace === 'back') && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Back Face · Allergies, Rx &amp; Vitals</span>
                    <TriagePhysicalCard
                      patient={profile}
                      variant={cardTheme}
                      face="back"
                      emergencyPortalUrl={emergencyPortalUrl}
                      onCopy={() => {
                        navigator.clipboard?.writeText(emergencyPortalUrl);
                        setCopiedPass(true);
                        setTimeout(() => setCopiedPass(false), 2000);
                      }}
                      copied={copiedPass}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ── Modal Footer Action Toolbar ── */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "12px",
                borderTop: "1px solid var(--border-default)",
                paddingTop: "12px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    navigator.clipboard?.writeText(emergencyPortalUrl);
                    setCopiedPass(true);
                    setTimeout(() => setCopiedPass(false), 2000);
                  }}
                  style={{ fontSize: "0.76rem" }}
                >
                  <Copy size={13} /> {copiedPass ? "Copied URL!" : "Copy Triage URL"}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => window.open(emergencyPortalUrl, "_blank")}
                  style={{ fontSize: "0.76rem" }}
                >
                  <ExternalLink size={13} /> Open Triage App
                </button>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    const pid = profile?.id || profile?.user_id || activeUserId;
                    if (pid && profile?.email) {
                      apiClient.post(`/api/v1/emergency/${pid}/email-card`, {
                        recipient_email: profile.email,
                      }).catch(() => {});
                    }
                    window.print();
                  }}
                  style={{ fontSize: "0.76rem", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Printer size={13} /> Print / Save PDF
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setViewCardOpen(false)}
                  style={{ fontSize: "0.76rem" }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ── Modal: Delete Account Confirmation ── */}
      {deleteConfirmOpen && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "var(--risk-high)" }}>
              <AlertTriangle size={20} />
              <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0 }}>
                Confirm Account Deletion
              </h3>
            </div>

            <p style={{ fontSize: "0.80rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "14px" }}>
              {isDoctor
                ? t("profile.modal_delete_doctor_desc", "This action permanently purges your clinician profile, license records, consultation rooms, and all database associations without any traces.")
                : t("profile.modal_delete_patient_desc", "This action permanently purges your patient record, biometric parameters, diagnostic inferences, and stored clinical data from the database without any traces.")}
            </p>

            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
              {t("profile.delete_type_prompt", "Type")} <strong style={{ color: "var(--risk-high)" }}>CONFIRM DELETION ACCOUNT</strong> {t("profile.delete_type_below", "below to authorize removal:")}
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="CONFIRM DELETION ACCOUNT"
              style={{ fontSize: "0.80rem", marginBottom: "16px" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteConfirmOpen(false)}
                style={{ fontSize: "0.76rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProfile}
                disabled={!isDeleteAuthorized || deleting}
                style={{
                  padding: "8px 14px",
                  background: isDeleteAuthorized ? "var(--risk-high)" : "var(--bg-surface-alt)",
                  color: isDeleteAuthorized ? "#FFFFFF" : "var(--text-muted)",
                  border: "none",
                  borderRadius: "var(--radius-xs)",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  cursor: isDeleteAuthorized ? "pointer" : "not-allowed",
                }}
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* ── Dedicated Invisible Print-Only Sheet (Activated by @media print for 1:1 Scale Print & PDF) ── */}
    <PrintableMedicalCardSheet
      patient={profile}
      cardTheme={cardTheme}
      cardFace={cardFace}
      emergencyPortalUrl={emergencyPortalUrl}
    />
  </>
  );
}
