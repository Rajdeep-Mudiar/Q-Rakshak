"""Compatibility entry point — HAM10000 CSV has no separate image files."""

from ml.skin_cancer.data.split_dataset import build_split, main

build_manifest = build_split

if __name__ == "__main__":
    main()
