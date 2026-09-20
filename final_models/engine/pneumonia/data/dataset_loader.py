from __future__ import annotations

from pathlib import Path
import torch
from torch.utils.data import DataLoader
from torchvision import datasets

from ml.pneumonia.paths import DATASET_ROOT

CLASS_NAMES = ("NORMAL", "PNEUMONIA")
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def _has_classes(path: Path) -> bool:
    names = {item.name.upper() for item in path.iterdir() if item.is_dir()}
    return set(CLASS_NAMES).issubset(names)


def _is_metadata(path: Path) -> bool:
    return (
        "__MACOSX" in path.parts
        or path.name.startswith("._")
        or path.name.lower() in {".ds_store", "thumbs.db"}
    )


def discover_dataset_root(root: Path | None = None) -> Path:
    root = (root or DATASET_ROOT).resolve()
    candidates = [root, *[p for p in root.rglob("*") if p.is_dir() and not _is_metadata(p)]]
    # Prefer the directory that owns the standard train/val/test folders.
    for candidate in candidates:
        split_names = {item.name.lower() for item in candidate.iterdir() if item.is_dir()}
        if {"train", "test"}.issubset(split_names):
            return candidate
    for candidate in candidates:
        if _has_classes(candidate) and candidate.name.lower() not in {"train", "val", "test"}:
            return candidate
    raise FileNotFoundError(
        f"Could not find a directory containing NORMAL and PNEUMONIA under {root}"
    )


def discover_split_dirs(root: Path | None = None) -> dict[str, Path]:
    dataset_root = discover_dataset_root(root)
    result = {}
    for split in ("train", "val", "test"):
        matches = [p for p in dataset_root.rglob(split) if p.is_dir() and _has_classes(p)]
        if matches:
            result[split] = matches[0]
    if not {"train", "test"}.issubset(result):
        raise FileNotFoundError(f"Train and test split folders are required under {dataset_root}")
    return result


def build_dataset(root: Path, transform=None) -> datasets.ImageFolder:
    dataset = datasets.ImageFolder(
        root, transform=transform,
        is_valid_file=lambda path: not _is_metadata(Path(path)),
    )
    actual = {name.upper() for name in dataset.classes}
    if actual != set(CLASS_NAMES):
        raise ValueError(f"Expected classes {CLASS_NAMES}, found {dataset.classes}")
    return dataset


def make_loader(root: Path, transform, batch_size: int, train: bool, num_workers: int = 0):
    return DataLoader(
        build_dataset(root, transform),
        batch_size=batch_size,
        shuffle=train,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available(),
    )