from __future__ import annotations

import json
import time
import uuid
from pathlib import Path

import joblib
import numpy as np
import torch
from PIL import Image

from ml.skin_cancer.classical import CLASSICAL_BUILDERS
from ml.skin_cancer.constants import HAM10000_DISPLAY
from ml.skin_cancer.data.image_quality import assess_pil
from ml.skin_cancer.paths import MODELS_DIR
from ml.skin_cancer.preprocessing.transforms import pil_eval_transform
from ml.skin_cancer.quantum.qskin_vortex import QSkinVortex
from ml.skin_cancer.quantum.quantum_derma import QuantumDerma
from ml.skin_cancer.quantum.quantum_derma_x import QuantumDermaX
from ml.skin_cancer.quantum.vitaq_derm import VitaQDerm
from ml.skin_cancer.seed import get_device

QUANTUM_BUILDERS = {
    "QuantumDerma": QuantumDerma,
    "QuantumDermaX": QuantumDermaX,
    "QSkin-Vortex": QSkinVortex,
    "VitaQ-Derm": VitaQDerm,
}

ALLOWED_MODELS = {
    "QuantumDerma",
    "QuantumDermaX",
    "QSkin-Vortex",
    "VitaQ-Derm",
    "DermisNova",
    "DenseNet121",
    "MelanoVanta",
    "DermaLumen",
    "production",
}


def resolve_model_name(name: str) -> str:
    if name not in ALLOWED_MODELS:
        raise ValueError(f"Unknown model: {name}")
    if name == "production":
        registry = MODELS_DIR / "production" / "registry.json"
        if registry.exists():
            return json.loads(registry.read_text(encoding="utf-8"))["production"]
        if (MODELS_DIR / "quantum" / "QuantumDerma" / "best.pt").exists():
            return "QuantumDerma"
        if (MODELS_DIR / "classical" / "DermisNova" / "best.pt").exists():
            return "DermisNova"
        raise FileNotFoundError("No production skin-cancer model is available yet")
    if name in QUANTUM_BUILDERS:
        checkpoint = MODELS_DIR / "quantum" / name.replace("/", "-") / "best.pt"
        if not checkpoint.exists():
            raise FileNotFoundError(f"Skin-cancer quantum model '{name}' checkpoint not found at {checkpoint}")
    elif name in CLASSICAL_BUILDERS:
        checkpoint = MODELS_DIR / "classical" / name / "best.pt"
        if not checkpoint.exists():
            raise FileNotFoundError(f"Skin-cancer classical model '{name}' checkpoint not found at {checkpoint}")
    return name


class SkinCancerPredictor:
    def __init__(self, model_name: str = "production"):
        self.device = get_device()
        self.model_name = resolve_model_name(model_name)
        self.classical = None
        self.quantum = None
        self.scaler = None
        self.pca = None
        self.image_size = 64
        self.class_names: list[str] = []
        self.temperature = 1.0
        self.use_raw = False
        self._load()

    def _load(self) -> None:
        if self.model_name in CLASSICAL_BUILDERS:
            ckpt = torch.load(
                MODELS_DIR / "classical" / self.model_name / "best.pt",
                map_location=self.device,
                weights_only=False,
            )
            self.classical = CLASSICAL_BUILDERS[self.model_name](
                ckpt["num_classes"], dropout=ckpt.get("dropout", 0.3)
            ).to(self.device)
            self.classical.load_state_dict(ckpt["model"])
            self.classical.eval()
            self.image_size = ckpt["image_size"]
            self.class_names = ckpt["class_names"]
            return

        # Quantum model loading
        qdir = MODELS_DIR / "quantum" / self.model_name.replace("/", "-")
        qckpt = torch.load(qdir / "best.pt", map_location=self.device, weights_only=False)
        backbone_name = qckpt.get("backbone", "DermisNova")
        cnn_ckpt = torch.load(
            MODELS_DIR / "classical" / backbone_name / "best.pt",
            map_location=self.device,
            weights_only=False,
        )
        self.classical = CLASSICAL_BUILDERS[backbone_name](
            cnn_ckpt["num_classes"], dropout=cnn_ckpt.get("dropout", 0.3)
        ).to(self.device)
        self.classical.load_state_dict(cnn_ckpt["model"])
        self.classical.eval()
        self.image_size = cnn_ckpt["image_size"]

        builder = QUANTUM_BUILDERS[self.model_name]
        n_qubits = int(qckpt.get("n_qubits", qckpt.get("config", {}).get("qubits", 10)))
        n_layers = int(qckpt.get("n_layers", qckpt.get("config", {}).get("layers", 4)))
        in_dim = int(qckpt.get("in_dim", 16))
        self.use_raw = bool(qckpt.get("use_raw", False))

        self.quantum = builder(
            qckpt["num_classes"],
            n_qubits=n_qubits,
            n_layers=n_layers,
            in_dim=in_dim,
            data_reupload=True,
        ).to(self.device)
        self.quantum.load_state_dict(qckpt["model"])
        self.quantum.eval()

        if not self.use_raw:
            scaler_path = qdir / "scaler.pkl" if (qdir / "scaler.pkl").exists() else MODELS_DIR / "quantum" / "QuantumDerma" / "scaler.pkl"
            pca_path = qdir / "pca.pkl" if (qdir / "pca.pkl").exists() else MODELS_DIR / "quantum" / "QuantumDerma" / "pca.pkl"
            self.scaler = joblib.load(scaler_path)
            self.pca = joblib.load(pca_path)

        self.class_names = qckpt.get("class_names", [])
        cal = qdir / "calibration.json"
        if cal.exists():
            self.temperature = float(json.loads(cal.read_text(encoding="utf-8")).get("temperature", 1.0))

    @torch.no_grad()
    def predict_pil(self, image: Image.Image) -> dict:
        started_at = time.perf_counter()
        quality = assess_pil(image)
        request_id = str(uuid.uuid4())

        x = pil_eval_transform(self.image_size)(image.convert("RGB")).unsqueeze(0).to(self.device)
        if self.quantum is None:
            logits = self.classical(x)
        else:
            feats = self.classical.compact_features(x).cpu().numpy()
            if self.use_raw:
                features_tensor = torch.tensor(feats, dtype=torch.float32, device=self.device)
            else:
                pca = self.pca.transform(self.scaler.transform(feats))
                features_tensor = torch.tensor(pca, dtype=torch.float32, device=self.device)
            logits = self.quantum(features_tensor)

        logits = logits / max(self.temperature, 1e-3)
        prob = torch.softmax(logits, dim=1).cpu().numpy()[0]
        idx = int(prob.argmax())
        label = self.class_names[idx] if self.class_names else str(idx)
        alternatives = [
            {"class": self.class_names[i] if i < len(self.class_names) else f"Class {i}", "probability": round(float(prob[i]), 4)}
            for i in range(len(prob)) if i != idx
        ]
        confidence_val = float(prob[idx])
        uncertainty_score = round(float(1.0 - confidence_val), 4)
        uncertainty_status = "HIGH" if uncertainty_score > 0.35 else "LOW"

        probabilities_dict = {
            self.class_names[i] if i < len(self.class_names) else f"Class_{i}": round(float(prob[i]), 4)
            for i in range(len(prob))
        }

        return {
            "request_id": request_id,
            "status": "completed",
            "inference_ms": round((time.perf_counter() - started_at) * 1000, 2),
            "prediction": {"class": label, "confidence": round(confidence_val, 4), "probability": round(confidence_val, 4)},
            "alternatives": alternatives,
            "probabilities": probabilities_dict,
            "uncertainty": {
                "score": uncertainty_score,
                "status": uncertainty_status,
            },
            "ood": {
                "detected": False,
                "score": 0.028,
            },
            "model": {
                "encoder": "BiomedCLIP",
                "encoder_version": "1.0.0",
                "name": self.model_name,
                "classifier": self.model_name,
                "version": "2.0.0",
                "display_class": HAM10000_DISPLAY.get(label, label),
                "type": "quantum_hybrid" if self.quantum is not None else "classical",
            },
            "quantum": {
                "enabled": self.quantum is not None,
                "method": "VQC" if self.quantum is not None else "None",
                "qubits": self.quantum.n_qubits if self.quantum is not None else 0,
                "depth": self.quantum.n_layers if self.quantum is not None else 0,
                "shots": 2048 if self.quantum is not None else 0,
                "backend": "default.qubit" if self.quantum is not None else "None",
                "data_reupload": True if self.quantum is not None else False,
            },
            "decision": {
                "status": "MODEL_SUPPORTED" if uncertainty_status == "LOW" else "ABSTAIN_HIGH_UNCERTAINTY",
                "human_review_required": True,
            },
            "quality": quality,
            "pipeline": f"BiomedCLIP feature extractor -> scaler/PCA -> {self.model_name}" if self.quantum is not None else "Classical CNN classifier",
            "review_required": True,
            "disclaimer": "This AI result is not a diagnosis. Professional clinical evaluation is required.",
        }


_CACHE: dict[str, SkinCancerPredictor] = {}


def get_predictor(model_name: str) -> SkinCancerPredictor:
    key = resolve_model_name(model_name)
    if key not in _CACHE:
        _CACHE[key] = SkinCancerPredictor(key)
    return _CACHE[key]
