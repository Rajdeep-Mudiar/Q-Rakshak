from __future__ import annotations

import base64
import json
import urllib.parse
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db.repository import DatabaseRepository

client = TestClient(app)


def test_google_login_redirect_url_generation():
    """Verifies that GET /api/v1/auth/google produces a valid OAuth 2.0 authorization redirect."""
    res = client.get("/api/v1/auth/google", follow_redirects=False)
    assert res.status_code == 307
    location = res.headers.get("location", "")
    assert location.startswith("https://accounts.google.com/o/oauth2/v2/auth")

    parsed = urllib.parse.urlparse(location)
    params = urllib.parse.parse_qs(parsed.query)

    assert "client_id" in params
    assert "redirect_uri" in params
    assert "response_type" in params
    assert params["response_type"] == ["code"]
    assert "state" in params

    # Decode and verify the state parameter
    state_raw = params["state"][0]
    decoded_state = json.loads(base64.urlsafe_b64decode(state_raw.encode()).decode())
    assert "f" in decoded_state
    assert "r" in decoded_state


def test_google_login_custom_redirect_and_callback():
    """Verifies that custom frontend redirect_url and backend callback_url are respected."""
    frontend_target = "https://custom-q-rakshak-client.health"
    custom_callback = "https://custom-q-rakshak-client.health/api/auth/callback"
    res = client.get(
        f"/api/v1/auth/google?redirect_url={urllib.parse.quote(frontend_target)}&callback_url={urllib.parse.quote(custom_callback)}",
        follow_redirects=False,
    )
    assert res.status_code == 307
    location = res.headers.get("location", "")
    params = urllib.parse.parse_qs(urllib.parse.urlparse(location).query)

    assert params["redirect_uri"] == [custom_callback]

    state_raw = params["state"][0]
    decoded_state = json.loads(base64.urlsafe_b64decode(state_raw.encode()).decode())
    assert decoded_state["f"] == frontend_target
    assert decoded_state["r"] == custom_callback


def test_google_callback_without_code_returns_diagnostics_page():
    """Verifies that accessing /google/callback directly without params shows a clean diagnostics status page."""
    res = client.get("/api/v1/auth/google/callback", follow_redirects=False)
    assert res.status_code == 200
    assert "Q-RAKSHAK — Google Authentication Gateway" in res.text
    assert "Configured callback URI" in res.text


def test_google_callback_handles_oauth_error_gracefully():
    """Verifies that an error returned by Google redirects back to frontend with query error."""
    frontend_target = "https://q-rakshak.health"
    state_payload = json.dumps({"f": frontend_target, "r": "https://q-rakshak.health/callback"})
    state_b64 = base64.urlsafe_b64encode(state_payload.encode()).decode()

    res = client.get(
        f"/api/v1/auth/google/callback?error=access_denied&state={state_b64}",
        follow_redirects=False,
    )
    assert res.status_code == 307
    location = res.headers.get("location", "")
    assert location.startswith(f"{frontend_target}/?error=access_denied")


def test_google_verify_missing_credential():
    """Verifies that POST /api/v1/auth/google/verify rejects requests with empty credentials."""
    res = client.post("/api/v1/auth/google/verify", json={"credential": ""})
    assert res.status_code == 400
    assert "Missing Google credential" in res.json()["detail"]


def test_google_verify_mocked_success():
    """Verifies that POST /api/v1/auth/google/verify successfully exchanges a valid ID token."""
    mock_token_info = {
        "email": "clinical.quantum.test@gmail.com",
        "email_verified": "true",
        "name": "Dr. Quantum Test",
        "picture": "https://example.com/avatar.jpg",
        "aud": "985994695248-4615o9ba17tahv2q94ba01t322r3aunr.apps.googleusercontent.com",
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_token_info

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        res = client.post(
            "/api/v1/auth/google/verify",
            json={"credential": "mocked_valid_jwt_id_token", "role": "doctor"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert "access_token" in data
        assert data["user"]["email"] == "clinical.quantum.test@gmail.com"
        assert data["user"]["role"] == "doctor"
        assert data["user"]["doctor_id"] is not None


def test_google_verify_unverified_email_rejected():
    """Verifies that an unverified Google account is rejected."""
    mock_token_info = {
        "email": "unverified@gmail.com",
        "email_verified": "false",
        "name": "Unverified User",
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_token_info

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        res = client.post(
            "/api/v1/auth/google/verify",
            json={"credential": "mocked_unverified_token"},
        )
        assert res.status_code == 400
        assert "not verified" in res.json()["detail"]

