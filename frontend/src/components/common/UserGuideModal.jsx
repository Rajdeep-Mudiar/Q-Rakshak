import { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Stethoscope,
  Activity,
  Microscope,
  ShieldCheck,
  Download,
  Play,
  CheckCircle2,
  Atom,
} from "lucide-react";
import { animateModalOpen } from "../../utils/motion";
import { useLanguage } from "../../context/LanguageContext";

export default function UserGuideModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (isOpen) {
      animateModalOpen(overlayRef.current, modalRef.current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const slides = [
    {
      badge: "Welcome Tour",
      title: "Welcome to Q-RAKSHAK",
      subtitle: "Personal Health Intelligence & Quantum AI Checkups",
      icon: Atom,
      iconColor: "var(--primary)",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          <p>
            <strong>Q-RAKSHAK</strong> gives you autonomous preventative health checkups, an interactive 3D digital health twin, multi-organ early detection monitoring, and tamper-proof encrypted health records.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
            <div style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-default)", padding: "10px" }}>
              <strong style={{ color: "var(--primary)", fontSize: "0.80rem", display: "block" }}>⚡ Precision Quantum AI</strong>
              <span>Processes dozens of biological indicators simultaneously for earlier, more accurate health insights.</span>
            </div>
            <div style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-default)", padding: "10px" }}>
              <strong style={{ color: "var(--accent-teal)", fontSize: "0.80rem", display: "block" }}>DPDP & HIPAA Security</strong>
              <span>Your medical data is encrypted and protected with complete data privacy controls.</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      badge: "Step-by-Step Workflow",
      title: "How to Run a Health Checkup",
      subtitle: "4 Simple Steps in your Personal Health Cockpit",
      icon: Stethoscope,
      iconColor: "var(--primary)",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.80rem", color: "var(--text-secondary)" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: "var(--bg-canvas)", border: "1px solid var(--border-default)", padding: "8px" }}>
            <span style={{ width: "20px", height: "20px", background: "var(--primary)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, flexShrink: 0 }}>1</span>
            <div>
              <strong style={{ color: "var(--text-primary)" }}>Choose Health Checkup:</strong>
              <p style={{ margin: 0 }}>Select an area of focus: Oncology, Heart Health, Metabolic Wellness, Pulmonology, or Skin Check.</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: "var(--bg-canvas)", border: "1px solid var(--border-default)", padding: "8px" }}>
            <span style={{ width: "20px", height: "20px", background: "var(--primary)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, flexShrink: 0 }}>2</span>
            <div>
              <strong style={{ color: "var(--text-primary)" }}>Review Health Indicators:</strong>
              <p style={{ margin: 0 }}>Your biological test values and laboratory biomarkers are loaded and calibrated against healthy population baselines.</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: "var(--bg-canvas)", border: "1px solid var(--border-default)", padding: "8px" }}>
            <span style={{ width: "20px", height: "20px", background: "var(--primary)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, flexShrink: 0 }}>3</span>
            <div>
              <strong style={{ color: "var(--text-primary)" }}>Run Instant Quantum AI Checkup:</strong>
              <p style={{ margin: 0 }}>Press the primary button to compute high-accuracy risk evaluations and identify your key health factors.</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: "var(--bg-canvas)", border: "1px solid var(--border-default)", padding: "8px" }}>
            <span style={{ width: "20px", height: "20px", background: "var(--primary)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, flexShrink: 0 }}>4</span>
            <div>
              <strong style={{ color: "var(--text-primary)" }}>Inspect Health Assessment & Download PDF:</strong>
              <p style={{ margin: 0 }}>View your risk tier, check which biomarkers influenced the result, and download a verified PDF report.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      badge: "3D Digital Twin",
      title: "Interactive 3D Health Twin",
      subtitle: "Multi-Organ Vitality & Preventative Care",
      icon: Activity,
      iconColor: "var(--accent-teal)",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          <p>
            The <strong>3D Digital Health Twin</strong> visualizes your organ-by-organ vitality on an anatomical view:
          </p>
          <ul style={{ paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <li><strong>Interactive Hotspots:</strong> Click on Brain, Heart, Lungs, Breast Tissue, Pancreas, or Liver to view organ-specific metrics.</li>
            <li><strong>Vitality Risk Level:</strong> Green indicates optimal equilibrium; orange/red signals areas for preventative attention.</li>
            <li><strong>Timeline Trajectory:</strong> Use the visit slider to track your health progress across past checkups and future projections.</li>
          </ul>
        </div>
      ),
    },
    {
      badge: "Role-Based Access",
      title: "Two-Tier Platform Roles",
      subtitle: "Patient Self-Care • Administrator Audit & Security",
      icon: ShieldCheck,
      iconColor: "var(--accent-violet)",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.80rem", color: "var(--text-secondary)" }}>
          <p style={{ margin: 0 }}>
            Platform access is tailored based on registered credentials and assigned roles:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-default)", padding: "10px" }}>
              <strong style={{ color: "var(--primary)" }}>👤 Patient Portal</strong>
              <p style={{ fontSize: "0.72rem", margin: "3px 0 0 0" }}>Personal Health Checkups, 3D Health Twin, Early Detection Map & Encrypted Records.</p>
            </div>
            <div style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-default)", padding: "10px" }}>
              <strong style={{ color: "var(--accent-teal)" }}>🛡️ Administrator & Clinical</strong>
              <p style={{ fontSize: "0.72rem", margin: "3px 0 0 0" }}>Security & Compliance, User Management, AI Benchmark Matrix & Audit Trail.</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const slide = slides[currentSlide];
  const IconComponent = slide.icon;

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "640px",
          padding: "28px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-default)",
          borderTop: "3px solid var(--accent-blue)",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid var(--border-default)", paddingBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ padding: "8px", background: "var(--bg-surface-alt)", color: slide.iconColor, border: "1px solid var(--border-default)" }}>
              <IconComponent size={22} />
            </div>
            <div>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--primary)", background: "var(--primary-soft)", padding: "2px 6px" }}>
                {slide.badge}
              </span>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 0 0" }}>
                {slide.title}
              </h2>
              <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", margin: 0 }}>
                {slide.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
            title="Close guide"
          >
            <X size={18} />
          </button>
        </div>

        {/* Slide Body */}
        <div style={{ minHeight: "190px", marginBottom: "16px" }}>
          {slide.content}
        </div>

        {/* Footer Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-default)", paddingTop: "14px" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentSlide(i)}
                style={{
                  width: "24px",
                  height: "6px",
                  background: currentSlide === i ? "var(--primary)" : "var(--border-default)",
                  border: 0,
                  cursor: "pointer",
                }}
                title={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {currentSlide > 0 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCurrentSlide((prev) => prev - 1)}
                style={{ padding: "6px 12px", fontSize: "0.78rem" }}
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}

            {currentSlide < slides.length - 1 ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setCurrentSlide((prev) => prev + 1)}
                style={{ padding: "6px 14px", fontSize: "0.78rem" }}
              >
                <span>Next Step</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={onClose}
                style={{ padding: "6px 14px", fontSize: "0.78rem", background: "var(--risk-low)", borderColor: "var(--risk-low)" }}
              >
                <CheckCircle2 size={14} />
                <span>Got It! Let's Begin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
