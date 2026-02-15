Write-Host "=== Running Tests ===" -ForegroundColor Cyan

Write-Host "Linting..." -ForegroundColor Yellow
npx next lint
if ($LASTEXITCODE -ne 0) { Write-Host "Lint failed" -ForegroundColor Red; exit 1 }

Write-Host "Running Playwright tests..." -ForegroundColor Yellow
npx playwright test
if ($LASTEXITCODE -ne 0) { Write-Host "E2E tests failed" -ForegroundColor Red; exit 1 }

Write-Host "=== All Tests Passed ===" -ForegroundColor Green
