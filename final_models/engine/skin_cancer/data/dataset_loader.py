from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import torch
from torch.utils.data import DataLoader, Dataset, WeightedRandomSampler

from ml.skin_cancer.data import discover_csv, load_hmnist
from ml.skin_cancer.data.split_dataset import load_manifest
from ml.skin_cancer.preprocessing.transforms import eval_transform, train_transform


@dataclass
class SplitArrays:
    images: np.ndarray
    labels: np.ndarray
    indices: np.ndarray


class HmnistDataset(Dataset):
    def __init__(self, images: np.ndarray, labels: np.ndarray, train: bool, image_size: int):
        self.images = images
        self.labels = labels.astype(np.int64)
        self.transform = train_transform(image_size) if train else eval_transform(image_size)

    def __len__(self) -> int:
        return len(self.labels)

    def __getitem__(self, idx: int):
        image = self.images[idx]
        tensor = self.transform(image)
        label = int(self.labels[idx])
        return tensor, label


def arrays_for_split(split: str, csv_path=None) -> SplitArrays:
    images, labels = load_hmnist(csv_path or discover_csv())
    manifest = load_manifest(csv_path=csv_path)
    mask = manifest["split"].to_numpy() == split
    idx = manifest.loc[mask, "index"].to_numpy()
    return SplitArrays(images=images[idx], labels=labels[idx], indices=idx)


def class_weights(labels: np.ndarray, num_classes: int) -> torch.Tensor:
    counts = np.bincount(labels, minlength=num_classes).astype(np.float64)
    counts = np.maximum(counts, 1.0)
    weights = counts.sum() / (num_classes * counts)
    return torch.tensor(weights, dtype=torch.float32)


def make_loader(
    split: str,
    image_size: int,
    batch_size: int,
    train: bool,
    num_workers: int = 0,
    balanced: bool = False,
    csv_path=None,
) -> DataLoader:
    arrays = arrays_for_split(split, csv_path=csv_path)
    dataset = HmnistDataset(arrays.images, arrays.labels, train=train, image_size=image_size)
    sampler = None
    shuffle = train and not balanced
    if train and balanced:
        weights = class_weights(arrays.labels, int(arrays.labels.max()) + 1)
        sample_w = weights[torch.as_tensor(arrays.labels, dtype=torch.long)]
        sampler = WeightedRandomSampler(sample_w, num_samples=len(sample_w), replacement=True)
        shuffle = False
    return DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        sampler=sampler,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available(),
    )
