from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_digital_twin_clean_baseline_for_new_patient():
    # Login as patient
    login_res = client.post("/api/v1/auth/login", json={"username": "alex.patient", "password": "patient123", "role": "patient"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Query digital twin state for a new patient with no diagnostic records
    res = client.get("/api/v1/digital-twin/state/NEW-PATIENT-TEST-123", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["has_records"] is False
    assert data["composite_risk_score"] == 0.0
    assert data["timeline_visits"] == []
    assert data["selected_visit"]["visit_id"] == "V-BASELINE"

    # All organs must have 0.0 risk score and normal status
    for organ in data["organs"]:
        assert organ["risk_score"] == 0.0
        assert organ["status"] == "normal"
        assert organ["pulse"] is False


def test_digital_twin_demo_simulation_fallback():
    login_res = client.post("/api/v1/auth/login", json={"username": "alex.patient", "password": "patient123", "role": "patient"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Query DEMO-SIMULATION
    res = client.get("/api/v1/digital-twin/state/DEMO-SIMULATION", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["has_records"] is True
    assert len(data["timeline_visits"]) > 0


def test_reports_privacy_when_no_patient_id():
    res = client.get("/api/v1/reports")
    assert res.status_code == 200
    data = res.json()
    # Unfiltered report list without patient_id must NOT return USR-ALEX records by default
    assert data["reports"] == []
