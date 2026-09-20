from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Union
import numpy as np
import torch
from PIL import Image


class MedicalEncoder(ABC):
    """Abstract interface for all pretrained and foundation medical representation models."""

    @abstractmethod
    def load(self) -> None:
        """Loads and initializes model weights idempotently onto target device."""
        raise NotImplementedError

    @abstractmethod
    def preprocess(self, input_data: Union[Image.Image, np.ndarray, torch.Tensor, str]) -> Any:
        """Validates and transforms raw clinical input into standard model tensor/token structure."""
        raise NotImplementedError

    @abstractmethod
    def encode(self, input_data: Any) -> np.ndarray:
        """Extracts dense L2-normalized embedding representation without mutating model weights.
        Returns shape: (batch_size, embedding_dimension) or (embedding_dimension,).
        """
        raise NotImplementedError

    @abstractmethod
    def embedding_dimension(self) -> int:
        """Returns the fixed embedding dimensionality of the encoder."""
        raise NotImplementedError

    @abstractmethod
    def metadata(self) -> dict[str, Any]:
        """Returns model provenance, version, license details, and supported modalities."""
        raise NotImplementedError
