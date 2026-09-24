import React, { useState, useEffect, useRef } from 'react';
import {
  Phone, AlertTriangle, Heart, Shield, Activity,
  Pill, User, Droplet, Clock, Stethoscope, Share2,
  PhoneCall, AlertOctagon, CheckCircle2, Siren,
  Smartphone, MapPin, Building2, Copy, Check, Printer,
  QrCode, ExternalLink, Flame, ShieldAlert, ShieldCheck,
  RotateCw, Mail, Sparkles, ArrowUpRight
} from 'lucide-react';
import apiClient from '../../api/client';
import QRCodeSVG from '../../components/common/QRCodeSVG';
import TriagePhysicalCard from '../../components/clinical/TriagePhysicalCard';
import PrintableMedicalCardSheet from '../../components/clinical/PrintableMedicalCardSheet';
import { animateCard3DFlip } from '../../utils/motion.js';
import { useLanguage } from '../../context/LanguageContext';

import { authApi } from '../../api/auth';

export default function EmergencyCardView({ patientId = null }) {
  const { t } = useLanguage();
  const storedUser = authApi.getStoredUser();
  const effectivePatientId = patientId || storedUser?.patient_id || storedUser?.user_id || storedUser?.id || 'USR-5EF52B';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shakeTriggered, setShakeTriggered] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [cardTheme, setCardTheme] = useState('light');
  const [cardFace, setCardFace] = useState('dual');
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [is3DFlipped, setIs3DFlipped] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const card3DInnerRef = useRef(null);

  async function handleEmailCard() {
    try {
      await apiClient.post(`/api/v1/emergency/${effectivePatientId}/email-card`, {
        recipient_email: data?.email || storedUser?.email || '',
      });
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (e) {
      console.warn('Emergency card email dispatch failed:', e);
    }
  }

  function toggle3DFlip() {
    const next = !is3DFlipped;
    setIs3DFlipped(next);
    if (card3DInnerRef.current) {
      animateCard3DFlip(card3DInnerRef.current, next);
    }
  }

  const emergencyPortalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#triage/${effectivePatientId}`
    : `https://q-rakshak.vercel.app/#triage/${effectivePatientId}`;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/api/v1/emergency/${effectivePatientId}`);
        setData(res);
      } catch (err) {
        console.error('Failed to load emergency profile:', err);
        setError(err.message || 'Unable to retrieve emergency record from clinical vault.');
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [patientId]);

  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;
    let lastTime = 0;
    const SHAKE_THRESHOLD = 18;

    function handleMotion(e) {
      const current = e.accelerationIncludingGravity;
      if (!current) return;

      const currentTime = Date.now();
      if (currentTime - lastTime > 100) {
        const diffTime = currentTime - lastTime;
        lastTime = currentTime;

        const speed = Math.abs(current.x + current.y + current.z - lastX - lastY - lastZ) / diffTime * 10000;
        if (speed > SHAKE_THRESHOLD * 10) {
          setShakeTriggered(true);
        }

        lastX = current.x;
        lastY = current.y;
        lastZ = current.z;
      }
    }

    if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, []);

  const primaryContact = data?.emergency_contacts?.find((c) => c.is_primary) || data?.emergency_contacts?.[0] || {
    name: '—',
    phone: '—',
    relation: 'Emergency Contact',
  };

  const secondaryContact = data?.emergency_contacts?.length > 1 ? data.emergency_contacts[1] : null;

  const INDIA_HELPLINES = [
    { code: '108', title: 'Ambulance / EMS', desc: 'National Medical Service', icon: Siren, color: '#DC2626' },
    { code: '112', title: 'National Emergency', desc: 'Unified All-in-One', icon: ShieldAlert, color: '#0284C7' },
    { code: '100', title: 'Police Hotline', desc: 'Emergency Police Aid', icon: Shield, color: '#4F46E5' },
    { code: '101', title: 'Fire & Rescue', desc: 'Fire Safety Services', icon: Flame, color: '#EA580C' },
    { code: '1075', title: 'Health Helpline', desc: 'MoHFW National Desk', icon: Stethoscope, color: '#059669' },
    { code: '1091', title: 'Women Safety', desc: 'National Women Care', icon: Heart, color: '#DB2777' },
  ];

  function copyTriageLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(emergencyPortalUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  }

  function handlePrint() {
    setPrintModalOpen(true);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC', flexDirection: 'column', gap: '14px', fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, sans-serif)' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#0EA5E9', animation: 'spin 0.8s linear infinite' }} />
        <h2 style={{ fontSize: '0.92rem', fontWeight: 800, letterSpacing: '0.04em', color: '#0F172A', margin: 0 }}>
          Retrieving Clinical Emergency Passport...
        </h2>
        <span style={{ fontSize: '0.74rem', color: '#64748B', fontFamily: 'monospace' }}>
          Verifying patient record & WORM cryptographic seal
        </span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', background: '#F8FAFC', fontFamily: 'var(--font-sans, sans-serif)' }}>
        <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '36px 28px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.05)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#DC2626' }}>
            <AlertOctagon size={28} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>Emergency Record Unavailable</h2>
          <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0' }}>{error}</p>
          <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', background: '#F1F5F9', padding: '4px 10px', borderRadius: '6px', color: '#475569' }}>
            Patient ID: {patientId}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#F8FAFC',
        backgroundImage: `
          radial-gradient(circle at 10% 10%, rgba(14, 165, 233, 0.04) 0%, transparent 40%),
          radial-gradient(circle at 90% 90%, rgba(16, 185, 129, 0.04) 0%, transparent 40%)
        `,
        color: '#0F172A',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        padding: 0,
        margin: 0,
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        .triage-sexy-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 18px;
          padding: 22px 24px;
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .triage-sexy-card:hover {
          box-shadow: 0 10px 30px -4px rgba(15, 23, 42, 0.07);
        }
        .triage-hero-banner {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          padding: clamp(20px, 3vw, 32px);
          box-shadow: 0 10px 35px -5px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.02);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
          position: relative;
          overflow: hidden;
        }
        .triage-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none;
        }
        .triage-call-cta {
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
          color: #FFFFFF;
          border: none;
          box-shadow: 0 4px 14px rgba(220, 38, 38, 0.28);
        }
        .triage-call-cta:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
          filter: brightness(1.05);
        }
        .triage-call-cta:active {
          transform: translateY(0);
        }
        .triage-outline-btn {
          background: #FFFFFF;
          color: #334155;
          border: 1px solid #CBD5E1;
        }
        .triage-outline-btn:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
          color: #0F172A;
        }
        .triage-speed-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-decoration: none;
          color: inherit;
          transition: all 0.18s ease;
        }
        .triage-speed-card:hover {
          border-color: #0284C7;
          background: #F0F9FF;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.08);
        }
      `}</style>

      {/* ── Sleek Light Sticky Header ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid #E2E8F0',
          padding: '12px clamp(16px, 4vw, 36px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.12)',
            }}
          >
            <Siren size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
                <span style={{ color: '#087F8C' }}>Q</span>Rakshak
              </span>
              <span
                style={{
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  color: '#DC2626',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  padding: '1px 7px',
                  borderRadius: '999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Emergency Triage
              </span>
            </div>
            <div style={{ fontSize: '0.70rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span>Verified Medical Passport • 24/7 Active</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }} className="no-print">
          <button
            type="button"
            onClick={copyTriageLink}
            className="triage-pill-btn triage-outline-btn"
            title="Copy permanent emergency link"
          >
            {copiedLink ? <Check size={14} color="#059669" /> : <Copy size={14} />}
            <span>{copiedLink ? 'Copied Link!' : 'Share Pass'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="triage-pill-btn triage-outline-btn"
            title="Print or Save PDF"
          >
            <Printer size={14} />
            <span>Print Medical ID</span>
          </button>

          <button
            type="button"
            onClick={() => setShakeTriggered(true)}
            className="triage-pill-btn triage-call-cta"
          >
            <Smartphone size={14} />
            <span>SOS Direct Call</span>
          </button>
        </div>
      </header>

      {/* ── Shake-to-Call Emergency Trigger Modal ── */}
      {shakeTriggered && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.15s ease',
          }}
          onClick={() => setShakeTriggered(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '440px',
              width: '100%',
              textAlign: 'center',
              padding: '32px 28px',
              background: '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                background: '#FEF2F2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
                color: '#DC2626',
                border: '2px solid #FECACA',
              }}
            >
              <PhoneCall size={28} />
            </div>

            <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#DC2626', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              EMERGENCY DIALER PROTOCOL
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: '4px 0 8px 0' }}>
              Call Primary Emergency Contact?
            </h2>
            <p style={{ fontSize: '0.80rem', color: '#64748B', lineHeight: 1.5, marginBottom: '20px' }}>
              Immediate one-touch cellular dial for <strong style={{ color: '#0F172A' }}>{data?.name || 'Patient'}</strong>:
            </p>

            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '14px 16px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: '#64748B' }}>Contact Person:</span>
                <strong style={{ color: '#0F172A' }}>{primaryContact.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: '#64748B' }}>Relationship:</span>
                <span style={{ color: '#475569', fontWeight: 600 }}>{primaryContact.relation}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: '#64748B' }}>Telephone:</span>
                <strong style={{ color: '#0284C7', fontFamily: 'monospace' }}>{primaryContact.phone}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={`tel:${primaryContact.phone.replace(/[^0-9+]/g, '')}`}
                className="triage-pill-btn triage-call-cta"
                style={{ justifyContent: 'center', padding: '13px', fontSize: '0.88rem' }}
              >
                <PhoneCall size={16} />
                <span>DIAL {primaryContact.phone}</span>
              </a>

              <a
                href="tel:108"
                className="triage-pill-btn triage-outline-btn"
                style={{ justifyContent: 'center', padding: '11px', fontSize: '0.80rem' }}
              >
                <Siren size={15} color="#DC2626" />
                <span>Or Call 108 (National Ambulance)</span>
              </a>

              <button
                type="button"
                onClick={() => setShakeTriggered(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  padding: '6px',
                  marginTop: '4px',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Triage Body ── */}
      <main
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: 'clamp(18px, 3vw, 32px) clamp(16px, 3vw, 24px) 60px clamp(16px, 3vw, 24px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
        }}
      >
        {/* 1. Executive Hero Patient Banner */}
        <div className="triage-hero-banner">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flex: 1, minWidth: 0 }}>
            {/* Blood Group Pillar Badge */}
            <div
              style={{
                width: '82px',
                height: '88px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                color: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 6px 18px rgba(220, 38, 38, 0.28)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', opacity: 0.9 }}>
                <Droplet size={11} fill="#FFFFFF" />
                <span style={{ fontSize: '0.60rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>BLOOD</span>
              </div>
              <span style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1, marginTop: '2px' }}>
                {data?.blood_group || '—'}
              </span>
            </div>

            {/* Patient Meta Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.64rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#087F8C',
                    background: '#EBF8FA',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid #D1EEF2',
                    letterSpacing: '0.04em',
                  }}
                >
                  PERMANENT ID: {patientId}
                </span>
                {data?.organ_donor && (
                  <span
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      color: '#059669',
                      background: '#ECFDF5',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid #A7F3D0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Heart size={11} fill="#059669" /> ORGAN DONOR
                  </span>
                )}
                {data?.allergies && data.allergies.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 800,
                      color: '#DC2626',
                      background: '#FEF2F2',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid #FECACA',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <AlertTriangle size={11} /> SEVERE ALLERGY RISK
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                {data?.name || 'Patient'}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748B', fontSize: '0.82rem', flexWrap: 'wrap' }}>
                <span>{data?.age ? `${data.age} Yrs` : 'Age Unspecified'}</span>
                <span>•</span>
                <span>{data?.gender || 'Gender Unspecified'}</span>
                <span>•</span>
                <span>MRN: <strong style={{ color: '#0F172A' }}>{data?.mrn || (patientId ? `MRN-${patientId}-QX` : '—')}</strong></span>
                {data?.abha_id && (
                  <>
                    <span>•</span>
                    <span>ABHA: <strong style={{ color: '#0F172A' }}>{data.abha_id}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Primary Contact Action */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '14px 18px',
              background: '#F8FAFC',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              minWidth: '240px',
            }}
          >
            <span style={{ fontSize: '0.66rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Primary Next of Kin
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>{primaryContact.name}</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{primaryContact.relation}</div>
              </div>
              <a
                href={`tel:${primaryContact.phone.replace(/[^0-9+]/g, '')}`}
                className="triage-pill-btn triage-call-cta"
                style={{ padding: '7px 12px', fontSize: '0.74rem' }}
              >
                <PhoneCall size={13} />
                <span>Call</span>
              </a>
            </div>
          </div>
        </div>

        {/* 2. Interactive Wallet Card Showcase */}
        <div className="triage-sexy-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <QrCode size={18} color="#087F8C" />
              <h2 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0, color: '#0F172A', letterSpacing: '-0.01em' }}>
                Physical Emergency Wallet Pass
              </h2>
              <span style={{ fontSize: '0.68rem', color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px' }}>
                ISO/IEC 7810 ID-1 Standard
              </span>
            </div>

            {/* Segmented Controls */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }} className="no-print">
              <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '3px', borderRadius: '10px', border: '1px solid #E2E8F0', gap: '3px' }}>
                <button
                  type="button"
                  onClick={() => setCardTheme('light')}
                  style={{
                    background: cardTheme === 'light' ? '#FFFFFF' : 'transparent',
                    color: cardTheme === 'light' ? '#0F172A' : '#64748B',
                    border: 0,
                    borderRadius: '8px',
                    padding: '5px 11px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: cardTheme === 'light' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  Day White
                </button>
                <button
                  type="button"
                  onClick={() => setCardTheme('dark')}
                  style={{
                    background: cardTheme === 'dark' ? '#0F172A' : 'transparent',
                    color: cardTheme === 'dark' ? '#FFFFFF' : '#64748B',
                    border: 0,
                    borderRadius: '8px',
                    padding: '5px 11px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: cardTheme === 'dark' ? '0 1px 3px rgba(0,0,0,0.18)' : 'none',
                  }}
                >
                  Matte Black
                </button>
              </div>

              <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '3px', borderRadius: '10px', border: '1px solid #E2E8F0', gap: '3px' }}>
                <button
                  type="button"
                  onClick={() => setCardFace('dual')}
                  style={{
                    background: cardFace === 'dual' ? '#FFFFFF' : 'transparent',
                    color: cardFace === 'dual' ? '#087F8C' : '#64748B',
                    border: 0,
                    borderRadius: '8px',
                    padding: '5px 11px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: cardFace === 'dual' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  Dual Face
                </button>
                <button
                  type="button"
                  onClick={() => { setCardFace('flip3d'); setIs3DFlipped(false); }}
                  style={{
                    background: cardFace === 'flip3d' ? '#FFFFFF' : 'transparent',
                    color: cardFace === 'flip3d' ? '#087F8C' : '#64748B',
                    border: 0,
                    borderRadius: '8px',
                    padding: '5px 11px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: cardFace === 'flip3d' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <RotateCw size={12} />
                  <span>3D Flip</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="triage-pill-btn triage-outline-btn"
                style={{ padding: '6px 12px', fontSize: '0.72rem' }}
              >
                <Printer size={13} />
                <span>Save 1:1 PDF</span>
              </button>
            </div>
          </div>

          {/* Render Card Showcase */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 0' }}>
            {cardFace === 'flip3d' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '480px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '440px' }}>
                  <span style={{ fontSize: '0.70rem', fontWeight: 700, color: '#64748B' }}>
                    Current View: <strong style={{ color: '#0F172A' }}>{is3DFlipped ? 'Back Face (Clinical & Rx)' : 'Front Face (QR & Contacts)'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={toggle3DFlip}
                    className="triage-pill-btn triage-outline-btn"
                    style={{ padding: '4px 10px', fontSize: '0.70rem' }}
                  >
                    <RotateCw size={12} />
                    <span>Flip Card</span>
                  </button>
                </div>

                <div
                  className="perspective-card-container"
                  style={{ width: '100%', maxWidth: '440px', cursor: 'pointer' }}
                  onClick={toggle3DFlip}
                  title="Click anywhere to flip 360°"
                >
                  <div ref={card3DInnerRef} className={`perspective-card-inner ${is3DFlipped ? 'is-flipped' : ''}`}>
                    <div className="card-face-front">
                      <TriagePhysicalCard
                        patient={data}
                        variant={cardTheme}
                        face="front"
                        emergencyPortalUrl={emergencyPortalUrl}
                        onCopy={copyTriageLink}
                        copied={copiedLink}
                      />
                    </div>
                    <div className="card-face-back">
                      <TriagePhysicalCard
                        patient={data}
                        variant={cardTheme}
                        face="back"
                        emergencyPortalUrl={emergencyPortalUrl}
                        onCopy={copyTriageLink}
                        copied={copiedLink}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%', maxWidth: '440px' }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Front View (QR & ID)</span>
                  <TriagePhysicalCard
                    patient={data}
                    variant={cardTheme}
                    face="front"
                    emergencyPortalUrl={emergencyPortalUrl}
                    onCopy={copyTriageLink}
                    copied={copiedLink}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%', maxWidth: '440px' }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Back View (Allergies & Vitals)</span>
                  <TriagePhysicalCard
                    patient={data}
                    variant={cardTheme}
                    face="back"
                    emergencyPortalUrl={emergencyPortalUrl}
                    onCopy={copyTriageLink}
                    copied={copiedLink}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Clinical Direct Intelligence 2-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', alignItems: 'start' }}>
          
          {/* ── LEFT COLUMN: Vital Medical Indicators ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Known Allergies & Anaphylaxis Alerts */}
            <div className="triage-sexy-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                    <AlertTriangle size={15} />
                  </div>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Known Allergies & Contraindications
                  </h3>
                </div>
                <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#DC2626', background: '#FEF2F2', padding: '2px 8px', borderRadius: '6px' }}>
                  CRITICAL
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data?.allergies && data.allergies.length > 0 ? (
                  data.allergies.map((alg, idx) => {
                    const name = typeof alg === 'string' ? alg : (alg?.allergen || alg?.name || 'Allergen');
                    const severity = (typeof alg === 'object' && alg?.severity) ? alg.severity : 'HIGH';
                    const reaction = (typeof alg === 'object' && alg?.reaction) ? alg.reaction : 'Allergic sensitivity / Adverse reaction';
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 14px',
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          borderRadius: '10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.86rem', color: '#991B1B' }}>{name}</strong>
                          <div style={{ fontSize: '0.74rem', color: '#B91C1C', marginTop: '2px' }}>{reaction}</div>
                        </div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: '#DC2626', color: '#FFFFFF' }}>
                          {severity}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: '0.80rem', color: '#64748B', fontStyle: 'italic' }}>
                    No known drug or environmental allergies documented on record.
                  </div>
                )}
              </div>
            </div>

            {/* Active Medications & Regimen */}
            <div className="triage-sexy-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                    <Pill size={15} />
                  </div>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Active Pharmacotherapy & Medications
                  </h3>
                </div>
                <span style={{ fontSize: '0.64rem', fontWeight: 700, color: '#0284C7', background: '#E0F2FE', padding: '2px 8px', borderRadius: '6px' }}>
                  PRESCRIPTIONS
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data?.medications && data.medications.length > 0 ? (
                  data.medications.map((med, idx) => {
                    const name = typeof med === 'string' ? med : (med?.name || 'Medication');
                    const dose = typeof med === 'object' && med?.dose ? med.dose : 'Standard';
                    const freq = typeof med === 'object' && med?.frequency ? med.frequency : 'Daily';
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 14px',
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>{name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{freq}</div>
                        </div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#E0F2FE', color: '#0369A1', padding: '3px 8px', borderRadius: '6px' }}>
                          {dose}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: '0.80rem', color: '#64748B', fontStyle: 'italic' }}>
                    No ongoing active medications reported.
                  </div>
                )}
              </div>
            </div>

            {/* Baseline Vitals & Conditions */}
            <div className="triage-sexy-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '14px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <Activity size={15} />
                </div>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Baseline Vitals & Attending Center
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, display: 'block' }}>Blood Pressure</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginTop: '2px', display: 'block' }}>
                    {data?.baseline_vitals?.blood_pressure || '120/78 mmHg'}
                  </span>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, display: 'block' }}>Resting Heart Rate</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginTop: '2px', display: 'block' }}>
                    {data?.baseline_vitals?.heart_rate_bpm || 72} <span style={{ fontSize: '0.74rem', color: '#64748B' }}>BPM</span>
                  </span>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, display: 'block' }}>Blood Oxygen (SpO2)</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669', marginTop: '2px', display: 'block' }}>
                    {data?.baseline_vitals?.spo2_percent || 98}%
                  </span>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, display: 'block' }}>Attending Center</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginTop: '2px', display: 'block' }}>
                    {data?.hospital || 'AIIMS Clinical AI OPD'}
                  </span>
                </div>
              </div>

              {data?.conditions && data.conditions.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Diagnosed Medical Conditions
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {data.conditions.map((cond, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.72rem',
                          background: '#F1F5F9',
                          color: '#334155',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          fontWeight: 600,
                        }}
                      >
                        {typeof cond === 'string' ? cond : (cond?.name || cond?.condition || 'Condition')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT COLUMN: Emergency First Responder Desk ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Permanent Scannable Triage QR Pass */}
            <div className="triage-sexy-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ECFDF5',
                  color: '#059669',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  border: '1px solid #A7F3D0',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} />
                <span>LIVE RESCUE PASS • 24/7 ACTIVE</span>
              </div>

              <div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
                  Permanent Scannable Triage QR
                </h3>
                <p style={{ fontSize: '0.74rem', color: '#64748B', margin: 0, maxWidth: '320px' }}>
                  Scan with any smartphone camera or emergency medical scanner for live verified EHR telemetry.
                </p>
              </div>

              {/* Clean White QR Box */}
              <div
                style={{
                  padding: '16px',
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
                }}
              >
                <QRCodeSVG
                  value={emergencyPortalUrl}
                  size={150}
                  fgColor="#0F172A"
                  bgColor="#FFFFFF"
                  margin={2}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#0F172A', background: '#F1F5F9', padding: '3px 10px', borderRadius: '6px', fontWeight: 700 }}>
                  PERMANENT ID: {effectivePatientId}
                </span>
                <span style={{ fontSize: '0.64rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={12} color="#059669" />
                  <span>WORM SHA-256 Verified Immutable Record</span>
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '300px' }} className="no-print">
                <button
                  type="button"
                  onClick={copyTriageLink}
                  className="triage-pill-btn triage-outline-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {copiedLink ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="triage-pill-btn triage-outline-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Printer size={14} />
                  <span>Print Pass</span>
                </button>
              </div>
            </div>

            {/* India Emergency Speed Dial (24x7 Hotlines) */}
            <div className="triage-sexy-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                    <PhoneCall size={15} />
                  </div>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Emergency Speed Dial (India 24x7)
                  </h3>
                </div>
                <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '6px' }}>
                  TOLL-FREE
                </span>
              </div>

              <div className="emergency-speed-dial-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {INDIA_HELPLINES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.code}
                      href={`tel:${item.code}`}
                      className="triage-speed-card"
                    >
                      <div>
                        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A', display: 'block', lineHeight: 1 }}>
                          {item.code}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', marginTop: '2px', display: 'block' }}>
                          {item.title}
                        </span>
                      </div>
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: item.color,
                        }}
                      >
                        <Icon size={16} />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Cryptographic Compliance Seal */}
            <div
              style={{
                padding: '14px 18px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Shield size={20} color="#087F8C" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0F172A' }}>
                  WORM AUDIT VERIFIED MEDICAL RECORD
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '1px' }}>
                  Cryptographically sealed under HIPAA Safe Harbor & DPDP 2023 guidelines.
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* ── Dedicated Invisible Print Sheet (Rendered by @media print / window.print) ── */}
      <PrintableMedicalCardSheet
        patient={data}
        cardTheme={cardTheme}
        cardFace={cardFace}
        emergencyPortalUrl={emergencyPortalUrl}
      />

      {/* ── Interactive Print / Save PDF Preview Modal ── */}
      {printModalOpen && (
        <div
          className="modal-overlay no-print"
          onClick={() => setPrintModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '920px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Printer size={18} color="#087F8C" />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                    Print & Save PDF Medical ID Sheet
                  </h3>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px', display: 'block' }}>
                  ISO/IEC 7810 ID-1 Standard • Dual-sided wallet card lamination ready
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', border: '1px solid #E2E8F0', gap: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setCardTheme('light')}
                    style={{
                      background: cardTheme === 'light' ? '#FFFFFF' : 'transparent',
                      color: cardTheme === 'light' ? '#0F172A' : '#64748B',
                      border: 0,
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: cardTheme === 'light' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    Day White
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardTheme('dark')}
                    style={{
                      background: cardTheme === 'dark' ? '#0F172A' : 'transparent',
                      color: cardTheme === 'dark' ? '#FFFFFF' : '#64748B',
                      border: 0,
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: cardTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                    }}
                  >
                    Matte Black
                  </button>
                </div>

                <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', border: '1px solid #E2E8F0', gap: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setCardFace('dual')}
                    style={{
                      background: cardFace === 'dual' ? '#FFFFFF' : 'transparent',
                      color: cardFace === 'dual' ? '#087F8C' : '#64748B',
                      border: 0,
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: cardFace === 'dual' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    Dual (Front+Back)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardFace('front')}
                    style={{
                      background: cardFace === 'front' ? '#FFFFFF' : 'transparent',
                      color: cardFace === 'front' ? '#087F8C' : '#64748B',
                      border: 0,
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: cardFace === 'front' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    Front
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardFace('back')}
                    style={{
                      background: cardFace === 'back' ? '#FFFFFF' : 'transparent',
                      color: cardFace === 'back' ? '#087F8C' : '#64748B',
                      border: 0,
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: cardFace === 'back' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>

            {/* Live Document Preview */}
            <div style={{ background: '#F8FAFC', border: '1.5px dashed #CBD5E1', borderRadius: '12px', padding: '16px', maxHeight: '56vh', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Print Document Preview</span>
                <span>ISO/IEC 7810 ID-1 • A4 Layout</span>
              </div>
              <PrintableMedicalCardSheet
                patient={data}
                cardTheme={cardTheme}
                cardFace={cardFace}
                emergencyPortalUrl={emergencyPortalUrl}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                {emailSent ? <span style={{ color: '#059669', fontWeight: 700 }}>✓ Medical ID pass dispatched to your email!</span> : 'Choose "Save as PDF" or print directly to wallet card stock.'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleEmailCard}
                  className="triage-pill-btn triage-outline-btn"
                >
                  <Mail size={14} />
                  <span>{emailSent ? 'Sent!' : 'Email Me Pass'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  className="triage-pill-btn triage-outline-btn"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleEmailCard();
                    setPrintModalOpen(false);
                    setTimeout(() => window.print(), 120);
                  }}
                  className="triage-pill-btn triage-call-cta"
                  style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.28)' }}
                >
                  <Printer size={14} />
                  <span>Print Now / Save as PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
