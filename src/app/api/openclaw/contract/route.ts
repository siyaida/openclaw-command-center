import { NextResponse } from "next/server";

export async function GET() {
  const contract = {
    version: "1.0.0",
    name: "openclaw-command-center",
    description: "Kanban Command Center API contract for OpenClaw integration",
    commands: [
      {
        name: "openclaw.health",
        endpoint: "/api/command-center/execute",
        method: "POST",
        requestSchema: {
          type: "object",
          properties: {
            command: { type: "string", const: "openclaw.health" },
            params: { type: "object" },
          },
          required: ["command"],
        },
        responseSchema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["ok", "error"] },
                version: { type: "string" },
                timestamp: { type: "string" },
              },
            },
            durationMs: { type: "number" },
          },
        },
        description: "Check OpenClaw connection health",
      },
      {
        name: "repo.scan",
        endpoint: "/api/command-center/execute",
        method: "POST",
        requestSchema: {
          type: "object",
          properties: {
            command: { type: "string", const: "repo.scan" },
            params: { type: "object" },
          },
          required: ["command"],
        },
        responseSchema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" },
            durationMs: { type: "number" },
          },
        },
        description: "Scan repository structure and return analysis",
      },
      {
        name: "md.index",
        endpoint: "/api/command-center/execute",
        method: "POST",
        requestSchema: {
          type: "object",
          properties: {
            command: { type: "string", const: "md.index" },
            params: { type: "object" },
          },
          required: ["command"],
        },
        responseSchema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" },
            durationMs: { type: "number" },
          },
        },
        description: "Index markdown documentation files",
      },
      {
        name: "routes.validate",
        endpoint: "/api/command-center/execute",
        method: "POST",
        requestSchema: {
          type: "object",
          properties: {
            command: { type: "string", const: "routes.validate" },
            params: { type: "object" },
          },
          required: ["command"],
        },
        responseSchema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" },
            durationMs: { type: "number" },
          },
        },
        description: "Validate API routes for correctness",
      },
      {
        name: "tests.run",
        endpoint: "/api/command-center/execute",
        method: "POST",
        requestSchema: {
          type: "object",
          properties: {
            command: { type: "string", const: "tests.run" },
            params: { type: "object" },
          },
          required: ["command"],
        },
        responseSchema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" },
            durationMs: { type: "number" },
          },
        },
        description: "Run test suite and return results",
      },
      {
        name: "wiring.export",
        endpoint: "/api/command-center/execute",
        method: "POST",
        requestSchema: {
          type: "object",
          properties: {
            command: { type: "string", const: "wiring.export" },
            params: { type: "object" },
          },
          required: ["command"],
        },
        responseSchema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                redirect: { type: "string" },
              },
            },
            durationMs: { type: "number" },
          },
        },
        description: "Export wiring pack for deployment",
      },
      {
        name: "task.sync",
        endpoint: "/api/command-center/execute",
        method: "POST",
        requestSchema: {
          type: "object",
          properties: {
            command: { type: "string", const: "task.sync" },
            params: { type: "object" },
          },
          required: ["command"],
        },
        responseSchema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" },
            durationMs: { type: "number" },
          },
        },
        description: "Sync tasks with OpenClaw jobs",
      },
    ],
    webhooks: [
      {
        endpoint: "/api/openclaw/webhook/job-status",
        method: "POST",
        headers: {
          "X-OPENCLAW-SECRET": "Required. Shared secret for authentication.",
        },
        payloadSchema: {
          type: "object",
          properties: {
            jobId: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "running", "completed", "failed", "cancelled"],
            },
            result: { type: "object" },
            error: { type: "string" },
          },
          required: ["jobId", "status"],
        },
        description: "Receive job status updates from OpenClaw",
      },
      {
        endpoint: "/api/openclaw/webhook/log",
        method: "POST",
        headers: {
          "X-OPENCLAW-SECRET": "Required. Shared secret for authentication.",
        },
        payloadSchema: {
          type: "object",
          properties: {
            jobId: { type: "string" },
            level: {
              type: "string",
              enum: ["info", "warn", "error", "debug"],
            },
            message: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
          },
          required: ["jobId", "level", "message"],
        },
        description: "Receive log entries from OpenClaw jobs",
      },
    ],
    dispatch: {
      endpoint: "/api/openclaw/dispatch",
      method: "POST",
      headers: {
        "X-OPENCLAW-SECRET": "Required. Shared secret for authentication.",
      },
      description: "Receive dispatched actions from OpenClaw",
    },
    health: {
      endpoint: "/api/openclaw/health",
      method: "GET",
      description: "Check OpenClaw connection status (requires auth)",
    },
  };

  return NextResponse.json(contract);
}
