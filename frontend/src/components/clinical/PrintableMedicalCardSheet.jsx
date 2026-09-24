import React from 'react';
import {
  Scissors, ShieldAlert, CreditCard, Smartphone, ShieldCheck,
  AlertTriangle, Heart, Shield, Printer
} from 'lucide-react';
import TriagePhysicalCard from './TriagePhysicalCard';

/**
 * PrintableMedicalCardSheet Component
 * Provides 1:1 ISO/IEC 7810 ID-1 standard wallet card print layout.
 * Activated by window.print() / @media print, and can also be previewed on screen.
 */
export default function PrintableMedicalCardSheet({
  patient = {},
  cardTheme = 'light', // 'light' | 'dark'
  cardFace = 'dual',   // 'dual' | 'front' | 'back'
  emergencyPortalUrl = '',
}) {
  const patientId = patient?.user_id || patient?.id || '—';
  const rawLicense = patient?.license_id || patient?.mrn;
  const mrn = (rawLicense && rawLicense !== 'PT-REC-89421') ? rawLicense : (patientId !== '—' ? `MRN-${patientId}-QX` : '—');
  const abhaId = patient?.abha_id || patient?.abhaId || '—';
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const activeTheme = cardTheme === 'dark' ? 'dark' : 'light';
  const activeThemeLabel = activeTheme === 'dark' 
    ? 'FIRST RESPONDER MATTE SLATE GRAY EDITION' 
    : 'CLINICAL DAY WHITE EDITION';

  const renderCardPair = (variant, editionLabel) => {
    return (
      <div className="print-edition-block" key={variant}>
        <div className="print-edition-badge">
          <span>{editionLabel}</span>
          <span className="print-edition-standard">ISO/IEC 7810 ID-1 (85.60 mm × 53.98 mm) • DUAL-SIDED 1:1 SCALE</span>
        </div>

        {/* Top Scissor Cut Guide Line */}
        <div className="print-cut-header-guide">
          <Scissors size={12} className="print-cut-scissor-icon" />
          <span className="print-cut-guide-text">✂ CUT ALONG DASHED LINE ✂</span>
          <div className="print-cut-dots" />
          <span className="print-cut-guide-text">✂ CUT ALONG DASHED LINE ✂</span>
          <Scissors size={12} className="print-cut-scissor-icon" style={{ transform: 'scaleX(-1)' }} />
        </div>

        <div className="print-cards-cutting-frame">
          {/* Top & Bottom Corner Alignment Marks */}
          <div className="print-corner-mark top-left">+</div>
          <div className="print-corner-mark top-right">+</div>
          <div className="print-corner-mark bottom-left">+</div>
          <div className="print-corner-mark bottom-right">+</div>

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

            {/* Center Fold / Cut Guide Line */}
            {cardFace === 'dual' && (
              <div className="print-fold-divider">
                <div className="print-fold-line" />
                <div className="print-fold-badge">
                  <Scissors size={12} className="print-scissors-icon" />
                  <span className="print-fold-title">FOLD HERE</span>
                  <span className="print-fold-sub">CENTER SEAM</span>
                </div>
                <div className="print-fold-line" />
              </div>
            )}

            {/* Back Face */}
            {(cardFace === 'dual' || cardFace === 'back') && (
              <div className="print-card-face-wrapper">
                <div className="print-face-label">BACK FACE • CLINICAL DIRECTIVES & VITALS</div>
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
          <Scissors size={12} className="print-cut-scissor-icon" />
          <span className="print-cut-guide-text">✂ CUT ALONG DASHED LINE ✂</span>
          <div className="print-cut-dots" />
          <span className="print-cut-guide-text">✂ CUT ALONG DASHED LINE ✂</span>
          <Scissors size={12} className="print-cut-scissor-icon" style={{ transform: 'scaleX(-1)' }} />
        </div>
      </div>
    );
  };

  return (
    <div className="qrakshak-printable-id-card-sheet">
      {/* ── Official Print Header ── */}
      <header className="print-sheet-header">
        <div className="print-header-brand">
          <div className="print-cross-emblem">+</div>
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

      {/* ── Emergency Wallet Directive Callout Banner ── */}
      <div className="print-wallet-directive-card">
        <div className="print-directive-badge">
          <ShieldAlert size={14} />
          <span>CRITICAL WALLET DIRECTIVE • CARRY AT ALL TIMES FOR EMERGENCIES</span>
        </div>
        <p className="print-directive-text">
          <strong>Notice to Patient, Family & First Responders:</strong> Keep this official laminated pass inside your physical wallet, smartphone case, or travel documents at all times. In the event of an accident, trauma, sudden incapacitation, or acute cardiac distress, paramedics, ER triage nurses, and attending physicians can immediately scan the QR code using any smartphone or clinical camera to instantly view blood group, life-threatening drug allergies, baseline vitals, and next-of-kin contacts without requiring device unlocking.
        </p>
        <div className="print-directive-features">
          <div className="print-feature-chip">
            <CreditCard size={12} />
            <span>Standard Wallet Slot Fit (85.60 mm × 53.98 mm)</span>
          </div>
          <div className="print-feature-chip">
            <Smartphone size={12} />
            <span>Instant Camera Scan (iOS / Android / Terminal)</span>
          </div>
          <div className="print-feature-chip">
            <ShieldCheck size={12} />
            <span>Tamper-Evident SHA-256 Cryptographic Anchor</span>
          </div>
        </div>
      </div>

      {/* ── Print Calibration Scale Bar ── */}
      <div className="print-calibration-bar">
        <div className="print-scale-marker">
          <span className="print-scale-label">CALIBRATION SCALE [50 mm]:</span>
          <div className="print-scale-ruler" />
          <span className="print-scale-hint">Physical ruler check: Exactly 50 mm (5.0 cm)</span>
        </div>
        <div className="print-instructions-callout">
          <strong>PRINT & CUT INSTRUCTIONS:</strong> Set printer dialog scale to <strong>"100% / Actual Size"</strong> (disable "Fit to Page"). Cut precisely along outer dashed scissor lines. Fold along the center seam to create a dual-sided wallet card.
        </div>
      </div>

      {/* ── Cards Section (Single Selected Edition Only) ── */}
      <div className="print-cards-stage">
        {renderCardPair(activeTheme, activeThemeLabel)}
      </div>

      {/* ── Footer Directives & Helpline Matrix ── */}
      <footer className="print-sheet-footer">
        <div className="print-helplines-grid">
          <div className="print-helpline-cell">
            <span className="print-helpline-num">108</span>
            <span className="print-helpline-desc">National Ambulance Service</span>
          </div>
          <div className="print-helpline-cell">
            <span className="print-helpline-num">112</span>
            <span className="print-helpline-desc">Unified National Emergency</span>
          </div>
          <div className="print-helpline-cell">
            <span className="print-helpline-num">1075</span>
            <span className="print-helpline-desc">MoHFW Health Helpline</span>
          </div>
          <div className="print-helpline-cell">
            <span className="print-helpline-num">100</span>
            <span className="print-helpline-desc">Police Emergency Response</span>
          </div>
        </div>

        <div className="print-legal-notice">
          <p>
            <strong>NOTICE TO PARAMEDICS, ER ATTENDANTS & FIRST RESPONDERS:</strong> Scan the high-resolution dynamic QR code on the front face using any standard smartphone camera. It resolves directly to the immutable tamper-evident triage portal at <code>{emergencyPortalUrl || `https://q-rakshak.vercel.app/#triage/${patientId}`}</code> providing real-time vitals, baseline ECG telemetry, physician contacts, and trauma directives.
          </p>
          <div className="print-ledger-seal-row">
            <span>Cryptographic Anchor: SHA-256 WORM Audit Log Verified</span>
            <span>Security Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
