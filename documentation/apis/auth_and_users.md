# Authentication, OAuth 2.0 & RBAC Architecture

This document specifies user onboarding, Google Identity Services (GSI) verification, session JWT minting, and Role-Based Access Control (RBAC).

---

## 1. Authentication Lifecycle

```
[User Client] ──(1. Google Sign-In)──> [Google Identity Services]
      │                                         │
      │<──(2. Signed ID Token Credential)───────┘
      │
      ├──(3. POST /api/v1/auth/google/verify)──> [Q-RAKSHAK Auth Service]
      │                                                   │
      │                                       (4. Verify RS256 Signature)
      │                                       (5. Upsert User in DB)
      │                                       (6. Mint Session JWT)
      │                                                   │
      │<──(7. Return Session JWT & User Profile)──────────┘
```

---

## 2. Verify Google Credential (`POST /api/v1/auth/google/verify`)

Validates the Google OAuth 2.0 credential payload emitted by Google Identity Services client script.

### Request Body
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFhNmI4Y..."
}
```

### Response (`200 OK`)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in_seconds": 86400,
  "user": {
    "id": "USR-99120B",
    "email": "clinical.doctor@hospital.org",
    "name": "Dr. Sarah Chen, MD",
    "role": "DOCTOR",
    "department": "Cardiology & Triage",
    "avatar_url": "https://lh3.googleusercontent.com/a/...",
    "email_verified": true
  }
}
```

---

## 3. RBAC Role Matrix

| Permission Key | Description | PATIENT | DOCTOR | RESEARCHER | ADMIN |
|---|---|:---:|:---:|:---:|:---:|
| `triage:read` | Read own triage evaluations | ✅ | ✅ | ✅ | ✅ |
| `triage:write` | Execute doctor triage override | ❌ | ✅ | ❌ | ✅ |
| `records:own` | Access own longitudinal record | ✅ | ✅ | ❌ | ✅ |
| `records:all` | Access any patient health record | ❌ | ✅ | ❌ | ✅ |
| `quantum:infer` | Execute low-latency VQC inference | ✅ | ✅ | ✅ | ✅ |
| `quantum:circuits` | Inspect circuit parameters & barren plateau | ❌ | ❌ | ✅ | ✅ |
| `users:manage` | Manage clinical staff accounts | ❌ | ❌ | ❌ | ✅ |
