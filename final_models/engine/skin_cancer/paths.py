from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_ROOT = PROJECT_ROOT / "datasets" / "SKIN_CANCER"
ARCHIVE_DIR = DATASET_ROOT / "archive"
PRIMARY_CSV = ARCHIVE_DIR / "hmnist_28_28_RGB.csv"
REPORTS_DIR = PROJECT_ROOT / "reports" / "skin_cancer"
MODELS_DIR = PROJECT_ROOT / "models" / "skin_cancer"
CACHE_DIR = REPORTS_DIR / "cache"
CONFIGS_DIR = PROJECT_ROOT / "ml" / "skin_cancer" / "configs"


def ensure_dirs() -> None:
    for path in (
        REPORTS_DIR,
        CACHE_DIR,
        MODELS_DIR / "classical",
        MODELS_DIR / "quantum",
        MODELS_DIR / "production",
        MODELS_DIR / "candidates",
        MODELS_DIR / "staging",
    ):
        path.mkdir(parents=True, exist_ok=True)
