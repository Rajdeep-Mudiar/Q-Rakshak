import React, { useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTwinStore } from '../store/twinStore';
import { computeVisualizationState } from '../visualization/visualizationEngine';

// Preload the GLB asset
useGLTF.preload('/models/lungs.glb');

export function GLBLungs({ position = [0.0, 0.42, 0.0], scale = [0.21, 0.20, 0.21] }) {
  const groupRef = useRef();
  const { scene } = useGLTF('/models/lungs.glb');

  const selectedAnatomy = useTwinStore((state) => state.selectedAnatomy);
  const hoveredAnatomy = useTwinStore((state) => state.hoveredAnatomy);
  const involvementMap = useTwinStore((state) => state.involvementMap);
  const xrayMode = useTwinStore((state) => state.xrayMode);
  const layers = useTwinStore((state) => state.layers);
  const setSelectedAnatomy = useTwinStore((state) => state.setSelectedAnatomy);
  const setHoveredAnatomy = useTwinStore((state) => state.setHoveredAnatomy);

  const leftInvolvement = involvementMap.LUNG_LEFT || 0;
  const rightInvolvement = involvementMap.LUNG_RIGHT || 0;
  const maxInvolvement = Math.max(leftInvolvement, rightInvolvement);

  const isSelected = selectedAnatomy === 'LUNG_LEFT' || selectedAnatomy === 'LUNG_RIGHT';
  const isHovered = hoveredAnatomy === 'LUNG_LEFT' || hoveredAnatomy === 'LUNG_RIGHT';
  const isLayerVisible = layers.organs !== false;
  const diseaseOverlayActive = layers.diseaseOverlay && maxInvolvement > 0;

  // Compute visual state & disease color
  const vizState = useMemo(() => {
    return computeVisualizationState('LUNG_RIGHT', maxInvolvement);
  }, [maxInvolvement]);

  const baseColor = useMemo(() => {
    if (diseaseOverlayActive) {
      return vizState.hexColor;
    }
    return '#38bdf8';
  }, [diseaseOverlayActive, vizState.hexColor]);

  const finalOpacity = useMemo(() => {
    if (xrayMode) {
      return maxInvolvement > 0 ? 0.95 : 0.50;
    }
    return 0.88;
  }, [xrayMode, maxInvolvement]);

  // Clone scene & apply interactive shaders
  const { clonedScene, lungsMaterial } = useMemo(() => {
    const cloned = scene.clone(true);
    let originalMat = null;

    cloned.traverse((child) => {
      if (child.isMesh && child.material) {
        originalMat = child.material;
      }
    });

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(baseColor),
      map: originalMat?.map || null,
      normalMap: originalMat?.normalMap || null,
      roughness: 0.40,
      metalness: 0.10,
      transparent: xrayMode || finalOpacity < 1.0,
      opacity: finalOpacity,
      side: THREE.DoubleSide
    });

    cloned.traverse((child) => {
      if (child.isMesh) {
        child.material = mat;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return { clonedScene: cloned, lungsMaterial: mat };
  }, [scene, baseColor, finalOpacity, xrayMode]);

  // Dynamic emissive pulse animation
  useFrame((state) => {
    if (!lungsMaterial) return;
    const time = state.clock.getElapsedTime();

    if (diseaseOverlayActive) {
      const glow = Math.sin(time * vizState.pulseSpeed) * 0.25 + 0.75;
      lungsMaterial.emissive.set(vizState.emissiveColor);
      lungsMaterial.emissiveIntensity = vizState.emissiveIntensity * glow;
    } else if (isHovered) {
      lungsMaterial.emissive.set('#38bdf8');
      lungsMaterial.emissiveIntensity = 0.5;
    } else if (isSelected) {
      lungsMaterial.emissive.set('#0284c7');
      lungsMaterial.emissiveIntensity = 0.4;
    } else {
      lungsMaterial.emissive.set('#000000');
      lungsMaterial.emissiveIntensity = 0;
    }
  });

  if (!isLayerVisible) return null;

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedAnatomy(rightInvolvement >= leftInvolvement ? 'LUNG_RIGHT' : 'LUNG_LEFT');
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredAnatomy('LUNG_RIGHT');
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (hoveredAnatomy === 'LUNG_RIGHT' || hoveredAnatomy === 'LUNG_LEFT') {
          setHoveredAnatomy(null);
        }
        document.body.style.cursor = 'default';
      }}
    >
      <primitive object={clonedScene} />

      {/* Selected Indicator Outline */}
      {isSelected && (
        <mesh scale={1.12}>
          <boxGeometry args={[0.9, 1.05, 0.3]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.55} />
        </mesh>
      )}
    </group>
  );
}
