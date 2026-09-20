# Developer Quickstart & Verification Runbook

This guide covers developer onboarding, virtual environment setup, local weight verification, database initialization, automated test execution, and application startup for **Q-RAKSHAK**.

---

## 1. Prerequisites & Environment

- **Operating System**: Linux (Ubuntu 22.04+), macOS (Apple Silicon / Intel), or Windows 10/11.
- **Python**: Version 3.10, 3.11, or 3.12 (Tested on 3.10).
- **Node.js**: Version 18.x or 20.x LTS.
- **Package Manager**: npm or pnpm.
- **Git**: 2.34+.

---

## 2. Repository Cloning & Environment Setup

```powershell
# Clone the official repository
git clone https://github.com/ARYANCY/QDoc.git
cd QDoc

# Create Python virtual environment
python -m venv .venv

# Activate on Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Activate on Linux / macOS:
# source .venv/bin/activate

# Upgrade pip & install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

## 3. Environment Variables Configuration (`.env`)

Create a `.env` file in the root directory:

```env
# Application Environment
ENVIRONMENT=development
PORT=8000
DEBUG=True
LOG_LEVEL=INFO

# Security & Authentication
SECRET_KEY=qrakshak-super-secret-clinical-key-2026-audit-pass-jwt
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GOOGLE_CLIENT_ID=985994695248-4615o9ba17tahv2q94ba01t322r3aunr.apps.googleusercontent.com

# Database Connection
DATABASE_URL=sqlite:///./qmedsense.db

# Quantum Simulation Engine
PENNYLANE_DEFAULT_DEVICE=default.qubit
PENNYLANE_MAX_QUBITS=8
QUANTUM_SHOTS=null

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

---

## 4. Database Initialization & Seeding

```powershell
# Initialize SQLite database and apply Prisma schema migrations
npx prisma generate
npx prisma db push

# Verify SQLite database creation
python -c "import sqlite3; conn = sqlite3.connect('qmedsense.db'); print('Database ready, tables:', conn.execute(\"SELECT name FROM sqlite_master WHERE type='table';\").fetchall())"
```

---

## 5. Automated Verification & Testing

Execute the full suite of unit and integration tests:

```powershell
# Run research objective verification tests (OBJ-01 through OBJ-06)
pytest tests/unit/test_research_objectives.py -v

# Run longitudinal trend and ESI triage logic tests
pytest tests/unit/test_longitudinal_trend.py -v

# Run full test suite with coverage
pytest tests/ --durations=10
```

---

## 6. Starting Backend and Frontend Servers

### Option A: Using Helper PowerShell Scripts

Terminal 1 (Backend):
```powershell
.\start_backend.ps1
```

Terminal 2 (Frontend):
```powershell
.\start_frontend.ps1
```

### Option B: Manual Startup

Terminal 1 (FastAPI Backend):
```powershell
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
# API documentation available at: http://localhost:8000/docs
```

Terminal 2 (React Vite Frontend):
```powershell
cd frontend
npm install
npm run dev
# Application served on: http://localhost:5173
```
