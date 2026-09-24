from __future__ import annotations

import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from backend.app.core.security import get_current_user
from backend.app.db.repository import DatabaseRepository
from ml.digital_twin.digital_twin import DigitalTwinEngine

router = APIRouter(prefix="/api/v1/digital-twin", tags=["2D Digital Twin"])

_TWIN_ENGINE = DigitalTwinEngine()

# Temporal visit history archive fallback (ONLY for explicit simulation / demo)
_VISITS = [
    {
        "visit_id": "V-2026-01-10",
        "date": "2026-01-10",
        "module_risks": {"cardiovascular": 0.18, "oncology_breast": 0.22, "oncology_skin": 0.10, "pulmonary": 0.15, "metabolic": 0.20},
        "notes": "Annual preventive checkup. Blood pressure within normal limits.",
    },
    {
        "visit_id": "V-2026-04-15",
        "date": "2026-04-15",
        "module_risks": {"cardiovascular": 0.42, "oncology_breast": 0.28, "oncology_skin": 0.12, "pulmonary": 0.20, "metabolic": 0.35},
        "notes": "Follow-up visit. Elevated LDL cholesterol and mild lipidemia noted.",
    },
    {
        "visit_id": "V-2026-09-06",
        "date": "2026-09-06",
        "module_risks": {"cardiovascular": 0.68, "oncology_breast": 0.72, "oncology_skin": 0.25, "pulmonary": 0.28, "metabolic": 0.45},
        "notes": "Current clinical encounter. Coronary calcification and dense breast tissue detected.",
    },
]


@router.get("/state/{patient_id}")
async def get_digital_twin_state(
    patient_id: str,
    visit_index: int = -1,
    view: str = "all",
    current_user: dict = Depends(get_current_user),
):
    """Returns 2D Digital Twin physiological parameters, CRS score, organ heatmaps, and timeline scrubber data.
    Populates dynamically from real SQLite diagnostic records if present.
    If no diagnostic records exist for the user, returns a healthy 0-risk anatomical baseline.
    """
    if current_user.get("role") == "doctor":
        raise HTTPException(status_code=403, detail="Digital Twin access is restricted to patients and administrators.")
    records = DatabaseRepository.get_patient_diagnostic_records(patient_id)

    top_biomarkers = {}

    if records:
        # Build dynamic visits from actual database records
        real_visits = []
        for rec in reversed(records[:10]):
            dis = rec.get("disease", "").lower()
            conf = float(rec.get("confidence", 0.5))
            p_class = str(rec.get("prediction_class", "")).lower()
            is_anomaly = not any(w in p_class for w in ["normal", "benign", "healthy", "negative", "clear", "0"])
            risk_score = round(conf if is_anomaly else max(0.02, 1.0 - conf), 2)
            created = str(rec.get("created_at", time.strftime("%Y-%m-%d"))).split(" ")[0]

            # Strictly assign risk ONLY to the examined organ system; others remain clean baseline 0.0
            mod_risks = {
                "cardiovascular": risk_score if ("heart" in dis or "cardio" in dis) else 0.0,
                "oncology_breast": risk_score if ("breast" in dis or "cancer" in dis) else 0.0,
                "oncology_skin": risk_score if ("skin" in dis or "derma" in dis) else 0.0,
                "pulmonary": risk_score if ("pneu" in dis or "lung" in dis) else 0.0,
                "metabolic": risk_score if ("diabet" in dis) else 0.0,
            }
            real_visits.append({
                "visit_id": rec["id"],
                "date": created,
                "module_risks": mod_risks,
                "notes": f"Diagnostic run: {rec.get('disease')} ({rec.get('prediction_class')})",
            })
            # Extract top biomarkers from explainability if available
            expl = rec.get("explainability", {})
            if isinstance(expl, dict) and "top_features" in expl:
                feats = expl.get("top_features", [])
                if feats and isinstance(feats, list):
                    top_f = feats[0]
                    fname = top_f.get("feature", "Marker") if isinstance(top_f, dict) else str(top_f)
                    if "breast" in dis:
                        top_biomarkers["oncology_breast"] = fname
                    elif "cardio" in dis or "heart" in dis:
                        top_biomarkers["cardiovascular"] = fname
                    elif "pneu" in dis or "lung" in dis:
                        top_biomarkers["pulmonary"] = fname
                    elif "skin" in dis or "derma" in dis:
                        top_biomarkers["oncology_skin"] = fname
                    elif "diabet" in dis:
                        top_biomarkers["metabolic"] = fname

        if real_visits:
            v = real_visits[visit_index if 0 <= visit_index < len(real_visits) else -1]
            state = _TWIN_ENGINE.synthesize_twin_state(
                patient_id=patient_id,
                module_risks=v["module_risks"],
                top_biomarkers=top_biomarkers,
                active_view=view,
            )
            state["has_records"] = True
            state["selected_visit"] = v
            state["timeline_visits"] = [
                {"visit_id": item["visit_id"], "date": item["date"], "crs": _TWIN_ENGINE.compute_composite_risk_score(item["module_risks"])}
                for item in real_visits
            ]
            return state

    # If demo preview is explicitly requested
    if patient_id.upper() in ("DEMO-SIMULATION", "DEMO", "PREVIEW"):
        visits = list(_VISITS)
        v = visits[visit_index if 0 <= visit_index < len(visits) else -1]
        state = _TWIN_ENGINE.synthesize_twin_state(
            patient_id=patient_id,
            module_risks=v["module_risks"],
            top_biomarkers={
                "cardiovascular": "Thalach 138 bpm / Oldpeak 2.1",
                "oncology_breast": "Mean Radius 17.9 / Concavity 0.28",
                "oncology_skin": "Melanocytic Lesion Asymmetry",
                "pulmonary": "Normal Bilateral Parenchyma",
                "metabolic": "Fasting Glucose 112 mg/dL",
            },
            active_view=view,
        )
        state["has_records"] = True
        state["selected_visit"] = v
        state["timeline_visits"] = [
            {"visit_id": item["visit_id"], "date": item["date"], "crs": _TWIN_ENGINE.compute_composite_risk_score(item["module_risks"])}
            for item in visits
        ]
        return state

    # Clean physiological baseline: user has not conducted checkups yet
    zero_risks = {
        "cardiovascular": 0.0,
        "oncology_breast": 0.0,
        "oncology_skin": 0.0,
        "pulmonary": 0.0,
        "metabolic": 0.0,
    }
    baseline_visit = {
        "visit_id": "V-BASELINE",
        "date": time.strftime("%Y-%m-%d"),
        "module_risks": zero_risks,
        "notes": "Baseline anatomical scan. No diagnostic checkups conducted yet.",
    }
    state = _TWIN_ENGINE.synthesize_twin_state(
        patient_id=patient_id,
        module_risks=zero_risks,
        top_biomarkers={},
        active_view=view,
    )
    state["composite_risk_score"] = 0.0
    state["crs_level"] = "Healthy Baseline / Optimal"
    for org in state.get("organs", []):
        org["risk_score"] = 0.0
        org["status"] = "normal"
        org["color"] = "#1FAE6B"
        org["pulse"] = False
        org["top_biomarker"] = "Baseline healthy (no diagnostic anomalies)"

    state["has_records"] = False
    state["selected_visit"] = baseline_visit
    state["timeline_visits"] = []
    return state

