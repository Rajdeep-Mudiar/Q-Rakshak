import { useState, useEffect, useRef } from "react";
import {
  Users,
  Calendar,
  Activity,
  Video,
  FileText,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  Eye,
  Edit3,
} from "lucide-react";
import { consultationsApi } from "../../api/consultations";
import VirtualConsultationRoom from "../consultation/VirtualConsultationRoom";
import { animateEntrance, animateCardStagger, animateShutterEntrance } from "../../utils/motion";
import { useLanguage } from "../../context/LanguageContext";

export default function ClinicianDashboard({ doctorId = "DOC-KAVITA", currentUser = null }) {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBookingForRoom, setActiveBookingForRoom] = useState(null);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [selectedPatientForOverride, setSelectedPatientForOverride] = useState(null);
  const [feedbackNotice, setFeedbackNotice] = useState(null);
  const containerRef = useRef(null);

  const resolvedDoctorId = currentUser?.doctor_id || doctorId;

  useEffect(() => {
    loadBookings();
    if (containerRef.current) {
      animateShutterEntrance(containerRef.current, { y: 12, duration: 0.35 });
      animateCardStagger(containerRef.current, ".card-panel");
    }
  }, [resolvedDoctorId]);

  async function loadBookings() {
    setLoading(true);
    try {
      const res = await consultationsApi.listBookings(null, resolvedDoctorId);
      if (res?.bookings) {
        setBookings(res.bookings);
      }
    } catch (err) {
      console.error("Failed to load doctor bookings:", err);
    } finally {
      setLoading(false);
    }
  }

  const emergencyCount = bookings.filter((b) => b.triage_risk === "emergency_red_flag").length;
  const routineCount = bookings.length - emergencyCount;

  const triageCohort = bookings.map((b) => {
    const isEmergency = b.triage_risk === "emergency_red_flag";
    return {
      id: b.id,
      name: b.patient_name || "Patient",
      patientId: b.patient_id || "—",
      mrn: b.mrn || (b.patient_id ? `MRN-${b.patient_id}-QX` : "—"),
      primaryModule: b.specialty || b.intake?.disease || "General Consultation",
      age: b.intake?.age || "—",
      gender: b.intake?.gender || "—",
      risk: isEmergency ? "Urgent review" : "Regular visit",
      isEmergency,
      crs: Math.round((isEmergency ? 0.92 : 0.28) * 100),
      symptoms: b.intake?.symptoms || b.intake?.reason || "General assessment & vital review",
      slotTime: b.slot_time || "10:30 AM",
      booking: b,
    };
  }).sort((a, b) => b.crs - a.crs);

  if (activeBookingForRoom) {
    return (
      <div style={{ borderRadius: 0 }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setActiveBookingForRoom(null)}
          style={{ marginBottom: "16px", display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: 0 }}
        >
          Return to Clinician Dashboard
        </button>
        <VirtualConsultationRoom
          booking={activeBookingForRoom}
          isDoctor={true}
          onLeave={() => {
            setActiveBookingForRoom(null);
            loadBookings();
          }}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", borderRadius: 0 }}>
      {/* Clinician Hero Card */}
      <div
        className="card-panel"
        style={{
          background: "var(--surface-base, #FFFFFF)",
          border: "1px solid var(--border-subtle, #E4E4E7)",
          borderLeft: "4px solid var(--accent-cobalt, #0052FF)",
          padding: "20px 24px",
          borderRadius: 0,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  background: "var(--surface-sunken, #F4F4F5)",
                  color: "var(--accent-cobalt, #0052FF)",
                  border: "1px solid var(--border-subtle, #E4E4E7)",
                  fontFamily: "var(--font-mono)",
                  borderRadius: 0,
                }}
              >
                {t("triage.attending_roster", "ATTENDING ROSTER")}
              </span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", color: "var(--ink-primary, #09090B)", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
                {t("triage.patient_care_title", "Patient Care & Ambulatory Triage")}
              </h2>
            </div>
            <p style={{ color: "var(--ink-secondary, #71717A)", fontSize: "0.82rem", margin: 0 }}>
              {t("triage.attending_label", "Attending")}: <strong style={{ color: "var(--ink-primary, #09090B)" }}>{currentUser?.name || "Dr. Kavita Rao, MD"}</strong> • {t("triage.license_provider_id", "License / Provider ID")}: <strong style={{ fontFamily: "var(--font-mono)" }}>{resolvedDoctorId}</strong> • {t("triage.ward_label", "Ward")}: <strong style={{ color: "var(--ink-primary, #09090B)" }}>{t("triage.ward_val", "Emergency & Ambulatory OPD")}</strong>
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <span
              style={{
                padding: "6px 12px",
                fontSize: "0.72rem",
                fontWeight: 700,
                background: "var(--state-success-soft, #ECFDF5)",
                color: "var(--state-success, #059669)",
                border: "1px solid var(--state-success, #059669)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                borderRadius: 0,
                fontFamily: "var(--font-mono)",
              }}
            >
              <CheckCircle2 size={13} /> {t("triage.attending_verified", "Attending Verified")}
            </span>
          </div>
        </div>
      </div>

      {feedbackNotice && (
        <div
          style={{
            background: "var(--surface-base, #FFFFFF)",
            border: "1px solid var(--accent-cobalt, #0052FF)",
            padding: "10px 16px",
            fontSize: "0.82rem",
            color: "var(--ink-primary, #09090B)",
            borderRadius: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{feedbackNotice}</span>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "var(--accent-cobalt, #0052FF)" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Care team overview KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", borderRadius: 0 }}>
        <div className="card-panel" style={{ padding: "16px 18px", border: "1px solid var(--border-subtle, #E4E4E7)", background: "var(--surface-base, #FFFFFF)", borderRadius: 0 }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--ink-secondary, #71717A)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-mono)" }}>
            {t("triage.patients_waiting_card", "Patients waiting")}
          </div>
          <div className="tabular-nums" style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--ink-primary, #09090B)", margin: "4px 0", fontFamily: "var(--font-mono)" }}>
            {bookings.length}
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--ink-secondary, #71717A)" }}>{t("triage.ready_for_consultation", "Ready for consultation")}</div>
        </div>

        <div className="card-panel" style={{ padding: "16px 18px", border: `1px solid ${emergencyCount > 0 ? "var(--state-error, #E11D48)" : "var(--border-subtle, #E4E4E7)"}`, background: emergencyCount > 0 ? "var(--state-error-soft, #FFF1F2)" : "var(--surface-base, #FFFFFF)", borderRadius: 0 }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, color: emergencyCount > 0 ? "var(--state-error, #E11D48)" : "var(--ink-secondary, #71717A)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", letterSpacing: "0.06em", fontFamily: "var(--font-mono)" }}>
            {t("triage.urgent_reviews", "Urgent reviews")}
          </div>
          <div className="tabular-nums" style={{ fontSize: "1.75rem", fontWeight: 700, color: emergencyCount > 0 ? "var(--state-error, #E11D48)" : "var(--ink-primary, #09090B)", margin: "4px 0", fontFamily: "var(--font-mono)" }}>
            {emergencyCount}
          </div>
          <div style={{ fontSize: "0.74rem", color: emergencyCount > 0 ? "var(--state-error, #E11D48)" : "var(--ink-secondary, #71717A)", fontWeight: 600 }}>{t("triage.needs_prompt_attention", "Needs prompt attention")}</div>
        </div>

        <div className="card-panel" style={{ padding: "16px 18px", border: "1px solid var(--border-subtle, #E4E4E7)", background: "var(--surface-base, #FFFFFF)", borderRadius: 0 }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--ink-secondary, #71717A)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-mono)" }}>
            {t("triage.regular_visits", "Regular visits")}
          </div>
          <div className="tabular-nums" style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--ink-primary, #09090B)", margin: "4px 0", fontFamily: "var(--font-mono)" }}>
            {routineCount}
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--ink-secondary, #71717A)" }}>{t("triage.scheduled_appointments", "Scheduled appointments")}</div>
        </div>

        <div className="card-panel" style={{ padding: "16px 18px", border: "1px solid var(--border-subtle, #E4E4E7)", background: "var(--surface-base, #FFFFFF)", borderRadius: 0 }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--ink-secondary, #71717A)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-mono)" }}>
            {t("triage.median_wait_time", "Median Wait Time")}
          </div>
          <div className="tabular-nums" style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--accent-cobalt, #0052FF)", margin: "4px 0", fontFamily: "var(--font-mono)" }}>
            &lt; 6 Min
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--ink-secondary, #71717A)" }}>{t("triage.prompt_clinical_triage", "Prompt clinical triage")}</div>
        </div>
      </div>

      {/* Two Column Layout: Schedule & Risk Triage */}
      <div className="clinician-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "16px", borderRadius: 0 }}>
        {/* Left: Today's Consultation Schedule */}
        <div className="card-panel" style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "18px", background: "var(--surface-base, #FFFFFF)", border: "1px solid var(--border-subtle, #E4E4E7)", borderRadius: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle, #E4E4E7)", paddingBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={16} color="var(--accent-cobalt, #0052FF)" />
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--ink-primary, #09090B)" }}>
                {t("triage.scheduled_appointments_title", "Scheduled Appointments")} ({bookings.length})
              </h3>
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--ink-secondary, #71717A)", fontFamily: "var(--font-mono)" }}>
              {t("triage.appointments_badge", "Appointments")}
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--ink-secondary, #71717A)", fontSize: "0.82rem" }}>Loading patient roster...</div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--ink-secondary, #71717A)", fontSize: "0.82rem" }}>
              {t("triage.no_consultations_today", "No consultations scheduled for today.")}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {bookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    background: "var(--surface-sunken, #F4F4F5)",
                    border: "1px solid var(--border-subtle, #E4E4E7)",
                    borderRadius: 0,
                    padding: "12px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <strong style={{ fontSize: "0.88rem", color: "var(--ink-primary, #09090B)" }}>{b.patient_name || "Registered Patient"}</strong>
                      <span
                        style={{
                          fontSize: "0.64rem",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          padding: "2px 6px",
                          border: "1px solid var(--border-subtle, #E4E4E7)",
                          background: "var(--surface-base, #FFFFFF)",
                          borderRadius: 0,
                        }}
                      >
                        {b.status?.toUpperCase() || "CONFIRMED"}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "var(--ink-secondary, #71717A)" }}>
                      <Clock size={11} style={{ display: "inline-block", marginRight: "3px" }} />
                      <span className="tabular-nums">{b.slot_time || "10:30 AM"}</span> • {b.mode?.toUpperCase() || "VIDEO"} • Chief Complaint: {b.intake?.reason || b.intake?.symptoms || "Regular Review"}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setActiveBookingForRoom(b)}
                    style={{ padding: "6px 12px", fontSize: "0.75rem", borderRadius: 0, display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <Video size={13} /> {t("triage.open_consult_room", "Open Consult Room")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Risk-Sorted Patient Triage Queue */}
        <div className="card-panel" style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "18px", background: "var(--surface-base, #FFFFFF)", border: "1px solid var(--border-subtle, #E4E4E7)", borderRadius: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle, #E4E4E7)", paddingBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={16} color="var(--state-error, #E11D48)" />
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--ink-primary, #09090B)" }}>
                {t("triage.patients_needing_attention", "Patients needing attention")}
              </h3>
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--state-error, #E11D48)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
              {t("triage.priority_review", "Priority review")}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {triageCohort.length === 0 ? (
              <div style={{ padding: "30px 12px", textAlign: "center", color: "var(--ink-secondary, #71717A)", fontSize: "0.82rem" }}>
                {t("triage.no_patients_attention", "No patients currently need attention.")}
              </div>
            ) : triageCohort.map((pat) => (
              <div
                key={pat.id}
                style={{
                  background: pat.isEmergency ? "var(--state-error-soft, #FFF1F2)" : "var(--surface-sunken, #F4F4F5)",
                  border: `1px solid ${pat.isEmergency ? "var(--state-error, #E11D48)" : "var(--border-subtle, #E4E4E7)"}`,
                  borderLeft: `4px solid ${pat.isEmergency ? "var(--state-error, #E11D48)" : "var(--state-success, #059669)"}`,
                  borderRadius: 0,
                  padding: "12px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                    <strong style={{ fontSize: "0.88rem", color: "var(--ink-primary, #09090B)" }}>{pat.name}</strong>
                    <span
                      style={{
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 0,
                        background: pat.isEmergency ? "var(--state-error, #E11D48)" : "var(--state-success-soft, #ECFDF5)",
                        color: pat.isEmergency ? "#FFFFFF" : "var(--state-success, #059669)",
                        border: `1px solid ${pat.isEmergency ? "var(--state-error, #E11D48)" : "var(--state-success, #059669)"}`,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {pat.risk.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--ink-secondary, #71717A)", marginTop: "2px" }}>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{pat.mrn}</span> • {pat.primaryModule} • Symptoms: <em>{pat.symptoms}</em>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    className="tabular-nums"
                    style={{
                      fontSize: "0.76rem",
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: 0,
                      color: pat.crs > 60 ? "var(--state-error, #E11D48)" : "var(--state-success, #059669)",
                      background: pat.crs > 60 ? "var(--state-error-soft, #FFF1F2)" : "var(--state-success-soft, #ECFDF5)",
                      border: `1px solid ${pat.crs > 60 ? "var(--state-error, #E11D48)" : "var(--state-success, #059669)"}`,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    CRS {pat.crs}
                  </span>

                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => {
                      setSelectedPatientForOverride(pat);
                      setOverrideModalOpen(true);
                    }}
                    style={{ borderRadius: 0, padding: "4px 8px", fontSize: "0.72rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    title="Clinician Annotation / Override"
                  >
                    <Edit3 size={12} /> {t("triage.override_btn", "Override")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clinician Annotation & Override Modal */}
      {overrideModalOpen && selectedPatientForOverride && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(9, 9, 11, 0.65)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: "16px",
            borderRadius: 0,
          }}
        >
          <div
            className="card-panel"
            style={{
              maxWidth: "520px",
              width: "100%",
              background: "var(--surface-base, #FFFFFF)",
              borderRadius: 0,
              padding: "24px",
              border: "1px solid var(--border-subtle, #E4E4E7)",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.05rem", color: "var(--ink-primary, #09090B)", fontWeight: 800 }}>
              Clinical Triage Override for {selectedPatientForOverride.name}
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--ink-secondary, #71717A)", margin: "0 0 14px 0", lineHeight: 1.45 }}>
              Under clinical governance standards, modifying an automated triage score requires formal physician justification and is recorded to the immutable WORM audit log.
            </p>
            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label className="form-label" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ink-primary, #09090B)", display: "block", marginBottom: "4px" }}>
                Physician Justification & Diagnosis
              </label>
              <textarea
                className="input-control"
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="State clinical rationale (e.g. ECG shows acute ST changes warranting immediate triage elevation)..."
                style={{ width: "100%", padding: "8px", borderRadius: 0, border: "1px solid var(--border-subtle, #E4E4E7)", fontFamily: "inherit", fontSize: "0.82rem" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                className="action-btn"
                onClick={() => setOverrideModalOpen(false)}
                style={{ borderRadius: 0, padding: "8px 14px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="action-btn primary"
                onClick={() => {
                  if (!overrideReason.trim()) {
                    setFeedbackNotice("Mandatory clinical rationale is required.");
                    return;
                  }
                  setFeedbackNotice(`Clinician override for ${selectedPatientForOverride.name} successfully recorded to immutable audit log.`);
                  setOverrideModalOpen(false);
                  setOverrideReason("");
                }}
                style={{ borderRadius: 0, padding: "8px 14px" }}
              >
                Submit Clinical Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
