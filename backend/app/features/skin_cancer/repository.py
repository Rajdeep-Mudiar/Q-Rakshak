from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from backend.app.db.database import get_db_connection

logger = logging.getLogger(__name__)


def save_prediction(record: dict[str, Any]) -> None:
    """Persists a skin cancer prediction record to the SQLite skin_cancer_predictions table."""
    result = record.get("result", {})
    prediction = result.get("prediction", {})
    quantum = result.get("quantum")
    probs = result.get("probabilities", {})

    try:
        conn = get_db_connection()
        conn.execute("""
        INSERT INTO skin_cancer_predictions
            (id, filename, model, prediction_class, confidence, probabilities_json, quantum_info_json, inference_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            str(uuid.uuid4()),
            record.get("filename", "unknown"),
            record.get("model", "unknown"),
            prediction.get("class", "unknown"),
            float(prediction.get("confidence", 0.0)),
            json.dumps(probs),
            json.dumps(quantum) if quantum else None,
            float(result.get("inference_ms", 0.0)),
        ))
        conn.commit()
        conn.close()
    except Exception as exc:
        raise RuntimeError("Unable to persist skin-cancer prediction") from exc
        pass  # Silently tolerate DB write failures — prediction is still returned to caller


def list_predictions(limit: int = 50) -> list[dict[str, Any]]:
    """Returns the most recent skin cancer predictions from SQLite."""
    try:
        conn = get_db_connection()
        rows = conn.execute(
            "SELECT * FROM skin_cancer_predictions ORDER BY created_at DESC LIMIT ?;",
            (limit,),
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as exc:
        logger.exception("Unable to load skin-cancer prediction history: %s", exc)
        return []


def register_model(meta: dict[str, Any]) -> None:
    """Stub — kept for backward compatibility."""
    pass
