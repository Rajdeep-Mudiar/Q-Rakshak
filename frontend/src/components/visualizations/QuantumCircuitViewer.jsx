import { useState, useEffect, useRef } from "react";
import { Cpu, Layers, Zap, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { quantumTelemetryApi } from "../../api/quantumTelemetry";
import { animateEntrance } from "../../utils/motion";
import { useLanguage } from "../../context/LanguageContext";

export default function QuantumCircuitViewer({ modelName = "VQC-8Q" }) {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const [telemetry, setTelemetry] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    quantumTelemetryApi.getCircuit(modelName)
      .then((data) => {
        setTelemetry(data);
        if (containerRef.current) {
          animateEntrance(containerRef.current, { y: 10, duration: 0.3 });
        }
      })
      .catch(() => {});
  }, [modelName]);

  const registers = telemetry?.qubit_registers || [
    { wire: 0, state: "|q_0⟩", initial: "|0⟩", observable: "⟨Z_0⟩" },
    { wire: 1, state: "|q_1⟩", initial: "|0⟩", observable: "⟨Z_1⟩" },
    { wire: 2, state: "|q_2⟩", initial: "|0⟩", observable: "⟨Z_2⟩" },
    { wire: 3, state: "|q_3⟩", initial: "|0⟩", observable: "⟨Z_3⟩" },
    { wire: 4, state: "|q_4⟩", initial: "|0⟩", observable: "⟨Z_4⟩" },
    { wire: 5, state: "|q_5⟩", initial: "|0⟩", observable: "⟨Z_5⟩" },
    { wire: 6, state: "|q_6⟩", initial: "|0⟩", observable: "⟨Z_6⟩" },
    { wire: 7, state: "|q_7⟩", initial: "|0⟩", observable: "⟨Z_7⟩" },
  ];

  return (
    <div ref={containerRef} style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-default)", borderLeft: "3px solid var(--primary)", borderRadius: "var(--radius-sm)", padding: "12px", marginTop: "auto" }}>
      {/* Header bar with toggle */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Cpu size={14} color="var(--primary)" />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ink-primary)", textTransform: "uppercase" }}>
            {t("quantum_circuit.title", `Quantum Circuit Architecture (${telemetry?.n_qubits || 8} Qubits)`, { qubits: telemetry?.n_qubits || 8 })}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            {t("quantum_circuit.depth", "Depth")}: {telemetry?.circuit_depth || 12} | {t("quantum_circuit.gates", "Gates")}: {telemetry?.total_gates || 144}
          </span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginTop: "8px" }}>
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-xs)", padding: "6px 8px" }}>
          <p style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 2px" }}>{t("quantum_circuit.depth", "Depth")}</p>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--primary)", margin: 0 }}>{telemetry?.circuit_depth || 12}</p>
        </div>
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-xs)", padding: "6px 8px" }}>
          <p style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase" }}>{t("quantum_circuit.gates", "Gates")}</p>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-teal)" }}>{telemetry?.total_gates || 144}</p>
        </div>
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "6px" }}>
          <p style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase" }}>{t("quantum_circuit.hilbert_dim", "Hilbert Dim")}</p>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-violet)" }}>{telemetry?.hilbert_space_dimension || 256}</p>
        </div>
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "6px" }}>
          <p style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase" }}>{t("quantum_circuit.entanglement", "Entanglement")}</p>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--risk-low)" }}>{t("quantum_circuit.circular", "Circular")}</p>
        </div>
      </div>

      {/* Expandable Wire Diagram */}
      {expanded && (
        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px", overflowX: "auto", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}>
          {registers.map((q) => (
            <div
              key={q.wire}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                minWidth: "460px",
                padding: "3px 6px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.72rem", width: "40px", color: "var(--primary)" }}>
                {q.state}
              </span>
              <span style={{ fontSize: "0.65rem", padding: "1px 4px", background: "var(--bg-canvas)", border: "1px solid var(--border-default)" }}>
                {q.initial}
              </span>
              <div style={{ flex: 1, height: "1px", background: "var(--border-default)", position: "relative", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
                <span style={{ fontSize: "0.62rem", background: "var(--primary-soft)", color: "var(--primary)", border: "1px solid rgba(30,64,175,0.3)", padding: "1px 4px", fontFamily: "var(--font-mono)" }}>
                  RY(x_{q.wire})
                </span>
                <span style={{ fontSize: "0.62rem", background: "var(--accent-teal-soft)", color: "var(--accent-teal)", border: "1px solid rgba(13,148,136,0.3)", padding: "1px 4px", fontFamily: "var(--font-mono)" }}>
                  Rot(θ_{q.wire})
                </span>
                <span style={{ fontSize: "0.62rem", background: "var(--accent-violet-soft)", color: "var(--accent-violet)", border: "1px solid rgba(109,40,217,0.3)", padding: "1px 4px", fontWeight: 700 }}>
                  ⊕ CNOT
                </span>
                <span style={{ fontSize: "0.62rem", background: "#F1F5F9", border: "1px solid var(--border-default)", padding: "1px 4px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                  M
                </span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", width: "40px", textAlign: "right" }}>
                {q.observable}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
