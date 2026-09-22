from __future__ import annotations

import numpy as np
import pytest
from PIL import Image

from ml.models.router import ModalityRouter


def test_modality_router_supported_modalities():
    router = ModalityRouter()
    assert len(router.SUPPORTED_MODALITIES) == 11

    # 1. 2D Image Routing
    img = Image.new("RGB", (224, 224), color=(50, 50, 50))
    emb, meta = router.route(img, modality="chest_xray")
    assert meta["encoder"] in ("BiomedCLIP", "DeterministicFeatureFallback")
    assert emb.shape[-1] == 512

    # 2. Tabular Routing (bypasses image encoders)
    tab_data = [1.2, 3.4, 5.6, 7.8]
    emb_tab, meta_tab = router.route(tab_data, modality="tabular")
    assert meta_tab["bypassed_image_encoder"] is True
    assert emb_tab.shape == (1, 4)

    # 3. 3D Volumetric Routing
    vol = np.random.randn(1, 16, 32, 32).astype(np.float32)
    emb_3d, meta_3d = router.route(vol, modality="3d_ct")
    assert meta_3d["encoder"] in ("MedicalNet", "VISTA3D")
    assert emb_3d.shape[-1] == 512


def test_modality_router_rejects_unsupported():
    router = ModalityRouter()
    with pytest.raises(ValueError, match="Unsupported clinical modality"):
        router.route(np.zeros((10, 10)), modality="unsupported_quantum_scan")


def test_modality_router_prevents_3d_through_2d():
    router = ModalityRouter()
    vol = np.random.randn(1, 16, 32, 32).astype(np.float32)
    with pytest.raises(ValueError, match="Cannot route 3D modality"):
        router.route(vol, modality="3d_mri", preferred_encoder="biomedclip")
