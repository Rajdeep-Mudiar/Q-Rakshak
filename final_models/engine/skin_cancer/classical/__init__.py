from ml.skin_cancer.classical.derma_lumen import DermaLumen
from ml.skin_cancer.classical.dermis_nova import DermisNova
from ml.skin_cancer.classical.densenet_121 import DenseNet121
from ml.skin_cancer.classical.melano_vanta import MelanoVanta

CLASSICAL_BUILDERS = {
    "DermisNova": DermisNova,
    "MelanoVanta": MelanoVanta,
    "DermaLumen": DermaLumen,
    "DenseNet121": DenseNet121,
}
