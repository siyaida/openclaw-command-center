export interface CommandDefinition {
  name: string;
  description: string;
  endpoint: string;
  method: string;
  requestSchema: Record<string, unknown>;
  responseSchema: Record<string, unknown>;
}

export const commandRegistry: CommandDefinition[] = [
  {
    name: "openclaw.health",
    description: "Check connectivity and system status of the OpenClaw integration",
    endpoint: "/api/openclaw/health",
    method: "GET",
    requestSchema: {},
    responseSchema: {
      type: "object",
      required: ["status", "mode"],
      properties: {
        status: {
          type: "string",
          enum: ["connected", "disconnected", "misconfigured"],
          description: "Current connection status",
        },
        mode: {
          type: "string",
          enum: ["mock", "real"],
          description: "Operating mode",
        },
        latencyMs: {
          type: "number",
          description: "Round-trip latency in milliseconds",
        },
        version: {
          type: "string",
          description: "OpenClaw server version string",
        },
        error: {
          type: "string",
          description: "Error message if status is not connected",
        },
      },
    },
  },
  {
    name: "repo.scan",
    description:
      "Scan a repository and return a summary of its structure, languages, issues, and recommendations",
    endpoint: "/api/command-center/execute",
    method: "POST",
    requestSchema: {
      type: "object",
      required: ["command", "params"],
      properties: {
        command: { type: "string", const: "repo.scan" },
        params: {
          type: "object",
          required: ["repoPath", "focus"],
          properties: {
            repoPath: {
              type: "string",
              description: "Absolute or relative path to the repository root",
            },
            focus: {
              type: "string",
              enum: ["structure", "security", "performance", "all"],
              description: "Area of analysis to focus on",
            },
          },
        },
      },
    },
    responseSchema: {
      type: "object",
      required: ["files", "languages", "summary", "issues", "recommendations"],
      properties: {
        files: {
          type: "number",
          description: "Total number of files scanned",
        },
        languages: {
          type: "array",
          items: { type: "string" },
          description: "Detected programming languages",
        },
        summary: {
          type: "string",
          description: "Human-readable summary of the repository",
        },
        issues: {
          type: "array",
          items: { type: "string" },
          description: "Identified issues or warnings",
        },
        recommendations: {
          type: "array",
          items: { type: "string" },
          description: "Actionable improvement suggestions",
        },
      },
    },
  },
  {
    name: "md.index",
    description:
      "Index all markdown documentation files under a given root directory",
    endpoint: "/api/command-center/execute",
    method: "POST",
    requestSchema: {
      type: "object",
      required: ["command", "params"],
      properties: {
        command: { type: "string", const: "md.index" },
        params: {
          type: "object",
          required: ["mdRoot", "includePatterns"],
          properties: {
            mdRoot: {
              type: "string",
              description: "Root directory to search for markdown files",
            },
            includePatterns: {
              type: "array",
              items: { type: "string" },
              description:
                "Glob patterns to include, e.g. ['**/*.md', '**/*.mdx']",
            },
          },
        },
      },
    },
    responseSchema: {
      type: "object",
      required: ["documents", "index"],
      properties: {
        documents: {
          type: "number",
          description: "Total number of markdown documents found",
        },
        index: {
          type: "array",
          items: {
            type: "object",
            required: ["path", "title", "sections"],
            properties: {
              path: {
                type: "string",
                description: "Relative path to the document",
              },
              title: {
                type: "string",
                description:
                  "Extracted document title from first H1 or filename",
              },
              sections: {
                type: "number",
                description: "Number of heading sections in the document",
              },
            },
          },
        },
      },
    },
  },
  {
    name: "routes.validate",
    description:
      "Validate a set of API routes by checking availability and expected behavior",
    endpoint: "/api/command-center/execute",
    method: "POST",
    requestSchema: {
      type: "object",
      required: ["command", "params"],
      properties: {
        command: { type: "string", const: "routes.validate" },
        params: {
          type: "object",
          required: ["baseUrl", "routesList"],
          properties: {
            baseUrl: {
              type: "string",
              description:
                "Base URL of the application, e.g. 'http://localhost:3000'",
            },
            routesList: {
              type: "array",
              items: { type: "string" },
              description: "List of route paths to validate",
            },
          },
        },
      },
    },
    responseSchema: {
      type: "object",
      required: ["total", "valid", "invalid", "routes"],
      properties: {
        total: {
          type: "number",
          description: "Total number of routes checked",
        },
        valid: {
          type: "number",
          description: "Number of valid/reachable routes",
        },
        invalid: {
          type: "number",
          description: "Number of invalid/unreachable routes",
        },
        routes: {
          type: "array",
          items: {
            type: "object",
            required: ["path", "methods", "status"],
            properties: {
              path: { type: "string", description: "The route path" },
              methods: {
                type: "array",
                items: { type: "string" },
                description: "Supported HTTP methods",
              },
              status: {
                type: "string",
                enum: ["valid", "invalid", "timeout", "error"],
                description: "Validation result",
              },
            },
          },
        },
      },
    },
  },
  {
    name: "tests.run",
    description:
      "Execute a set of test commands and return aggregated pass/fail results",
    endpoint: "/api/command-center/execute",
    method: "POST",
    requestSchema: {
      type: "object",
      required: ["command", "params"],
      properties: {
        command: { type: "string", const: "tests.run" },
        params: {
          type: "object",
          required: ["commands"],
          properties: {
            commands: {
              type: "array",
              items: { type: "string" },
              description:
                "Shell commands to execute for testing, e.g. ['npx playwright test']",
            },
          },
        },
      },
    },
    responseSchema: {
      type: "object",
      required: ["total", "passed", "failed", "duration", "results"],
      properties: {
        total: {
          type: "number",
          description: "Total number of test cases",
        },
        passed: {
          type: "number",
          description: "Number of passing tests",
        },
        failed: {
          type: "number",
          description: "Number of failing tests",
        },
        duration: {
          type: "string",
          description: "Total test execution time, e.g. '3.2s'",
        },
        results: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "status"],
            properties: {
              name: { type: "string", description: "Test case name" },
              status: {
                type: "string",
                enum: ["passed", "failed", "skipped"],
                description: "Individual test result",
              },
            },
          },
        },
      },
    },
  },
  {
    name: "wiring.export",
    description:
      "Export the wiring pack ZIP containing system prompts, tool contracts, and configuration files",
    endpoint: "/api/command-center/execute",
    method: "POST",
    requestSchema: {
      type: "object",
      required: ["command"],
      properties: {
        command: { type: "string", const: "wiring.export" },
        params: {
          type: "object",
          properties: {},
          description: "No parameters required",
        },
      },
    },
    responseSchema: {
      type: "object",
      required: ["redirect"],
      properties: {
        redirect: {
          type: "string",
          description: "URL path to download the wiring pack ZIP file",
        },
      },
    },
  },
  {
    name: "task.sync",
    description:
      "Synchronize Kanban tasks assigned to openclaw_bot with their corresponding OpenClaw jobs",
    endpoint: "/api/command-center/execute",
    method: "POST",
    requestSchema: {
      type: "object",
      required: ["command"],
      properties: {
        command: { type: "string", const: "task.sync" },
        params: {
          type: "object",
          properties: {},
          description: "No parameters required",
        },
      },
    },
    responseSchema: {
      type: "object",
      required: ["synced", "tasks"],
      properties: {
        synced: {
          type: "number",
          description: "Number of tasks synchronized",
        },
        tasks: {
          type: "array",
          items: {
            type: "object",
            required: ["taskId", "jobId", "status"],
            properties: {
              taskId: {
                type: "string",
                description: "The Kanban task ID",
              },
              jobId: {
                type: "string",
                description: "The corresponding OpenClaw job ID",
              },
              status: {
                type: "string",
                enum: ["synced", "conflict", "orphaned"],
                description: "Sync result status",
              },
            },
          },
        },
      },
    },
  },
];

export function getCommandDefinition(
  name: string
): CommandDefinition | undefined {
  return commandRegistry.find((c) => c.name === name);
}
