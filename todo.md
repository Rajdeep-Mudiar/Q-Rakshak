# Q-Rakshak Frontend + Backend Remediation TODO

## 0. Execution Rules

- Work through this file top-to-bottom.
- First audit the complete application; do not start random edits.
- Do not introduce demo-only shortcuts, special preferences, hidden fallbacks, hardcoded users, fake clinical data, or UI-only fixes that leave backend behavior unchanged.
- Do not invent patient/clinical records.
- Preserve existing working functionality unless it conflicts with this TODO.
- After each logical group, run the relevant tests/build and fix regressions before continuing.
- All patient-specific data must be scoped to the authenticated user on the server, not merely filtered in React.
- Never use a hardcoded patient ID as a fallback.
- Do not expose secrets, plaintext passwords, JWT secrets, API keys, or credential hashes in frontend code.
- Do not commit `.env`, database credentials, production secrets, or generated credential dumps.
- Do not create a "special preference" or preferred-user path for any account.

---

# 1. Full Application Audit — DO THIS FIRST

## 1.1 Repository inventory

Identify:

- Frontend entry points
- Backend entry points
- Authentication/security modules
- API client/interceptor
- Login/register pages
- Navbar/header/footer components
- Profile/settings pages
- All dashboard/portal pages
- Doctor pages
- Patient pages
- Researcher/admin pages
- Analysis/diagnostic pages
- Timeline/chart/graph components
- EHR/medical-record components
- Translation/i18n files
- Route definitions
- Protected-route/auth guards
- Database schema/models
- Seed scripts/migrations
- Tests
- `.env` / `.env.example` usage
- Any hardcoded patient IDs, user IDs, hospital names, SpO2/HR/BP fields, "Verified EHR", "AIIMS Clinical AI OPD", language selectors, or triage routes

## 1.2 Search globally

Search the complete repository for at least:

- `AIIMS Clinical AI OPD`
- `AIIMS`
- `Clinical AI OPD`
- `Verified EHR`
- `verifiedEhr`
- `verified_ehr`
- `SpO2`
- `spo2`
- `oxygen`
- `heart rate`
- `heartRate`
- `HR`
- `blood pressure`
- `bloodPressure`
- `BP`
- `triage`
- `USR-5EF52B`
- `DOC-USR-ARYAN`
- `DOC_USR_ARYAN`
- `aryan`
- `patientId`
- `fallback`
- `language`
- `i18n`
- `locale`
- `translation`
- `Quick Demo`
- `demo login`
- `special preference`
- hardcoded usernames/passwords
- hardcoded clinical values
- hardcoded user IDs
- `X-API-Key`
- `Authorization`
- `JWT_SECRET`
- `auth_expired`

Document every occurrence in `todo.md` as either:
- remove,
- replace,
- migrate,
- retain with justification.

---

# 2. Branding / Facility

## Required change

Replace:

`AIIMS Clinical AI OPD`

with:

`Q-Rakshak`

wherever it is used as the facility/hospital/organization label.

Also inspect:

- login
- registration
- dashboard
- patient portal
- doctor portal
- researcher portal
- admin portal
- profile
- settings
- medical records
- consultation
- analysis
- exports/PDFs
- cards
- navbar/footer
- metadata/title
- seed/database data
- generated reports

Do not blindly replace legitimate references if they are historical/source metadata; review each occurrence.

---

# 3. Remove Login-Page Language Selector

On the login page navbar:

- remove the language-change control completely.
- remove its associated dropdown/button/icon.
- remove only the login-navbar selector; do not disable global multilingual support.
- ensure the login page still renders correctly after removal.
- language can continue to be controlled through the application's intended global mechanism elsewhere.

---

# 4. Multilingual Support — COMPLETE FRONTEND AUDIT

The multilingual system must work consistently across the entire frontend.

## Requirements

Audit every route/page/component and make all user-visible static text translatable.

Do not leave:

- English-only buttons
- English-only validation errors
- English-only empty states
- English-only chart labels
- English-only tooltips
- English-only modal text
- English-only dropdowns
- English-only profile/settings labels
- English-only login/register text
- English-only doctor/patient/researcher/admin pages
- hardcoded strings inside reusable components

## Implementation

Use one consistent i18n architecture.

For every page:

1. Identify all visible strings.
2. Move them into translation resources.
3. Use translation keys in components.
4. Ensure interpolation works correctly.
5. Ensure pluralization/date/number formatting works where needed.
6. Ensure dynamic values are not translated incorrectly.
7. Ensure missing translation keys have a controlled fallback.
8. Avoid duplicate translation keys with conflicting meanings.
9. Keep terminology consistent across the application.

## Required language QA

Test every supported language on:

- Login
- Registration
- Dashboard
- Patient Portal
- Medical Records
- Analysis
- Disease timeline
- Prediction timeline
- AI consultation
- Doctor dashboard
- Doctor patient view
- Researcher dashboard
- Admin dashboard
- Profile
- Settings
- Modals
- Forms
- Error states
- Empty states
- Loading states
- Export/report screens

Check:

- text overflow
- button width
- navbar overflow
- card height
- chart labels
- table width
- mobile layout
- untranslated strings
- broken interpolation
- missing keys
- language persistence after navigation/reload

Do not translate medical/scientific identifiers or database IDs unless they are normal user-facing labels.

---

# 5. Remove SpO2 / HR / BP From the Entire Application

Remove these concepts from existence throughout the application unless an unavoidable external protocol requires them.

Remove from:

- frontend UI
- backend schemas/models
- API request/response models
- validation
- database fields
- seed data
- charts
- graphs
- dashboards
- analysis summaries
- patient records
- doctor views
- researcher views
- admin views
- reports/PDFs
- exports
- tooltips
- filters
- search
- translations
- TypeScript interfaces/types
- Python/Pydantic models
- JavaScript objects
- fixtures
- tests
- mock data

Search for semantic aliases as well:

- `SpO2`
- `spo2`
- `oxygenSaturation`
- `oxygen_saturation`
- `oxygen saturation`
- `HR`
- `heartRate`
- `heart_rate`
- `pulse`
- `BP`
- `bloodPressure`
- `blood_pressure`
- `systolic`
- `diastolic`

Do not simply hide these fields with CSS. Delete their data flow where safe.

If database migration is required, create a proper migration rather than silently breaking existing records.

---

# 6. Replace "Verified EHR" With "My Medical Records"

Required terminology:

`Verified EHR` -> `My Medical Records`

Remove all old terminology from:

- UI
- components
- routes where applicable
- translation keys
- backend labels
- reports
- metadata
- tests

The user-facing feature should be clearly named:

`My Medical Records`

Do not retain a hidden duplicate feature called Verified EHR.

If `verifiedEhr` is a technical database/API concept, determine whether it is actually required. If it is not required, remove it; if it is required internally for compatibility, migrate it to a neutral medical-record concept without exposing the old name.

---

# 7. Remove the Referenced/Unwanted Feature From Existence

For the feature represented by the supplied screenshot/request:

- locate its component
- locate its route
- locate its API calls
- locate its database/model dependencies
- locate navigation/sidebar references
- locate translations
- locate tests
- remove it cleanly

Do not merely hide it.

After removal, verify that no dead route, broken import, orphan API call, or navigation link remains.

---

# 8. Authentication — Fix Login Persistence Properly

## 8.1 Authentication precedence

In backend authentication:

1. Check `Authorization: Bearer <JWT>` first.
2. Validate the JWT.
3. Resolve the real authenticated user from the token.
4. Only use `X-API-Key` as a fallback when there is no Bearer token.
5. Never let an API gateway identity override a logged-in user's JWT identity.

Apply the same rule to:

- `get_current_user`
- `get_optional_user`
- equivalent middleware/dependencies
- any websocket/authentication middleware if applicable

## 8.2 JWT persistence

Use a stable JWT secret supplied by environment configuration.

Never generate a new JWT signing secret on every server restart.

Use:

- development `.env`
- production secret manager/environment
- `.env.example` containing placeholders only

JWT lifetime target:

`604800 seconds = 7 days`

Do not hardcode a production secret.

## 8.3 Frontend auth client

Inspect `client.js`, `auth.js`, and all HTTP interceptors.

Required behavior:

- attach Bearer token when a logged-in user has one.
- attach `X-API-Key` only when no user Bearer token is available.
- do not overwrite the logged-in user with an API-gateway identity.
- do not clear valid tokens because of temporary network errors.
- do not dispatch `auth_expired` for ordinary non-auth failures.
- only clear authentication when the server establishes that the user session/token is actually invalid.
- persist the intended user/session safely across page refreshes.

## 8.4 `/auth/me`

Verify:

- Bearer token -> actual logged-in user
- API key only -> gateway/service identity if that behavior is required
- Bearer + API key -> Bearer user must win
- expired/invalid Bearer -> return the appropriate authentication error; do not silently switch identities

Add automated tests for all combinations.

---

# 9. Remove Quick Demo / Special Preference Login

The previous proposal to add:

- Quick Demo Login
- Patient persona selector
- Doctor persona selector
- Admin persona selector
- Researcher persona selector
- auto-filled demo credentials

must NOT be implemented.

Reason:

- it creates a special preference/path that was not requested.
- it encourages hardcoded credentials.
- it is unnecessary for production authentication.
- it can create accidental account switching.

Remove any existing implementation of these features.

If development-only test accounts are needed, keep them in test fixtures/scripts and never expose their credentials as production UI shortcuts.

---

# 10. Patient Data Isolation — CRITICAL

## Core rule

A logged-in patient must only be able to access their own patient data.

Never use:

`USR-5EF52B`

as a fallback.

Never use another patient's ID as a fallback.

## Frontend

Modify:

- `UnifiedAnalysisPage.jsx`
- `PredictionTimeline.jsx`
- `PatientPortal.jsx`
- `AIDoctorConsultationPage.jsx`
- all other patient-specific components

Use the authenticated user's actual identity.

Preferred flow:

`authenticated user -> authenticated user ID -> patient record lookup -> patient-specific data`

Do not derive access from arbitrary URL/query parameters without server-side authorization.

## Backend

Every patient-data endpoint must verify:

- authenticated identity
- role
- requested patient identity
- ownership/authorization relationship

For a patient requesting their own record:

`requestedPatientId === authenticatedPatientId`

If a patient requests another patient:

return `403 Forbidden` or equivalent authorization error.

Doctors may access patients only according to the application's explicit doctor authorization model.

Researchers/admins should use explicit role-based authorization rather than bypassing ownership checks.

## Empty state

If the logged-in patient has no records:

`No diagnostic history found for your account. Complete a checkup to generate your longitudinal trajectory.`

Do not show another user's history.

---

# 11. Patient ID Standardization

Required patient ID format:

`USR-<PATIENTNAME>`

Examples:

- Aryan Choudhury -> `USR-ARYAN`
- Alex Mercer -> `USR-ALEX`
- Rajesh Kumar -> `USR-RAJESH`

## Rules

- Use uppercase.
- Remove spaces and punctuation.
- Use a deterministic sanitized identifier.
- Ensure uniqueness.
- Do not use doctor IDs for patients.
- Do not use random legacy fallback IDs.
- Do not use `DOC-*` identifiers for patient records.

Important:

Do NOT blindly change IDs if foreign keys exist.

Before migration:

1. inspect all tables/models referencing user IDs.
2. migrate dependent rows.
3. update doctor/patient relationship tables where appropriate.
4. update indexes/unique constraints.
5. verify no orphan records remain.
6. run integrity checks.
7. only then remove legacy IDs.

If a patient's name changes, determine whether the ID is intended to be immutable. Prefer immutable internal IDs in a production-grade system; if the application explicitly requires name-derived IDs, enforce uniqueness and migration rules.

---

# 12. Specific Aryan Doctor/User Data Issue

The supplied migration currently contains both:

- `DOC-USR-ARYAN`
- `USR-ARYAN`

for the same doctor username.

Do not retain duplicate user identities.

Perform a controlled migration:

1. identify the canonical doctor user.
2. migrate all dependent references from legacy `DOC-USR-ARYAN` / `DOC_USR_ARYAN`.
3. update the doctor table's `user_id`.
4. update sessions/relationships/records where applicable.
5. enforce uniqueness on the user identity.
6. remove the duplicate user row only after all dependencies are migrated.
7. verify `dr.aryan` resolves to exactly one user.

Do not hardcode a special case for Aryan after migration.

The final implementation must use the same generic migration mechanism for every affected account.

---

# 13. Password Hashing — Strong, Uniform, Correct

The fact that password hashes are different is NOT itself a problem.

Strong password hashing algorithms intentionally produce different hashes for the same password because they use unique salts.

Do NOT force identical hash strings across users.

## Required policy

Use one approved password hashing implementation consistently for:

- patient
- doctor
- admin
- researcher

Prefer:

- Argon2id, or
- bcrypt with an appropriately configured work factor

Use the framework/library's standard secure password-hashing API.

## Requirements

- same algorithm family for all roles
- same security configuration/work factor
- unique random salt per password
- no plaintext passwords stored in DB
- no password hashes in frontend
- no hardcoded password comparison
- no role-specific weak hashing
- password verification through one central utility
- password upgrade/migration path for legacy hashes where required

Do NOT manually write:

`hash_password("password")`

into seed SQL in a way that creates weak/inconsistent configurations.

Use one central password utility during seeding.

For development seed accounts, document credentials only in local development documentation or test fixtures, never production UI.

---

# 14. Remove Doctor-Side Triage Page

The doctor interface does NOT need a triage page.

Remove:

- triage route
- triage navigation item
- triage component
- triage API calls used exclusively by that page
- triage translations
- triage imports
- triage tests if the feature is being fully removed

Check whether any shared backend endpoint is used elsewhere before deleting it.

Do not remove legitimate clinical analysis functionality merely because its UI was under the triage page.

---

# 15. Unified Analysis — No Premature Personal Graphs

In `UnifiedAnalysisPage.jsx`:

## Before analysis

When:

`result === null`

do NOT render personal:

- disease progression graph
- patient stage dots
- prediction curve
- disease stage markers

Instead render:

### Analysis Pending

**Title:**
`Personalized Trajectory Pending Analysis`

**Message:**
`You haven't run a clinical checkup for this disease yet. Upload your test file or click "Run Instant Quantum AI Checkup" to map your biological markers and early detection horizon.`

**CTA:**
`Run Checkup Now`

The CTA must trigger the actual analysis workflow.

## After analysis

Only when an actual analysis result exists:

- render personalized disease timeline
- render patient risk score if legitimately returned
- render patient prediction if legitimately returned
- render `PredictionTimeline` for the authenticated patient only

Never fabricate a result to make the chart appear.

---

# 16. DiseaseEarlyDetectionTimeline

When `patientRiskScore` is null:

show:

`Theoretical Reference Pathway (Pre-Clinical Model Baseline)`

Clearly indicate that it is:

- a population/model reference
- not the patient's personal result
- not a diagnosis

Do not show personal stage dots as if they came from the patient.

When a valid patient analysis result exists:

- map the timeline only from that patient's result.
- never use another patient's score.

---

# 17. PredictionTimeline

Remove:

`patientId = "USR-5EF52B"`

default.

Required behavior:

- no patient ID -> do not fetch another patient.
- authenticated patient -> resolve their patient ID.
- patient has no history -> show the patient's empty state.
- API authorization failure -> show an appropriate error.
- never silently substitute another patient.

---

# 18. Patient Portal and AI Doctor Consultation

For:

- `PatientPortal.jsx`
- `AIDoctorConsultationPage.jsx`

remove all hardcoded patient IDs.

Resolve identity from the authenticated session.

Backend must still enforce the same authorization.

Never trust a client-provided patient ID as proof of identity.

---

# 19. Profile Settings

Implement the profile/settings page directly.

Do NOT add an unnecessary introductory paragraph or "intro" section.

Keep:

- account information
- editable settings that actually exist
- security controls
- language settings if globally supported
- relevant preferences

Remove:

- decorative explanatory JSON blocks
- debug JSON
- raw API response objects
- internal IDs unless legitimately useful
- special preference controls
- duplicate identity information

If a settings JSON representation is needed internally for development, keep it out of the user-facing profile UI.

---

# 20. Clinical Data Integrity

Audit all clinical charts and data displays.

Rules:

- no graph before its underlying analysis exists.
- no patient data without authorization.
- no cross-patient fallback.
- no fabricated measurements.
- no hidden vital-sign fields.
- no "verified" clinical claim unless backed by the actual application workflow.
- distinguish model baseline/reference data from patient-specific results.
- label model-derived predictions as predictions, not diagnoses.

---

# 21. Navigation / Routes Cleanup

After removing features:

- inspect every route
- inspect every navbar/sidebar item
- inspect breadcrumbs
- inspect mobile navigation
- inspect role-specific navigation
- remove dead routes
- remove dead links
- remove lazy imports
- remove unused components
- remove unused API services
- remove obsolete translations

Verify:

- patient cannot see doctor-only triage
- doctor sees the correct doctor navigation
- researcher sees researcher navigation
- admin sees admin navigation
- no removed feature remains accessible by direct URL unless intentionally retained as an API-only backend endpoint.

---

# 22. Database Migration Plan

Before editing production-like database data:

1. create a backup.
2. inspect schema and foreign keys.
3. identify all affected rows.
4. run migration inside a transaction where supported.
5. migrate references.
6. validate counts.
7. validate foreign-key integrity.
8. remove duplicate/legacy identities.
9. remove obsolete columns only after application code no longer depends on them.
10. test application startup against the migrated DB.

Do not use a destructive one-off script without validation.

---

# 23. Required Database Checks

After migration, verify:

## Users

- every patient has `USR-<PATIENTNAME>`
- no duplicate usernames
- no duplicate user IDs
- no `DOC-*` patient IDs
- no legacy `DOC-USR-ARYAN`
- no legacy `DOC_USR_ARYAN`
- no `USR-5EF52B` fallback dependency

## Doctors

- every doctor references exactly one valid user
- `dr.aryan` references `USR-ARYAN`
- no duplicate doctor-user mapping

## Clinical records

- every patient record points to a valid patient
- no orphan patient records
- no cross-patient records
- no hardcoded fallback owner

---

# 24. Security Tests

Create/update automated tests for:

## Authentication

- valid Bearer token
- expired Bearer token
- invalid Bearer token
- API key only
- Bearer + API key
- missing credentials
- server restart with stable JWT secret

## Authorization

- patient accesses own records -> allowed
- patient accesses another patient -> denied
- doctor accesses authorized patient -> allowed
- doctor accesses unauthorized patient -> denied
- researcher/admin access follows explicit role policy

## Data isolation

Test at least:

- Aryan patient
- Alex patient
- another patient fixture

Verify no patient can receive another patient's:

- diagnosis history
- timeline
- analysis
- prediction
- medical records
- consultation history

---

# 25. Frontend Tests

Verify:

- refresh does not unexpectedly log out.
- user identity remains unchanged after `/auth/me`.
- login does not switch to gateway/admin identity.
- no quick-demo/special-preference login exists.
- no login-navbar language selector exists.
- no `USR-5EF52B` appears in source.
- no `AIIMS Clinical AI OPD` appears where it should be replaced.
- no `Verified EHR` remains.
- no SpO2/HR/BP UI/data remains.
- no doctor triage page exists.
- no premature disease graph appears.
- empty patient state works.
- multilingual text renders correctly on every route.

---

# 26. Source-Level Acceptance Searches

After implementation, run global searches again.

These should return zero relevant application-code occurrences unless explicitly documented as migration history/tests:

- `USR-5EF52B`
- `AIIMS Clinical AI OPD`
- `Verified EHR`
- `verifiedEhr`
- `Quick Demo Login`
- `special preference`
- doctor-side `triage`
- `DOC-USR-ARYAN`
- `DOC_USR_ARYAN`
- `spo2`
- `SpO2`
- `oxygenSaturation`
- `heartRate`
- `bloodPressure`
- `systolic`
- `diastolic`

For migration history, old IDs may legitimately appear in migration files. That is acceptable only if required for the migration and not used as runtime fallback data.

---

# 27. Build / Test / Runtime Verification

Run all relevant commands from the actual project.

## Backend

- dependency validation
- lint/type checks if configured
- unit tests
- authentication tests
- authorization tests
- database migration tests
- API tests

Run the project's exact configured test suite, including:

`pytest tests/api/test_auth_and_profile.py tests/api/test_auth_security.py`

if those files exist.

Also add/run the custom authentication verification:

- `/api/v1/auth/me` with Bearer token
- `/api/v1/auth/me` with API key
- both headers together

Expected behavior:

- Bearer identity wins when both are present.

## Frontend

Run:

- install/dependency validation
- lint
- typecheck if configured
- unit/component tests if configured
- production build

Then perform a route-by-route manual smoke test.

---

# 28. Manual QA Matrix

| Area | Expected |
|---|---|
| Login | Persistent session after refresh |
| Login navbar | No language selector |
| Login | No quick-demo/special preference |
| Branding | Q-Rakshak |
| Patient ID | `USR-<PATIENTNAME>` |
| Patient isolation | Only authenticated patient's data |
| Empty patient | Correct empty state |
| Analysis before run | No personal graph |
| Analysis after run | Patient-specific graph only |
| Timeline | No hardcoded patient |
| Medical records | "My Medical Records" |
| SpO2 | Completely removed |
| HR | Completely removed |
| BP | Completely removed |
| Doctor portal | No triage page |
| Password hashing | One strong algorithm/configuration |
| Password hashes | Unique per password due to salt |
| Multilingual | All frontend pages supported |
| Profile/settings | No unnecessary intro/debug JSON |
| Auth headers | Bearer takes precedence |
| JWT | Stable across restart |
| Cross-patient request | Forbidden |
| Legacy Aryan doctor ID | Migrated and removed from runtime |
| Demo credentials | Not exposed in production UI |

---

# 29. Final Code Quality Review

Before considering the task complete:

- remove unused imports.
- remove dead files.
- remove dead API methods.
- remove dead translation keys.
- remove duplicate user records.
- remove debug logging containing sensitive data.
- remove plaintext credentials.
- remove hardcoded IDs.
- remove hidden feature toggles for deleted functionality.
- ensure naming is consistent.
- ensure error messages are translatable.
- ensure accessibility labels are translated.
- ensure mobile responsiveness.
- ensure charts do not display misleading default data.
- ensure backend authorization cannot be bypassed by changing frontend state.

---

# 30. Final Completion Report

At the end, report:

1. Files modified
2. Files removed
3. Database migrations created/run
4. Authentication changes
5. Patient-isolation changes
6. Multilingual changes
7. Removed features/data fields
8. Branding changes
9. Password-hashing changes
10. Tests executed
11. Build result
12. Remaining issues, if any

Do not claim completion for anything that was not actually verified.

---

# Definition of Done

The task is complete only when all of the following are true:

- [ ] Q-Rakshak is the correct facility branding.
- [ ] Login navbar has no language selector.
- [ ] No special-preference or quick-demo login exists.
- [ ] Multilingual support works across every frontend page.
- [ ] SpO2/HR/BP have been removed from the application data flow and UI.
- [ ] "Verified EHR" has been replaced by "My Medical Records" and the old feature/name no longer exists at runtime.
- [ ] The specifically unwanted feature from the supplied screenshot/request is fully removed, not merely hidden.
- [ ] JWT authentication persists across refresh/restart with a stable configured secret.
- [ ] Bearer authentication takes precedence over API-key identity.
- [ ] No hardcoded patient fallback exists.
- [ ] Patient data is strictly isolated.
- [ ] Patient IDs follow the required convention.
- [ ] Duplicate Aryan doctor/user identity is migrated safely.
- [ ] Password hashing uses one strong, uniform algorithm/configuration for all roles.
- [ ] Password hashes remain unique because of unique salts.
- [ ] Doctor-side triage page is removed.
- [ ] No personal diagnostic graph appears before analysis.
- [ ] Reference model pathways are clearly distinguished from personal results.
- [ ] All relevant automated tests pass.
- [ ] Frontend production build passes.
- [ ] Final global source search is clean.
- [ ] No unresolved data/security regression remains.

