from __future__ import annotations

import time
from typing import Any


class DigitalTwinEngine:
    """Implements 2D Digital Twin physiological state synthesizer and Composite Risk Score (CRS)
    per SRS Section 4.8 & 7.
    """

    # Organ system mappings and default baseline prior weights
    ORGAN_WEIGHTS = {
        "cardiovascular": {"weight": 0.35, "organ": "Heart", "region_id": "heart_region"},
        "oncology_breast": {"weight": 0.25, "organ": "Breast / Lymph", "region_id": "breast_region"},
        "oncology_skin": {"weight": 0.15, "organ": "Dermis / Epidermis", "region_id": "skin_region"},
        "pulmonary": {"weight": 0.15, "organ": "Lungs / Airway", "region_id": "lungs_region"},
        "metabolic": {"weight": 0.10, "organ": "Pancreas / Metabolic", "region_id": "pancreas_region"},
    }

    def __init__(self):
        pass

    def compute_composite_risk_score(self, module_risks: dict[str, float]) -> float:
        """Computes Composite Risk Score (CRS) = sum_d w_d * y_hat_d (SRS Section 4.8).
        Scaled to 0 - 100.
        """
        crs = 0.0
        total_w = 0.0
        for mod, risk in module_risks.items():
            w = self.ORGAN_WEIGHTS.get(mod, {}).get("weight", 0.2)
            crs += w * float(risk)
            total_w += w

        normalized_crs = (crs / max(total_w, 1e-4)) * 100.0
        return round(float(normalized_crs), 1)

    def synthesize_twin_state(
        self,
        patient_id: str,
        module_risks: dict[str, float],
        top_biomarkers: dict[str, str] | None = None,
        active_view: str = "all",  # all | cardio | onco | neuro | pulmonary
    ) -> dict[str, Any]:
        """Synthesizes the 2D Digital Twin SVG state parameters with color-coded risk levels,
        pulsing hotspot markers, and organ telemetry.
        """
        crs = self.compute_composite_risk_score(module_risks)

        # Organ states with WCAG-compliant risk colors (#1FAE6B low, #F5A623 mid, #E14B4B high)
        organs = []
        for mod_id, meta in self.ORGAN_WEIGHTS.items():
            risk_val = float(module_risks.get(mod_id, 0.12))
            if risk_val < 0.30:
                status = "low"
                color = "#1FAE6B"
            elif risk_val < 0.65:
                status = "moderate"
                color = "#F5A623"
            else:
                status = "high"
                color = "#E14B4B"

            pulse = status in ("moderate", "high")
            biomarker = (top_biomarkers or {}).get(mod_id, "Normal vital range")

            organs.append({
                "id": meta["region_id"],
                "name": meta["organ"],
                "module": mod_id,
                "risk_score": round(risk_val * 100, 1),
                "status": status,
                "color": color,
                "pulse": pulse,
                "top_biomarker": biomarker,
            })

        return {
            "patient_id": patient_id,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "composite_risk_score": crs,
            "crs_level": "High Risk" if crs > 65 else ("Moderate Risk" if crs > 30 else "Optimal / Low Risk"),
            "active_view": active_view,
            "organs": organs,
        }
