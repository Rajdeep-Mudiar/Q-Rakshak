from ml.skin_cancer.classical.backbones import FeatureCNN


def DermaLumen(num_classes: int, dropout: float = 0.3) -> FeatureCNN:
    return FeatureCNN("convnext_tiny", num_classes, dropout)
