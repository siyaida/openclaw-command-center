Write-Host "Starting OpenClaw Command Center (production)..." -ForegroundColor Cyan
$env:NODE_ENV = "production"
npx next start
