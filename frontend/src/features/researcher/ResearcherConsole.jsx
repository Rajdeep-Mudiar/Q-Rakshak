import { useState, useEffect, useRef } from "react";
import { Cpu, Play, RefreshCw, CheckCircle2, Zap, Sliders, Database, Layers, Terminal, Activity } from "lucide-react";
import { researcherApi } from "../../api/researcher";
import { animateEntrance, animateCardStagger } from "../../utils/motion";
import { useLanguage } from "../../context/LanguageContext";

export default function ResearcherConsole() {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const [dataset, setDataset] = useState("wdbc");
  const [modelArchitecture, setModelArchitecture] = useState("VQC");
  const [qubits, setQubits] = useState(8);
  const [layers, setLayers] = useState(3);
  const [epochs, setEpochs] = useState(5);
  const [lr, setLr] = useState(0.02);
  const [lossFunction, setLossFunction] = useState("Focal Loss");

  const [loading, setLoading] = useState(false);
  const [jobResult, setJobResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (containerRef.current) {
      animateEntrance(containerRef.current, { y: 15, duration: 0.35 });
      animateCardStagger(containerRef.current, ".card-panel");
    }
  }, []);

  async function handleTrain(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setJobResult(null);
    try {
      const data = await researcherApi.triggerRetraining({
        dataset,
        model_architecture: modelArchitecture,
        n_qubits: qubits,
        n_layers: layers,
        epochs,
        learning_rate: lr,
        loss_function: lossFunction,
      });
      setJobResult(data);
    } catch (err) {
      setError(err.message || "Model training failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
      {/* Retraining Form Controls */}
      <div className="card-panel" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)" }}>
        <div className="card-header">
          <span className="card-title">
            <Sliders size={16} color="var(--primary)" /> {t("researcher.title", "QML Retraining Studio & Hyperparameter Optimizer")}
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {t("researcher.badge", "PennyLane TorchLayer + Autograd")}
          </span>
        </div>

        <form onSubmit={handleTrain} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {/* Dataset selection */}
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                {t("researcher.target_dataset", "Target Dataset")}
              </label>
              <select
                value={dataset}
                onChange={(e) => setDataset(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.82rem", background: "var(--bg-surface)" }}
              >
                <option value="wdbc">{t("researcher.dataset_wdbc", "Wisconsin Breast Cancer (WDBC - 30 Features)")}</option>
                <option value="cleveland">{t("researcher.dataset_cleveland", "Cleveland Heart Disease (14 Features)")}</option>
                <option value="pima">{t("researcher.dataset_pima", "PIMA Indian Diabetes (8 Features)")}</option>
              </select>
            </div>

            {/* Architecture selection */}
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                {t("researcher.quantum_model_class", "Quantum Model Class")}
              </label>
              <select
                value={modelArchitecture}
                onChange={(e) => setModelArchitecture(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.82rem", background: "var(--bg-surface)" }}
              >
                <option value="VQC">{t("researcher.arch_vqc", "VQC (Strongly Entangling Layers)")}</option>
                <option value="QSVM">{t("researcher.arch_qsvm", "QSVM (Quantum Fidelity Kernel)")}</option>
                <option value="QNN">{t("researcher.arch_qnn", "QNN (Multi-Class Pauli-Z Head)")}</option>
              </select>
            </div>

            {/* Loss Function */}
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                {t("researcher.loss_function", "Loss Function")}
              </label>
              <select
                value={lossFunction}
                onChange={(e) => setLossFunction(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.82rem", background: "var(--bg-surface)" }}
              >
                <option value="Focal Loss">Focal Loss (gamma=2.0)</option>
                <option value="CrossEntropy">Categorical Cross-Entropy</option>
              </select>
            </div>
          </div>

          {/* Sliders for Hyperparameters */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", background: "var(--bg-canvas)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 700, marginBottom: "4px" }}>
                <span>{t("researcher.n_qubits", "Qubits")}</span>
                <span style={{ color: "var(--primary)", fontFamily: "var(--font-mono)" }}>{qubits} Q</span>
              </div>
              <input
                type="range"
                min="4"
                max="12"
                value={qubits}
                onChange={(e) => setQubits(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "var(--primary)", borderRadius: "var(--radius-sm)" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 700, marginBottom: "4px" }}>
                <span>{t("researcher.n_layers", "Variational Layers")}</span>
                <span style={{ color: "var(--primary)", fontFamily: "var(--font-mono)" }}>{layers} L</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                value={layers}
                onChange={(e) => setLayers(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "var(--primary)", borderRadius: "var(--radius-sm)" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 700, marginBottom: "4px" }}>
                <span>{t("researcher.epochs", "Epochs")}</span>
                <span style={{ color: "var(--primary)", fontFamily: "var(--font-mono)" }}>{epochs} Ep</span>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                value={epochs}
                onChange={(e) => setEpochs(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "var(--primary)", borderRadius: "var(--radius-sm)" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 700, marginBottom: "4px" }}>
                <span>{t("researcher.learning_rate", "Learning Rate")}</span>
                <span style={{ color: "var(--primary)", fontFamily: "var(--font-mono)" }}>{lr}</span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.05"
                step="0.005"
                value={lr}
                onChange={(e) => setLr(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "var(--primary)", borderRadius: "var(--radius-sm)" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ borderRadius: "var(--radius-sm)" }}>
              {loading ? (
                <>
                  <RefreshCw size={14} className="spin" /> {t("researcher.retraining_in_progress", "Executing Quantum Training Pipeline...")}
                </>
              ) : (
                <>
                  <Play size={14} /> {t("researcher.start_retraining", "Run Live Retraining Experiment")}
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div style={{ marginTop: "12px", padding: "8px 12px", background: "var(--risk-high-bg)", color: "var(--risk-high)", border: "1px solid var(--risk-high)", borderRadius: "var(--radius-sm)", fontSize: "0.80rem" }}>
            {error}
          </div>
        )}
      </div>

      {/* Training Convergence & Results */}
      {jobResult && (
        <div className="card-panel" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)" }}>
          <div className="card-header">
            <span className="card-title">
              <CheckCircle2 size={16} color="var(--risk-low)" /> {t("researcher.training_completed", "Retraining Job Completed")}: {jobResult.job_id}
            </span>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--risk-low)", background: "var(--risk-low-bg)", padding: "2px 8px", border: "1px solid var(--risk-low)", borderRadius: "var(--radius-sm)" }}>
              Registered: {jobResult.registered_model_tag}
            </span>
          </div>

          <div className="kpi-grid" style={{ marginTop: "12px", marginBottom: "16px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            <div className="kpi-tile" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)" }}>
              <div>
                <p className="kpi-tile-label">{t("researcher.metric_val_acc", "Final Accuracy")}</p>
                <p className="kpi-tile-value" style={{ color: "var(--risk-low)" }}>{(jobResult.final_accuracy * 100).toFixed(1)}%</p>
                <p className="kpi-tile-sub">Convergence verified</p>
              </div>
              <CheckCircle2 size={22} color="var(--risk-low)" />
            </div>
            <div className="kpi-tile" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)" }}>
              <div>
                <p className="kpi-tile-label">Training Duration</p>
                <p className="kpi-tile-value">{jobResult.training_time_seconds}s</p>
                <p className="kpi-tile-sub">PennyLane Autograd</p>
              </div>
              <Cpu size={22} color="var(--primary)" />
            </div>
            <div className="kpi-tile" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)" }}>
              <div>
                <p className="kpi-tile-label">Circuit Parameters</p>
                <p className="kpi-tile-value">{qubits * layers * 3}</p>
                <p className="kpi-tile-sub">{qubits}Q × {layers}L × 3 Rot</p>
              </div>
              <Layers size={22} color="var(--accent-violet)" />
            </div>
          </div>

          {/* Epoch Progress Table */}
          <div className="data-table-wrap" style={{ border: "1px solid var(--border-default)" }}>
            <table className="clinical-data-table">
              <thead>
                <tr>
                  <th>{t("researcher.epochs", "Epoch")}</th>
                  <th>{t("researcher.metric_test_loss", "Loss")}</th>
                  <th>{t("researcher.metric_val_acc", "Training Accuracy")}</th>
                  <th>Optimization Gradient Step</th>
                </tr>
              </thead>
              <tbody>
                {jobResult.training_history?.map((h) => (
                  <tr key={h.epoch}>
                    <td><strong>Epoch {h.epoch}</strong></td>
                    <td><code>{h.loss.toFixed(4)}</code></td>
                    <td><strong style={{ color: "var(--primary)" }}>{(h.accuracy * 100).toFixed(1)}%</strong></td>
                    <td>Parameter-Shift / Adam (lr={lr})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
