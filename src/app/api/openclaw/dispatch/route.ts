import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("X-OPENCLAW-SECRET");
    const expectedSecret = process.env.OPENCLAW_WEBHOOK_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, payload } = body;

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    // For MVP: log the dispatch and return acknowledgment
    // Find a workspace to associate the log with (use the first available)
    const workspace = await prisma.workspace.findFirst();

    if (workspace) {
      await prisma.commandLog.create({
        data: {
          workspaceId: workspace.id,
          command: `dispatch.${action}`,
          input: payload ? JSON.stringify(payload) : null,
          output: JSON.stringify({ acknowledged: true }),
          status: "success",
        },
      });
    }

    return NextResponse.json({
      acknowledged: true,
      action,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process dispatch" },
      { status: 500 }
    );
  }
}
