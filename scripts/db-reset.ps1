Write-Host "WARNING: This will DELETE all data and recreate the database!" -ForegroundColor Red
$confirm = Read-Host "Type 'yes' to confirm"
if ($confirm -ne "yes") {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 0
}

# Remove SQLite database
if (Test-Path "prisma/dev.db") {
    Remove-Item "prisma/dev.db" -Force
    Write-Host "Removed SQLite database" -ForegroundColor Yellow
}

# Recreate
npx prisma db push
Write-Host "Database recreated!" -ForegroundColor Green
