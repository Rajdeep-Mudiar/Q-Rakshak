from __future__ import annotations

import json

from ml.skin_cancer.experiments.compare_qubit_counts import _run
from ml.skin_cancer.paths import REPORTS_DIR


def main() -> None:
    rows = []
    for ansatz in ("ring",):
        row = _run(8, 2)
        row["embedding"] = "angle"
        row["ansatz"] = ansatz
        rows.append(row)
    (REPORTS_DIR / "embedding_comparison.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
    print(json.dumps(rows, indent=2))


if __name__ == "__main__":
    main()
