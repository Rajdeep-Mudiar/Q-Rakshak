import React, { useState } from 'react';
import { useTwinStore } from '../store/twinStore';
import { useLanguage } from '../../../context/LanguageContext';
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
  const { t } = useLanguage();
  const layers = useTwinStore((state) => state.layers);
  const toggleLayer = useTwinStore((state) => state.toggleLayer);
  const setComparisonOpen = useTwinStore((state) => state.setComparisonOpen);
  const setTimelineOpen = useTwinStore((state) => state.setTimelineOpen);
  const patient = useTwinStore((state) => state.patient);
  const patientMode = useTwinStore((state) => state.patientMode);

  const [layersMenuOpen, setLayersMenuOpen] = useState(false);

  const layerItems = [
    { key: 'skin',          label: t('twin_panels.layer_skin', 'Skin Silhouette') },
    { key: 'skeleton',      label: t('twin_panels.layer_skeleton', 'Skeleton & Bones') },
    { key: 'organs',        label: t('twin_panels.layer_organs', 'Internal Organs') },
    { key: 'vessels',       label: t('twin_panels.layer_vessels', 'Blood Vessels') },
    { key: 'airway',        label: t('twin_panels.layer_airway', 'Lungs & Airways') },
    { key: 'digestive',     label: t('twin_panels.layer_digestive', 'Digestive System') },
    { key: 'urinary',       label: t('twin_panels.layer_urinary', 'Kidneys & Bladder') },
    { key: 'diseaseOverlay',label: t('twin_panels.layer_diseaseOverlay', 'Risk Highlights') },
    { key: 'labels',        label: t('twin_panels.layer_labels', 'Organ Labels') },
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
              {t('twin_panels.title', '3D Digital Twin')}
            </h1>
            <span className="dt-topbar-pill">
              {t('twin_panels.body_view_pill', '3D BODY VIEW')}
            </span>
          </div>
          <p className="dt-topbar-sub">
            {patientMode === 'active'
              ? `${t('twin_panels.patient_prefix', 'Patient')}: ${patient.patientId || patient.id || t('twin_panels.active_record', 'Active Record')}`
              : t('twin_panels.interactive_body', 'Interactive 3D Body Simulation')}
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
            <span>{t('twin_panels.body_layers', 'Body Layers')}</span>
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
                {t('twin_panels.toggle_visible_layers', 'Toggle Visible Layers')}
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
          <span>{t('twin_panels.timeline', 'Timeline')}</span>
        </button>

        {/* Export Report Action */}
        <button
          type="button"
          onClick={onExportReport}
          className="dt-action-btn-primary"
        >
          <Download size={14} strokeWidth={2.5} />
          <span>{t('twin_panels.export_report', 'Export Report')}</span>
        </button>
      </div>
    </header>
  );
}
