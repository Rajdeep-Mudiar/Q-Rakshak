import { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Pill,
  Heart,
  Lock,
} from "lucide-react";
import { consultationsApi } from "../../api/consultations";
import { animateModalOpen } from "../../utils/motion";

export default function EPrescriptionModal({ booking, onClose, onSuccess }) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    animateModalOpen(overlayRef.current, modalRef.current);
  }, []);
  const [diagnosis, setDiagnosis] = useState(
    booking?.intake?.reason || ""
  );
  const [soapSubjective, setSoapSubjective] = useState(
    booking?.intake?.symptoms || ""
  );
  const [soapObjective, setSoapObjective] = useState("");
  const [soapAssessment, setSoapAssessment] = useState("");
  const [soapPlan, setSoapPlan] = useState("");

  const [medications, setMedications] = useState([]);

  const [lifestyleAdvice, setLifestyleAdvice] = useState([]);
  const [followUpDate, setFollowUpDate] = useState("");
  const [testsToOrder, setTestsToOrder] = useState([]);

  const [interactionResult, setInteractionResult] = useState(null);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handleAddMedication() {
    setMedications([
      ...medications,
      { name: "", dosage: "10 mg", frequency: "1-0-1 (Twice Daily)", duration_days: 14, instructions: "After meals" },
    ]);
  }

  function handleRemoveMedication(index) {
    setMedications(medications.filter((_, i) => i !== index));
  }

  function handleMedChange(index, field, value) {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  }

  async function handleCheckInteractions() {
    setCheckingInteractions(true);
    setErrorMessage("");
    try {
      const drugNames = medications.map((m) => m.name).filter(Boolean);
      const res = await consultationsApi.checkDrugInteractions(drugNames, []);
      setInteractionResult(res);
    } catch (err) {
      setErrorMessage("Interaction audit failed: " + err.message);
    } finally {
      setCheckingInteractions(false);
    }
  }

  async function handleSignAndIssue() {
    if (!diagnosis.trim()) {
      setErrorMessage("Please specify a clinical diagnosis.");
      return;
    }
    if (medications.length === 0) {
      setErrorMessage("Please include at least one medication in the care plan.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      const payload = {
        booking_id: booking.id,
        patient_id: booking.patient_id,
        doctor_id: booking.doctor_id || "DOC-KAVITA",
        diagnosis,
        medications,
        soap_subjective: soapSubjective,
        soap_objective: soapObjective,
        soap_assessment: soapAssessment,
        soap_plan: soapPlan,
        lifestyle_advice: lifestyleAdvice,
        follow_up_date: followUpDate,
        tests_to_order: testsToOrder,
      };
      await consultationsApi.createPrescription(payload);
      onSuccess();
    } catch (err) {
      setErrorMessage("Prescription issuance failed: " + err.message);
    } finally {
      setSubmitting(false);
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
        zIndex: 1100,
        padding: "16px",
      }}
    >
      <div
        ref={modalRef}
        className="card-panel modal-responsive-sheet"
        style={{
          width: "100%",
          maxWidth: "760px",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderTop: "3px solid var(--accent-blue)",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        {/* Header */}
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
              MODULE H • E-PRESCRIPTION & CARE PLAN
            </span>
            <h3 style={{ margin: 0, fontSize: "1.05rem", color: "var(--text-primary)", fontWeight: 800 }}>
              Digital Medical Prescription & SOAP Note
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close prescription modal"
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

        {/* Scrollable Body */}
        <div style={{ padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          {errorMessage && (
            <div className="alert-banner warning" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Diagnosis */}
          <div>
            <label className="metric-label" style={{ display: "block", marginBottom: "4px" }}>
              Clinical Diagnosis / Impression
            </label>
            <input
              type="text"
              className="terminal-input"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              style={{ width: "100%", padding: "8px", fontWeight: 700, color: "var(--primary)" }}
            />
          </div>

          {/* SOAP Clinical Notes Section */}
          <div className="card-panel" style={{ background: "var(--bg-surface-alt)", padding: "14px" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--primary)", marginBottom: "8px" }}>
              STRUCTURED SOAP CLINICAL NOTES TEMPLATE:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>S - Subjective</span>
                <textarea
                  className="terminal-input"
                  rows={2}
                  value={soapSubjective}
                  onChange={(e) => setSoapSubjective(e.target.value)}
                  style={{ width: "100%", fontSize: "0.78rem", padding: "6px" }}
                />
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>O - Objective</span>
                <textarea
                  className="terminal-input"
                  rows={2}
                  value={soapObjective}
                  onChange={(e) => setSoapObjective(e.target.value)}
                  style={{ width: "100%", fontSize: "0.78rem", padding: "6px" }}
                />
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>A - Assessment</span>
                <textarea
                  className="terminal-input"
                  rows={2}
                  value={soapAssessment}
                  onChange={(e) => setSoapAssessment(e.target.value)}
                  style={{ width: "100%", fontSize: "0.78rem", padding: "6px" }}
                />
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>P - Plan</span>
                <textarea
                  className="terminal-input"
                  rows={2}
                  value={soapPlan}
                  onChange={(e) => setSoapPlan(e.target.value)}
                  style={{ width: "100%", fontSize: "0.78rem", padding: "6px" }}
                />
              </div>
            </div>
          </div>

          {/* Rx Medications Builder */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span className="metric-label">Rx Pharmacotherapy Builder ({medications.length})</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="tab-btn"
                  onClick={handleCheckInteractions}
                  disabled={checkingInteractions}
                  style={{ fontSize: "0.74rem", padding: "4px 10px", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Pill size={12} /> {checkingInteractions ? "Auditing..." : "Audit Drug Interactions"}
                </button>
                <button
                  type="button"
                  className="action-btn"
                  onClick={handleAddMedication}
                  style={{ fontSize: "0.74rem", padding: "4px 10px", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Plus size={12} /> Add Drug
                </button>
              </div>
            </div>

            {/* Drug Interaction Feedback */}
            {interactionResult && (
              <div
                style={{
                  marginBottom: "10px",
                  padding: "10px",
                  background: interactionResult.is_safe ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.12)",
                  border: interactionResult.is_safe ? "1px solid var(--risk-low)" : "1px solid var(--risk-high)",
                  fontSize: "0.76rem",
                  color: interactionResult.is_safe ? "var(--risk-low)" : "var(--risk-high)",
                }}
              >
                <strong>{interactionResult.summary}</strong>
                {interactionResult.interactions?.map((it, idx) => (
                  <div key={idx} style={{ marginTop: "4px" }}>● {it.warning}</div>
                ))}
              </div>
            )}

            {/* Medications Table */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {medications.length === 0 ? (
                <div style={{ padding: "14px", textAlign: "center", border: "1px dashed var(--border-default)", borderRadius: "6px", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                  No medications added. Click "+ Add Drug" above to specify prescribed pharmaceuticals.
                </div>
              ) : (
                medications.map((med, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr 1.2fr 0.8fr 1fr 32px",
                    gap: "6px",
                    alignItems: "center",
                    background: "var(--bg-surface-alt)",
                    padding: "6px 8px",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Drug name (e.g. Atorvastatin)"
                    className="terminal-input"
                    value={med.name}
                    onChange={(e) => handleMedChange(idx, "name", e.target.value)}
                    style={{ padding: "4px 6px", fontSize: "0.76rem" }}
                  />
                  <input
                    type="text"
                    placeholder="Dosage"
                    className="terminal-input"
                    value={med.dosage}
                    onChange={(e) => handleMedChange(idx, "dosage", e.target.value)}
                    style={{ padding: "4px 6px", fontSize: "0.76rem" }}
                  />
                  <input
                    type="text"
                    placeholder="Frequency"
                    className="terminal-input"
                    value={med.frequency}
                    onChange={(e) => handleMedChange(idx, "frequency", e.target.value)}
                    style={{ padding: "4px 6px", fontSize: "0.76rem" }}
                  />
                  <input
                    type="number"
                    placeholder="Days"
                    className="terminal-input"
                    value={med.duration_days}
                    onChange={(e) => handleMedChange(idx, "duration_days", parseInt(e.target.value) || 0)}
                    style={{ padding: "4px 6px", fontSize: "0.76rem" }}
                  />
                  <input
                    type="text"
                    placeholder="Instructions"
                    className="terminal-input"
                    value={med.instructions}
                    onChange={(e) => handleMedChange(idx, "instructions", e.target.value)}
                    style={{ padding: "4px 6px", fontSize: "0.76rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(idx)}
                    style={{ background: "transparent", border: "none", color: "var(--risk-high)", cursor: "pointer" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )))}
            </div>
          </div>

          {/* Care Plan & Follow-Up */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="metric-label" style={{ display: "block", marginBottom: "4px" }}>
                Diagnostic Tests Ordered
              </label>
              <input
                type="text"
                className="terminal-input"
                value={testsToOrder.join(", ")}
                onChange={(e) => setTestsToOrder(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                style={{ width: "100%", padding: "6px", fontSize: "0.78rem" }}
              />
            </div>
            <div>
              <label className="metric-label" style={{ display: "block", marginBottom: "4px" }}>
                Follow-Up Schedule
              </label>
              <input
                type="text"
                className="terminal-input"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                style={{ width: "100%", padding: "6px", fontSize: "0.78rem" }}
              />
            </div>
          </div>
        </div>

        {/* Footer Signing Actions */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid var(--border-default)",
            background: "var(--bg-surface-alt)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Lock size={12} />
            <span>Digital SHA-256 Signature Stamp will be appended per DPDP Act, 2023.</span>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className="action-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="action-btn primary"
              onClick={handleSignAndIssue}
              disabled={submitting}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <FileCheck size={14} /> {submitting ? "Signing & Issuing..." : "Sign & Issue E-Prescription"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
