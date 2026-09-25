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
# ── Drug & Food Contraindication Database (Clinical SaMD) ─────────────────────
DRUG_INTERACTIONS = [
    {
        "drug_a": "aspirin",
        "drug_b": "warfarin",
        "severity": "high",
        "mechanism": "Synergistic Anticoagulation & Antiplatelet",
        "warning": "Severe bleeding risk: Concurrent use of Aspirin and Warfarin significantly increases major hemorrhagic events and GI ulceration.",
        "recommendation": "Avoid combination unless strictly indicated for mechanical heart valves under close INR monitoring.",
    },
    {
        "drug_a": "aspirin",
        "drug_b": "ibuprofen",
        "severity": "moderate",
        "mechanism": "Competitive COX-1 Binding",
        "warning": "Reduced cardioprotection & GI Toxicity: Ibuprofen competitively interferes with Aspirin's irreversible platelet inhibition.",
        "recommendation": "Take immediate-release Aspirin at least 30 minutes before or 8 hours after Ibuprofen.",
    },
    {
        "drug_a": "nitroglycerin",
        "drug_b": "sildenafil",
        "severity": "critical",
        "mechanism": "Synergistic cGMP-Mediated Vasodilation",
        "warning": "Fatal hypotension risk: Co-administration causes profound refractory vasodilation, acute myocardial ischemia, and cardiovascular collapse.",
        "recommendation": "ABSOLUTE CONTRAINDICATION: Do not administer nitrates within 24h of sildenafil or 48h of tadalafil.",
    },
    {
        "drug_a": "clopidogrel",
        "drug_b": "omeprazole",
        "severity": "moderate",
        "mechanism": "CYP2C19 Competitive Inhibition",
        "warning": "Reduced antiplatelet efficacy: Omeprazole inhibits hepatic bioactivation of Clopidogrel into its active thiol metabolite.",
        "recommendation": "Switch to Pantoprazole or H2-blocker (Famotidine) which demonstrate minimal CYP2C19 inhibition.",
    },
    {
        "drug_a": "simvastatin",
        "drug_b": "clarithromycin",
        "severity": "high",
        "mechanism": "Potent CYP3A4 Hepatic Inhibition",
        "warning": "Rhabdomyolysis risk: Clarithromycin raises statin plasma concentration up to 10-fold, triggering acute myopathy and acute kidney injury.",
        "recommendation": "Temporarily suspend statin therapy during macrolide antibiotic course or switch to Rosuvastatin / Azithromycin.",
    },
    {
        "drug_a": "atorvastatin",
        "drug_b": "clarithromycin",
        "severity": "high",
        "mechanism": "CYP3A4 Inhibition",
        "warning": "Elevated statin toxicity: Marked increase in Atorvastatin exposure with elevated risk of skeletal muscle necrosis.",
        "recommendation": "Limit Atorvastatin dose to maximum 20mg daily or switch to non-CYP3A4 antibiotic (Azithromycin).",
    },
    {
        "drug_a": "lisinopril",
        "drug_b": "spironolactone",
        "severity": "high",
        "mechanism": "Synergistic Distal Tubule Potassium Retention",
        "warning": "Severe hyperkalemia: Concomitant ACE-inhibitor and potassium-sparing aldosterone antagonist can cause fatal cardiac arrhythmias.",
        "recommendation": "Monitor baseline and weekly serum potassium (K+) and serum creatinine; avoid concurrent potassium supplements.",
    },
    {
        "drug_a": "metformin",
        "drug_b": "contrast",
        "severity": "high",
        "mechanism": "Contrast-Induced Nephropathy (CIN)",
        "warning": "Lactic acidosis risk: Iodinated intravascular radiocontrast agents can induce acute renal impairment, precipitating fatal metformin accumulation.",
        "recommendation": "Withhold Metformin 48h prior to and 48h post iodinated contrast imaging; resume only after eGFR confirmation.",
    },
    {
        "drug_a": "methotrexate",
        "drug_b": "ibuprofen",
        "severity": "high",
        "mechanism": "Decreased Renal Tubular Secretion",
        "warning": "Severe bone marrow suppression: NSAIDs inhibit renal prostaglandins and competitive elimination of Methotrexate.",
        "recommendation": "Avoid high-dose NSAID co-prescription; substitute with Paracetamol for analgesia.",
    },
    {
        "drug_a": "fluoxetine",
        "drug_b": "tramadol",
        "severity": "high",
        "mechanism": "Additive Central Serotonergic Hyperactivity",
        "warning": "Serotonin Syndrome & Seizures: Combined SSRI and Tramadol leads to hyperthermia, autonomic instability, clonus, and lowered seizure threshold.",
        "recommendation": "Avoid concurrent use; use non-serotonergic analgesics (Acetaminophen or mild Opioids).",
    },
    {
        "drug_a": "levothyroxine",
        "drug_b": "calcium",
        "severity": "moderate",
        "mechanism": "Insoluble Chelation / Physical Adsorption",
        "warning": "Impaired thyroid absorption: Calcium supplements form insoluble chelate complexes with Levothyroxine in the gut.",
        "recommendation": "Separate Levothyroxine and Calcium carbonate administration by at least 4 hours.",
    },
    {
        "drug_a": "ciprofloxacin",
        "drug_b": "theophylline",
        "severity": "high",
        "mechanism": "CYP1A2 Inhibition",
        "warning": "Theophylline toxicity: Ciprofloxacin elevates serum theophylline levels by 100-300%, triggering intractable nausea, arrhythmias, and seizures.",
        "recommendation": "Reduce theophylline dosage by 50% and monitor plasma concentrations closely, or choose alternative antibiotic.",
    },
    {
        "drug_a": "lithium",
        "drug_b": "hydrochlorothiazide",
        "severity": "high",
        "mechanism": "Natriuresis-Induced Proximal Lithium Reabsorption",
        "warning": "Severe Lithium toxicity: Thiazide diuretics deplete sodium, causing compensatory proximal tubular retention of Lithium.",
        "recommendation": "Reduce Lithium dose by 25-50% and monitor serum lithium levels weekly when initiating thiazide therapy.",
    },
    {
        "drug_a": "digoxin",
        "drug_b": "amiodarone",
        "severity": "high",
        "mechanism": "P-glycoprotein (P-gp) & Renal Clearance Inhibition",
        "warning": "Digitalis toxicity: Amiodarone reduces renal and biliary excretion of Digoxin, doubling serum digoxin levels.",
        "recommendation": "Empirically reduce Digoxin dose by 50% when starting Amiodarone and monitor ECG for heart block.",
    },
    {
        "drug_a": "losartan",
        "drug_b": "lisinopril",
        "severity": "high",
        "mechanism": "Dual Renin-Angiotensin-Aldosterone Blockade",
        "warning": "Renal failure and severe hypotension: Combined ARB and ACE inhibitor increases mortality without cardiovascular gain.",
        "recommendation": "Avoid dual RAAS blockade; select single optimal agent with a calcium channel blocker or diuretic.",
    },
    {
        "drug_a": "amoxicillin",
        "drug_b": "allopurinol",
        "severity": "moderate",
        "mechanism": "Immunological Hypersensitivity",
        "warning": "High incidence of skin rash: Co-prescription markedly increases maculopapular drug eruptions.",
        "recommendation": "Advise patient to inspect skin daily; substitute Cephalosporin or Macrolide if antibiotic is required.",
    },
]

DRUG_FOOD_INTERACTIONS = [
    {
        "food_name": "Grapefruit & Grapefruit Juice",
        "food_key": "grapefruit",
        "drugs_affected": ["atorvastatin", "simvastatin", "amlodipine", "cyclosporine", "buspirone"],
        "severity": "high",
        "mechanism": "Intestinal CYP3A4 & P-gp Enzyme Inhibition",
        "warning": "Furanocoumarins in grapefruit irreversibly inhibit intestinal CYP3A4, causing 300% surge in systemic drug levels and severe rhabdomyolysis or profound hypotension.",
        "dietary_guidance": "Completely avoid grapefruit and Seville oranges while taking CYP3A4-metabolized statins or calcium channel blockers.",
    },
    {
        "food_name": "Dark Green Leafy Vegetables (Vitamin K)",
        "food_key": "leafy_greens",
        "drugs_affected": ["warfarin", "coumadin"],
        "severity": "high",
        "mechanism": "Vitamin K Clotting Factor Synthesis Antagonism",
        "warning": "Spinach, kale, and broccoli supply exogenous Vitamin K1, directly overriding Warfarin's inhibition of VKORC1 and plummeting INR, risking acute stroke/thrombosis.",
        "dietary_guidance": "Maintain a strictly consistent daily intake of Vitamin K-rich vegetables rather than sudden binge consumption or total avoidance.",
    },
    {
        "food_name": "Dairy Products (Milk, Cheese, Yogurt)",
        "food_key": "dairy_calcium",
        "drugs_affected": ["ciprofloxacin", "levofloxacin", "doxycycline", "tetracycline", "levothyroxine"],
        "severity": "moderate",
        "mechanism": "Multivalent Cation Chelation",
        "warning": "Divalent Calcium (Ca2+) ions bind directly to fluoroquinolones, tetracyclines, and thyroid hormone, creating unabsorbable precipitation complexes.",
        "dietary_guidance": "Consume dairy products at least 2 hours before or 4 hours after taking these medications.",
    },
    {
        "food_name": "High-Potassium Foods (Bananas, Salt Substitutes)",
        "food_key": "high_potassium",
        "drugs_affected": ["lisinopril", "enalapril", "losartan", "valsartan", "spironolactone"],
        "severity": "high",
        "mechanism": "Synergistic Extracellular Potassium Accumulation",
        "warning": "Potassium-rich foods and KCl salt substitutes combined with ACE inhibitors or ARBs lead to life-threatening hyperkalemia (K+ > 5.5 mEq/L) and cardiac arrest.",
        "dietary_guidance": "Limit potassium-rich salt substitutes and consult clinician before consuming high amounts of bananas, avocados, and coconut water.",
    },
    {
        "food_name": "Aged Cheeses & Fermented Foods (Tyramine)",
        "food_key": "tyramine_foods",
        "drugs_affected": ["selegiline", "phenelzine", "tranylcypromine", "linezolid"],
        "severity": "critical",
        "mechanism": "Inhibition of MAO-A Tyramine Catabolism",
        "warning": "Inhibited monoamine oxidase allows dietary tyramine to enter systemic circulation and displace norepinephrine, triggering lethal Hypertensive Crisis (BP > 200/120).",
        "dietary_guidance": "Follow strict low-tyramine diet: avoid aged parmesan/cheddar, salami, tap beer, soy sauce, and kimchi during and 14 days after therapy.",
    },
    {
        "food_name": "Alcohol & Alcoholic Beverages",
        "food_key": "alcohol",
        "drugs_affected": ["metronidazole", "paracetamol", "acetaminophen", "alprazolam", "diazepam", "metformin"],
        "severity": "critical",
        "mechanism": "Aldehyde Dehydrogenase Blockade / Synergistic CNS & Hepatic Toxicity",
        "warning": "Severe disulfiram-like acetaldehyde poisoning with Metronidazole; accelerated NAPQI hepatotoxicity with Paracetamol; fatal respiratory depression with Sedatives.",
        "dietary_guidance": "Strict abstinence from all alcoholic drinks and ethanol-containing syrups during course of treatment.",
    },
    {
        "food_name": "Caffeinated Beverages (Coffee, Tea, Energy Drinks)",
        "food_key": "caffeine",
        "drugs_affected": ["ciprofloxacin", "theophylline", "pseudoephedrine"],
        "severity": "moderate",
        "mechanism": "Hepatic CYP1A2 Metabolic Competition",
        "warning": "Ciprofloxacin inhibits caffeine clearance, compounding central nervous excitation, severe palpitations, panic, insomnia, and tremors.",
        "dietary_guidance": "Reduce daily coffee/tea intake to maximum 1 small cup or switch to decaffeinated alternatives.",
    },
    {
        "food_name": "St. John's Wort & Herbal Extracts",
        "food_key": "st_johns_wort",
        "drugs_affected": ["sertraline", "fluoxetine", "escitalopram", "digoxin", "warfarin", "oral_contraceptives"],
        "severity": "high",
        "mechanism": "CYP3A4 / P-gp Induction & Serotonin Transporter Inhibition",
        "warning": "Severe reduction in therapeutic efficacy of critical cardiovascular / contraceptive drugs, or acute Serotonin Syndrome when combined with SSRIs.",
        "dietary_guidance": "Discontinue all over-the-counter herbal and botanical supplements and notify attending physician.",
    },
]

COMMON_DRUG_CATALOG = [
    {"name": "Aspirin", "class": "Antiplatelet / NSAID", "common_dose": "75mg - 150mg OD"},
    {"name": "Warfarin", "class": "Oral Anticoagulant (VKA)", "common_dose": "2.5mg - 5mg OD"},
    {"name": "Clopidogrel", "class": "P2Y12 Antiplatelet", "common_dose": "75mg OD"},
    {"name": "Atorvastatin", "class": "HMG-CoA Reductase Inhibitor", "common_dose": "10mg - 40mg HS"},
    {"name": "Simvastatin", "class": "HMG-CoA Reductase Inhibitor", "common_dose": "20mg - 40mg HS"},
    {"name": "Lisinopril", "class": "ACE Inhibitor (Antihypertensive)", "common_dose": "5mg - 20mg OD"},
    {"name": "Losartan", "class": "Angiotensin II Receptor Blocker", "common_dose": "25mg - 50mg OD"},
    {"name": "Metformin", "class": "Biguanide Antidiabetic", "common_dose": "500mg - 1000mg BD"},
    {"name": "Spironolactone", "class": "Aldosterone Antagonist", "common_dose": "25mg - 50mg OD"},
    {"name": "Omeprazole", "class": "Proton Pump Inhibitor (PPI)", "common_dose": "20mg - 40mg OD"},
    {"name": "Pantoprazole", "class": "Proton Pump Inhibitor (PPI)", "common_dose": "40mg OD"},
    {"name": "Levothyroxine", "class": "Thyroid Hormone (T4)", "common_dose": "25mcg - 100mcg OD"},
    {"name": "Ciprofloxacin", "class": "Fluoroquinolone Antibiotic", "common_dose": "500mg BD"},
    {"name": "Amoxicillin", "class": "Beta-Lactam Antibiotic", "common_dose": "500mg TDS"},
    {"name": "Clarithromycin", "class": "Macrolide Antibiotic", "common_dose": "250mg - 500mg BD"},
    {"name": "Ibuprofen", "class": "NSAID Analgesic", "common_dose": "400mg TDS"},
    {"name": "Paracetamol", "class": "Analgesic / Antipyretic", "common_dose": "500mg - 650mg TDS"},
    {"name": "Sildenafil", "class": "PDE-5 Inhibitor", "common_dose": "25mg - 50mg PRN"},
    {"name": "Nitroglycerin", "class": "Nitrate Vasodilator", "common_dose": "0.4mg SL PRN"},
    {"name": "Digoxin", "class": "Cardiac Glycoside", "common_dose": "0.125mg - 0.25mg OD"},
    {"name": "Amiodarone", "class": "Class III Antiarrhythmic", "common_dose": "100mg - 200mg OD"},
    {"name": "Methotrexate", "class": "DMARD / Antimetabolite", "common_dose": "7.5mg - 15mg Weekly"},
    {"name": "Lithium", "class": "Mood Stabilizer", "common_dose": "300mg - 600mg BD"},
    {"name": "Fluoxetine", "class": "SSRI Antidepressant", "common_dose": "20mg OD"},
    {"name": "Tramadol", "class": "Opioid Analgesic", "common_dose": "50mg BD/TDS"},
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


class PharmaAnalysisRequest(BaseModel):
    medications: list[str] = Field(default_factory=list)
    dietary_items: list[str] = Field(default_factory=list)
    patient_id: Optional[str] = None


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


# ── Interactive Multi-Drug & Drug-Food Risk Matrix ───────────────────────────

@router.get("/pharma/catalog")
def get_pharma_catalog():
    """Returns the reference database of medications, food contraindications, and known collisions."""
    return {
        "status": "success",
        "common_medications": COMMON_DRUG_CATALOG,
        "drug_interactions_db": DRUG_INTERACTIONS,
        "food_interactions_db": DRUG_FOOD_INTERACTIONS,
        "total_rules": len(DRUG_INTERACTIONS) + len(DRUG_FOOD_INTERACTIONS),
    }


@router.post("/pharma/analyze")
def analyze_pharma_interactions(req: PharmaAnalysisRequest):
    """Evaluates multi-drug collisions and drug-food contraindications with clinical severity grading."""
    raw_meds = [m.lower().strip() for m in req.medications if m and m.strip()]
    raw_diet = [f.lower().strip() for f in req.dietary_items if f and f.strip()]

    # 1. Multi-Drug Collisions
    detected_drug_interactions = []
    matrix_pairs = []

    for i in range(len(raw_meds)):
        for j in range(i + 1, len(raw_meds)):
            med_1 = raw_meds[i]
            med_2 = raw_meds[j]
            for rule in DRUG_INTERACTIONS:
                ra = rule["drug_a"].lower()
                rb = rule["drug_b"].lower()
                if (ra in med_1 and rb in med_2) or (ra in med_2 and rb in med_1):
                    collision = {
                        **rule,
                        "matched_pair": [req.medications[i], req.medications[j]],
                    }
                    detected_drug_interactions.append(collision)
                    matrix_pairs.append({
                        "drug_a": req.medications[i],
                        "drug_b": req.medications[j],
                        "severity": rule["severity"],
                        "warning": rule["warning"],
                    })

    # 2. Drug-Food Contraindications
    detected_food_interactions = []
    for food_rule in DRUG_FOOD_INTERACTIONS:
        food_key = food_rule["food_key"].lower()
        # Check if food is in dietary list or if active drugs match
        food_active = (not raw_diet) or any(food_key in d or d in food_key for d in raw_diet)
        if food_active:
            matched_drugs = []
            for target_drug in food_rule["drugs_affected"]:
                for user_drug in req.medications:
                    if target_drug in user_drug.lower():
                        matched_drugs.append(user_drug)
            if matched_drugs:
                detected_food_interactions.append({
                    **food_rule,
                    "matched_drugs": list(set(matched_drugs)),
                })

    # 3. Calculate Composite Risk Score (0 - 100%)
    critical_count = sum(1 for d in detected_drug_interactions if d["severity"] == "critical") + sum(1 for f in detected_food_interactions if f["severity"] == "critical")
    high_count = sum(1 for d in detected_drug_interactions if d["severity"] == "high") + sum(1 for f in detected_food_interactions if f["severity"] == "high")
    mod_count = sum(1 for d in detected_drug_interactions if d["severity"] == "moderate") + sum(1 for f in detected_food_interactions if f["severity"] == "moderate")

    composite_score = min(100, (critical_count * 45) + (high_count * 25) + (mod_count * 10))
    safety_tier = "SAFE" if composite_score == 0 else ("MODERATE_RISK" if composite_score < 40 else "CRITICAL_HAZARD")

    return {
        "status": "success",
        "total_medications_evaluated": len(req.medications),
        "total_dietary_factors_evaluated": len(req.dietary_items),
        "safety_tier": safety_tier,
        "composite_risk_score": composite_score,
        "counts": {
            "critical": critical_count,
            "high": high_count,
            "moderate": mod_count,
            "total_warnings": len(detected_drug_interactions) + len(detected_food_interactions),
        },
        "drug_interactions": detected_drug_interactions,
        "food_interactions": detected_food_interactions,
        "matrix_pairs": matrix_pairs,
        "summary": "No pharmacological contraindications detected for this regimen." if composite_score == 0 else f"Flagged {len(detected_drug_interactions)} drug-drug collision(s) and {len(detected_food_interactions)} food contraindication(s).",
    }
