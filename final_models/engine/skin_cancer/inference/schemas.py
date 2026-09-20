from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class QualityResult(BaseModel):
    valid: bool
    reason: str | None = None
    issues: list[str] = Field(default_factory=list)


class Prediction(BaseModel):
    class_name: str = Field(alias="class")
    confidence: float

    model_config = {"populate_by_name": True}


class PredictResponse(BaseModel):
    request_id: str
    model: dict[str, Any]
    prediction: Prediction
    probabilities: dict[str, float]
    quality: QualityResult
    quantum: dict[str, Any] | None = None
    review_required: bool = True
    disclaimer: str = "This AI result is not a diagnosis. Professional evaluation is required."
