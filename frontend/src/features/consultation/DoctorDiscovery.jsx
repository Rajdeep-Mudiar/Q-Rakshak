import { useState, useEffect, useRef } from "react";
import {
  Search,
  Filter,
  ShieldCheck,
  Clock,
  Video,
  Phone,
  MapPin,
  Star,
  Award,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { consultationsApi } from "../../api/consultations";
import BookingModal from "./BookingModal";
import { animateEntrance, animateCardStagger } from "../../utils/motion";

export default function DoctorDiscovery({ onOpenBooking, onJoinRoom, patientId }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotHold, setSlotHold] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    loadDoctors();
  }, [selectedSpecialty]);

  useEffect(() => {
    if (containerRef.current) {
      animateEntrance(containerRef.current, { y: 15, duration: 0.35 });
      animateCardStagger(containerRef.current, ".card-panel");
    }
  }, [doctors]);

  async function loadDoctors() {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await consultationsApi.listDoctors(selectedSpecialty);
      if (res?.doctors) {
        setDoctors(res.doctors);
      }
    } catch (err) {
      setErrorMsg("Failed to load doctors: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSlotClick(doctor, slot) {
    setSelectedDoctor(doctor);
    setSelectedSlot(slot);
    setErrorMsg("");
    try {
      const holdRes = await consultationsApi.holdSlot(doctor.id, slot, patientId);
      setSlotHold(holdRes);
    } catch (err) {
      setErrorMsg(err.message || "Failed to reserve slot.");
    }
  }

  function handleStartBooking(doctor) {
    setSelectedDoctor(doctor);
    setBookingModalOpen(true);
  }

  const filteredDoctors = doctors.filter((doc) => {
    const q = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(q) ||
      doc.specialty.toLowerCase().includes(q) ||
      doc.hospital_affiliation.toLowerCase().includes(q)
    );
  });

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      {/* Header Banner */}
      <div
        className="card-panel"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderLeft: "4px solid var(--primary)",
          padding: "24px",
          borderRadius: "14px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span className="step-badge" style={{ background: "var(--primary-soft)", color: "var(--primary-dark)", borderColor: "var(--border-default)" }}>
                CLINICAL NETWORK
              </span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", color: "var(--text-primary)", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
                Verified Medical Specialists & Tele-Consultation
              </h2>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", margin: 0, maxWidth: "700px" }}>
              Connect with board-certified oncologists, cardiologists, and pulmonologists. Two-way synchronized calendar
              with soft-lock protection prevents double-booking.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span className="step-badge" style={{ padding: "6px 12px", fontSize: "0.74rem", background: "var(--risk-low-bg)", color: "var(--risk-low)", borderColor: "var(--risk-low-border)", display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={14} /> Medical Council Verified
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div style={{ display: "flex", gap: "12px", marginTop: "18px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              className="input-control"
              placeholder="Search by doctor name, condition, or hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "36px", width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
            {[
              { id: "all", label: "All Specialties" },
              { id: "cardiology", label: "Cardiology" },
              { id: "oncology", label: "Oncology" },
              { id: "pulmonary", label: "Pulmonology" },
              { id: "dermatology", label: "Dermatology" },
            ].map((spec) => (
              <button
                key={spec.id}
                type="button"
                onClick={() => setSelectedSpecialty(spec.id)}
                style={{
                  fontSize: "0.80rem",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: selectedSpecialty === spec.id ? "1px solid var(--primary)" : "1px solid var(--border-default)",
                  background: selectedSpecialty === spec.id ? "var(--primary-soft)" : "var(--bg-surface)",
                  color: selectedSpecialty === spec.id ? "var(--primary-dark)" : "var(--text-secondary)",
                  fontWeight: selectedSpecialty === spec.id ? 600 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                {spec.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="alert-banner warning" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="card-panel" style={{ textAlign: "center", padding: "40px" }}>
          <span className="spinner-icon" style={{ display: "inline-block", marginRight: "8px" }}>⚙️</span>
          <span>Loading verified clinical specialists...</span>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="card-panel" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>No medical specialists match your search criteria.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "16px" }}>
          {filteredDoctors.map((doc) => {
            const isSelected = selectedDoctor?.id === doc.id;
            return (
              <div
                key={doc.id}
                className="card-panel"
                style={{
                  border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border-default)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "14px",
                  background: isSelected ? "rgba(14, 165, 233, 0.03)" : "var(--bg-surface)",
                }}
              >
                {/* Doctor Bio Header */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "1.05rem", color: "var(--text-primary)", fontWeight: 700 }}>
                        {doc.name}
                      </h3>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--primary)", fontWeight: 600 }}>
                        {doc.specialty}
                      </p>
                    </div>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.78rem",
                        background: "rgba(245, 158, 11, 0.12)",
                        color: "var(--risk-mid)",
                        padding: "3px 7px",
                        fontWeight: 700,
                      }}
                    >
                      <Star size={12} fill="currentColor" /> {doc.rating || "4.9"}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Award size={13} color="var(--primary)" /> {doc.experience_years} Years Experience
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={13} /> {doc.hospital_affiliation}
                    </span>
                  </div>

                  <div style={{ marginTop: "6px", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Council Reg: <code style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{doc.registration_number}</code> ({doc.council_name})
                  </div>
                </div>

                {/* Available Slots Chips */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                      Next Available Slots:
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--accent-teal)", fontWeight: 700 }}>
                      ₹{doc.fee_inr} / Consult
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {(doc.available_slots || []).map((slot) => {
                      const isSlotActive = isSelected && selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleSlotClick(doc, slot)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                            fontFamily: "var(--font-mono)",
                            background: isSlotActive ? "var(--primary)" : "var(--bg-surface-alt)",
                            color: isSlotActive ? "#fff" : "var(--text-primary)",
                            border: isSlotActive ? "1px solid var(--primary)" : "1px solid var(--border-default)",
                            cursor: "pointer",
                          }}
                        >
                          <Clock size={11} style={{ display: "inline-block", marginRight: "3px" }} />
                          {slot}
                        </button>
                      );
                    })}
                  </div>

                  {isSelected && slotHold && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "6px 10px",
                        background: "rgba(16, 185, 129, 0.08)",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        fontSize: "0.72rem",
                        color: "var(--risk-low)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Lock size={12} />
                      <span>Slot <strong>{selectedSlot}</strong> soft-locked for you. Ready to complete intake.</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div style={{ display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px solid var(--border-default)" }}>
                  <button
                    type="button"
                    className="action-btn primary"
                    onClick={() => handleStartBooking(doc)}
                    style={{ flex: 1, padding: "8px", fontSize: "0.82rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <Video size={14} /> Book Video Consult
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      {bookingModalOpen && selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          initialSlot={selectedSlot}
          patientId={patientId}
          onClose={() => setBookingModalOpen(false)}
          onSuccess={(booking) => {
            setBookingModalOpen(false);
            if (onOpenBooking) onOpenBooking(booking);
          }}
        />
      )}
    </div>
  );
}
