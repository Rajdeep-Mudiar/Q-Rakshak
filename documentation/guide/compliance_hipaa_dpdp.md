# Healthcare Regulatory Compliance: DPDP Act 2023 & HIPAA

This document describes how **Q-RAKSHAK** fulfills legal and regulatory obligations under the **Indian Digital Personal Data Protection (DPDP) Act 2023** and the **US Health Insurance Portability and Accountability Act (HIPAA)**.

---

## 1. Indian DPDP Act 2023 Compliance Matrix

| DPDP Section / Principle | Clinical AI Requirement | Q-RAKSHAK Implementation |
|---|---|---|
| **Section 6 (Consent)** | Free, specific, informed, and unambiguous consent prior to health data processing. | Digital consent collection modal presented during intake, recording purpose and timestamp. |
| **Section 7 (Data Minimization)** | Process only data strictly required for clinical triage. | Triage schemas validate and discard extraneous tracking cookies, device IDs, or financial information. |
| **Section 8 (Data Security)** | Reasonable security safeguards preventing personal data breach. | End-to-end AES-256 encryption at rest, TLS 1.3 in transit, and salted SHA-256 patient ID hashing. |
| **Section 9 (Children's Data)** | Verifiable parental consent for minors (< 18 yrs). | Emergency card generation for minors requires verified guardian identity and explicit parental flag. |
| **Section 12 (Right to Erasure)** | Data principals have the right to erase personal data upon request. | Automated purge routine (`POST /api/v1/compliance/purge-user`) scrubbing identifying records from DB. |

---

## 2. US HIPAA Security & Privacy Rule Safeguards

### Administrative Safeguards
- **Role-Based Access Control (RBAC)**: Enforces `PATIENT`, `DOCTOR`, `RESEARCHER`, `ADMIN` privilege segregation.
- **Audit Logs**: Every clinical database query and model prediction records:
  - Timestamp (UTC ISO 8601)
  - Clinician ID & Role
  - Patient ID (Hashed)
  - Action performed & modified fields

### Technical Safeguards
- **De-Identification Standard**: Safe Harbor Method removing 18 HIPAA identifiers before researcher cohort export.
- **Offline Emergency Mode**: Emergency card stores only non-stigmatizing critical resuscitation data (blood type, allergies) on client devices without streaming historical records.
