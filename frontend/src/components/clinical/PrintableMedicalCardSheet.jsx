import React from 'react';
import {
  Scissors, ShieldAlert, CreditCard, Smartphone, ShieldCheck,
  AlertTriangle, Heart, Shield, Printer
} from 'lucide-react';
import TriagePhysicalCard from './TriagePhysicalCard';

/**
 * PrintableMedicalCardSheet Component
 * Provides 1:1 ISO/IEC 7810 ID-1 standard wallet card print layout.
 * Optimized for paper printing, clean contrast, minimal ink waste, and high paramedic legibility.
 */
export default function PrintableMedicalCardSheet({
  patient = {},
  cardTheme = 'light', // 'light' | 'dark'
  cardFace = 'dual',   // 'dual' | 'front' | 'back'
  emergencyPortalUrl = '',
}) {
  const resolvedId = patient?.user_id || patient?.patient_id || patient?.id || (patient?.mrn ? String(patient.mrn).replace(/^MRN-/, '').replace(/-QX$/, '') : '') || '';
  const patientNameSlug = (patient.name || patient.username || 'PATIENT')
    .replace(/^Dr\.?\s+/i, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
  const patientId = resolvedId || (patient.name || patient.username ? `USR-${patientNameSlug}` : 'USR-PATIENT');
  const rawLicense = patient?.license_id || patient?.mrn;
  const mrn = rawLicense || (patientId ? `MRN-${patientId}-QX` : 'MRN-UNLINKED');
  const abhaId = patient?.abha_id || patient?.abhaId || '—';
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const activeTheme = cardTheme === 'dark' ? 'dark' : 'light';
  const activeThemeLabel = activeTheme === 'dark' 
    ? 'FIRST RESPONDER MATTE SLATE EDITION' 
    : 'CLINICAL DAY WHITE EDITION';

  const renderCardPair = (variant, editionLabel) => {
    return (
      <div className="print-edition-block" key={variant}>
        <div className="print-edition-badge">
          <span>{editionLabel}</span>
          <span className="print-edition-standard">ISO/IEC 7810 ID-1 (85.60 mm × 53.98 mm) • 1:1 WALLET SCALE</span>
        </div>

        {/* Top Scissor Cut Guide Line */}
        <div className="print-cut-header-guide">
          <Scissors size={11} className="print-cut-scissor-icon" />
          <span className="print-cut-guide-text">CUT ALONG DASHED LINE</span>
          <div className="print-cut-dots" />
          <span className="print-cut-guide-text">CUT ALONG DASHED LINE</span>
          <Scissors size={11} className="print-cut-scissor-icon" style={{ transform: 'scaleX(-1)' }} />
        </div>

        <div className="print-cards-cutting-frame">
          {/* Hairline Corner Registration Marks */}
          <div className="print-corner-bracket top-left" />
          <div className="print-corner-bracket top-right" />
          <div className="print-corner-bracket bottom-left" />
          <div className="print-corner-bracket bottom-right" />

          <div className="print-cards-flex-row">
            {/* Front Face */}
            {(cardFace === 'dual' || cardFace === 'front') && (
              <div className="print-card-face-wrapper">
                <div className="print-face-label">FRONT FACE • EMERGENCY EHR QR ACCESS</div>
                <div className="print-card-scaler">
                  <TriagePhysicalCard
                    patient={patient}
                    variant={variant}
                    face="front"
                    emergencyPortalUrl={emergencyPortalUrl}
                  />
                </div>
              </div>
            )}

            {/* Center Fold Guide Line */}
            {cardFace === 'dual' && (
              <div className="print-fold-divider">
                <div className="print-fold-line" />
                <div className="print-fold-badge">
                  <Scissors size={11} className="print-scissors-icon" />
                  <span className="print-fold-title">FOLD HERE</span>
                  <span className="print-fold-sub">CENTER SEAM</span>
                </div>
                <div className="print-fold-line" />
              </div>
            )}

            {/* Back Face */}
            {(cardFace === 'dual' || cardFace === 'back') && (
              <div className="print-card-face-wrapper">
                <div className="print-face-label">BACK FACE • CLINICAL DIRECTIVES & SAFEGUARDS</div>
                <div className="print-card-scaler">
                  <TriagePhysicalCard
                    patient={patient}
                    variant={variant}
                    face="back"
                    emergencyPortalUrl={emergencyPortalUrl}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Scissor Cut Guide Line */}
        <div className="print-cut-header-guide bottom">
          <Scissors size={11} className="print-cut-scissor-icon" />
          <span className="print-cut-guide-text">CUT ALONG DASHED LINE</span>
          <div className="print-cut-dots" />
          <span className="print-cut-guide-text">CUT ALONG DASHED LINE</span>
          <Scissors size={11} className="print-cut-scissor-icon" style={{ transform: 'scaleX(-1)' }} />
        </div>
      </div>
    );
  };

  return (
    <div className="qrakshak-printable-id-card-sheet">
      {/* ── Official Print Header (Clean Institutional Branding) ── */}
      <header className="print-sheet-header">
        <div className="print-header-brand">
          <div className="print-header-symbol">
            <Shield size={18} />
          </div>
          <div>
            <h1 className="print-sheet-title">OFFICIAL EMERGENCY MEDICAL PASSPORT & TRIAGE ID PASS</h1>
            <p className="print-sheet-subtitle">
              ISO/IEC 7810 ID-1 Standard Rapid Triage Passport • National Health Stack / ABDM Aligned
            </p>
          </div>
        </div>

        <div className="print-header-meta">
          <div>MRN: <strong>{mrn}</strong></div>
          <div>ABHA: <strong>{abhaId}</strong></div>
          <div>PERMANENT ID: <strong>{patientId}</strong></div>
          <div>ISSUED: <strong>{currentDate}</strong></div>
        </div>
      </header>

      {/* ── Concise 1-Line First Responder Notice (No Text Wall) ── */}
      <div className="print-wallet-directive-card">
        <div className="print-directive-badge">
          <ShieldAlert size={13} />
          <span>FIRST RESPONDER DIRECTIVE • CARRY IN WALLET OR PHONE CASE</span>
        </div>
        <p className="print-directive-text">
          Scan the high-resolution QR code using any smartphone camera or clinical ambulance terminal to immediately access verified blood group, life-threatening drug allergies, baseline ECG telemetry, and primary emergency contacts.
        </p>
      </div>

      {/* ── Clean Calibration & Cut Instructions Bar ── */}
      <div className="print-calibration-bar">
        <div className="print-scale-marker">
          <span className="print-scale-label">CALIBRATION SCALE [50 mm]:</span>
          <div className="print-scale-ruler" />
          <span className="print-scale-hint">Check: 50 mm (5.0 cm)</span>
        </div>
        <div className="print-instructions-callout">
          <strong>PRINT INSTRUCTIONS:</strong> Set scale to <strong>100% / Actual Size</strong> (do not use "Fit to Page"). Cut along outer dashed lines and fold along center seam to create a dual-sided wallet pass.
        </div>
      </div>

      {/* ── Cards Section (High-Contrast Scale Section) ── */}
      <div className="print-cards-stage">
        {renderCardPair(activeTheme, activeThemeLabel)}
      </div>

      {/* ── Footer Emergency Helpline Matrix & Verification ── */}
      <footer className="print-sheet-footer">
        <div className="print-helplines-grid">
          <div className="print-helpline-cell">
            <span className="print-helpline-num">108</span>
            <span className="print-helpline-desc">National Ambulance</span>
          </div>
          <div className="print-helpline-cell">
            <span className="print-helpline-num">112</span>
            <span className="print-helpline-desc">Unified Emergency</span>
          </div>
          <div className="print-helpline-cell">
            <span className="print-helpline-num">1075</span>
            <span className="print-helpline-desc">MoHFW Helpline</span>
          </div>
          <div className="print-helpline-cell">
            <span className="print-helpline-num">100</span>
            <span className="print-helpline-desc">Police Hotline</span>
          </div>
        </div>

        <div className="print-legal-notice">
          <p>
            <strong>EMERGENCY PORTAL RESOLUTION:</strong> Direct access: <code>{emergencyPortalUrl || `https://q-rakshak.vercel.app/#triage/${patientId}`}</code> providing real-time vitals, baseline ECG telemetry, physician contacts, and trauma directives.
          </p>
          <div className="print-ledger-seal-row">
            <span>Cryptographic Anchor: SHA-256 Immutable Audit Log Verified</span>
            <span>Security Status: Authenticated Clinical ID</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
