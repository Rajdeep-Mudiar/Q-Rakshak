import React from 'react';
import { useTwinStore } from '../store/twinStore';
import { DISEASE_REGISTRY } from '../data/diseaseRegistry';
import { getSeverityTier } from '../data/visualizationRules';
import { Target, CircleDot } from 'lucide-react';

export default function BreastCancerControls() {
  const diseaseParams = useTwinStore((state) => state.diseaseParams.BREAST_CANCER);
  const updateDiseaseParam = useTwinStore((state) => state.updateDiseaseParam);
  const patient = useTwinStore((state) => state.patient);

  const disease = DISEASE_REGISTRY.BREAST_CANCER;
  const leftTier = getSeverityTier(diseaseParams.leftPercentage);
  const rightTier = getSeverityTier(diseaseParams.rightPercentage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Left Breast Involvement */}
      <div style={{ background: 'var(--dt-bg-surface)', border: '1px solid var(--dt-border-default)', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontFamily: 'var(--dt-font-sans)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--dt-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EC4899' }} />
            Left Breast
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
            onChange={(e) => updateDiseaseParam('BREAST_CANCER', 'leftPercentage', Number(e.target.value))}
            className="dt-range-slider"
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min="0"
            max="100"
            value={diseaseParams.leftPercentage}
            onChange={(e) => updateDiseaseParam('BREAST_CANCER', 'leftPercentage', Math.max(0, Math.min(100, Number(e.target.value))))}
            className="dt-input"
            style={{ width: '54px', padding: '4px 6px', textAlign: 'center', fontSize: '0.70rem' }}
          />
        </div>
      </div>

      {/* Right Breast Involvement */}
      <div style={{ background: 'var(--dt-bg-surface)', border: '1px solid var(--dt-border-default)', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontFamily: 'var(--dt-font-sans)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--dt-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F472B6' }} />
            Right Breast
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
            onChange={(e) => updateDiseaseParam('BREAST_CANCER', 'rightPercentage', Number(e.target.value))}
            className="dt-range-slider"
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min="0"
            max="100"
            value={diseaseParams.rightPercentage}
            onChange={(e) => updateDiseaseParam('BREAST_CANCER', 'rightPercentage', Math.max(0, Math.min(100, Number(e.target.value))))}
            className="dt-input"
            style={{ width: '54px', padding: '4px 6px', textAlign: 'center', fontSize: '0.70rem' }}
          />
        </div>
      </div>

      {/* Anatomical Quadrant Selection */}
      <div style={{ background: 'var(--dt-bg-surface)', border: '1px solid var(--dt-border-default)', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontFamily: 'var(--dt-font-mono)', fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--dt-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Target size={12} color="#F472B6" />
          Anatomical Quadrant Focus
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {disease.quadrants.map((quad) => (
            <button
              key={quad.id}
              type="button"
              onClick={() => updateDiseaseParam('BREAST_CANCER', 'selectedQuadrant', quad.label)}
              className={`dt-affected-item ${diseaseParams.selectedQuadrant === quad.label ? 'active' : ''}`}
              style={{ padding: '6px 8px', fontSize: '0.66rem' }}
            >
              <span>{quad.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3D Lesion Marker Configuration */}
      <div style={{ background: 'var(--dt-bg-surface)', border: '1px solid var(--dt-border-default)', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontFamily: 'var(--dt-font-mono)', fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--dt-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CircleDot size={12} color="#FB7185" />
            3D Lesion Marker
          </label>
          <button
            type="button"
            onClick={() => updateDiseaseParam('BREAST_CANCER', 'lesionEnabled', !diseaseParams.lesionEnabled)}
            className="dt-action-btn"
            style={{ padding: '2px 8px', fontSize: '0.58rem' }}
          >
            {diseaseParams.lesionEnabled ? 'Active' : 'Disabled'}
          </button>
        </div>

        {diseaseParams.lesionEnabled && (
          <div className="dt-grid-2" style={{ marginTop: '4px' }}>
            <div>
              <span className="dt-label">Position X:</span>
              <input
                type="number"
                step="0.05"
                value={diseaseParams.lesionX}
                onChange={(e) => updateDiseaseParam('BREAST_CANCER', 'lesionX', parseFloat(e.target.value))}
                className="dt-input"
              />
            </div>
            <div>
              <span className="dt-label">Position Y:</span>
              <input
                type="number"
                step="0.05"
                value={diseaseParams.lesionY}
                onChange={(e) => updateDiseaseParam('BREAST_CANCER', 'lesionY', parseFloat(e.target.value))}
                className="dt-input"
              />
            </div>
            <div>
              <span className="dt-label">Position Z:</span>
              <input
                type="number"
                step="0.05"
                value={diseaseParams.lesionZ}
                onChange={(e) => updateDiseaseParam('BREAST_CANCER', 'lesionZ', parseFloat(e.target.value))}
                className="dt-input"
              />
            </div>
            <div>
              <span className="dt-label">Lesion Radius:</span>
              <input
                type="number"
                step="0.02"
                min="0.04"
                max="0.4"
                value={diseaseParams.lesionRadius}
                onChange={(e) => updateDiseaseParam('BREAST_CANCER', 'lesionRadius', parseFloat(e.target.value))}
                className="dt-input"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

