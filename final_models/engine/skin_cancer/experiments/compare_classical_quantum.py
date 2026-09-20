from __future__ import annotations

import json
from pathlib import Path

from ml.skin_cancer.paths import REPORTS_DIR


def main() -> None:
    rows = []
    for name in ("DermisNova", "QuantumDerma", "QDermaFusion"):
        path = REPORTS_DIR / name / "metrics.json"
        if path.exists():
            data = json.loads(path.read_text(encoding="utf-8"))
            rows.append(
                {
                    "model": name,
                    "macro_f1": data.get("macro_f1"),
                    "accuracy": data.get("accuracy"),
                    "roc_auc": data.get("roc_auc"),
                }
            )
    (REPORTS_DIR / "classical_quantum_comparison.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
    print(json.dumps(rows, indent=2))


if __name__ == "__main__":
    main()
