import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createTaskSchema } from "@/lib/validators";

async function verifyColumnAccess(boardId: string, columnId: string, userId: string) {
  const workspace = await prisma.workspace.findFirst({
    where: { userId },
  });

  if (!workspace) return null;

  const board = await prisma.board.findFirst({
    where: { id: boardId, workspaceId: workspace.id },
  });

  if (!board) return null;

  const column = await prisma.column.findFirst({
    where: { id: columnId, boardId },
  });

  return column;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; columnId: string }> }
) {
  try {
    const user = await requireUser();
    const { boardId, columnId } = await params;

    const column = await verifyColumnAccess(boardId, columnId, user.id!);
    if (!column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const maxOrder = await prisma.task.aggregate({
      where: { columnId },
      _max: { order: true },
    });

    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const task = await prisma.task.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        priority: parsed.data.priority,
        labels: JSON.stringify(parsed.data.labels),
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        assignee: parsed.data.assignee,
        columnId,
        order: nextOrder,
      },
    });

    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        action: "created",
        details: `Task "${task.title}" created`,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
