# NexaRecruit - Startup Script
# Launches all 3 services (AI Service, Backend, Frontend)

Write-Host "================================" -ForegroundColor Cyan
Write-Host "NexaRecruit Services Startup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Colors for service names
$aiColor = "Magenta"
$backendColor = "Blue"
$frontendColor = "Green"

Write-Host "This script will open 3 separate terminals for:" -ForegroundColor Yellow
Write-Host "  1. AI Service (Port 8000)" -ForegroundColor $aiColor
Write-Host "  2. Backend API (Port 5000)" -ForegroundColor $backendColor
Write-Host "  3. Frontend (Port 3000)" -ForegroundColor $frontendColor
Write-Host ""

$projectRoot = $PSScriptRoot

# Pre-check before starting
Write-Host "Pre-flight checks..." -ForegroundColor Yellow
$allGood = $true

# Check Node.js
$node = node --version 2>$null
if ($node) {
    Write-Host "✓ Node.js: $node" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found - run setup.ps1 first" -ForegroundColor Red
    $allGood = $false
}

# Check Python
$python = python --version 2>$null
if ($python) {
    Write-Host "✓ Python: $python" -ForegroundColor Green
} else {
    Write-Host "⚠ Python not found - AI service won't work" -ForegroundColor Yellow
}

# Check env files
if (!(Test-Path "$projectRoot\.env")) {
    Write-Host "✗ Root .env file missing" -ForegroundColor Red
    $allGood = $false
} else {
    Write-Host "✓ Root .env found" -ForegroundColor Green
}

if (!(Test-Path "$projectRoot\backend\.env")) {
    Write-Host "✗ Backend .env file missing" -ForegroundColor Red
    $allGood = $false
} else {
    Write-Host "✓ Backend .env found" -ForegroundColor Green
}

if (!(Test-Path "$projectRoot\frontend\.env.local")) {
    Write-Host "✗ Frontend .env.local file missing" -ForegroundColor Red
    $allGood = $false
} else {
    Write-Host "✓ Frontend .env.local found" -ForegroundColor Green
}

if (!$allGood) {
    Write-Host ""
    Write-Host "Please run setup.ps1 first" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "All checks passed! Starting services..." -ForegroundColor Green
Write-Host ""

# Start AI Service
Write-Host "Starting AI Service..." -ForegroundColor $aiColor
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot\ai-services'; Write-Host 'AI SERVICE TERMINAL - Starting Uvicorn on port 8000...' -ForegroundColor $aiColor; Write-Host 'Press Ctrl+C to stop' -ForegroundColor Yellow; Write-Host ''; uvicorn app.main:app --reload --port 8000"
)

Start-Sleep -Seconds 2

# Start Backend
Write-Host "Starting Backend API..." -ForegroundColor $backendColor
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot\backend'; Write-Host 'BACKEND API TERMINAL - Starting Express on port 5000...' -ForegroundColor $backendColor; Write-Host 'Press Ctrl+C to stop' -ForegroundColor Yellow; Write-Host ''; npm run dev"
)

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor $frontendColor
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot\frontend'; Write-Host 'FRONTEND TERMINAL - Starting Next.js on port 3000...' -ForegroundColor $frontendColor; Write-Host 'Press Ctrl+C to stop' -ForegroundColor Yellow; Write-Host ''; npm run dev"
)

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✓ All services started!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application:" -ForegroundColor Cyan
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor $frontendColor
Write-Host "  Backend API: http://localhost:5000/api" -ForegroundColor $backendColor
Write-Host "  AI Service:  http://localhost:8000/docs" -ForegroundColor $aiColor
Write-Host ""
Write-Host "Logs from all services will appear in their respective terminals above." -ForegroundColor Yellow
Write-Host "Close any terminal to stop that service." -ForegroundColor Yellow
Write-Host ""
