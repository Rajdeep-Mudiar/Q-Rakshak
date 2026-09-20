from __future__ import annotations

import json
import logging
import time
import uuid
from pathlib import Path
from typing import Any

logger = logging.getLogger("ml.experiments.registry")


class ExperimentRegistry:
    """Reproducible Experiment Registry recording full provenance, hyperparameters, and metrics."""

    def __init__(self, registry_file: Path | str = "reports/experiment_registry.json"):
        self.registry_file = Path(registry_file)
        self.registry_file.parent.mkdir(parents=True, exist_ok=True)
        self._entries: list[dict[str, Any]] = self._load()

    def _load(self) -> list[dict[str, Any]]:
        if self.registry_file.exists():
            try:
                return json.loads(self.registry_file.read_text(encoding="utf-8"))
            except Exception:
                return []
        return []

    def _save(self) -> None:
        self.registry_file.write_text(json.dumps(self._entries, indent=2), encoding="utf-8")

    def log_experiment(
        self,
        dataset: str,
        dataset_version: str,
        split_version: str,
        encoder: str,
        encoder_version: str,
        embedding_dimension: int,
        reduction_method: str,
        reduced_dimension: int,
        feature_selection: str,
        classifier: str,
        qml_method: str | None,
        qubits: int | None,
        depth: int | None,
        shots: int | None,
        backend: str,
        seed: int,
        metrics: dict[str, float],
        runtime_sec: float,
        artifact_paths: list[str] | None = None,
        git_commit: str = "35c2679",
    ) -> dict[str, Any]:
        """Appends an experiment run record to the persistent registry."""
        record = {
            "experiment_id": f"EXP-{uuid.uuid4().hex[:8].upper()}",
            "timestamp": time.time(),
            "date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "dataset": dataset,
            "dataset_version": dataset_version,
            "split_version": split_version,
            "encoder": encoder,
            "encoder_version": encoder_version,
            "embedding_dimension": embedding_dimension,
            "reduction_method": reduction_method,
            "reduced_dimension": reduced_dimension,
            "feature_selection": feature_selection,
            "classifier": classifier,
            "qml_method": qml_method,
            "qubits": qubits,
            "depth": depth,
            "shots": shots,
            "backend": backend,
            "seed": seed,
            "metrics": metrics,
            "runtime_sec": round(runtime_sec, 3),
            "artifact_paths": artifact_paths or [],
            "git_commit": git_commit,
        }
        self._entries.append(record)
        self._save()
        logger.info(f"Registered experiment {record['experiment_id']} ({classifier}) with AUROC={metrics.get('auc_roc', 'N/A')}")
        return record

    def list_experiments(self) -> list[dict[str, Any]]:
        return self._entries
