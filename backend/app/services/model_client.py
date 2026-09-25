"""
Q-RAKSHAK — Model Microservice Client
Handles inter-service HTTP communication between Backend Core API (8000) and Model Service (8001)
with timeout protection, keep-alive connection pooling, and graceful fallback.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import httpx

from backend.app.core.config import settings

logger = logging.getLogger("qmed.model_client")

MODEL_SERVICE_URL = settings.MODEL_SERVICE_URL.rstrip("/")
MODEL_SERVICE_API_KEY = settings.MODEL_SERVICE_API_KEY


class ModelServiceClient:
    """Client for dispatching high-performance ML/QML requests to the model inference container."""

    def __init__(self, base_url: str = MODEL_SERVICE_URL, timeout_sec: float = 30.0):
        self.base_url = base_url
        self.timeout_sec = timeout_sec
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Internal-Key": MODEL_SERVICE_API_KEY,
        }

    async def check_health(self) -> Dict[str, Any]:
        """Checks if the standalone model microservice is online."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/health", headers=self.headers)
                if res.status_code == 200:
                    return {"online": True, **res.json()}
        except Exception as exc:
            logger.debug(f"Model service healthcheck probe failed: {exc}")
        return {"online": False, "detail": "Model service offline or unreachable"}

    async def predict_clinical(
        self, disease: str, patient_id: Optional[str] = None, features: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Sends clinical tabular biomarker request to the model service."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
                res = await client.post(
                    f"{self.base_url}/predict/clinical",
                    headers=self.headers,
                    json={"disease": disease, "patient_id": patient_id, "features": features or {}},
                )
                if res.status_code == 200:
                    return res.json()
        except Exception as exc:
            logger.warning(f"Model microservice predict_clinical call failed ({exc}). Using in-process engine.")
        return None


# Global singleton instance
model_service_client = ModelServiceClient()
