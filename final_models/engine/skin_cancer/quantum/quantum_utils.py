from __future__ import annotations

import torch
import torch.nn as nn
import numpy as np


def measurement_in_range(values: torch.Tensor | np.ndarray, lo: float = -1.0, hi: float = 1.0) -> bool:
    """Check that all measurement expectation values lie within [lo, hi]."""
    arr = values.detach().cpu().numpy() if torch.is_tensor(values) else np.asarray(values)
    return bool(np.isfinite(arr).all() and arr.min() >= lo - 1e-5 and arr.max() <= hi + 1e-5)


def count_parameters(module: nn.Module) -> int:
    """Return number of trainable parameters in a module."""
    return sum(p.numel() for p in module.parameters() if p.requires_grad)


class FocalLoss(nn.Module):
    """Focal Loss for multi-class classification (Lin et al., 2017).

    Focal Loss down-weights easy examples and focuses learning on hard
    misclassifications.  Particularly effective for heavily imbalanced
    medical datasets like HAM10000 where ``nv`` dominates (67% of samples).

    FL(p_t) = -alpha_t * (1 - p_t)^gamma * log(p_t)

    Args:
        gamma:       Focusing parameter (2.0 is standard).
        weight:      Per-class weight tensor (same as ``nn.CrossEntropyLoss``).
        label_smoothing: Label smoothing applied before focal weighting.
        reduction:   ``"mean"`` or ``"sum"``.
    """

    def __init__(
        self,
        gamma: float = 2.0,
        weight: torch.Tensor | None = None,
        label_smoothing: float = 0.0,
        reduction: str = "mean",
    ):
        super().__init__()
        self.gamma = gamma
        self.register_buffer("weight", weight)
        self.label_smoothing = label_smoothing
        self.reduction = reduction

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        # Compute the unweighted, unsmoothed softmax probabilities
        probs = torch.softmax(logits, dim=1)
        p_t = probs.gather(1, targets.unsqueeze(1)).squeeze(1)

        # Compute the focal weights using the unweighted probabilities
        focal_weight = (1.0 - p_t) ** self.gamma

        # Standard CE with optional label smoothing and class weights
        ce = nn.functional.cross_entropy(
            logits,
            targets,
            weight=self.weight,
            label_smoothing=self.label_smoothing,
            reduction="none",
        )

        loss = focal_weight * ce
        if self.reduction == "mean":
            return loss.mean()
        return loss.sum()
