from __future__ import annotations

import hashlib
import json
import logging
import time
from pathlib import Path
from typing import Any

import numpy as np

logger = logging.getLogger("ml.preprocessing.cache")


class EmbeddingCache:
    """Persistent and in-memory Embedding Cache with SHA-256 provenance tracking."""

    def __init__(self, cache_dir: Path | str | None = None):
        self.cache_dir = Path(cache_dir) if cache_dir else Path("artifacts/embeddings")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.index_path = self.cache_dir / "embedding_index.json"
        self._index: dict[str, dict[str, Any]] = self._load_index()

    def _load_index(self) -> dict[str, dict[str, Any]]:
        if self.index_path.exists():
            try:
                return json.loads(self.index_path.read_text(encoding="utf-8"))
            except Exception:
                return {}
        return {}

    def _save_index(self) -> None:
        self.index_path.write_text(json.dumps(self._index, indent=2), encoding="utf-8")

    def _generate_key(self, sample_id: str, encoder_name: str, dataset_version: str) -> str:
        raw = f"{sample_id}_{encoder_name}_{dataset_version}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]

    def put(
        self,
        sample_id: str,
        patient_id: str,
        encoder_name: str,
        embedding: np.ndarray,
        encoder_version: str = "1.0.0",
        dataset_version: str = "v1.0",
        preprocessing_version: str = "v1.0",
    ) -> dict[str, Any]:
        """Stores embedding on disk and updates manifest."""
        key = self._generate_key(sample_id, encoder_name, dataset_version)
        emb_file = self.cache_dir / f"{key}.npy"
        np.save(emb_file, embedding)

        hashed_pid = hashlib.sha256(patient_id.encode()).hexdigest()[:12]
        emb_checksum = hashlib.sha256(embedding.tobytes()).hexdigest()

        record = {
            "sample_id": sample_id,
            "hashed_patient_id": hashed_pid,
            "encoder_name": encoder_name,
            "encoder_version": encoder_version,
            "embedding_dimension": int(embedding.shape[-1]),
            "preprocessing_version": preprocessing_version,
            "dataset_version": dataset_version,
            "timestamp": time.time(),
            "embedding_path": str(emb_file),
            "checksum": emb_checksum,
        }
        self._index[key] = record
        self._save_index()
        return record

    def get(self, sample_id: str, encoder_name: str, dataset_version: str = "v1.0") -> np.ndarray | None:
        """Retrieves cached embedding array if available and verified."""
        key = self._generate_key(sample_id, encoder_name, dataset_version)
        if key in self._index:
            entry = self._index[key]
            path = Path(entry["embedding_path"])
            if path.exists():
                arr = np.load(path)
                if hashlib.sha256(arr.tobytes()).hexdigest() == entry["checksum"]:
                    return arr
        return None
