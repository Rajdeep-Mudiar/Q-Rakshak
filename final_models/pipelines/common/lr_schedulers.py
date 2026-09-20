"""Learning Rate Schedulers & Optimizers for Hybrid Quantum-Classical Training."""

import math
import torch
from torch.optim.lr_scheduler import _LRScheduler


class CosineAnnealingWarmupRestarts(_LRScheduler):
    """Cosine Annealing with linear warmup."""

    def __init__(
        self,
        optimizer: torch.optim.Optimizer,
        max_lr: float,
        min_lr: float = 1e-6,
        warmup_epochs: int = 5,
        total_epochs: int = 50,
        last_epoch: int = -1,
    ):
        self.max_lr = max_lr
        self.min_lr = min_lr
        self.warmup_epochs = max(1, warmup_epochs)
        self.total_epochs = total_epochs
        super().__init__(optimizer, last_epoch)

    def get_lr(self):
        if self.last_epoch < self.warmup_epochs:
            # Linear warmup
            alpha = self.last_epoch / self.warmup_epochs
            return [self.min_lr + alpha * (self.max_lr - self.min_lr) for _ in self.base_lrs]
        else:
            # Cosine decay
            progress = (self.last_epoch - self.warmup_epochs) / max(1, self.total_epochs - self.warmup_epochs)
            cosine_decay = 0.5 * (1.0 + math.cos(math.pi * progress))
            return [self.min_lr + cosine_decay * (self.max_lr - self.min_lr) for _ in self.base_lrs]
