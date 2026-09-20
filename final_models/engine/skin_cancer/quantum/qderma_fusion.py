from __future__ import annotations

import torch
import torch.nn as nn


class QDermaFusion(nn.Module):
    def __init__(self, num_classes: int):
        super().__init__()
        self.fusion = nn.Linear(num_classes * 2, num_classes)

    def forward(self, classical_logits: torch.Tensor, quantum_logits: torch.Tensor) -> torch.Tensor:
        return self.fusion(torch.cat([classical_logits, quantum_logits], dim=1))
