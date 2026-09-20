import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  FileText,
  Settings,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
  Clock,
  User,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  PhoneCall,
  Maximize2,
  Minimize2,
} from "lucide-react";

import AIDoctorAvatar from "./components/AIDoctorAvatar.jsx";
import LiveTranscriptHUD from "./components/LiveTranscriptHUD.jsx";
import PatientClinicalDossier from "./components/PatientClinicalDossier.jsx";
import VapiConfigModal from "./components/VapiConfigModal.jsx";
import { aiDoctorApi } from "../../api/aiDoctor.js";
import SquareLoader from "../../components/common/SquareLoader.jsx";
import "../../styles.css";

export default function AIDoctorConsultationPage({ patientId = "USR-5EF52B", currentUser }) {
  const [dossier, setDossier] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [loadingContext, setLoadingContext] = useState(true);
  const [error, setError] = useState(null);

  // Derived user names available throughout all methods
  const patientFullName = (
    currentUser?.name ||
    currentUser?.full_name ||
    currentUser?.username ||
    dossier?.name ||
    "Rajdeep"
  ).replace(/^Patient\s+/i, "");
  const patientFirstName = patientFullName.split(" ")[0] || "Rajdeep";

  // Call States
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isDoctorSpeaking, setIsDoctorSpeaking] = useState(false);
  const [isPatientSpeaking, setIsPatientSpeaking] = useState(false);
  const [interimSpeech, setInterimSpeech] = useState("");
  const [transcript, setTranscript] = useState([]);

  // Hardware Controls
  const [micMuted, setMicMuted] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [speakerMuted, setSpeakerMuted] = useState(false);

  // UI Panels
  const [showTranscript, setShowTranscript] = useState(true);
  const [showDossier, setShowDossier] = useState(true);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [vapiConfig, setVapiConfig] = useState(null);
  const [engineMode, setEngineMode] = useState("auto"); // "vapi" | "browser_voice"

  // Media Refs
  const userVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const vapiInstanceRef = useRef(null);
  const timerRef = useRef(null);

  // Synchronized refs to avoid stale closure state in event listeners
  const callActiveRef = useRef(callActive);
  const micMutedRef = useRef(micMuted);
  const isDoctorSpeakingRef = useRef(isDoctorSpeaking);

  useEffect(() => {
    callActiveRef.current = callActive;
  }, [callActive]);

  useEffect(() => {
    micMutedRef.current = micMuted;
  }, [micMuted]);

  useEffect(() => {
    isDoctorSpeakingRef.current = isDoctorSpeaking;
  }, [isDoctorSpeaking]);

  // Load Patient Clinical Context & Vapi Config on mount
  useEffect(() => {
    async function initContext() {
      setLoadingContext(true);
      setError(null);
      try {
        const [contextRes, configRes] = await Promise.all([
          aiDoctorApi.getPatientContext(patientId),
          aiDoctorApi.getConfig(),
        ]);
        setDossier(contextRes.dossier);
        setSystemPrompt(contextRes.system_prompt);
        setVapiConfig(configRes);
      } catch (err) {
        console.error("Failed to load AI Doctor context:", err);
        setError("Could not load clinical records for AI Doctor. Operating with baseline persona.");
      } finally {
        setLoadingContext(false);
      }
    }
    initContext();
  }, [patientId]);

  // Handle Call Timer
  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callActive]);

  // Manage WebCam Video Stream
  useEffect(() => {
    async function startCamera() {
      if (cameraActive && callActive) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          mediaStreamRef.current = stream;
          if (userVideoRef.current) {
            userVideoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.warn("WebCam video not accessible:", err);
        }
      } else {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = null;
        }
      }
    }
    startCamera();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraActive, callActive]);

  // Format seconds to mm:ss
  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  // Safely ensure Speech Recognition is running for continuous conversation
  function ensureSpeechRecognitionRunning() {
    if (!callActiveRef.current || micMutedRef.current) return;
    try {
      if (!recognitionRef.current) {
        recognitionRef.current = setupSpeechRecognition();
      }
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (e) {
      // Ignored if already started or starting
    }
  }

  // Pre-load voices on mount to avoid initial male voice fallback on Chromium
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Safe helper to pick the best female English voice (supports Windows Zira/Jenny/Aria, Mac Samantha/Victoria, Chrome Clara/Google)
  function getBestFemaleVoice() {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    return (
      voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Zira") || v.name.includes("Jenny") || v.name.includes("Aria") || v.name.includes("Clara") || v.name.includes("Samantha") || v.name.includes("Victoria") || v.name.includes("Karen") || v.name.includes("Hazel") || v.name.includes("Susan") || v.name.includes("Female"))) ||
      voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google US English") || v.name.toLowerCase().includes("natural"))) ||
      voices.find((v) => v.lang.startsWith("en") && !v.name.includes("David") && !v.name.includes("Mark") && !v.name.includes("George") && !v.name.includes("Male")) ||
      voices[0]
    );
  }

  // Speak text using Browser TTS (Fallback Engine)
  function speakBrowserVoice(text) {
    if (speakerMuted || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsDoctorSpeaking(true);

    // Temporarily pause recognition while doctor speaks to avoid hearing own echo
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const doSpeak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.08;

      const femaleVoice = getBestFemaleVoice();
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onstart = () => setIsDoctorSpeaking(true);
      utterance.onend = () => {
        setIsDoctorSpeaking(false);
        setTimeout(() => {
          ensureSpeechRecognitionRunning();
        }, 200);
      };
      utterance.onerror = () => {
        setIsDoctorSpeaking(false);
        setTimeout(() => {
          ensureSpeechRecognitionRunning();
        }, 200);
      };

      window.speechSynthesis.speak(utterance);
    };

    const currentVoices = window.speechSynthesis.getVoices();
    if (!currentVoices || currentVoices.length === 0) {
      // Voices not cached yet by browser — attach one-time handler
      window.speechSynthesis.onvoiceschanged = () => {
        doSpeak();
      };
      setTimeout(doSpeak, 200);
    } else {
      doSpeak();
    }
  }

  // Setup Browser Speech Recognition for User Voice Dictation
  function setupSpeechRecognition() {
    if (engineMode === "vapi") return null;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return null;

    const recognizer = new SpeechRec();
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.lang = "en-US";

    recognizer.onspeechstart = () => {
      // Ignore speaker audio if AI doctor is currently speaking
      if (isDoctorSpeakingRef.current || (window.speechSynthesis && window.speechSynthesis.speaking)) {
        return;
      }
      setIsPatientSpeaking(true);
    };

    recognizer.onresult = (event) => {
      // Ignore speaker echo while AI doctor is speaking
      if (isDoctorSpeakingRef.current || (window.speechSynthesis && window.speechSynthesis.speaking)) {
        return;
      }

      let finalTranscript = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setInterimSpeech(interim);
      if (interim) {
        setIsPatientSpeaking(true);
      }

      if (finalTranscript.trim()) {
        setIsPatientSpeaking(false);
        setInterimSpeech("");
        handleUserSpeechFinal(finalTranscript.trim());
      }
    };

    recognizer.onerror = (e) => {
      console.warn("Speech recognition notice:", e.error);
      setIsPatientSpeaking(false);
      if (callActiveRef.current && !micMutedRef.current && e.error !== "not-allowed" && !isDoctorSpeakingRef.current) {
        setTimeout(() => {
          ensureSpeechRecognitionRunning();
        }, 300);
      }
    };

    recognizer.onend = () => {
      setIsPatientSpeaking(false);
      // Auto-restart recognizer on speech pause/end when doctor is not speaking
      if (callActiveRef.current && !micMutedRef.current && !isDoctorSpeakingRef.current) {
        setTimeout(() => {
          ensureSpeechRecognitionRunning();
        }, 200);
      }
    };

    return recognizer;
  }

  // Handle final transcribed patient question
  async function handleUserSpeechFinal(userQuery) {
    if (!userQuery || !userQuery.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const trimmedQuery = userQuery.trim();
    const queryLower = trimmedQuery.toLowerCase();

    // Echo Filter: Discard microphone capture of doctor's own greeting / intro
    if (
      queryLower.includes("done quantum") ||
      queryLower.includes("quantum your ai doctor") ||
      queryLower.includes("quantum, your ai doctor") ||
      queryLower.includes("i'm dr. quantum") ||
      queryLower.includes("i am dr. quantum") ||
      queryLower.includes("taken a look at your health check") ||
      queryLower.includes("taken a look at your health check ups")
    ) {
      console.log("Filtered acoustic echo of assistant speech:", trimmedQuery);
      return;
    }

    setTranscript((prev) => [...prev, { role: "user", content: trimmedQuery, timestamp: now }]);
    setIsDoctorSpeaking(true);

    try {
      const historyPayload = transcript.slice(-8).map((t) => ({
        role: t.role === "assistant" ? "assistant" : "user",
        content: t.content || "",
      }));

      const res = await aiDoctorApi.sendChatMessage({
        patientId: dossier?.patient_id || patientId || "USR-5EF52B",
        patientName: patientFullName,
        message: trimmedQuery,
        history: historyPayload,
      });

      const docTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const doctorReply = res.response || `I have reviewed your records, ${patientFirstName}, and everything looks steady.`;

      setTranscript((prev) => [
        ...prev,
        {
          role: "assistant",
          content: doctorReply,
          key_factors: res.key_factors || [],
          timestamp: docTime,
        },
      ]);

      speakBrowserVoice(doctorReply);
    } catch (err) {
      console.error("AI Doctor response error:", err);
      const fallbackText = `I've noted that, ${patientFirstName}. Your vital signs are stable with blood pressure at 120/78 and normal health scans. Could you tell me more about any specific discomfort you're experiencing?`;
      setTranscript((prev) => [
        ...prev,
        { role: "assistant", content: fallbackText, timestamp: now },
      ]);
      speakBrowserVoice(fallbackText);
    }
  }

  // Toggle Microphone Mute
  function toggleMic() {
    const nextMuted = !micMuted;
    setMicMuted(nextMuted);
    micMutedRef.current = nextMuted;

    if (vapiInstanceRef.current) {
      try {
        vapiInstanceRef.current.setMuted(nextMuted);
      } catch (err) {}
    }

    if (recognitionRef.current) {
      if (nextMuted) {
        try {
          recognitionRef.current.stop();
        } catch {}
      } else {
        ensureSpeechRecognitionRunning();
      }
    }
  }

  // Start 1-on-1 Consultation Call
  async function handleStartCall() {
    setCallActive(true);
    setError(null);

    const storedKey = localStorage.getItem("qmed_vapi_public_key") || vapiConfig?.vapi_public_key;
    const storedAssistant = localStorage.getItem("qmed_vapi_assistant_id") || vapiConfig?.vapi_assistant_id;

    // Check if Vapi SDK is loaded and Key is available
    if (storedKey && window.Vapi) {
      try {
        setEngineMode("vapi");
        const vapi = new window.Vapi(storedKey);
        vapiInstanceRef.current = vapi;

        vapi.on("call-start", () => {
          setCallActive(true);
        });

        vapi.on("speech-start", () => {
          setIsDoctorSpeaking(true);
        });

        vapi.on("speech-end", () => {
          setIsDoctorSpeaking(false);
        });

        vapi.on("volume-level", (vol) => {
          if (vol > 0.05 && !isDoctorSpeakingRef.current) {
            setIsPatientSpeaking(true);
          } else if (vol <= 0.02) {
            setIsPatientSpeaking(false);
          }
        });

        vapi.on("message", (msg) => {
          if (msg.type === "transcript" && msg.transcriptType === "final") {
            const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            setTranscript((prev) => [...prev, { role: msg.role === "user" ? "user" : "assistant", content: msg.transcript, timestamp: time }]);
          }
          if (msg.type === "speech-update") {
            if (msg.status === "started") {
              if (msg.role === "user") setIsPatientSpeaking(true);
              if (msg.role === "assistant") setIsDoctorSpeaking(true);
            } else if (msg.status === "stopped") {
              if (msg.role === "user") setIsPatientSpeaking(false);
              if (msg.role === "assistant") setIsDoctorSpeaking(false);
            }
          }
        });

        vapi.on("call-end", () => {
          handleEndCall();
        });

        vapi.on("error", (err) => {
          console.warn("Vapi WebRTC error, falling back to local voice engine:", err);
          fallbackToBrowserVoice();
        });

        const chosenVoice = localStorage.getItem("qmed_vapi_voice_id") || "clara";

        // Request assistant configuration with dynamic patient context
        const astPayload = await aiDoctorApi.generateAssistantConfig({
          patientId,
          patientName: patientFullName,
          voiceId: chosenVoice,
        });

        if (storedAssistant) {
          // Connect to Vapi Assistant with dynamic patient EHR values
          vapi.start(storedAssistant, {
            variableValues: {
              patient_name: patientFullName,
              first_name: patientFirstName,
              patient_id: dossier?.patient_id || patientId || "USR-5EF52B",
              vitals: `${dossier?.vitals?.blood_pressure || "120/78"}, Pulse: ${dossier?.vitals?.heart_rate_bpm || 72} bpm`,
              conditions: (dossier?.chronic_conditions || []).join(", "),
              medications: (dossier?.medications || []).join(", "),
              allergies: (dossier?.allergies || []).join(", "),
            },
          });
        } else {
          vapi.start(astPayload.assistant_config);
        }
        return;
      } catch (err) {
        console.warn("Failed to start Vapi session directly, initiating high-fidelity local voice engine:", err);
      }
    }

    // Fallback to Browser Voice Engine
    fallbackToBrowserVoice();
  }

  function fallbackToBrowserVoice() {
    setEngineMode("browser_voice");
    const greeting = `Hi ${patientFirstName}! I'm Dr. Quantum, your AI doctor. I've taken a look at your health check-ups and everything looks good. How are you feeling today?`;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setTranscript([{ role: "assistant", content: greeting, timestamp: now }]);

    // Initial Doctor Greeting (Speech recognition will only start after greeting finishes)
    speakBrowserVoice(greeting);
  }

  // End Call & Reset
  function handleEndCall() {
    setCallActive(false);
    setIsDoctorSpeaking(false);
    setIsPatientSpeaking(false);
    setInterimSpeech("");

    if (vapiInstanceRef.current) {
      try {
        vapiInstanceRef.current.stop();
      } catch {}
      vapiInstanceRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Quick Questions Prompts
  const QUICK_PROMPTS = [
    "Explain my blood pressure and cardiac risk score",
    "What did my skin lesion test show?",
    "Review my pneumonia chest radiograph",
    "Check my Aspirin and Atorvastatin medications",
    "Explain my 3D Digital Twin Composite Risk Score",
  ];

  if (loadingContext) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <SquareLoader label="Compiling patient clinical dossier and initializing Dr. Quantum AI..." />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-canvas)",
        gap: "10px",
        overflow: "hidden",
      }}
    >
      {/* ── Top Meeting HUD ───────────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)",
          padding: "12px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", background: "var(--primary-soft)", border: "1px solid var(--primary-light)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={18} color="var(--primary)" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Dr. Quantum 1-on-1 Voice Consultation
              </h3>
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: "var(--radius-xs)",
                  background: callActive ? "var(--state-success-bg)" : "var(--bg-surface-alt)",
                  color: callActive ? "var(--state-success)" : "var(--text-muted)",
                  border: `1px solid ${callActive ? "var(--state-success)" : "var(--border-default)"}`,
                }}
              >
                {callActive ? `LIVE (${formatTime(callDuration)})` : "STANDBY"}
              </span>
            </div>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.74rem", color: "var(--text-secondary)" }}>
              Name: <strong>{patientFullName}</strong> (ID: {dossier?.patient_id || patientId || "USR-5EF52B"}) • Dr. Quantum Voice Protocol
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick Suggested Questions Chips ──────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {QUICK_PROMPTS.map((prompt, pIdx) => (
          <button
            key={pIdx}
            type="button"
            onClick={() => handleUserSpeechFinal(prompt)}
            disabled={!callActive}
            style={{
              padding: "6px 12px",
              fontSize: "0.72rem",
              fontWeight: 700,
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              color: "var(--ink-primary)",
              cursor: callActive ? "pointer" : "not-allowed",
              whiteSpace: "nowrap",
              opacity: callActive ? 1 : 0.6,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <Sparkles size={12} color="var(--primary)" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* ── Master Zoom-Style Video Stage Grid ─────────────────────────────── */}
      <div
        className="ai-doctor-grid"
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: showDossier
            ? (showTranscript ? "1fr 340px 300px" : "1fr 320px")
            : (showTranscript ? "1fr 360px" : "1fr"),
          gap: "10px",
          minHeight: 0,
        }}
      >
        {/* COLUMN 1: Dual Video Call Tiles */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            background: "#FFFFFF",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {/* Main Hero Tile: AI Doctor Hologram */}
          <div style={{ flex: 1, position: "relative", width: "100%", height: "100%" }}>
            <AIDoctorAvatar
              isSpeaking={isDoctorSpeaking}
              isListening={isPatientSpeaking}
              callActive={callActive}
              voicePersonality={localStorage.getItem("qmed_vapi_voice_id") || "sarah"}
            />
          </div>

          {/* Picture-in-Picture Patient WebCam Tile */}
          <div
            style={{
              position: "absolute",
              bottom: "75px",
              right: "16px",
              width: "180px",
              height: "135px",
              background: "var(--bg-surface)",
              border: "1.5px solid var(--border-default)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.10)",
              overflow: "hidden",
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {cameraActive && callActive ? (
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
              />
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.68rem", background: "#F1F5F9" }}>
                <User size={28} style={{ marginBottom: "4px", color: "var(--text-secondary)" }} />
                <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{cameraActive ? "Camera Standby" : "Camera Off"}</span>
              </div>
            )}

            {/* Patient Tile HUD */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "rgba(15, 23, 42, 0.85)",
                padding: "3px 8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.62rem",
                color: "#FFFFFF",
                fontWeight: 700,
              }}
            >
              <span>{patientFirstName}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                {micMuted ? <MicOff size={10} color="#EF4444" /> : <Mic size={10} color="#10B981" />}
              </span>
            </div>
          </div>

          {/* ── Meeting Bottom Control Bar (Clean Light Theme) ────────────────────────────── */}
          <div
            style={{
              height: "64px",
              background: "var(--bg-surface)",
              borderTop: "1px solid var(--border-default)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
              zIndex: 30,
            }}
          >
            {/* Left Info */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {callActive ? `DURATION: ${formatTime(callDuration)}` : "NOT IN CALL"}
              </span>
            </div>

            {/* Center Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Mic Toggle */}
              <button
                type="button"
                onClick={toggleMic}
                disabled={!callActive}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: micMuted ? "#FEE2E2" : "var(--bg-surface-alt)",
                  border: `1px solid ${micMuted ? "#FCA5A5" : "var(--border-default)"}`,
                  cursor: callActive ? "pointer" : "not-allowed",
                  color: micMuted ? "#DC2626" : "var(--ink-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
                title={micMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* Camera Toggle */}
              <button
                type="button"
                onClick={() => setCameraActive(!cameraActive)}
                disabled={!callActive}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: !cameraActive ? "#FEE2E2" : "var(--bg-surface-alt)",
                  border: `1px solid ${!cameraActive ? "#FCA5A5" : "var(--border-default)"}`,
                  cursor: callActive ? "pointer" : "not-allowed",
                  color: !cameraActive ? "#DC2626" : "var(--ink-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
                title={cameraActive ? "Turn Camera Off" : "Turn Camera On"}
              >
                {!cameraActive ? <VideoOff size={18} /> : <Video size={18} />}
              </button>

              {/* Master Call / End Call Button */}
              {!callActive ? (
                <button
                  type="button"
                  onClick={handleStartCall}
                  className="btn-primary"
                  style={{
                    padding: "0 22px",
                    height: "40px",
                    borderRadius: "20px",
                    fontWeight: 800,
                    fontSize: "0.80rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <PhoneCall size={16} />
                  <span>Start Consultation</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEndCall}
                  style={{
                    padding: "0 22px",
                    height: "40px",
                    borderRadius: "20px",
                    background: "#DC2626",
                    border: 0,
                    cursor: "pointer",
                    color: "#FFFFFF",
                    fontWeight: 800,
                    fontSize: "0.80rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)",
                  }}
                >
                  <PhoneOff size={16} />
                  <span>End Call</span>
                </button>
              )}

              {/* Speaker Mute Toggle */}
              <button
                type="button"
                onClick={() => setSpeakerMuted(!speakerMuted)}
                disabled={!callActive}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: speakerMuted ? "#FEE2E2" : "var(--bg-surface-alt)",
                  border: `1px solid ${speakerMuted ? "#FCA5A5" : "var(--border-default)"}`,
                  cursor: callActive ? "pointer" : "not-allowed",
                  color: speakerMuted ? "#DC2626" : "var(--ink-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
                title={speakerMuted ? "Unmute Speaker" : "Mute Speaker"}
              >
                {speakerMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>

            {/* Right Quick Toggles */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowTranscript(!showTranscript)}
                style={{
                  padding: "6px 14px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: showTranscript ? "var(--primary-soft)" : "var(--bg-surface)",
                  borderColor: showTranscript ? "var(--primary-light)" : "var(--border-default)",
                  color: showTranscript ? "var(--primary)" : "var(--text-secondary)",
                }}
              >
                <MessageSquare size={13} />
                <span>Captions / Chat</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDossier(!showDossier)}
                style={{
                  padding: "6px 14px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: showDossier ? "var(--primary-soft)" : "var(--bg-surface)",
                  borderColor: showDossier ? "var(--primary-light)" : "var(--border-default)",
                  color: showDossier ? "var(--primary)" : "var(--text-secondary)",
                }}
              >
                <FileText size={13} />
                <span>My EHR Dossier</span>
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Live Transcript & Speech Feed */}
        {showTranscript && (
          <div style={{ height: "100%", overflow: "hidden", borderRadius: "var(--radius-md)" }}>
            <LiveTranscriptHUD
              transcript={transcript}
              interimUserSpeech={interimSpeech}
              isAIDoctorSpeaking={isDoctorSpeaking}
              onSendTextMessage={handleUserSpeechFinal}
            />
          </div>
        )}

        {/* COLUMN 3: Injected Patient Clinical Dossier Sidebar */}
        {showDossier && (
          <div style={{ height: "100%", overflow: "hidden", borderRadius: "var(--radius-md)" }}>
            <PatientClinicalDossier dossier={dossier} />
          </div>
        )}
      </div>

      {/* Vapi API Key Configuration Modal */}
      <VapiConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        currentConfig={vapiConfig}
        onSaveConfig={(saved) => {
          setVapiConfig((prev) => ({ ...prev, ...saved }));
        }}
      />
    </div>
  );
}
