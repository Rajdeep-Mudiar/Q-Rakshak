import React, { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { useTwinStore } from '../store/twinStore';
import { GLBHumanBody } from './GLBHumanBody';
import { GLBHeart } from './GLBHeart';
import { GLBLungs } from './GLBLungs';
import { GLBOrgan } from './GLBOrgan';
import LesionMarker from './LesionMarker';
import AnatomyLabel from './AnatomyLabel';
import { ANATOMY_REGISTRY } from '../data/anatomyRegistry';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { computeVisualizationState } from '../visualization/visualizationEngine';

// ── Preload all 25 GLB models ─────────────────────────────────────────────────
useGLTF.preload('/models/brain.glb');
useGLTF.preload('/models/skull.glb');
useGLTF.preload('/models/spinal_cord.glb');
useGLTF.preload('/models/pelvis.glb');
useGLTF.preload('/models/heart.glb');
useGLTF.preload('/models/lungs.glb');
useGLTF.preload('/models/trachea.glb');
useGLTF.preload('/models/bronchus.glb');
useGLTF.preload('/models/larynx.glb');
useGLTF.preload('/models/liver.glb');
useGLTF.preload('/models/spleen.glb');
useGLTF.preload('/models/pancreas.glb');
useGLTF.preload('/models/large_intestine.glb');
useGLTF.preload('/models/small_intestine.glb');
useGLTF.preload('/models/kidney_left.glb');
useGLTF.preload('/models/kidney_right.glb');
useGLTF.preload('/models/ureter_left.glb');
useGLTF.preload('/models/ureter_right.glb');
useGLTF.preload('/models/urinary_bladder.glb');

// ── Breast structure (procedural, sex-conditional) ───────────────────────────
function BreastStructure({ id, position, isFemale }) {
  const setSelectedAnatomy = useTwinStore((s) => s.setSelectedAnatomy);
  const setHoveredAnatomy  = useTwinStore((s) => s.setHoveredAnatomy);
  const selectedAnatomy    = useTwinStore((s) => s.selectedAnatomy);
  const hoveredAnatomy     = useTwinStore((s) => s.hoveredAnatomy);
  const involvementMap     = useTwinStore((s) => s.involvementMap);
  const layers             = useTwinStore((s) => s.layers);
  const xrayMode           = useTwinStore((s) => s.xrayMode);
  const patientMode        = useTwinStore((s) => s.patientMode);

  const percentage = involvementMap[id] || 0;
  const diseaseOverlayActive = layers.diseaseOverlay && percentage > 0 && patientMode !== 'idle';
  const vizState = useMemo(() => computeVisualizationState(id, percentage), [id, percentage]);

  const isSelected = selectedAnatomy === id;
  const isHovered  = hoveredAnatomy  === id;
  const scaleFactor = isFemale ? [0.19, 0.19, 0.15] : [0.10, 0.10, 0.07];
  const opacity = xrayMode ? 0.40 : isFemale ? 0.80 : 0.55;
  const color = diseaseOverlayActive ? vizState.hexColor : '#f472b6';

  if (layers.organs === false) return null;

  return (
    <group
      position={position}
      scale={scaleFactor}
      rotation={[Math.PI * 0.5, 0, 0]}
      onClick={(e) => { e.stopPropagation(); setSelectedAnatomy(id); }}
      onPointerOver={(e) => { e.stopPropagation(); setHoveredAnatomy(id); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); if (hoveredAnatomy === id) setHoveredAnatomy(null); document.body.style.cursor = 'default'; }}
    >
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.23, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          emissive={diseaseOverlayActive ? vizState.emissiveColor : isHovered ? '#38bdf8' : '#000000'}
          emissiveIntensity={diseaseOverlayActive ? vizState.emissiveIntensity : isHovered ? 0.35 : 0}
        />
      </mesh>
      {isFemale && (
        <mesh position={[0, 0, 0.22]}>
          <circleGeometry args={[0.045, 24]} />
          <meshStandardMaterial color="#f43f5e" roughness={0.5} />
        </mesh>
      )}
      {isSelected && (
        <mesh scale={1.12}>
          <sphereGeometry args={[0.24, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

// ── Main AnatomyModel ─────────────────────────────────────────────────────────
export default function AnatomyModel() {
  const patient = useTwinStore((s) => s.patient);
  const isFemale   = patient.sex === 'female';
  const isPediatric = patient.ageGroup === '<18';
  const modelScale  = isPediatric ? [0.88, 0.88, 0.88] : [1, 1, 1];

  const R = ANATOMY_REGISTRY;

  return (
    <group scale={modelScale} position={[0, 0, 0]}>

      {/* ── 1. SKIN BODY + VASCULATURE (sex-specific GLBs) ── */}
      <Suspense fallback={null}>
        <GLBHumanBody isFemale={isFemale} />
      </Suspense>

      {/* ── 2. SKULL ── */}
      <Suspense fallback={null}>
        <GLBOrgan
          organId="SKULL"
          glbPath="/models/skull.glb"
          position={R.SKULL.position}
          scale={R.SKULL.scale}
          rotation={R.SKULL.rotation}
          layer="skeleton"
          defaultColor={R.SKULL.defaultColor}
          defaultOpacity={R.SKULL.defaultOpacity}
          selectionOutlineScale={1.08}
        />
      </Suspense>

      {/* ── 3. PELVIS ── */}
      <Suspense fallback={null}>
        <GLBOrgan
          organId="PELVIS"
          glbPath="/models/pelvis.glb"
          position={R.PELVIS.position}
          scale={R.PELVIS.scale}
          rotation={R.PELVIS.rotation}
          layer="skeleton"
          defaultColor={R.PELVIS.defaultColor}
          defaultOpacity={R.PELVIS.defaultOpacity}
          selectionOutlineScale={1.10}
        />
      </Suspense>

      {/* ── 4. SPINAL CORD ── */}
      <Suspense fallback={null}>
        <GLBOrgan
          organId="SPINAL_CORD"
          glbPath="/models/spinal_cord.glb"
          position={R.SPINAL_CORD.position}
          scale={R.SPINAL_CORD.scale}
          rotation={R.SPINAL_CORD.rotation}
          layer="skeleton"
          defaultColor={R.SPINAL_CORD.defaultColor}
          defaultOpacity={R.SPINAL_CORD.defaultOpacity}
        />
      </Suspense>

      {/* ── 5. BRAIN ── */}
      <Suspense fallback={null}>
        <GLBOrgan
          organId="BRAIN"
          glbPath="/models/brain.glb"
          position={R.BRAIN.position}
          scale={R.BRAIN.scale}
          rotation={R.BRAIN.rotation}
          layer="organs"
          defaultColor={R.BRAIN.defaultColor}
          defaultOpacity={R.BRAIN.defaultOpacity}
          selectionOutlineScale={1.15}
        />
      </Suspense>

      {/* ── 6. LARYNX ── */}
      <Suspense fallback={null}>
        <GLBOrgan
          organId="LARYNX"
          glbPath="/models/larynx.glb"
          position={R.LARYNX.position}
          scale={R.LARYNX.scale}
          rotation={R.LARYNX.rotation}
          layer="airway"
          defaultColor={R.LARYNX.defaultColor}
          defaultOpacity={R.LARYNX.defaultOpacity}
        />
      </Suspense>

      {/* ── 7. TRACHEA ── */}
      <Suspense fallback={null}>
        <GLBOrgan
          organId="TRACHEA"
          glbPath="/models/trachea.glb"
          position={R.TRACHEA.position}
          scale={R.TRACHEA.scale}
          rotation={R.TRACHEA.rotation}
          layer="airway"
          defaultColor={R.TRACHEA.defaultColor}
          defaultOpacity={R.TRACHEA.defaultOpacity}
        />
      </Suspense>

      {/* ── 8. BRONCHI ── */}
      <Suspense fallback={null}>
        <GLBOrgan
          organId="BRONCHUS"
          glbPath="/models/bronchus.glb"
          position={R.BRONCHUS.position}
          scale={R.BRONCHUS.scale}
          rotation={R.BRONCHUS.rotation}
          layer="airway"
          defaultColor={R.BRONCHUS.defaultColor}
          defaultOpacity={R.BRONCHUS.defaultOpacity}
        />
      </Suspense>

      {/* ── 9. HEART (GLBHeart — keeps pulsatile animation) ── */}
      <Suspense fallback={null}>
        <GLBHeart position={R.HEART.position} scale={R.HEART.scale} />
      </Suspense>

      {/* ── 10. LUNGS (GLBLungs — keeps respiratory animation) ── */}
      <Suspense fallback={null}>
        <GLBLungs position={R.LUNG_LEFT.position} />
      </Suspense>

      {/* ── 11. LIVER ── */}
      <Suspense fallback={null}>
        <GLBOrgan
          organId="LIVER"
          glbPath="/models/liver.glb"
          position={R.LIVER.position}
          scale={R.LIVER.scale}
          rotation={R.LIVER.rotation}
          layer="organs"
          defaultColor={R.LIVER.defaultColor}
          defaultOpacity={R.LIVER.defaultOpacity}
        />
      </Suspense>

      {/* ── 12. SPLEEN ── */}
      <Suspense fallback={null}>
        <GLBOrgan
          organId="SPLEEN"
          glbPath="/models/spleen.glb"
          position={R.SPLEEN.position}
          scale={R.SPLEEN.scale}
          rotation={R.SPLEEN.rotation}
          layer="organs"
          defaultColor={R.SPLEEN.defaultColor}
          defaultOpacity={R.SPLEEN.defaultOpacity}
        />
      </Suspense>

      {/* ── 13. PANCREAS ── */}
      <Suspense fallback={null}>
        <GLBOrgan
          organId="PANCREAS"
          glbPath="/models/pancreas.glb"
          position={R.PANCREAS.position}
          scale={R.PANCREAS.scale}
          rotation={R.PANCREAS.rotation}
          layer="organs"
          defaultColor={R.PANCREAS.defaultColor}
          defaultOpacity={R.PANCREAS.defaultOpacity}
        />
      </Suspense>

      {/* ── 14. LARGE INTESTINE ── */}
      <Suspense fallback={null}>
        <GLBOrgan
          organId="LARGE_INTESTINE"
          glbPath="/models/large_intestine.glb"
          position={R.LARGE_INTESTINE.position}
          scale={R.LARGE_INTESTINE.scale}
          rotation={R.LARGE_INTESTINE.rotation}
          layer="digestive"
          defaultColor={R.LARGE_INTESTINE.defaultColor}
          defaultOpacity={R.LARGE_INTESTINE.defaultOpacity}
        />
      </Suspense>

      {/* ── 15. SMALL INTESTINE ── */}
      <Suspense fallback={null}>
        <GLBOrgan
          organId="SMALL_INTESTINE"
          glbPath="/models/small_intestine.glb"
          position={R.SMALL_INTESTINE.position}
          scale={R.SMALL_INTESTINE.scale}
          rotation={R.SMALL_INTESTINE.rotation}
          layer="digestive"
          defaultColor={R.SMALL_INTESTINE.defaultColor}
          defaultOpacity={R.SMALL_INTESTINE.defaultOpacity}
        />
      </Suspense>

      {/* ── 16. LEFT KIDNEY ── */}
      <Suspense fallback={null}>
        <GLBOrgan
          organId="KIDNEY_LEFT"
          glbPath="/models/kidney_left.glb"
          position={R.KIDNEY_LEFT.position}
          scale={R.KIDNEY_LEFT.scale}
          rotation={R.KIDNEY_LEFT.rotation}
          layer="organs"
          defaultColor={R.KIDNEY_LEFT.defaultColor}
          defaultOpacity={R.KIDNEY_LEFT.defaultOpacity}
        />
      </Suspense>

      {/* ── 17. RIGHT KIDNEY ── */}
      <Suspense fallback={null}>
        <GLBOrgan
          organId="KIDNEY_RIGHT"
          glbPath="/models/kidney_right.glb"
          position={R.KIDNEY_RIGHT.position}
          scale={R.KIDNEY_RIGHT.scale}
          rotation={R.KIDNEY_RIGHT.rotation}
          layer="organs"
          defaultColor={R.KIDNEY_RIGHT.defaultColor}
          defaultOpacity={R.KIDNEY_RIGHT.defaultOpacity}
        />
      </Suspense>

      {/* ── 18. LEFT URETER ── */}
      <Suspense fallback={null}>
        <GLBOrgan
          organId="URETER_LEFT"
          glbPath="/models/ureter_left.glb"
          position={R.URETER_LEFT.position}
          scale={R.URETER_LEFT.scale}
          rotation={R.URETER_LEFT.rotation}
          layer="urinary"
          defaultColor={R.URETER_LEFT.defaultColor}
          defaultOpacity={R.URETER_LEFT.defaultOpacity}
          pulseOnDisease={false}
        />
      </Suspense>

      {/* ── 19. RIGHT URETER ── */}
      <Suspense fallback={null}>
        <GLBOrgan
          organId="URETER_RIGHT"
          glbPath="/models/ureter_right.glb"
          position={R.URETER_RIGHT.position}
          scale={R.URETER_RIGHT.scale}
          rotation={R.URETER_RIGHT.rotation}
          layer="urinary"
          defaultColor={R.URETER_RIGHT.defaultColor}
          defaultOpacity={R.URETER_RIGHT.defaultOpacity}
          pulseOnDisease={false}
        />
      </Suspense>

      {/* ── 20. URINARY BLADDER ── */}
      <Suspense fallback={null}>
        <GLBOrgan
          organId="URINARY_BLADDER"
          glbPath="/models/urinary_bladder.glb"
          position={R.URINARY_BLADDER.position}
          scale={R.URINARY_BLADDER.scale}
          rotation={R.URINARY_BLADDER.rotation}
          layer="urinary"
          defaultColor={R.URINARY_BLADDER.defaultColor}
          defaultOpacity={R.URINARY_BLADDER.defaultOpacity}
        />
      </Suspense>

      {/* ── 21-22. BREAST TISSUE (procedural, sex-conditional) ── */}
      <BreastStructure
        id="BREAST_LEFT"
        position={R.BREAST_LEFT.position}
        isFemale={isFemale}
      />
      <BreastStructure
        id="BREAST_RIGHT"
        position={R.BREAST_RIGHT.position}
        isFemale={isFemale}
      />

      {/* ── 23. LESION MARKER ── */}
      <LesionMarker />

      {/* ── 24. FLOATING LABELS (shown on hover/selection/disease) ── */}
      {Object.keys(ANATOMY_REGISTRY).map((id) => (
        <AnatomyLabel key={id} anatomyId={id} />
      ))}
    </group>
  );
}
