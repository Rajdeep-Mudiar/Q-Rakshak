import React from 'react';
import { useTwinStore } from '../store/twinStore';
import { DISEASE_REGISTRY } from '../data/diseaseRegistry';
import { getSeverityTier } from '../data/visualizationRules';
import { Wind, Layers } from 'lucide-react';

export default function PneumoniaControls() {
  const diseaseParams = useTwinStore((state) => state.diseaseParams.PNEUMONIA);
  const updateDiseaseParam = useTwinStore((state) => state.updateDiseaseParam);

  const disease = DISEASE_REGISTRY.PNEUMONIA;
  const leftTier = getSeverityTier(diseaseParams.leftPercentage);
  const rightTier = getSeverityTier(diseaseParams.rightPercentage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Right Lung Involvement */}
      <div style={{ background: 'var(--dt-bg-surface)', border: '1px solid var(--dt-border-default)', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontFamily: 'var(--dt-font-sans)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--dt-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wind size={14} color="#38BDF8" />
            Right Lung
          </label>
          <span style={{ fontFamily: 'var(--dt-font-mono)', fontSize: '0.62rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: `${rightTier.hexColor}20`, color: rightTier.hexColor }}>
            {diseaseParams.rightPercentage}% ({rightTier.label})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="range"
            min="0"
            max="100"
            value={diseaseParams.rightPercentage}
            onChange={(e) => updateDiseaseParam('PNEUMONIA', 'rightPercentage', Number(e.target.value))}
            className="dt-range-slider"
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min="0"
            max="100"
            value={diseaseParams.rightPercentage}
            onChange={(e) => updateDiseaseParam('PNEUMONIA', 'rightPercentage', Math.max(0, Math.min(100, Number(e.target.value))))}
            className="dt-input"
            style={{ width: '54px', padding: '4px 6px', textAlign: 'center', fontSize: '0.70rem' }}
          />
        </div>
      </div>

      {/* Left Lung Involvement */}
      <div style={{ background: 'var(--dt-bg-surface)', border: '1px solid var(--dt-border-default)', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontFamily: 'var(--dt-font-sans)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--dt-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wind size={14} color="#38BDF8" />
            Left Lung
          </label>
          <span style={{ fontFamily: 'var(--dt-font-mono)', fontSize: '0.62rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: `${leftTier.hexColor}20`, color: leftTier.hexColor }}>
            {diseaseParams.leftPercentage}% ({leftTier.label})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="range"
            min="0"
            max="100"
            value={diseaseParams.leftPercentage}
            onChange={(e) => updateDiseaseParam('PNEUMONIA', 'leftPercentage', Number(e.target.value))}
            className="dt-range-slider"
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min="0"
            max="100"
            value={diseaseParams.leftPercentage}
            onChange={(e) => updateDiseaseParam('PNEUMONIA', 'leftPercentage', Math.max(0, Math.min(100, Number(e.target.value))))}
            className="dt-input"
            style={{ width: '54px', padding: '4px 6px', textAlign: 'center', fontSize: '0.68rem' }}
          />
        </div>
      </div>

      {/* Lobar Pulmonary Zone Mapping */}
      <div style={{ background: 'var(--dt-bg-surface)', border: '1px solid var(--dt-border-default)', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontFamily: 'var(--dt-font-mono)', fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--dt-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={12} color="#38BDF8" />
          Lobar Pulmonary Zone Mapping
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {disease.lungZones.map((zone) => (
            <button
              key={zone.id}
              type="button"
              onClick={() => updateDiseaseParam('PNEUMONIA', 'selectedZone', zone.label)}
              className={`dt-affected-item ${diseaseParams.selectedZone === zone.label ? 'active' : ''}`}
              style={{ padding: '6px 8px', fontSize: '0.66rem' }}
            >
              <span>{zone.label}</span>
              <span style={{ fontSize: '0.58rem', color: 'var(--dt-text-muted)' }}>
                {zone.organ === 'LUNG_RIGHT' ? 'Right' : 'Left'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

