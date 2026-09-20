"""Q-RAKSHAK Universal Fine-Tuning & Training Master CLI Runner.

Supports training Classical, Hybrid, and Quantum models across all 6 clinical domains:
1. Pneumonia (Chest X-Ray) -> Classical (EfficientNet-B0) | Hybrid/Quantum (QuantumPneu)
2. Skin Cancer (HAM10000) -> Classical (DenseNet-121) | Hybrid/Quantum (Q-Skin-Vortex)
3. Breast Cancer (WDBC) -> Classical (Sentinel-RF, SVM) | Hybrid/Quantum (OncoPulse-VQC, QSVM)
4. Heart Disease (Cleveland) -> Classical (Sentinel-XGB, MLP) | Hybrid/Quantum (CardioWave-VQC, QNN)
5. Parkinson's -> Classical (Sentinel-RF, LogReg) | Hybrid/Quantum (NeuroSynapse-VQC)
6. Diabetes (PIMA) -> Classical (Sentinel-RF, XGB) | Hybrid/Quantum (Diabetes-VQC)

Usage Examples:
    python fine_tuned_models/train.py --disease pneumonia --model all
    python fine_tuned_models/train.py --disease skin_cancer --model hybrid
    python fine_tuned_models/train.py --disease breast_cancer --model quantum
    python fine_tuned_models/train.py --disease all --model all
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add project roots for imports
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))



def detect_data_path(disease: str, custom_path: str | None = None) -> str:
    """Auto-detects dataset paths on Kaggle, local repositories, or custom folders."""
    if custom_path and Path(custom_path).exists():
        return custom_path

    kaggle_paths = {
        "pneumonia": [
            "/kaggle/input/chest-xray-pneumonia/chest_xray",
            "/kaggle/input/chest-xray-pneumonia/chest_xray/chest_xray",
            "/kaggle/input/datasets/paultimothymooney/chest-xray-pneumonia/chest_xray",
            "/kaggle/input/datasets/paultimothymooney/chest-xray-pneumonia/chest_xray/chest_xray",
            "./datasets/pneumonia",
        ],
        "skin_cancer": [
            "/kaggle/input/skin-cancer-mnist-ham10000",
            "/kaggle/input/datasets/kmader/skin-cancer-mnist-ham10000",
            "./datasets/skin_cancer",
        ],
        "heart_disease": [
            "/kaggle/input/heart-disease-dataset/heart.csv",
            "/kaggle/input/heart-failure-prediction/heart.csv",
            "/kaggle/input/heart-disease-uci/heart.csv",
            "./datasets/heart.csv",
        ],
        "parkinsons": [
            "/kaggle/input/parkinsons-disease-data-set/parkinsons.data",
            "./datasets/parkinsons.data",
        ],
        "diabetes": [
            "/kaggle/input/diabetes-dataset/diabetes.csv",
            "/kaggle/input/pima-indians-diabetes-database/diabetes.csv",
            "./datasets/diabetes.csv",
        ],
    }

    for candidate in kaggle_paths.get(disease, []):
        if Path(candidate).exists():
            return candidate

    return ""


def main():
    parser = argparse.ArgumentParser(description="Q-RAKSHAK Master Training CLI")
    parser.add_argument(
        "--disease",
        type=str,
        choices=["pneumonia", "skin_cancer", "breast_cancer", "heart_disease", "parkinsons", "diabetes", "all"],
        default="all",
        help="Disease module to train (or 'all' for complete suite)",
    )
    parser.add_argument(
        "--model",
        "--model-tier",
        dest="model",
        type=str,
        choices=["classical", "hybrid", "quantum", "all"],
        default="all",
        help="Model architecture category to train",
    )
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Training batch size")
    parser.add_argument("--lr", type=float, default=None, help="Learning rate (overrides default)")
    parser.add_argument("--data-path", type=str, default=None, help="Custom dataset root path")
    parser.add_argument("--output-dir", type=str, default="./outputs", help="Directory to save model checkpoints")
    parser.add_argument("--cpu", action="store_true", help="Force CPU execution")
    args = parser.parse_args()

    out_base = Path(args.output_dir)
    out_base.mkdir(parents=True, exist_ok=True)

    diseases_to_run = (
        ["pneumonia", "skin_cancer", "breast_cancer", "heart_disease", "parkinsons", "diabetes"]
        if args.disease == "all"
        else [args.disease]
    )

    print("\n=======================================================")
    print(f" 🚀 Q-RAKSHAK Universal Model Training Pipeline")
    print(f" Modules: {diseases_to_run} | Model Target: {args.model}")
    print("=======================================================\n")

    for d in diseases_to_run:
        print(f"\n---> [Training Domain: {d.upper()}] <---")
        detected_data = detect_data_path(d, args.data_path)

        if d == "pneumonia":
            from pipelines.vision.train_pneumonia import train_pneumonia_pipeline
            sub_args = argparse.Namespace(
                data_dir=detected_data or "/kaggle/input/chest-xray-pneumonia/chest_xray",
                output_dir=str(out_base / "pneumonia"),
                epochs=args.epochs,
                batch_size=args.batch_size,
                quantum_lr=args.lr if args.lr else 0.005,
                backbone_lr=args.lr if args.lr else 0.0001,
                n_qubits=8,
                n_layers=3,
                num_workers=2,
                unfreeze_all=False,
                max_samples=None,
                cpu=args.cpu,
            )
            train_pneumonia_pipeline(sub_args)

        elif d == "skin_cancer":
            from pipelines.vision.train_skin_cancer import train_skin_cancer_pipeline
            sub_args = argparse.Namespace(
                data_dir=detected_data or "/kaggle/input/skin-cancer-mnist-ham10000",
                output_dir=str(out_base / "skin_cancer"),
                epochs=args.epochs,
                batch_size=args.batch_size,
                quantum_lr=args.lr if args.lr else 0.005,
                backbone_lr=args.lr if args.lr else 0.0001,
                n_qubits=8,
                n_layers=3,
                num_workers=2,
                unfreeze_all=False,
                max_samples=None,
                cpu=args.cpu,
            )
            train_skin_cancer_pipeline(sub_args)

        elif d == "breast_cancer":
            from pipelines.tabular.train_breast_cancer import train_breast_cancer_pipeline
            sub_args = argparse.Namespace(
                output_dir=str(out_base / "breast_cancer"),
                epochs=args.epochs if args.epochs > 10 else 30,
                batch_size=args.batch_size,
                lr=0.03,
                n_qubits=8,
                n_layers=3,
                seed=42,
            )
            train_breast_cancer_pipeline(sub_args)

        elif d == "heart_disease":
            from pipelines.tabular.train_heart_disease import train_heart_disease_pipeline
            sub_args = argparse.Namespace(
                data_path=detected_data or None,
                output_dir=str(out_base / "heart_disease"),
                epochs=args.epochs if args.epochs > 10 else 30,
                batch_size=args.batch_size,
                lr=0.03,
                n_qubits=8,
                n_layers=3,
                seed=42,
            )
            train_heart_disease_pipeline(sub_args)

        elif d == "parkinsons":
            from pipelines.tabular.train_parkinsons import train_parkinsons_pipeline
            sub_args = argparse.Namespace(
                data_path=detected_data or None,
                output_dir=str(out_base / "parkinsons"),
                epochs=args.epochs if args.epochs > 10 else 30,
                batch_size=args.batch_size,
                lr=0.03,
                n_qubits=6,
                n_layers=2,
                seed=42,
            )
            train_parkinsons_pipeline(sub_args)

        elif d == "diabetes":
            from pipelines.tabular.train_diabetes import train_diabetes_pipeline
            sub_args = argparse.Namespace(
                data_path=detected_data or None,
                output_dir=str(out_base / "diabetes"),
                epochs=args.epochs if args.epochs > 10 else 30,
                batch_size=args.batch_size,
                lr=0.03,
                n_qubits=8,
                n_layers=2,
                seed=42,
            )
            train_diabetes_pipeline(sub_args)


    print("\n🎉 All Requested Model Training Pipelines Completed Successfully!")
    print(f"Checkpoints and artifacts stored under: {out_base.resolve()}\n")


if __name__ == "__main__":
    main()
