from __future__ import annotations

import numpy as np
import pytest
import torch
from PIL import Image

from ml.models.base import MedicalEncoder
from ml.models.biomedclip import BiomedCLIPEncoder
from ml.models.classical import ClassicalBaselineSuite
from ml.models.medgemma import MedGemmaEncoder
from ml.models.medicalnet import MedicalNet3DEncoder
from ml.models.medsiglip import MedSigLIPEncoder
from ml.models.registry import ModelFactory
from ml.models.vista3d import VISTA3DEncoder


def test_model_factory_registration():
    available = ModelFactory.list_available_models()
    assert "biomedclip" in available
    assert "medsiglip" in available
    assert "medgemma" in available
    assert "medicalnet" in available
    assert "vista3d" in available


def test_biomedclip_image_and_text_encoding():
    encoder = ModelFactory.create("biomedclip")
    assert isinstance(encoder, MedicalEncoder)
    assert encoder.embedding_dimension() == 512

    # Test 2D PIL image
    img = Image.new("RGB", (224, 224), color=(128, 128, 128))
    emb_img = encoder.encode(img)
    assert emb_img.shape == (1, 512)
    assert np.isclose(np.linalg.norm(emb_img[0]), 1.0, atol=1e-3)

    # Test text prompt
    emb_text = encoder.encode("Chest X-Ray with bilateral infiltration")
    assert emb_text.shape == (1, 512)

    # Metadata check
    meta = encoder.metadata()
    assert meta["name"] in ("BiomedCLIP", "DeterministicFeatureFallback")
    assert "chest_xray" in meta["supported_modalities"]


def test_medsiglip_and_medgemma_encoders():
    siglip = ModelFactory.create("medsiglip")
    assert siglip.embedding_dimension() == 768
    img = Image.new("RGB", (448, 448), color=(100, 150, 200))
    emb_sig = siglip.encode(img)
    assert emb_sig.shape == (1, 768)

    gemma = ModelFactory.create("medgemma")
    assert gemma.embedding_dimension() == 2048
    emb_gem = gemma.encode("Clinical reasoning notes for oncology")
    assert emb_gem.shape == (1, 2048)


def test_3d_volumetric_encoders():
    mednet = ModelFactory.create("medicalnet")
    assert mednet.embedding_dimension() == 512
    dummy_vol = np.random.randn(1, 16, 32, 32).astype(np.float32)
    emb_3d = mednet.encode(dummy_vol)
    assert emb_3d.shape == (1, 512)
    assert np.isclose(np.linalg.norm(emb_3d[0]), 1.0, atol=1e-3)

    vista = ModelFactory.create("vista3d")
    assert vista.embedding_dimension() == 512
    emb_vista = vista.encode(dummy_vol)
    assert emb_vista.shape == (1, 512)


def test_classical_baseline_suite():
    suite = ModelFactory.create_classical_suite(random_state=42)
    X = np.random.randn(40, 8)
    y = np.random.randint(0, 2, size=40)
    times = suite.fit_all(X, y)
    assert "Logistic Regression" in times
    assert "Random Forest" in times
    assert "SVM (RBF)" in times
    preds = suite.predict_all(X[:5])
    assert len(preds["Logistic Regression"]) == 5
