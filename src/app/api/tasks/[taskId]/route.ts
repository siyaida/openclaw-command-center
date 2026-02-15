import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { updateTaskSchema } from "@/lib/validators";

async function verifyTaskAccess(taskId: string, userId: string) {
  const workspace = await prisma.workspace.findFirst({
    where: { userId },
  });

  if (!workspace) return null;

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      column: {
        board: {
          workspaceId: workspace.id,
        },
      },
    },
  });

  return task;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await requireUser();
    const { taskId } = await params;

    const task = await verifyTaskAccess(taskId, user.id!);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const fullTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        activities: {
          orderBy: { createdAt: "desc" },
        },
        column: true,
        openclawJob: true,
      },
    });

    return NextResponse.json(fullTask);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await requireUser();
    const { taskId } = await params;

    const task = await verifyTaskAccess(taskId, user.id!);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.priority !== undefined) data.priority = parsed.data.priority;
    if (parsed.data.labels !== undefined) data.labels = JSON.stringify(parsed.data.labels);
    if (parsed.data.dueDate !== undefined) {
      data.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    }
    if (parsed.data.assignee !== undefined) data.assignee = parsed.data.assignee;

    const updated = await prisma.task.update({
      where: { id: taskId },
      data,
    });

    const changes = Object.keys(parsed.data).join(", ");
    await prisma.taskActivity.create({
      data: {
        taskId,
        action: "updated",
        details: `Updated: ${changes}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await requireUser();
    const { taskId } = await params;

    const task = await verifyTaskAccess(taskId, user.id!);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.taskActivity.create({
      data: {
        taskId,
        action: "deleted",
        details: `Task "${task.title}" deleted`,
      },
    });

    await prisma.task.delete({ where: { id: taskId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
