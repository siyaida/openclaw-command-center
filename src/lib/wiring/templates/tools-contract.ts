export function getToolsContract(): string {
  return `# OpenClaw Command Center — Tools Contract

This document defines the complete API contract for every tool available in the OpenClaw Command Center. Each tool includes its name, endpoint, HTTP method, request schema, response schema, and working examples.

---

## 1. openclaw.health

**Description**: Check connectivity and system status of the OpenClaw integration.

| Field    | Value                     |
|----------|---------------------------|
| Name     | \`openclaw.health\`       |
| Endpoint | \`GET /api/openclaw/health\` |
| Method   | GET                       |

### Request Schema
\`\`\`json
{}
\`\`\`
No request body required. This is a simple GET request.

### Response Schema
\`\`\`json
{
  "status": { "type": "string", "enum": ["connected", "disconnected", "misconfigured"] },
  "mode": { "type": "string", "enum": ["mock", "real"] },
  "latencyMs": { "type": "number", "description": "Round-trip latency in milliseconds" },
  "version": { "type": "string", "description": "OpenClaw server version" },
  "error": { "type": "string", "description": "Error message if status is not connected", "optional": true }
}
\`\`\`

### Example Request
\`\`\`
GET /api/openclaw/health HTTP/1.1
Host: localhost:3000
Authorization: Bearer <session-token>
\`\`\`

### Example Response
\`\`\`json
{
  "status": "connected",
  "mode": "mock",
  "latencyMs": 12,
  "version": "0.1.0-mock"
}
\`\`\`

---

## 2. repo.scan

**Description**: Scan a repository and return a summary of its structure, languages, issues, and recommendations.

| Field    | Value                                  |
|----------|----------------------------------------|
| Name     | \`repo.scan\`                          |
| Endpoint | \`POST /api/command-center/execute\`   |
| Method   | POST                                   |

### Request Schema
\`\`\`json
{
  "command": "repo.scan",
  "params": {
    "repoPath": { "type": "string", "description": "Absolute or relative path to the repository root" },
    "focus": { "type": "string", "description": "Area to focus on: 'structure', 'security', 'performance', 'all'" }
  }
}
\`\`\`

### Response Schema
\`\`\`json
{
  "files": { "type": "number", "description": "Total number of files scanned" },
  "languages": { "type": "array", "items": "string", "description": "Detected programming languages" },
  "summary": { "type": "string", "description": "Human-readable summary of the repository" },
  "issues": { "type": "array", "items": "string", "description": "Identified issues or warnings" },
  "recommendations": { "type": "array", "items": "string", "description": "Actionable improvement suggestions" }
}
\`\`\`

### Example Request
\`\`\`json
{
  "command": "repo.scan",
  "params": {
    "repoPath": "/home/user/projects/my-app",
    "focus": "structure"
  }
}
\`\`\`

### Example Response
\`\`\`json
{
  "success": true,
  "data": {
    "files": 42,
    "languages": ["TypeScript", "CSS", "JSON"],
    "summary": "Next.js application with Prisma ORM, 42 files scanned.",
    "issues": ["No test coverage for webhook handlers"],
    "recommendations": ["Add unit tests for API routes", "Consider adding rate limiting"]
  },
  "durationMs": 320
}
\`\`\`

---

## 3. md.index

**Description**: Index all markdown documentation files under a given root directory.

| Field    | Value                                  |
|----------|----------------------------------------|
| Name     | \`md.index\`                           |
| Endpoint | \`POST /api/command-center/execute\`   |
| Method   | POST                                   |

### Request Schema
\`\`\`json
{
  "command": "md.index",
  "params": {
    "mdRoot": { "type": "string", "description": "Root directory to search for markdown files" },
    "includePatterns": { "type": "array", "items": "string", "description": "Glob patterns to include, e.g. ['**/*.md', 'docs/**/*.mdx']" }
  }
}
\`\`\`

### Response Schema
\`\`\`json
{
  "documents": { "type": "number", "description": "Total number of markdown documents found" },
  "index": {
    "type": "array",
    "items": {
      "path": { "type": "string", "description": "Relative path to the document" },
      "title": { "type": "string", "description": "Extracted document title (first H1 or filename)" },
      "sections": { "type": "number", "description": "Number of heading sections in the document" }
    }
  }
}
\`\`\`

### Example Request
\`\`\`json
{
  "command": "md.index",
  "params": {
    "mdRoot": "./docs",
    "includePatterns": ["**/*.md"]
  }
}
\`\`\`

### Example Response
\`\`\`json
{
  "success": true,
  "data": {
    "documents": 5,
    "index": [
      { "path": "README.md", "title": "OpenClaw Command Center", "sections": 8 },
      { "path": "docs/DEPLOYMENT_ONPREM.md", "title": "On-Prem Deployment", "sections": 5 },
      { "path": "docs/OPENCLAW_WIRING_GUIDE.md", "title": "Wiring Guide", "sections": 6 },
      { "path": "docs/CONTRACTS.md", "title": "API Contracts", "sections": 4 },
      { "path": "docs/TROUBLESHOOTING.md", "title": "Troubleshooting", "sections": 3 }
    ]
  },
  "durationMs": 180
}
\`\`\`

---

## 4. routes.validate

**Description**: Validate a set of API routes by checking their availability and expected behavior.

| Field    | Value                                  |
|----------|----------------------------------------|
| Name     | \`routes.validate\`                    |
| Endpoint | \`POST /api/command-center/execute\`   |
| Method   | POST                                   |

### Request Schema
\`\`\`json
{
  "command": "routes.validate",
  "params": {
    "baseUrl": { "type": "string", "description": "Base URL of the application, e.g. 'http://localhost:3000'" },
    "routesList": { "type": "array", "items": "string", "description": "List of route paths to validate" }
  }
}
\`\`\`

### Response Schema
\`\`\`json
{
  "total": { "type": "number", "description": "Total number of routes checked" },
  "valid": { "type": "number", "description": "Number of valid/reachable routes" },
  "invalid": { "type": "number", "description": "Number of invalid/unreachable routes" },
  "routes": {
    "type": "array",
    "items": {
      "path": { "type": "string", "description": "The route path" },
      "methods": { "type": "array", "items": "string", "description": "Supported HTTP methods" },
      "status": { "type": "string", "enum": ["valid", "invalid", "timeout", "error"], "description": "Validation result" }
    }
  }
}
\`\`\`

### Example Request
\`\`\`json
{
  "command": "routes.validate",
  "params": {
    "baseUrl": "http://localhost:3000",
    "routesList": ["/api/boards", "/api/tasks/:id", "/api/openclaw/health", "/api/openclaw/webhook/job-status"]
  }
}
\`\`\`

### Example Response
\`\`\`json
{
  "success": true,
  "data": {
    "total": 4,
    "valid": 4,
    "invalid": 0,
    "routes": [
      { "path": "/api/boards", "methods": ["GET", "POST"], "status": "valid" },
      { "path": "/api/tasks/:id", "methods": ["GET", "PUT", "DELETE"], "status": "valid" },
      { "path": "/api/openclaw/health", "methods": ["GET"], "status": "valid" },
      { "path": "/api/openclaw/webhook/job-status", "methods": ["POST"], "status": "valid" }
    ]
  },
  "durationMs": 540
}
\`\`\`

---

## 5. tests.run

**Description**: Execute a set of test commands and return aggregated results.

| Field    | Value                                  |
|----------|----------------------------------------|
| Name     | \`tests.run\`                          |
| Endpoint | \`POST /api/command-center/execute\`   |
| Method   | POST                                   |

### Request Schema
\`\`\`json
{
  "command": "tests.run",
  "params": {
    "commands": { "type": "array", "items": "string", "description": "Shell commands to execute for testing, e.g. ['npx playwright test', 'npm run lint']" }
  }
}
\`\`\`

### Response Schema
\`\`\`json
{
  "total": { "type": "number", "description": "Total number of test cases" },
  "passed": { "type": "number", "description": "Number of passing tests" },
  "failed": { "type": "number", "description": "Number of failing tests" },
  "duration": { "type": "string", "description": "Total test execution time, e.g. '3.2s'" },
  "results": {
    "type": "array",
    "items": {
      "name": { "type": "string", "description": "Test case name" },
      "status": { "type": "string", "enum": ["passed", "failed", "skipped"], "description": "Individual test result" }
    }
  }
}
\`\`\`

### Example Request
\`\`\`json
{
  "command": "tests.run",
  "params": {
    "commands": ["npx playwright test"]
  }
}
\`\`\`

### Example Response
\`\`\`json
{
  "success": true,
  "data": {
    "total": 8,
    "passed": 7,
    "failed": 1,
    "duration": "4.1s",
    "results": [
      { "name": "auth flow", "status": "passed" },
      { "name": "board CRUD", "status": "passed" },
      { "name": "task drag-drop", "status": "passed" },
      { "name": "command execution", "status": "passed" },
      { "name": "openclaw health", "status": "passed" },
      { "name": "wiring pack export", "status": "passed" },
      { "name": "webhook verification", "status": "failed" },
      { "name": "contract schema", "status": "passed" }
    ]
  },
  "durationMs": 4100
}
\`\`\`

---

## 6. wiring.export

**Description**: Trigger export of the wiring pack ZIP containing all system prompts, tool contracts, and configuration files.

| Field    | Value                                  |
|----------|----------------------------------------|
| Name     | \`wiring.export\`                      |
| Endpoint | \`POST /api/command-center/execute\`   |
| Method   | POST                                   |

### Request Schema
\`\`\`json
{
  "command": "wiring.export",
  "params": {}
}
\`\`\`

### Response Schema
\`\`\`json
{
  "redirect": { "type": "string", "description": "URL path to download the wiring pack ZIP" }
}
\`\`\`

### Example Request
\`\`\`json
{
  "command": "wiring.export",
  "params": {}
}
\`\`\`

### Example Response
\`\`\`json
{
  "success": true,
  "data": {
    "redirect": "/api/openclaw/wiring-pack"
  },
  "durationMs": 5
}
\`\`\`

**Direct Download**: You can also download the wiring pack directly via:
\`\`\`
GET /api/openclaw/wiring-pack
\`\`\`
This returns the ZIP file with \`Content-Type: application/zip\`.

---

## 7. task.sync

**Description**: Synchronize Kanban tasks assigned to openclaw_bot with their corresponding OpenClaw jobs, updating task statuses based on job completion.

| Field    | Value                                  |
|----------|----------------------------------------|
| Name     | \`task.sync\`                          |
| Endpoint | \`POST /api/command-center/execute\`   |
| Method   | POST                                   |

### Request Schema
\`\`\`json
{
  "command": "task.sync",
  "params": {}
}
\`\`\`

### Response Schema
\`\`\`json
{
  "synced": { "type": "number", "description": "Number of tasks synchronized" },
  "tasks": {
    "type": "array",
    "items": {
      "taskId": { "type": "string", "description": "The Kanban task ID" },
      "jobId": { "type": "string", "description": "The corresponding OpenClaw job ID" },
      "status": { "type": "string", "enum": ["synced", "conflict", "orphaned"], "description": "Sync result status" }
    }
  }
}
\`\`\`

### Example Request
\`\`\`json
{
  "command": "task.sync",
  "params": {}
}
\`\`\`

### Example Response
\`\`\`json
{
  "success": true,
  "data": {
    "synced": 3,
    "tasks": [
      { "taskId": "clx1abc", "jobId": "job-001", "status": "synced" },
      { "taskId": "clx2def", "jobId": "job-002", "status": "synced" },
      { "taskId": "clx3ghi", "jobId": "job-003", "status": "orphaned" }
    ]
  },
  "durationMs": 250
}
\`\`\`

---

## Error Handling

All commands wrap their responses in a standard envelope:

\`\`\`json
{
  "success": true | false,
  "data": { ... },
  "error": "Error description if success is false",
  "durationMs": 123
}
\`\`\`

### Common Error Responses

**Unauthorized (401)**
\`\`\`json
{ "error": "Unauthorized" }
\`\`\`

**Validation Failed (400)**
\`\`\`json
{
  "error": "Validation failed",
  "details": {
    "fieldErrors": { "command": ["Invalid enum value"] },
    "formErrors": []
  }
}
\`\`\`

**Unknown Command (400)**
\`\`\`json
{ "error": "Unknown command: invalid.command" }
\`\`\`

**Server Error (500)**
\`\`\`json
{ "error": "Failed to execute command" }
\`\`\`

---

## Authentication

All endpoints (except webhooks) require a valid session. Pass the session token via cookie or Authorization header. Webhook endpoints authenticate via the \`X-OPENCLAW-SECRET\` header instead.
`;
}
