import React from 'react';
import { useTwinStore } from '../store/twinStore';
import { DISEASE_REGISTRY } from '../data/diseaseRegistry';
import { getSeverityTier } from '../data/visualizationRules';
import { Layers } from 'lucide-react';

export default function LiverDiseaseControls() {
  const diseaseParams = useTwinStore((state) => state.diseaseParams.LIVER_DISEASE);
  const updateDiseaseParam = useTwinStore((state) => state.updateDiseaseParam);

  const disease = DISEASE_REGISTRY.LIVER_DISEASE;
  const tier = getSeverityTier(diseaseParams.percentage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Liver Severity Slider */}
      <div style={{ background: 'var(--dt-bg-surface)', border: '1px solid var(--dt-border-default)', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontFamily: 'var(--dt-font-sans)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--dt-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97706' }} />
            Liver Risk Level
          </label>
          <span style={{ fontFamily: 'var(--dt-font-mono)', fontSize: '0.62rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: `${tier.hexColor}20`, color: tier.hexColor }}>
            {diseaseParams.percentage}% ({tier.label})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="range"
            min="0"
            max="100"
            value={diseaseParams.percentage}
            onChange={(e) => updateDiseaseParam('LIVER_DISEASE', 'percentage', Number(e.target.value))}
            className="dt-range-slider"
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min="0"
            max="100"
            value={diseaseParams.percentage}
            onChange={(e) => updateDiseaseParam('LIVER_DISEASE', 'percentage', Math.max(0, Math.min(100, Number(e.target.value))))}
            className="dt-input"
            style={{ width: '54px', padding: '4px 6px', textAlign: 'center', fontSize: '0.70rem' }}
          />
        </div>
      </div>

      {/* Liver Lobe Focus */}
      <div style={{ background: 'var(--dt-bg-surface)', border: '1px solid var(--dt-border-default)', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontFamily: 'var(--dt-font-sans)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--dt-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={12} color="#F59E0B" />
          Focus Region
        </label>
        <div className="dt-grid-2">
          {disease.lobes.map((lobe) => (
            <button
              key={lobe.id}
              type="button"
              onClick={() => updateDiseaseParam('LIVER_DISEASE', 'selectedLobe', lobe.label)}
              className={`dt-affected-item ${diseaseParams.selectedLobe === lobe.label ? 'active' : ''}`}
              style={{ padding: '6px 8px', fontSize: '0.70rem' }}
            >
              <span>{lobe.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

