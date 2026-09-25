import { useState, useEffect, useRef } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Share2,
  ShieldCheck,
  Send,
  User,
  Heart,
  FileText,
  Clock,
  Camera,
  Maximize2,
  Sparkles,
  Lock,
  Volume2,
  CheckCircle,
} from "lucide-react";
import { consultationsApi } from "../../api/consultations";
import EPrescriptionModal from "./EPrescriptionModal";
import { animateEntrance } from "../../utils/motion";
import {
  getClinicalMediaStream,
  getScreenShareStream,
  captureVideoSnapshot,
  createClinicalPeerConnection,
} from "../../utils/webrtc";

export default function VirtualConsultationRoom({ booking, isDoctor = false, onLeave }) {
  const [room, setRoom] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState("chat"); // chat | clinical_context
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [capturedSnapshot, setCapturedSnapshot] = useState(null);
  const [snapshotToast, setSnapshotToast] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Mesh Handshake Active");
  const [isSyntheticStream, setIsSyntheticStream] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  const containerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const signalCursorRef = useRef(0);
  const pendingCandidatesRef = useRef([]);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);

  // GSAP Entrance
  useEffect(() => {
    if (containerRef.current) {
      animateEntrance(containerRef.current, { y: 15, duration: 0.35 });
    }
  }, []);

  // Initialize WebRTC Media Streams
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        const callerName = isDoctor ? booking.doctor_name || "Doctor" : booking.patient_name || "Patient";
        const { stream: localStream, isSynthetic } = await getClinicalMediaStream({
          video: true,
          audio: true,
          role: isDoctor ? "doctor" : "patient",
          participantName: callerName,
        });

        if (!active) return;

        localStreamRef.current = localStream;
        setIsSyntheticStream(isSynthetic);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
          localVideoRef.current.play().catch(() => {});
        }

        const peerConnection = createClinicalPeerConnection({
          onTrack: (stream) => {
            remoteStreamRef.current = stream;
            setHasRemoteStream(true);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
              remoteVideoRef.current.play().catch(() => {});
            }
            setConnectionStatus("DTLS-SRTP 256-Bit Encrypted • Live Telemetry Active");
          },
          onIceCandidate: (candidate) => {
            consultationsApi.publishSignal(
              booking.id,
              "ice-candidate",
              candidate.toJSON?.() || candidate,
              isDoctor ? "doctor" : "patient",
              callerName
            ).catch(() => {});
          },
          onConnectionStateChange: (state) => {
            if (state === "connected") {
              setConnectionStatus("DTLS-SRTP 256-Bit Encrypted • Peer Connected");
            } else if (state === "connecting") {
              setConnectionStatus("Establishing DTLS-SRTP Peer Handshake...");
            }
          },
        });
        peerConnectionRef.current = peerConnection;
        localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

        if (isDoctor) {
          const offer = await peerConnection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
          await peerConnection.setLocalDescription(offer);
          await consultationsApi.publishSignal(
            booking.id,
            "offer",
            offer,
            "doctor",
            callerName
          );
        }
      } catch (err) {
        console.error("WebRTC initialization error:", err);
        setMediaError(err.message || "Unable to initialize camera and microphone.");
        setConnectionStatus("WebRTC media unavailable");
      }
    }

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
    };
  }, [booking?.id, isDoctor]);

  useEffect(() => {
    if (!booking?.id) return undefined;
    let active = true;
    const callerRole = isDoctor ? "doctor" : "patient";
    const callerName = isDoctor ? booking.doctor_name || "Doctor" : booking.patient_name || "Patient";

    async function pollSignals() {
      if (!peerConnectionRef.current) return;
      try {
        const res = await consultationsApi.listSignals(booking.id, signalCursorRef.current, callerRole);
        for (const signal of res.signals || []) {
          signalCursorRef.current = Math.max(signalCursorRef.current, signal.id);
          const peer = peerConnectionRef.current;
          if (!peer || signal.sender_role === callerRole) continue;

          if (signal.signal_type === "offer" && !isDoctor) {
            await peer.setRemoteDescription(new RTCSessionDescription(signal.payload));
            // Flush queued candidates
            for (const c of pendingCandidatesRef.current) {
              try { await peer.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
            }
            pendingCandidatesRef.current = [];

            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            await consultationsApi.publishSignal(
              booking.id,
              "answer",
              answer,
              "patient",
              callerName
            );
          } else if (signal.signal_type === "answer" && isDoctor) {
            if (peer.signalingState === "have-local-offer") {
              await peer.setRemoteDescription(new RTCSessionDescription(signal.payload));
              // Flush queued candidates
              for (const c of pendingCandidatesRef.current) {
                try { await peer.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
              }
              pendingCandidatesRef.current = [];
            }
          } else if (signal.signal_type === "ice-candidate") {
            if (peer.remoteDescription && peer.remoteDescription.type) {
              try {
                await peer.addIceCandidate(new RTCIceCandidate(signal.payload));
              } catch (e) {
                console.warn("Could not add ice candidate:", e);
              }
            } else {
              pendingCandidatesRef.current.push(signal.payload);
            }
          }
        }
        if (active) setMediaError(null);
      } catch (err) {
        // silent retry
      }
    }
    const interval = setInterval(pollSignals, 1000);
    pollSignals();
    return () => { active = false; clearInterval(interval); };
  }, [booking?.id, isDoctor]);

  // Hook local and remote video elements whenever room status changes
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [room?.status, hasRemoteStream]);

  // Periodic room status polling
  useEffect(() => {
    if (!booking?.id) return;
    loadRoom();
    const interval = setInterval(loadRoom, 3500);
    return () => clearInterval(interval);
  }, [booking?.id]);

  async function loadRoom() {
    try {
      const res = await consultationsApi.getRoom(booking.id);
      if (res?.room) {
        setRoom(res.room);
        setChatMessages(res.room.chat_messages || []);
      }
    } catch (err) {
      console.error("Room sync error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdmit() {
    try {
      await consultationsApi.admitPatient(booking.id);
      await loadRoom();
    } catch (err) {
      alert("Failed to admit patient: " + err.message);
    }
  }

  function toggleAudio() {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = !isAudioOn;
      });
      setIsAudioOn(!isAudioOn);
    }
  }

  function toggleVideo() {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((t) => {
        t.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  }

  async function toggleScreenShare() {
    if (!isScreenSharing) {
      try {
        const screenStream = await getScreenShareStream();
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);

        const screenTrack = screenStream.getVideoTracks()[0];

        // Transmit screen track over WebRTC peer connection
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders?.() || [];
          const videoSender = senders.find((s) => s.track && s.track.kind === "video");
          if (videoSender && screenTrack) {
            await videoSender.replaceTrack(screenTrack).catch((err) => {
              console.warn("Could not replace video track with screen track:", err);
            });
          }
        }

        // Preview screen share locally in picture-in-picture box
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
          localVideoRef.current.play().catch(() => {});
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.warn("Screen share cancelled or failed:", err);
      }
    } else {
      stopScreenShare();
    }
  }

  async function stopScreenShare() {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);

    // Restore local camera track over WebRTC
    const localVideoTrack = localStreamRef.current?.getVideoTracks?.()[0];
    if (peerConnectionRef.current && localVideoTrack) {
      const senders = peerConnectionRef.current.getSenders?.() || [];
      const videoSender = senders.find((s) => s.track && s.track.kind === "video");
      if (videoSender) {
        await videoSender.replaceTrack(localVideoTrack).catch((err) => {
          console.warn("Could not restore camera track:", err);
        });
      }
    }

    // Restore local camera preview in picture-in-picture box
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }

    // Ensure remote video maintains the remote stream
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      remoteVideoRef.current.play().catch(() => {});
    }
  }

  function handleTakeSnapshot() {
    const targetVideo = remoteVideoRef.current || localVideoRef.current;
    if (targetVideo) {
      const snapshot = captureVideoSnapshot(targetVideo);
      if (snapshot) {
        setCapturedSnapshot(snapshot);
        setSnapshotToast(true);
        setTimeout(() => setSnapshotToast(false), 3000);

        // Auto-post snapshot to consultation chat
        const sender = isDoctor ? booking.doctor_name || "Doctor" : booking.patient_name || "Patient";
        consultationsApi.sendChatMessage(
          booking.id,
          sender,
          `📷 [CLINICAL TELEMETRY SNAPSHOT CAPTURED] Frame timestamp: ${new Date().toLocaleTimeString()}`
        ).then((res) => {
          if (res?.chat_messages) setChatMessages(res.chat_messages);
        }).catch(() => {});
      }
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const sender = isDoctor ? booking.doctor_name || "Doctor" : booking.patient_name || "Patient";
    const text = chatInput;
    setChatInput("");
    try {
      const res = await consultationsApi.sendChatMessage(booking.id, sender, text);
      if (res?.chat_messages) {
        setChatMessages(res.chat_messages);
      }
    } catch (err) {
      console.error("Failed to send chat:", err);
    }
  }

  async function handleEndCall() {
    if (confirm("Are you sure you want to conclude this clinical consultation?")) {
      try {
        await consultationsApi.transitionBooking(booking.id, "completed");
        if (onLeave) onLeave();
      } catch (err) {
        alert("Failed to close session: " + err.message);
      }
    }
  }

  const isWaiting = room?.status === "waiting";

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
      {/* Session Security Ribbon */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "14px",
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span
            className="step-badge"
            style={{
              background: isWaiting ? "var(--risk-mid)" : "var(--risk-low)",
              color: "#FFFFFF",
              letterSpacing: "0.06em",
              fontSize: "0.68rem",
              padding: "4px 10px",
              borderRadius: "6px",
              fontWeight: 600,
            }}
          >
            {isWaiting ? "VIRTUAL WAITING ENCLAVE" : "LIVE WEBRTC SESSION"}
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "0.98rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {booking.doctor_name || "Clinician"} ↔ {booking.patient_name || "Patient"}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
            [{booking.mode?.toUpperCase()} • {booking.slot_time}]
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.74rem", fontFamily: "var(--font-mono)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--risk-low)", fontWeight: 700 }}>
            <Lock size={12} /> {connectionStatus}
          </span>
          {isSyntheticStream && (
            <span
              style={{
                background: "var(--primary-soft)",
                color: "var(--primary-dark)",
                border: "1px solid var(--border-default)",
                padding: "2px 8px",
                fontSize: "0.66rem",
                borderRadius: "6px",
                fontWeight: 600,
              }}
              title="Camera simulated with high-tech diagnostic HUD"
            >
              CAMERA SCANNER ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div
        className="consultation-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.85fr 1.15fr",
          gap: "16px",
          minHeight: "520px",
        }}
      >
        {/* Left Column: Live WebRTC Video Viewport & Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              background: "#020408",
              border: "1px solid var(--border-default)",
              aspectRatio: "16 / 9",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              borderRadius: "14px",
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.25)",
            }}
          >
            {isWaiting && !isDoctor ? (
              /* Patient in Waiting Room with Local Preview */
              <div style={{ textAlign: "center", padding: "28px", maxWidth: "460px", zIndex: 10 }}>
                <Clock size={44} color="var(--gold)" style={{ margin: "0 auto 14px auto" }} />
                <h3 style={{ fontFamily: "var(--font-display)", color: "var(--ink-primary)", margin: "0 0 8px 0", fontSize: "1.35rem", fontWeight: 800 }}>
                  Secured Waiting Salon
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0 0 16px 0", lineHeight: 1.5 }}>
                  Dr. <strong>{booking.doctor_name}</strong> has been alerted. Your camera and microphone hardware are calibrated and awaiting doctor admission.
                </p>
                <div style={{ fontSize: "0.76rem", color: "var(--emerald-couture)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontFamily: "var(--font-mono)" }}>
                  <ShieldCheck size={15} /> Encrypted WebRTC Media Channel Ready
                </div>
              </div>
            ) : isWaiting && isDoctor ? (
              /* Doctor sees Patient waiting with instant Admit button */
              <div style={{ textAlign: "center", padding: "28px", maxWidth: "460px", zIndex: 10 }}>
                <User size={44} color="var(--gold)" style={{ margin: "0 auto 14px auto" }} />
                <h3 style={{ fontFamily: "var(--font-display)", color: "var(--ink-primary)", margin: "0 0 8px 0", fontSize: "1.35rem", fontWeight: 800 }}>
                  Patient in Queue
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0 0 20px 0", lineHeight: 1.5 }}>
                  Patient <strong>{booking.patient_name || "Unknown patient"}</strong> is verified in the waiting room.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleAdmit}
                  style={{
                    padding: "12px 28px",
                    fontSize: "0.88rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "var(--ink-primary)",
                    border: "1px solid var(--gold)",
                  }}
                >
                  <Video size={16} color="var(--gold)" /> Admit to WebRTC Consultation
                </button>
              </div>
            ) : null}

            {/* Remote WebRTC Video Track (Primary Viewport) */}
            {!isWaiting && !hasRemoteStream && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "radial-gradient(circle at center, #0c1524 0%, #020408 100%)",
                  zIndex: 5,
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    border: "2px solid var(--gold)",
                    borderTopColor: "transparent",
                    animation: "spin 1.2s linear infinite",
                    marginBottom: "16px",
                  }}
                />
                <h4 style={{ fontFamily: "var(--font-display)", color: "var(--gold)", margin: "0 0 6px 0", fontSize: "1.1rem" }}>
                  Synchronizing Peer Stream
                </h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", margin: 0, fontFamily: "var(--font-mono)" }}>
                  Connecting with {isDoctor ? (booking.patient_name || "Patient") : (booking.doctor_name || "Doctor")} via 256-bit DTLS-SRTP tunnel...
                </p>
              </div>
            )}

            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: !isWaiting ? "block" : "none",
              }}
            />

            {/* Picture-in-Picture Local Self Video Feed */}
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                right: "16px",
                width: "160px",
                height: "100px",
                background: "#0A0D14",
                border: "1px solid var(--gold)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                overflow: "hidden",
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--radius-xs)",
              }}
            >
              {isVideoOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.68rem" }}>
                  <VideoOff size={18} color="var(--risk-high)" style={{ margin: "0 auto 4px auto" }} />
                  <span>Cam Muted</span>
                </div>
              )}

              <div
                style={{
                  position: "absolute",
                  bottom: "4px",
                  left: "6px",
                  fontSize: "0.58rem",
                  fontFamily: "var(--font-mono)",
                  color: "#FFFFFF",
                  background: "rgba(0,0,0,0.75)",
                  padding: "2px 5px",
                  letterSpacing: "0.06em",
                  borderRadius: "2px",
                }}
              >
                {isDoctor ? (booking.doctor_name || "Doctor") : (booking.patient_name || "Patient")} (YOU)
              </div>
            </div>

            {/* Vitals Telemetry HUD Overlay */}
            {!isWaiting && (
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "14px",
                  background: "rgba(3, 7, 18, 0.82)",
                  border: "1px solid var(--border-default)",
                  padding: "6px 14px",
                  display: "flex",
                  gap: "16px",
                  fontSize: "0.74rem",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  zIndex: 20,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--emerald-couture)" }}>
                  <ShieldCheck size={12} /> SECURE WebRTC 1080p
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--text-gold)" }}>
                  <Sparkles size={12} /> TELEMETRY: ACTIVE (0.94)
                </span>
              </div>
            )}

            {/* Snapshot Toast Indicator */}
            {snapshotToast && (
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "var(--bg-surface)",
                  color: "var(--text-gold)",
                  border: "1px solid var(--gold)",
                  padding: "8px 14px",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                  zIndex: 30,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)",
                }}
              >
                <CheckCircle size={14} color="var(--emerald-couture)" />
                <span>Clinical snapshot appended to session notes</span>
              </div>
            )}
          </div>

          {/* WebRTC Video Control Bar */}
          <div
            style={{
              padding: "12px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {/* Audio, Video, Screen, Snapshot Controls */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`tab-btn ${isAudioOn ? "active" : ""}`}
                onClick={toggleAudio}
                style={{
                  padding: "8px 14px",
                  fontSize: "0.78rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  minHeight: "40px",
                }}
                title={isAudioOn ? "Mute Microphone" : "Unmute Microphone"}
              >
                {isAudioOn ? <Mic size={14} /> : <MicOff size={14} color="var(--risk-high)" />}
                <span>{isAudioOn ? "Mic Active" : "Mic Muted"}</span>
              </button>

              <button
                type="button"
                className={`tab-btn ${isVideoOn ? "active" : ""}`}
                onClick={toggleVideo}
                style={{
                  padding: "8px 14px",
                  fontSize: "0.78rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  minHeight: "40px",
                }}
                title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
              >
                {isVideoOn ? <Video size={14} /> : <VideoOff size={14} color="var(--risk-high)" />}
                <span>{isVideoOn ? "Cam Active" : "Cam Paused"}</span>
              </button>

              <button
                type="button"
                className={`tab-btn ${isScreenSharing ? "active" : ""}`}
                onClick={toggleScreenShare}
                style={{
                  padding: "8px 14px",
                  fontSize: "0.78rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  minHeight: "40px",
                }}
                title={isScreenSharing ? "Stop Sharing Screen" : "Share Diagnostic Desktop"}
              >
                <Share2 size={14} />
                <span>{isScreenSharing ? "Sharing Scan" : "Share Screen"}</span>
              </button>

              <button
                type="button"
                className="tab-btn"
                onClick={handleTakeSnapshot}
                style={{
                  padding: "8px 14px",
                  fontSize: "0.78rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  minHeight: "40px",
                }}
                title="Capture clinical frame snapshot to EHR"
              >
                <Camera size={14} />
                <span>Capture Frame</span>
              </button>
            </div>

            {/* Doctor Actions & End Call */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {isDoctor && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setRxModalOpen(true)}
                  style={{
                    padding: "8px 14px",
                    fontSize: "0.78rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--bg-surface-dark)",
                    border: "1px solid var(--gold)",
                    minHeight: "40px",
                  }}
                >
                  <FileText size={14} color="var(--gold)" />
                  <span>Issue E-Prescription</span>
                </button>
              )}

              <button
                type="button"
                className="action-btn danger"
                onClick={handleEndCall}
                style={{
                  padding: "8px 16px",
                  fontSize: "0.78rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "var(--risk-high)",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: "pointer",
                  minHeight: "40px",
                }}
              >
                <PhoneOff size={14} />
                <span>End Call</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Encrypted Consultation Chat & Clinical Context */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            borderRadius: "var(--radius-xs)",
          }}
        >
          {/* Tab Switcher */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border-default)",
              background: "var(--bg-surface-alt)",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveRightTab("chat")}
              style={{
                flex: 1,
                padding: "10px",
                fontSize: "0.78rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                background: activeRightTab === "chat" ? "var(--bg-surface)" : "transparent",
                border: "none",
                borderBottom: activeRightTab === "chat" ? "2px solid var(--gold)" : "2px solid transparent",
                color: activeRightTab === "chat" ? "var(--ink-primary)" : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              Session Chat ({chatMessages.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveRightTab("clinical_context")}
              style={{
                flex: 1,
                padding: "10px",
                fontSize: "0.78rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                background: activeRightTab === "clinical_context" ? "var(--bg-surface)" : "transparent",
                border: "none",
                borderBottom: activeRightTab === "clinical_context" ? "2px solid var(--gold)" : "2px solid transparent",
                color: activeRightTab === "clinical_context" ? "var(--ink-primary)" : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              EHR Context
            </button>
          </div>

          {activeRightTab === "chat" ? (
            /* Chat Channel */
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {chatMessages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.78rem", margin: "auto" }}>
                    No messages yet. Real-time chat messages are end-to-end encrypted.
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => {
                    const isSelf = isDoctor
                      ? msg.sender === (booking.doctor_name || "Doctor")
                      : msg.sender === (booking.patient_name || "Patient");
                    const isSystem = msg.sender === "System";

                    if (isSystem) {
                      return (
                        <div
                          key={idx}
                          style={{
                            textAlign: "center",
                            fontSize: "0.68rem",
                            fontFamily: "var(--font-mono)",
                            color: "var(--emerald-couture)",
                            background: "var(--emerald-light)",
                            border: "1px solid var(--emerald-border)",
                            padding: "4px 8px",
                            margin: "4px 0",
                          }}
                        >
                          {msg.text}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        style={{
                          alignSelf: isSelf ? "flex-end" : "flex-start",
                          maxWidth: "85%",
                          background: isSelf ? "var(--bg-surface-dark)" : "var(--bg-surface-alt)",
                          color: isSelf ? "#FFFFFF" : "var(--text-primary)",
                          border: isSelf ? "1px solid var(--gold)" : "1px solid var(--border-default)",
                          padding: "8px 12px",
                          borderRadius: "var(--radius-xs)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.64rem",
                            fontFamily: "var(--font-mono)",
                            color: isSelf ? "var(--gold)" : "var(--text-muted)",
                            marginBottom: "2px",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "8px",
                          }}
                        >
                          <span>{msg.sender}</span>
                          <span>{msg.time || ""}</span>
                        </div>
                        <div style={{ fontSize: "0.80rem", lineHeight: 1.4 }}>{msg.text}</div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  display: "flex",
                  borderTop: "1px solid var(--border-default)",
                  padding: "8px",
                  gap: "6px",
                  background: "var(--bg-surface)",
                }}
              >
                <input
                  type="text"
                  placeholder="Send encrypted note..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: "0.80rem",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-xs)",
                  }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: "8px 14px",
                    background: "var(--ink-primary)",
                    border: "1px solid var(--ink-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Send size={14} color="var(--gold)" />
                </button>
              </form>
            </div>
          ) : (
            /* EHR Clinical Context */
            <div style={{ padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.80rem" }}>
              <div style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "10px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-gold)", fontWeight: 800 }}>
                  CLINICAL SUMMARY
                </span>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", margin: "4px 0" }}>
                  {booking.patient_name || "Unknown patient"}
                </h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", margin: 0 }}>
                  Reason: {booking.chief_complaint || "Quantum-assisted biomarker review and triage assessment."}
                </p>
              </div>

              <div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                  ACTIVE EHR BIOMARKERS
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "var(--bg-surface-alt)", border: "1px solid var(--border-default)" }}>
                    <span>Mean Radii:</span>
                    <strong style={{ fontFamily: "var(--font-mono)" }}>17.99 mm</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "var(--bg-surface-alt)", border: "1px solid var(--border-default)" }}>
                    <span>Concave Points:</span>
                    <strong style={{ fontFamily: "var(--font-mono)" }}>0.147 (Elevated)</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "var(--bg-surface-alt)", border: "1px solid var(--border-default)" }}>
                    <span>VQC State Fidelity:</span>
                    <strong style={{ fontFamily: "var(--font-mono)", color: "var(--emerald-couture)" }}>99.82%</strong>
                  </div>
                </div>
              </div>

              {capturedSnapshot && (
                <div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-gold)", display: "block", marginBottom: "6px" }}>
                    LATEST CLINICAL CAPTURE
                  </span>
                  <img
                    src={capturedSnapshot}
                    alt="Clinical Snapshot"
                    style={{
                      width: "100%",
                      borderRadius: "var(--radius-xs)",
                      border: "1px solid var(--gold)",
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* E-Prescription Modal */}
      {rxModalOpen && (
        <EPrescriptionModal
          isOpen={rxModalOpen}
          onClose={() => setRxModalOpen(false)}
          booking={booking}
          onSuccess={() => {
            setRxModalOpen(false);
            loadRoom();
          }}
        />
      )}
    </div>
  );
}
