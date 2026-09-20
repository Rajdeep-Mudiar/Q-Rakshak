try:
    from torchvision import transforms

    MEAN = (0.485, 0.456, 0.406)
    STD = (0.229, 0.224, 0.225)

    def eval_transform(image_size: int = 224):
        return transforms.Compose([
            transforms.Grayscale(num_output_channels=3),
            transforms.Resize((image_size + 32, image_size + 32)),
            transforms.CenterCrop(image_size),
            transforms.ToTensor(),
            transforms.Normalize(MEAN, STD),
        ])

    def train_transform(image_size: int = 224):
        return transforms.Compose([
            transforms.Grayscale(num_output_channels=3),
            transforms.Resize((image_size + 32, image_size + 32)),
            transforms.RandomResizedCrop(image_size, scale=(0.85, 1.0), ratio=(0.95, 1.05)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(5),
            transforms.ToTensor(),
            transforms.Normalize(MEAN, STD),
        ])
except ImportError:
    import numpy as np
    import torch
    from PIL import Image

    class PurePILToTensorNormalize:
        def __init__(self, size: int = 224):
            self.size = size
            self.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(3, 1, 1)
            self.std = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(3, 1, 1)

        def __call__(self, img: Image.Image) -> torch.Tensor:
            img = img.convert("L").convert("RGB").resize((self.size, self.size), Image.Resampling.BILINEAR)
            arr = np.array(img, dtype=np.float32) / 255.0
            arr = arr.transpose(2, 0, 1)
            arr = (arr - self.mean) / self.std
            return torch.from_numpy(arr)

    def eval_transform(image_size: int = 224):
        return PurePILToTensorNormalize(image_size)

    def train_transform(image_size: int = 224):
        return PurePILToTensorNormalize(image_size)