import torch.nn as nn
from torchvision import models


class PneuVision(nn.Module):
    def __init__(self, dropout: float = 0.3):
        super().__init__()
        backbone = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
        self.features = backbone.features
        self.pool = backbone.avgpool
        self.feature_dim = backbone.classifier[1].in_features
        self.head = nn.Sequential(nn.Dropout(dropout), nn.Linear(self.feature_dim, 2))

    def compact_features(self, x):
        return self.pool(self.features(x)).flatten(1)

    def forward(self, x):
        return self.head(self.compact_features(x))