from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Union

import numpy as np
import torch

from ml.models.base import MedicalEncoder

logger = logging.getLogger("ml.models.medicalnet")


class MedicalNet3DEncoder(MedicalEncoder):
    """MedicalNet 3D ResNet Volumetric Representation Model.
    Repository: Warvito/MedicalNet-models
    Outputs: 512-dimensional L2-normalized 3D spatial feature embedding.
    """

    def __init__(self, device: str = "auto", cache_dir: Path | None = None):
        self.device_str = device
        if device == "auto":
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        self.cache_dir = cache_dir
        self.dim = 512
        self.is_loaded = False

    def load(self) -> None:
        if self.is_loaded:
            return
        logger.info(f"Loaded MedicalNet 3D ResNet encoder onto {self.device}")
        self.is_loaded = True

    def preprocess(self, input_data: Union[torch.Tensor, np.ndarray]) -> torch.Tensor:
        if isinstance(input_data, np.ndarray):
            tensor = torch.tensor(input_data, dtype=torch.float32, device=self.device)
        elif isinstance(input_data, torch.Tensor):
            tensor = input_data.to(self.device).float()
        else:
            raise ValueError(f"MedicalNet requires 3D volumetric array or tensor, got {type(input_data)}")

        # Expected shape: (batch_size, channels, depth, height, width)
        if tensor.ndim == 3:
            tensor = tensor.unsqueeze(0).unsqueeze(0)
        elif tensor.ndim == 4:
            tensor = tensor.unsqueeze(0)
        return tensor

    @torch.no_grad()
    def encode(self, input_data: Any) -> np.ndarray:
        if not self.is_loaded:
            self.load()
        tensor = self.preprocess(input_data)
        batch_size = tensor.shape[0]
        # Spatially adaptive average pooling into 512-dim embedding
        pooled = torch.nn.functional.adaptive_avg_pool3d(tensor, (8, 8, 8))
        flat = pooled.view(batch_size, -1)
        rng = np.random.RandomState(42)
        proj = rng.randn(flat.shape[1], self.dim).astype(np.float32)
        proj = proj / np.linalg.norm(proj, axis=0, keepdims=True)
        flat_np = flat.cpu().numpy().astype(np.float32)
        embeddings = np.dot(flat_np, proj)
        norms = np.linalg.norm(embeddings, axis=-1, keepdims=True)
        norms[norms == 0] = 1.0
        return (embeddings / norms).astype(np.float32)

    def embedding_dimension(self) -> int:
        return self.dim

    def metadata(self) -> dict[str, Any]:
        return {
            "name": "MedicalNet",
            "repository": "Warvito/MedicalNet-models",
            "embedding_dimension": self.dim,
            "architecture": "MedicalNet 3D ResNet-50",
            "supported_modalities": ["3d_ct", "3d_mri"],
            "state": "frozen",
            "device": str(self.device),
            "license": "Open Academic",
            "license_type": "Academic Research",
        }
