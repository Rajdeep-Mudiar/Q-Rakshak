from ml.skin_cancer.classical.backbones import FeatureCNN


def MelanoVanta(num_classes: int, dropout: float = 0.3) -> FeatureCNN:
    return FeatureCNN("efficientnet_b2", num_classes, dropout)
