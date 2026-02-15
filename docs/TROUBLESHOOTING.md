# Troubleshooting

Common issues and their solutions for OpenClaw Command Center.

---

## Database Issues

### "Cannot connect to database"

**SQLite (default):**

1. Check that `DATABASE_URL` in `.env` is set to `file:./dev.db`
2. Ensure the `prisma/` directory exists and is writable
3. Regenerate the database:
   ```powershell
   npx prisma db push
   ```
4. If the database file is corrupted, reset it:
   ```powershell
   .\scripts\db-reset.ps1
   ```

**PostgreSQL:**

1. Verify Docker is running:
   ```powershell
   docker ps
   ```
2. Check that the PostgreSQL container is up:
   ```powershell
   docker compose logs postgres
   ```
3. Verify the connection string in `.env` matches `docker-compose.yml` credentials:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/openclaw_cc?schema=public"
   ```
4. Test the connection directly:
   ```powershell
   docker exec openclaw-cc-db psql -U postgres -d openclaw_cc -c "SELECT 1"
   ```

### "Prisma client is out of date"

After pulling new code or changing `schema.prisma`:

```powershell
npx prisma generate
npx prisma db push
```

### "Migration failed" or schema push errors

If the schema push conflicts with existing data:

```powershell
# WARNING: This deletes all data
.\scripts\db-reset.ps1
```

---

## OpenClaw Connection Issues

### "OpenClaw not reachable"

1. **Check if the process is running:**
   ```powershell
   Get-Process | Where-Object {
       $_.ProcessName -like "*openclaw*" -or
       $_.ProcessName -like "*wrangler*" -or
       $_.ProcessName -like "*miniflare*"
   }
   ```

2. **Check if the port is accessible:**
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 8787
   ```

3. **Test the health endpoint directly:**
   ```powershell
   Invoke-RestMethod -Uri http://localhost:8787/health -Method GET
   ```

4. **Verify settings in Command Center:**
   - Go to Settings and confirm the Base URL is correct
   - Ensure Mode is set to `real` (not `mock`)
   - Check that the API token is entered

5. **Start OpenClaw if needed:**
   ```powershell
   cd path\to\openclaw
   npx wrangler dev
   ```

### "Health check returns error but OpenClaw is running"

- Verify the health path matches your OpenClaw configuration (default: `/health`)
- Check OpenClaw logs for startup errors
- Ensure the API token has the required permissions

### "Commands work in mock mode but fail in real mode"

- Mock mode returns simulated responses; real mode connects to an actual OpenClaw instance
- Ensure OpenClaw is running and accessible
- Check the OpenClaw logs for errors processing the command

---

## Webhook Issues

### "Webhook verification failed" (401 error)

The `X-OPENCLAW-SECRET` header does not match.

1. Check `OPENCLAW_WEBHOOK_SECRET` in your Command Center `.env` file
2. Ensure the same secret is configured in OpenClaw
3. The secret is case-sensitive and must match exactly
4. Test manually:
   ```powershell
   $headers = @{ "X-OPENCLAW-SECRET" = "your-secret-here" }
   $body = '{"jobId":"test","status":"completed"}'
   Invoke-RestMethod -Uri http://localhost:3000/api/openclaw/webhook/job-status `
       -Method POST -Headers $headers -Body $body -ContentType "application/json"
   ```

### "Job not found" (404 on webhook)

The webhook references a `jobId` that does not exist in the Command Center database. Jobs are created when tasks are dispatched to OpenClaw via the `task.sync` command. Ensure:

1. The task exists and has been synced
2. The `jobId` in the webhook payload matches the one assigned during dispatch

### Webhooks are not being received

1. Check that Command Center is running and accessible from where OpenClaw is hosted
2. If OpenClaw is in Docker or on another machine, `localhost` in the webhook URL will not work -- use the actual IP or hostname
3. Check firewall rules for port 3000
4. Verify the webhook URL in OpenClaw's configuration points to the correct Command Center instance

---

## Authentication Issues

### "Token encryption error"

1. Check that `ENCRYPTION_KEY` is set in `.env`
2. The key must be exactly 32 hexadecimal characters (e.g., `0123456789abcdef0123456789abcdef`)
3. If you changed the encryption key after saving tokens, previously encrypted tokens are invalid -- re-enter the API token in Settings

### "Unauthorized" on all API calls

1. Your session may have expired -- sign out and sign back in
2. Check that `NEXTAUTH_SECRET` is set in `.env`
3. If you changed `NEXTAUTH_SECRET`, all existing sessions are invalidated -- sign in again

### Cannot register or login

1. Ensure the database is accessible (see Database Issues above)
2. Check the browser console for JavaScript errors
3. Clear browser cookies for `localhost:3000` and try again

---

## Build Errors

### TypeScript compilation errors

```powershell
# Check for lint and type issues
npx next lint
```

Fix the reported issues before building.

### "Module not found" errors

```powershell
# Reinstall dependencies
Remove-Item -Recurse -Force node_modules
npm install
npx prisma generate
```

### Next.js build fails with environment variable errors

Some environment variables are required at build time. Set them before building:

```powershell
$env:DATABASE_URL = "file:./dev.db"
$env:NEXTAUTH_SECRET = "build-time-secret"
$env:ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef"
$env:OPENCLAW_WEBHOOK_SECRET = "build-time-secret"
npx next build
```

Or use `.\scripts\build.ps1` which handles Prisma generation automatically.

---

## Port Conflicts

### Port 3000 is already in use

Find what is using the port:

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
    Select-Object OwningProcess |
    ForEach-Object { Get-Process -Id $_.OwningProcess }
```

Options:
- Stop the conflicting process
- Start on a different port: `npx next dev -p 3001`
- Update `NEXTAUTH_URL` in `.env` if you change the port

### Port 5432 is already in use (PostgreSQL)

Another PostgreSQL instance or service is using the port:

```powershell
Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue |
    Select-Object OwningProcess |
    ForEach-Object { Get-Process -Id $_.OwningProcess }
```

Options:
- Stop the conflicting service
- Change the port mapping in `docker-compose.yml`:
  ```yaml
  ports:
    - "5433:5432"
  ```
  Then update `DATABASE_URL` to use port 5433

---

## Playwright Test Issues

### Tests fail to start

1. Install Playwright browsers:
   ```powershell
   npx playwright install --with-deps chromium
   ```

2. Ensure no other process is using port 3000

3. Check that the database is set up:
   ```powershell
   npx prisma db push
   ```

### Tests pass locally but fail in CI

- CI uses a fresh database; ensure test setup creates necessary data
- CI runs with `retries: 2` to handle flaky tests
- Check the Playwright report artifact uploaded by the CI workflow

### Timeout errors in tests

- Increase timeout in `playwright.config.ts` if needed
- Ensure the dev server starts quickly (check for slow database connections)
- Verify `webServer.url` matches the actual dev server address

---

## General Tips

### View all diagnostics at once

Navigate to the diagnostics endpoint (requires authentication):

```powershell
# After logging in, use the session cookie
Invoke-RestMethod -Uri http://localhost:3000/api/diagnostics `
    -Headers @{ Cookie = "next-auth.session-token=<your-token>" }
```

Or use the UI: check the Command Center panel for system status.

### Reset everything to a clean state

```powershell
# Stop all servers
# Remove database
Remove-Item "prisma/dev.db" -Force -ErrorAction SilentlyContinue
# Remove node_modules
Remove-Item -Recurse -Force node_modules
# Clean install
npm install
npx prisma generate
npx prisma db push
```

### Check environment variable status

The diagnostics endpoint reports which environment variables are set or missing. You can also check manually:

```powershell
@("DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL", "ENCRYPTION_KEY", "OPENCLAW_WEBHOOK_SECRET") | ForEach-Object {
    $val = [Environment]::GetEnvironmentVariable($_)
    if ($val) { Write-Host "$_ = SET" -ForegroundColor Green }
    else { Write-Host "$_ = NOT SET" -ForegroundColor Red }
}
```
