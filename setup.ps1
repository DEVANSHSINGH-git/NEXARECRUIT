# NexaRecruit - Automated Setup Script
# Installs all dependencies and prepares the project

Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "       NexaRecruit - Setup Script" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeCheck = node --version 2>$null
if (!$nodeCheck) {
    Write-Host "✗ Node.js not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "STEP 1: Install Node.js" -ForegroundColor Yellow
    Write-Host "────────────────────────────────────────" -ForegroundColor Yellow
    Write-Host "1. Download Node.js 20 LTS from:" -ForegroundColor White
    Write-Host "   https://nodejs.org/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Run the installer" -ForegroundColor White
    Write-Host "3. Accept all defaults" -ForegroundColor White
    Write-Host "4. Restart your terminal" -ForegroundColor White
    Write-Host "5. Run this script again" -ForegroundColor White
    Write-Host ""
    exit 1
}
Write-Host "✓ Node.js $nodeCheck" -ForegroundColor Green
Write-Host ""

# Get project root
$projectRoot = Get-Location

Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
Write-Host "(This may take 5-10 minutes)" -ForegroundColor Gray
Write-Host ""

# Backend dependencies
Write-Host "→ Installing Backend dependencies..." -ForegroundColor Blue
Set-Location "$projectRoot\backend"
npm install --legacy-peer-deps 2>&1 | Select-Object -Last 5
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Backend npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Generate Prisma Client
Write-Host "→ Generating Prisma Client..." -ForegroundColor Blue
Set-Location "$projectRoot\backend"
npx prisma generate 2>&1 | Select-Object -Last 3
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Prisma generate failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Prisma Client generated" -ForegroundColor Green
Write-Host ""

# Frontend dependencies
Write-Host "→ Installing Frontend dependencies..." -ForegroundColor Green
Set-Location "$projectRoot\frontend"
npm install --legacy-peer-deps 2>&1 | Select-Object -Last 5
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Python dependencies (optional)
Write-Host "Checking Python..." -ForegroundColor Magenta
$pythonCheck = python --version 2>$null
if ($pythonCheck) {
    Write-Host "✓ $pythonCheck" -ForegroundColor Green
    Write-Host "→ Installing AI service dependencies..." -ForegroundColor Magenta
    Set-Location "$projectRoot\ai-services"
    pip install -r requirements.txt --quiet 2>&1 | Select-Object -Last 3
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ AI service dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "⚠ Python pip had issues (non-critical)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Python not found (optional)" -ForegroundColor Yellow
    Write-Host "   Download from https://python.org/downloads/" -ForegroundColor Gray
}
Write-Host ""

# Verify environment setup
Write-Host "Verifying environment files..." -ForegroundColor Yellow
$envFiles = @(
    "$projectRoot\.env",
    "$projectRoot\backend\.env",
    "$projectRoot\frontend\.env.local",
    "$projectRoot\ai-services\.env"
)

$allEnvReady = $true
foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
        Write-Host "✓ $(Split-Path $envFile -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "⚠ Missing: $(Split-Path $envFile -Leaf)" -ForegroundColor Yellow
        $allEnvReady = $false
    }
}

Write-Host ""
if ($allEnvReady) {
    Write-Host "════════════════════════════════════════" -ForegroundColor Green
    Write-Host "✓ SETUP COMPLETE!" -ForegroundColor Green
    Write-Host "════════════════════════════════════════" -ForegroundColor Green
} else {
    Write-Host "════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "⚠ SETUP COMPLETE (some files missing)" -ForegroundColor Yellow
    Write-Host "════════════════════════════════════════" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  DATABASE SETUP (Required)" -ForegroundColor Yellow
Write-Host "   ├─ Go to: https://app.supabase.com" -ForegroundColor White
Write-Host "   ├─ Select your NexaRecruit project" -ForegroundColor White
Write-Host "   ├─ Click 'SQL Editor' → 'New Query'" -ForegroundColor White
Write-Host "   ├─ Open: database\supabase_migration.sql" -ForegroundColor White
Write-Host "   ├─ Copy all SQL → Paste into editor" -ForegroundColor White
Write-Host "   └─ Click 'Run'" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  START ALL SERVICES" -ForegroundColor Yellow
Write-Host "   └─ Run: .\startup.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "3️⃣  OPEN APPLICATION" -ForegroundColor Yellow
Write-Host "   └─ Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

# Return to project root
Set-Location $projectRoot
