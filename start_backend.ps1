$Mode = if ($args.Count -gt 0) { $args[0] } else { "production" }
if ($Mode -notin @("production", "demo")) {
    throw "Usage: .\start_backend.ps1 [production|demo]"
}

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$env:QMED_DB_MODE = $Mode
$env:PYTHONNOUSERSITE = "1"

if (-not (Test-Path ".\.venv\Scripts\Activate.ps1")) {
    Write-Host "Creating Python virtual environment..."
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    python -m pip install -r requirements.txt
} else {
    & ".\.venv\Scripts\Activate.ps1"
}

uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir backend