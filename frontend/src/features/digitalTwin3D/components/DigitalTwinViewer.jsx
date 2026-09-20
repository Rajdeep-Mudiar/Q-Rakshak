import React, { useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import AnatomyModel from './AnatomyModel';
import CameraControls from './CameraControls';
import ErrorBoundary from './ErrorBoundary';
import { useTwinStore } from '../store/twinStore';
import {
  RotateCcw, Eye, Maximize2, Minimize2,
  Crosshair, Layers, Heart, Brain, Wind, Activity
} from 'lucide-react';

export default function DigitalTwinViewer({ canvasRef, compact = false }) {
  const setCameraAction    = useTwinStore((s) => s.setCameraAction);
  const selectedAnatomy    = useTwinStore((s) => s.selectedAnatomy);
  const setSelectedAnatomy = useTwinStore((s) => s.setSelectedAnatomy);
  const xrayMode           = useTwinStore((s) => s.xrayMode);
  const setXrayMode        = useTwinStore((s) => s.setXrayMode);
  const layers             = useTwinStore((s) => s.layers);
  const toggleLayer        = useTwinStore((s) => s.toggleLayer);

  const containerRef = useRef();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const cameraPresets = compact ? ['Front', 'Top'] : ['Front', 'Back', 'Left', 'Right', 'Top'];

  return (
    <ErrorBoundary>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          userSelect: 'none',
          background: 'radial-gradient(circle at 50% 35%, #151f38 0%, #0a0f1d 55%, #050811 100%)'
        }}
      >
        {/* 3D WebGL Canvas */}
        <Canvas
          ref={canvasRef}
          gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
            }, false);
          }}
          camera={{ position: [0, 0.38, 2.35], fov: compact ? 48 : 44, near: 0.05, far: 60 }}
          shadows
          style={{ width: '100%', height: '100%', cursor: 'grab' }}
        >
          {/* Subtle atmospheric fog */}
          <fog attach="fog" args={['#0a0f1d', 6, 25]} />

          {/* Futuristic Medical Studio Lighting */}
          <ambientLight intensity={1.3} color="#e0f2fe" />
          
          {/* Key Light (Front-Right Pure White) */}
          <directionalLight position={[4, 6, 4]} intensity={2.2} color="#ffffff" castShadow shadow-mapSize={[1024, 1024]} />
          
          {/* Cyan Rim Light (Back-Left Holographic Glow) */}
          <directionalLight position={[-4, 5, -4]} intensity={1.8} color="#38bdf8" />
          
          {/* Indigo/Violet Fill Light (Bottom Up) */}
          <directionalLight position={[0, -3, 3]} intensity={0.9} color="#818cf8" />
          
          {/* Core Spotlight */}
          <pointLight position={[0, 0.4, 2.0]} intensity={1.5} color="#ffffff" distance={7} />

          {/* Holographic Glowing Floor Ring & Grid */}
          <gridHelper
            args={[5, 20, '#0284c7', '#1e293b']}
            position={[0, -0.92, 0]}
          />

          <Suspense fallback={null}>
            <AnatomyModel />
          </Suspense>
          <CameraControls />
        </Canvas>

        {/* ── Floating Top HUD Toolbar ── */}
        <div className={`dt-floating-hud-top ${compact ? 'compact' : ''}`}>
          {/* Left: Camera Orientation Presets */}
          <div className="dt-hud-group">
            {cameraPresets.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setCameraAction(label.toLowerCase())}
                className="dt-hud-btn"
                title={`View from ${label}`}
              >
                {label}
              </button>
            ))}
            <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
            <button
              type="button"
              onClick={() => setCameraAction('reset')}
              title="Reset 3D Camera"
              className="dt-hud-btn"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <RotateCcw size={12} />
            </button>
          </div>

          {/* Right: X-Ray & Fullscreen */}
          <div className="dt-hud-group">
            <button
              type="button"
              onClick={() => setXrayMode(!xrayMode)}
              className={`dt-hud-btn ${xrayMode ? 'active' : ''}`}
              title="Toggle Anatomical X-Ray Transparency"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Eye size={12} color={xrayMode ? '#93C5FD' : '#CBD5E1'} />
              <span>{compact ? (xrayMode ? 'X-Ray' : 'Solid') : `X-Ray ${xrayMode ? 'ON' : 'OFF'}`}</span>
            </button>

            {!compact && (
              <>
                <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="dt-hud-btn"
                  title="Toggle Fullscreen 3D View"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Floating Bottom Center: Quick Anatomical Layer Dock ── */}
        {!compact && (
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 15,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
            }}
          >
            {[
              { id: 'organs', label: 'Organs' },
              { id: 'skeleton', label: 'Skeleton' },
              { id: 'vessels', label: 'Vessels' },
              { id: 'airway', label: 'Airway' },
              { id: 'digestive', label: 'Digestive' },
              { id: 'urinary', label: 'Urinary' },
              { id: 'skin', label: 'Skin' },
            ].map((layer) => {
              const active = layers[layer.id] !== false;
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => toggleLayer(layer.id)}
                  style={{
                    padding: '4px 9px',
                    fontSize: '0.64rem',
                    fontFamily: 'var(--dt-font-sans)',
                    fontWeight: active ? 700 : 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    border: 'none',
                    borderRadius: '4px',
                    background: active ? 'rgba(37, 99, 235, 0.45)' : 'transparent',
                    color: active ? '#FFFFFF' : '#94A3B8',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                >
                  {layer.label}
                </button>
              );
            })}
          </div>
        )}

      </div>
    </ErrorBoundary>
  );
}
