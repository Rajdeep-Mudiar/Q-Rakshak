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
import { animateEntrance, animateCardStagger, animateShutterEntrance } from "../../utils/motion";
import { useLanguage } from "../../context/LanguageContext";

export default function DoctorDiscovery({ onOpenBooking, onJoinRoom, patientId }) {
  const { t, formatCurrency } = useLanguage();
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
      animateShutterEntrance(containerRef.current, { y: 12, duration: 0.35 });
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
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", borderRadius: 0 }}>
      {/* Header Banner */}
      <div
        className="card-panel"
        style={{
          background: "var(--surface-base, #FFFFFF)",
          border: "1px solid var(--border-subtle, #E4E4E7)",
          borderLeft: "4px solid var(--accent-cobalt, #0052FF)",
          padding: "24px",
          borderRadius: 0,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
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
                {t("telemedicine.clinical_network", "CLINICAL NETWORK")}
              </span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", color: "var(--ink-primary, #09090B)", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
                {t("telemedicine.title", "Verified Medical Specialists & Tele-Consultation")}
              </h2>
            </div>
            <p style={{ color: "var(--ink-secondary, #71717A)", fontSize: "0.82rem", margin: 0, maxWidth: "700px" }}>
              {t("telemedicine.subtitle", "Connect with board-certified oncologists, cardiologists, and pulmonologists. Two-way synchronized calendar with soft-lock protection prevents double-booking.")}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span
              style={{
                padding: "6px 12px",
                fontSize: "0.74rem",
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
              <ShieldCheck size={14} /> {t("telemedicine.verified_badge", "Medical Council Verified")}
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-secondary, #71717A)" }} />
            <input
              type="text"
              className="input-control"
              placeholder={t("telemedicine.search_placeholder", "Search by doctor name, condition, or hospital...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "36px", width: "100%", borderRadius: 0, border: "1px solid var(--border-subtle, #E4E4E7)" }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", maxWidth: "100%", paddingBottom: "4px" }}>
            {[
              { id: "all", label: t("telemedicine.spec_all", "All Specialties") },
              { id: "cardiology", label: t("telemedicine.spec_cardiology", "Cardiology") },
              { id: "oncology", label: t("telemedicine.spec_oncology", "Oncology") },
              { id: "pulmonary", label: t("telemedicine.spec_pulmonary", "Pulmonology") },
              { id: "dermatology", label: t("telemedicine.spec_dermatology", "Dermatology") },
            ].map((spec) => (
              <button
                key={spec.id}
                type="button"
                onClick={() => setSelectedSpecialty(spec.id)}
                style={{
                  fontSize: "0.78rem",
                  padding: "8px 14px",
                  minHeight: "38px",
                  borderRadius: 0,
                  border: selectedSpecialty === spec.id ? "1px solid var(--ink-primary, #09090B)" : "1px solid var(--border-subtle, #E4E4E7)",
                  background: selectedSpecialty === spec.id ? "var(--ink-primary, #09090B)" : "var(--surface-base, #FFFFFF)",
                  color: selectedSpecialty === spec.id ? "#FFFFFF" : "var(--ink-secondary, #71717A)",
                  fontWeight: selectedSpecialty === spec.id ? 700 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {spec.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
            background: "var(--state-error-soft, #FFF1F2)",
            border: "1px solid var(--state-error, #E11D48)",
            color: "var(--state-error, #E11D48)",
            fontSize: "0.82rem",
            borderRadius: 0,
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="card-panel" style={{ textAlign: "center", padding: "48px", borderRadius: 0, background: "var(--surface-base, #FFFFFF)", border: "1px solid var(--border-subtle, #E4E4E7)" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--ink-secondary, #71717A)", fontFamily: "var(--font-mono)" }}>
            {t("telemedicine.loading_specialists", "Loading verified clinical specialists...")}
          </span>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="card-panel" style={{ textAlign: "center", padding: "48px", borderRadius: 0, background: "var(--surface-base, #FFFFFF)", border: "1px solid var(--border-subtle, #E4E4E7)" }}>
          <p style={{ color: "var(--ink-secondary, #71717A)", fontSize: "0.85rem" }}>
            {t("telemedicine.no_match", "No medical specialists match your search criteria.")}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", gap: "16px" }}>
          {filteredDoctors.map((doc) => {
            const isSelected = selectedDoctor?.id === doc.id;
            return (
              <div
                key={doc.id}
                className="card-panel"
                style={{
                  border: isSelected ? "1px solid var(--accent-cobalt, #0052FF)" : "1px solid var(--border-subtle, #E4E4E7)",
                  borderTop: isSelected ? "3px solid var(--accent-cobalt, #0052FF)" : "1px solid var(--border-subtle, #E4E4E7)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "14px",
                  background: "var(--surface-base, #FFFFFF)",
                  borderRadius: 0,
                  padding: "18px",
                  transition: "border-color 0.15s ease",
                }}
              >
                {/* Doctor Bio Header */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "1.05rem", color: "var(--ink-primary, #09090B)", fontWeight: 700 }}>
                        {doc.name}
                      </h3>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--accent-cobalt, #0052FF)", fontWeight: 600 }}>
                        {doc.specialty}
                      </p>
                    </div>
                    <span
                      className="tabular-nums"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.78rem",
                        background: "var(--surface-sunken, #F4F4F5)",
                        color: "var(--ink-primary, #09090B)",
                        border: "1px solid var(--border-subtle, #E4E4E7)",
                        padding: "3px 7px",
                        fontWeight: 800,
                        fontFamily: "var(--font-mono)",
                        borderRadius: 0,
                      }}
                    >
                      <Star size={12} fill="#F59E0B" color="#F59E0B" /> {doc.rating || "4.9"}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px", fontSize: "0.75rem", color: "var(--ink-secondary, #71717A)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Award size={13} color="var(--accent-cobalt, #0052FF)" /> <span className="tabular-nums">{doc.experience_years}</span> {t("telemedicine.years_experience", "Years Experience")}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={13} /> {doc.hospital_affiliation}
                    </span>
                  </div>

                  <div style={{ marginTop: "6px", fontSize: "0.72rem", color: "var(--ink-secondary, #71717A)" }}>
                    {t("telemedicine.council_reg", "Council Reg")}: <code style={{ fontFamily: "var(--font-mono)", color: "var(--ink-primary, #09090B)" }}>{doc.registration_number}</code> ({doc.council_name})
                  </div>
                </div>

                {/* Available Slots Chips */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ink-secondary, #71717A)", textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "var(--font-mono)" }}>
                      {t("telemedicine.next_slots", "Next Available Slots:")}
                    </span>
                    <span className="tabular-nums" style={{ fontSize: "0.82rem", color: "var(--state-success, #059669)", fontWeight: 800, fontFamily: "var(--font-mono)" }}>
                      {formatCurrency ? formatCurrency(doc.fee_inr) : `₹${doc.fee_inr}`} <span style={{ fontSize: "0.70rem", fontWeight: 500, color: "var(--ink-secondary, #71717A)" }}>{t("telemedicine.per_consult", "/ Consult")}</span>
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
                            background: isSlotActive ? "var(--accent-cobalt, #0052FF)" : "var(--surface-sunken, #F4F4F5)",
                            color: isSlotActive ? "#FFFFFF" : "var(--ink-primary, #09090B)",
                            border: isSlotActive ? "1px solid var(--accent-cobalt, #0052FF)" : "1px solid var(--border-subtle, #E4E4E7)",
                            borderRadius: 0,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
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
                        background: "var(--state-success-soft, #ECFDF5)",
                        border: "1px solid var(--state-success, #059669)",
                        fontSize: "0.72rem",
                        color: "var(--state-success, #059669)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        borderRadius: 0,
                      }}
                    >
                      <Lock size={12} />
                      <span>{t("telemedicine.slot_locked_prefix", "Slot")} <strong>{selectedSlot}</strong> {t("telemedicine.slot_locked_suffix", "soft-locked for you. Ready to complete intake.")}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div style={{ display: "flex", gap: "8px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle, #E4E4E7)" }}>
                  <button
                    type="button"
                    className="action-btn primary"
                    onClick={() => handleStartBooking(doc)}
                    style={{ flex: 1, padding: "8px", fontSize: "0.82rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", borderRadius: 0 }}
                  >
                    <Video size={14} /> {t("telemedicine.book_video_consult", "Book Video Consult")}
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
