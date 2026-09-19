from __future__ import annotations

import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.gzip import GZipMiddleware

from backend.app.core.cors import setup_cors, get_allowed_origins, is_origin_allowed
from backend.app.core.security import SecurityHeadersMiddleware
from backend.app.features.admin.controller import router as admin_router
from backend.app.features.ai_doctor.controller import router as ai_doctor_router
from backend.app.features.auth.controller import router as auth_router
from backend.app.features.benchmarks.controller import router as benchmarks_router
from backend.app.features.clinical.controller import router as clinical_router
from backend.app.features.compliance.controller import router as compliance_router
from backend.app.features.consultations.controller import router as consultations_router
from backend.app.features.digital_twin.controller import router as digital_twin_router
from backend.app.features.early_detection.controller import router as early_detection_router
from backend.app.features.emergency.controller import router as emergency_router
from backend.app.features.graphs.controller import router as graphs_router
from backend.app.features.notifications.controller import router as notifications_router
from backend.app.features.pneumonia.controller import router as pneumonia_router
from backend.app.features.profile.controller import router as profile_router
from backend.app.features.quantum_telemetry.controller import router as quantum_telemetry_router
from backend.app.features.reports.controller import router as reports_router
from backend.app.features.researcher.controller import router as researcher_router
from backend.app.features.skin_cancer.controller import router as skin_cancer_router

logger = logging.getLogger("qmed.api")

app = FastAPI(
    title="Q-RAKSHAK — Quantum Clinical Decision Support API",
    description="Hybrid Quantum Machine Learning Platform for Early Disease Detection (SIH 26139).",
    version="2.0.0",
)

# 1. Global Security Headers & GZip
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 2. Hardened CORS Configuration
setup_cors(app)


# 3. Global Exception Handler (Preserves CORS Headers on 500 Unhandled Exceptions)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"[Server Error] Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    origin = request.headers.get("origin")
    headers = {}
    if origin and is_origin_allowed(origin):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Headers"] = "*"
        headers["Access-Control-Allow-Methods"] = "*"

    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error_type": exc.__class__.__name__,
            "detail": "An internal server error occurred. Please contact system administrator or try again later.",
            "path": request.url.path,
        },
        headers=headers,
    )


# 4. Feature Routers per SRS Architecture
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(profile_router)
app.include_router(clinical_router)
app.include_router(early_detection_router)
app.include_router(researcher_router)
app.include_router(quantum_telemetry_router)
app.include_router(benchmarks_router)
app.include_router(digital_twin_router)
app.include_router(compliance_router)
app.include_router(reports_router)
app.include_router(skin_cancer_router)
app.include_router(pneumonia_router)
app.include_router(graphs_router)
app.include_router(consultations_router)
import time

app.include_router(notifications_router)
app.include_router(emergency_router)
app.include_router(ai_doctor_router)


@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {
        "platform": "Q-RAKSHAK",
        "version": "2.0.0",
        "sih_problem_id": "26139",
        "status": "online",
        "quantum_engine": "PennyLane + Qiskit Aer",
        "docs": "/docs",
    }


@app.api_route("/health", methods=["GET", "HEAD"])
@app.api_route("/api/health", methods=["GET", "HEAD"])
@app.api_route("/api/v1/health", methods=["GET", "HEAD"])
def health_check():
    return {
        "status": "healthy",
        "service": "Q-RAKSHAK Backend API",
        "version": "2.0.0",
        "timestamp": time.time(),
    }

