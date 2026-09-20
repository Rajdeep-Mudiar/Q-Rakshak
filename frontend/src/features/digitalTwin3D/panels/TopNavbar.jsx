import React, { useState } from 'react';
import { useTwinStore } from '../store/twinStore';
import {
  Layers,
  FileText,
  GitCompare,
  Clock,
  ChevronDown,
  Check,
  Dna,
  Download
} from 'lucide-react';

export default function TopNavbar({ onExportReport }) {
  const layers = useTwinStore((state) => state.layers);
  const toggleLayer = useTwinStore((state) => state.toggleLayer);
  const setComparisonOpen = useTwinStore((state) => state.setComparisonOpen);
  const setTimelineOpen = useTwinStore((state) => state.setTimelineOpen);
  const patient = useTwinStore((state) => state.patient);
  const patientMode = useTwinStore((state) => state.patientMode);

  const [layersMenuOpen, setLayersMenuOpen] = useState(false);

  const layerItems = [
    { key: 'skin',          label: 'Skin Silhouette' },
    { key: 'skeleton',      label: 'Skeleton & Bones' },
    { key: 'organs',        label: 'Internal Organs' },
    { key: 'vessels',       label: 'Blood Vessels' },
    { key: 'airway',        label: 'Lungs & Airways' },
    { key: 'digestive',     label: 'Digestive System' },
    { key: 'urinary',       label: 'Kidneys & Bladder' },
    { key: 'diseaseOverlay',label: 'Risk Highlights' },
    { key: 'labels',        label: 'Organ Labels' },
  ];

  return (
    <header className="dt-topbar">
      {/* Brand & Studio Identity */}
      <div className="dt-topbar-left">
        <div className="dt-topbar-icon-box">
          <Dna size={18} />
        </div>
        <div>
          <div className="dt-topbar-title-wrap">
            <h1 className="dt-topbar-title">
              3D Digital Twin
            </h1>
            <span className="dt-topbar-pill">
              3D BODY VIEW
            </span>
          </div>
          <p className="dt-topbar-sub">
            {patientMode === 'active'
              ? `Patient: ${patient.patientId || patient.id || 'Active Record'}`
              : 'Interactive 3D Body Simulation'}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="dt-topbar-actions">
        {/* Layer Visibility Menu */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setLayersMenuOpen(!layersMenuOpen)}
            className="dt-action-btn"
          >
            <Layers size={14} color="var(--dt-accent-blue)" />
            <span>Body Layers</span>
            <ChevronDown size={13} color="var(--dt-text-muted)" />
          </button>

          {layersMenuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                marginTop: '6px',
                width: '240px',
                borderRadius: '8px',
                background: 'var(--dt-bg-surface)',
                border: '1px solid var(--dt-border-default)',
                padding: '8px',
                boxShadow: '0 12px 28px rgba(15, 23, 42, 0.15)',
                zIndex: 60,
              }}
            >
              <div
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  color: 'var(--dt-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '4px 8px 6px',
                  borderBottom: '1px solid var(--dt-border-default)',
                }}
              >
                Toggle Visible Layers
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}>
                {layerItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleLayer(item.key)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      background: layers[item.key] ? 'var(--dt-accent-blue-soft)' : 'transparent',
                      border: 'none',
                      color: layers[item.key] ? 'var(--dt-accent-blue)' : 'var(--dt-text-secondary)',
                      fontFamily: 'var(--dt-font-sans)',
                      fontSize: '0.74rem',
                      fontWeight: layers[item.key] ? 600 : 400,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <span>{item.label}</span>
                    {layers[item.key] ? (
                      <span
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          background: 'var(--dt-accent-blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={11} color="#FFFFFF" strokeWidth={3} />
                      </span>
                    ) : (
                      <span
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          border: '1px solid var(--dt-border-default)',
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline Progression Mode */}
        <button
          type="button"
          onClick={() => setTimelineOpen(true)}
          className="dt-action-btn"
        >
          <Clock size={14} color="#D97706" />
          <span>Timeline</span>
        </button>

        {/* Export Report Action */}
        <button
          type="button"
          onClick={onExportReport}
          className="dt-action-btn-primary"
        >
          <Download size={14} strokeWidth={2.5} />
          <span>Export Report</span>
        </button>
      </div>
    </header>
  );
}
