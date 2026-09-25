from __future__ import annotations

import datetime
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db.repository import DatabaseRepository

client = TestClient(app)


def test_timeline_endpoint_empty_patient(client):
    """Test timeline endpoint for a patient with no history returns HTTP 200 with zero dummy data."""
    pid = "PT-FRESH-NO-HISTORY-001"
    res = client.get(f"/api/v1/clinical/timeline/{pid}")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    timeline = data["timeline"]
    assert timeline["has_history"] is False
    assert timeline["total_records"] == 0
    assert timeline["history"] == []
    assert timeline["daily_aggregates"] == []
    assert timeline["trend"]["status"] == "NO_HISTORY"


def test_patient_isolation_forbidden_for_other_patient(client, patient_headers):
    """Authenticated patient (alex.patient = USR-ALEX) cannot view another patient's timeline."""
    res = client.get("/api/v1/clinical/timeline/PT-SOMEONE-ELSE", headers=patient_headers)
    assert res.status_code == 403
    assert "Forbidden" in res.json()["detail"]


def test_patient_can_view_own_timeline(client, patient_headers):
    """Authenticated patient (USR-ALEX) can view their own timeline."""
    res = client.get("/api/v1/clinical/timeline/USR-ALEX", headers=patient_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "success"


def test_admin_can_view_any_patient_timeline(client, admin_headers):
    """Admin is authorized to view any patient's longitudinal timeline."""
    res = client.get("/api/v1/clinical/timeline/PT-SOMEONE-ELSE", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "success"


def test_timeline_recording_and_same_day_aggregation(client, admin_headers):
    """Verify that saving records through /record creates real timeline points and aggregates same-day entries."""
    pid = f"PT-INT-TEST-{datetime.datetime.now().strftime('%H%M%S')}"
    today = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")

    # Record 1
    r1 = client.post(
        "/api/v1/clinical/record",
        json={
            "id": f"{pid}-REC-01",
            "patient_id": pid,
            "disease": "Breast Oncology",
            "prediction": {"class": "Benign", "confidence": 0.85},
            "created_at": f"{today}T08:30:00",
            "model_architecture": "OncoPulse-VQC",
        },
        headers=admin_headers,
    )
    assert r1.status_code == 200

    # Record 2 on the same day
    r2 = client.post(
        "/api/v1/clinical/record",
        json={
            "id": f"{pid}-REC-02",
            "patient_id": pid,
            "disease": "Breast Oncology",
            "prediction": {"class": "Benign", "confidence": 0.75},
            "created_at": f"{today}T14:45:00",
            "model_architecture": "OncoPulse-VQC",
        },
        headers=admin_headers,
    )
    assert r2.status_code == 200

    # Query timeline
    res = client.get(f"/api/v1/clinical/timeline/{pid}", headers=admin_headers)
    assert res.status_code == 200
    t = res.json()["timeline"]

    assert t["has_history"] is True
    assert t["total_records"] == 2
    # Combined into 1 daily aggregate
    assert len(t["daily_aggregates"]) == 1
    da = t["daily_aggregates"][0]
    assert da["date"] == today
    assert da["count"] == 2
    assert len(da["raw_analyses"]) == 2


def test_timeline_disease_query_param(client, admin_headers):
    """Verify that GET /timeline/{patient_id}?disease=... filters by disease and returns available_diseases."""
    pid = f"PT-API-DIS-{datetime.datetime.now().strftime('%H%M%S')}"
    today = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")

    # Record A: Dermatology
    client.post(
        "/api/v1/clinical/record",
        json={
            "id": f"{pid}-DERM",
            "patient_id": pid,
            "disease": "Dermatoscopy (Skin Cancer)",
            "prediction": {"class": "nv (Benign)", "confidence": 0.92},
            "created_at": f"{today}T10:00:00",
        },
        headers=admin_headers,
    )

    # Record B: Pneumonia
    client.post(
        "/api/v1/clinical/record",
        json={
            "id": f"{pid}-PNEU",
            "patient_id": pid,
            "disease": "Chest Radiography (Pneu)",
            "prediction": {"class": "Normal", "confidence": 0.88},
            "created_at": f"{today}T11:00:00",
        },
        headers=admin_headers,
    )

    # Query specifically for skin / dermatoscopy
    res = client.get(f"/api/v1/clinical/timeline/{pid}?disease=skin", headers=admin_headers)
    assert res.status_code == 200
    t = res.json()["timeline"]
    assert t["has_history"] is True
    assert len(t["history"]) == 1
    assert "Dermatoscopy" in t["history"][0]["disease"]
    assert "Dermatoscopy (Skin Cancer)" in t["available_diseases"]
    assert "Chest Radiography (Pneu)" in t["available_diseases"]

    # Query for disease with no records
    res_none = client.get(f"/api/v1/clinical/timeline/{pid}?disease=parkinsons", headers=admin_headers)
    assert res_none.status_code == 200
    t_none = res_none.json()["timeline"]
    assert t_none["has_history"] is False
    assert t_none["total_records"] == 0

