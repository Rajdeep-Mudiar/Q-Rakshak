from __future__ import annotations

import torch
import torch.nn as nn
from torchvision import models


class FeatureCNN(nn.Module):
    def __init__(self, backbone_name: str, num_classes: int, dropout: float = 0.3):
        super().__init__()
        self.backbone_name = backbone_name
        if backbone_name == "efficientnet_b0":
            net = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
            feat_dim = net.classifier[1].in_features
            net.classifier = nn.Identity()
        elif backbone_name == "efficientnet_b2":
            net = models.efficientnet_b2(weights=models.EfficientNet_B2_Weights.DEFAULT)
            feat_dim = net.classifier[1].in_features
            net.classifier = nn.Identity()
        elif backbone_name == "convnext_tiny":
            net = models.convnext_tiny(weights=models.ConvNeXt_Tiny_Weights.DEFAULT)
            feat_dim = net.classifier[2].in_features
            net.classifier = nn.Identity()
        elif backbone_name == "densenet121":
            net = models.densenet121(weights=models.DenseNet121_Weights.DEFAULT)
            feat_dim = net.classifier.in_features
            net.classifier = nn.Identity()
        else:
            raise ValueError(backbone_name)
        self.backbone = net
        self.feature_dim = feat_dim
        self.head = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(feat_dim, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout / 2),
            nn.Linear(128, num_classes),
        )

    def forward_features(self, x: torch.Tensor) -> torch.Tensor:
        feats = self.backbone(x)
        if feats.ndim > 2:
            feats = torch.flatten(feats, 1)
        return feats

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.head(self.forward_features(x))

    def compact_features(self, x: torch.Tensor) -> torch.Tensor:
        feats = self.forward_features(x)
        return self.head[1](self.head[0](feats))
