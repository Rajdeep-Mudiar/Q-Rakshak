from ml.skin_cancer.classical.backbones import FeatureCNN


def DermisNova(num_classes: int, dropout: float = 0.3) -> FeatureCNN:
    return FeatureCNN("efficientnet_b0", num_classes, dropout)
