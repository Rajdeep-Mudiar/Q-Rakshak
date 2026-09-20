# Clinical Features Architecture

This section documents the clinical capabilities, workflows, and patient-facing innovations in Q-RAKSHAK.

---

## Feature Modules

1. **[Deterministic ESI Triage Engine](triage_engine.md)**  
   Multi-parameter clinical triage aligning with the Emergency Severity Index (ESI 1-5). Includes automated vital boundary checks and dynamic routing.

2. **[3D Anatomical Digital Twin](digital_twin_3d.md)**  
   Three.js & React-Three-Fiber interactive human anatomical model rendering organ risk hotspots (brain, lungs, heart, liver, pancreas).

3. **[Offline Emergency Medical Passport](emergency_passport.md)**  
   Self-contained clinical emergency passport accessible via QR codes for immediate paramedic triage without network dependencies.

4. **[Longitudinal Biomarker Tracker](longitudinal_tracker.md)**  
   Ordinary Least Squares (OLS) linear slope estimation and same-day sample averaging tracking multi-year clinical disease trajectories.
