from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from ml.skin_cancer.paths import CONFIGS_DIR


def load_config(name: str = "classical.yaml") -> dict[str, Any]:
    path = Path(name)
    if not path.exists():
        path = CONFIGS_DIR / name
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)
