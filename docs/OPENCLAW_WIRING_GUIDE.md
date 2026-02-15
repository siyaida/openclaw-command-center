# OpenClaw Wiring Guide

Step-by-step instructions for connecting OpenClaw Command Center to an OpenClaw instance.

## What is OpenClaw Command Center?

OpenClaw Command Center is a full-stack Kanban board application with a built-in command panel that integrates with OpenClaw. It provides:

- **Kanban boards** for task management with drag-and-drop columns
- **Command Center panel** for executing commands against OpenClaw (health checks, repo scanning, test running, etc.)
- **Webhook receivers** so OpenClaw can push job status updates and logs back
- **Wiring Pack export** to configure OpenClaw with the correct endpoints and schemas
- **Mock mode** for development and testing without a live OpenClaw instance

## Architecture Overview

```
+---------------------------+          +------------------+
|  OpenClaw Command Center  |          |    OpenClaw       |
|                           |          |    (Cloudflare    |
|  [Browser UI]             |          |     Worker)       |
|    |                      |          |                  |
|  [Next.js API]            |  REST    |                  |
|    |--- /api/command-     |--------->|  /health         |
|    |    center/execute    |          |  /api/...        |
|    |                      |          |                  |
|    |<-- /api/openclaw/    |<---------|  Webhooks        |
|    |    webhook/job-status|          |                  |
|    |<-- /api/openclaw/    |<---------|                  |
|    |    webhook/log       |          |                  |
|    |                      |          |                  |
|  [SQLite / PostgreSQL]    |          |  [Durable Objects]|
+---------------------------+          +------------------+
```

**Outbound**: Command Center sends commands to OpenClaw via its REST API.
**Inbound**: OpenClaw sends webhook callbacks to Command Center for job status updates and log entries.

## Step 1: Start in Mock Mode

When you first register, your workspace is configured in **mock mode**. This means all commands return simulated responses without contacting any external service.

1. Register at `http://localhost:3000`
2. Open the Command Center panel (terminal icon in the sidebar)
3. Run `openclaw.health` -- you should see a mock success response

Mock mode is useful for:
- Learning the command interface
- Developing UI features without a running OpenClaw
- Running automated tests

## Step 2: Find Your OpenClaw Instance

Before wiring up, you need a running OpenClaw instance. Use these PowerShell commands to discover one:

**Check if an OpenClaw process is running:**

```powershell
Get-Process | Where-Object {
    $_.ProcessName -like "*openclaw*" -or
    $_.ProcessName -like "*wrangler*" -or
    $_.ProcessName -like "*miniflare*"
}
```

**Test if the default OpenClaw port (8787) is reachable:**

```powershell
Test-NetConnection -ComputerName localhost -Port 8787
```

**Try hitting the health endpoint directly:**

```powershell
Invoke-RestMethod -Uri http://localhost:8787/health -Method GET
```

**If OpenClaw is not running**, start it from your OpenClaw project:

```powershell
cd path\to\openclaw
npx wrangler dev
```

## Step 3: Configure Connection in Settings

1. In Command Center, go to **Settings** (gear icon)
2. Under **OpenClaw Connection**, fill in:
   - **Base URL**: `http://localhost:8787` (or wherever your OpenClaw is running)
   - **API Token**: Your OpenClaw API token (stored encrypted at rest)
   - **Health Path**: `/health` (default, change only if your OpenClaw uses a different path)
   - **Mode**: Switch from `mock` to `real`
3. Click **Save**

The system will immediately test the connection and display the result.

## Step 4: Test Connection

After saving the configuration:

1. Open the Command Center panel
2. Run `openclaw.health`
3. You should see a real response with:
   - `status: "ok"`
   - `version`: the OpenClaw version string
   - `timestamp`: current server time
   - `durationMs`: actual round-trip latency

If the health check fails, see the Troubleshooting section below.

## Step 5: Export Wiring Pack

The Wiring Pack is a ZIP file containing everything OpenClaw needs to call back into Command Center.

1. In the Command Center panel, run `wiring.export`
2. Download the generated ZIP file
3. The pack contains:
   - `contract.json` -- full API contract with all endpoints and schemas
   - `system-prompt.txt` -- system prompt fragment for configuring OpenClaw's AI agent
   - `webhook-config.json` -- webhook endpoint URLs and authentication details
   - `README.md` -- instructions for applying the pack

## Step 6: Apply Wiring Pack to OpenClaw

Follow the instructions in the Wiring Pack README:

1. Extract the ZIP into your OpenClaw project
2. Add the webhook configuration to your OpenClaw environment:
   ```
   COMMAND_CENTER_URL=http://localhost:3000
   COMMAND_CENTER_WEBHOOK_SECRET=<your OPENCLAW_WEBHOOK_SECRET value>
   ```
3. Include the system prompt fragment in your OpenClaw agent configuration
4. Restart OpenClaw: `npx wrangler dev`

## Step 7: Validate with Contract Endpoint

The contract endpoint is publicly accessible and machine-readable:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/openclaw/contract -Method GET | ConvertTo-Json -Depth 10
```

This returns the full API contract including:
- All available commands with request/response schemas
- Webhook endpoints with payload schemas
- Dispatch endpoint details
- Health check endpoint

OpenClaw can fetch this contract to auto-configure its integration.

## Step 8: Test Webhooks

Simulate a webhook from OpenClaw to verify the connection works end-to-end:

**Test job status webhook:**

```powershell
$headers = @{ "X-OPENCLAW-SECRET" = "your-webhook-secret-here" }
$body = @{
    jobId = "test-job-001"
    status = "completed"
    result = @{ message = "Test complete" }
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/openclaw/webhook/job-status -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

**Test log webhook:**

```powershell
$headers = @{ "X-OPENCLAW-SECRET" = "your-webhook-secret-here" }
$body = @{
    jobId = "test-job-001"
    level = "info"
    message = "Webhook test successful"
    timestamp = (Get-Date -Format o)
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/openclaw/webhook/log -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

## Troubleshooting Connection Issues

### "OpenClaw not reachable"

1. Verify the OpenClaw process is running (see Step 2)
2. Check the base URL in Settings matches the actual address
3. Test connectivity manually:
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 8787
   ```
4. If using Docker, ensure the container is running and ports are mapped correctly

### "Health check returned error"

1. Confirm the health path is correct (default: `/health`)
2. Check OpenClaw logs for errors
3. Verify the API token is valid and has the required permissions

### "Webhook verification failed" (401 from Command Center)

1. Ensure `OPENCLAW_WEBHOOK_SECRET` in Command Center `.env` matches the secret configured in OpenClaw
2. The secret is sent in the `X-OPENCLAW-SECRET` header

### "Token encryption error"

1. Verify `ENCRYPTION_KEY` is set in `.env` and is exactly 32 hex characters
2. If you changed the key after saving tokens, you need to re-enter the API token in Settings

### "Connection works in browser but not from OpenClaw"

1. If Command Center and OpenClaw are on different machines, replace `localhost` with the actual IP or hostname
2. Check firewall rules allow inbound connections on port 3000
3. If behind a reverse proxy, ensure WebSocket support is enabled

### Latency is very high

1. Check network path between Command Center and OpenClaw
2. For local development, both should be on `localhost`
3. Monitor with `openclaw.health` -- the `durationMs` field shows round-trip time
