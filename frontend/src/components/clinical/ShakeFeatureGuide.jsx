import React, { useState } from 'react';
import {
  Smartphone, Siren, PhoneCall, Zap, ShieldAlert,
  CheckCircle2, Sparkles, AlertTriangle, ArrowRight, Play
} from 'lucide-react';

export default function ShakeFeatureGuide({ onTriggerShake, onRequestPermission, permissionState, isSupported }) {
  const [isHovered, setIsHovered] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const handleSimulate = async () => {
    setSimulating(true);
    if (onRequestPermission) {
      await onRequestPermission();
    }
    if (navigator.vibrate) {
      try {
        navigator.vibrate([100, 50, 100, 50, 200]);
      } catch (e) {
        // ignore vibration failures
      }
    }
    setTimeout(() => {
      setSimulating(false);
      if (onTriggerShake) {
        onTriggerShake();
      }
    }, 600);
  };

  return (
    <div
      className="triage-sexy-card shake-feature-guide-container"
      style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        border: '1px solid #E2E8F0',
        borderRadius: '18px',
        boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes phoneVibe {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          15% { transform: translate(-6px, -2px) rotate(-4deg); }
          30% { transform: translate(6px, 3px) rotate(4deg); }
          45% { transform: translate(-5px, 2px) rotate(-3deg); }
          60% { transform: translate(5px, -2px) rotate(3deg); }
          75% { transform: translate(-3px, 1px) rotate(-1.5deg); }
          90% { transform: translate(3px, -1px) rotate(1.5deg); }
        }

        @keyframes wavePulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.3; }
          100% { transform: scale(1.3); opacity: 0; }
        }

        @keyframes beaconGlow {
          0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 4px rgba(220, 38, 38, 0.4)); }
          50% { opacity: 1; filter: drop-shadow(0 0 14px rgba(220, 38, 38, 0.8)); }
        }

        .phone-shake-animated {
          animation: phoneVibe 1.2s ease-in-out infinite;
          transform-origin: 50% 50%;
        }

        .phone-shake-interactive:hover .phone-shake-animated {
          animation: phoneVibe 0.5s ease-in-out infinite;
        }

        .pulse-ring-1 {
          animation: wavePulse 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
          transform-origin: center;
        }

        .pulse-ring-2 {
          animation: wavePulse 2s cubic-bezier(0.25, 1, 0.5, 1) 0.6s infinite;
          transform-origin: center;
        }

        .shake-steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        @media (max-width: 768px) {
          .shake-intro-hero {
            flex-direction: column !important;
            text-align: center !important;
          }
          .shake-intro-svg-box {
            margin: 0 auto 12px auto !important;
          }
          .shake-steps-grid {
            grid-template-columns: 1fr !important;
          }
          .shake-guide-actions {
            flex-direction: column !important;
            width: 100% !important;
          }
          .shake-guide-actions button {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>

      {/* Header Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
            }}
          >
            <Smartphone size={17} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0, color: '#0F172A', letterSpacing: '-0.01em' }}>
              Motion Sensor SOS • Shake to Emergency Dial
            </h3>
            <span style={{ fontSize: '0.70rem', color: '#64748B' }}>
              Instant distress trigger for physical emergency response
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '0.66rem',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: '999px',
              background: permissionState === 'denied' ? '#FEF2F2' : '#ECFDF5',
              color: permissionState === 'denied' ? '#DC2626' : '#059669',
              border: `1px solid ${permissionState === 'denied' ? '#FECACA' : '#A7F3D0'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: permissionState === 'denied' ? '#DC2626' : '#10B981',
              }}
            />
            {permissionState === 'denied'
              ? 'Sensor Blocked'
              : isSupported
              ? 'Accelerometer Active'
              : 'Sensor Ready / Standby'}
          </span>
        </div>
      </div>

      {/* Main Feature Intro: SVG Visual + Description */}
      <div
        className="shake-intro-hero phone-shake-interactive"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '18px',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Rich Animated Vector SVG Illustration */}
        <div
          className="shake-intro-svg-box"
          style={{
            flexShrink: 0,
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle at center, #F1F5F9 0%, #FFFFFF 70%)',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: 'pointer',
          }}
          onClick={handleSimulate}
          title="Click to preview shake trigger"
        >
          <svg
            viewBox="0 0 200 200"
            width="170"
            height="170"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: 'visible' }}
          >
            {/* Background SOS Glow Rings */}
            <circle cx="100" cy="100" r="58" stroke="#FECACA" strokeWidth="2" strokeDasharray="4 4" className="pulse-ring-1" />
            <circle cx="100" cy="100" r="74" stroke="#FED7AA" strokeWidth="1.5" strokeDasharray="6 4" className="pulse-ring-2" />

            {/* Left & Right Motion Vibration Trails */}
            <g stroke="#087F8C" strokeWidth="2.5" strokeLinecap="round" opacity="0.65">
              {/* Left motion arcs */}
              <path d="M 38 75 C 32 88 32 112 38 125" />
              <path d="M 28 82 C 22 92 22 108 28 118" strokeDasharray="3 3" />
              {/* Right motion arcs */}
              <path d="M 162 75 C 168 88 168 112 162 125" stroke="#DC2626" />
              <path d="M 172 82 C 178 92 178 108 172 118" stroke="#DC2626" strokeDasharray="3 3" />
            </g>

            {/* Rotating / Shaking Smartphone Body */}
            <g className={simulating || isHovered ? 'phone-shake-animated' : 'phone-shake-animated'}>
              {/* Phone Shadow */}
              <rect x="66" y="34" width="68" height="132" rx="14" fill="#0F172A" fillOpacity="0.08" transform="translate(2, 4)" />

              {/* Phone Outer Chassis */}
              <rect x="66" y="34" width="68" height="132" rx="14" fill="#0F172A" stroke="#334155" strokeWidth="2" />

              {/* Screen Glass */}
              <rect x="70" y="38" width="60" height="124" rx="10" fill="#090D16" />

              {/* Screen Glass Header / Island */}
              <rect x="88" y="42" width="24" height="5" rx="2.5" fill="#1E293B" />

              {/* Red SOS Alert Pulse on Screen */}
              <circle cx="100" cy="86" r="22" fill="url(#sosGrad)" />
              <circle cx="100" cy="86" r="16" fill="#DC2626" style={{ animation: 'beaconGlow 1.5s ease-in-out infinite' }} />

              {/* SOS Icon / Siren Symbol on Screen */}
              <path
                d="M 95 86 L 98 80 L 105 80 L 101 85 L 105 85 L 96 94 L 98 87 Z"
                fill="#FFFFFF"
              />

              {/* SOS Screen Text */}
              <text x="100" y="118" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800" fontFamily="sans-serif" letterSpacing="0.8">
                SOS READY
              </text>
              <text x="100" y="128" textAnchor="middle" fill="#94A3B8" fontSize="5.5" fontWeight="600" fontFamily="sans-serif">
                SHAKE DETECTED
              </text>

              {/* Bottom Home Indicator */}
              <line x1="88" y1="154" x2="112" y2="154" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Subtle Gradient Definitions */}
            <defs>
              <radialGradient id="sosGrad" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* Textual Intro & Quick Walkthrough */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: 800,
                color: '#DC2626',
                background: '#FEF2F2',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid #FECACA',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Hardware Accelerometer Assist
            </span>
          </div>

          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
            How Emergency Shake Detection Works
          </h4>

          <p style={{ fontSize: '0.80rem', color: '#475569', lineHeight: 1.55, margin: '0 0 14px 0' }}>
            In high-stress medical emergencies, cardiac events, or severe physical injury, navigating phone menus can be impossible.
            Simply <strong>shake your smartphone 2–3 times</strong> to instantly trigger the Q-Rakshak Emergency Protocol and one-tap dial your primary next-of-kin or national 108 EMS.
          </p>

          <div className="shake-guide-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSimulate}
              disabled={simulating}
              className="triage-pill-btn triage-call-cta"
              style={{
                padding: '8px 16px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Play size={14} />
              <span>{simulating ? 'Detecting Shake...' : 'Simulate Shake SOS'}</span>
            </button>

            {onRequestPermission && permissionState !== 'granted' && (
              <button
                type="button"
                onClick={onRequestPermission}
                className="triage-pill-btn triage-outline-btn"
                style={{
                  padding: '8px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Zap size={14} color="#087F8C" />
                <span>Grant Motion Access</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3 Step Visual Pipeline */}
      <div className="shake-steps-grid">
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: '#E0F2FE',
                color: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.74rem',
                fontWeight: 800,
              }}
            >
              1
            </div>
            <strong style={{ fontSize: '0.82rem', color: '#0F172A' }}>Rapid Shake Motion</strong>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#64748B', margin: 0, lineHeight: 1.45 }}>
            Vigorously shake device along X/Y axes (calibrated &gt;12G threshold to prevent accidental triggers).
          </p>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: '#FEF3C7',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.74rem',
                fontWeight: 800,
              }}
            >
              2
            </div>
            <strong style={{ fontSize: '0.82rem', color: '#0F172A' }}>Zero-Lag Sensor Hook</strong>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#64748B', margin: 0, lineHeight: 1.45 }}>
            Native <code>DeviceMotionEvent</code> listener detects sudden kinetic acceleration instantaneously.
          </p>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.74rem',
                fontWeight: 800,
              }}
            >
              3
            </div>
            <strong style={{ fontSize: '0.82rem', color: '#0F172A' }}>Auto 1-Tap SOS Dialer</strong>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#64748B', margin: 0, lineHeight: 1.45 }}>
            Immediate cellular dialer overlay appears with verified contact numbers and 108 Emergency Helpline.
          </p>
        </div>
      </div>
    </div>
  );
}
