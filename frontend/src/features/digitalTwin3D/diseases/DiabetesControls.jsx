import React from 'react';
import { useTwinStore } from '../store/twinStore';
import { getSeverityTier } from '../data/visualizationRules';
import { Network } from 'lucide-react';

export default function DiabetesControls() {
  const diseaseParams = useTwinStore((state) => state.diseaseParams.DIABETES);
  const updateDiseaseParam = useTwinStore((state) => state.updateDiseaseParam);

  const targets = [
    { key: 'pancreas', label: 'Pancreas', val: diseaseParams.pancreas },
    { key: 'kidneyLeft', label: 'Left Kidney', val: diseaseParams.kidneyLeft },
    { key: 'kidneyRight', label: 'Right Kidney', val: diseaseParams.kidneyRight },
    { key: 'heart', label: 'Heart', val: diseaseParams.heart },
    { key: 'vascular', label: 'Blood Vessels', val: diseaseParams.vascular },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.2)', fontSize: '0.70rem', color: 'var(--dt-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Network size={14} color="var(--dt-accent-blue)" />
        <span>Adjust sliders to simulate disease impact on each organ.</span>
      </div>

      {targets.map((item) => {
        const tier = getSeverityTier(item.val);
        return (
          <div key={item.key} style={{ background: 'var(--dt-bg-surface)', border: '1px solid var(--dt-border-default)', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontFamily: 'var(--dt-font-mono)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--dt-text-secondary)' }}>
                {item.label}
              </label>
              <span style={{ fontFamily: 'var(--dt-font-mono)', fontSize: '0.60rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: `${tier.hexColor}20`, color: tier.hexColor }}>
                {item.val}% ({tier.label})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={item.val}
                onChange={(e) => updateDiseaseParam('DIABETES', item.key, Number(e.target.value))}
                className="dt-range-slider"
                style={{ flex: 1 }}
              />
              <input
                type="number"
                min="0"
                max="100"
                value={item.val}
                onChange={(e) => updateDiseaseParam('DIABETES', item.key, Math.max(0, Math.min(100, Number(e.target.value))))}
                className="dt-input"
                style={{ width: '54px', padding: '4px 6px', textAlign: 'center', fontSize: '0.68rem' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

