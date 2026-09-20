from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_ROOT = PROJECT_ROOT / "datasets" / "PNEUMONIA"
REPORTS_DIR = PROJECT_ROOT / "reports" / "pneumonia"
MODELS_DIR = PROJECT_ROOT / "models" / "pneumonia"


def ensure_dirs() -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)