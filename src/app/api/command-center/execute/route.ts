import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { executeCommandSchema } from "@/lib/validators";
import { health, sendCommand } from "@/lib/openclaw/client";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const workspace = await prisma.workspace.findFirst({
      where: { userId: user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = executeCommandSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { command, params } = parsed.data;
    const start = Date.now();

    let result: unknown;
    let success = true;
    let error: string | undefined;

    try {
      switch (command) {
        case "openclaw.health": {
          result = await health(workspace.id);
          break;
        }
        case "wiring.export": {
          result = { redirect: "/api/openclaw/wiring-pack" };
          break;
        }
        case "repo.scan":
        case "md.index":
        case "routes.validate":
        case "tests.run":
        case "task.sync": {
          const cmdResult = await sendCommand(workspace.id, {
            command,
            params: (params as Record<string, unknown>) ?? {},
          });
          result = cmdResult.data;
          success = cmdResult.success;
          if (!cmdResult.success) {
            error = cmdResult.error;
          }
          break;
        }
        default: {
          return NextResponse.json(
            { error: `Unknown command: ${command}` },
            { status: 400 }
          );
        }
      }
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : "Command execution failed";
    }

    const durationMs = Date.now() - start;

    await prisma.commandLog.create({
      data: {
        workspaceId: workspace.id,
        command,
        input: params ? JSON.stringify(params) : null,
        output: result ? JSON.stringify(result) : error ?? null,
        status: success ? "success" : "error",
        durationMs,
      },
    });

    return NextResponse.json({
      success,
      data: result,
      error,
      durationMs,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to execute command" },
      { status: 500 }
    );
  }
}
