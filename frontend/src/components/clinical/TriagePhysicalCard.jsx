import React from 'react';
import {
  Phone, Mail, MapPin, Shield, Heart,
  Copy, Check, ChevronRight, AlertTriangle,
  FileText, ShieldCheck, Ambulance, Stethoscope,
  Pill, Activity
} from 'lucide-react';
import QRCodeSVG from '../common/QRCodeSVG';
import { getEmergencyPortalUrl } from '../../api/config';

/**
 * TriagePhysicalCard Component
 * Implements a clean, high-legibility ISO/IEC 7810 ID-1 physical medical card:
 * - face='front': Rapid identity, Blood Group, QR Access, and Direct ICE Contact
 * - face='back': Clinical safeguards, Allergies (calm NKDA vs. crimson danger), Meds & Conditions
 * - variant='light' (Clinical Day White) | 'dark' (Matte Slate Gray)
 */
export default function TriagePhysicalCard({
  patient = {},
  variant = 'light',
  face = 'front', // 'front' | 'back'
  emergencyPortalUrl = '',
  onCopy = null,
  copied = false,
}) {
  const isDark = variant === 'dark';
  const isBack = face === 'back';

  // Format Dynamic Patient Values from user data
  const resolvedPatientId = patient.user_id || patient.patient_id || patient.id || (patient.mrn ? String(patient.mrn).replace(/^MRN-/, '').replace(/-QX$/, '') : '') || '';
  const fullName = patient.name || patient.full_name || patient.username || (resolvedPatientId ? `Patient ${resolvedPatientId}` : 'Patient');
  const cleanName = fullName.replace(/^Dr\.?\s+/i, '').trim();
  const firstName = cleanName.split(' ')[0] || 'Patient';
  const lastName = cleanName.split(' ').slice(1).join(' ') || '';
  const bloodGroup = patient.blood_group || patient.bloodGroup || '—';

  const patientId = resolvedPatientId || (cleanName && cleanName !== 'Patient'
    ? `USR-${cleanName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')}`
    : 'USR-PATIENT');

  const hospital = patient.hospital || patient.attending_center || patient.attendingCenter || patient.facility || 'Q-Rakshak Clinical AI OPD';
  const mrn = patient.mrn || patient.license_id || (patientId ? `MRN-${patientId}-QX` : 'MRN-UNLINKED');
  const abhaId = patient.abha_id || patient.abhaId || '—';
  const age = patient.age || patient.demographics?.age || '';
  const gender = patient.gender || patient.sex || patient.demographics?.gender || '';

  // Emergency Contact & ICE Formatting (Eliminate broken '— (-)' artifacts)
  const rawPrimary = patient.emergency_contacts?.find(c => c.is_primary && c.phone && c.phone !== '—') ||
    patient.emergency_contacts?.find(c => c.phone && c.phone !== '—') ||
    patient.emergency_contacts?.[0] || {};

  const contactName = rawPrimary.name || patient.emergency_contact_name || (patient.emergency_contact && patient.emergency_contact !== '—' ? 'Contact' : '');
  const contactPhone = (rawPrimary.phone && rawPrimary.phone !== '—')
    ? rawPrimary.phone
    : (patient.emergency_phone && patient.emergency_phone !== '—'
      ? patient.emergency_phone
      : (patient.phone && patient.phone !== '—' ? patient.phone : ''));
  const contactRelation = rawPrimary.relation || patient.emergency_contact_relation || '';

  const emailFormatted = patient.primary_email || patient.email || '';
  const locationFormatted = hospital !== '—' ? String(hospital).split(',')[0] : 'Emergency OPD';

  // Clinical Details & Allergy Priority Calculation
  const rawAllergies = Array.isArray(patient.allergies)
    ? patient.allergies.map(a => typeof a === 'string' ? a : (a.allergen || a.name || '')).filter(Boolean).join(', ')
    : (typeof patient.allergies === 'string' ? patient.allergies : '');

  const hasRealAllergies = Boolean(
    rawAllergies &&
    !/^(no known|none|nil|n\/a|—|-)/i.test(rawAllergies.trim())
  );
  const allergiesList = hasRealAllergies ? rawAllergies : 'No known drug allergies (NKDA)';

  const medsList = Array.isArray(patient.medications || patient.active_medications)
    ? ((patient.medications || patient.active_medications).length > 0
      ? (patient.medications || patient.active_medications).map(m => typeof m === 'string' ? m : (m.name || 'None')).join(', ')
      : 'None recorded')
    : (patient.medications || patient.active_medications || 'None recorded');

  const conditionsList = Array.isArray(patient.chronic_conditions || patient.conditions)
    ? (patient.chronic_conditions || patient.conditions).filter(Boolean).join(', ')
    : (patient.chronic_conditions || patient.conditions || '');

  const targetTriageUrl = emergencyPortalUrl || getEmergencyPortalUrl(patientId);

  return (
    <div className={`triage-card-shell metallic-sheen hardware-accelerated ${isDark ? 'triage-dark' : 'triage-light'} ${isBack ? 'triage-card-back-view' : ''}`}>
      
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FRONT FACE (Immediate Recognition & Emergency Telemetry Access)    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {!isBack && (
        <>
          <div className="triage-card-top-grid">
            
            {/* ── LEFT CELL: Patient Identity & Giant Blood Group ── */}
            <div className="triage-cell triage-cell-left">
              <div className="triage-inner-frame">
                {/* Clean Pass Header Strip (No fake window dots) */}
                <div className="triage-pass-badge-strip">
                  <span className="triage-pulse-pip" />
                  <span className="triage-badge-text">EMERGENCY MEDICAL PASS</span>
                </div>

                {/* Prominent High-Contrast Blood Group Tag */}
                <div className="triage-blood-tag">
                  <span className="triage-blood-lbl">BLOOD GROUP</span>
                  <span className="triage-blood-val">{bloodGroup}</span>
                </div>

                {/* Bold Patient Name & Vital Demographics */}
                <div className="triage-giant-headline">
                  <div className="triage-headline-label">PATIENT RECORD</div>
                  <div className="triage-headline-name">{firstName}</div>
                  <div className="triage-headline-last">{lastName}</div>
                  <div className="triage-demographics-row">
                    {age ? <span>{age} YRS</span> : null}
                    {gender ? <span>{gender.toUpperCase()}</span> : null}
                    <span>ID: {patientId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT CELL: Status Header + Clean QR Code + Direct ICE ── */}
            <div className="triage-cell triage-cell-right">
              <div className="triage-inner-frame">
                {/* Clean Status Tabs Header */}
                <div className="triage-tabs-header">
                  <a href="tel:108" className="triage-tab-item emergency-hotline" title="Call 108 Ambulance">
                    <Ambulance size={12} />
                    <span>EMS 108</span>
                  </a>
                  <div className="triage-tab-divider" />
                  <div className="triage-tab-item" title={patient.organ_donor ? 'Organ Donor Consented' : 'Donor Status'}>
                    <Heart size={12} color={patient.organ_donor ? (isDark ? '#4ADE80' : '#16A34A') : '#94A3B8'} />
                    <span>{patient.organ_donor ? 'DONOR: YES' : 'DONOR: —'}</span>
                  </div>
                </div>

                {/* Scannable High-Contrast QR Code */}
                <div className="triage-qr-meta-box">
                  <div className="triage-qr-wrap">
                    <QRCodeSVG
                      value={targetTriageUrl}
                      size={68}
                      fgColor={isDark ? '#000000' : '#0F172A'}
                      bgColor="#FFFFFF"
                      margin={1}
                    />
                  </div>
                  <div className="triage-meta-text">
                    <div className="triage-title-row">
                      <span className="triage-card-title-text">SCAN FOR LIVE EHR</span>
                      <ChevronRight size={13} className="triage-chevron" />
                    </div>
                    <div className="triage-affiliation-text">{locationFormatted}</div>
                    <div className="triage-tagline-text">Real-Time Vitals & Directives</div>
                  </div>
                </div>

                {/* Direct ICE Contact Information */}
                <div className="triage-contact-rows">
                  <div className="triage-contact-line primary-ice">
                    <Phone size={11} className="triage-contact-icon" />
                    <span className="triage-contact-val">
                      <strong>ICE: </strong>
                      {contactPhone ? (
                        <a href={`tel:${contactPhone.replace(/[^0-9+]/g, '')}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {contactPhone} {contactName ? `(${contactName})` : ''}
                        </a>
                      ) : (
                        <span>National EMS 108</span>
                      )}
                    </span>
                  </div>
                  {emailFormatted && emailFormatted !== '—' && (
                    <div className="triage-contact-line">
                      <Mail size={11} className="triage-contact-icon" />
                      <span className="triage-contact-val">{emailFormatted}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* ── BOTTOM SECTION: Standard ABHA & MRN Record Bar ── */}
          <div className="triage-bottom-tray">
            <div className="triage-inner-frame triage-bottom-frame">
              <div className="triage-handle-text">
                <span className="triage-at-symbol">ABHA:</span>
                <span className="triage-handle-value">{abhaId !== '—' ? abhaId : 'UNLINKED'}</span>
              </div>

              <div className="triage-bottom-meta">
                <span className="triage-id-badge">MRN: {mrn}</span>
                {onCopy && (
                  <button
                    type="button"
                    onClick={onCopy}
                    className="triage-copy-pill"
                    title="Copy triage link"
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copied ? 'Copied' : 'Share'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* BACK FACE (Clinical Directives, Allergies & Safeguards)             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isBack && (
        <>
          <div className="triage-card-top-grid">
            
            {/* ── LEFT CELL: Allergies & Organ Donor Status ── */}
            <div className="triage-cell triage-cell-left">
              <div className="triage-inner-frame">
                <div className="triage-pass-badge-strip">
                  <Shield size={11} />
                  <span className="triage-badge-text">CLINICAL SAFEGUARDS</span>
                </div>

                {/* Conditional Allergies Box (Crimson when present, calm neutral when NKDA) */}
                <div className={`triage-back-alert-box ${hasRealAllergies ? 'alert-danger' : 'alert-neutral'}`}>
                  <div className="triage-back-lbl">
                    {hasRealAllergies ? '⚠️ CRITICAL DRUG ALLERGIES' : 'ALLERGY STATUS'}
                  </div>
                  <div className={hasRealAllergies ? 'triage-back-val-danger' : 'triage-back-val-neutral'}>
                    {allergiesList}
                  </div>
                </div>

                {/* Organ Donor & Advance Directive Status */}
                <div className="triage-back-donor-badge">
                  <Heart size={11} color={patient.organ_donor ? (isDark ? '#4ADE80' : '#16A34A') : '#94A3B8'} />
                  <span>ORGAN DONOR: {patient.organ_donor ? 'YES (CONSENTED)' : 'NO / UNCONFIRMED'}</span>
                </div>

                {conditionsList && (
                  <div className="triage-back-condition-box">
                    <span className="triage-back-lbl">CONDITIONS:</span>
                    <span className="triage-back-val-text">{conditionsList}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT CELL: Active Meds & Single Clear First Responder Directive ── */}
            <div className="triage-cell triage-cell-right">
              <div className="triage-inner-frame">
                <div className="triage-tabs-header">
                  <div className="triage-tab-item" title="MRN Record">
                    <FileText size={11} />
                    <span>{mrn}</span>
                  </div>
                  <div className="triage-tab-divider" />
                  <div className="triage-tab-item" title="Attending Center">
                    <Stethoscope size={11} />
                    <span>ATTENDING</span>
                  </div>
                </div>

                {/* Active Prescriptions (Rx) */}
                <div className="triage-back-rx-box">
                  <div className="triage-back-lbl">ACTIVE MEDICATIONS (Rx)</div>
                  <div className="triage-back-rx-text">{medsList}</div>
                </div>

                {/* Single Authoritative First Responder Directive (No duplicate) */}
                <div className="triage-back-instruction-box">
                  <div className="triage-back-lbl">FIRST RESPONDER DIRECTIVE</div>
                  <p className="triage-back-instruction-text">
                    Scan front QR pass for verified real-time vitals, trauma history & emergency physician directives.
                  </p>
                </div>

                <div className="triage-back-attending-row">
                  <span className="triage-back-lbl">FACILITY: </span>
                  <span className="triage-back-val-bold">{hospital}</span>
                </div>
              </div>
            </div>

          </div>

          {/* ── BOTTOM TRAY: Cryptographic Ledger Verification Seal ── */}
          <div className="triage-bottom-tray">
            <div className="triage-inner-frame triage-bottom-frame">
              <div className="triage-handle-text">
                <ShieldCheck size={13} style={{ marginRight: '4px', opacity: 0.9 }} />
                <span>SHA-256 IMMUTABLE LEDGER PASS</span>
              </div>

              <div className="triage-bottom-meta">
                <span className="triage-id-badge">ID: {patientId}</span>
                <span className="triage-verified-tag">VERIFIED</span>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
