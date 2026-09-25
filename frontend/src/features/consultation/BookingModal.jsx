import { useState, useEffect, useRef } from "react";
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Video,
  Phone,
  UserCheck,
  CheckCircle2,
  Lock,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Heart,
} from "lucide-react";
import { consultationsApi } from "../../api/consultations";
import { animateModalOpen } from "../../utils/motion";
import { useLanguage } from "../../context/LanguageContext";

export default function BookingModal({ doctor, initialSlot, onClose, onSuccess, patientId }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [slot, setSlot] = useState(initialSlot || doctor?.available_slots?.[0] || "Today at 02:00 PM");
  const [mode, setMode] = useState("video");
  const [reason, setReason] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [medications, setMedications] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const [triageChecking, setTriageChecking] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    animateModalOpen(overlayRef.current, modalRef.current);
  }, []);

  // Step 2 triage check before proceeding to payment
  async function handleProceedToTriage() {
    if (!symptoms.trim()) {
      setErrorMessage("Please describe your symptoms for clinical triage.");
      return;
    }
    setErrorMessage("");
    setTriageChecking(true);
    try {
      const res = await consultationsApi.checkTriage(symptoms);
      setTriageResult(res);
      setStep(2);
    } catch (err) {
      setErrorMessage("Triage check failed: " + err.message);
    } finally {
      setTriageChecking(false);
    }
  }

  async function handleConfirmBooking() {
    setBookingLoading(true);
    setErrorMessage("");
    try {
      const payload = {
        doctor_id: doctor.id,
        slot_time: slot,
        mode,
        patient_id: patientId || undefined,
        reason,
        symptoms,
        duration,
        existing_medications: medications.split(",").map((m) => m.trim()).filter(Boolean),
        emergency_contact: emergencyContact,
      };
      const res = await consultationsApi.bookConsultation(payload);
      if (res?.booking) {
        setConfirmedBooking(res.booking);
        setStep(4);
      }
    } catch (err) {
      setErrorMessage("Booking submission failed: " + err.message);
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(12, 13, 14, 0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div
        ref={modalRef}
        className="card-panel modal-responsive-sheet"
        style={{
          width: "100%",
          maxWidth: "640px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderTop: "3px solid var(--accent-blue)",
          boxShadow: "var(--shadow-modal)",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-default)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--bg-surface-alt)",
          }}
        >
          <div>
            <span className="step-badge" style={{ marginBottom: "4px", display: "inline-block" }}>
              {`${t("telemedicine.step_of", "STEP")} ${step} ${t("telemedicine.of_4", "OF 4")} • ${t("telemedicine.consultation_booking", "CONSULTATION BOOKING")}`}
            </span>
            <h3 style={{ margin: 0, fontSize: "1.05rem", color: "var(--text-primary)", fontWeight: 800 }}>
              {`${t("telemedicine.book_with", "Book with")} ${doctor.name}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking modal"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "8px",
              minWidth: "44px",
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px", maxHeight: "70vh", overflowY: "auto" }}>
          {errorMessage && (
            <div className="alert-banner warning" style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Intake & Details */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="responsive-grid-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="metric-label" style={{ display: "block", marginBottom: "4px" }}>{t("telemedicine.select_slot", "Select Slot")}</label>
                  <select
                    className="terminal-input"
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    style={{ width: "100%", padding: "8px" }}
                  >
                    {(doctor.available_slots || ["Today at 02:00 PM"]).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="metric-label" style={{ display: "block", marginBottom: "4px" }}>{t("telemedicine.consultation_mode", "Consultation Mode")}</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {[
                      { id: "video", label: t("telemedicine.mode_video", "Video"), icon: Video },
                      { id: "audio", label: t("telemedicine.mode_audio", "Audio"), icon: Phone },
                      { id: "in_person", label: t("telemedicine.mode_clinic", "Clinic"), icon: UserCheck },
                    ].map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className={`tab-btn ${mode === m.id ? "active" : ""}`}
                          onClick={() => setMode(m.id)}
                          style={{ flex: 1, padding: "6px", fontSize: "0.76rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                        >
                          <Icon size={12} /> {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="metric-label" style={{ display: "block", marginBottom: "4px" }}>{t("telemedicine.reason_label", "Reason for Consultation")}</label>
                <input
                  type="text"
                  className="terminal-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ width: "100%", padding: "8px" }}
                  placeholder={t("telemedicine.reason_placeholder", "e.g. Follow-up after Quantum AI Cardiac Checkup")}
                />
              </div>

              <div>
                <label className="metric-label" style={{ display: "block", marginBottom: "4px" }}>
                  {t("telemedicine.symptoms_label", "Clinical Symptoms & Observations (Crucial for Triage)")}
                </label>
                <textarea
                  className="terminal-input"
                  rows={3}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  style={{ width: "100%", padding: "8px", resize: "vertical" }}
                  placeholder="Describe your symptoms in detail..."
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="metric-label" style={{ display: "block", marginBottom: "4px" }}>Symptom Duration</label>
                  <input
                    type="text"
                    className="terminal-input"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 2 days, 1 week"
                    style={{ width: "100%", padding: "8px" }}
                  />
                </div>
                <div>
                  <label className="metric-label" style={{ display: "block", marginBottom: "4px" }}>Emergency Phone</label>
                  <input
                    type="text"
                    className="terminal-input"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    style={{ width: "100%", padding: "8px" }}
                  />
                </div>
              </div>

              <div>
                <label className="metric-label" style={{ display: "block", marginBottom: "4px" }}>Current Medications (Comma-separated)</label>
                <input
                  type="text"
                  className="terminal-input"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  style={{ width: "100%", padding: "8px" }}
                  placeholder="e.g. Atorvastatin 10mg, Metformin 500mg"
                />
              </div>
            </div>
          )}

          {/* Step 2: Emergency Triage Feedback */}
          {step === 2 && triageResult && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {triageResult.is_emergency ? (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid var(--risk-high)",
                    padding: "16px",
                    color: "var(--risk-high)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <AlertTriangle size={20} />
                    <strong style={{ fontSize: "0.95rem" }}>CRITICAL ACUTE SYMPTOM DETECTED</strong>
                  </div>
                  <p style={{ fontSize: "0.84rem", margin: "0 0 10px 0" }}>{triageResult.guidance}</p>
                  <div style={{ background: "#000", padding: "10px", fontSize: "0.82rem", fontWeight: 700 }}>
                    {triageResult.helpline}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid var(--risk-low)",
                    padding: "16px",
                    color: "var(--risk-low)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <CheckCircle2 size={18} />
                    <strong style={{ fontSize: "0.95rem" }}>Routine Clinical Intake Cleared</strong>
                  </div>
                  <p style={{ fontSize: "0.82rem", margin: 0 }}>
                    No life-threatening emergency flags detected in reported symptoms. Safe to schedule virtual specialist consultation.
                  </p>
                </div>
              )}

              {/* Consultation Summary Box */}
              <div className="card-panel" style={{ background: "var(--bg-surface-alt)", padding: "14px" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px" }}>
                  APPOINTMENT DETAILS:
                </div>
                <div style={{ fontSize: "0.82rem", lineHeight: 1.6 }}>
                  <div><strong>Doctor:</strong> {doctor.name} ({doctor.specialty})</div>
                  <div><strong>Slot:</strong> {slot} ({mode.toUpperCase()})</div>
                  <div><strong>Hospital:</strong> {doctor.hospital_affiliation}</div>
                  <div><strong>Reason:</strong> {reason}</div>
                  <div><strong>Consultation Fee:</strong> ₹{doctor.fee_inr}</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment Hold Authorization */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  padding: "16px",
                  background: "rgba(14, 165, 233, 0.06)",
                  border: "1px solid var(--border-default)",
                  display: "flex",
                  gap: "12px",
                }}
              >
                <Lock size={24} color="var(--primary)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: "0.82rem", lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--primary)", display: "block", marginBottom: "4px" }}>
                    Escrow-Style Authorized Payment Hold
                  </strong>
                  Your card will be authorized for ₹{doctor.fee_inr}. Funds are held in escrow and <strong>captured only after the consultation has completed</strong>. If cancelled prior to the consultation, funds are immediately released with zero phantom billing.
                </div>
              </div>

              <div className="card-panel" style={{ background: "var(--bg-surface-alt)", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <CreditCard size={18} color="var(--accent-teal)" />
                  <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Payment Method: Simulated Healthcare Wallet</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  Account: <code style={{ fontFamily: "var(--font-mono)" }}>QMED-WALLET-89421</code> • Balance: ₹12,500.00
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmed Success View */}
          {step === 4 && confirmedBooking && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <CheckCircle2 size={48} color="var(--risk-low)" style={{ margin: "0 auto 12px auto" }} />
              <h3 style={{ color: "var(--risk-low)", margin: "0 0 8px 0" }}>Appointment Confirmed!</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0 0 16px 0" }}>
                Booking ID: <code style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{confirmedBooking.id}</code>
              </p>
              <div className="card-panel" style={{ textAlign: "left", background: "var(--bg-surface-alt)", margin: "0 auto 20px auto", maxWidth: "420px" }}>
                <div style={{ fontSize: "0.82rem", lineHeight: 1.7 }}>
                  <div><strong>Doctor:</strong> {doctor.name}</div>
                  <div><strong>Time:</strong> {confirmedBooking.slot_time}</div>
                  <div><strong>Mode:</strong> {confirmedBooking.mode?.toUpperCase()}</div>
                  <div><strong>Security:</strong> DTLS-SRTP 256-bit Encrypted Room Ready</div>
                </div>
              </div>
              <button
                type="button"
                className="action-btn primary"
                onClick={() => {
                  onSuccess(confirmedBooking);
                  onClose();
                }}
                style={{ padding: "10px 24px", fontSize: "0.88rem" }}
              >
                Go to My Consultations
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step < 4 && (
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid var(--border-default)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg-surface-alt)",
            }}
          >
            {step > 1 ? (
              <button
                type="button"
                className="action-btn"
                onClick={() => setStep(step - 1)}
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem" }}
              >
                <ChevronLeft size={14} /> Back
              </button>
            ) : <div />}

            {step === 1 && (
              <button
                type="button"
                className="action-btn primary"
                onClick={handleProceedToTriage}
                disabled={triageChecking}
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.82rem" }}
              >
                {triageChecking ? "Evaluating Triage..." : "Review & Check Triage"} <ChevronRight size={14} />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                className="action-btn primary"
                onClick={() => setStep(3)}
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.82rem" }}
              >
                Proceed to Payment Hold <ChevronRight size={14} />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                className="action-btn primary"
                onClick={handleConfirmBooking}
                disabled={bookingLoading}
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.82rem" }}
              >
                <Lock size={13} /> {bookingLoading ? "Authorizing..." : `Authorize ₹${doctor.fee_inr} & Confirm`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
