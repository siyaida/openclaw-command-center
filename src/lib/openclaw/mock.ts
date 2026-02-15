import type {
  OpenClawHealthResponse,
  OpenClawJob,
  OpenClawJobPayload,
  OpenClawCommandPayload,
  OpenClawCommandResponse,
} from "./types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockClient = {
  async health(): Promise<OpenClawHealthResponse> {
    await delay(150);
    return { status: "ok", version: "0.1.0-mock", timestamp: new Date().toISOString() };
  },

  async createJob(payload: OpenClawJobPayload): Promise<OpenClawJob> {
    await delay(200);
    return {
      jobId: `mock-job-${Date.now()}`,
      status: "completed",
      result: { message: `Mock job completed for type: ${payload.type}`, params: payload.params },
      createdAt: new Date().toISOString(),
    };
  },

  async getJob(jobId: string): Promise<OpenClawJob> {
    await delay(100);
    return {
      jobId,
      status: "completed",
      result: { message: "Mock job result" },
      createdAt: new Date().toISOString(),
    };
  },

  async cancelJob(jobId: string): Promise<{ success: boolean }> {
    await delay(100);
    return { success: true };
  },

  async sendCommand(payload: OpenClawCommandPayload): Promise<OpenClawCommandResponse> {
    await delay(300);

    const mockResponses: Record<string, unknown> = {
      "repo.scan": {
        files: 42,
        languages: ["TypeScript", "CSS", "JSON"],
        summary: "Next.js application with Prisma ORM, 42 files scanned.",
        issues: [],
        recommendations: ["Add unit tests for API routes", "Consider adding rate limiting"],
      },
      "md.index": {
        documents: 5,
        index: [
          { path: "README.md", title: "OpenClaw Command Center", sections: 8 },
          { path: "docs/DEPLOYMENT_ONPREM.md", title: "On-Prem Deployment", sections: 5 },
          { path: "docs/OPENCLAW_WIRING_GUIDE.md", title: "Wiring Guide", sections: 6 },
          { path: "docs/CONTRACTS.md", title: "API Contracts", sections: 4 },
          { path: "docs/TROUBLESHOOTING.md", title: "Troubleshooting", sections: 3 },
        ],
      },
      "routes.validate": {
        total: 15,
        valid: 15,
        invalid: 0,
        routes: [
          { path: "/api/boards", methods: ["GET", "POST"], status: "valid" },
          { path: "/api/tasks/:id", methods: ["GET", "PUT", "DELETE"], status: "valid" },
          { path: "/api/openclaw/contract", methods: ["GET"], status: "valid" },
          { path: "/api/openclaw/webhook/job-status", methods: ["POST"], status: "valid" },
        ],
      },
      "tests.run": {
        total: 8,
        passed: 8,
        failed: 0,
        duration: "3.2s",
        results: [
          { name: "auth flow", status: "passed" },
          { name: "board CRUD", status: "passed" },
          { name: "task drag-drop", status: "passed" },
          { name: "command execution", status: "passed" },
          { name: "openclaw health", status: "passed" },
          { name: "wiring pack export", status: "passed" },
          { name: "webhook verification", status: "passed" },
          { name: "contract schema", status: "passed" },
        ],
      },
      "task.sync": {
        synced: 3,
        tasks: [
          { taskId: "1", jobId: "mock-job-1", status: "synced" },
          { taskId: "2", jobId: "mock-job-2", status: "synced" },
          { taskId: "3", jobId: "mock-job-3", status: "synced" },
        ],
      },
    };

    return {
      success: true,
      data: mockResponses[payload.command] ?? { message: `Mock response for ${payload.command}` },
      durationMs: 300,
    };
  },
};
