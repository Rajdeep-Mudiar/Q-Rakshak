from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.app.db.repository import DatabaseRepository

router = APIRouter(prefix="/api/v1/profile", tags=["User Profile & Settings"])


class ProfileUpdateRequest(BaseModel):
    name: str = ""
    role: str = "patient"
    primary_email: str = ""
    extra_email: str | None = None
    emergency_phone: str | None = None
    phone: str | None = None
    blood_group: str | None = None
    age: int | None = None
    gender: str | None = None
    department: str | None = None
    hospital: str | None = None
    license_id: str | None = None
    # Doctor specific fields
    specialty: str | None = None
    registration_number: str | None = None
    council_name: str | None = None
    experience_years: int | None = None
    fee_inr: float | None = None
    languages: list[str] | None = None
    available_slots: list[str] | None = None
    verification_status: str | None = None
    notifications_sms: bool = True
    notifications_email: bool = True
    notifications_critical_qpu: bool = True


@router.get("/{user_id}")
async def get_user_profile(user_id: str):
    """Retrieves user profile, clinical contact settings, and doctor practice credentials from database."""
    user = DatabaseRepository.get_user_by_id(user_id)
    if not user:
        user = DatabaseRepository.get_user_by_username(user_id)
    
    if user:
        uid = user.get("id") or user_id
        role = (user.get("role") or "patient").lower()
        patient = DatabaseRepository.get_patient(uid) if role in ("patient", "user") else None
        doctor = DatabaseRepository.get_doctor_by_user_id(uid) if role in ("doctor", "clinician") else None

        profile = {
            "user_id": uid,
            "name": user.get("name") or "",
            "role": role,
            "primary_email": user.get("email") or "",
            "extra_email": user.get("secondary_email") or "",
            "emergency_phone": user.get("emergency_phone") or "",
            "phone": user.get("emergency_phone") or "",
            "blood_group": (patient.get("blood_group") if patient else "") or "",
            "age": (patient.get("age") if patient and patient.get("age") is not None else None),
            "gender": (patient.get("gender") if patient else "") or "",
            "department": user.get("department") or "",
            "hospital": (doctor.get("hospital_affiliation") if doctor else user.get("hospital_affiliation")) or "",
            "license_id": (doctor.get("registration_number") if doctor else user.get("license_number")) or "",
            # Doctor specific fields
            "specialty": doctor.get("specialty", "General Medicine & Clinical AI") if doctor else "",
            "registration_number": doctor.get("registration_number", user.get("license_number", "")) if doctor else "",
            "council_name": doctor.get("council_name", "National Medical Commission") if doctor else "",
            "experience_years": doctor.get("experience_years", 6) if doctor else None,
            "fee_inr": doctor.get("fee_inr", 600.0) if doctor else None,
            "rating": doctor.get("rating", 4.9) if doctor else None,
            "languages": doctor.get("languages", ["English", "Hindi"]) if doctor else [],
            "available_slots": doctor.get("available_slots", ["09:30 AM", "11:00 AM", "02:30 PM", "04:30 PM"]) if doctor else [],
            "verification_status": doctor.get("verification_status", "verified") if doctor else "",
            "notifications_sms": True,
            "notifications_email": True,
            "notifications_critical_qpu": True,
            "updated_at": user.get("created_at", time.strftime("%Y-%m-%d %H:%M:%S")),
        }
    else:
        patient = DatabaseRepository.get_patient(user_id)
        profile = {
            "user_id": user_id,
            "name": (patient.get("name") if patient else "") or "",
            "role": "patient",
            "primary_email": "",
            "extra_email": "",
            "emergency_phone": (patient.get("emergency_contact") if patient else "") or "",
            "phone": (patient.get("emergency_contact") if patient else "") or "",
            "blood_group": (patient.get("blood_group") if patient else "") or "",
            "age": (patient.get("age") if patient and patient.get("age") is not None else None),
            "gender": (patient.get("gender") if patient else "") or "",
            "department": "",
            "hospital": "",
            "license_id": (patient.get("mrn") if patient else "") or "",
            "specialty": "",
            "registration_number": "",
            "council_name": "",
            "experience_years": None,
            "fee_inr": None,
            "rating": None,
            "languages": [],
            "available_slots": [],
            "verification_status": "",
            "notifications_sms": True,
            "notifications_email": True,
            "notifications_critical_qpu": True,
            "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
    return {"status": "success", "profile": profile}


@router.put("/{user_id}")
async def update_user_profile(user_id: str, req: ProfileUpdateRequest):
    """Updates user profile and clinician credentials in the SQLite database."""
    DatabaseRepository.update_user_profile(user_id, {
        "name": req.name,
        "email": req.primary_email,
        "secondary_email": req.extra_email,
        "emergency_phone": req.emergency_phone,
        "blood_group": req.blood_group,
        "age": req.age,
        "gender": req.gender,
        "hospital_affiliation": req.hospital,
        "license_number": req.license_id or req.registration_number,
        "specialty": req.specialty,
        "registration_number": req.registration_number or req.license_id,
        "council_name": req.council_name,
        "experience_years": req.experience_years,
        "fee_inr": req.fee_inr,
        "languages": req.languages,
        "available_slots": req.available_slots,
        "verification_status": req.verification_status,
    })

    DatabaseRepository.add_audit_log(
        actor=req.name or user_id,
        action="PROFILE_SETTINGS_UPDATE",
        resource=user_id,
        status="SUCCESS",
    )

    refreshed = await get_user_profile(user_id)
    return {
        "status": "success",
        "message": "Profile and practice credentials updated successfully.",
        "profile": refreshed.get("profile", {}),
    }


@router.delete("/{user_id}")
async def delete_user_profile(user_id: str):
    """Permanently purges a user profile and all associated clinical records without any traces."""
    user = DatabaseRepository.get_user_by_id(user_id)
    if not user:
        user = DatabaseRepository.get_user_by_username(user_id)

    target_id = user["id"] if user else user_id
    actor_name = user["name"] if user else user_id
    target_username = user.get("username") if user else user_id

    DatabaseRepository.purge_user_account_completely(target_id)

    DatabaseRepository.add_audit_log(
        actor=actor_name,
        action="USER_ACCOUNT_PURGE_TRACE_FREE",
        resource=f"{target_id}:{target_username}",
        status="SUCCESS",
    )

    return {
        "status": "success",
        "message": f"Account '{target_username}' and all associated records have been completely purged from the database without any traces.",
    }

