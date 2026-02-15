import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logWebhookSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("X-OPENCLAW-SECRET");
    const expectedSecret = process.env.OPENCLAW_WEBHOOK_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = logWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { jobId, level, message, timestamp } = parsed.data;

    // Find the job to get the workspace
    const job = await prisma.openClawJob.findUnique({
      where: { jobId },
      include: {
        task: {
          include: {
            column: {
              include: {
                board: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const workspaceId = job.task.column.board.workspaceId;

    await prisma.commandLog.create({
      data: {
        workspaceId,
        command: `webhook.log.${level}`,
        input: JSON.stringify({ jobId, timestamp }),
        output: message,
        status: level === "error" ? "error" : "success",
      },
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process log webhook" },
      { status: 500 }
    );
  }
}
