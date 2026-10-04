import os
import tempfile
from pathlib import Path

os.environ["QMED_DB_MODE"] = "demo"
os.environ["QMED_DEMO_DB_PATH"] = str(Path(tempfile.gettempdir()) / f"q-rakshak-tests-{os.getpid()}.db")
Path(os.environ["QMED_DEMO_DB_PATH"]).unlink(missing_ok=True)

import pytest
from fastapi.testclient import TestClient
from backend.app.db.database import init_db
init_db()

from backend.app.main import app


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def patient_token(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "alex.patient", "password": "patient123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture(scope="session")
def admin_token(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin.audit", "password": "admin123", "role": "admin"},

    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture(scope="session")
def patient_headers(patient_token):
    return {"Authorization": f"Bearer {patient_token}"}


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
