import React from 'react';
import { useTwinStore } from '../store/twinStore';
import { getSeverityTier } from '../data/visualizationRules';
import { Brain } from 'lucide-react';

export default function ParkinsonsControls() {
  const diseaseParams = useTwinStore((state) => state.diseaseParams.PARKINSONS) || { percentage: 0, dopaminergicDepletion: 0, selectedRegion: 'Substantia Nigra' };
  const updateDiseaseParam = useTwinStore((state) => state.updateDiseaseParam);
  const tier = getSeverityTier(diseaseParams.percentage);

  const regions = [
    'Substantia Nigra',
    'Basal Ganglia',
    'Striatum',
    'Motor Cortex'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Brain & Neuromotor Severity Slider */}
      <div style={{ background: 'var(--dt-bg-surface)', border: '1px solid var(--dt-border-default)', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontFamily: 'var(--dt-font-sans)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--dt-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9333EA' }} />
            Neuromotor Involvement
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
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDiseaseParam('PARKINSONS', 'percentage', val);
              updateDiseaseParam('PARKINSONS', 'dopaminergicDepletion', val);
            }}
            className="dt-range-slider"
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min="0"
            max="100"
            value={diseaseParams.percentage}
            onChange={(e) => {
              const val = Math.max(0, Math.min(100, Number(e.target.value)));
              updateDiseaseParam('PARKINSONS', 'percentage', val);
              updateDiseaseParam('PARKINSONS', 'dopaminergicDepletion', val);
            }}
            className="dt-input"
            style={{ width: '54px', padding: '4px 6px', textAlign: 'center', fontSize: '0.70rem' }}
          />
        </div>
      </div>

      {/* Cerebral / Basal Ganglia Region Selection */}
      <div style={{ background: 'var(--dt-bg-surface)', border: '1px solid var(--dt-border-default)', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontFamily: 'var(--dt-font-sans)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--dt-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Brain size={12} color="#A855F7" />
          Primary Affected Region
        </label>
        <div className="dt-grid-2">
          {regions.map((reg) => (
            <button
              key={reg}
              type="button"
              onClick={() => updateDiseaseParam('PARKINSONS', 'selectedRegion', reg)}
              className={`dt-subregion-btn ${diseaseParams.selectedRegion === reg ? 'active' : ''}`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
