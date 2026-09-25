import React, { useRef, useEffect } from "react";
import { User, Stethoscope, Copy, Check, MessageSquare, Sparkles } from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";

export default function LiveTranscriptHUD({
  transcript = [],
  interimUserSpeech = "",
  isAIDoctorSpeaking = false,
  onSendTextMessage,
}) {
  const { t } = useLanguage();
  const bottomRef = useRef(null);
  const [copiedIdx, setCopiedIdx] = React.useState(null);
  const [textInput, setTextInput] = React.useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, interimUserSpeech]);

  function handleCopy(text, idx) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!textInput.trim()) return;
    if (onSendTextMessage) {
      onSendTextMessage(textInput.trim());
    }
    setTextInput("");
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--border-default)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-surface-alt)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MessageSquare size={15} color="var(--primary)" />
          <h4 style={{ margin: 0, fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {t("ai_doctor.transcript_title", "Live Conversation Transcript & Captions")}
          </h4>
        </div>
        <span style={{ fontSize: "0.64rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {t("ai_doctor.turns_count", `${transcript.length} turns`, { count: transcript.length })}
        </span>
      </div>

      {/* Messages Feed */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {transcript.length === 0 && !interimUserSpeech && (
          <div
            style={{
              padding: "24px 12px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "0.76rem",
              margin: "auto",
            }}
          >
            <p style={{ margin: "0 0 6px 0", fontWeight: 600 }}>{t("ai_doctor.start_talking", "Start talking with Dr. Quantum")}</p>
            <p style={{ margin: 0, fontSize: "0.68rem" }}>
              {t("ai_doctor.transcript_hint", "Your voice conversation will be transcribed in real time right here.")}
            </p>
          </div>
        )}

        {transcript.map((item, idx) => {
          const isDoctor = item.role === "assistant" || item.role === "doctor";
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isDoctor ? "flex-start" : "flex-end",
                maxWidth: "100%",
              }}
            >
              {/* Speaker Label & Timestamp */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px",
                  fontSize: "0.66rem",
                  color: isDoctor ? "var(--primary)" : "var(--accent-teal)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                {isDoctor ? <Stethoscope size={12} /> : <User size={12} />}
                <span>{isDoctor ? t("ai_doctor.dr_quantum", "Dr. Quantum (AI)") : t("ai_doctor.you_patient", "You (Patient)")}</span>
                {item.timestamp && (
                  <span style={{ color: "var(--text-muted)", fontWeight: 400, fontFamily: "var(--font-mono)" }}>
                    • {item.timestamp}
                  </span>
                )}
              </div>

              {/* Message Bubble */}
              <div
                style={{
                  maxWidth: "92%",
                  padding: "10px 14px",
                  background: isDoctor ? "var(--bg-canvas)" : "var(--primary-soft)",
                  border: isDoctor ? "1px solid var(--border-default)" : "1px solid var(--primary-light)",
                  color: "var(--text-primary)",
                  fontSize: "0.82rem",
                  lineHeight: 1.5,
                  position: "relative",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div>{item.content}</div>

                {/* Key Clinical Factors Tag (if returned by AI) */}
                {item.key_factors && item.key_factors.length > 0 && (
                  <div style={{ marginTop: "8px", paddingTop: "6px", borderTop: "1px dashed var(--border-default)", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {item.key_factors.map((kf, kfIdx) => (
                      <span
                        key={kfIdx}
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          padding: "2px 6px",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-default)",
                          color: "var(--primary)",
                        }}
                      >
                        {kf}
                      </span>
                    ))}
                  </div>
                )}

                {/* Copy button */}
                <button
                  type="button"
                  onClick={() => handleCopy(item.content, idx)}
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: "2px",
                  }}
                  title="Copy message"
                >
                  {copiedIdx === idx ? <Check size={12} color="var(--risk-low)" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          );
        })}

        {/* Interim Speech (Live Voice Dictation from Patient) */}
        {interimUserSpeech && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ fontSize: "0.66rem", color: "var(--accent-teal)", fontWeight: 700, marginBottom: "4px" }}>
              {t("ai_doctor.you_speaking", "You (Speaking...)")}
            </div>
            <div
              style={{
                maxWidth: "90%",
                padding: "8px 12px",
                background: "rgba(15, 118, 110, 0.08)",
                border: "1px dashed var(--accent-teal)",
                color: "var(--text-primary)",
                fontSize: "0.80rem",
                fontStyle: "italic",
              }}
            >
              {interimUserSpeech}
            </div>
          </div>
        )}

        {/* AI Doctor Thinking Indicator */}
        {isAIDoctorSpeaking && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--gold)", fontSize: "0.72rem", padding: "4px 0" }}>
            <Sparkles size={14} className="spin" />
            <span style={{ fontWeight: 700 }}>{t("ai_doctor.dr_speaking", "Dr. Quantum is speaking...")}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Text Consultation Input Fallback */}
      <form
        onSubmit={handleFormSubmit}
        style={{
          display: "flex",
          borderTop: "1px solid var(--border-default)",
          padding: "8px",
          background: "var(--bg-surface-alt)",
          gap: "8px",
        }}
      >
        <input
          type="text"
          placeholder={t("ai_doctor.input_placeholder", "Ask Dr. Quantum a health question or type if microphone is muted...")}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: "0.80rem",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          className="btn-primary"
          style={{ padding: "8px 16px", fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase" }}
        >
          {t("ai_doctor.send_btn", "Send")}
        </button>
      </form>
    </div>
  );
}
