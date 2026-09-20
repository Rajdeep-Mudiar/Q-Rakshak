"""Q-RAKSHAK Weight Importer & Registry Updater.

Use this script after downloading fine-tuned weights from Kaggle to sync them into your
backend models directory (models/) and update models/registry.json.

Usage:
    python fine_tuned_models/export_to_backend.py --weights-dir ./kaggle_outputs
"""

import argparse
import json
import shutil
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
FINAL_MODELS_DIR = ROOT_DIR / "final_models"
CHECKPOINTS_DIR = FINAL_MODELS_DIR / "checkpoints"
QUANTUM_DIR = CHECKPOINTS_DIR / "quantum"
CLASSICAL_DIR = CHECKPOINTS_DIR / "classical"
PREPROCESSORS_DIR = CHECKPOINTS_DIR / "preprocessors"
REGISTRY_PATH = CHECKPOINTS_DIR / "registry.json"


def sync_weights_to_backend(weights_dir: str):
    src_dir = Path(weights_dir)
    if not src_dir.exists():
        print(f"❌ Error: Source directory '{src_dir}' not found.")
        return

    QUANTUM_DIR.mkdir(parents=True, exist_ok=True)
    CLASSICAL_DIR.mkdir(parents=True, exist_ok=True)
    PREPROCESSORS_DIR.mkdir(parents=True, exist_ok=True)

    # File mapping: source filename -> destination target
    model_mapping = {
        "QuantumPneu-FineTuned.pt": QUANTUM_DIR / "QuantumPneu.pt",
        "Q-Skin-Vortex-FineTuned.pt": QUANTUM_DIR / "Q-Skin-Vortex.pt",
        "OncoPulse-VQC.pt": QUANTUM_DIR / "OncoPulse-VQC.pt",
        "CardioWave-VQC.pt": QUANTUM_DIR / "CardioWave-VQC.pt",
        "NeuroSynapse-VQC.pt": QUANTUM_DIR / "NeuroSynapse-VQC.pt",
        "Diabetes-VQC.pt": QUANTUM_DIR / "Diabetes-VQC.pt",
        "OncoPulse-QSVM.joblib": QUANTUM_DIR / "OncoPulse-QSVM.joblib",
        "Sentinel-RF.joblib": CLASSICAL_DIR / "Sentinel-RF.joblib",
        "Sentinel-SVM.joblib": CLASSICAL_DIR / "Sentinel-SVM.joblib",
        "Sentinel-XGB.joblib": CLASSICAL_DIR / "Sentinel-XGB.joblib",
        "Sentinel-MLP.joblib": CLASSICAL_DIR / "Sentinel-MLP.joblib",
        "Sentinel-LogReg.joblib": CLASSICAL_DIR / "Sentinel-LogReg.joblib",
        "preprocessor_wdbc.joblib": PREPROCESSORS_DIR / "preprocessor_wdbc.joblib",
        "preprocessor_heart.joblib": PREPROCESSORS_DIR / "preprocessor_heart.joblib",
        "preprocessor_parkinsons.joblib": PREPROCESSORS_DIR / "preprocessor_parkinsons.joblib",
        "preprocessor_diabetes.joblib": PREPROCESSORS_DIR / "preprocessor_diabetes.joblib",
    }

    synced_count = 0
    for src_file in src_dir.glob("**/*"):
        if src_file.name in model_mapping:
            dst_path = model_mapping[src_file.name]
            shutil.copy2(src_file, dst_path)
            print(f"  --> Synced checkpoint: {src_file.name} => {dst_path.relative_to(ROOT_DIR)}")
            synced_count += 1

    print(f"\n✅ Total {synced_count} model weights successfully synced to {CHECKPOINTS_DIR.relative_to(ROOT_DIR)}!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync fine-tuned Kaggle weights to QDoc backend")
    parser.add_argument("--weights-dir", type=str, default="./outputs", help="Directory containing downloaded weights")
    args = parser.parse_args()

    sync_weights_to_backend(args.weights_dir)
