from __future__ import annotations

import time
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.app.core.security import hash_password, get_current_user, require_admin
from backend.app.db.repository import DatabaseRepository

router = APIRouter(prefix="/api/v1/admin", tags=["Admin User Management"])



class CreateUserRequest(BaseModel):
    username: str
    password: str = "tempPass2026"
    name: str
    email: str
    secondary_email: str | None = ""
    emergency_phone: str | None = "+91 98765 43210"
    role: str = "patient"  # patient | admin
    hospital_affiliation: str | None = "Q-Rakshak Health Network"
    license_number: str | None = None


class UpdateUserRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    secondary_email: str | None = None
    emergency_phone: str | None = None
    role: str | None = None
    hospital_affiliation: str | None = None
    license_number: str | None = None
    password: str | None = None


@router.get("/users")
async def list_all_users(current_user: dict = Depends(get_current_user)):
    """Retrieves all registered platform users from SQLite database. Requires admin role."""
    require_admin(current_user)
    users = DatabaseRepository.list_users()
    return {"status": "success", "total_users": len(users), "users": users}



@router.post("/users")
async def create_new_user(req: CreateUserRequest, current_user: dict = Depends(get_current_user)):
    """Creates a new user profile with assigned authority tier in SQLite database. Requires admin role."""
    require_admin(current_user)
    existing = DatabaseRepository.get_user_by_username(req.username)
    if existing:
        raise HTTPException(status_code=400, detail=f"Username '{req.username}' already exists.")

    uid = f"USR-{req.role[:3].upper()}-{uuid.uuid4().hex[:4].upper()}"
    new_user = DatabaseRepository.create_user({
        "id": uid,
        "username": req.username,
        "password_hash": hash_password(req.password),
        "name": req.name,
        "email": req.email,
        "secondary_email": req.secondary_email or "",
        "emergency_phone": req.emergency_phone or "+91 98765 43210",
        "role": req.role,
        "hospital_affiliation": req.hospital_affiliation or "Q-RAKSHAK Clinical Network",
        "license_number": req.license_number or f"LIC-{uuid.uuid4().hex[:4].upper()}",
    })

    DatabaseRepository.add_audit_log(
        actor=current_user.get("name", "admin.audit"),
        action="USER_CREATE",
        resource=f"{uid}:{req.username}:{req.role}",
        status="SUCCESS",
    )

    return {"status": "success", "message": "User created successfully.", "user": new_user}


@router.put("/users/{user_id}")
async def update_user(user_id: str, req: UpdateUserRequest, current_user: dict = Depends(get_current_user)):
    """Updates user authority, credentials, and profile settings. Requires admin role."""
    require_admin(current_user)
    user = DatabaseRepository.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found.")

    updates = {}
    if req.name: updates["name"] = req.name
    if req.email: updates["email"] = req.email
    if req.secondary_email is not None: updates["secondary_email"] = req.secondary_email
    if req.emergency_phone is not None: updates["emergency_phone"] = req.emergency_phone
    if req.role: updates["role"] = req.role
    if req.hospital_affiliation is not None: updates["hospital_affiliation"] = req.hospital_affiliation
    if req.license_number is not None: updates["license_number"] = req.license_number
    if req.password: updates["password_hash"] = hash_password(req.password)

    updated = DatabaseRepository.update_user_admin(user_id, updates)

    DatabaseRepository.add_audit_log(
        actor=current_user.get("name", "admin.audit"),
        action="USER_UPDATE",
        resource=f"{user_id}:{updated.get('username')}",
        status="SUCCESS",
    )

    return {"status": "success", "message": "User updated successfully.", "user": updated}


@router.delete("/users/{user_id}")
async def delete_user_account(user_id: str, current_user: dict = Depends(get_current_user)):
    """Deletes a user account from SQLite database with WORM audit logging. Requires admin role."""
    require_admin(current_user)
    user = DatabaseRepository.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found.")

    DatabaseRepository.delete_user(user_id)

    DatabaseRepository.add_audit_log(
        actor=current_user.get("name", "admin.audit"),
        action="USER_DELETE",
        resource=f"{user_id}:{user.get('username')}",
        status="SUCCESS",
    )

    return {"status": "success", "message": f"User '{user_id}' deleted successfully."}


class DoctorVerifyRequest(BaseModel):
    status: str = "verified"  # verified | rejected
    review_notes: str = "Credentials verified against medical council registry"


@router.get("/doctor-verification-queue")
async def get_doctor_verification_queue(current_user: dict = Depends(get_current_user)):
    """Module K: Retrieves list of pending doctor credential submissions requiring admin audit."""
    require_admin(current_user)
    pending_doctors = DatabaseRepository.list_doctors(status="pending")
    return {
        "status": "success",
        "total_pending": len(pending_doctors),
        "queue": pending_doctors,
    }


@router.post("/doctor-verification/{doctor_id}/verify")
async def verify_doctor_credentials(
    doctor_id: str,
    req: DoctorVerifyRequest,
    current_user: dict = Depends(get_current_user),
):
    """Module K: Approves or rejects doctor credentials with WORM audit logging."""
    require_admin(current_user)
    doc = DatabaseRepository.get_doctor_by_id(doctor_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Doctor '{doctor_id}' not found.")

    DatabaseRepository.update_doctor_verification(doctor_id, req.status)

    DatabaseRepository.add_audit_log(
        actor=current_user.get("name", "admin.audit"),
        action=f"DOCTOR_VERIFICATION_{req.status.upper()}",
        resource=f"{doctor_id}:{doc['name']}:{doc['registration_number']}",
        status="SUCCESS",
    )

    return {
        "status": "success",
        "message": f"Doctor '{doc['name']}' status updated to '{req.status}'.",
        "doctor_id": doctor_id,
        "verification_status": req.status,
    }


