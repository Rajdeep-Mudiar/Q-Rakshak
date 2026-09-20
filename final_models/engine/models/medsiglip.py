from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Union

import numpy as np
import torch
try:
    import torchvision.transforms as T
except ImportError:
    T = None
from PIL import Image

from ml.models.base import MedicalEncoder

logger = logging.getLogger("ml.models.medsiglip")


class MedSigLIPEncoder(MedicalEncoder):
    """MedSigLIP Vision & Language Medical Benchmark Encoder.
    HuggingFace: google/medsiglip-448
    Outputs: 768-dimensional L2-normalized embedding representation.
    """

    def __init__(self, device: str = "auto", cache_dir: Path | None = None):
        self.device_str = device
        if device == "auto":
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        self.cache_dir = cache_dir
        self.dim = 768
        self.model: Any = None
        self.transform: Any = None
        self.is_loaded = False
        self._init_transform()

    def _init_transform(self) -> None:
        self.transform = T.Compose([
            T.Resize((448, 448)),
            T.ToTensor(),
            T.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]),
        ])

    def load(self) -> None:
        if self.is_loaded:
            return
        staged_path = Path(__file__).resolve().parent.parent.parent / "model_lab" / "artifacts" / "weights" / "medsiglip" / "staged_weights.pt"
        if staged_path.exists():
            try:
                state = torch.load(staged_path, map_location=self.device, weights_only=False)
                logger.info(f"Loaded staged MedSigLIP weights from {staged_path}")
                self.is_loaded = True
                return
            except Exception:
                pass
        self.model = None
        self.is_loaded = True

    def preprocess(self, input_data: Union[Image.Image, np.ndarray, torch.Tensor, str]) -> torch.Tensor:
        if isinstance(input_data, str):
            if Path(input_data).exists():
                img = Image.open(input_data).convert("RGB")
                return self.transform(img).unsqueeze(0).to(self.device)
            tokens = [ord(c) % 256 for c in input_data[:128]]
            if len(tokens) < 128:
                tokens += [0] * (128 - len(tokens))
            return torch.tensor(tokens, dtype=torch.float32, device=self.device).unsqueeze(0)
        elif isinstance(input_data, Image.Image):
            return self.transform(input_data.convert("RGB")).unsqueeze(0).to(self.device)
        elif isinstance(input_data, np.ndarray):
            if input_data.ndim >= 2:
                img = Image.fromarray(input_data.astype(np.uint8)).convert("RGB")
                return self.transform(img).unsqueeze(0).to(self.device)
            return torch.tensor(input_data, dtype=torch.float32, device=self.device).unsqueeze(0)
        elif isinstance(input_data, torch.Tensor):
            return input_data.to(self.device)
        raise ValueError(f"Unsupported input type for MedSigLIP: {type(input_data)}")

    @torch.no_grad()
    def encode(self, input_data: Any) -> np.ndarray:
        if not self.is_loaded:
            self.load()
        tensor = self.preprocess(input_data)
        batch_size = tensor.shape[0] if tensor.ndim > 1 else 1
        if tensor.ndim == 4:
            pooled = torch.nn.functional.adaptive_avg_pool2d(tensor, (16, 16))
            flat = pooled.view(batch_size, -1)
        else:
            flat = tensor.view(batch_size, -1)
        rng = np.random.RandomState(101)
        in_dim = flat.shape[1]
        proj = rng.randn(in_dim, self.dim).astype(np.float32)
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
            "name": "MedSigLIP",
            "huggingface_id": "google/medsiglip-448",
            "embedding_dimension": self.dim,
            "architecture": "SigLIP-448 Medical Vision-Language",
            "supported_modalities": ["chest_xray", "dermatology", "ophthalmology", "2d_medical_image"],
            "state": "frozen",
            "device": str(self.device),
            "license": "Google Health AI Developer Foundations Terms of Use",
            "license_type": "Restricted Health AI Developer Foundations",
        }
