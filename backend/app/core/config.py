from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import List

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[3]
BACKEND_ROOT = Path(__file__).resolve().parents[2]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Register final_models alias for seamless backwards-compatibility
try:
    import final_models.engine as _engine
    import sys
    sys.modules.setdefault("ml", _engine)
except Exception:
    pass

# Priority: backend/.env -> root .env
if (BACKEND_ROOT / ".env").exists():
    load_dotenv(BACKEND_ROOT / ".env")
elif (PROJECT_ROOT / ".env").exists():
    load_dotenv(PROJECT_ROOT / ".env")


class Settings:
    PROJECT_NAME: str = "Q-RAKSHAK — Quantum Clinical Decision Support API"
    VERSION: str = "2.0.0"
    SIH_PROBLEM_ID: str = "26139"
    API_V1_PREFIX: str = os.getenv("API_V1_PREFIX", "/api/v1")

    # Directory Paths & Database
    BASE_DIR: Path = PROJECT_ROOT
    BACKEND_DIR: Path = BACKEND_ROOT
    DATA_DIR: Path = BACKEND_DIR
    DB_MODE: str = os.getenv("QMED_DB_MODE", "production").strip().lower()

    # Always ensure database paths are resolved absolutely to prevent root vs backend cwd drift
    _raw_real_db = os.getenv("QMED_REAL_DB_PATH", "q-rakshak.db")
    REAL_DB_PATH: Path = (BACKEND_DIR / _raw_real_db) if not Path(_raw_real_db).is_absolute() else Path(_raw_real_db)
    
    _raw_demo_db = os.getenv("QMED_DEMO_DB_PATH", "q-rakshak_demo.db")
    DEMO_DB_PATH: Path = (BACKEND_DIR / _raw_demo_db) if not Path(_raw_demo_db).is_absolute() else Path(_raw_demo_db)

    _raw_db = os.getenv("QMED_DB_PATH", "")
    DB_PATH: Path = ((BACKEND_DIR / _raw_db) if not Path(_raw_db).is_absolute() else Path(_raw_db)) if _raw_db else (DEMO_DB_PATH if DB_MODE == "demo" else REAL_DB_PATH)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "").strip()
    FINAL_MODELS_DIR: Path = BASE_DIR / "final_models"
    MODELS_DIR: Path = (FINAL_MODELS_DIR / "checkpoints") if (FINAL_MODELS_DIR / "checkpoints").exists() else (BASE_DIR / "models")
    REPORTS_DIR: Path = BASE_DIR / "reports"
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Security & Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "qmed-sih2026-super-secret-key-change-in-prod")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
    API_KEY: str = os.getenv("API_KEY", "qmed-master-api-key-2026")

    # Model Microservice
    MODEL_SERVICE_URL: str = os.getenv("MODEL_SERVICE_URL", "http://localhost:8001")
    MODEL_SERVICE_API_KEY: str = os.getenv("MODEL_SERVICE_API_KEY", "qmed-internal-model-key-secure-prod-2026")

    # Quantum Backend & Execution
    QUANTUM_BACKEND: str = os.getenv("QUANTUM_BACKEND", "simulator")
    SIMULATOR_SHOTS: int = int(os.getenv("SIMULATOR_SHOTS", "1024"))

    # Vapi Voice AI Doctor Integration
    VAPI_API_KEY: str = os.getenv("VAPI_API_KEY", "").strip()
    VAPI_PUBLIC_KEY: str = os.getenv("VAPI_PUBLIC_KEY", "").strip()
    VAPI_ASSISTANT_ID: str = os.getenv("VAPI_ASSISTANT_ID", "").strip()
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "").strip()
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()
    # Google OAuth 2.0
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "985994695248-4615o9ba17tahv2q94ba01t322r3aunr.apps.googleusercontent.com").strip()
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/google/callback").strip()

    # SMTP Email Delivery (Gmail / Standard SMTP)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "").strip()
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "").strip()
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Q-RAKSHAK Clinical Security").strip()
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "").strip()
    NOTIFICATION_EMAIL: str = os.getenv("NOTIFICATION_EMAIL", "").strip()

    # CORS
    @property
    def cors_origins(self) -> List[str]:
        default_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://q-rakshak.health",
            "https://www.q-rakshak.health",
        ]
        extra = os.getenv("CORS_ALLOWED_ORIGINS", "")
        if extra:
            default_origins.extend(origin.strip().rstrip("/") for origin in extra.split(",") if origin.strip())
        return list(dict.fromkeys(default_origins))


settings = Settings()
if settings.DB_MODE not in {"production", "demo"}:
    raise ValueError("QMED_DB_MODE must be 'production' or 'demo'.")
