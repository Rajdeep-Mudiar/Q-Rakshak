# API Reference & Data Contracts

This directory details all REST and WebSocket contracts implemented in Q-RAKSHAK's FastAPI backend (`backend/app`).

---

## Contents

1. [API Architecture & Standards](#api-architecture--standards)
2. [Authentication & RBAC](#authentication--rbac)
3. [Component Documentation](#component-documentation)
   - [Clinical API](clinical_api.md)
   - [Quantum Engine Endpoints](quantum_endpoints.md)

---

## API Architecture & Standards

- **Base URL**: `http://localhost:8000/api/v1`
- **Specification**: OpenAPI 3.1.0 (`/docs` and `/redoc`)
- **Format**: JSON (`Content-Type: application/json`)
- **Error Format**: RFC 7807 Problem Details
- **Idempotency**: All `POST /api/v1/triage/assess` requests accept optional `Idempotency-Key` headers.

```json
{
  "error": {
    "code": "INVALID_BIOMARKER_VALUE",
    "message": "Fasting blood sugar cannot be negative.",
    "details": [{"field": "fasting_blood_sugar", "value": -5}],
    "timestamp": "2026-09-20T15:20:00Z"
  }
}
```

---

## Authentication & RBAC

All endpoints except public login routes and emergency card lookups (`/api/v1/clinical/emergency/{patient_id}`) require Bearer JWT authentication:

```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### Supported Roles:
- `PATIENT`: Access own longitudinal records, emergency passport, and consult booking.
- `DOCTOR`: Full clinical assessment, triage overrides, and prescription generation.
- `RESEARCHER`: Access quantum benchmark telemetry, ablation matrices, and circuit parameters.
- `ADMIN`: User management, audit trail inspection, and system metrics.
