import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_report_generation_with_email():
    payload = {
        "patient_id": "USR-ALEX",
        "patient_name": "Aryan Choudhury",
        "user_email": "aryan.crores@gmail.com",
        "disease": "Breast Oncology (WDBC)",
        "prediction_class": "Malignant (High Risk)",
        "confidence": 0.9474,
        "classical_confidence": 0.9123,
        "top_biomarkers": ["Mean Radius (34%)", "Concavity (26%)"],
    }
    response = client.post("/api/v1/reports/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["patient_id"] == "USR-ALEX"
    assert "report_html" in data
    assert data["email_dispatched_to"] == "aryan.crores@gmail.com"


def test_explicit_report_email_endpoint():
    payload = {
        "patient_id": "USR-ALEX",
        "recipient_email": "aryan.crores@gmail.com",
        "patient_name": "Aryan Choudhury",
        "disease": "Dermatology Lesion",
        "prediction_class": "Melanoma (High Risk)",
        "confidence": 0.95,
        "classical_confidence": 0.89,
        "top_biomarkers": ["Asymmetry (30%)", "Color Variation (25%)"],
    }
    response = client.post("/api/v1/reports/email", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("success", "logged")
    assert data["recipient"] == "aryan.crores@gmail.com"


def test_emergency_card_email_endpoint():
    payload = {
        "recipient_email": "aryan.crores@gmail.com",
    }
    response = client.post("/api/v1/emergency/USR-ALEX/email-card", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("success", "logged")
    assert data["patient_id"] == "USR-ALEX"
