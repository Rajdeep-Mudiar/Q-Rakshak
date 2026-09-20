import React, { useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTwinStore } from '../store/twinStore';
import { computeVisualizationState } from '../visualization/visualizationEngine';

const normalizeGLBScene = (source) => {
  const cloned = source.clone(true);
  const box = new THREE.Box3().setFromObject(cloned);
  const center = box.getCenter(new THREE.Vector3());
  cloned.position.sub(center);
  return cloned;
};

/**
 * GLBOrgan — Universal reusable GLB organ component.
 *
 * Handles disease overlay coloring, x-ray transparency, hover/select glow,
 * emissive pulse animation, and layer visibility.
 */
export function GLBOrgan({
  organId,
  glbPath,
  position,
  scale,
  rotation = [0, 0, 0],
  layer = 'organs',
  defaultColor = '#94a3b8',
  defaultOpacity = 0.9,
  pulseOnDisease = true,
  selectionOutlineScale = 1.18
}) {
  const groupRef = useRef();
  const { scene } = useGLTF(glbPath);

  const selectedAnatomy = useTwinStore((s) => s.selectedAnatomy);
  const hoveredAnatomy = useTwinStore((s) => s.hoveredAnatomy);
  const involvementMap = useTwinStore((s) => s.involvementMap);
  const xrayMode = useTwinStore((s) => s.xrayMode);
  const xrayIntensity = useTwinStore((s) => s.xrayIntensity);
  const layers = useTwinStore((s) => s.layers);
  const patientMode = useTwinStore((s) => s.patientMode);
  const setSelectedAnatomy = useTwinStore((s) => s.setSelectedAnatomy);
  const setHoveredAnatomy = useTwinStore((s) => s.setHoveredAnatomy);

  const isSelected = selectedAnatomy === organId;
  const isHovered = hoveredAnatomy === organId;
  const percentage = involvementMap[organId] || 0;
  const isLayerVisible = layers[layer] !== false;
  const diseaseOverlayActive = layers.diseaseOverlay && percentage > 0 && patientMode !== 'idle';

  const vizState = useMemo(() => computeVisualizationState(organId, percentage), [organId, percentage]);

  const baseColor = useMemo(() => {
    if (diseaseOverlayActive) return vizState.hexColor;
    return defaultColor;
  }, [diseaseOverlayActive, vizState.hexColor, defaultColor]);

  const finalOpacity = useMemo(() => {
    if (xrayMode) {
      const xrayBase = layer === 'skeleton' ? 0.18 : layer === 'airway' ? 0.5 : 0.38;
      return diseaseOverlayActive ? 0.92 : xrayBase * (1 - xrayIntensity * 0.4);
    }
    return defaultOpacity;
  }, [xrayMode, xrayIntensity, layer, diseaseOverlayActive, defaultOpacity]);

  const { clonedScene, material } = useMemo(() => {
    const cloned = normalizeGLBScene(scene);
    let origMat = null;

    cloned.traverse((child) => {
      if (child.isMesh && child.material && !origMat) origMat = child.material;
    });

    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(baseColor),
      map: origMat?.map || null,
      normalMap: origMat?.normalMap || null,
      roughnessMap: origMat?.roughnessMap || null,
      roughness: layer === 'skeleton' ? 0.25 : 0.35,
      metalness: layer === 'skeleton' ? 0.14 : 0.08,
      clearcoat: 0.25,
      clearcoatRoughness: 0.6,
      transparent: true,
      opacity: finalOpacity,
      side: THREE.DoubleSide,
      depthWrite: finalOpacity >= 0.25,
      depthTest: true,
      toneMapped: true,
      emissive: new THREE.Color('#000000'),
      emissiveIntensity: 0
    });

    cloned.traverse((child) => {
      if (child.isMesh) {
        child.material = mat;
        child.castShadow = true;
        child.receiveShadow = true;
        child.renderOrder = layer === 'skeleton' ? 18 : 25;
      }
    });

    return { clonedScene: cloned, material: mat };
  }, [scene, baseColor, finalOpacity, layer]);

  useFrame((state) => {
    if (!material) return;
    const time = state.clock.getElapsedTime();

    if (diseaseOverlayActive && pulseOnDisease) {
      const glow = Math.sin(time * vizState.pulseSpeed) * 0.25 + 0.75;
      material.emissive.set(vizState.emissiveColor);
      material.emissiveIntensity = vizState.emissiveIntensity * glow;
    } else if (isHovered) {
      material.emissive.set('#38bdf8');
      material.emissiveIntensity = 0.55;
    } else if (isSelected) {
      material.emissive.set('#0284c7');
      material.emissiveIntensity = 0.45;
    } else {
      material.emissive.set('#000000');
      material.emissiveIntensity = 0;
    }

    material.opacity = finalOpacity;
    material.transparent = true;
    material.needsUpdate = true;
  });

  if (!isLayerVisible) return null;

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedAnatomy(organId);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredAnatomy(organId);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (hoveredAnatomy === organId) setHoveredAnatomy(null);
        document.body.style.cursor = 'default';
      }}
    >
      <primitive object={clonedScene} />

      {/* Selected Indicator Outline */}
      {isSelected && (
        <mesh scale={selectionOutlineScale}>
          <boxGeometry args={[0.35, 0.35, 0.35]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}
