from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_get_ai_doctor_config():
    res = client.get("/api/v1/ai-doctor/config")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "supported_voices" in data
    assert len(data["supported_voices"]) >= 3


def test_get_patient_ai_doctor_context():
    res = client.get("/api/v1/ai-doctor/context/USR-ALEX")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "dossier" in data
    dossier = data["dossier"]
    assert dossier["name"] == "Alex Mercer"
    assert "vitals" in dossier
    assert "temperature_f" in dossier["vitals"]
    assert "composite_risk_score" in dossier
    assert "recent_quantum_diagnoses" in dossier
    assert "system_prompt" in data
    assert "Dr. Quantum" in data["system_prompt"]
    assert "Alex Mercer" in data["system_prompt"]


def test_generate_vapi_assistant_config():
    payload = {
        "patient_id": "USR-ALEX",
        "assistant_name": "Dr. Quantum — SIH Clinical AI",
        "voice_provider": "11labs",
        "voice_id": "sarah",
        "model_name": "gpt-4o",
        "temperature": 0.2,
    }
    res = client.post("/api/v1/ai-doctor/assistant-config", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "assistant_config" in data
    cfg = data["assistant_config"]
    assert cfg["name"] == "Dr. Quantum — SIH Clinical AI"
    assert "firstMessage" in cfg
    assert "model" in cfg
    assert cfg["model"]["messages"][0]["role"] == "system"
    assert "Alex Mercer" in cfg["model"]["messages"][0]["content"]


def test_ai_doctor_chat_cardiology_query():
    payload = {
        "patient_id": "USR-ALEX",
        "message": "Can you explain my blood pressure and heart test results?",
        "history": [],
    }
    res = client.post("/api/v1/ai-doctor/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "response" in data
    assert len(data["response"]) > 20
    assert "key_factors" in data
    assert len(data["key_factors"]) >= 1


def test_ai_doctor_chat_skin_lesion_query():
    payload = {
        "patient_id": "USR-ALEX",
        "message": "What did the skin cancer quantum scan say about my mole?",
        "history": [],
    }
    res = client.post("/api/v1/ai-doctor/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "QuantumDerma" in data["response"] or "Benign" in data["response"] or "nevus" in data["response"].lower()


def test_ai_doctor_chat_feeling_unwell_followup():
    payload = {
        "patient_id": "USR-ALEX",
        "patient_name": "Rajdeep",
        "message": "I think I'm not feeling well. Can you tell me what what issues do I have in my body?",
        "history": [
            {"role": "assistant", "content": "Overall, Rajdeep, you're in great shape! Your health score is 26.2 out of 100."}
        ],
    }
    res = client.post("/api/v1/ai-doctor/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    resp = data["response"]
    assert "Rajdeep" in resp
    assert any(w in resp.lower() for w in ["symptom", "discomfort", "vitals", "blood pressure", "headache", "fever", "discomfort"])


def test_ai_doctor_chat_exercise_followup():
    payload = {
        "patient_id": "USR-ALEX",
        "patient_name": "Rajdeep",
        "message": "You mean that I am overall fit and fine and I don't need to do any exercises?",
        "history": [
            {"role": "assistant", "content": "Your blood pressure is 120/78 and pulse is 72 bpm."},
            {"role": "user", "content": "You mean that I am overall fit and fine and I don't need to do any exercises?"}
        ],
    }
    res = client.post("/api/v1/ai-doctor/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    resp = data["response"].lower()
    assert "exercise" in resp or "walking" in resp or "active" in resp
    assert "Rajdeep" in data["response"]


def test_ai_doctor_chat_health_score_followup():
    payload = {
        "patient_id": "USR-ALEX",
        "patient_name": "Rajdeep",
        "message": "What does my score 26.2 mean? Is it healthy or dangerous?",
        "history": [],
    }
    res = client.post("/api/v1/ai-doctor/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    resp = data["response"]
    assert "26.2" in resp or "score" in resp.lower()
    assert "Rajdeep" in resp


def test_ai_doctor_chat_overall_checkup_assessment():
    payload = {
        "patient_id": "USR-ALEX",
        "patient_name": "Rajdeep",
        "message": "Do you think that my health checkup is overall good?",
        "history": [],
    }
    res = client.post("/api/v1/ai-doctor/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    resp = data["response"]
    assert "Rajdeep" in resp
    assert "good" in resp.lower() or "reassuring" in resp.lower() or "stable" in resp.lower()
    # Must NOT return appointment booking text
    assert "appointment" not in resp.lower()


def test_ai_doctor_chat_echo_filter():
    payload = {
        "patient_id": "USR-ALEX",
        "patient_name": "Rajdeep",
        "message": "I'm done quantum your AI doctor. I've taken a look at your health check UPS and everything looks good. How are you feeling today?",
        "history": [],
    }
    res = client.post("/api/v1/ai-doctor/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    resp = data["response"]
    assert "Rajdeep" in resp
    assert "appointment" not in resp.lower()


