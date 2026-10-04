import React from 'react';
import { useTwinStore } from '../store/twinStore';
import { useLanguage } from '../../../context/LanguageContext';
import { ANATOMY_REGISTRY } from '../data/anatomyRegistry';
import { DISEASE_REGISTRY } from '../data/diseaseRegistry';
import { getSeverityTier } from '../data/visualizationRules';
import {
  Info,
  Crosshair,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Layers,
  Activity,
  Sparkles,
  X
} from 'lucide-react';

export default function RightSidebar() {
  const { t } = useLanguage();
  const selectedAnatomy    = useTwinStore((state) => state.selectedAnatomy);
  const setSelectedAnatomy  = useTwinStore((state) => state.setSelectedAnatomy);
  const selectedDisease    = useTwinStore((state) => state.selectedDisease);
  const involvementMap     = useTwinStore((state) => state.involvementMap);
  const updateInvolvement  = useTwinStore((state) => state.updateInvolvement);
  const setCameraAction    = useTwinStore((state) => state.setCameraAction);
  const patient            = useTwinStore((state) => state.patient);
  const patientMode        = useTwinStore((state) => state.patientMode);
  const patientAnalysis    = useTwinStore((state) => state.patientAnalysis);

  const anatomy    = selectedAnatomy ? ANATOMY_REGISTRY[selectedAnatomy] : null;
  const disease    = DISEASE_REGISTRY[selectedDisease];
  const percentage = anatomy ? (involvementMap[anatomy.id] || 0) : 0;
  const tier       = getSeverityTier(percentage);

  // Check if selected organ was directly evaluated by AI model
  const isDirectlyEvaluated = patientAnalysis && patientAnalysis.evaluatedOrgan === selectedAnatomy;

  // List of all currently affected structures
  const affectedList = Object.entries(involvementMap)
    .filter(([_, val]) => val > 0)
    .map(([id, val]) => ({
      id,
      label: ANATOMY_REGISTRY[id]?.label || id,
      percentage: val,
      tier: getSeverityTier(val)
    }));

  return (
    <aside className="dt-right-sidebar">
      {/* Header */}
      <div className="dt-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={16} color="var(--dt-accent-blue)" />
          <h3 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--dt-text-primary)', margin: 0 }}>
            {t('twin_panels.organ_details', 'Organ Details')}
          </h3>
        </div>
        <span
          style={{
            fontFamily: 'var(--dt-font-sans)',
            fontSize: '0.64rem',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'var(--dt-accent-blue-soft)',
            color: 'var(--dt-accent-blue)',
            border: '1px solid rgba(2, 132, 199, 0.2)',
            fontWeight: 700,
          }}
        >
          {selectedAnatomy || (affectedList.length === 0 ? t('twin_panels.healthy_baseline', 'HEALTHY BASELINE') : t('twin_panels.select_an_organ', 'SELECT AN ORGAN'))}
        </span>
      </div>

      <div className="dt-panel-body">
        {/* 1. Inspected Anatomy Card (when an organ is selected) */}
        {anatomy && (
          <div
            className="dt-card"
            style={{
              border: isDirectlyEvaluated
                ? (patientAnalysis.isHealthyOrBenign ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)')
                : '1px solid var(--dt-border-default)',
              background: isDirectlyEvaluated
                ? (patientAnalysis.isHealthyOrBenign ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.04)')
                : 'var(--dt-bg-surface)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '0.62rem', color: 'var(--dt-accent-blue)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {anatomy.category || 'Organ System'}
                </div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--dt-text-primary)', marginTop: '2px' }}>
                  {anatomy.label}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnatomy(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--dt-text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={t('twin_panels.clear_selection', 'Clear selection')}
              >
                <X size={14} />
              </button>
            </div>

            {/* Infiltration Risk Progress Gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.66rem', color: 'var(--dt-text-muted)', fontWeight: 700 }}>
                  {t('twin_panels.infiltration_risk', 'Infiltration Risk')}
                </span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: `${tier.hexColor}20`,
                    color: tier.hexColor,
                    fontWeight: 800,
                  }}
                >
                  {percentage}% ({tier.label})
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'var(--dt-border-default)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: tier.hexColor,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* AI Clinical Diagnostic Correlation */}
            {isDirectlyEvaluated ? (
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: patientAnalysis.isHealthyOrBenign ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${patientAnalysis.isHealthyOrBenign ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  fontSize: '0.70rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  marginBottom: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Sparkles size={13} color={patientAnalysis.isHealthyOrBenign ? '#10B981' : '#EF4444'} />
                  <strong style={{ color: patientAnalysis.isHealthyOrBenign ? '#10B981' : '#EF4444' }}>
                    {patientAnalysis.isHealthyOrBenign ? t('twin_panels.evaluated_benign', 'AI Assessment: Benign / Clear') : t('twin_panels.evaluated_pathology', 'AI Assessment: Pathology Detected')}
                  </strong>
                </div>
                <div style={{ color: 'var(--dt-text-secondary)', lineHeight: 1.4 }}>
                  {patientAnalysis.isHealthyOrBenign
                    ? t('twin_panels.benign_eval_desc', 'Clinical diagnostic run verified no active malignancy. Organ baseline maintained at clean physiological values.')
                    : t('twin_panels.pathology_eval_desc', 'Diagnostic inference identified abnormal tissue involvement. Visualized in 3D using active risk shaders.')}
                </div>
              </div>
            ) : percentage > 0 ? (
              <div
                style={{
                  padding: '6px 8px',
                  borderRadius: '5px',
                  background: `${tier.hexColor}10`,
                  border: `1px solid ${tier.hexColor}30`,
                  fontSize: '0.68rem',
                  color: 'var(--dt-text-secondary)',
                  marginBottom: '8px'
                }}
              >
                <strong>{t('twin_panels.systemic_involvement', 'Secondary/Systemic Involvement')}:</strong> {percentage}% {t('twin_panels.cross_organ_risk', 'cross-organ risk manifestation.')}
              </div>
            ) : (
              <div
                style={{
                  padding: '6px 8px',
                  borderRadius: '5px',
                  background: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  fontSize: '0.68rem',
                  color: '#10B981',
                  marginBottom: '8px'
                }}
              >
                <ShieldCheck size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                {t('twin_panels.organ_clear_desc', 'Verified Clear: 0% active disease involvement.')}
              </div>
            )}

            {/* Description & Camera Focus */}
            <p style={{ fontSize: '0.68rem', color: 'var(--dt-text-muted)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
              {anatomy.description}
            </p>

            <button
              type="button"
              onClick={() => setCameraAction({ preset: 'focus', trigger: Date.now() })}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '5px',
                background: 'var(--dt-accent-blue)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.70rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Crosshair size={13} />
              {t('twin_panels.recenter_organ_cam', 'Recenter Camera on Organ')}
            </button>
          </div>
        )}

        {/* 2. Active Affected Organs Summary */}
        <div className="dt-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--dt-text-primary)' }}>
              {t('twin_panels.organs_at_risk', 'Organs at Risk')} ({affectedList.length})
            </span>
            {affectedList.length > 0 ? (
              <ShieldAlert size={14} color="#DC2626" />
            ) : (
              <ShieldCheck size={14} color="#10B981" />
            )}
          </div>

          <div className="dt-affected-list">
            {affectedList.length === 0 ? (
              <div style={{ padding: '12px 10px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.06)', borderRadius: '6px', border: '1px dashed rgba(16, 185, 129, 0.3)' }}>
                <ShieldCheck size={24} color="#10B981" style={{ margin: '0 auto 6px auto', display: 'block' }} />
                <strong style={{ fontSize: '0.78rem', color: '#10B981', display: 'block', marginBottom: '4px' }}>
                  {t('twin_panels.anatomical_baseline', 'Anatomical Baseline')}
                </strong>
                <p style={{ fontSize: '0.72rem', color: 'var(--dt-text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {t('twin_panels.baseline_desc', 'No active clinical disease risks detected. Complete a diagnostic assessment to project organ-specific involvement.')}
                </p>
              </div>
            ) : (
              affectedList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedAnatomy(item.id);
                    setCameraAction({ preset: 'focus', trigger: Date.now() });
                  }}
                  className={`dt-affected-item ${selectedAnatomy === item.id ? 'active' : ''}`}
                >
                  <span style={{ fontWeight: 600 }}>{item.label}</span>
                  <span
                    style={{
                      fontSize: '0.64rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: `${item.tier.hexColor}15`,
                      color: item.tier.hexColor,
                      border: `1px solid ${item.tier.hexColor}40`,
                      fontWeight: 800,
                    }}
                  >
                    {item.percentage}%
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 3. Disease Simulation Baseline */}
        <div className="dt-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--dt-text-primary)' }}>
              {t('twin_panels.simulation_overview', 'Simulation Overview')}
            </span>
            <Activity size={14} color="var(--dt-accent-blue)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.76rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--dt-text-muted)' }}>{t('twin_panels.sex', 'Sex')}:</span>
              <strong style={{ color: 'var(--dt-text-primary)', textTransform: 'capitalize' }}>{patient.sex || t('twin_panels.not_specified', 'Not Specified')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--dt-text-muted)' }}>{t('twin_panels.age_group', 'Age Group')}:</span>
              <strong style={{ color: 'var(--dt-text-primary)' }}>{patient.ageGroup || t('twin_panels.adult', 'Adult')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--dt-text-muted)' }}>{t('twin_panels.active_status', 'Active Status')}:</span>
              <strong style={{ color: affectedList.length > 0 ? '#DC2626' : '#10B981' }}>
                {affectedList.length > 0 ? `${affectedList.length} Organs Monitored` : t('twin_panels.baseline_healthy', 'Baseline Healthy')}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--dt-text-muted)' }}>{t('twin_panels.diagnostic_state', 'Diagnostic State')}:</span>
              <strong style={{ color: affectedList.length > 0 ? 'var(--dt-accent-blue)' : 'var(--dt-text-muted)' }}>
                {patientAnalysis ? String(patientAnalysis.disease || 'Assessed').replace(/_/g, ' ') : (affectedList.length > 0 ? (disease?.name || 'Assessed') : t('twin_panels.pending_checkup', 'Pending Checkup'))}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
