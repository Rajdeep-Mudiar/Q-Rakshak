import asyncio
import base64
import json
import logging
import urllib.parse
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel

from backend.app.core.security import create_access_token, get_current_user, hash_password, verify_password
from backend.app.core.config import settings
from backend.app.db.repository import DatabaseRepository
from backend.app.services.email_service import send_login_notification, send_welcome_email

logger = logging.getLogger("qrakshak.auth")

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    username: str
    password: str
    name: str
    email: str
    role: str = "patient"  # patient | doctor | admin
    emergency_phone: str | None = "+91 98765 43210"
    hospital_affiliation: str | None = "Q-Rakshak"
    license_number: str | None = None
    specialty: str | None = "General Medicine & Clinical AI"
    experience_years: int | None = 6
    fee_inr: float | None = 600.0
    languages: list[str] | None = None
    council_name: str | None = "National Medical Commission"


@router.post("/register")
async def register(req: RegisterRequest):
    """Registers a new custom user account with full editing authority."""
    existing = DatabaseRepository.get_user_by_username(req.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists. Please choose a different handle.")

    created = DatabaseRepository.create_user({
        "username": req.username,
        "password_hash": hash_password(req.password),
        "name": req.name,
        "email": req.email,
        "role": req.role,
        "emergency_phone": req.emergency_phone or "+91 98765 43210",
        "hospital_affiliation": req.hospital_affiliation or ("Q-Rakshak" if req.role in ("doctor", "clinician") else "Community Hospital"),
        "license_number": req.license_number,
        "specialty": req.specialty or "General Medicine & Clinical AI",
        "experience_years": req.experience_years or 6,
        "fee_inr": req.fee_inr or 600.0,
        "languages": req.languages or ["English", "Hindi"],
        "council_name": req.council_name or "National Medical Commission",
    })

    token = create_access_token({
        "user_id": created.get("id"),
        "username": created["username"],
        "role": created["role"],
        "name": created["name"],
        "email": created["email"],
    })

    DatabaseRepository.add_audit_log(
        actor=created["name"],
        action="USER_REGISTRATION",
        resource=f"ROLE:{created['role']}",
        status="SUCCESS",
    )

    doctor_id = None
    if created["role"] in ("doctor", "clinician"):
        doc_rec = DatabaseRepository.get_doctor_by_user_id(created.get("id") or created.get("user_id"))
        if doc_rec:
            doctor_id = doc_rec["id"]
        else:
            doctor_id = f"DOC-{str(created.get('id', '')).replace('USR-', '')}"

    if created.get("email"):
        asyncio.create_task(
            send_welcome_email(
                user_email=created["email"],
                user_name=created.get("name", "Clinical User"),
                user_role=created.get("role", "patient"),
            )
        )

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": created.get("id"),
            "id": created.get("id"),
            "username": created["username"],
            "name": created["name"],
            "role": created["role"],
            "doctor_id": doctor_id,
            "email": created["email"],
            "hospital_affiliation": created.get("hospital_affiliation", ""),
            "license_number": created.get("license_number", ""),
            "is_test": False,
            "is_custom": True,
        },
    }


class LoginRequest(BaseModel):
    username: str = ""
    password: str = ""
    role: str | None = None


@router.post("/login")
async def login(req: LoginRequest):
    """Logs in using credentials against the database. Returns 401 on invalid credentials."""
    raw_identifier = (req.username or "").strip()
    clean_identifier = raw_identifier.lower()

    user = DatabaseRepository.get_user_by_credentials(clean_identifier) or DatabaseRepository.get_user_by_credentials(raw_identifier)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    stored_hash = user.get("password_hash", "")
    pwd_match = verify_password(req.password, stored_hash)

    if not pwd_match:
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    is_test_account = settings.DB_MODE == "demo"

    # Backend is the strict source of truth for authorization; user role comes from database record
    user["role"] = user.get("role", "patient")

    doctor_id = None
    if user["role"] in ("doctor", "clinician"):
        doc_rec = DatabaseRepository.get_doctor_by_user_id(user.get("id") or user.get("user_id"))
        if doc_rec:
            doctor_id = doc_rec["id"]
        else:
            doctor_id = f"DOC-{str(user.get('id', '')).replace('USR-', '')}"

    token = create_access_token({
        "user_id": user.get("id") or user.get("user_id"),
        "username": user["username"],
        "role": user["role"],
        "name": user["name"],
        "email": user["email"],
        "doctor_id": doctor_id,
    })

    DatabaseRepository.add_audit_log(
        actor=user["name"],
        action="USER_LOGIN",
        resource=f"ROLE:{user['role']}",
        status="SUCCESS",
    )

    if user.get("email"):
        asyncio.create_task(
            send_login_notification(
                user_email=user["email"],
                user_name=user.get("name", "Clinical User"),
                ip_address="127.0.0.1",
                auth_method="Clinical Password Verification",
                user_role=user.get("role", "patient"),
            )
        )

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user.get("id") or user.get("user_id"),
            "id": user.get("id") or user.get("user_id"),
            "username": user["username"],
            "name": user["name"],
            "role": user["role"],
            "doctor_id": doctor_id,
            "email": user["email"],
            "secondary_email": user.get("secondary_email", ""),
            "emergency_phone": user.get("emergency_phone", ""),
            "hospital_affiliation": user.get("hospital_affiliation", ""),
            "license_number": user.get("license_number", ""),
            "is_test": is_test_account,
            "is_custom": not is_test_account,
        },
    }



def _clean_frontend_url(raw_url: str | None) -> str:
    """Cleans a frontend URL or referer to keep scheme + netloc."""
    if not raw_url:
        return settings.FRONTEND_URL.rstrip("/")
    try:
        parsed = urllib.parse.urlparse(raw_url)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
    except Exception:
        pass
    return settings.FRONTEND_URL.rstrip("/")


def _determine_redirect_uri(request: Request, callback_override: str | None = None) -> str:
    """Dynamically determines the OAuth 2.0 redirect_uri matching host/protocol."""
    if callback_override:
        return callback_override

    # Check request headers for reverse proxy / Render host
    forwarded_proto = request.headers.get("x-forwarded-proto") or request.url.scheme
    forwarded_host = request.headers.get("x-forwarded-host") or request.headers.get("host") or request.url.netloc

    # If explicitly running on Render backend domain
    if "onrender.com" in forwarded_host:
        return f"https://{forwarded_host}/api/v1/auth/google/callback"

    # If settings has an explicit non-localhost URI, prioritize it
    if settings.GOOGLE_REDIRECT_URI and "localhost" not in settings.GOOGLE_REDIRECT_URI:
        return settings.GOOGLE_REDIRECT_URI

    # If running locally on localhost/127.0.0.1
    if "localhost" in forwarded_host or "127.0.0.1" in forwarded_host:
        return f"{forwarded_proto}://{forwarded_host}/api/v1/auth/google/callback"

    return settings.GOOGLE_REDIRECT_URI or f"{forwarded_proto}://{forwarded_host}/api/v1/auth/google/callback"


class GoogleVerifyRequest(BaseModel):
    credential: str
    role: str = "patient"


@router.post("/google/verify")
async def google_verify(req: GoogleVerifyRequest, request: Request):
    """Directly verifies Google ID token credential from Google Identity Services (GIS) / One-Tap,
    authenticates or provisions user, and issues clinical JWT session token without redirects.
    """
    if not req.credential or not req.credential.strip():
        raise HTTPException(status_code=400, detail="Missing Google credential ID token.")

    tokeninfo_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={req.credential.strip()}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            res = await http_client.get(tokeninfo_url)
            if res.status_code != 200:
                logger.warning("Google tokeninfo verification failed: %s", res.text)
                raise HTTPException(status_code=400, detail="Google authentication token could not be verified by Google Identity Services.")
            token_info = res.json()
            if asyncio.iscoroutine(token_info):
                token_info = await token_info
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error communicating with Google tokeninfo service: %s", exc)
        raise HTTPException(status_code=502, detail="Network error contacting Google Identity Services.")

    email_verified = token_info.get("email_verified")
    if email_verified not in ("true", True):
        raise HTTPException(status_code=400, detail="Google account email is not verified.")

    google_email = (token_info.get("email") or "").strip().lower()
    if not google_email:
        raise HTTPException(status_code=400, detail="Google token payload does not contain a verified email.")

    google_name = token_info.get("name") or google_email.split("@")[0].replace(".", " ").title()
    google_picture = token_info.get("picture", "")

    user = DatabaseRepository.get_user_by_credentials(google_email)
    target_role = req.role if req.role in ("patient", "doctor", "clinician", "admin", "researcher") else "patient"
    if not user:
        user = DatabaseRepository.create_user({
            "username": google_email,
            "password_hash": "GOOGLE_VERIFIED_CREDENTIAL",
            "name": google_name,
            "email": google_email,
            "role": target_role,
            "hospital_affiliation": "Google Clinical SSO (Identity Services)",
            "emergency_phone": "+91 98765 43210",
        })
        asyncio.create_task(
            send_welcome_email(
                user_email=google_email,
                user_name=google_name,
                user_role=target_role,
            )
        )
    else:
        user["role"] = user.get("role", "patient")

    doctor_id = None
    if user.get("role") in ("doctor", "clinician"):
        doc_rec = DatabaseRepository.get_doctor_by_user_id(user.get("id") or user.get("user_id"))
        doctor_id = doc_rec["id"] if doc_rec else f"DOC-{str(user.get('id', '')).replace('USR-', '')}"

    jwt_token = create_access_token({
        "user_id": user.get("id") or user.get("user_id"),
        "username": user["username"],
        "role": user["role"],
        "name": user["name"],
        "email": user["email"],
        "doctor_id": doctor_id,
        "picture": google_picture,
    })

    client_ip = request.client.host if (request and request.client) else "127.0.0.1"
    asyncio.create_task(
        send_login_notification(
            user_email=user["email"],
            user_name=user["name"],
            ip_address=client_ip,
            auth_method="Google Identity Services (One-Tap)",
            user_role=user["role"],
        )
    )

    DatabaseRepository.add_audit_log(
        actor=user["name"],
        action="GOOGLE_ONE_TAP_LOGIN",
        resource=f"ROLE:{user['role']}",
        ip_address=client_ip,
        status="SUCCESS",
    )

    return {
        "status": "success",
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": {
            "user_id": user.get("id") or user.get("user_id"),
            "id": user.get("id") or user.get("user_id"),
            "username": user["username"],
            "name": user["name"],
            "role": user["role"],
            "doctor_id": doctor_id,
            "email": user["email"],
            "picture": google_picture,
            "hospital_affiliation": user.get("hospital_affiliation", ""),
            "license_number": user.get("license_number", ""),
            "is_test": False,
            "is_custom": True,
        },
    }


@router.get("/google")
async def google_login(
    request: Request,
    prompt: str | None = "select_account",
    redirect_url: str | None = None,
    callback_url: str | None = None,
):
    """Redirects user to Google OAuth 2.0 consent authorization screen."""
    client_id = settings.GOOGLE_CLIENT_ID
    redirect_uri = _determine_redirect_uri(request, callback_url)

    # Determine where the user should return after successful auth
    frontend_url = _clean_frontend_url(redirect_url or request.headers.get("referer"))

    if not client_id or client_id.startswith("your-"):
        # Graceful notice if Google Client ID not yet set in .env
        return RedirectResponse(url=f"{frontend_url}/?error=google_oauth_credentials_required")

    # Encode target frontend and expected redirect URI in OAuth state param
    state_payload = json.dumps({"f": frontend_url, "r": redirect_uri})
    state_b64 = base64.urlsafe_b64encode(state_payload.encode()).decode()

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": prompt or "select_account",
        "state": state_b64,
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=auth_url)


@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: str | None = None,
    error: str | None = None,
    state: str | None = None,
):
    """Handles redirect callback from Google OAuth 2.0.
    Exchanges code for tokens, retrieves userinfo, provisions or finds user, issues JWT,
    dispatches login email notification, and redirects to frontend with ?token=...
    """
    # 1. Recover state
    frontend_url = settings.FRONTEND_URL.rstrip("/")
    expected_redirect_uri = _determine_redirect_uri(request)
    if state:
        try:
            decoded = json.loads(base64.urlsafe_b64decode(state.encode()).decode())
            if isinstance(decoded, dict):
                if decoded.get("f"):
                    frontend_url = decoded["f"].rstrip("/")
                if decoded.get("r"):
                    expected_redirect_uri = decoded["r"]
        except Exception as e:
            logger.warning("Could not decode OAuth state: %s", e)

    # 2. Check for OAuth error from Google (e.g. access_denied)
    if error:
        logger.warning("Google OAuth callback error received: %s", error)
        return RedirectResponse(url=f"{frontend_url}/?error={urllib.parse.quote(error)}")

    # 3. Direct access without code parameter
    if not code:
        return HTMLResponse(
            content=f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Q-RAKSHAK — Google Authentication Gateway</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body {{ font-family: system-ui, -apple-system, sans-serif; background: #0F172A; color: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }}
                    .card {{ background: #1E293B; border: 1px solid #334155; border-radius: 12px; max-width: 520px; width: 100%; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }}
                    h1 {{ font-size: 1.3rem; margin: 0 0 12px 0; color: #38BDF8; font-weight: 700; }}
                    p {{ font-size: 0.9rem; color: #94A3B8; line-height: 1.6; margin: 0 0 16px 0; }}
                    .btn {{ display: inline-block; background: #0284C7; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 0.88rem; }}
                    .btn:hover {{ background: #0369A1; }}
                    code {{ background: #0F172A; padding: 3px 6px; border-radius: 4px; color: #34D399; font-size: 0.82rem; word-break: break-all; }}
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>Q-RAKSHAK Auth Gateway</h1>
                    <p>This endpoint receives OAuth 2.0 authorization callbacks from Google Accounts.</p>
                    <p>Configured callback URI: <code>{expected_redirect_uri}</code></p>
                    <a href="{frontend_url}" class="btn">Return to Application</a>
                </div>
            </body>
            </html>
            """,
            status_code=200,
        )

    client_id = settings.GOOGLE_CLIENT_ID
    client_secret = settings.GOOGLE_CLIENT_SECRET
    redirect_uri = expected_redirect_uri

    if not client_id or not client_secret or client_id.startswith("your-"):
        logger.warning("Google credentials not configured on backend.")
        return RedirectResponse(url=f"{frontend_url}/?error=google_credentials_not_configured")

    token_url = "https://oauth2.googleapis.com/token"
    token_payload = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as http_client:
            token_res = await http_client.post(token_url, data=token_payload)
            if token_res.status_code != 200:
                logger.error("Failed Google token exchange: %s", token_res.text)
                return RedirectResponse(url=f"{frontend_url}/?error=token_exchange_failed")
            token_data = token_res.json()
            google_access_token = token_data.get("access_token")

            userinfo_res = await http_client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {google_access_token}"}
            )
            if userinfo_res.status_code != 200:
                logger.error("Failed Google userinfo retrieval: %s", userinfo_res.text)
                return RedirectResponse(url=f"{frontend_url}/?error=userinfo_failed")
            userinfo = userinfo_res.json()
    except Exception as exc:
        logger.error("Google OAuth error: %s", exc)
        return RedirectResponse(url=f"{frontend_url}/?error=google_network_error")

    google_email = (userinfo.get("email") or "").strip().lower()
    google_name = userinfo.get("name") or google_email.split("@")[0].replace(".", " ").title()
    google_picture = userinfo.get("picture", "")

    if not google_email:
        return RedirectResponse(url=f"{frontend_url}/?error=no_email_in_profile")

    user = DatabaseRepository.get_user_by_credentials(google_email)
    if not user:
        user = DatabaseRepository.create_user({
            "username": google_email,
            "password_hash": "GOOGLE_OAUTH_TOKEN",
            "name": google_name,
            "email": google_email,
            "role": "patient",
            "hospital_affiliation": "Google Clinical SSO",
            "emergency_phone": "+91 98765 43210",
        })
        asyncio.create_task(
            send_welcome_email(
                user_email=google_email,
                user_name=google_name,
                user_role="patient",
            )
        )

    doctor_id = None
    if user.get("role") in ("doctor", "clinician"):
        doc_rec = DatabaseRepository.get_doctor_by_user_id(user.get("id") or user.get("user_id"))
        doctor_id = doc_rec["id"] if doc_rec else f"DOC-{str(user.get('id', '')).replace('USR-', '')}"

    jwt_token = create_access_token({
        "user_id": user.get("id") or user.get("user_id"),
        "username": user["username"],
        "role": user["role"],
        "name": user["name"],
        "email": user["email"],
        "doctor_id": doctor_id,
        "picture": google_picture,
    })

    client_ip = request.client.host if (request and request.client) else "127.0.0.1"
    asyncio.create_task(
        send_login_notification(
            user_email=user["email"],
            user_name=user["name"],
            ip_address=client_ip,
            auth_method="Google OAuth 2.0 (Verified OpenID)",
            user_role=user["role"],
        )
    )

    DatabaseRepository.add_audit_log(
        actor=user["name"],
        action="GOOGLE_LOGIN",
        resource=f"ROLE:{user['role']}",
        ip_address=client_ip,
        status="SUCCESS",
    )

    return RedirectResponse(url=f"{frontend_url}/?token={jwt_token}")



@router.get("/me")
async def get_me(user: dict[str, Any] = Depends(get_current_user)):
    """Validates session and returns authenticated user metadata."""
    if user.get("role") in ("doctor", "clinician") and not user.get("doctor_id"):
        doc_rec = DatabaseRepository.get_doctor_by_user_id(user.get("user_id") or user.get("id"))
        if doc_rec:
            user["doctor_id"] = doc_rec["id"]
        else:
            user["doctor_id"] = f"DOC-{str(user.get('id') or user.get('user_id', '')).replace('USR-', '')}"
    return {"status": "authenticated", "user": user}
