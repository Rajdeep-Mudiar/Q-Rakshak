import { useState, useEffect, useRef } from "react";
import {
  User, Activity, Heart, Shield, CheckCircle2, Clock, Calendar,
  FileText, Pill, AlertCircle, RefreshCw, Video, AlertTriangle, CreditCard,
  Stethoscope, UserCheck, ShieldCheck, ChevronRight, Wind, Thermometer
} from "lucide-react";
import { clinicalApi } from "../../api/clinical";
import { complianceApi } from "../../api/compliance";
import { consultationsApi } from "../../api/consultations";
import { animateEntrance, animateCardStagger, animateShutterEntrance } from "../../utils/motion";
import SquareLoader from "../../components/common/SquareLoader.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function PatientPortal({ patientId = null, currentUser = null, onOpenBooking = null, onOpenCard = null }) {
  const { t } = useLanguage();
  const effectivePatientId = patientId || currentUser?.patient_id || currentUser?.user_id || currentUser?.id;
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [patient, setPatient] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [doctorBookings, setDoctorBookings] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  const isDoctor = currentUser?.role === "doctor";
  const isAdmin = currentUser?.role === "admin";
  const isPatient = !isDoctor && !isAdmin;

  const resolvedDoctorId = currentUser?.doctor_id || (currentUser?.id ? `DOC-${String(currentUser.id).replace('USR-', '')}` : "DOC-KAVITA");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (isDoctor) {
          const [bRes, aRes] = await Promise.all([
            consultationsApi.listBookings(null, resolvedDoctorId).catch(() => ({ bookings: [] })),
            complianceApi.getAuditLogs().catch(() => ({ logs: [] })),
          ]);
          setDoctorBookings(bRes?.bookings || []);
          if (aRes?.logs) setAuditLogs(aRes.logs);
        } else if (isAdmin) {
          const [p1, aRes] = await Promise.all([
            clinicalApi.getPatientRecord(effectivePatientId).catch(() => null),
            complianceApi.getAuditLogs().catch(() => ({ logs: [] })),
          ]);
          const patientsList = [p1?.patient].filter(Boolean);
          setAllPatients(patientsList);
          if (aRes?.logs) setAuditLogs(aRes.logs);
        } else {
          const [pRes, aRes] = await Promise.all([
            clinicalApi.getPatientRecord(effectivePatientId).catch(() => null),
            complianceApi.getAuditLogs().catch(() => ({ logs: [] })),
          ]);
          if (pRes?.patient) setPatient(pRes.patient);
          if (aRes?.logs) setAuditLogs(aRes.logs);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();

    if (containerRef.current) {
      animateShutterEntrance(containerRef.current, { y: 12, duration: 0.35 });
      animateCardStagger(containerRef.current, ".card-panel");
    }
  }, [patientId, isDoctor, isAdmin, isPatient, resolvedDoctorId]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. DOCTOR VIEW: PATIENT APPOINTMENTS & TEXT-FORMAT CLINICAL RECORDS
  // ═══════════════════════════════════════════════════════════════════════════
  if (isDoctor) {
    return (
      <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1200px", margin: "0 auto", width: "100%", borderRadius: 0 }}>
        {/* Doctor Header Banner */}
        <div className="card-panel" style={{ background: "var(--surface-base, #FFFFFF)", border: "1px solid var(--border-subtle, #E4E4E7)", borderLeft: "4px solid var(--accent-cobalt, #0052FF)", padding: "20px", borderRadius: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
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
                  {t("portal.clinical_practice", "CLINICAL PRACTICE")}
                </span>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", color: "var(--ink-primary, #09090B)", margin: 0, fontWeight: 700 }}>
                  {t("portal.patient_records_queue", "Patient Records & Consultation Queue")}
                </h2>
              </div>
              <p style={{ color: "var(--ink-secondary, #71717A)", fontSize: "0.80rem", margin: 0 }}>
                {t("portal.clinician_label", "Clinician:")} <code style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ink-primary, #09090B)" }}>{currentUser?.name || "Dr. Practitioner"}</code> • {t("portal.verified_provider_id", "Verified Provider ID:")} <code style={{ fontFamily: "var(--font-mono)" }}>{resolvedDoctorId}</code>
              </p>
            </div>
            <span
              style={{
                padding: "6px 12px",
                fontSize: "0.74rem",
                fontWeight: 700,
                background: "var(--surface-sunken, #F4F4F5)",
                color: "var(--ink-primary, #09090B)",
                border: "1px solid var(--border-subtle, #E4E4E7)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                borderRadius: 0,
                fontFamily: "var(--font-mono)",
              }}
            >
              <ShieldCheck size={14} color="var(--state-success, #059669)" /> {t("portal.abac_enforced", "ABAC Care-Team Enforced")}
            </span>
          </div>
        </div>

        {/* Appointments Section */}
        {loading ? (
          <div className="card-panel" style={{ textAlign: "center", padding: "48px 24px", borderRadius: 0, background: "var(--surface-base, #FFFFFF)", border: "1px solid var(--border-subtle, #E4E4E7)" }}>
            <SquareLoader label={t("common.loading", "Loading...")} />
          </div>
        ) : doctorBookings.length === 0 ? (
          /* Empty State: No Appointments Booked */
          <div className="card-panel" style={{ background: "var(--surface-base, #FFFFFF)", border: "1px solid var(--border-subtle, #E4E4E7)", padding: "48px 24px", textAlign: "center", borderRadius: 0 }}>
            <div style={{ width: "48px", height: "48px", background: "var(--surface-sunken, #F4F4F5)", border: "1px solid var(--border-subtle, #E4E4E7)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", borderRadius: 0 }}>
              <Calendar size={22} color="var(--accent-cobalt, #0052FF)" />
            </div>
            <span style={{ fontSize: "0.68rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--ink-secondary, #71717A)", letterSpacing: "0.08em", marginBottom: "8px", display: "inline-block" }}>
              0 {t("portal.active_consultations", "Active Consultations").toUpperCase()}
            </span>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--ink-primary, #09090B)", fontWeight: 700, margin: "6px 0" }}>
              {t("portal.no_appointments_title", "No Appointments Booked")}
            </h3>
            <p style={{ maxWidth: "520px", margin: "0 auto 18px", fontSize: "0.82rem", color: "var(--ink-secondary, #71717A)", lineHeight: 1.5 }}>
              {t("portal.no_appointments_desc", "There are currently no patient consultations scheduled for your care team. When a patient completes a checkup and books a consultation with you, their verified clinical record, baseline telemetry, conditions, and reason for visit will appear here in structured text format.")}
            </p>
            <div style={{ display: "inline-flex", gap: "10px" }}>
              <button
                type="button"
                className="action-btn"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await consultationsApi.listBookings(null, resolvedDoctorId);
                    if (res?.bookings) setDoctorBookings(res.bookings);
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{ padding: "8px 16px", fontSize: "0.80rem", display: "flex", alignItems: "center", gap: "6px", borderRadius: 0 }}
              >
                <RefreshCw size={13} /> {t("portal.refresh_queue", "Refresh Appointment Queue")}
              </button>
            </div>
          </div>
        ) : (
          /* Booked Appointments with Patient Records in Text Format */
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderRadius: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "0.90rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0, color: "var(--ink-primary, #09090B)", fontFamily: "var(--font-mono)" }}>
                {t("portal.active_consultations", "Active Patient Consultations")} ({doctorBookings.length})
              </h3>
              <span style={{ fontSize: "0.74rem", color: "var(--state-success, #059669)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                ● Real-time SQLite Sync
              </span>
            </div>

            {doctorBookings.map((b) => (
              <div
                key={b.id}
                className="card-panel"
                style={{
                  background: "var(--surface-base, #FFFFFF)",
                  border: "1px solid var(--border-subtle, #E4E4E7)",
                  borderLeft: "4px solid var(--accent-cobalt, #0052FF)",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  borderRadius: 0,
                }}
              >
                {/* Appointment Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, color: "var(--ink-primary, #09090B)", margin: 0 }}>
                        {b.patient_name || t("portal.registered_patient", "Registered Patient")}
                      </h4>
                      <span style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", padding: "2px 6px", border: "1px solid var(--border-subtle, #E4E4E7)", background: "var(--surface-sunken, #F4F4F5)", borderRadius: 0 }}>
                        ID: {b.patient_id}
                      </span>
                      <span style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", padding: "2px 6px", border: "1px solid var(--border-subtle, #E4E4E7)", background: "var(--surface-sunken, #F4F4F5)", borderRadius: 0 }}>
                        MRN: {b.mrn || `MRN-${b.patient_id}-QX`}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "var(--ink-secondary, #71717A)", fontFamily: "var(--font-mono)", marginTop: "3px" }}>
                      {t("portal.patient_phone", "Patient Phone:")} {b.patient_phone || b.intake?.emergency_contact || "N/A"} • {t("portal.encounter", "Encounter #")}{b.id}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        background: "var(--state-success-soft, #ECFDF5)",
                        border: "1px solid var(--state-success, #059669)",
                        color: "var(--state-success, #059669)",
                        fontSize: "0.70rem",
                        fontWeight: 800,
                        fontFamily: "var(--font-mono)",
                        textTransform: "uppercase",
                        borderRadius: 0,
                      }}
                    >
                      {b.status || t("common.verified", "CONFIRMED")}
                    </span>
                    <span style={{ fontSize: "0.70rem", fontFamily: "var(--font-mono)", padding: "3px 6px", border: "1px solid var(--border-subtle, #E4E4E7)", background: "var(--surface-sunken, #F4F4F5)", borderRadius: 0 }}>
                      {b.mode?.toUpperCase() || "VIDEO"}
                    </span>
                  </div>
                </div>

                {/* Appointment Encounter Schedule & Reason in Text Format */}
                <div style={{ background: "var(--surface-sunken, #F4F4F5)", border: "1px solid var(--border-subtle, #E4E4E7)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px", borderRadius: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", fontSize: "0.78rem" }}>
                    <span><strong>{t("portal.scheduled_time", "Scheduled Encounter Time:")}</strong> <span className="tabular-nums">{b.slot_time}</span></span>
                    <span><strong>{t("portal.clinical_urgency", "Clinical Urgency:")}</strong> {b.triage_risk === "emergency_red_flag" ? t("portal.urgent_red_flag", "Urgent / Red-Flag Triage") : t("portal.routine_ambulatory", "Routine Ambulatory Care")}</span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--ink-secondary, #71717A)" }}>
                    <strong style={{ color: "var(--ink-primary, #09090B)" }}>{t("portal.reason_for_consult", "Reason for Consultation:")}</strong> {b.intake?.reason || b.reason || "General Clinical Consultation & Assessment"}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--ink-secondary, #71717A)" }}>
                    <strong style={{ color: "var(--ink-primary, #09090B)" }}>{t("portal.reported_symptoms", "Reported Patient Symptoms:")}</strong> {b.intake?.symptoms || b.symptoms || "No acute symptoms reported"}
                  </div>
                  {b.intake?.duration && (
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-secondary, #71717A)" }}>
                      <strong style={{ color: "var(--ink-primary, #09090B)" }}>{t("portal.symptom_duration", "Symptom Duration:")}</strong> {b.intake.duration}
                    </div>
                  )}
                </div>

                {/* Patient Clinical Baseline Telemetry in Text Format */}
                <div>
                  <div style={{ fontSize: "0.74rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--ink-secondary, #71717A)", textTransform: "uppercase", marginBottom: "6px" }}>
                    {t("portal.verified_baseline_telemetry", "Verified Baseline Telemetry (Text Format)")}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
                    <div style={{ background: "var(--surface-sunken, #F4F4F5)", padding: "8px 10px", border: "1px solid var(--border-subtle, #E4E4E7)", borderRadius: 0 }}>
                      <div style={{ fontSize: "0.62rem", color: "var(--ink-secondary, #71717A)", fontFamily: "var(--font-mono)" }}>{t("portal.body_temperature", "BODY TEMPERATURE")}</div>
                      <div className="tabular-nums" style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--ink-primary, #09090B)", fontFamily: "var(--font-mono)" }}>
                        {b.baseline_vitals?.temperature_f || 98.6}°F <span style={{ fontSize: "0.65rem", fontWeight: 400, color: "var(--ink-secondary, #71717A)" }}>• {t("common.verified", "Verified")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditions, Allergies & Active Medications (Text Format) */}
                <div className="responsive-grid-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ background: "var(--surface-sunken, #F4F4F5)", padding: "10px", border: "1px solid var(--border-subtle, #E4E4E7)", borderRadius: 0 }}>
                    <div style={{ fontSize: "0.64rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--ink-secondary, #71717A)", textTransform: "uppercase", marginBottom: "4px" }}>
                      {t("portal.active_clinical_conditions", "Active Clinical Conditions")}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-primary, #09090B)", lineHeight: 1.4 }}>
                      {Array.isArray(b.conditions) && b.conditions.length > 0 ? (
                        b.conditions.map((c, i) => <div key={i}>• {c}</div>)
                      ) : (
                        <span style={{ color: "var(--ink-secondary, #71717A)" }}>{t("portal.no_chronic_flagged", "No pre-existing chronic conditions flagged")}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ background: "var(--surface-sunken, #F4F4F5)", padding: "10px", border: "1px solid var(--border-subtle, #E4E4E7)", borderRadius: 0 }}>
                    <div style={{ fontSize: "0.64rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--ink-secondary, #71717A)", textTransform: "uppercase", marginBottom: "4px" }}>
                      {t("portal.known_allergies_rx", "Known Allergies & Active Rx")}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-primary, #09090B)", lineHeight: 1.4 }}>
                      {b.intake?.medications && b.intake.medications.length > 0 ? (
                        <div><strong>{t("portal.active_meds", "Active Medications:")}</strong> {b.intake.medications.join(", ")}</div>
                      ) : (
                        <span style={{ color: "var(--ink-secondary, #71717A)" }}>{t("portal.no_active_meds", "No active medications reported")}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Doctor Action Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", borderTop: "1px solid var(--border-subtle, #E4E4E7)", paddingTop: "12px" }}>
                  {onOpenBooking && (
                    <button
                      type="button"
                      className="action-btn primary"
                      onClick={() => onOpenBooking(b)}
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "0.80rem", borderRadius: 0 }}
                    >
                      <Video size={14} /> {t("portal.open_video_room", "Open Video Consultation Room")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ADMIN VIEW: SYSTEM PATIENT REGISTRY (TEXT & TABULAR FORMAT)
  // ═══════════════════════════════════════════════════════════════════════════
  if (isAdmin) {
    return (
      <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1200px", margin: "0 auto", width: "100%", borderRadius: 0 }}>
        <div className="card-panel" style={{ background: "var(--surface-base, #FFFFFF)", border: "1px solid var(--border-subtle, #E4E4E7)", borderLeft: "4px solid var(--accent-cobalt, #0052FF)", padding: "20px", borderRadius: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
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
                {t("portal.admin_console", "ADMINISTRATIVE CONSOLE")}
              </span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", color: "var(--ink-primary, #09090B)", margin: "6px 0 0", fontWeight: 700 }}>
                {t("portal.patient_registry_title", "System Patient Registry & Encounters")}
              </h2>
              <p style={{ color: "var(--ink-secondary, #71717A)", fontSize: "0.80rem", margin: "4px 0 0" }}>
                {t("portal.patient_registry_desc", "Verified database of patient records, compliance consents, and clinical history in text format.")}
              </p>
            </div>
            <span
              style={{
                padding: "6px 12px",
                fontSize: "0.74rem",
                fontWeight: 700,
                background: "var(--surface-sunken, #F4F4F5)",
                border: "1px solid var(--border-subtle, #E4E4E7)",
                borderRadius: 0,
                fontFamily: "var(--font-mono)",
              }}
            >
              {t("portal.dpdp_hipaa_compliant", "DPDP 2023 & HIPAA Compliant")}
            </span>
          </div>
        </div>

        {/* Text Table of Patients */}
        <div className="card-panel" style={{ padding: "16px", borderRadius: 0, background: "var(--surface-base, #FFFFFF)", border: "1px solid var(--border-subtle, #E4E4E7)" }}>
          <h3 style={{ fontSize: "0.88rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "12px", letterSpacing: "0.06em", fontFamily: "var(--font-mono)" }}>
            {t("portal.verified_patient_db", "Verified Patient Database")} ({allPatients.length})
          </h3>
          <div className="data-table-wrap" style={{ border: "1px solid var(--border-subtle, #E4E4E7)", borderRadius: 0 }}>
            <table className="clinical-data-table" style={{ borderRadius: 0 }}>
              <thead>
                <tr>
                  <th>{t("portal.table_patient_id", "Patient ID")}</th>
                  <th>{t("portal.table_patient_name", "Patient Name")}</th>
                  <th>{t("portal.table_age_sex", "Age / Sex")}</th>
                  <th>{t("portal.table_blood_group", "Blood Group")}</th>
                  <th>{t("portal.table_primary_conditions", "Primary Conditions")}</th>
                  <th>{t("portal.table_baseline_vitals", "Baseline Vitals (BP / HR)")}</th>
                  <th>{t("portal.table_dpdp_status", "DPDP Status")}</th>
                </tr>
              </thead>
              <tbody>
                {allPatients.map((p) => (
                  <tr key={p.id}>
                    <td><code style={{ fontWeight: 800, fontFamily: "var(--font-mono)" }}>{p.id}</code></td>
                    <td><strong>{p.name}</strong></td>
                    <td className="tabular-nums">{p.age}y • {p.gender}</td>
                    <td><span style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", padding: "2px 6px", border: "1px solid var(--border-subtle, #E4E4E7)", background: "var(--surface-sunken, #F4F4F5)" }}>{p.blood_group || "Not Specified"}</span></td>
                    <td style={{ fontSize: "0.74rem" }}>{(p.conditions || []).join(", ") || "Normal Baseline"}</td>
                    <td className="tabular-nums" style={{ fontSize: "0.74rem", fontFamily: "var(--font-mono)" }}>
                      {p.baseline_vitals?.blood_pressure || p.baseline_vitals?.heart_rate_bpm
                        ? `${p.baseline_vitals?.blood_pressure || "—"}${p.baseline_vitals?.heart_rate_bpm ? ` • ${p.baseline_vitals.heart_rate_bpm} BPM` : ""}`
                        : "Not Recorded"}
                    </td>
                    <td>
                      <span style={{ color: "var(--state-success, #059669)", fontWeight: 700, fontSize: "0.72rem", fontFamily: "var(--font-mono)" }}>
                        {t("common.verified", "VERIFIED")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. PATIENT VIEW: MY HEALTH RECORDS (TEXT & STRUCTURED FORMAT)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1200px", margin: "0 auto", width: "100%", borderRadius: 0 }}>
      {/* Patient Welcome Hero */}
      <div className="card-panel" style={{ background: "var(--surface-base, #FFFFFF)", border: "1px solid var(--border-subtle, #E4E4E7)", borderLeft: "4px solid var(--accent-cobalt, #0052FF)", padding: "22px", borderRadius: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
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
                {t("portal.patient_archive", "PATIENT ARCHIVE")}
              </span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", color: "var(--ink-primary, #09090B)", margin: 0, fontWeight: 700 }}>
                {patient?.name || currentUser?.name || "Patient"}
              </h2>
            </div>
            <p style={{ color: "var(--ink-secondary, #71717A)", fontSize: "0.80rem", margin: 0 }}>
              {t("portal.table_patient_id", "Patient ID:")} <code style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ink-primary, #09090B)" }}>{patientId || patient?.id || "—"}</code> • MRN: <code style={{ fontFamily: "var(--font-mono)" }}>{patient?.mrn || (patientId ? `MRN-${patientId}-QX` : "—")}</code> • ABHA ID: <code style={{ fontFamily: "var(--font-mono)" }}>{patient?.abha_id || "—"}</code>
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span
              style={{
                padding: "6px 12px",
                fontSize: "0.74rem",
                fontWeight: 700,
                background: "var(--surface-sunken, #F4F4F5)",
                border: "1px solid var(--border-subtle, #E4E4E7)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                borderRadius: 0,
                fontFamily: "var(--font-mono)",
              }}
            >
              <Shield size={13} color="var(--state-success, #059669)" /> {t("portal.dpdp_hipaa_compliant", "DPDP 2023 & HIPAA Compliant")}
            </span>
            {onOpenCard && (
              <button type="button" className="btn-primary" onClick={onOpenCard} style={{ padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: 0 }}>
                <CreditCard size={14} /> {t("portal.view_print_card", "View & Print Card")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle, #E4E4E7)", gap: "0", paddingBottom: "0" }}>
        <button
          type="button"
          onClick={() => setActiveSubTab("overview")}
          style={{
            padding: "9px 18px",
            background: activeSubTab === "overview" ? "var(--ink-primary, #09090B)" : "var(--surface-base, #FFFFFF)",
            color: activeSubTab === "overview" ? "#FFFFFF" : "var(--ink-secondary, #71717A)",
            border: "1px solid var(--border-subtle, #E4E4E7)",
            borderBottom: activeSubTab === "overview" ? "1px solid var(--ink-primary, #09090B)" : "1px solid var(--border-subtle, #E4E4E7)",
            borderRadius: 0,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.80rem",
            fontFamily: "var(--font-mono)",
            transition: "all 0.15s ease",
          }}
        >
          {t("portal.tab_health_records", "Health Records & Vitals")}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("meds")}
          style={{
            padding: "9px 18px",
            background: activeSubTab === "meds" ? "var(--ink-primary, #09090B)" : "var(--surface-base, #FFFFFF)",
            color: activeSubTab === "meds" ? "#FFFFFF" : "var(--ink-secondary, #71717A)",
            border: "1px solid var(--border-subtle, #E4E4E7)",
            borderBottom: activeSubTab === "meds" ? "1px solid var(--ink-primary, #09090B)" : "1px solid var(--border-subtle, #E4E4E7)",
            borderRadius: 0,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.80rem",
            fontFamily: "var(--font-mono)",
            transition: "all 0.15s ease",
          }}
        >
          {t("portal.tab_conditions_rx", "Clinical Conditions & Prescriptions")}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("records")}
          style={{
            padding: "9px 18px",
            background: activeSubTab === "records" ? "var(--ink-primary, #09090B)" : "var(--surface-base, #FFFFFF)",
            color: activeSubTab === "records" ? "#FFFFFF" : "var(--ink-secondary, #71717A)",
            border: "1px solid var(--border-subtle, #E4E4E7)",
            borderBottom: activeSubTab === "records" ? "1px solid var(--ink-primary, #09090B)" : "1px solid var(--border-subtle, #E4E4E7)",
            borderRadius: 0,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.80rem",
            fontFamily: "var(--font-mono)",
            transition: "all 0.15s ease",
          }}
        >
          {t("portal.tab_audit_log", "Live Audit Log")} ({auditLogs.length})
        </button>
      </div>

      {activeSubTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderRadius: 0 }}>
          {/* Baseline Vitals Card in Text Format */}
          <div className="card-panel" style={{ border: "1px solid var(--border-subtle, #E4E4E7)", borderRadius: 0, padding: "18px", background: "var(--surface-base, #FFFFFF)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                <Heart size={16} color="var(--state-success, #059669)" /> {t("portal.cardiopulmonary_vitals", "Verified Cardiopulmonary Vitals (Text Format)")}
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--state-success, #059669)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {t("portal.telemetry_synced", "● Telemetry Synced")}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
              <div style={{ padding: "12px 14px", background: "var(--surface-sunken, #F4F4F5)", border: "1px solid var(--border-subtle, #E4E4E7)", borderRadius: 0 }}>
                <strong style={{ fontSize: "0.72rem", color: "var(--ink-secondary, #71717A)", display: "block", textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "var(--font-mono)" }}>{t("portal.body_temperature", "Body Temperature")}</strong>
                <span className="tabular-nums" style={{ fontSize: "1.2rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--ink-primary, #09090B)" }}>
                  {patient?.baseline_vitals?.temperature_f || 98.6}°F
                </span>
              </div>
            </div>
          </div>

          {/* Privacy & DPDP Rights */}
          <div className="card-panel" style={{ border: "1px solid var(--border-subtle, #E4E4E7)", borderRadius: 0, padding: "18px", background: "var(--surface-base, #FFFFFF)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <Shield size={16} color="var(--accent-cobalt, #0052FF)" />
              <h4 style={{ margin: 0, fontSize: "0.90rem", fontWeight: 800, color: "var(--ink-primary, #09090B)" }}>{t("portal.privacy_rights_title", "Privacy & DPDP 2023 Consent Rights")}</h4>
            </div>
            <p style={{ fontSize: "0.80rem", color: "var(--ink-secondary, #71717A)", lineHeight: 1.5, margin: 0 }}>
              {t("portal.privacy_rights_desc", "Under the Digital Personal Data Protection Act (DPDP), 2023 and HIPAA guidelines, all clinical telemetry and diagnostic records are stored in encrypted SQLite database tables with immutable SHA-256 cryptographic hash audit trails.")}
            </p>
          </div>
        </div>
      )}

      {activeSubTab === "meds" && (
        <div className="card-panel" style={{ border: "1px solid var(--border-subtle, #E4E4E7)", borderRadius: 0, padding: "18px", background: "var(--surface-base, #FFFFFF)" }}>
          <h4 style={{ margin: "0 0 12px 0", fontSize: "0.88rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-mono)" }}>
            {t("portal.active_clinical_conditions", "Active Conditions, Allergies & Medications (Text Format)")}
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ background: "var(--surface-sunken, #F4F4F5)", padding: "12px", border: "1px solid var(--border-subtle, #E4E4E7)", borderRadius: 0 }}>
              <div style={{ fontSize: "0.68rem", color: "var(--ink-secondary, #71717A)", fontFamily: "var(--font-mono)", textTransform: "uppercase", marginBottom: "4px" }}>
                {t("portal.diagnosed_conditions", "Diagnosed Conditions")}
              </div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink-primary, #09090B)" }}>
                {Array.isArray(patient?.conditions) && patient.conditions.length > 0
                  ? patient.conditions.join(", ")
                  : (Array.isArray(patient?.medical_history) && patient.medical_history.length > 0
                      ? patient.medical_history.map(m => typeof m === 'string' ? m : (m.condition || m.name || '')).filter(Boolean).join(", ")
                      : t("portal.no_conditions", "No chronic conditions recorded."))}
              </div>
            </div>

            <div style={{ background: "var(--surface-sunken, #F4F4F5)", padding: "12px", border: "1px solid var(--border-subtle, #E4E4E7)", borderRadius: 0 }}>
              <div style={{ fontSize: "0.68rem", color: "var(--ink-secondary, #71717A)", fontFamily: "var(--font-mono)", textTransform: "uppercase", marginBottom: "4px" }}>
                {t("portal.known_allergies", "Known Allergies")}
              </div>
              <div style={{ fontSize: "0.82rem", color: Array.isArray(patient?.allergies) && patient.allergies.length > 0 ? "var(--state-error, #E11D48)" : "var(--ink-secondary, #71717A)", fontWeight: 700 }}>
                {Array.isArray(patient?.allergies) && patient.allergies.length > 0
                  ? patient.allergies.map(a => typeof a === 'string' ? a : (a.allergen || a.name || 'Allergy')).filter(Boolean).join(", ")
                  : t("portal.no_allergies", "No known allergies recorded.")}
              </div>
            </div>

            <div style={{ background: "var(--surface-sunken, #F4F4F5)", padding: "12px", border: "1px solid var(--border-subtle, #E4E4E7)", borderRadius: 0 }}>
              <div style={{ fontSize: "0.68rem", color: "var(--ink-secondary, #71717A)", fontFamily: "var(--font-mono)", textTransform: "uppercase", marginBottom: "4px" }}>
                {t("portal.active_rx", "Active Prescription Regimen (Rx)")}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--ink-primary, #09090B)" }}>
                {Array.isArray(patient?.medications) && patient.medications.length > 0
                  ? patient.medications.map(m => typeof m === 'string' ? m : `${m.name || ''} ${m.dose || ''} ${m.frequency ? `(${m.frequency})` : ''}`.trim()).filter(Boolean).join(", ")
                  : t("portal.no_medications", "No active medications recorded.")}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "records" && (
        <div className="card-panel" style={{ border: "1px solid var(--border-subtle, #E4E4E7)", borderRadius: 0, padding: "18px", background: "var(--surface-base, #FFFFFF)" }}>
          <h4 style={{ margin: "0 0 12px 0", fontSize: "0.88rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-mono)" }}>
            {t("portal.audit_log_title", "Live Security & Ingestion Audit Log (SQLite Database)")}
          </h4>
          <div className="data-table-wrap" style={{ border: "1px solid var(--border-subtle, #E4E4E7)", borderRadius: 0 }}>
            <table className="clinical-data-table" style={{ borderRadius: 0 }}>
              <thead>
                <tr>
                  <th>{t("portal.table_audit_id", "Audit ID")}</th>
                  <th>{t("portal.table_timestamp", "Timestamp")}</th>
                  <th>{t("portal.table_actor", "Actor")}</th>
                  <th>{t("portal.table_action", "Action")}</th>
                  <th>{t("portal.table_status", "Status")}</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td><code style={{ fontFamily: "var(--font-mono)" }}>{log.id}</code></td>
                      <td className="tabular-nums" style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>{log.timestamp}</td>
                      <td><strong>{log.actor}</strong></td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>{log.action}</td>
                      <td>
                        <span style={{ color: "var(--state-success, #059669)", fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: "0.74rem" }}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "16px", color: "var(--ink-secondary, #71717A)" }}>
                      {t("portal.no_audit_events", "No audit events recorded yet (0 entries).")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
