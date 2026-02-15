import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();

    const workspace = await prisma.workspace.findFirst({
      where: { userId: user.id },
    });

    // Check database connection
    let dbConnected = false;
    let dbError: string | null = null;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (err) {
      dbError = err instanceof Error ? err.message : "Unknown database error";
    }

    // Check environment variables
    const envVars = [
      "DATABASE_URL",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL",
      "ENCRYPTION_KEY",
      "OPENCLAW_WEBHOOK_SECRET",
    ];

    const envStatus = envVars.map((name) => ({
      name,
      set: !!process.env[name],
    }));

    // Check OpenClaw config
    let openclawConfig = null;
    if (workspace) {
      const config = await prisma.openClawConfig.findUnique({
        where: { workspaceId: workspace.id },
      });

      if (config) {
        openclawConfig = {
          mode: config.mode,
          hasBaseUrl: !!config.baseUrl,
          hasToken: !!config.tokenEncrypted,
          lastStatus: config.lastStatus,
          lastLatencyMs: config.lastLatencyMs,
          healthPath: config.healthPath,
        };
      }
    }

    // List API routes
    const routes = [
      { path: "/api/auth/[...nextauth]", methods: ["GET", "POST"] },
      { path: "/api/auth/register", methods: ["POST"] },
      { path: "/api/boards", methods: ["GET", "POST"] },
      { path: "/api/boards/[boardId]", methods: ["GET", "PUT", "DELETE"] },
      { path: "/api/boards/[boardId]/columns", methods: ["GET", "POST", "PUT"] },
      { path: "/api/boards/[boardId]/columns/[columnId]", methods: ["PUT", "DELETE"] },
      { path: "/api/tasks/[taskId]", methods: ["GET", "PUT", "DELETE"] },
      { path: "/api/tasks/[taskId]/move", methods: ["PUT"] },
      { path: "/api/tasks/[taskId]/activity", methods: ["GET"] },
      { path: "/api/command-center/execute", methods: ["POST"] },
      { path: "/api/command-center/history", methods: ["GET"] },
      { path: "/api/openclaw/config", methods: ["GET", "PUT"] },
      { path: "/api/openclaw/health", methods: ["GET"] },
      { path: "/api/openclaw/contract", methods: ["GET"] },
      { path: "/api/openclaw/dispatch", methods: ["POST"] },
      { path: "/api/openclaw/webhook/job-status", methods: ["POST"] },
      { path: "/api/openclaw/webhook/log", methods: ["POST"] },
      { path: "/api/diagnostics", methods: ["GET"] },
    ];

    // Contract endpoint info
    const contractEndpoint = {
      url: "/api/openclaw/contract",
      method: "GET",
      description: "Machine-readable API contract (no auth required)",
    };

    // Database stats
    let dbStats = null;
    if (dbConnected && workspace) {
      const [boardCount, taskCount, commandLogCount] = await Promise.all([
        prisma.board.count({ where: { workspaceId: workspace.id } }),
        prisma.task.count({
          where: {
            column: {
              board: {
                workspaceId: workspace.id,
              },
            },
          },
        }),
        prisma.commandLog.count({ where: { workspaceId: workspace.id } }),
      ]);

      dbStats = {
        boards: boardCount,
        tasks: taskCount,
        commandLogs: commandLogCount,
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        error: dbError,
        stats: dbStats,
      },
      environment: {
        variables: envStatus,
        missingCount: envStatus.filter((v) => !v.set).length,
      },
      openclawConfig,
      routes: {
        total: routes.length,
        list: routes,
      },
      contract: contractEndpoint,
      workspace: workspace
        ? { id: workspace.id, name: workspace.name }
        : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to run diagnostics" },
      { status: 500 }
    );
  }
}
