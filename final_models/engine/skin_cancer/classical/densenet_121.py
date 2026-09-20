from ml.skin_cancer.classical.backbones import FeatureCNN


def DenseNet121(num_classes: int, dropout: float = 0.3) -> FeatureCNN:
    return FeatureCNN("densenet121", num_classes, dropout)