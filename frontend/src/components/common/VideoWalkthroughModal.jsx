import { useEffect, useRef } from "react";
import { X, Play, ExternalLink, Sparkles, Shield, CheckCircle2 } from "lucide-react";
import { animateModalOpen } from "../../utils/motion";

export default function VideoWalkthroughModal({ isOpen, onClose, playlistId = "PLCPZnDFwe2SE" }) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      animateModalOpen(overlayRef.current, modalRef.current);
      const handleKeyDown = (e) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const embedUrl = `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&rel=0&modestbranding=1&enablejsapi=1`;
  const playlistExternalUrl = `https://www.youtube.com/playlist?list=${playlistId}`;

  const chapters = [
    { title: "Quantum AI Diagnostic Engine", desc: "VQC vs Classical Accuracy & Inference", tag: "PART 1" },
    { title: "3D Health Twin & Organ Vitality", desc: "Multi-organ real-time bio-simulation", tag: "PART 2" },
    { title: "Telemedicine & Clinical OPD", desc: "WebRTC encrypted video consultations", tag: "PART 3" },
    { title: "PQC Ledger & Security Governance", desc: "DPDP & HIPAA cryptographic ledger", tag: "PART 4" },
  ];

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 1300,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        ref={modalRef}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "960px",
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          background: "#FFFFFF",
          border: "1px solid #E4E4E7",
          borderTop: "3px solid #0052FF",
          borderRadius: "0px",
          boxShadow: "0 25px 60px -15px rgba(0, 82, 255, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
        }}
      >
        {/* Modal Architectural Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
            background: "#FAFAFA",
            borderBottom: "1px solid #E4E4E7",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                background: "#0052FF",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "0px",
              }}
            >
              <Play size={16} fill="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 900,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-mono, monospace)",
                    color: "#0052FF",
                    background: "#EFF6FF",
                    border: "1px solid #BFDBFE",
                    padding: "2px 6px",
                  }}
                >
                  OFFICIAL USER GUIDE • 4K HD
                </span>
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    color: "#71717A",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  PLAYLIST ID: {playlistId}
                </span>
              </div>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 900,
                  color: "#18181B",
                  margin: "2px 0 0 0",
                  letterSpacing: "-0.01em",
                  textTransform: "uppercase",
                }}
              >
                Q-Rakshak Clinical Platform Video Walkthrough
              </h3>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <a
              href={playlistExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                background: "#FFFFFF",
                color: "#DC2626",
                border: "1px solid #FECACA",
                fontSize: "0.72rem",
                fontWeight: 800,
                textDecoration: "none",
                fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                borderRadius: "0px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>Watch on YouTube</span>
              <ExternalLink size={12} />
            </a>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E4E7",
                borderRadius: "0px",
                cursor: "pointer",
                padding: "6px 8px",
                color: "#71717A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#18181B";
                e.currentTarget.style.color = "#18181B";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E4E4E7";
                e.currentTarget.style.color = "#71717A";
              }}
              title="Close Player"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Video Player Container */}
        <div style={{ position: "relative", width: "100%", background: "#09090B", overflow: "hidden" }}>
          <div
            style={{
              position: "relative",
              paddingBottom: "56.25%", // 16:9 Aspect Ratio
              height: 0,
              overflow: "hidden",
            }}
          >
            <iframe
              src={embedUrl}
              title="Q-Rakshak Clinical Platform User Guide Video Playlist"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: 0,
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>

        {/* Bottom Metadata & Chapter Guides */}
        <div
          style={{
            padding: "16px 20px",
            background: "#FFFFFF",
            borderTop: "1px solid #E4E4E7",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Sparkles size={14} color="#0052FF" />
              <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#18181B", textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "var(--font-mono, monospace)" }}>
                Featured Walkthrough Modules
              </span>
            </div>
            <span style={{ fontSize: "0.68rem", color: "#71717A", fontFamily: "var(--font-mono, monospace)" }}>
              Use the in-player playlist menu (top-right of video) to switch lessons anytime
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "8px",
            }}
          >
            {chapters.map((ch, idx) => (
              <div
                key={idx}
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E4E4E7",
                  padding: "8px 10px",
                  borderRadius: "0px",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                  <span style={{ fontSize: "0.60rem", fontWeight: 800, color: "#0052FF", fontFamily: "var(--font-mono, monospace)" }}>
                    {ch.tag}
                  </span>
                  <CheckCircle2 size={11} color="#10B981" />
                </div>
                <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#18181B", lineHeight: 1.25 }}>
                  {ch.title}
                </div>
                <div style={{ fontSize: "0.66rem", color: "#71717A", marginTop: "3px" }}>
                  {ch.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
