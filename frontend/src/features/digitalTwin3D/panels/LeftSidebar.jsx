import React, { useState, useEffect, useRef } from 'react';
import { useTwinStore } from '../store/twinStore';
import { DISEASE_REGISTRY } from '../data/diseaseRegistry';
import BreastCancerControls from '../diseases/BreastCancerControls';
import HeartDiseaseControls from '../diseases/HeartDiseaseControls';
import DiabetesControls from '../diseases/DiabetesControls';
import PneumoniaControls from '../diseases/PneumoniaControls';
import LiverDiseaseControls from '../diseases/LiverDiseaseControls';
import {
  User, Activity, Pill, Clock, AlertTriangle,
  ChevronDown, ChevronRight, Plus, Trash2, Search,
  Loader2, UserCheck, Stethoscope, Dna, FlaskConical,
  X, Check, ShieldCheck, Heart, Wind, Thermometer,
  Sparkles, RefreshCw
} from 'lucide-react';
import { authApi } from '../../../api/auth';

function SectionHeader({ icon: Icon, title, color = 'var(--dt-accent-blue)' }) {
  return (
    <div className="dt-section-header">
      <Icon size={14} color={color} />
      <h4 className="dt-section-title">{title}</h4>
    </div>
  );
}

// ── Tab Definitions ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',   label: 'Vitals',        icon: Activity },
  { id: 'disease',    label: 'Simulation',    icon: Stethoscope },
  { id: 'history',    label: 'History',       icon: Clock },
  { id: 'meds',       label: 'Medications',   icon: Pill },
];

// ── Health data and overview tab ─────────────────────────────────────────────
function TelemetryTab() {
  const patient           = useTwinStore((s) => s.patient);
  const toggleSymptom     = useTwinStore((s) => s.toggleSymptom);
  const setPatientField   = useTwinStore((s) => s.setPatientField);
  const setPatientNested  = useTwinStore((s) => s.setPatientNested);
  const patientMode       = useTwinStore((s) => s.patientMode);

  const v = patient.vitals || {};
  const sys  = v.bloodPressureSystolic  ? Number(v.bloodPressureSystolic)  : null;
  const dia  = v.bloodPressureDiastolic ? Number(v.bloodPressureDiastolic) : null;
  const hr   = v.heartRate              ? Number(v.heartRate)              : null;
  const spo2 = v.spo2                   ? Number(v.spo2)                   : null;
  const temp = v.temperature            ? Number(v.temperature)            : null;

  const hasVitals = sys !== null || hr !== null || spo2 !== null || temp !== null;

  const bpElevated = sys !== null && dia !== null && (sys > 130 || dia > 85);
  const hrElevated = hr !== null && (hr > 95 || hr < 55);
  const spo2Low    = spo2 !== null && spo2 < 95;

  // Calculate BMI only if height and weight are present
  const hCm  = Number(patient.heightCm) || 0;
  const wKg  = Number(patient.weightKg) || 0;
  const hasBMI = hCm > 0 && wKg > 0;
  const bmi  = hasBMI ? (wKg / ((hCm / 100) ** 2)).toFixed(1) : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Verified Patient Demographics Badge */}
      <div className="dt-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--dt-font-sans)', fontSize: '0.64rem', color: 'var(--dt-accent-blue)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Patient Profile
            </div>
            <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--dt-text-primary)', marginTop: '2px' }}>
              {patient.firstName ? `${patient.firstName} ${patient.lastName || ''}`.trim() : (patient.patientId ? `Patient #${patient.patientId}` : 'Patient')}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--dt-text-muted)', marginTop: '2px' }}>
              ID: {patient.patientId || patient.id || '—'}
            </div>
          </div>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'var(--dt-accent-blue-soft)',
              border: '1px solid rgba(2, 132, 199, 0.2)',
              color: 'var(--dt-accent-blue)',
              fontSize: '0.64rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ShieldCheck size={11} /> Connected
          </span>
        </div>

        {/* Demographic Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '8px' }}>
          <div style={{ background: 'var(--dt-bg-surface)', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--dt-border-default)' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--dt-text-muted)', fontWeight: 700 }}>BLOOD</div>
            <div style={{ fontSize: '0.80rem', fontWeight: 800, color: 'var(--dt-accent-blue)' }}>{patient.bloodType || '—'}</div>
          </div>
          <div style={{ background: 'var(--dt-bg-surface)', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--dt-border-default)' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--dt-text-muted)', fontWeight: 700 }}>SEX</div>
            <div style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--dt-text-primary)', textTransform: 'capitalize' }}>{patient.sex || '—'}</div>
          </div>
          <div style={{ background: 'var(--dt-bg-surface)', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--dt-border-default)' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--dt-text-muted)', fontWeight: 700 }}>AGE</div>
            <div style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--dt-text-primary)' }}>{patient.ageGroup || (patient.dateOfBirth ? `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} yrs` : '—')}</div>
          </div>
          <div style={{ background: 'var(--dt-bg-surface)', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--dt-border-default)' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--dt-text-muted)', fontWeight: 700 }}>BMI</div>
            <div style={{ fontSize: '0.80rem', fontWeight: 800, color: 'var(--dt-text-primary)' }}>{hasBMI ? bmi : '—'}</div>
          </div>
        </div>
      </div>

      {/* ── Heart and Breathing (only when vitals are recorded) ── */}
      {hasVitals ? (
        <div className="dt-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionHeader icon={Activity} title="Heart & Vitals" color="var(--dt-accent-blue)" />
            <span style={{ fontSize: '0.62rem', color: 'var(--dt-accent-blue)', fontWeight: 600 }}>
              Live Readings
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {/* Blood Pressure */}
            <div style={{ background: 'var(--dt-bg-surface)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--dt-border-default)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--dt-text-muted)', fontWeight: 700 }}>BLOOD PRESSURE</span>
                {sys !== null && dia !== null && (
                  <span style={{ fontSize: '0.56rem', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: bpElevated ? '#fee2e2' : '#e0f2fe', color: bpElevated ? '#dc2626' : 'var(--dt-accent-blue)' }}>
                    {bpElevated ? 'ELEVATED' : 'NORMAL'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--dt-text-primary)', fontFamily: 'var(--dt-font-sans)' }}>
                {sys !== null && dia !== null ? <>{sys} / {dia} <span style={{ fontSize: '0.64rem', color: 'var(--dt-text-muted)', fontWeight: 500 }}>mmHg</span></> : '—'}
              </div>
            </div>

            {/* Resting Heart Rate */}
            <div style={{ background: 'var(--dt-bg-surface)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--dt-border-default)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--dt-text-muted)', fontWeight: 700 }}>HEART RATE</span>
                <Heart size={12} color="var(--dt-accent-blue)" />
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--dt-text-primary)', fontFamily: 'var(--dt-font-sans)' }}>
                {hr !== null ? <>{hr} <span style={{ fontSize: '0.64rem', color: 'var(--dt-text-muted)', fontWeight: 500 }}>BPM</span></> : '—'}
              </div>
            </div>

            {/* SpO2 Saturation */}
            <div style={{ background: 'var(--dt-bg-surface)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--dt-border-default)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--dt-text-muted)', fontWeight: 700 }}>OXYGEN LEVEL</span>
                <Wind size={12} color="var(--dt-accent-blue)" />
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--dt-text-primary)', fontFamily: 'var(--dt-font-sans)' }}>
                {spo2 !== null ? <>{spo2}% <span style={{ fontSize: '0.64rem', color: 'var(--dt-text-muted)', fontWeight: 500 }}>SpO2</span></> : '—'}
              </div>
            </div>

            {/* Body Temperature */}
            <div style={{ background: 'var(--dt-bg-surface)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--dt-border-default)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--dt-text-muted)', fontWeight: 700 }}>TEMPERATURE</span>
                <Thermometer size={12} color="#D97706" />
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--dt-text-primary)', fontFamily: 'var(--dt-font-sans)' }}>
                {temp !== null ? <>{temp}° <span style={{ fontSize: '0.64rem', color: 'var(--dt-text-muted)', fontWeight: 500 }}>F</span></> : '—'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="dt-card" style={{ textAlign: 'center', padding: '16px 12px' }}>
          <Activity size={20} color="var(--dt-text-muted)" style={{ margin: '0 auto 6px' }} />
          <div style={{ fontSize: '0.74rem', color: 'var(--dt-text-secondary)', fontWeight: 700 }}>No vitals recorded</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--dt-text-muted)', marginTop: '3px' }}>Vitals populate automatically when connected to patient telemetry.</div>
        </div>
      )}

      {/* Active Diagnosed Conditions & Symptoms */}
      <div className="dt-card">
        <SectionHeader icon={AlertTriangle} title="Symptoms & Conditions" color="#D97706" />
        {patient.symptoms?.length > 0 ? (
          <div className="dt-symptoms-matrix">
            {patient.symptoms.map((symptom) => {
              const active = patient.symptoms.includes(symptom);
              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  className={`dt-symptom-tag ${active ? 'active' : ''}`}
                  title="Toggle symptom"
                >
                  {active && <Check size={11} strokeWidth={3} />}
                  <span>{symptom}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '0.72rem', color: 'var(--dt-text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
            No symptoms recorded
          </div>
        )}
      </div>

      {/* Clinical Observations & Record Notes */}
      <div className="dt-card">
        <label className="dt-label">Doctor Notes</label>
        <div
          style={{
            background: 'var(--dt-bg-surface)',
            border: '1px solid var(--dt-border-default)',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '0.74rem',
            color: patient.notes ? 'var(--dt-text-secondary)' : 'var(--dt-text-muted)',
            lineHeight: 1.5,
            fontStyle: patient.notes ? 'normal' : 'italic',
          }}
        >
          {patient.notes || 'No doctor notes recorded.'}
        </div>
      </div>
    </div>
  );
}

// ── Disease Simulation Tab ─────────────────────────────────────────────────────
function DiseaseTab() {
  const selectedDisease = useTwinStore((s) => s.selectedDisease);
  const setDisease      = useTwinStore((s) => s.setDisease);
  const diseases        = Object.values(DISEASE_REGISTRY);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="dt-card">
        <SectionHeader icon={Stethoscope} title="Select Condition to Simulate" color="var(--dt-accent-blue)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {diseases.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDisease(d.id)}
              className={`dt-affected-item ${selectedDisease === d.id ? 'active' : ''}`}
            >
              <div>
                <div style={{ fontWeight: 700, color: selectedDisease === d.id ? 'var(--dt-accent-blue)' : 'var(--dt-text-primary)' }}>
                  {d.name}
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--dt-text-muted)', marginTop: '2px' }}>
                  {d.category}
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.62rem',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: selectedDisease === d.id ? 'var(--dt-accent-blue-soft)' : 'var(--dt-bg-card-hover)',
                  color: selectedDisease === d.id ? 'var(--dt-accent-blue)' : 'var(--dt-text-muted)',
                  fontWeight: 700,
                }}
              >
                {d.targetOrgans.length} organ{d.targetOrgans.length > 1 ? 's' : ''}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Disease Controls */}
      <div className="dt-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="dt-label">Organ Adjustments</label>
          <span style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--dt-accent-blue)' }}>
            {DISEASE_REGISTRY[selectedDisease]?.name}
          </span>
        </div>
        {selectedDisease === 'BREAST_CANCER' && <BreastCancerControls />}
        {selectedDisease === 'HEART_DISEASE'  && <HeartDiseaseControls />}
        {selectedDisease === 'DIABETES'        && <DiabetesControls />}
        {selectedDisease === 'PNEUMONIA'       && <PneumoniaControls />}
        {selectedDisease === 'LIVER_DISEASE'   && <LiverDiseaseControls />}
      </div>
    </div>
  );
}

// ── Medical History & Allergies Tab ───────────────────────────────────────────
function HistoryTab() {
  const patient              = useTwinStore((s) => s.patient);
  const addAllergy           = useTwinStore((s) => s.addAllergy);
  const removeAllergy        = useTwinStore((s) => s.removeAllergy);
  const addCondition         = useTwinStore((s) => s.addCondition);
  const removeCondition      = useTwinStore((s) => s.removeCondition);

  const [newAllergy, setNewAllergy]     = useState('');
  const [newCondition, setNewCondition] = useState('');

  const handleAddAllergy = (e) => {
    e.preventDefault();
    if (newAllergy.trim()) {
      addAllergy(newAllergy.trim());
      setNewAllergy('');
    }
  };

  const handleAddCondition = (e) => {
    e.preventDefault();
    if (newCondition.trim()) {
      addCondition(newCondition.trim());
      setNewCondition('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Allergies Card */}
      <div className="dt-card">
        <SectionHeader icon={AlertTriangle} title="Allergies" color="var(--dt-accent-blue)" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {patient.allergies?.length > 0 ? (
            patient.allergies.map((allergy, idx) => {
              const allergenName = typeof allergy === 'string' ? allergy : (allergy?.allergen || allergy?.name || 'Allergy');
              const allergyId = (typeof allergy === 'object' && allergy?.id) ? allergy.id : (typeof allergy === 'string' ? allergy : idx);
              return (
                <span
                  key={allergyId || idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 8px',
                    borderRadius: '5px',
                    background: '#FFF1F2',
                    border: '1px solid #FECDD3',
                    color: '#E11D48',
                    fontSize: '0.70rem',
                    fontWeight: 600,
                  }}
                >
                  <span>{allergenName}</span>
                  <button
                    type="button"
                    onClick={() => removeAllergy(allergyId)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#E11D48' }}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'var(--dt-text-muted)' }}>No known allergies.</span>
          )}
        </div>

        <form onSubmit={handleAddAllergy} style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
          <input
            type="text"
            placeholder="Add new allergy..."
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
            className="dt-input"
            style={{ fontSize: '0.72rem' }}
          />
          <button type="submit" className="dt-action-btn" style={{ padding: '6px 12px' }}>
            <Plus size={13} />
          </button>
        </form>
      </div>

      {/* Chronic Conditions Card */}
      <div className="dt-card">
        <SectionHeader icon={Clock} title="Chronic Conditions" color="var(--dt-accent-blue)" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {((patient.chronicConditions && patient.chronicConditions.length > 0) ? patient.chronicConditions : (patient.medicalHistory || [])).length > 0 ? (
            ((patient.chronicConditions && patient.chronicConditions.length > 0) ? patient.chronicConditions : (patient.medicalHistory || [])).map((c, idx) => {
              const conditionName = typeof c === 'string' ? c : (c?.condition || c?.name || 'Condition');
              const condId = (typeof c === 'object' && c?.id) ? c.id : (typeof c === 'string' ? c : idx);
              return (
                <span
                  key={condId || idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 8px',
                    borderRadius: '5px',
                    background: 'var(--dt-bg-surface)',
                    border: '1px solid var(--dt-border-default)',
                    color: 'var(--dt-text-primary)',
                    fontSize: '0.70rem',
                    fontWeight: 600,
                  }}
                >
                  <span>{conditionName}</span>
                  <button
                    type="button"
                    onClick={() => removeCondition(condId)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--dt-text-muted)' }}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'var(--dt-text-muted)' }}>No chronic conditions recorded.</span>
          )}
        </div>

        <form onSubmit={handleAddCondition} style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
          <input
            type="text"
            placeholder="Add condition..."
            value={newCondition}
            onChange={(e) => setNewCondition(e.target.value)}
            className="dt-input"
            style={{ fontSize: '0.72rem' }}
          />
          <button type="submit" className="dt-action-btn" style={{ padding: '6px 12px' }}>
            <Plus size={13} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Active Prescriptions & Medications Tab ────────────────────────────────────
function MedsTab() {
  const patient           = useTwinStore((s) => s.patient);
  const addMedication     = useTwinStore((s) => s.addMedication);
  const removeMedication  = useTwinStore((s) => s.removeMedication);

  const [name, setName]     = useState('');
  const [dosage, setDosage] = useState('');
  const [freq, setFreq]     = useState('');

  const handleAddMed = (e) => {
    e.preventDefault();
    if (name.trim()) {
      addMedication({ name: name.trim(), dosage: dosage.trim() || 'Standard', frequency: freq.trim() || 'Daily' });
      setName('');
      setDosage('');
      setFreq('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="dt-card">
        <SectionHeader icon={Pill} title="Current Medications" color="var(--dt-accent-blue)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {patient.medications?.length > 0 ? (
            patient.medications.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--dt-bg-surface)',
                  border: '1px solid var(--dt-border-default)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--dt-text-primary)' }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--dt-text-muted)' }}>
                    {m.dosage} • {m.frequency}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeMedication(idx)}
                  style={{ background: 'none', border: 'none', color: '#E11D48', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'var(--dt-text-muted)' }}>No medications listed.</span>
          )}
        </div>

        <form onSubmit={handleAddMed} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
          <input
            type="text"
            placeholder="Medication name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="dt-input"
            style={{ fontSize: '0.72rem' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <input
              type="text"
              placeholder="Dosage (e.g. 10mg)..."
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="dt-input"
              style={{ fontSize: '0.72rem' }}
            />
            <input
              type="text"
              placeholder="Frequency (e.g. 1x daily)..."
              value={freq}
              onChange={(e) => setFreq(e.target.value)}
              className="dt-input"
              style={{ fontSize: '0.72rem' }}
            />
          </div>
          <button type="submit" className="dt-action-btn" style={{ justifyContent: 'center', marginTop: '2px' }}>
            <Plus size={13} /> Add Medication
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Master Left Sidebar Container ─────────────────────────────────────────────
export default function LeftSidebar() {
  const [activeTab, setActiveTab] = useState('overview');
  const patient = useTwinStore((s) => s.patient);
  const loadPatientFromDB = useTwinStore((s) => s.loadPatientFromDB);
  const patientMode = useTwinStore((s) => s.patientMode);
  const isFetchingPatient = patientMode === 'loading';

  const storedUser = authApi.getStoredUser();
  const initialPid = patient?.patientId || storedUser?.patient_id || storedUser?.user_id || storedUser?.id || '';
  const [inputPatientId, setInputPatientId] = useState(initialPid);

  // Keep input aligned if patient ID changes
  useEffect(() => {
    if (patient?.patientId) {
      setInputPatientId(patient.patientId);
    } else {
      const u = authApi.getStoredUser();
      const pid = u?.patient_id || u?.user_id || u?.id || '';
      if (pid) setInputPatientId(pid);
    }
  }, [patient?.patientId]);

  const handleFetch = (e) => {
    if (e) e.preventDefault();
    if (inputPatientId?.trim() && typeof loadPatientFromDB === 'function') {
      loadPatientFromDB(inputPatientId.trim());
    }
  };

  return (
    <aside className="dt-left-sidebar">
      {/* Patient Fetch Bar */}
      <div className="dt-panel-header">
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--dt-text-muted)', textTransform: 'uppercase' }}>
              Patient Record
            </span>
            <span style={{ fontSize: '0.64rem', color: 'var(--dt-accent-blue)', fontWeight: 600 }}>
              Live Sync
            </span>
          </div>

          <form onSubmit={handleFetch} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              value={inputPatientId}
              onChange={(e) => setInputPatientId(e.target.value)}
              placeholder="Enter Patient ID..."
              className="dt-input"
              style={{ padding: '6px 10px', fontSize: '0.74rem' }}
            />
            <button
              type="submit"
              disabled={isFetchingPatient}
              className="dt-action-btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.72rem' }}
            >
              {isFetchingPatient ? <Loader2 size={12} className="spin" /> : 'Load'}
            </button>
          </form>
        </div>
      </div>

      {/* Left Sidebar Tabs */}
      <div className="dt-tab-bar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`dt-tab-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Body */}
      <div className="dt-panel-body">
        {activeTab === 'overview' && <TelemetryTab />}
        {activeTab === 'disease'  && <DiseaseTab />}
        {activeTab === 'history'  && <HistoryTab />}
        {activeTab === 'meds'     && <MedsTab />}
      </div>
    </aside>
  );
}
