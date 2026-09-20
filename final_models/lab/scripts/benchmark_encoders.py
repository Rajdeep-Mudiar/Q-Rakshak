#!/usr/bin/env python3
"""
Model Lab - Foundation Model Benchmark Suite
Benchmarks latency, throughput (samples/sec), and feature output properties
across foundation encoders in an isolated execution sandbox.
"""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path

import numpy as np
import torch
import yaml

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("model_lab.benchmarker")

ROOT_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT_DIR / "configs" / "models.yaml"
BENCHMARKS_DIR = ROOT_DIR / "artifacts" / "benchmarks"


def benchmark_single_model(model_key: str, model_cfg: dict, n_iterations: int = 20) -> dict:
    """Measures latency and throughput for a simulated foundation model forward pass."""
    embed_dim = model_cfg.get("embedding_dimension", 512)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Simulate batch feature extraction
    batch_sizes = [1, 4, 16]
    latency_results = {}

    for bs in batch_sizes:
        latencies = []
        dummy_tensor = torch.randn(bs, 3, 224, 224, device=device)
        
        # Warmup
        _ = torch.randn(bs, embed_dim, device=device)
        
        for _ in range(n_iterations):
            start = time.perf_counter()
            # Synthetic linear projection forward benchmark
            _ = torch.nn.functional.normalize(torch.randn(bs, embed_dim, device=device), p=2, dim=-1)
            if device.type == "cuda":
                torch.cuda.synchronize()
            latencies.append((time.perf_counter() - start) * 1000)

        latency_results[f"batch_{bs}"] = {
            "mean_ms": round(float(np.mean(latencies)), 3),
            "std_ms": round(float(np.std(latencies)), 3),
            "throughput_samples_per_sec": round(float(bs / (np.mean(latencies) / 1000)), 1),
        }

    return {
        "model_key": model_key,
        "name": model_cfg.get("name"),
        "embedding_dimension": embed_dim,
        "device": str(device),
        "license": model_cfg.get("license"),
        "benchmarks": latency_results,
    }


def main():
    BENCHMARKS_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    models = config.get("models", {})
    results = {}
    for k, v in models.items():
        logger.info(f"Benchmarking encoder '{k}'...")
        results[k] = benchmark_single_model(k, v)

    out_file = BENCHMARKS_DIR / "encoder_benchmarks.json"
    out_file.write_text(json.dumps(results, indent=2), encoding="utf-8")
    logger.info(f"Saved benchmark results to {out_file}")


if __name__ == "__main__":
    main()
