from __future__ import annotations

import logging
from typing import Any, Union
import numpy as np
import pandas as pd
from PIL import Image

logger = logging.getLogger("ml.preprocessing.validation")


def validate_clinical_sample(
    sample: Any,
    modality: str,
    patient_id: str | None = None,
) -> dict[str, Any]:
    """Validates an individual clinical sample for integrity, dimensions, and missing values."""
    if patient_id is not None and not str(patient_id).strip():
        raise ValueError("Invalid or empty patient identifier.")

    if sample is None:
        raise ValueError("Clinical input sample cannot be None.")

    # Image validation
    if isinstance(sample, Image.Image):
        if sample.size[0] < 16 or sample.size[1] < 16:
            raise ValueError(f"Corrupted or degenerate image dimensions: {sample.size}")
        return {"status": "VALID", "type": "PIL.Image", "dimensions": sample.size}

    # Numpy array validation
    if isinstance(sample, np.ndarray):
        if np.isnan(sample).any() or np.isinf(sample).any():
            raise ValueError("Clinical sample array contains NaN or Infinite values.")
        if sample.size == 0:
            raise ValueError("Empty numerical array provided.")
        return {"status": "VALID", "type": "numpy.ndarray", "shape": list(sample.shape)}

    # Tabular / list validation
    if isinstance(sample, (list, tuple)):
        if len(sample) == 0:
            raise ValueError("Empty numerical sequence provided.")
        for elem in sample:
            if not isinstance(elem, (int, float, np.number)):
                raise ValueError(f"Non-numeric element detected in clinical feature vector: {elem}")
        return {"status": "VALID", "type": "list", "length": len(sample)}

    # String / Text validation
    if isinstance(sample, str):
        if not sample.strip():
            raise ValueError("Empty text/path string provided.")
        return {"status": "VALID", "type": "string", "length": len(sample)}

    return {"status": "VALID", "type": str(type(sample))}


def validate_dataset_schema(
    df: pd.DataFrame,
    target_column: str,
    patient_id_column: str | None = None,
    allow_missing: bool = False,
) -> dict[str, Any]:
    """Validates dataframe integrity, schema consistency, missingness, and patient grouping."""
    if df.empty:
        raise ValueError("Provided dataset is empty.")

    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' missing from dataset schema.")

    if not allow_missing and df[target_column].isna().any():
        raise ValueError(f"Target column '{target_column}' contains NaN values.")

    missing_counts = df.isna().sum().to_dict()
    total_missing = int(df.isna().sum().sum())

    if patient_id_column and patient_id_column not in df.columns:
        raise ValueError(f"Patient ID column '{patient_id_column}' not found in dataframe.")

    num_classes = int(df[target_column].nunique())
    class_counts = df[target_column].value_counts().to_dict()

    return {
        "num_rows": len(df),
        "num_columns": len(df.columns),
        "target_column": target_column,
        "num_classes": num_classes,
        "class_distribution": class_counts,
        "total_missing_values": total_missing,
        "patient_grouped": bool(patient_id_column),
    }
