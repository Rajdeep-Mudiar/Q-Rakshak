import React, { useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTwinStore } from '../store/twinStore';
import { computeVisualizationState } from '../visualization/visualizationEngine';

// Preload the GLB asset
useGLTF.preload('/models/heart.glb');

export function GLBHeart({ position = [-0.030, 0.42, 0.03], scale = [0.11, 0.11, 0.11] }) {
  const groupRef = useRef();
  const { scene } = useGLTF('/models/heart.glb');

  const selectedAnatomy = useTwinStore((state) => state.selectedAnatomy);
  const hoveredAnatomy = useTwinStore((state) => state.hoveredAnatomy);
  const involvementMap = useTwinStore((state) => state.involvementMap);
  const xrayMode = useTwinStore((state) => state.xrayMode);
  const layers = useTwinStore((state) => state.layers);
  const setSelectedAnatomy = useTwinStore((state) => state.setSelectedAnatomy);
  const setHoveredAnatomy = useTwinStore((state) => state.setHoveredAnatomy);

  const isSelected = selectedAnatomy === 'HEART';
  const isHovered = hoveredAnatomy === 'HEART';
  const percentage = involvementMap.HEART || 0;
  const isLayerVisible = layers.organs !== false;
  const diseaseOverlayActive = layers.diseaseOverlay && percentage > 0;

  // Compute visual state & disease color
  const vizState = useMemo(() => {
    return computeVisualizationState('HEART', percentage);
  }, [percentage]);

  const baseColor = useMemo(() => {
    if (diseaseOverlayActive) {
      return vizState.hexColor;
    }
    return '#dc2626';
  }, [diseaseOverlayActive, vizState.hexColor]);

  const finalOpacity = useMemo(() => {
    if (xrayMode) {
      return percentage > 0 ? 0.95 : 0.55;
    }
    return 0.95;
  }, [xrayMode, percentage]);

  // Clone scene & apply interactive shaders
  const { clonedScene, heartMaterial } = useMemo(() => {
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
      roughness: 0.35,
      metalness: 0.15,
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

    return { clonedScene: cloned, heartMaterial: mat };
  }, [scene, baseColor, finalOpacity, xrayMode]);

  // Pulsatile cardiac contraction & emissive glow
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const speed = diseaseOverlayActive ? 4.2 : 1.8;
    const pulse = 1.0 + Math.sin(time * speed) * (diseaseOverlayActive ? 0.07 : 0.03);
    groupRef.current.scale.set(scale[0] * pulse, scale[1] * pulse, scale[2] * pulse);

    if (heartMaterial) {
      if (diseaseOverlayActive) {
        const glow = Math.sin(time * vizState.pulseSpeed) * 0.25 + 0.75;
        heartMaterial.emissive.set(vizState.emissiveColor);
        heartMaterial.emissiveIntensity = vizState.emissiveIntensity * glow;
      } else if (isHovered) {
        heartMaterial.emissive.set('#38bdf8');
        heartMaterial.emissiveIntensity = 0.5;
      } else if (isSelected) {
        heartMaterial.emissive.set('#0284c7');
        heartMaterial.emissiveIntensity = 0.4;
      } else {
        heartMaterial.emissive.set('#000000');
        heartMaterial.emissiveIntensity = 0;
      }
    }
  });

  if (!isLayerVisible) return null;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0.08, 0.15, -0.15]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedAnatomy('HEART');
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredAnatomy('HEART');
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (hoveredAnatomy === 'HEART') setHoveredAnatomy(null);
        document.body.style.cursor = 'default';
      }}
    >
      <primitive object={clonedScene} />

      {/* Selected Indicator Outline */}
      {isSelected && (
        <mesh scale={1.15}>
          <sphereGeometry args={[0.55, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}
