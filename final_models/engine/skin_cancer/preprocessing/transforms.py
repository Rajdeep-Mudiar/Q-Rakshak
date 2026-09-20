from __future__ import annotations

import numpy as np
import torch
from PIL import Image

IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)


class PurePILToTensorNormalize:
    """Zero-dependency evaluation transformer using PIL, NumPy and Torch."""
    def __init__(self, image_size: int):
        self.image_size = image_size
        self.mean = np.array(IMAGENET_MEAN, dtype=np.float32).reshape(3, 1, 1)
        self.std = np.array(IMAGENET_STD, dtype=np.float32).reshape(3, 1, 1)

    def __call__(self, img: Image.Image | np.ndarray) -> torch.Tensor:
        if isinstance(img, np.ndarray):
            if img.dtype != np.uint8:
                img = np.clip(img, 0, 255).astype(np.uint8)
            img = Image.fromarray(img, mode="RGB")
        
        resized = img.convert("RGB").resize((self.image_size, self.image_size), Image.Resampling.BILINEAR)
        arr = np.array(resized, dtype=np.float32).transpose(2, 0, 1) / 255.0
        normalized = (arr - self.mean) / self.std
        return torch.from_numpy(normalized).float()


try:
    from torchvision import transforms

    class NumpyToPIL:
        def __call__(self, image: np.ndarray) -> Image.Image:
            if image.dtype != np.uint8:
                image = np.clip(image, 0, 255).astype(np.uint8)
            return Image.fromarray(image, mode="RGB")

    def train_transform(image_size: int) -> transforms.Compose:
        return transforms.Compose(
            [
                NumpyToPIL(),
                transforms.Resize((image_size + 32, image_size + 32)),
                transforms.RandomResizedCrop(image_size, scale=(0.85, 1.0), ratio=(0.95, 1.05)),
                transforms.RandomHorizontalFlip(),
                transforms.RandomVerticalFlip(),
                transforms.RandomRotation(10),
                transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.10),
                transforms.ToTensor(),
                transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
            ]
        )

    def eval_transform(image_size: int) -> transforms.Compose:
        return transforms.Compose(
            [
                NumpyToPIL(),
                transforms.Resize((image_size + 32, image_size + 32)),
                transforms.CenterCrop(image_size),
                transforms.ToTensor(),
                transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
            ]
        )

    def pil_eval_transform(image_size: int):
        return transforms.Compose(
            [
                transforms.Resize((image_size, image_size)),
                transforms.ToTensor(),
                transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
            ]
        )

except ImportError:
    def train_transform(image_size: int):
        return PurePILToTensorNormalize(image_size)

    def eval_transform(image_size: int):
        return PurePILToTensorNormalize(image_size)

    def pil_eval_transform(image_size: int):
        return PurePILToTensorNormalize(image_size)

