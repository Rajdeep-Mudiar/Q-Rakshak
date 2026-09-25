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
  Activity
} from 'lucide-react';

export default function RightSidebar() {
  const { t } = useLanguage();
  const selectedAnatomy = useTwinStore((state) => state.selectedAnatomy);
  const setSelectedAnatomy = useTwinStore((state) => state.setSelectedAnatomy);
  const selectedDisease = useTwinStore((state) => state.selectedDisease);
  const involvementMap = useTwinStore((state) => state.involvementMap);
  const updateInvolvement = useTwinStore((state) => state.updateInvolvement);
  const setCameraAction = useTwinStore((state) => state.setCameraAction);
  const patient = useTwinStore((state) => state.patient);
  const patientMode = useTwinStore((state) => state.patientMode);

  const anatomy = selectedAnatomy ? ANATOMY_REGISTRY[selectedAnatomy] : null;
  const disease = DISEASE_REGISTRY[selectedDisease];
  const percentage = anatomy ? (involvementMap[anatomy.id] || 0) : 0;
  const tier = getSeverityTier(percentage);

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
        {/* 1. Active Affected Organs Summary */}
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
                    setCameraAction('focus');
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

        {/* 2. Disease Simulation Baseline */}
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
                {affectedList.length > 0 ? t('twin_panels.organs_monitored', '{count} Organs Monitored', { count: affectedList.length }) : t('twin_panels.baseline_healthy', 'Baseline Healthy')}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--dt-text-muted)' }}>{t('twin_panels.diagnostic_state', 'Diagnostic State')}:</span>
              <strong style={{ color: affectedList.length > 0 ? 'var(--dt-accent-blue)' : 'var(--dt-text-muted)' }}>
                {affectedList.length > 0 ? (disease?.name || 'Assessed') : t('twin_panels.pending_checkup', 'Pending Checkup')}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
