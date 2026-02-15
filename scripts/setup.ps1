# OpenClaw Command Center — Setup Script
Write-Host "=== OpenClaw Command Center Setup ===" -ForegroundColor Cyan

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js $(node --version) found" -ForegroundColor Green

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed" -ForegroundColor Red; exit 1 }

# Copy .env if not exists
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "Created .env from .env.example — please edit with your settings" -ForegroundColor Yellow
} else {
    Write-Host ".env already exists" -ForegroundColor Green
}

# Generate Prisma client and push schema
Write-Host "Setting up database..." -ForegroundColor Yellow
npx prisma generate
npx prisma db push
if ($LASTEXITCODE -ne 0) { Write-Host "Database setup failed" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host "Run '.\scripts\dev.ps1' to start development server" -ForegroundColor Cyan

# OpenClaw discovery helper
Write-Host ""
Write-Host "=== OpenClaw Discovery ===" -ForegroundColor Magenta
Write-Host "To find a running OpenClaw instance:" -ForegroundColor Yellow
Write-Host '  Get-Process | Where-Object { $_.ProcessName -like "*openclaw*" -or $_.ProcessName -like "*wrangler*" -or $_.ProcessName -like "*miniflare*" }' -ForegroundColor Gray
Write-Host ""
Write-Host "To check if OpenClaw port is available:" -ForegroundColor Yellow
Write-Host '  Test-NetConnection -ComputerName localhost -Port 8787' -ForegroundColor Gray
Write-Host ""
Write-Host "To start OpenClaw (if you have the project):" -ForegroundColor Yellow
Write-Host '  cd path\to\openclaw; npx wrangler dev' -ForegroundColor Gray
