# API Contracts

Complete reference for all API routes in OpenClaw Command Center.

## Contract Endpoint

The machine-readable contract is available at:

```
GET /api/openclaw/contract
```

This endpoint requires **no authentication** and returns the full API schema as JSON. OpenClaw instances can fetch this to auto-configure their integration.

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/openclaw/contract -Method GET
```

---

## Authentication

### POST /api/auth/register

Create a new user account. No authentication required.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response (201):**

```json
{
  "user": {
    "id": "clxyz...",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "workspaceId": "clxyz...",
  "boardId": "clxyz..."
}
```

**Errors:**
- `400` -- Validation failed (missing fields, weak password)
- `409` -- Email already registered

### POST/GET /api/auth/[...nextauth]

NextAuth.js authentication endpoints. Handles sign-in, sign-out, session management, and CSRF tokens.

- `POST /api/auth/callback/credentials` -- Sign in with email/password
- `GET /api/auth/session` -- Get current session
- `POST /api/auth/signout` -- Sign out

---

## Boards

All board endpoints require authentication via session cookie.

### GET /api/boards

List all boards in the user's workspace.

**Response (200):**

```json
[
  {
    "id": "clxyz...",
    "title": "My Board",
    "workspaceId": "clxyz...",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "columns": [
      { "id": "clxyz...", "title": "To Do", "order": 0, "taskCount": 3 },
      { "id": "clxyz...", "title": "In Progress", "order": 1, "taskCount": 1 },
      { "id": "clxyz...", "title": "Done", "order": 2, "taskCount": 5 }
    ]
  }
]
```

### POST /api/boards

Create a new board with default columns (To Do, In Progress, Done).

**Request:**

```json
{
  "title": "Sprint Board"
}
```

**Response (201):**

```json
{
  "id": "clxyz...",
  "title": "Sprint Board",
  "workspaceId": "clxyz...",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "columns": [
    { "id": "...", "title": "To Do", "boardId": "...", "order": 0 },
    { "id": "...", "title": "In Progress", "boardId": "...", "order": 1 },
    { "id": "...", "title": "Done", "boardId": "...", "order": 2 }
  ]
}
```

### GET /api/boards/[boardId]

Get a single board with all columns and tasks.

**Response (200):**

```json
{
  "id": "clxyz...",
  "title": "My Board",
  "workspaceId": "clxyz...",
  "columns": [
    {
      "id": "...",
      "title": "To Do",
      "order": 0,
      "tasks": [
        {
          "id": "...",
          "title": "Implement feature",
          "description": "Details here",
          "priority": "high",
          "labels": "[\"frontend\"]",
          "assignee": "me",
          "order": 0
        }
      ]
    }
  ]
}
```

### PUT /api/boards/[boardId]

Update board properties.

**Request:**

```json
{
  "title": "Renamed Board"
}
```

**Response (200):** Updated board object.

### DELETE /api/boards/[boardId]

Delete a board and all its columns and tasks.

**Response (200):**

```json
{ "success": true }
```

---

## Columns

### GET /api/boards/[boardId]/columns

List columns with tasks for a board.

**Response (200):** Array of column objects with nested tasks.

### POST /api/boards/[boardId]/columns

Create a new column. Order is automatically set to the end.

**Request:**

```json
{
  "title": "Review"
}
```

**Response (201):** Created column object.

### PUT /api/boards/[boardId]/columns

Reorder columns within a board.

**Request:**

```json
{
  "columnIds": ["col-3", "col-1", "col-2"]
}
```

**Response (200):** Array of reordered columns with tasks.

### PUT /api/boards/[boardId]/columns/[columnId]

Update a column's properties (e.g., title).

### DELETE /api/boards/[boardId]/columns/[columnId]

Delete a column and all its tasks.

---

## Tasks

### GET /api/tasks/[taskId]

Get a single task with activities, column info, and OpenClaw job data.

**Response (200):**

```json
{
  "id": "clxyz...",
  "title": "Fix bug",
  "description": "Null pointer in auth flow",
  "priority": "high",
  "labels": "[\"bug\", \"auth\"]",
  "dueDate": "2025-02-01T00:00:00.000Z",
  "assignee": "me",
  "columnId": "clxyz...",
  "order": 0,
  "column": { "id": "...", "title": "In Progress" },
  "activities": [
    { "id": "...", "action": "created", "details": null, "createdAt": "..." }
  ],
  "openclawJob": null
}
```

### PUT /api/tasks/[taskId]

Update task properties. All fields are optional.

**Request:**

```json
{
  "title": "Updated title",
  "description": "New description",
  "priority": "low",
  "labels": ["frontend", "ux"],
  "dueDate": "2025-03-01",
  "assignee": "openclaw_bot"
}
```

**Response (200):** Updated task object.

### DELETE /api/tasks/[taskId]

Delete a task.

**Response (200):**

```json
{ "success": true }
```

### PUT /api/tasks/[taskId]/move

Move a task to a different column and/or reorder within a column.

### GET /api/tasks/[taskId]/activity

Get activity history for a task.

---

## Command Center

### POST /api/command-center/execute

Execute a command through the Command Center. Requires authentication.

**Request:**

```json
{
  "command": "openclaw.health",
  "params": {}
}
```

**Available commands:**

| Command | Description |
|---|---|
| `openclaw.health` | Check OpenClaw connection health |
| `repo.scan` | Scan repository structure and return analysis |
| `md.index` | Index markdown documentation files |
| `routes.validate` | Validate API routes for correctness |
| `tests.run` | Run test suite and return results |
| `wiring.export` | Export wiring pack for deployment |
| `task.sync` | Sync tasks with OpenClaw jobs |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "1.0.0",
    "timestamp": "2025-01-01T00:00:00.000Z"
  },
  "durationMs": 42
}
```

**Error response:**

```json
{
  "success": false,
  "error": "Connection refused",
  "durationMs": 5003
}
```

### GET /api/command-center/history

Get command execution history. Requires authentication.

**Query parameters:**
- `limit` (optional, default 50, max 200)

**Response (200):**

```json
[
  {
    "id": "clxyz...",
    "workspaceId": "clxyz...",
    "command": "openclaw.health",
    "input": "{}",
    "output": "{\"status\":\"ok\"}",
    "status": "success",
    "durationMs": 42,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

## OpenClaw Integration

### GET /api/openclaw/config

Get current OpenClaw configuration. Requires authentication. Token value is never returned (only `hasToken: true/false`).

**Response (200):**

```json
{
  "id": "clxyz...",
  "workspaceId": "clxyz...",
  "baseUrl": "http://localhost:8787",
  "mode": "mock",
  "healthPath": "/health",
  "hasToken": true,
  "lastStatus": "connected",
  "lastLatencyMs": 42,
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### PUT /api/openclaw/config

Update OpenClaw configuration. Requires authentication.

**Request:**

```json
{
  "baseUrl": "http://localhost:8787",
  "token": "oc_live_abc123...",
  "mode": "real",
  "healthPath": "/health"
}
```

**Response (200):**

```json
{
  "config": { "...same shape as GET..." },
  "status": { "status": "ok", "version": "1.0.0" }
}
```

### GET /api/openclaw/health

Check OpenClaw connection status. Requires authentication.

**Response (200):**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "mode": "mock",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### GET /api/openclaw/contract

Machine-readable API contract. **No authentication required.**

See the full contract structure at the top of this document.

### POST /api/openclaw/dispatch

Receive dispatched actions from OpenClaw. Authenticated via `X-OPENCLAW-SECRET` header.

**Headers:**

```
X-OPENCLAW-SECRET: your-webhook-secret
```

**Request:**

```json
{
  "action": "task.create",
  "payload": {
    "title": "New task from OpenClaw",
    "boardId": "clxyz..."
  }
}
```

**Response (200):**

```json
{
  "acknowledged": true,
  "action": "task.create",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## Webhook Contracts

Webhook endpoints are called by OpenClaw to push data into Command Center. They authenticate via the `X-OPENCLAW-SECRET` header.

### POST /api/openclaw/webhook/job-status

Receive job status updates from OpenClaw.

**Headers:**

```
X-OPENCLAW-SECRET: your-webhook-secret
Content-Type: application/json
```

**Request:**

```json
{
  "jobId": "job-abc-123",
  "status": "completed",
  "result": { "filesProcessed": 42 },
  "error": null
}
```

**Status values:** `pending`, `running`, `completed`, `failed`, `cancelled`

**Response (200):**

```json
{ "received": true }
```

**Errors:**
- `401` -- Missing or invalid `X-OPENCLAW-SECRET`
- `400` -- Validation failed
- `404` -- Job not found

### POST /api/openclaw/webhook/log

Receive log entries from OpenClaw jobs.

**Headers:**

```
X-OPENCLAW-SECRET: your-webhook-secret
Content-Type: application/json
```

**Request:**

```json
{
  "jobId": "job-abc-123",
  "level": "info",
  "message": "Processing file 3 of 42...",
  "timestamp": "2025-01-01T00:00:05.000Z"
}
```

**Level values:** `info`, `warn`, `error`, `debug`

**Response (200):**

```json
{ "received": true }
```

---

## Diagnostics

### GET /api/diagnostics

Get system diagnostics. Requires authentication.

**Response (200):**

```json
{
  "timestamp": "2025-01-01T00:00:00.000Z",
  "database": {
    "connected": true,
    "error": null,
    "stats": { "boards": 3, "tasks": 15, "commandLogs": 42 }
  },
  "environment": {
    "variables": [
      { "name": "DATABASE_URL", "set": true },
      { "name": "NEXTAUTH_SECRET", "set": true }
    ],
    "missingCount": 0
  },
  "openclawConfig": {
    "mode": "mock",
    "hasBaseUrl": true,
    "hasToken": false,
    "lastStatus": null
  },
  "routes": {
    "total": 18,
    "list": [
      { "path": "/api/auth/register", "methods": ["POST"] }
    ]
  },
  "contract": {
    "url": "/api/openclaw/contract",
    "method": "GET",
    "description": "Machine-readable API contract (no auth required)"
  },
  "workspace": { "id": "clxyz...", "name": "My Workspace" }
}
```

---

## curl Examples

**Register a user:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

**Get the API contract:**

```bash
curl http://localhost:3000/api/openclaw/contract | jq .
```

**Execute a command (requires session cookie):**

```bash
curl -X POST http://localhost:3000/api/command-center/execute \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<your-session-token>" \
  -d '{"command":"openclaw.health","params":{}}'
```

**Send a webhook:**

```bash
curl -X POST http://localhost:3000/api/openclaw/webhook/job-status \
  -H "Content-Type: application/json" \
  -H "X-OPENCLAW-SECRET: your-webhook-secret-here" \
  -d '{"jobId":"job-001","status":"completed","result":{"ok":true}}'
```

**Get diagnostics (requires session cookie):**

```bash
curl http://localhost:3000/api/diagnostics \
  -H "Cookie: next-auth.session-token=<your-session-token>" | jq .
```
