Write-Host "Building OpenClaw Command Center..." -ForegroundColor Cyan
npx prisma generate
npx next build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed" -ForegroundColor Red; exit 1 }
Write-Host "Build complete!" -ForegroundColor Green
