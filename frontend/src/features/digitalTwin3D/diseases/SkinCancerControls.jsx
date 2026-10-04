import React from 'react';
import { useTwinStore } from '../store/twinStore';
import { getSeverityTier } from '../data/visualizationRules';
import { Sparkles } from 'lucide-react';

export default function SkinCancerControls() {
  const diseaseParams = useTwinStore((state) => state.diseaseParams.SKIN_CANCER) || { percentage: 0, lesionType: 'Melanocytic', selectedZone: 'Epidermis' };
  const updateDiseaseParam = useTwinStore((state) => state.updateDiseaseParam);
  const tier = getSeverityTier(diseaseParams.percentage);

  const zones = [
    'Epidermis',
    'Dermis Layer',
    'Basal Membrane',
    'Subcutaneous Tissue'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Cutaneous Risk Slider */}
      <div style={{ background: 'var(--dt-bg-surface)', border: '1px solid var(--dt-border-default)', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontFamily: 'var(--dt-font-sans)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--dt-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E11D48' }} />
            Melanoma / Cutaneous Risk
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
            onChange={(e) => updateDiseaseParam('SKIN_CANCER', 'percentage', Number(e.target.value))}
            className="dt-range-slider"
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min="0"
            max="100"
            value={diseaseParams.percentage}
            onChange={(e) => updateDiseaseParam('SKIN_CANCER', 'percentage', Math.max(0, Math.min(100, Number(e.target.value))))}
            className="dt-input"
            style={{ width: '54px', padding: '4px 6px', textAlign: 'center', fontSize: '0.70rem' }}
          />
        </div>
      </div>

      {/* Epidermal Depth Selection */}
      <div style={{ background: 'var(--dt-bg-surface)', border: '1px solid var(--dt-border-default)', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontFamily: 'var(--dt-font-sans)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--dt-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={12} color="#FB7185" />
          Infiltration Depth
        </label>
        <div className="dt-grid-2">
          {zones.map((zone) => (
            <button
              key={zone}
              type="button"
              onClick={() => updateDiseaseParam('SKIN_CANCER', 'selectedZone', zone)}
              className={`dt-subregion-btn ${diseaseParams.selectedZone === zone ? 'active' : ''}`}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
