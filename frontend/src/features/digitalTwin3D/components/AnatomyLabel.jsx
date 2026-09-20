import React from 'react';
import { Html } from '@react-three/drei';
import { useTwinStore } from '../store/twinStore';
import { ANATOMY_REGISTRY } from '../data/anatomyRegistry';
import { getSeverityTier } from '../data/visualizationRules';

export default function AnatomyLabel({ anatomyId, position }) {
  const selectedAnatomy = useTwinStore((state) => state.selectedAnatomy);
  const hoveredAnatomy = useTwinStore((state) => state.hoveredAnatomy);
  const involvementMap = useTwinStore((state) => state.involvementMap);
  const layers = useTwinStore((state) => state.layers);
  const setSelectedAnatomy = useTwinStore((state) => state.setSelectedAnatomy);

  if (layers.labels === false || anatomyId === 'SKIN' || anatomyId === 'VASCULAR_SYSTEM') return null;

  const anatomy = ANATOMY_REGISTRY[anatomyId];
  if (!anatomy || !anatomy.position) return null;

  const percentage = involvementMap[anatomyId] || 0;
  const isSelected = selectedAnatomy === anatomyId;
  const isHovered = hoveredAnatomy === anatomyId;

  // Only show labels when explicitly hovered (5ms instant response) or selected
  const shouldShow = isHovered || isSelected;
  if (!shouldShow) return null;

  const tier = getSeverityTier(percentage);
  const targetPos = position || anatomy.position;

  return (
    <Html
      position={[targetPos[0], targetPos[1] + 0.08, targetPos[2]]}
      distanceFactor={4.5}
      center
      style={{ pointerEvents: 'auto', transition: 'all 0.15s ease' }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          setSelectedAnatomy(isSelected ? null : anatomyId);
        }}
        style={{
          cursor: 'pointer',
          padding: '4px 10px',
          borderRadius: '20px',
          background: isSelected
            ? 'rgba(2, 132, 199, 0.92)'
            : percentage > 40
            ? 'rgba(225, 29, 72, 0.92)'
            : 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: isSelected
            ? '1px solid #38bdf8'
            : percentage > 40
            ? '1px solid #f43f5e'
            : '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: isSelected
            ? '0 0 16px rgba(56, 189, 248, 0.45)'
            : percentage > 40
            ? '0 0 16px rgba(244, 63, 94, 0.45)'
            : '0 4px 14px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: percentage > 40 ? '#f43f5e' : percentage > 0 ? '#fbbf24' : '#10b981',
            boxShadow: `0 0 8px ${percentage > 40 ? '#f43f5e' : percentage > 0 ? '#fbbf24' : '#10b981'}`
          }}
        />
        <span style={{ fontSize: '0.70rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
          {anatomy.label}
        </span>
        <span
          style={{
            fontSize: '0.62rem',
            fontWeight: 600,
            color: percentage > 40 ? '#fecdd3' : percentage > 0 ? '#fde68a' : '#a7f3d0',
            opacity: 0.95
          }}
        >
          {percentage > 0 ? `${percentage}% Risk` : 'Normal'}
        </span>
      </div>
    </Html>
  );
}
