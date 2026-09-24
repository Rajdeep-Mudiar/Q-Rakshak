import React, { useRef, useEffect, useState } from 'react';
import TopNavbar from './panels/TopNavbar';
import LeftSidebar from './panels/LeftSidebar';
import RightSidebar from './panels/RightSidebar';
import BottomBar from './panels/BottomBar';
import DigitalTwinViewer from './components/DigitalTwinViewer';
import TimelineProgressionGraph from './components/TimelineProgressionGraph';
import ErrorBoundary from './components/ErrorBoundary';
import { useTwinStore } from './store/twinStore';
import { clinicalApi } from '../../api/clinical';
import { authApi } from '../../api/auth';
import {
  X, GitCompare, Clock, Download, Printer, ShieldCheck,
  CheckCircle2, AlertTriangle, Activity, User, FileText, ArrowRight, RefreshCw
} from 'lucide-react';
import './digitalTwin.css';
import { useLanguage } from '../../context/LanguageContext';

export default function DigitalTwin3DPage({ patientId, result, onExportReport }) {
  const { t } = useLanguage();
  const canvasRef = useRef();
  const loadPatientFromDB = useTwinStore((s) => s.loadPatientFromDB);
  const currentPatient = useTwinStore((s) => s.patient);
  const involvementMap = useTwinStore((s) => s.involvementMap);
  const setInvolvement = useTwinStore((s) => s.setInvolvement);
  const setPatientAnalysis = useTwinStore((s) => s.setPatientAnalysis);
  const isComparisonOpen = useTwinStore((s) => s.isComparisonOpen);
  const setComparisonOpen = useTwinStore((s) => s.setComparisonOpen);
  const isTimelineOpen = useTwinStore((s) => s.isTimelineOpen);
  const setTimelineOpen = useTwinStore((s) => s.setTimelineOpen);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [timelineMonth, setTimelineMonth] = useState(6); // 0, 3, 6, 12
  const [timelineData, setTimelineData] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  const storedUser = authApi.getStoredUser();
  const activePid = patientId || currentPatient.patientId || storedUser?.patient_id || storedUser?.user_id || storedUser?.id || '';

  // Synchronize incoming diagnosis result into digital twin store
  useEffect(() => {
    if (result && activePid) {
      setPatientAnalysis(result, activePid);
    }
  }, [result, activePid, setPatientAnalysis]);

  // Load timeline data when modal is open or patient changes
  useEffect(() => {
    if (isTimelineOpen && activePid) {
      loadTimeline();
    }
  }, [isTimelineOpen, activePid]);

  const loadTimeline = async () => {
    setTimelineLoading(true);
    try {
      const res = await clinicalApi.getPatientTimeline(activePid);
      if (res?.timeline) {
        setTimelineData(res.timeline);
      }
    } catch (err) {
      console.error('Failed to load patient timeline:', err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleSelectMilestone = (milestone) => {
    setSelectedMilestone(milestone);
    const riskFactor = (milestone.projected_risk || 50) / 100;
    // Dynamically adjust 3D organ involvement
    Object.keys(involvementMap).forEach((organId) => {
      const baseVal = involvementMap[organId];
      if (baseVal > 0) {
        setInvolvement(organId, Math.min(100, Math.round(baseVal * (riskFactor / 0.7))));
      }
    });
  };

  // Auto-load patient when patientId is passed in from parent
  useEffect(() => {
    if (!patientId) return;
    if (currentPatient.patientId !== patientId) {
      loadPatientFromDB(patientId);
    }
  }, [patientId, currentPatient.patientId, loadPatientFromDB]);

  // Handle timeline scrub
  const handleTimelineScrub = (m) => {
    setTimelineMonth(m);
    // Adjust organ involvement dynamically according to simulated timeline
    const factor = m === 0 ? 0.4 : m === 3 ? 0.7 : m === 6 ? 1.0 : 0.25;
    Object.keys(involvementMap).forEach((organId) => {
      const baseVal = involvementMap[organId];
      if (baseVal > 0) {
        setInvolvement(organId, Math.min(100, Math.round(baseVal * factor)));
      }
    });
  };

  const handleExportClick = () => {
    if (onExportReport) {
      onExportReport();
    } else {
      setReportModalOpen(true);
    }
  };

  const affectedOrgans = Object.entries(involvementMap)
    .filter(([_, val]) => val > 0)
    .map(([organ, val]) => ({
      name: organ.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
      involvement: val
    }));

  return (
    <ErrorBoundary>
      <div className="dt-workspace">
        {/* Top Controls & Navigation */}
        <TopNavbar canvasRef={canvasRef} onExportReport={handleExportClick} />

        {/* 3-Column Studio Layout */}
        <div className="dt-main-grid">
          {/* Left: Patient Details + Clinical Inputs + Disease Controls */}
          <ErrorBoundary title="Patient & Disease Controls" message="An issue occurred in the left control panel. Click retry to recover." compact>
            <LeftSidebar />
          </ErrorBoundary>

          {/* Center: 3D WebGL Anatomical Viewer */}
          <main className="dt-center-viewer">
            <ErrorBoundary title="3D Viewport" message="The WebGL canvas encountered a rendering transition. Click below to restore the viewport.">
              <DigitalTwinViewer canvasRef={canvasRef} />
            </ErrorBoundary>
          </main>

          {/* Right: Anatomy Inspector & Risk Metrics */}
          <ErrorBoundary title="Anatomy Inspector" message="An issue occurred in the anatomy inspector. Click retry to recover." compact>
            <RightSidebar />
          </ErrorBoundary>
        </div>

        {/* Bottom: health summary and severity legend */}
        <ErrorBoundary title="Health summary" message="The health summary could not be loaded." compact>
          <BottomBar />
        </ErrorBoundary>

        {/* ── MODAL: DISEASE TIMELINE & 90% THRESHOLD PROJECTION ── */}
        {isTimelineOpen && (
          <div className="modal-overlay" onClick={() => setTimelineOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px", maxHeight: "90vh", overflowY: "auto", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--border-default)", paddingBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={18} color="#D97706" />
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--ink-primary)", margin: 0 }}>
                    Longitudinal Trajectory &amp; 90% Early Detection Timeline
                  </h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={loadTimeline}
                    title="Refresh health timeline"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", padding: "4px" }}
                  >
                    <RefreshCw size={15} className={timelineLoading ? "spin" : ""} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimelineOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Interactive Timeline Graph with 90% Threshold & Early Warning */}
              <TimelineProgressionGraph
                timelineData={timelineData}
                loading={timelineLoading}
                onRefresh={loadTimeline}
                onSelectMilestone={handleSelectMilestone}
                selectedMilestone={selectedMilestone}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px", paddingTop: "12px", borderTop: "1px solid var(--border-default)" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Patient: <strong style={{ color: "var(--ink-primary)" }}>{activePid}</strong> • Updated
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setTimelineOpen(false)}
                  style={{ fontSize: "0.76rem" }}
                >
                  Close Timeline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 3: EXPORT CLINICAL REPORT ── */}
        {reportModalOpen && (
          <div className="modal-overlay" onClick={() => setReportModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--border-default)", paddingBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileText size={18} color="var(--accent-blue)" />
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--ink-primary)", margin: 0 }}>
                    3D Digital Twin Clinical Report
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ background: "#FFFFFF", border: "1px solid var(--border-default)", borderRadius: "var(--radius-xs)", padding: "16px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-default)", paddingBottom: "8px", marginBottom: "10px" }}>
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0, color: "var(--ink-primary)" }}>
                      {currentPatient.firstName || currentPatient.name || 'Patient'} {currentPatient.lastName || ''}
                    </h4>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                      ID: {currentPatient.patientId || activePid || '—'} • ABHA: {currentPatient.abhaId || '—'}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#059669", background: "#ECFDF5", padding: "3px 8px", borderRadius: "4px" }}>
                    Verified Digital Twin
                  </span>
                </div>

                <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
                  <strong>Affected Anatomical Structures:</strong>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px" }}>
                    {affectedOrgans.length > 0 ? (
                      affectedOrgans.map((org, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", background: "var(--bg-surface-alt)", padding: "6px 10px", borderRadius: "4px" }}>
                          <span>{org.name}</span>
                          <strong style={{ color: org.involvement > 50 ? "#DC2626" : "#D97706" }}>{org.involvement}% Involvement</strong>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: "var(--text-muted)" }}>All 25 organ systems nominal / within baseline.</div>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: "0.70rem", color: "var(--text-muted)" }}>
                  Clinical report export • Privacy-protected record
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setReportModalOpen(false)}
                  style={{ fontSize: "0.76rem" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => { window.print(); }}
                  style={{ fontSize: "0.76rem", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Printer size={14} /> Print Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
