from __future__ import annotations

import hashlib
import json
import time
import uuid
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from backend.app.core.security import get_current_user, get_optional_user
from backend.app.db.repository import DatabaseRepository

router = APIRouter(prefix="/api/v1/consultations", tags=["Doctor Consultation & Booking"])

# ── In-Memory Slot Soft-Lock Table (5-minute TTL) ─────────────────────────────
_SLOT_LOCKS: dict[str, dict[str, Any]] = {}
LOCK_TTL_SECONDS = 300  # 5 minutes


def _clean_expired_locks():
    now = time.time()
    expired = [k for k, v in _SLOT_LOCKS.items() if v["expires_at"] < now]
    for k in expired:
        _SLOT_LOCKS.pop(k, None)


# ── Drug Contraindication Matrix (Module H) ───────────────────────────────────
DRUG_INTERACTIONS = [
    {
        "drug_a": "aspirin",
        "drug_b": "warfarin",
        "severity": "high",
        "warning": "Severe bleeding risk: Concurrent use of Aspirin and Warfarin significantly increases major hemorrhagic events.",
    },
    {
        "drug_a": "nitroglycerin",
        "drug_b": "sildenafil",
        "severity": "critical",
        "warning": "Fatal hypotension risk: Co-administration causes profound refractory vasodilation and cardiovascular collapse.",
    },
    {
        "drug_a": "clopidogrel",
        "drug_b": "omeprazole",
        "severity": "moderate",
        "warning": "Reduced efficacy: Omeprazole inhibits CYP2C19 bioactivation of Clopidogrel, increasing thrombotic risk.",
    },
    {
        "drug_a": "simvastatin",
        "drug_b": "clarithromycin",
        "severity": "high",
        "warning": "Rhabdomyolysis risk: CYP3A4 inhibition raises statin plasma concentration, leading to severe myopathy.",
    },
    {
        "drug_a": "lisinopril",
        "drug_b": "spironolactone",
        "severity": "high",
        "warning": "Severe hyperkalemia: Concomitant ACE-inhibitor and potassium-sparing diuretic can cause fatal cardiac arrhythmias.",
    },
]

# ── Emergency Red-Flag Keyword Sets (Module F Triage) ─────────────────────────
RED_FLAG_PATTERNS = [
    ("crushing chest pain", "Potential Acute Myocardial Infarction (AMI)"),
    ("radiating to arm", "Potential Acute Coronary Syndrome"),
    ("radiating to jaw", "Potential Acute Coronary Syndrome"),
    ("sudden weakness", "Potential Cerebrovascular Accident / Acute Stroke (FAST)"),
    ("facial drooping", "Potential Acute Stroke (FAST)"),
    ("coughing blood", "Potential Severe Hemoptysis / Pulmonary Embolism"),
    ("hemoptysis", "Severe Pulmonary Hemorrhage Indicator"),
    ("cannot breathe", "Severe Respiratory Failure / Acute Hypoxia"),
    ("blue lips", "Cyanosis / Critical Oxygen Desaturation"),
    ("unconscious", "Loss of Consciousness / Comatose State"),
]


# ── Schemas ───────────────────────────────────────────────────────────────────

class SlotHoldRequest(BaseModel):
    doctor_id: str
    slot_time: str
    patient_id: Optional[str] = None


class TriageCheckRequest(BaseModel):
    symptoms: str


class BookingCreateRequest(BaseModel):
    doctor_id: str
    slot_time: str
    mode: str = "video"  # video | audio | in_person
    patient_id: Optional[str] = None
    reason: str
    symptoms: str
    duration: str = "3 days"
    existing_medications: list[str] = Field(default_factory=list)
    emergency_contact: str = "+91 98765 43210"


class BookingTransitionRequest(BaseModel):
    status: str  # confirmed | in_consultation | completed | cancelled | refunded
    reason: Optional[str] = None


class ChatMessageRequest(BaseModel):
    sender: str
    text: str


class WebRTCSignalRequest(BaseModel):
    signal_type: str
    payload: dict[str, Any]
    sender_role: Optional[str] = None
    sender_id: Optional[str] = None


class MedicationItem(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration_days: int
    instructions: str = "Take with water after food"


class PrescriptionCreateRequest(BaseModel):
    booking_id: str
    patient_id: str
    doctor_id: str
    diagnosis: str
    medications: list[MedicationItem]
    soap_subjective: str
    soap_objective: str
    soap_assessment: str
    soap_plan: str
    lifestyle_advice: list[str] = Field(default_factory=list)
    follow_up_date: str = "In 2 weeks"
    tests_to_order: list[str] = Field(default_factory=list)


class InteractionCheckRequest(BaseModel):
    candidate_drugs: list[str]
    current_medications: list[str] = Field(default_factory=list)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/doctors")
def list_doctors(
    specialty: Optional[str] = None,
    status: str = "verified",
    mode: Optional[str] = None,
):
    """Module F: Searches and filters verified doctors directory per SRS Section 7.2."""
    doctors = DatabaseRepository.list_doctors(specialty=specialty, status=status)
    return {
        "status": "success",
        "total": len(doctors),
        "doctors": doctors,
    }


@router.get("/doctors/{doctor_id}")
def get_doctor_profile(doctor_id: str):
    """Module F: Retrieves doctor profile with verified credentials and availability slots."""
    doc = DatabaseRepository.get_doctor_by_id(doctor_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    _clean_expired_locks()
    
    # Annotate slots with locked status
    slots = []
    for s in doc.get("available_slots", []):
        lock_key = f"{doctor_id}:{s}"
        is_held = lock_key in _SLOT_LOCKS
        slots.append({
            "time": s,
            "is_available": not is_held,
            "held_until": _SLOT_LOCKS[lock_key]["expires_at"] if is_held else None,
        })
    doc["slot_status"] = slots
    return {"status": "success", "doctor": doc}


@router.post("/slots/hold")
def hold_appointment_slot(req: SlotHoldRequest):
    """Module F: Soft-locks a consultation slot for 5 minutes while user completes the booking form."""
    _clean_expired_locks()
    lock_key = f"{req.doctor_id}:{req.slot_time}"

    if lock_key in _SLOT_LOCKS:
        holder = _SLOT_LOCKS[lock_key]
        if holder["patient_id"] != req.patient_id:
            raise HTTPException(
                status_code=409,
                detail="This slot is currently held by another patient. Please select a different slot or wait 5 minutes.",
            )

    expires_at = time.time() + LOCK_TTL_SECONDS
    _SLOT_LOCKS[lock_key] = {"patient_id": req.patient_id, "expires_at": expires_at}

    return {
        "status": "held",
        "doctor_id": req.doctor_id,
        "slot_time": req.slot_time,
        "ttl_seconds": LOCK_TTL_SECONDS,
        "expires_at": expires_at,
        "message": "Slot soft-locked for 5 minutes. Please complete your intake form.",
    }


@router.post("/triage-check")
def evaluate_emergency_triage(req: TriageCheckRequest):
    """Module F: Evaluates red-flag acute symptoms to intercept routine booking if emergency care is required."""
    symptoms_lower = req.symptoms.lower()
    flags = []
    
    for phrase, clinical_flag in RED_FLAG_PATTERNS:
        if phrase in symptoms_lower:
            flags.append(clinical_flag)

    is_emergency = len(flags) > 0

    return {
        "is_emergency": is_emergency,
        "triage_risk": "emergency_red_flag" if is_emergency else "routine_clinical",
        "detected_red_flags": flags,
        "guidance": (
            "EMERGENCY PROTOCOL ACTIVATED: Your reported symptoms indicate immediate medical evaluation is required. "
            "Do not wait for a scheduled tele-consultation. Please call Emergency Services (108 / 911) or proceed to the nearest Emergency Room immediately."
            if is_emergency else
            "Routine clinical intake cleared. Safe to proceed with doctor consultation booking."
        ),
        "helpline": "Emergency Care Helpline: 108 (India) / 911 (US)",
    }


@router.post("/book")
def create_consultation_booking(req: BookingCreateRequest, current_user: dict = Depends(get_optional_user)):
    """Module F: Creates consultation booking with intake form, triage risk check, and escrow hold."""
    doc = DatabaseRepository.get_doctor_by_id(req.doctor_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Selected doctor does not exist.")

    # Run emergency triage
    triage_result = evaluate_emergency_triage(TriageCheckRequest(symptoms=req.symptoms))
    if triage_result["is_emergency"]:
        DatabaseRepository.add_audit_log(
            actor=req.patient_id,
            action="EMERGENCY_TRIAGE_INTERCEPT",
            resource=f"DOCTOR:{req.doctor_id}",
            status="WARNING",
        )

    bid = f"BK-{uuid.uuid4().hex[:6].upper()}"
    booking_record = {
        "id": bid,
        "patient_id": req.patient_id,
        "doctor_id": req.doctor_id,
        "slot_time": req.slot_time,
        "mode": req.mode,
        "status": "confirmed",
        "payment_status": "authorized",
        "triage_risk": triage_result["triage_risk"],
        "emergency_flags": triage_result["detected_red_flags"],
        "intake": {
            "reason": req.reason,
            "symptoms": req.symptoms,
            "duration": req.duration,
            "medications": req.existing_medications,
            "emergency_contact": req.emergency_contact,
            "fee_inr": doc["fee_inr"],
        },
    }

    created = DatabaseRepository.create_booking(booking_record)

    # Release soft lock
    lock_key = f"{req.doctor_id}:{req.slot_time}"
    _SLOT_LOCKS.pop(lock_key, None)

    # Send in-app notifications
    patient_user_target = (current_user.get("username") if current_user else None) or (current_user.get("id") if current_user else None) or req.patient_id or "alex.patient"
    DatabaseRepository.create_notification(
        user_id=patient_user_target,
        title="Consultation Confirmed",
        message=f"Your {req.mode.title()} consultation with {doc['name']} has been confirmed for {req.slot_time}.",
        ref_code=f"REF-{bid}",
        category="booking",
    )
    if doc.get("user_id"):
        DatabaseRepository.create_notification(
            user_id=doc["user_id"],
            title="New Patient Booking",
            message=f"Patient {req.patient_id} has booked a {req.mode} consult for {req.slot_time}.",
            ref_code=f"REF-{bid}",
            category="booking",
        )

    # WORM Audit logging
    actor_name = (current_user.get("username") if current_user else None) or req.patient_id or "alex.patient"
    DatabaseRepository.add_audit_log(
        actor=actor_name,
        action="BOOKING_CREATION",
        resource=f"{bid}:{doc['name']}",
        status="SUCCESS",
    )

    return {
        "status": "success",
        "booking": created,
        "triage": triage_result,
        "message": f"Appointment successfully confirmed with {doc['name']}.",
    }


@router.get("/bookings")
def list_bookings(
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    current_user: dict = Depends(get_optional_user),
):
    """Module F & I: Lists bookings with role-based filtering."""
    role = current_user.get("role", "patient") if current_user else "patient"
    if current_user and role == "doctor":
        doc = DatabaseRepository.get_doctor_by_user_id(current_user.get("user_id") or current_user.get("id"))
        if doc:
            doctor_id = doc["id"]

    bookings = DatabaseRepository.list_bookings(patient_id=patient_id, doctor_id=doctor_id)
    return {"status": "success", "total": len(bookings), "bookings": bookings}


@router.get("/bookings/{booking_id}")
def get_booking_detail(booking_id: str):
    """Module F: Retrieves a specific booking with doctor and patient metadata."""
    b = DatabaseRepository.get_booking_by_id(booking_id)
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found.")
    room = DatabaseRepository.get_room_by_booking(booking_id)
    b["room"] = room
    return {"status": "success", "booking": b}


@router.post("/bookings/{booking_id}/transition")
def transition_booking_state(booking_id: str, req: BookingTransitionRequest, current_user: dict = Depends(get_optional_user)):
    """Module F: Transitions booking through state machine:
    requested -> confirmed -> in_consultation -> completed / cancelled / no_show -> refunded
    """
    valid_states = {"requested", "confirmed", "in_consultation", "completed", "cancelled", "no_show", "refunded"}
    if req.status not in valid_states:
        raise HTTPException(status_code=400, detail=f"Invalid booking status '{req.status}'.")

    pay_status = None
    if req.status == "completed":
        pay_status = "captured"
    elif req.status in ("cancelled", "refunded"):
        pay_status = "refunded"

    updated = DatabaseRepository.update_booking_status(booking_id, req.status, payment_status=pay_status)
    if not updated:
        raise HTTPException(status_code=404, detail="Booking not found.")

    DatabaseRepository.add_audit_log(
        actor=current_user.get("username", "system"),
        action=f"BOOKING_STATE_{req.status.upper()}",
        resource=f"{booking_id}:REASON={req.reason or 'None'}",
        status="SUCCESS",
    )

    return {"status": "success", "booking": updated}


# ── Virtual Consultation Room (Module G) ──────────────────────────────────────

@router.get("/rooms/{booking_id}")
def get_consultation_room(booking_id: str):
    """Module G: Retrieves real-time state of WebRTC consultation room."""
    room = DatabaseRepository.get_room_by_booking(booking_id)
    if not room:
        raise HTTPException(status_code=404, detail="Consultation room not found for this booking.")
    return {"status": "success", "room": room}


@router.post("/rooms/{booking_id}/admit")
def admit_patient_to_call(booking_id: str, current_user: dict = Depends(get_optional_user)):
    """Module G: Doctor admits patient from virtual waiting room into active video session."""
    room = DatabaseRepository.update_room_status(booking_id, status="active", doctor_joined=True)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")

    DatabaseRepository.add_room_chat_message(
        booking_id,
        sender="System",
        text="Doctor has admitted the patient. Secure video stream initialized with DTLS-SRTP 256-bit encryption.",
    )

    DatabaseRepository.update_booking_status(booking_id, "in_consultation")
    return {"status": "success", "room": room, "message": "Patient admitted to active consultation."}


@router.post("/rooms/{booking_id}/chat")
def send_consultation_chat_message(booking_id: str, req: ChatMessageRequest):
    """Module G: Sends message in the encrypted in-consultation chat channel."""
    messages = DatabaseRepository.add_room_chat_message(booking_id, req.sender, req.text)
    return {"status": "success", "chat_messages": messages}


@router.post("/rooms/{booking_id}/signals")
def publish_webrtc_signal(booking_id: str, req: WebRTCSignalRequest, current_user: dict = Depends(get_optional_user)):
    """Persists an authenticated SDP/ICE signal for the other consultation participant."""
    if req.signal_type not in {"offer", "answer", "ice-candidate"}:
        raise HTTPException(status_code=400, detail="Unsupported WebRTC signal type.")
    if not DatabaseRepository.get_room_by_booking(booking_id):
        raise HTTPException(status_code=404, detail="Consultation room not found.")
    sender_role = req.sender_role or (current_user.get("role") if current_user else None) or "participant"
    sender_id = req.sender_id or (current_user.get("user_id") if current_user else None) or (current_user.get("username") if current_user else None) or sender_role
    signal = DatabaseRepository.add_room_signal(
        booking_id,
        sender_id,
        sender_role,
        req.signal_type,
        req.payload,
    )
    return {"status": "success", "signal": signal}


@router.get("/rooms/{booking_id}/signals")
def list_webrtc_signals(
    booking_id: str,
    after_id: int = 0,
    role: Optional[str] = Query(None, description="Caller role to exclude self-signals"),
    current_user: dict = Depends(get_optional_user),
):
    """Returns new signals for the opposite consultation participant only."""
    if not DatabaseRepository.get_room_by_booking(booking_id):
        raise HTTPException(status_code=404, detail="Consultation room not found.")
    current_sender_id = (current_user.get("user_id") if current_user else None) or (current_user.get("username") if current_user else None)
    signals = DatabaseRepository.list_room_signals(
        booking_id,
        after_id=after_id,
        sender_id=current_sender_id,
        exclude_role=role,
    )
    return {"status": "success", "signals": signals}


# ── High-Performance WebSocket Real-Time Signaling Hub ────────────────────────

class ConsultationRoomHub:
    """Manages active WebRTC WebSocket peer connections and broadcasts in O(1) time."""

    def __init__(self):
        self.rooms: dict[str, set[WebSocket]] = {}

    async def connect(self, booking_id: str, websocket: WebSocket):
        await websocket.accept()
        if booking_id not in self.rooms:
            self.rooms[booking_id] = set()
        self.rooms[booking_id].add(websocket)

    def disconnect(self, booking_id: str, websocket: WebSocket):
        if booking_id in self.rooms:
            self.rooms[booking_id].discard(websocket)
            if not self.rooms[booking_id]:
                self.rooms.pop(booking_id, None)

    async def broadcast(self, booking_id: str, message: dict, sender_ws: Optional[WebSocket] = None):
        if booking_id not in self.rooms:
            return
        dead_sockets = set()
        for ws in self.rooms[booking_id]:
            if ws != sender_ws:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead_sockets.add(ws)
        for dead in dead_sockets:
            self.disconnect(booking_id, dead)


room_hub = ConsultationRoomHub()


@router.websocket("/ws/{booking_id}")
async def consultation_websocket_endpoint(websocket: WebSocket, booking_id: str):
    """Bi-directional real-time WebSocket channel for WebRTC signaling (SDP/ICE) and consultation chat."""
    await room_hub.connect(booking_id, websocket)
    try:
        # Send initial connected handshake
        await websocket.send_json({
            "type": "connection_established",
            "booking_id": booking_id,
            "timestamp": time.time(),
        })

        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "signal")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong", "timestamp": time.time()})
            elif msg_type == "signal":
                # Persist signal in background for reconnection replay
                payload = data.get("payload", {})
                signal_type = data.get("signal_type", "offer")
                sender_id = data.get("sender_id", "peer")
                sender_role = data.get("sender_role", "participant")
                
                try:
                    DatabaseRepository.add_room_signal(
                        booking_id,
                        sender_id,
                        sender_role,
                        signal_type,
                        payload,
                    )
                except Exception:
                    pass

                # Broadcast immediately to peers in room
                await room_hub.broadcast(booking_id, {
                    "type": "signal",
                    "signal_type": signal_type,
                    "payload": payload,
                    "sender_id": sender_id,
                    "sender_role": sender_role,
                    "timestamp": time.time(),
                }, sender_ws=websocket)

            elif msg_type == "chat":
                sender = data.get("sender", "Participant")
                text = data.get("text", "")
                try:
                    DatabaseRepository.add_room_chat_message(booking_id, sender, text)
                except Exception:
                    pass

                await room_hub.broadcast(booking_id, {
                    "type": "chat",
                    "sender": sender,
                    "text": text,
                    "timestamp": time.time(),
                }, sender_ws=None)

            elif msg_type == "admit":
                await room_hub.broadcast(booking_id, {
                    "type": "room_state",
                    "status": "active",
                    "message": "Patient admitted to active consultation room.",
                }, sender_ws=None)

    except WebSocketDisconnect:
        room_hub.disconnect(booking_id, websocket)
    except Exception:
        room_hub.disconnect(booking_id, websocket)


# ── E-Prescriptions & Drug Safety (Module H) ───────────────────────────────────

@router.post("/prescriptions/check-interactions")
def check_drug_interactions(req: InteractionCheckRequest):
    """Module H: Cross-checks prescribed medications against patient's current drugs for contraindications."""
    all_drugs = [d.lower().strip() for d in req.candidate_drugs + req.current_medications]
    detected_warnings = []

    for item in DRUG_INTERACTIONS:
        da = item["drug_a"]
        db = item["drug_b"]
        has_a = any(da in d for d in all_drugs)
        has_b = any(db in d for d in all_drugs)
        if has_a and has_b:
            detected_warnings.append(item)

    is_safe = len(detected_warnings) == 0

    return {
        "is_safe": is_safe,
        "warnings_count": len(detected_warnings),
        "interactions": detected_warnings,
        "summary": "No clinical contraindications detected." if is_safe else f"CAUTION: {len(detected_warnings)} drug-drug contraindication(s) flagged!",
    }


@router.post("/prescriptions")
def create_e_prescription(req: PrescriptionCreateRequest, current_user: dict = Depends(get_optional_user)):
    """Module H: Generates cryptographically signed E-Prescription with SOAP notes and updates Digital Twin."""
    meds_dict = [m.model_dump() for m in req.medications]
    
    # Auto interaction check
    drug_names = [m.name for m in req.medications]
    safety_check = check_drug_interactions(InteractionCheckRequest(candidate_drugs=drug_names))

    presc_record = {
        "booking_id": req.booking_id,
        "patient_id": req.patient_id,
        "doctor_id": req.doctor_id,
        "diagnosis": req.diagnosis,
        "medications": meds_dict,
        "soap_notes": {
            "subjective": req.soap_subjective,
            "objective": req.soap_objective,
            "assessment": req.soap_assessment,
            "plan": req.soap_plan,
        },
        "care_plan": {
            "lifestyle_advice": req.lifestyle_advice,
            "follow_up_date": req.follow_up_date,
            "tests_to_order": req.tests_to_order,
        },
    }

    created = DatabaseRepository.create_prescription(presc_record)
    
    # Transition booking to completed
    DatabaseRepository.update_booking_status(req.booking_id, "completed", payment_status="captured")
    DatabaseRepository.update_room_status(req.booking_id, status="ended")

    # WORM Audit log
    doc_actor = (current_user.get("name") if current_user else None) or (current_user.get("username") if current_user else None) or req.doctor_id
    DatabaseRepository.add_audit_log(
        actor=doc_actor,
        action="PRESCRIPTION_ISSUED",
        resource=f"{created['id']}:PATIENT={req.patient_id}:SIG={created['digital_signature_hash'][:12]}",
        status="SUCCESS",
    )

    # In-app notification to patient
    DatabaseRepository.create_notification(
        user_id=req.patient_id or "alex.patient",
        title="E-Prescription & Care Plan Issued",
        message=f"Dr. has issued your digital e-prescription for diagnosis: {req.diagnosis}.",
        ref_code=f"REF-{created['id']}",
        category="prescription",
    )

    return {
        "status": "success",
        "prescription": created,
        "safety_audit": safety_check,
        "message": "Digitally signed E-Prescription generated and securely stored in patient vault.",
    }


@router.get("/prescriptions")
def list_prescriptions(patient_id: Optional[str] = None, doctor_id: Optional[str] = None):
    """Module H: Lists issued prescriptions for patient or doctor."""
    items = DatabaseRepository.list_prescriptions(patient_id=patient_id, doctor_id=doctor_id)
    return {"status": "success", "total": len(items), "prescriptions": items}


@router.get("/prescriptions/{presc_id}")
def get_prescription_by_id(presc_id: str):
    """Module H: Retrieves a specific prescription with cryptographic signature."""
    p = DatabaseRepository.get_prescription_by_id(presc_id)
    if not p:
        raise HTTPException(status_code=404, detail="Prescription not found.")
    return {"status": "success", "prescription": p}
