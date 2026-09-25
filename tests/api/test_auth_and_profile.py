from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_auth_login():
    res = client.post("/api/v1/auth/login", json={"username": "alex.patient", "password": "patient123", "role": "patient"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "patient"

    # Test me endpoint with token
    token = data["access_token"]
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["user"]["username"] == "alex.patient"


def test_profile_retrieval_and_update():
    # Get profile
    res_get = client.get("/api/v1/profile/USR-ALEX")
    assert res_get.status_code == 200
    profile = res_get.json()["profile"]
    assert profile["user_id"] == "USR-ALEX"
    assert "extra_email" in profile
    assert "emergency_phone" in profile

    # Update profile with extra email and emergency phone
    payload = {
        "name": "Aryan Choudhury (Updated)",
        "role": "patient",
        "age": 29,
        "gender": "Male",
        "primary_email": "aryan.crores@gmail.com",
        "extra_email": "aryan.backup@gmail.com",
        "emergency_phone": "+91 99887 76655",
        "phone": "+91 98765 43210",
        "blood_group": "O+",
        "department": "Patient Self-Analysis & Care",
        "hospital": "Q-Rakshak Cardiology & Oncology OPD",
        "license_id": "PT-REC-99881",
        "notifications_sms": True,
        "notifications_email": True,
        "notifications_critical_qpu": True,
    }
    res_put = client.put("/api/v1/profile/USR-ALEX", json=payload)
    assert res_put.status_code == 200
    updated = res_put.json()["profile"]
    assert updated["extra_email"] == "aryan.backup@gmail.com"
    assert updated["emergency_phone"] == "+91 99887 76655"
    assert updated["age"] == 29
    assert updated["gender"] == "Male"


def test_security_headers():
    res = client.get("/")
    assert res.status_code == 200
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("x-frame-options") == "DENY"


def test_profile_complete_deletion():
    import uuid
    from backend.app.db.repository import DatabaseRepository
    
    # Create a transient user for deletion testing
    temp_uid = f"USR-{uuid.uuid4().hex[:6].upper()}"
    temp_user = f"test.user.{uuid.uuid4().hex[:4]}"
    DatabaseRepository.create_user({
        "id": temp_uid,
        "username": temp_user,
        "password_hash": "hashed_pw_test",
        "name": "Temporary Profile",
        "email": f"{temp_user}@test.org",
        "role": "researcher",
    })

    # Verify user exists in SQLite
    fetched = DatabaseRepository.get_user_by_id(temp_uid)
    assert fetched is not None
    assert fetched["username"] == temp_user

    # Delete profile via DELETE /api/v1/profile/{user_id}
    res_del = client.delete(f"/api/v1/profile/{temp_uid}")
    assert res_del.status_code == 200
    assert res_del.json()["status"] == "success"

    # Verify user is completely removed from SQLite database
    assert DatabaseRepository.get_user_by_id(temp_uid) is None
    assert DatabaseRepository.get_user_by_username(temp_user) is None

