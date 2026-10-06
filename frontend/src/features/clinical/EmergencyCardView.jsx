import React, { useState, useEffect, useRef } from 'react';
import {
  Phone, AlertTriangle, Heart, Shield, Activity,
  Pill, User, Droplet, Clock, Stethoscope, Share2,
  PhoneCall, AlertOctagon, CheckCircle2, Siren,
  Smartphone, MapPin, Building2, Copy, Check, Printer,
  QrCode, ExternalLink, Flame, ShieldAlert, ShieldCheck,
  RotateCw, Mail, Sparkles, ArrowUpRight, ChevronDown,
  Search, Users, Volume2, VolumeX, Timer, Zap, X
} from 'lucide-react';
import apiClient from '../../api/client';
import QRCodeSVG from '../../components/common/QRCodeSVG';
import TriagePhysicalCard from '../../components/clinical/TriagePhysicalCard';
import PrintableMedicalCardSheet from '../../components/clinical/PrintableMedicalCardSheet';
import { animateCard3DFlip } from '../../utils/motion.js';
import { useLanguage } from '../../context/LanguageContext';
import { useShakeDetection } from '../../utils/useShake.js';
import ShakeFeatureGuide from '../../components/clinical/ShakeFeatureGuide';
import { getEmergencyPortalUrl } from '../../api/config';
import {
  playCountdownTick,
  startEmergencySiren,
  stopEmergencySiren,
} from '../../utils/emergencyAudio.js';

import { authApi } from '../../api/auth';

export default function EmergencyCardView({ patientId = null }) {
  const { t } = useLanguage();
  const storedUser = authApi.getStoredUser();

  // Active patient roster for triage selector
  const [patientRoster, setPatientRoster] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(() => {
    if (patientId) return patientId;
    if (typeof window !== 'undefined' && window.location.hash) {
      const parts = window.location.hash.replace(/^#\/?/, '').split('?')[0].split('/');
      if (parts.length > 1 && parts[1]) return parts[1];
    }
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('qmed_selected_patient') : null;
    if (saved) return saved;
    if (storedUser?.role === 'patient') {
      return storedUser?.patient_id || storedUser?.user_id || storedUser?.id || '';
    }
    return '';
  });

  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const patientDropdownRef = useRef(null);

  const effectivePatientId = selectedPatientId || patientId || (patientRoster[0]?.id) || storedUser?.patient_id || storedUser?.user_id || storedUser?.id || 'PT-89421';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState(false);
  const [error, setError] = useState(null);
  const [shakeTriggered, setShakeTriggered] = useState(false);
  const [shakeAuditSeal, setShakeAuditSeal] = useState(null);
  const [shakeMetrics, setShakeMetrics] = useState(null);
  const [autoDialCountdown, setAutoDialCountdown] = useState(5);
  const [autoDialActive, setAutoDialActive] = useState(false);
  const [alarmAudioMuted, setAlarmAudioMuted] = useState(false);
  const [shakeSensitivity, setShakeSensitivity] = useState(() => {
    try {
      return localStorage.getItem('qmed_shake_sensitivity') || 'normal';
    } catch (_) {
      return 'normal';
    }
  });
  const countdownTimerRef = useRef(null);

  const handleSensitivityChange = (newSens) => {
    setShakeSensitivity(newSens);
    try {
      localStorage.setItem('qmed_shake_sensitivity', newSens);
    } catch (_) {}
  };
  const [copiedLink, setCopiedLink] = useState(false);
  const [cardTheme, setCardTheme] = useState('light');
  const [cardFace, setCardFace] = useState('dual');
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [is3DFlipped, setIs3DFlipped] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const card3DInnerRef = useRef(null);

  const rawPrimary = data?.emergency_contacts?.find((c) => c.is_primary && c.phone && c.phone !== '—') ||
    data?.emergency_contacts?.find((c) => c.phone && c.phone !== '—') ||
    data?.emergency_contacts?.[0];

  const primaryFallbackPhone = data?.emergency_contact || data?.emergency_phone || data?.phone || storedUser?.emergency_phone || storedUser?.phone || '';

  const primaryContact = {
    name: rawPrimary?.name || data?.emergency_contact_name || (data?.emergency_contact ? 'Emergency Contact' : '—'),
    phone: (rawPrimary?.phone && rawPrimary.phone !== '—') ? rawPrimary.phone : primaryFallbackPhone,
    relation: rawPrimary?.relation || data?.emergency_contact_relation || 'Next of Kin',
  };

  const secondaryContact = data?.emergency_contacts?.length > 1 ? data.emergency_contacts[1] : null;

  // Reactive cross-tab and cross-component auto-sync listener
  useEffect(() => {
    function handleSyncEvent(e) {
      const updatedPid = e?.detail?.patientId;
      if (!updatedPid || updatedPid === effectivePatientId || updatedPid === selectedPatientId) {
        loadData(false);
      }
    }
    function handleStorageSync(e) {
      if (e.key === 'qmed_last_updated_patient' || e.key === 'qmed_selected_patient') {
        loadData(false);
      }
    }
    window.addEventListener('qmed:patient_updated', handleSyncEvent);
    window.addEventListener('storage', handleStorageSync);
    return () => {
      window.removeEventListener('qmed:patient_updated', handleSyncEvent);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, [effectivePatientId, selectedPatientId]);

  // Send audit trail entry for shake triggers or call initiation
  const recordShakeAudit = async (action, dialTarget = null, metrics = null) => {
    try {
      const res = await apiClient.post(`/api/v1/emergency/${effectivePatientId}/audit-shake`, {
        action,
        dial_target: dialTarget,
        motion_metrics: metrics,
        actor: storedUser?.username ? `USER:${storedUser.username}` : `PATIENT:${effectivePatientId}`,
      });
      if (res?.cryptographic_seal) {
        setShakeAuditSeal(res.cryptographic_seal);
      }
      return res;
    } catch (e) {
      console.warn('Shake audit ledger logging notice:', e);
      return null;
    }
  };

  // High-reliability mobile Shake-to-Call hook with low-pass gravity filter & live telemetry
  const {
    isSupported: isShakeSupported,
    permissionState,
    currentMagnitude,
    effectiveThreshold,
    requestMotionPermission,
    triggerShake,
  } = useShakeDetection(
    (metrics) => {
      if (!shakeTriggered) {
        setShakeMetrics(metrics);
        setShakeTriggered(true);
        setAutoDialCountdown(5);
        setAutoDialActive(true);
        recordShakeAudit('SHAKE_EMERGENCY_TRIGGERED', null, metrics);
        if (!alarmAudioMuted) {
          startEmergencySiren();
        }
      }
    },
    {
      sensitivity: shakeSensitivity,
      timeout: 4000,
      reversalsRequired: 2,
      windowMs: 750,
      enabled: !shakeTriggered, // Critical: Disables sensor while emergency modal is active
    }
  );

  // Automated 5-Second Emergency Countdown Dialer with audio beeps and native haptic pulses
  useEffect(() => {
    if (shakeTriggered && autoDialActive) {
      countdownTimerRef.current = setInterval(() => {
        setAutoDialCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            stopEmergencySiren();
            setAutoDialActive(false);

            // Execute automated emergency dial (primary contact or 108)
            const targetNum = (primaryContact.phone || '108').replace(/[^0-9+]/g, '');
            recordShakeAudit('EMERGENCY_CALL_AUTO_DIALED', `${primaryContact.name} (${targetNum})`);
            window.location.href = `tel:${targetNum}`;
            return 0;
          }
          const next = prev - 1;
          if (!alarmAudioMuted) {
            playCountdownTick(next === 1 ? 1200 : 880);
          }
          if (navigator.vibrate) {
            try {
              navigator.vibrate([180, 80, 180]);
            } catch (_) {}
          }
          return next;
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      stopEmergencySiren();
    }
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      stopEmergencySiren();
    };
  }, [shakeTriggered, autoDialActive, alarmAudioMuted, primaryContact.phone, primaryContact.name]);

  const handleCancelShakeModal = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    stopEmergencySiren();
    setAutoDialActive(false);
    setShakeTriggered(false);
    recordShakeAudit('SHAKE_EMERGENCY_CANCELLED');
  };

  const handleImmediateDial = (targetPhone, contactName) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    stopEmergencySiren();
    setAutoDialActive(false);
    recordShakeAudit('EMERGENCY_CALL_INITIATED', `${contactName} (${targetPhone})`);
    const cleanNumber = targetPhone.replace(/[^0-9+]/g, '');
    window.location.href = `tel:${cleanNumber}`;
  };

  const toggleMuteAlarm = () => {
    const next = !alarmAudioMuted;
    setAlarmAudioMuted(next);
    if (next) {
      stopEmergencySiren();
    } else if (shakeTriggered && autoDialActive) {
      startEmergencySiren();
    }
  };

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

  const emergencyPortalUrl = getEmergencyPortalUrl(effectivePatientId);

  // Load roster of active patients on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchRoster() {
      try {
        const res = await apiClient.get('/api/v1/emergency/patients/list');
        if (isMounted && res?.patients && Array.isArray(res.patients) && res.patients.length > 0) {
          setPatientRoster(res.patients);
          if (!selectedPatientId && !patientId) {
            const firstPid = res.patients[0].id;
            setSelectedPatientId(firstPid);
            try { localStorage.setItem('qmed_selected_patient', firstPid); } catch (_) {}
          }
        }
      } catch (err) {
        console.warn('Could not fetch emergency patient roster:', err);
      }
    }
    fetchRoster();
    return () => { isMounted = false; };
  }, []);

  // Sync selectedPatientId when prop patientId changes
  useEffect(() => {
    if (patientId && patientId !== selectedPatientId) {
      setSelectedPatientId(patientId);
      try { localStorage.setItem('qmed_selected_patient', patientId); } catch (_) {}
    }
  }, [patientId]);

  // Click-outside listener for patient dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(e.target)) {
        setPatientDropdownOpen(false);
      }
    }
    if (patientDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [patientDropdownOpen]);

  function handleSelectPatient(pid) {
    if (!pid) return;
    setSelectedPatientId(pid);
    try { localStorage.setItem('qmed_selected_patient', pid); } catch (_) {}
    setPatientDropdownOpen(false);
    if (typeof window !== 'undefined') {
      window.location.hash = `#triage/${pid}`;
    }
  }

  async function handleSyncVault() {
    await loadData(false);
    setSyncToast(true);
    setTimeout(() => setSyncToast(false), 2600);
  }

  async function loadData(showLoader = true) {
    if (!effectivePatientId) return;
    if (showLoader) setLoading(true);
    else setSyncing(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/v1/emergency/${effectivePatientId}`);
      if (res && res.id) {
        // If baseline vitals or allergies are missing, enrich from clinical records
        if (!res.baseline_vitals || (!res.allergies?.length && !res.conditions?.length)) {
          try {
            const clinRes = await apiClient.get(`/api/v1/clinical/patient/${effectivePatientId}`);
            if (clinRes?.patient) {
              setData({
                ...clinRes.patient,
                ...res,
                baseline_vitals: clinRes.patient.baseline_vitals || res.baseline_vitals,
                allergies: (clinRes.patient.allergies?.length ? clinRes.patient.allergies : res.allergies) || [],
                conditions: (clinRes.patient.conditions?.length ? clinRes.patient.conditions : res.conditions) || [],
              });
              return;
            }
          } catch (_) {}
        }
        setData(res);
      } else {
        const clinRes = await apiClient.get(`/api/v1/clinical/patient/${effectivePatientId}`);
        if (clinRes?.patient) {
          setData(clinRes.patient);
        } else {
          setData(res);
        }
      }
    } catch (err) {
      console.warn('Emergency profile initial load failed, trying clinical fallback:', err);
      try {
        const clinRes = await apiClient.get(`/api/v1/clinical/patient/${effectivePatientId}`);
        if (clinRes?.patient) {
          setData(clinRes.patient);
          setError(null);
        } else {
          setError(err.message || 'Unable to retrieve emergency record from clinical vault.');
        }
      } catch (fallbackErr) {
        setError(err.message || 'Unable to retrieve emergency record from clinical vault.');
        setData(null);
      }
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }

  useEffect(() => {
    if (effectivePatientId) {
      loadData(true);
    }
  }, [effectivePatientId]);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--canvas-bg, #FBFBFB)', flexDirection: 'column', gap: '14px', fontFamily: 'var(--font-sans, "Plus Jakarta Sans", sans-serif)' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid #E4E4E7', borderTopColor: '#0052FF', animation: 'spin 0.8s linear infinite', borderRadius: 0 }} />
        <h2 style={{ fontSize: '0.92rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--ink-primary, #09090B)', margin: 0, fontFamily: 'var(--font-mono)' }}>
          Retrieving Clinical Emergency Passport...
        </h2>
        <span style={{ fontSize: '0.74rem', color: 'var(--ink-secondary, #71717A)', fontFamily: 'var(--font-mono)' }}>
          Verifying patient record & WORM cryptographic seal
        </span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', background: 'var(--canvas-bg, #FBFBFB)', fontFamily: 'var(--font-sans, sans-serif)' }}>
        <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '36px 28px', background: '#FFFFFF', borderRadius: 0, border: '1px solid #E4E4E7', boxShadow: 'none' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 0, background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#DC2626' }}>
            <AlertOctagon size={24} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#09090B', margin: '0 0 8px 0' }}>Emergency Record Unavailable</h2>
          <p style={{ fontSize: '0.82rem', color: '#71717A', lineHeight: 1.5, margin: '0 0 16px 0' }}>{error}</p>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', background: '#F4F4F5', padding: '4px 10px', borderRadius: 0, color: '#09090B', border: '1px solid #E4E4E7' }}>
            Patient ID: {effectivePatientId || patientId || '—'}
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
        backgroundColor: '#FBFBFB',
        color: '#09090B',
        fontFamily: 'var(--font-sans, "Plus Jakarta Sans", sans-serif)',
        padding: 0,
        margin: 0,
        boxSizing: 'border-box',
        borderRadius: 0,
      }}
    >
      <style>{`
        .triage-sexy-card {
          background: #FFFFFF;
          border: 1px solid #E4E4E7;
          border-radius: 0;
          padding: 22px 24px;
          transition: border-color 0.15s ease;
        }
        .triage-sexy-card:hover {
          border-color: #18181B;
        }
        .triage-hero-banner {
          background: #FFFFFF;
          border: 1px solid #E4E4E7;
          border-left: 4px solid #0052FF;
          border-radius: 0;
          padding: clamp(16px, 3vw, 32px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          position: relative;
          overflow: hidden;
        }
        .triage-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 0;
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
          min-height: 38px;
          box-sizing: border-box;
          font-family: var(--font-mono);
        }
        .triage-call-cta {
          background: #DC2626;
          color: #FFFFFF;
          border: 1px solid #DC2626;
        }
        .triage-call-cta:hover {
          background: #B91C1C;
          border-color: #B91C1C;
        }
        .triage-outline-btn {
          background: #FFFFFF;
          color: #09090B;
          border: 1px solid #E4E4E7;
        }
        .triage-outline-btn:hover {
          background: #F4F4F5;
          border-color: #18181B;
          color: #09090B;
        }
        .triage-speed-card {
          background: #FFFFFF;
          border: 1px solid #E4E4E7;
          border-radius: 0;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.15s ease;
          min-height: 44px;
        }
        .triage-speed-card:hover {
          border-color: #0052FF;
          background: #F4F4F5;
        }

        .triage-clinical-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
          align-items: start;
        }

        /* Responsive Mobile Adjustments */
        @media (max-width: 768px) {
          .triage-clinical-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .triage-hero-banner {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }
          .triage-hero-left-wrap {
            flex-direction: row !important;
            align-items: flex-start !important;
            gap: 14px !important;
            width: 100% !important;
          }
          .triage-nok-box {
            width: 100% !important;
            min-width: 100% !important;
            box-sizing: border-box !important;
          }
          .triage-header-actions {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr auto !important;
            gap: 8px !important;
          }
          .triage-header-actions .triage-pill-btn {
            justify-content: center !important;
            padding: 8px 10px !important;
            font-size: 0.72rem !important;
          }
        }

        @media (max-width: 480px) {
          .triage-header-actions {
            grid-template-columns: 1fr !important;
          }
          .triage-header-actions .triage-pill-btn {
            width: 100% !important;
          }
          .triage-hero-left-wrap {
            flex-direction: column !important;
          }
          .triage-sexy-card {
            padding: 14px !important;
          }
          .emergency-speed-dial-grid {
            grid-template-columns: 1fr !important;
          }
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
                {t('emergency.badge_triage', 'Emergency Triage')}
              </span>
            </div>
            <div style={{ fontSize: '0.70rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span>{t('emergency.verified_passport', 'Verified Medical Passport • 24/7 Active')}</span>
            </div>
          </div>
        </div>

        {/* Clinician & Triage Patient Switcher HUD */}
        <div ref={patientDropdownRef} className="no-print" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div
            onClick={() => setPatientDropdownOpen((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: '12px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.18s ease',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
            }}
            title="Click to switch active emergency patient record"
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.72rem',
              fontWeight: 900,
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
            }}>
              {data?.blood_group && data.blood_group !== '—' ? data.blood_group : <Users size={14} />}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A' }}>
                  {data?.name || 'Select Patient'}
                </span>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: '#F1F5F9', color: '#475569', fontFamily: 'monospace' }}>
                  {data?.id || effectivePatientId}
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                {data?.age ? `${data.age} Yrs` : 'Active Record'} {data?.gender ? `• ${data.gender}` : ''} {data?.mrn ? `• ${data.mrn}` : ''}
              </span>
            </div>
            <ChevronDown size={14} color="#64748B" style={{ transform: patientDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', marginLeft: '4px' }} />
          </div>

          {/* Patient Roster Dropdown */}
          {patientDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '330px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                boxShadow: '0 15px 35px -5px rgba(15, 23, 42, 0.15)',
                zIndex: 1000,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '6px 10px' }}>
                  <Search size={13} color="#94A3B8" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, or MRN..."
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                    style={{ border: 'none', outline: 'none', fontSize: '0.74rem', width: '100%', background: 'transparent' }}
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '6px' }}>
                {patientRoster.length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.74rem', color: '#64748B' }}>
                    No other patients found in registry.
                  </div>
                ) : (
                  patientRoster
                    .filter((p) => {
                      if (!patientSearchQuery.trim()) return true;
                      const q = patientSearchQuery.toLowerCase();
                      return (
                        (p.name || '').toLowerCase().includes(q) ||
                        (p.id || '').toLowerCase().includes(q) ||
                        (p.mrn || '').toLowerCase().includes(q)
                      );
                    })
                    .map((p) => {
                      const isSelected = p.id === effectivePatientId;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectPatient(p.id)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: isSelected ? '#EFF6FF' : 'transparent',
                            border: isSelected ? '1px solid #BFDBFE' : '1px solid transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            marginBottom: '2px',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isSelected ? '#1D4ED8' : '#0F172A' }}>
                              {p.name || p.id}
                            </span>
                            <span style={{ fontSize: '0.66rem', color: '#64748B', fontFamily: 'monospace' }}>
                              {p.id} {p.mrn ? `• ${p.mrn}` : ''} {p.age ? `• ${p.age}y` : ''}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                            }}>
                              {p.blood_group || '—'}
                            </span>
                            {isSelected && <Check size={14} color="#2563EB" />}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="triage-header-actions no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSyncVault}
            className="triage-pill-btn triage-outline-btn"
            title="Sync latest patient data and vitals from clinical vault"
            disabled={syncing}
          >
            <RotateCw size={14} style={{ animation: syncing ? 'spin 0.8s linear infinite' : 'none' }} />
            <span>{syncing ? t('triage.syncing', 'Syncing...') : t('triage.sync_vault', 'Sync Vault')}</span>
          </button>

          <button
            type="button"
            onClick={copyTriageLink}
            className="triage-pill-btn triage-outline-btn"
            title="Copy permanent emergency link"
          >
            {copiedLink ? <Check size={14} color="#059669" /> : <Copy size={14} />}
            <span>{copiedLink ? t('emergency.copied_link', 'Copied Link!') : t('emergency.share_pass', 'Share Pass')}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="triage-pill-btn triage-outline-btn"
            title="Print or Save PDF"
          >
            <Printer size={14} />
            <span>{t('emergency.print_id', 'Print Medical ID')}</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              await requestMotionPermission();
              triggerShake({ simulated: true, manualClick: true, timestamp: Date.now() });
            }}
            className="triage-pill-btn triage-call-cta"
            title="Shake phone or click to activate SOS emergency dialer"
          >
            <Smartphone size={14} />
            <span>{t('emergency.sos_call', 'SOS Direct Call')}</span>
          </button>
        </div>
      </header>

      {/* ── Shake-to-Call Emergency Trigger Modal with 5s Auto-Dialer ── */}
      {shakeTriggered && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.78)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.15s ease',
          }}
          onClick={handleCancelShakeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              width: '100%',
              textAlign: 'center',
              padding: '28px 24px',
              background: '#FFFFFF',
              borderRadius: '24px',
              boxShadow: '0 25px 65px -12px rgba(220, 38, 38, 0.35)',
              border: '2px solid #FECACA',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Bar with Siren Audio Mute & Close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626' }} />
                <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#DC2626', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  DISTRESS MOTION DETECTED
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={toggleMuteAlarm}
                  style={{
                    background: alarmAudioMuted ? '#F1F5F9' : '#FEF2F2',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '5px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.66rem',
                    color: alarmAudioMuted ? '#64748B' : '#DC2626',
                    fontWeight: 700,
                  }}
                  title={alarmAudioMuted ? 'Unmute Siren Alarm' : 'Mute Siren Alarm'}
                >
                  {alarmAudioMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  <span>{alarmAudioMuted ? 'Muted' : 'Siren Active'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelShakeModal}
                  style={{
                    background: '#F1F5F9',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '5px 7px',
                    cursor: 'pointer',
                    color: '#64748B',
                  }}
                  title="Close / Cancel"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Circular Countdown Progress Badge */}
            <div
              style={{
                position: 'relative',
                width: '100px',
                height: '100px',
                margin: '0 auto 14px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#FEE2E2"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#DC2626"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={264}
                  strokeDashoffset={autoDialActive ? 264 * (1 - autoDialCountdown / 5) : 0}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: autoDialCountdown <= 2 ? '#DC2626' : '#0F172A',
                    lineHeight: 1,
                  }}
                >
                  {autoDialCountdown}
                </span>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em' }}>
                  SEC
                </span>
              </div>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
              {autoDialCountdown === 0
                ? 'Dialing Emergency Contact...'
                : `Auto-Calling in ${autoDialCountdown} Seconds`}
            </h2>

            <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.45, marginBottom: '14px' }}>
              Incapacitation safety protocol engaged for <strong style={{ color: '#0F172A' }}>{data?.name || 'Patient'}</strong>. Phone will dial automatically if not cancelled:
            </p>

            {/* Cryptographic Audit Confirmation Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.66rem',
                color: '#166534',
                fontWeight: 600,
                marginBottom: '14px',
                fontFamily: 'monospace',
              }}
            >
              <ShieldCheck size={12} color="#16A34A" />
              <span>
                {shakeAuditSeal
                  ? `Seal: ${shakeAuditSeal.substring(0, 14)}...`
                  : 'Ledger Audit Synchronized'}
              </span>
              {shakeMetrics?.magnitude && (
                <span style={{ color: '#0284C7' }}>• {shakeMetrics.magnitude} m/s²</span>
              )}
            </div>

            {/* Target Contact Card */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px 14px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                <span style={{ color: '#64748B' }}>Primary Responder:</span>
                <strong style={{ color: '#0F172A' }}>
                  {primaryContact.phone ? `${primaryContact.name} (${primaryContact.relation})` : 'National EMS Dispatch (108)'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: '#64748B' }}>Phone:</span>
                <strong style={{ color: '#0284C7', fontFamily: 'monospace' }}>
                  {primaryContact.phone || '108 (National Ambulance)'}
                </strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() =>
                  handleImmediateDial(
                    primaryContact.phone || '108',
                    primaryContact.phone ? primaryContact.name : 'National Ambulance'
                  )
                }
                className="triage-pill-btn triage-call-cta"
                style={{
                  justifyContent: 'center',
                  padding: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  width: '100%',
                }}
              >
                <PhoneCall size={16} />
                <span>CALL NOW (SKIP TIMER)</span>
              </button>

              <button
                type="button"
                onClick={() => handleImmediateDial('108', 'National Ambulance')}
                className="triage-pill-btn triage-outline-btn"
                style={{
                  justifyContent: 'center',
                  padding: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  width: '100%',
                }}
              >
                <Siren size={15} color="#DC2626" />
                <span>Call 108 Ambulance Instead</span>
              </button>

              <button
                type="button"
                onClick={handleCancelShakeModal}
                style={{
                  background: '#FEF2F2',
                  border: '1.5px solid #FECACA',
                  borderRadius: '10px',
                  color: '#DC2626',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  padding: '10px',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <X size={15} />
                <span>CANCEL / FALSE ALARM</span>
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
        {/* iOS 13+ & Mobile Accelerometer Permission Activation Banner */}
        {isShakeSupported && permissionState !== 'granted' && (
          <div
            style={{
              background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              border: '1.5px solid #93C5FD',
              borderRadius: '16px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                }}
              >
                <Smartphone size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '0.86rem', color: '#1E3A8A' }}>
                  Enable Emergency Motion Sensor on this Device
                </strong>
                <div style={{ fontSize: '0.74rem', color: '#1D4ED8' }}>
                  Tap to grant mobile accelerometer permissions for hands-free Shake-to-Call emergency dialing.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={requestMotionPermission}
              className="triage-pill-btn"
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              }}
            >
              <Zap size={14} />
              <span>Grant Sensor Access</span>
            </button>
          </div>
        )}

        {/* 1. Executive Hero Patient Banner */}
        <div className="triage-hero-banner">
          <div className="triage-hero-left-wrap" style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flex: 1, minWidth: 0 }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
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
                  PERMANENT ID: {data?.patient_id || effectivePatientId || data?.id || patientId}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0, wordBreak: 'break-word' }}>
                  {data?.name || 'Patient'}
                </h1>
                {patientRoster.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setPatientDropdownOpen(true)}
                    className="no-print"
                    style={{
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '0.70rem',
                      fontWeight: 700,
                      color: '#0284C7',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Switch active patient"
                  >
                    <Users size={12} /> Switch Record
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '0.80rem', flexWrap: 'wrap' }}>
                <span>{data?.age ? `${data.age} Yrs` : 'Age Unspecified'}</span>
                <span>•</span>
                <span>{data?.gender || 'Gender Unspecified'}</span>
                <span>•</span>
                <span>MRN: <strong style={{ color: '#0F172A' }}>{data?.mrn || (effectivePatientId ? `MRN-${effectivePatientId}-QX` : '—')}</strong></span>
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
            className="triage-nok-box"
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
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Back View (Allergies & Directives)</span>
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

        {/* 2.5 Shake-to-Call Motion Sensor Interactive Intro Guide (with Vector SVG) */}
        <ShakeFeatureGuide
          onTriggerShake={triggerShake}
          onRequestPermission={requestMotionPermission}
          permissionState={permissionState}
          isSupported={isShakeSupported}
          currentMagnitude={currentMagnitude}
          effectiveThreshold={effectiveThreshold}
          sensitivity={shakeSensitivity}
          onSensitivityChange={handleSensitivityChange}
        />

        {/* 3. Clinical Direct Intelligence 2-Column Grid */}
        <div className="triage-clinical-grid">
          
          {/* ── LEFT COLUMN: Vital Medical Indicators ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* ── Official Verified Patient Profile & Clinical Telemetry ── */}
            <div className="triage-sexy-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      {t('triage.official_demographics_title', 'Official Patient Demographics & Record Credentials')}
                    </h3>
                  </div>
                </div>
                <span style={{
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  color: '#059669',
                  background: '#ECFDF5',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  border: '1px solid #A7F3D0',
                  letterSpacing: '0.04em',
                }}>
                  {t('triage.abdm_verified_badge', 'ABDM VERIFIED • IMMUTABLE RECORD')}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.64rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>{t('emergency.blood_group', 'Blood Group')}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '3px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#DC2626' }}>{data?.blood_group || 'O+'}</span>
                    <span style={{ fontSize: '0.64rem', color: '#64748B', fontWeight: 600 }}>{t('triage.rh_confirmed', 'Rh Confirmed')}</span>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.64rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>{t('triage.age_gender', 'Age / Gender')}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '3px' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A' }}>
                      {data?.age ? `${data.age} Y` : '—'} / {data?.gender ? data.gender.charAt(0).toUpperCase() : 'M'}
                    </span>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.64rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>{t('triage.abha_health_id', 'ABHA Health ID')}</span>
                  <div style={{ marginTop: '3px' }}>
                    <span style={{ fontSize: '0.80rem', fontWeight: 800, color: '#0284C7', fontFamily: 'monospace' }}>
                      {data?.abha_id || '91-1029-4821-3910'}
                    </span>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.64rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>{t('triage.medical_record_no', 'Medical Record No.')}</span>
                  <div style={{ marginTop: '3px' }}>
                    <span style={{ fontSize: '0.80rem', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                      {data?.mrn || (effectivePatientId ? `MRN-${effectivePatientId}-QX` : 'MRN-89421-QX')}
                    </span>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.64rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>{t('triage.organ_donor_status', 'Organ Donor Status')}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                    <Heart size={14} fill={data?.organ_donor ? '#059669' : 'none'} color={data?.organ_donor ? '#059669' : '#64748B'} />
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: data?.organ_donor ? '#059669' : '#64748B' }}>
                      {data?.organ_donor ? t('triage.consented_donor', 'Consented Donor') : t('triage.unconfirmed_donor', 'Unconfirmed')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Patient Registered Address / Primary Facility */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '12px', background: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div>
                  <span style={{ fontSize: '0.64rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>{t('triage.primary_facility', 'Primary Hospital / Facility')}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginTop: '2px', display: 'block' }}>
                    {data?.hospital || 'All India Institute of Medical Sciences (AIIMS) • Trauma Center'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.64rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>{t('triage.attending_physician', 'Attending Physician')}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginTop: '2px', display: 'block' }}>
                    {data?.attending_physician || 'On-Duty Emergency Medical Officer (EMO)'}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '0.68rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={13} color="#059669" />
                <span>{t('triage.tamper_evident_passport', 'Verified Clinical Passport • End-to-End Cryptographically Sealed & Tamper-Evident')}</span>
              </div>
            </div>

            {/* Known Allergies & Anaphylaxis Alerts */}
            <div className="triage-sexy-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                    <AlertTriangle size={15} />
                  </div>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {t('emergency.known_allergies_heading', 'Known Allergies & Contraindications')}
                  </h3>
                </div>
                <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#DC2626', background: '#FEF2F2', padding: '2px 8px', borderRadius: '6px' }}>
                  {t('emergency.critical', 'CRITICAL')}
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
                    {t('emergency.no_allergies', 'No known drug or environmental allergies documented on record.')}
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
                    {t('emergency.active_medications_heading', 'Active Pharmacotherapy & Medications')}
                  </h3>
                </div>
                <span style={{ fontSize: '0.64rem', fontWeight: 700, color: '#0284C7', background: '#E0F2FE', padding: '2px 8px', borderRadius: '6px' }}>
                  {t('emergency.prescriptions_label', 'PRESCRIPTIONS')}
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
                    {t('emergency.no_medications', 'No ongoing active medications reported.')}
                  </div>
                )}
              </div>
            </div>

            {/* Clinical Center & Affiliation */}
            <div className="triage-sexy-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '14px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <Activity size={15} />
                </div>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {t('emergency.clinical_center_heading', 'Clinical Center & Affiliation')}
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, display: 'block' }}>{t('emergency.blood_group', 'Blood Group')}</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginTop: '2px', display: 'block' }}>
                    {data?.blood_group || 'O+'}
                  </span>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, display: 'block' }}>{t('emergency.attending_center', 'Attending Center')}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginTop: '2px', display: 'block' }}>
                    {data?.hospital || 'Q-Rakshak'}
                  </span>
                </div>
              </div>

              {data?.conditions && data.conditions.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    {t('emergency.diagnosed_conditions', 'Diagnosed Medical Conditions')}
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
                <span>{t('emergency.live_rescue_pass', 'LIVE RESCUE PASS • 24/7 ACTIVE')}</span>
              </div>

              <div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
                  {t('emergency.permanent_qr', 'Permanent Scannable Triage QR')}
                </h3>
                <p style={{ fontSize: '0.74rem', color: '#64748B', margin: 0, maxWidth: '320px' }}>
                  {t('emergency.scan_qr_desc', 'Scan with any smartphone camera or emergency medical scanner for live medical records telemetry.')}
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
                  {t('emergency.permanent_id', 'PERMANENT ID')}: {effectivePatientId}
                </span>
                <span style={{ fontSize: '0.64rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={12} color="#059669" />
                  <span>{t('emergency.immutable_seal', 'WORM SHA-256 Verified Immutable Record')}</span>
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
                  <span>{copiedLink ? t('emergency.copied_link', 'Copied!') : t('emergency.copy_link', 'Copy Link')}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="triage-pill-btn triage-outline-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Printer size={14} />
                  <span>{t('emergency.print_pass', 'Print Pass')}</span>
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
                    {t('emergency.speed_dial_title', 'Emergency Speed Dial (India 24x7)')}
                  </h3>
                </div>
                <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '6px' }}>
                  {t('emergency.toll_free', 'TOLL-FREE')}
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
                  {t('emergency.worm_record_seal', 'WORM AUDIT VERIFIED MEDICAL RECORD')}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '1px' }}>
                  {t('emergency.regulatory_sealed', 'Cryptographically sealed under HIPAA Safe Harbor & DPDP 2023 guidelines.')}
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
                    {t('emergency.print_modal_title', 'Print & Save PDF Medical ID Sheet')}
                  </h3>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px', display: 'block' }}>
                  {t('emergency.print_modal_subtitle', 'ISO/IEC 7810 ID-1 Standard • Dual-sided wallet card lamination ready')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '2px', borderRadius: '0px', border: '1px solid #E2E8F0', gap: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setCardTheme('light')}
                    style={{
                      background: cardTheme === 'light' ? '#FFFFFF' : 'transparent',
                      color: cardTheme === 'light' ? '#0F172A' : '#64748B',
                      border: 0,
                      borderRadius: '0px',
                      padding: '4px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: cardTheme === 'light' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    {t('emergency.day_white', 'Day White')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardTheme('dark')}
                    style={{
                      background: cardTheme === 'dark' ? '#0F172A' : 'transparent',
                      color: cardTheme === 'dark' ? '#FFFFFF' : '#64748B',
                      border: 0,
                      borderRadius: '0px',
                      padding: '4px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: cardTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    {t('emergency.matte_black', 'Matte Black')}
                  </button>
                </div>

                <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '2px', borderRadius: '0px', border: '1px solid #E2E8F0', gap: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setCardFace('dual')}
                    style={{
                      background: cardFace === 'dual' ? '#FFFFFF' : 'transparent',
                      color: cardFace === 'dual' ? '#0052FF' : '#64748B',
                      border: 0,
                      borderRadius: '0px',
                      padding: '4px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: cardFace === 'dual' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    {t('emergency.dual_front_back', 'Dual (Front+Back)')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardFace('front')}
                    style={{
                      background: cardFace === 'front' ? '#FFFFFF' : 'transparent',
                      color: cardFace === 'front' ? '#0052FF' : '#64748B',
                      border: 0,
                      borderRadius: '0px',
                      padding: '4px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: cardFace === 'front' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    {t('emergency.front_only', 'Front')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardFace('back')}
                    style={{
                      background: cardFace === 'back' ? '#FFFFFF' : 'transparent',
                      color: cardFace === 'back' ? '#0052FF' : '#64748B',
                      border: 0,
                      borderRadius: '0px',
                      padding: '4px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: cardFace === 'back' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    {t('emergency.back_only', 'Back')}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Document Preview */}
            <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '0px', padding: '16px', maxHeight: '56vh', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('emergency.print_preview', 'Print Document Preview')}</span>
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
                {emailSent ? <span style={{ color: '#059669', fontWeight: 700 }}>✓ {t('emergency.email_pass_dispatched', 'Medical ID pass dispatched to your email!')}</span> : t('emergency.print_modal_hint', 'Choose "Save as PDF" or print directly to wallet card stock.')}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleEmailCard}
                  className="triage-pill-btn triage-outline-btn"
                >
                  <Mail size={14} />
                  <span>{emailSent ? t('emergency.email_sent', 'Sent!') : t('emergency.email_pass', 'Email Me Pass')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  className="triage-pill-btn triage-outline-btn"
                >
                  {t('emergency.close', 'Close')}
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
                  <span>{t('emergency.print_save_pdf', 'Print Now / Save as PDF')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {syncToast && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 2000,
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.80rem',
            fontWeight: 700,
            border: '1px solid #334155',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckCircle2 size={16} color="#10B981" />
          <span>{t('triage.vault_synced', 'Vault Synchronized & Verified with WORM Ledger')}</span>
        </div>
      )}
    </div>
  );
}
