from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["platform"] == "Q-RAKSHAK"
    assert data["sih_problem_id"] == "26139"


def test_clinical_diagnosis_endpoint():
    payload = {"disease": "breast_cancer", "patient_id": "PT-TEST-101"}
    res = client.post("/api/v1/clinical/diagnose", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "prediction" in data
    assert "confidence" in data["prediction"]
    assert "explainability" in data
    assert "top_features" in data["explainability"]
    assert "disclaimer" in data


def test_benchmark_matrix_endpoint():
    res = client.get("/api/v1/benchmarks/matrix?disease=breast_cancer")
    assert res.status_code == 200
    data = res.json()
    assert "quantum_advantage_score" in data
    assert len(data["models"]) >= 4


def test_digital_twin_endpoint():
    patient_login = client.post(
        "/api/v1/auth/login",
        json={"username": "alex.patient", "password": "patient123", "role": "patient"},
    )
    assert patient_login.status_code == 200
    patient_headers = {"Authorization": f"Bearer {patient_login.json()['access_token']}"}
    res = client.get("/api/v1/digital-twin/state/PT-TEST-101", headers=patient_headers)
    assert res.status_code == 200
    data = res.json()
    assert "composite_risk_score" in data
    assert "organs" in data
    assert len(data["organs"]) >= 4

    doctor_login = client.post(
        "/api/v1/auth/login",
        json={"username": "dr.kavita", "password": "doctor123", "role": "doctor"},
    )
    assert doctor_login.status_code == 200
    doctor_headers = {"Authorization": f"Bearer {doctor_login.json()['access_token']}"}
    denied = client.get("/api/v1/digital-twin/state/PT-TEST-101", headers=doctor_headers)
    assert denied.status_code == 403


def test_compliance_and_reports_endpoints():
    # Audit logs
    res_audit = client.get("/api/v1/compliance/audit-logs")
    assert res_audit.status_code == 200

    # Model registry
    res_reg = client.get("/api/v1/compliance/model-registry")
    assert res_reg.status_code == 200

    # Consent update
    res_consent = client.post(
        "/api/v1/compliance/consent",
        json={"patient_id": "PT-TEST-101", "consent_storage": True, "consent_research": True, "consent_sharing": False},
    )
    assert res_consent.status_code == 200

    # Report generation
    res_rep = client.post(
        "/api/v1/reports/generate",
        json={"patient_id": "PT-TEST-101", "disease": "Breast Oncology", "prediction_class": "Malignant", "confidence": 0.95, "classical_confidence": 0.90},
    )
    assert res_rep.status_code == 200
    assert "report_html" in res_rep.json()


def test_patient_timeline_and_90_percent_threshold_endpoint():
    patient_id = "PT-TIMELINE-TEST"
    
    # 1. Check initial baseline timeline
    res = client.get(f"/api/v1/clinical/timeline/{patient_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    timeline = data["timeline"]
    assert timeline["threshold"] == 90.0
    assert "status" in timeline
    assert len(timeline["history"]) == 0
    assert timeline["status"] == "NO_EARLY_DISEASE_DETECTED"
    assert "No early disease detected" in timeline["insight_heading"]

    # 2. Persist an elevated diagnostic assessment
    record_payload = {
        "patient_id": patient_id,
        "disease": "Cardiovascular Disease (CAD)",
        "model_architecture": "CardioWave-VQC (8-Qubit Hardware-Efficient)",
        "prediction": {
            "class": "Cardiovascular Disease Present (High Risk)",
            "confidence": 0.88,
        },
        "classical_baseline": {"model": "Logistic Regression", "confidence": 0.82},
        "probabilities": {"Present": 0.88, "Absent": 0.12},
        "explainability": {"top_features": [{"feature": "Resting ECG ST-Slope", "percentage": 42.0}]},
        "inference_ms": 19.5,
    }
    rec_res = client.post("/api/v1/clinical/record", json=record_payload)
    assert rec_res.status_code == 200
    assert "record_id" in rec_res.json()

    # 3. Retrieve updated timeline and verify detection logic
    res_updated = client.get(f"/api/v1/clinical/timeline/{patient_id}")
    assert res_updated.status_code == 200
    timeline_up = res_updated.json()["timeline"]
    assert timeline_up["threshold"] == 90.0
    assert len(timeline_up["history"]) >= 1
    assert timeline_up["current_risk"] >= 80.0
    assert timeline_up["status"] == "EARLY_RISK_DETECTED"
    assert timeline_up["projected_crossing_date"] is not None

