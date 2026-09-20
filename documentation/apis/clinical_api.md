# Clinical & Triage REST API Specification

The **Clinical API** is the core operational interface of Q-RAKSHAK, enabling medical intake, automated Emergency Severity Index (ESI) triage categorization, longitudinal biomarker aggregation, digital prescription management, and emergency medical passport delivery.

Base Path: `/api/v1/clinical`  
OpenAPI Interactive Docs: `http://localhost:8000/docs`

---

## Table of Contents
1. [Authentication & Authorization](#1-authentication--authorization)
2. [Deterministic ESI Triage (`POST /triage/assess`)](#2-deterministic-esi-triage-post-triageassess)
3. [Patient Longitudinal Record (`GET /patients/{id}/longitudinal`)](#3-patient-longitudinal-record-get-patientsidlongitudinal)
4. [Emergency Medical Passport (`GET /emergency/{id}`)](#4-emergency-medical-passport-get-emergencyid)
5. [Clinical Consultations & Prescriptions (`POST /consultations`)](#5-clinical-consultations--prescriptions-post-consultations)
6. [Error Handling & Status Codes](#6-error-handling--status-codes)

---

## 1. Authentication & Authorization

All requests (excluding the public read-only `/emergency/{id}` endpoint) must provide a valid JSON Web Token (JWT) in the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Supported User Scopes:
- `role:patient`: View own profile, vital telemetry, and emergency passport.
- `role:doctor`: Perform triage evaluations, create consultations, sign digital prescriptions.
- `role:researcher`: Access anonymized cross-cohort telemetry and model performance logs.
- `role:admin`: System administration, audit trail inspection, and RBAC key rotation.

---

## 2. Deterministic ESI Triage (`POST /triage/assess`)

Evaluates incoming physiological vitals and reported symptoms against the Emergency Severity Index 5-tier standard and executes model inference.

### Request Headers
| Header | Type | Required | Description |
|---|---|---|---|
| `Authorization` | String | Yes | Bearer JWT token |
| `Content-Type` | String | Yes | `application/json` |
| `Idempotency-Key` | String | No | UUID v4 preventing duplicate assessment submission |

### Request Body Schema
```json
{
  "patient_id": "USR-88219A",
  "vitals": {
    "heart_rate_bpm": 118,
    "systolic_bp_mmhg": 142,
    "diastolic_bp_mmhg": 94,
    "respiratory_rate_bpm": 24,
    "spo2_percentage": 93.5,
    "temperature_celsius": 38.7,
    "consciousness_level": "ALERT"
  },
  "primary_complaint": "Acute substernal chest pressure radiating to left arm",
  "symptoms": [
    "chest_pain",
    "diaphoresis",
    "dyspnea"
  ],
  "disease_focus": "heart_disease",
  "patient_history": {
    "has_hypertension": true,
    "has_diabetes": false,
    "smoker_status": "FORMER"
  }
}
```

### Response Schema (`200 OK`)
```json
{
  "assessment_id": "TRG-2026-99214A",
  "patient_id": "USR-88219A",
  "esi_level": 2,
  "esi_category": "Emergent",
  "triage_urgency_color": "#EF4444",
  "max_wait_time_minutes": 10,
  "requires_immediate_resuscitation": false,
  "vital_sign_stability": "UNSTABLE",
  "organ_risk_scores": {
    "cardiovascular": 0.842,
    "pulmonary": 0.410,
    "neurological": 0.120,
    "metabolic": 0.280,
    "oncological": 0.050
  },
  "model_execution": {
    "model_name": "Sentinel-MLP",
    "model_type": "Classical High-Precision SOTA",
    "routing_reason": "Automated clinical guardrail: Sentinel-MLP deployed for cardiovascular risk due to optimal specificity (0.5000 vs 0.0000) and AUC-ROC (1.0000 vs 0.8977)",
    "prediction_probability": 0.9778,
    "ece_calibrated_uncertainty": 0.0288,
    "conformal_prediction_set": ["High-Risk Acute Coronary Syndrome"]
  },
  "recommended_clinical_actions": [
    "Immediate placement in monitored acute bed",
    "Stat 12-lead Electrocardiogram (ECG) within 10 minutes",
    "Establish IV access and draw troponin I / CK-MB cardiac enzymes",
    "Administer supplemental O2 to maintain SpO2 >= 94%"
  ],
  "evaluated_at": "2026-09-20T15:25:00Z"
}
```

---

## 3. Patient Longitudinal Record (`GET /patients/{id}/longitudinal`)

Retrieves historical biomarker trajectory data with Ordinary Least Squares (OLS) slope analysis and same-day sample averaging.

### URL Parameters
- `id` (string, required): Patient identifier (e.g. `USR-5EF52B`).

### Query Parameters
- `biomarker` (string, optional): Filter by biomarker (`fasting_glucose`, `systolic_bp`, `updrs_motor`).
- `start_date` (ISO date, optional): `2025-01-01`.
- `end_date` (ISO date, optional): `2026-09-20`.

### Response (`200 OK`)
```json
{
  "patient_id": "USR-5EF52B",
  "biomarker": "systolic_bp",
  "unit": "mmHg",
  "total_records": 18,
  "ols_trend": {
    "slope": -0.421,
    "intercept": 142.5,
    "r_squared": 0.814,
    "trajectory": "IMPROVING",
    "clinical_interpretation": "Gradual reduction in systolic pressure following ACE-inhibitor titration."
  },
  "timeline": [
    {
      "date": "2026-03-15",
      "raw_measurements": [144, 142],
      "same_day_mean": 143.0,
      "standard_deviation": 1.41
    },
    {
      "date": "2026-06-20",
      "raw_measurements": [138, 136, 138],
      "same_day_mean": 137.33,
      "standard_deviation": 1.15
    },
    {
      "date": "2026-09-18",
      "raw_measurements": [130, 132],
      "same_day_mean": 131.0,
      "standard_deviation": 1.41
    }
  ]
}
```

---

## 4. Emergency Medical Passport (`GET /emergency/{id}`)

Public endpoint designed for first responders, paramedical personnel, and emergency departments via QR code scanning. Zero private health record data is leaked; only life-saving resuscitation details are served.

### Response (`200 OK`)
```json
{
  "patient_id": "USR-5EF52B",
  "full_name": "Aarav Sharma",
  "date_of_birth": "1984-06-14",
  "blood_group": "O+",
  "emergency_contacts": [
    {
      "name": "Priya Sharma",
      "relation": "Spouse",
      "phone_number": "+91-9876543210",
      "priority": 1
    }
  ],
  "critical_allergies": [
    {"allergen": "Penicillin", "severity": "ANAPHYLACTIC"},
    {"allergen": "Sulfa Drugs", "severity": "MODERATE"}
  ],
  "current_medications": [
    {"name": "Metformin", "dose": "500mg BID", "purpose": "Diabetes"},
    {"name": "Amlodipine", "dose": "5mg OD", "purpose": "Hypertension"}
  ],
  "active_diagnoses": ["Type 2 Diabetes Mellitus", "Stage 1 Essential Hypertension"],
  "advance_directives": {
    "dnr": false,
    "organ_donor": true
  },
  "verified_at": "2026-09-20T00:00:00Z"
}
```

---

## 5. Clinical Consultations & Prescriptions (`POST /consultations`)

Enables clinicians to file verified diagnoses, digital prescriptions, and follow-up orders.

### Request Body
```json
{
  "patient_id": "USR-5EF52B",
  "doctor_id": "DOC-77128B",
  "chief_complaint": "Follow-up consultation for glycemic control",
  "clinical_notes": "Patient reports adherence to diet. HbA1c reduced to 6.8%.",
  "prescriptions": [
    {
      "drug_name": "Metformin Hydrochloride",
      "dosage": "500 mg",
      "frequency": "Twice daily with meals",
      "duration_days": 90
    }
  ],
  "next_visit_date": "2026-12-20"
}
```

---

## 6. Error Handling & Status Codes

All errors conform to RFC 7807 problem details:

| HTTP Status | Error Code | Description |
|---|---|---|
| `400 Bad Request` | `VALIDATION_ERROR` | Malformed payload or physiological values outside biological reality (e.g. Heart rate < 20 or > 300). |
| `401 Unauthorized` | `INVALID_TOKEN` | Missing, expired, or corrupted JWT token. |
| `403 Forbidden` | `INSUFFICIENT_ROLE` | User role lacks permissions (e.g. Patient attempting doctor assessment). |
| `404 Not Found` | `PATIENT_NOT_FOUND` | Specified patient identifier does not exist. |
| `429 Too Many Requests`| `RATE_LIMIT_EXCEEDED`| Rate limit of 60 req/min exceeded. |
| `500 Internal Error` | `INFERENCE_FAILURE` | Backend inference engine failure; triggers automated fallback cache. |
