from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from ml.models.base import MedicalEncoder
from ml.models.biomedclip import BiomedCLIPEncoder
from ml.models.classical import ClassicalBaselineSuite
from ml.models.medgemma import MedGemmaEncoder
from ml.models.medicalnet import MedicalNet3DEncoder
from ml.models.medsiglip import MedSigLIPEncoder
from ml.models.vista3d import VISTA3DEncoder

logger = logging.getLogger("ml.models.registry")


class ModelFactory:
    """Unified Factory and Registry for all Medical Foundation Encoders and Classical Baselines."""

    _REGISTRY: dict[str, type[MedicalEncoder]] = {
        "biomedclip": BiomedCLIPEncoder,
        "medsiglip": MedSigLIPEncoder,
        "medgemma": MedGemmaEncoder,
        "medicalnet": MedicalNet3DEncoder,
        "vista3d": VISTA3DEncoder,
    }

    _INSTANCES: dict[str, MedicalEncoder] = {}

    @classmethod
    def create(cls, name: str = "biomedclip", device: str = "auto", cache_dir: Path | None = None) -> MedicalEncoder:
        """Instantiates or retrieves cached instance of the requested foundation encoder."""
        key = name.lower().replace("-", "_").replace(" ", "_")
        if key not in cls._REGISTRY:
            available = list(cls._REGISTRY.keys())
            raise ValueError(f"Unknown foundation encoder '{name}'. Supported models: {available}")

        instance_key = f"{key}_{device}"
        if instance_key not in cls._INSTANCES:
            encoder_cls = cls._REGISTRY[key]
            instance = encoder_cls(device=device, cache_dir=cache_dir)
            instance.load()
            cls._INSTANCES[instance_key] = instance
            logger.info(f"Initialized foundation encoder '{name}' on {instance.device_str}")
        return cls._INSTANCES[instance_key]

    @classmethod
    def create_classical_suite(cls, random_state: int = 42) -> ClassicalBaselineSuite:
        """Instantiates a fresh ClassicalBaselineSuite."""
        return ClassicalBaselineSuite(random_state=random_state)

    @classmethod
    def list_available_models(cls) -> list[str]:
        """Returns list of registered foundation encoder identifiers."""
        return list(cls._REGISTRY.keys())

    @classmethod
    def get_metadata(cls, name: str) -> dict[str, Any]:
        """Retrieves model metadata without instantiating heavy weights."""
        encoder = cls.create(name)
        return encoder.metadata()
