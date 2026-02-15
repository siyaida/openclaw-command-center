export function getWebhooks(): string {
  return `# OpenClaw Command Center — Webhooks

This document defines the webhook endpoints that OpenClaw uses to push status updates and logs back to the Command Center. Both endpoints require authentication via the \`X-OPENCLAW-SECRET\` header.

---

## Authentication

All webhook endpoints authenticate using a shared secret passed in the \`X-OPENCLAW-SECRET\` HTTP header. This secret must match the \`OPENCLAW_WEBHOOK_SECRET\` environment variable configured on the Command Center server.

| Header              | Required | Description                              |
|---------------------|----------|------------------------------------------|
| \`X-OPENCLAW-SECRET\` | Yes    | Shared secret for webhook authentication |
| \`Content-Type\`      | Yes    | Must be \`application/json\`             |

**Failure mode**: If the secret is missing or does not match, the endpoint returns \`401 Unauthorized\`.

---

## Webhook 1: Job Status Updates

### Endpoint
\`\`\`
POST /api/openclaw/webhook/job-status
\`\`\`

### Purpose
Called by OpenClaw whenever a job's status changes. The Command Center uses this to update the local \`OpenClawJob\` record and move the corresponding Kanban task to the appropriate column.

### Request Payload Schema

| Field    | Type   | Required | Description                                       |
|----------|--------|----------|---------------------------------------------------|
| \`jobId\`  | string | Yes      | The OpenClaw job identifier                     |
| \`status\` | string | Yes      | New status: \`"pending"\`, \`"running"\`, \`"completed"\`, \`"failed"\`, or \`"cancelled"\` |
| \`result\` | any    | No       | Result data (present when status is \`"completed"\`) |
| \`error\`  | string | No       | Error message (present when status is \`"failed"\`)  |

### Full JSON Schema
\`\`\`json
{
  "type": "object",
  "required": ["jobId", "status"],
  "properties": {
    "jobId": {
      "type": "string",
      "minLength": 1,
      "description": "The unique job identifier from OpenClaw"
    },
    "status": {
      "type": "string",
      "enum": ["pending", "running", "completed", "failed", "cancelled"],
      "description": "The new status of the job"
    },
    "result": {
      "description": "Arbitrary JSON result payload, present on completion"
    },
    "error": {
      "type": "string",
      "description": "Error description, present on failure"
    }
  }
}
\`\`\`

### Response

**Success (200)**
\`\`\`json
{ "received": true }
\`\`\`

**Job Not Found (404)**
\`\`\`json
{ "error": "Job not found" }
\`\`\`

**Validation Failed (400)**
\`\`\`json
{
  "error": "Validation failed",
  "details": { "fieldErrors": { "status": ["Invalid enum value"] }, "formErrors": [] }
}
\`\`\`

**Unauthorized (401)**
\`\`\`json
{ "error": "Unauthorized" }
\`\`\`

### Examples

**Job started running:**
\`\`\`bash
curl -X POST http://localhost:3000/api/openclaw/webhook/job-status \\
  -H "Content-Type: application/json" \\
  -H "X-OPENCLAW-SECRET: your-webhook-secret" \\
  -d '{
    "jobId": "job-001",
    "status": "running"
  }'
\`\`\`

**Job completed with result:**
\`\`\`bash
curl -X POST http://localhost:3000/api/openclaw/webhook/job-status \\
  -H "Content-Type: application/json" \\
  -H "X-OPENCLAW-SECRET: your-webhook-secret" \\
  -d '{
    "jobId": "job-001",
    "status": "completed",
    "result": {
      "files": 42,
      "languages": ["TypeScript", "CSS"],
      "summary": "Repository scan complete.",
      "issues": [],
      "recommendations": ["Add integration tests"]
    }
  }'
\`\`\`

**Job failed with error:**
\`\`\`bash
curl -X POST http://localhost:3000/api/openclaw/webhook/job-status \\
  -H "Content-Type: application/json" \\
  -H "X-OPENCLAW-SECRET: your-webhook-secret" \\
  -d '{
    "jobId": "job-001",
    "status": "failed",
    "error": "Repository path not found: /nonexistent/path"
  }'
\`\`\`

**Job cancelled:**
\`\`\`bash
curl -X POST http://localhost:3000/api/openclaw/webhook/job-status \\
  -H "Content-Type: application/json" \\
  -H "X-OPENCLAW-SECRET: your-webhook-secret" \\
  -d '{
    "jobId": "job-001",
    "status": "cancelled"
  }'
\`\`\`

---

## Webhook 2: Job Logs

### Endpoint
\`\`\`
POST /api/openclaw/webhook/log
\`\`\`

### Purpose
Called by OpenClaw to stream log entries for a running job. The Command Center stores these in the \`CommandLog\` table for auditability and displays them in the task activity feed.

### Request Payload Schema

| Field       | Type   | Required | Description                                 |
|-------------|--------|----------|---------------------------------------------|
| \`jobId\`     | string | Yes      | The OpenClaw job identifier               |
| \`level\`     | string | Yes      | Log level: \`"info"\`, \`"warn"\`, \`"error"\`, or \`"debug"\` |
| \`message\`   | string | Yes      | The log message content                   |
| \`timestamp\` | string | No       | ISO 8601 timestamp of the log entry       |

### Full JSON Schema
\`\`\`json
{
  "type": "object",
  "required": ["jobId", "level", "message"],
  "properties": {
    "jobId": {
      "type": "string",
      "minLength": 1,
      "description": "The unique job identifier from OpenClaw"
    },
    "level": {
      "type": "string",
      "enum": ["info", "warn", "error", "debug"],
      "description": "Severity level of the log entry"
    },
    "message": {
      "type": "string",
      "minLength": 1,
      "description": "The log message content"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp, defaults to server time if omitted"
    }
  }
}
\`\`\`

### Response

**Success (200)**
\`\`\`json
{ "received": true }
\`\`\`

**Job Not Found (404)**
\`\`\`json
{ "error": "Job not found" }
\`\`\`

**Validation Failed (400)**
\`\`\`json
{
  "error": "Validation failed",
  "details": { "fieldErrors": { "level": ["Invalid enum value"] }, "formErrors": [] }
}
\`\`\`

**Unauthorized (401)**
\`\`\`json
{ "error": "Unauthorized" }
\`\`\`

### Examples

**Info log:**
\`\`\`bash
curl -X POST http://localhost:3000/api/openclaw/webhook/log \\
  -H "Content-Type: application/json" \\
  -H "X-OPENCLAW-SECRET: your-webhook-secret" \\
  -d '{
    "jobId": "job-001",
    "level": "info",
    "message": "Starting repository scan at /home/user/project",
    "timestamp": "2025-01-15T10:30:00Z"
  }'
\`\`\`

**Warning log:**
\`\`\`bash
curl -X POST http://localhost:3000/api/openclaw/webhook/log \\
  -H "Content-Type: application/json" \\
  -H "X-OPENCLAW-SECRET: your-webhook-secret" \\
  -d '{
    "jobId": "job-001",
    "level": "warn",
    "message": "Large file detected: dist/bundle.js (15MB), skipping binary analysis",
    "timestamp": "2025-01-15T10:30:05Z"
  }'
\`\`\`

**Error log:**
\`\`\`bash
curl -X POST http://localhost:3000/api/openclaw/webhook/log \\
  -H "Content-Type: application/json" \\
  -H "X-OPENCLAW-SECRET: your-webhook-secret" \\
  -d '{
    "jobId": "job-001",
    "level": "error",
    "message": "Permission denied reading file: /etc/shadow",
    "timestamp": "2025-01-15T10:30:10Z"
  }'
\`\`\`

**Debug log:**
\`\`\`bash
curl -X POST http://localhost:3000/api/openclaw/webhook/log \\
  -H "Content-Type: application/json" \\
  -H "X-OPENCLAW-SECRET: your-webhook-secret" \\
  -d '{
    "jobId": "job-001",
    "level": "debug",
    "message": "Processing file 23/42: src/lib/openclaw/client.ts",
    "timestamp": "2025-01-15T10:30:15Z"
  }'
\`\`\`

---

## Configuration

### Environment Variables

| Variable                  | Description                                  | Example                |
|---------------------------|----------------------------------------------|------------------------|
| \`OPENCLAW_WEBHOOK_SECRET\` | Shared secret for webhook authentication   | \`whsec_abc123def456\`  |

### Setting Up in OpenClaw

When configuring your OpenClaw instance to communicate with the Command Center, register these webhook URLs:

1. **Job Status Webhook**: \`https://your-domain.com/api/openclaw/webhook/job-status\`
2. **Log Webhook**: \`https://your-domain.com/api/openclaw/webhook/log\`

Both must include the \`X-OPENCLAW-SECRET\` header with the same value as your Command Center's \`OPENCLAW_WEBHOOK_SECRET\` environment variable.

### Testing Connectivity

You can verify the webhooks are properly configured by sending a test request:

\`\`\`bash
# Test that authentication works (should return 200 with validation error, not 401)
curl -X POST http://localhost:3000/api/openclaw/webhook/job-status \\
  -H "Content-Type: application/json" \\
  -H "X-OPENCLAW-SECRET: your-webhook-secret" \\
  -d '{}' \\
  -w "\\nHTTP Status: %{http_code}\\n"
\`\`\`

Expected output: HTTP Status 400 (validation error because required fields are missing, but not 401, confirming the secret is correct).

---

## Rate Limits and Best Practices

1. **Batch logs**: If possible, batch multiple log entries rather than sending one per line
2. **Idempotency**: The job-status webhook is idempotent -- sending the same status update twice has no additional effect
3. **Ordering**: Webhook delivery order is not guaranteed. The Command Center handles out-of-order status updates gracefully by only applying forward state transitions
4. **Timeouts**: The Command Center will respond within 5 seconds. If your request times out, retry with exponential backoff
5. **Payload size**: Keep webhook payloads under 1MB. For large results, consider storing them externally and passing a reference URL
`;
}
