from torchvision import transforms

MEAN = (0.485, 0.456, 0.406)
STD = (0.229, 0.224, 0.225)


def eval_transform(image_size: int = 224):
    return transforms.Compose([
        transforms.Grayscale(num_output_channels=3), transforms.Resize((image_size + 32, image_size + 32)),
        transforms.CenterCrop(image_size),
        transforms.ToTensor(), transforms.Normalize(MEAN, STD),
    ])


def train_transform(image_size: int = 224):
    return transforms.Compose([
        transforms.Grayscale(num_output_channels=3), transforms.Resize((image_size + 32, image_size + 32)),
        transforms.RandomResizedCrop(image_size, scale=(0.85, 1.0), ratio=(0.95, 1.05)),
        transforms.RandomHorizontalFlip(), transforms.RandomRotation(5),
        transforms.ToTensor(), transforms.Normalize(MEAN, STD),
    ])