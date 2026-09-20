from __future__ import annotations

import logging
from typing import Any, Union

import numpy as np
import torch
from PIL import Image

from ml.models.base import MedicalEncoder
from ml.models.registry import ModelFactory

logger = logging.getLogger("ml.models.router")


class ModalityRouter:
    """Modality Routing Engine for Clinical Decision Support.
    Validates clinical data types against 11 supported modalities and routes to the appropriate encoder.
    Prevents invalid volumetric degradation or silent mismatch errors.
    """

    SUPPORTED_MODALITIES = {
        "tabular",
        "2d_medical_image",
        "3d_ct",
        "3d_mri",
        "histopathology",
        "dermatology",
        "ophthalmology",
        "chest_xray",
        "text",
        "multimodal",
        "longitudinal",
    }

    _MODALITY_MAP = {
        "chest_xray": "biomedclip",
        "dermatology": "biomedclip",
        "histopathology": "biomedclip",
        "ophthalmology": "biomedclip",
        "2d_medical_image": "biomedclip",
        "3d_ct": "medicalnet",
        "3d_mri": "medicalnet",
        "text": "biomedclip",
        "multimodal": "medgemma",
        "longitudinal": "tabular",
        "tabular": "tabular",
    }

    def __init__(self, device: str = "auto"):
        self.device = device

    def validate_modality(self, modality: str) -> str:
        """Validates that modality string is supported; raises ValueError otherwise."""
        mod_key = modality.lower().strip().replace(" ", "_").replace("-", "_")
        if mod_key not in self.SUPPORTED_MODALITIES:
            raise ValueError(
                f"Unsupported clinical modality '{modality}'. "
                f"Supported modalities: {sorted(list(self.SUPPORTED_MODALITIES))}"
            )
        return mod_key

    def route(
        self,
        input_data: Any,
        modality: str,
        preferred_encoder: str | None = None,
    ) -> tuple[np.ndarray, dict[str, Any]]:
        """Routes the input data to the correct foundation encoder or tabular representation layer.
        Returns:
            (embedding_vector, metadata_dict)
        """
        mod_key = self.validate_modality(modality)

        # Tabular data handling: bypass foundation image encoders
        if mod_key in ("tabular", "longitudinal"):
            if isinstance(input_data, (list, tuple)):
                arr = np.array(input_data, dtype=np.float32)
            elif isinstance(input_data, np.ndarray):
                arr = input_data.astype(np.float32)
            elif isinstance(input_data, torch.Tensor):
                arr = input_data.cpu().numpy().astype(np.float32)
            elif isinstance(input_data, dict):
                arr = np.array(list(input_data.values()), dtype=np.float32)
            else:
                raise ValueError(f"Invalid tabular data format: {type(input_data)}")
            
            if arr.ndim == 1:
                arr = arr.reshape(1, -1)
            
            return arr, {
                "modality": mod_key,
                "encoder": "TabularDirect",
                "embedding_dimension": arr.shape[1],
                "bypassed_image_encoder": True,
            }

        # 3D Medical Volumes
        if mod_key in ("3d_ct", "3d_mri"):
            encoder_name = preferred_encoder or self._MODALITY_MAP[mod_key]
            if encoder_name not in ("medicalnet", "vista3d"):
                raise ValueError(f"Cannot route 3D modality '{mod_key}' through 2D encoder '{encoder_name}'")
            encoder = ModelFactory.create(encoder_name, device=self.device)
            embeddings = encoder.encode(input_data)
            return embeddings, {
                "modality": mod_key,
                "encoder": encoder.metadata()["name"],
                "embedding_dimension": encoder.embedding_dimension(),
                "bypassed_image_encoder": False,
            }

        # 2D Medical Images & Text
        encoder_name = preferred_encoder or self._MODALITY_MAP[mod_key]
        encoder = ModelFactory.create(encoder_name, device=self.device)
        embeddings = encoder.encode(input_data)
        return embeddings, {
            "modality": mod_key,
            "encoder": encoder.metadata()["name"],
            "embedding_dimension": encoder.embedding_dimension(),
            "bypassed_image_encoder": False,
        }
