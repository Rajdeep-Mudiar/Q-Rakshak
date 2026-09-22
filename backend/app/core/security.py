from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any

from fastapi import Header, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Pull secret from centralized settings so there is a single source of truth.
try:
    from backend.app.core.config import settings as _settings
    SECRET_KEY: str = _settings.JWT_SECRET
except Exception:  # pragma: no cover
    raise RuntimeError("Application security settings could not be loaded.")

# ── Password Hashing — PBKDF2-HMAC-SHA256 (100k iterations with per-user salt) ──
_PBKDF2_ITERATIONS = 100_000
_PBKDF2_HASH = "sha256"
_PBKDF2_LEGACY_SALT = "qmed_pbkdf2_salt_v2"


def hash_password(password: str, salt: str | None = None) -> str:
    """Hashes password with PBKDF2-HMAC-SHA256 (100k iterations) using a cryptographic random per-user salt.
    Format: pbkdf2$100000$<salt_hex>$<hash_hex>
    Backward-compatible: verify_password accepts new per-user salt hashes, legacy static-salt PBKDF2, and legacy SHA-256.
    """
    if salt is None:
        salt = os.urandom(16).hex()
    dk = hashlib.pbkdf2_hmac(
        _PBKDF2_HASH,
        password.encode("utf-8"),
        salt.encode("utf-8"),
        _PBKDF2_ITERATIONS,
    )
    return f"pbkdf2${_PBKDF2_ITERATIONS}${salt}${dk.hex()}"


def _legacy_hash(password: str) -> str:
    """Returns the old SHA-256 hash for backward-compatible verification only."""
    salt = "qmed_salt_2026"
    return hashlib.sha256((password + salt).encode("utf-8")).hexdigest()


def verify_password(plain: str, stored_hash: str) -> bool:
    """Constant-time password verification.
    Accepts:
    1. Modern per-user salt PBKDF2: pbkdf2$100000$<salt>$<hash>
    2. Legacy static salt PBKDF2: pbkdf2$<hash>
    3. Legacy SHA-256 hashes
    """
    if stored_hash.startswith("pbkdf2$"):
        parts = stored_hash.split("$")
        if len(parts) == 4:
            # Modern per-user salt format: pbkdf2$<iterations>$<salt>$<hash>
            _, iter_str, salt, expected_hash = parts
            try:
                iterations = int(iter_str)
            except ValueError:
                iterations = _PBKDF2_ITERATIONS
            dk = hashlib.pbkdf2_hmac(_PBKDF2_HASH, plain.encode("utf-8"), salt.encode("utf-8"), iterations)
            return hmac.compare_digest(dk.hex(), expected_hash)
        elif len(parts) == 2:
            # Legacy static salt format: pbkdf2$<hash>
            _, expected_hash = parts
            dk = hashlib.pbkdf2_hmac(_PBKDF2_HASH, plain.encode("utf-8"), _PBKDF2_LEGACY_SALT.encode("utf-8"), _PBKDF2_ITERATIONS)
            return hmac.compare_digest(dk.hex(), expected_hash)
        else:
            return False

    # Legacy SHA-256 path
    expected_legacy = _legacy_hash(plain)
    return hmac.compare_digest(expected_legacy.encode(), stored_hash.encode())


# ── In-Memory Sliding-Window Rate Limiter ────────────────────────────────────
import threading
from collections import defaultdict


class InMemoryRateLimiter:
    """Thread-safe sliding-window rate limiter per client IP or key."""

    def __init__(self, max_requests: int = 60, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._records: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def check(self, key: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        with self._lock:
            timestamps = self._records[key]
            valid = [ts for ts in timestamps if ts > cutoff]
            if len(valid) >= self.max_requests:
                self._records[key] = valid
                return False
            valid.append(now)
            self._records[key] = valid
            return True


_qml_rate_limiter = InMemoryRateLimiter(max_requests=60, window_seconds=60)


async def check_inference_rate_limit(request: Request) -> None:
    """Dependency helper to guard resource-heavy AI/QML inference endpoints."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    if not _qml_rate_limiter.check(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded (max 60 inference requests/minute). Please wait before submitting more diagnostic requests.",
        )




# ── Token (HMAC-SHA256, payload.signature) ───────────────────────────────────

def create_access_token(data: dict[str, Any], expires_delta_sec: int = 86400) -> str:
    payload = data.copy()
    payload["exp"] = time.time() + expires_delta_sec
    payload_json = json.dumps(payload, separators=(",", ":"))
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode("utf-8")).decode("utf-8").rstrip("=")
    signature = hmac.new(SECRET_KEY.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"


def verify_access_token(token: str) -> dict[str, Any]:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            raise ValueError("Malformed token")
        payload_b64, signature = parts
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            raise ValueError("Invalid signature")
        rem = len(payload_b64) % 4
        padded = payload_b64 + ("=" * (4 - rem) if rem > 0 else "")
        payload = json.loads(base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8"))
        if payload.get("exp", 0) < time.time():
            raise ValueError("Token expired")
        return payload
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Authentication invalid: {exc}")


VALID_API_KEYS = { _settings.API_KEY }


async def verify_api_key(x_api_key: str | None = Header(None)) -> bool:
    """Validates X-API-Key for machine-to-machine integrations."""
    if not x_api_key or x_api_key not in VALID_API_KEYS:
        raise HTTPException(status_code=401, detail="Valid X-API-Key header required.")
    return True


async def get_current_user(
    authorization: str | None = Header(None),
) -> dict[str, Any]:
    """Requires a valid Bearer JWT token. Raises HTTP 401 if missing or invalid."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization Bearer token required. Please log in.")
    token = authorization.split(" ", 1)[1]
    return verify_access_token(token)


async def get_optional_user(
    authorization: str | None = Header(None),
    x_api_key: str | None = Header(None),
) -> dict[str, Any]:
    """Returns authenticated user dict OR a default guest patient dict.
    Use this for endpoints where unauthenticated (guest) access is intentional.
    """
    if x_api_key and x_api_key in VALID_API_KEYS:
        return {"user_id": "API-GATEWAY", "username": "api.gateway", "role": "service", "name": "API Gateway Service"}
    if not authorization or not authorization.startswith("Bearer "):
        return {"user_id": "GUEST-USER", "username": "guest", "role": "guest", "name": "Guest Patient"}
    token = authorization.split(" ", 1)[1]
    try:
        return verify_access_token(token)
    except HTTPException:
        return {"user_id": "GUEST-USER", "username": "guest", "role": "guest", "name": "Guest Patient"}


def require_admin(user: dict[str, Any]) -> dict[str, Any]:
    """Guard helper — raises HTTP 403 if the authenticated user is not an admin."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Administrator access required.")
    return user


def require_doctor(user: dict[str, Any]) -> dict[str, Any]:
    """Guard helper — raises HTTP 403 if the authenticated user is not a doctor or admin."""
    if user.get("role") not in ("doctor", "clinician", "admin"):
        raise HTTPException(status_code=403, detail="Doctor / Clinician authorization required.")
    return user


def require_role(user: dict[str, Any], allowed_roles: tuple[str, ...] | list[str]) -> dict[str, Any]:
    """Guard helper — raises HTTP 403 if the user role is not in the allowed roles."""
    if user.get("role") not in allowed_roles:
        raise HTTPException(status_code=403, detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}.")
    return user


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Enforces enterprise security headers per SRS Section 9.1."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response
