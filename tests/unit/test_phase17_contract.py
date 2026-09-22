from __future__ import annotations

import numpy as np
import pytest
from PIL import Image

from ml.inference.unified_predictor import UnifiedMedicalPredictor


def test_phase_17_contract_schema():
    predictor = UnifiedMedicalPredictor()
    dummy_img = Image.new("RGB", (224, 224), color=(100, 100, 100))

    result = predictor.predict(dummy_img, modality="chest_xray", patient_id="PT-TEST-001")

    # 1. Prediction block
    assert "prediction" in result
    assert "class" in result["prediction"]
    assert "probability" in result["prediction"]
    assert isinstance(result["prediction"]["probability"], (float, int))

    # 2. Alternatives block
    assert "alternatives" in result
    assert isinstance(result["alternatives"], list)

    # 3. Uncertainty block
    assert "uncertainty" in result
    assert "score" in result["uncertainty"]
    assert result["uncertainty"]["status"] in ("LOW", "HIGH")

    # 4. OOD block
    assert "ood" in result
    assert isinstance(result["ood"]["detected"], bool)
    assert isinstance(result["ood"]["score"], float)

    # 5. Model block
    assert "model" in result
    assert result["model"]["encoder"] in ("BiomedCLIP", "MedSigLIP", "MedicalNet", "VISTA3D", "TabularDirect", "DeterministicFeatureFallback")
    assert "encoder_version" in result["model"]
    assert "classifier" in result["model"]

    # 6. Quantum block
    assert "quantum" in result
    assert result["quantum"]["enabled"] is True
    assert result["quantum"]["method"] == "VQC"
    assert result["quantum"]["qubits"] == 8

    # 7. Decision block
    assert "decision" in result
    assert result["decision"]["status"] in ("MODEL_SUPPORTED", "ABSTAIN_HIGH_UNCERTAINTY", "ABSTAIN_OUT_OF_DISTRIBUTION")
    assert isinstance(result["decision"]["human_review_required"], bool)


def test_phase_17_contract_tabular_and_abstention():
    predictor = UnifiedMedicalPredictor()
    tab_sample = [0.5, 1.2, -0.3, 2.1, 0.0, 1.5, -1.0, 0.8]

    res_tab = predictor.predict(tab_sample, modality="tabular", patient_id="PT-TAB-99")
    assert res_tab["prediction"]["class"] is not None
    assert "disclaimer" in res_tab
