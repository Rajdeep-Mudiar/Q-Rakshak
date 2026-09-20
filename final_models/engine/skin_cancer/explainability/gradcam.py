from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import torch
from PIL import Image

from ml.skin_cancer.classical import CLASSICAL_BUILDERS
from ml.skin_cancer.paths import MODELS_DIR, REPORTS_DIR
from ml.skin_cancer.preprocessing.transforms import pil_eval_transform
from ml.skin_cancer.seed import get_device


def gradcam(model_name: str, image_path: Path, out_path: Path | None = None) -> Path:
    device = get_device()
    ckpt = torch.load(MODELS_DIR / "classical" / model_name / "best.pt", map_location=device, weights_only=False)
    model = CLASSICAL_BUILDERS[model_name](ckpt["num_classes"], dropout=ckpt.get("dropout", 0.3)).to(device)
    model.load_state_dict(ckpt["model"])
    model.eval()
    image = Image.open(image_path).convert("RGB")
    x = pil_eval_transform(ckpt["image_size"])(image).unsqueeze(0).to(device)
    activations = {}

    def hook(_m, _i, o):
        activations["value"] = o

    handle = model.backbone.features[-1].register_forward_hook(hook)
    logits = model(x)
    handle.remove()
    cls = int(logits.argmax(1).item())
    score = logits[0, cls]
    grads = torch.autograd.grad(score, activations["value"])[0]
    weights = grads.mean(dim=(2, 3), keepdim=True)
    cam = torch.relu((weights * activations["value"]).sum(1, keepdim=True))
    cam = torch.nn.functional.interpolate(cam, size=(image.size[1], image.size[0]), mode="bilinear", align_corners=False)
    cam = cam.squeeze().detach().cpu().numpy()
    cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
    import matplotlib.pyplot as plt

    out_path = out_path or (REPORTS_DIR / f"gradcam_{model_name}.png")
    fig, axes = plt.subplots(1, 2, figsize=(8, 4))
    axes[0].imshow(image)
    axes[0].set_title("original")
    axes[1].imshow(image)
    axes[1].imshow(cam, cmap="jet", alpha=0.45)
    axes[1].set_title("Grad-CAM")
    for ax in axes:
        ax.axis("off")
    fig.tight_layout()
    fig.savefig(out_path, dpi=140)
    plt.close(fig)
    return out_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="DermisNova")
    parser.add_argument("--image", required=True)
    args = parser.parse_args()
    print(gradcam(args.model, Path(args.image)))
