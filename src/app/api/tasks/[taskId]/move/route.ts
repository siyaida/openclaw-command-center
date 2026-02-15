import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { moveTaskSchema } from "@/lib/validators";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await requireUser();
    const { taskId } = await params;

    const workspace = await prisma.workspace.findFirst({
      where: { userId: user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        column: {
          board: {
            workspaceId: workspace.id,
          },
        },
      },
      include: { column: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = moveTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { columnId, order } = parsed.data;

    const targetColumn = await prisma.column.findFirst({
      where: {
        id: columnId,
        board: {
          workspaceId: workspace.id,
        },
      },
    });

    if (!targetColumn) {
      return NextResponse.json(
        { error: "Target column not found" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // If moving within the same column, shift tasks around the new position
      if (task.columnId === columnId) {
        if (order < task.order) {
          // Moving up: shift tasks between new and old position down
          await tx.task.updateMany({
            where: {
              columnId,
              id: { not: taskId },
              order: { gte: order, lt: task.order },
            },
            data: { order: { increment: 1 } },
          });
        } else if (order > task.order) {
          // Moving down: shift tasks between old and new position up
          await tx.task.updateMany({
            where: {
              columnId,
              id: { not: taskId },
              order: { gt: task.order, lte: order },
            },
            data: { order: { decrement: 1 } },
          });
        }
      } else {
        // Moving to a different column
        // Close the gap in the source column
        await tx.task.updateMany({
          where: {
            columnId: task.columnId,
            order: { gt: task.order },
          },
          data: { order: { decrement: 1 } },
        });

        // Make space in the target column
        await tx.task.updateMany({
          where: {
            columnId,
            order: { gte: order },
          },
          data: { order: { increment: 1 } },
        });
      }

      // Move the task
      await tx.task.update({
        where: { id: taskId },
        data: { columnId, order },
      });
    });

    await prisma.taskActivity.create({
      data: {
        taskId,
        action: "moved",
        details: `moved to ${targetColumn.title}`,
      },
    });

    const updated = await prisma.task.findUnique({
      where: { id: taskId },
      include: { column: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to move task" },
      { status: 500 }
    );
  }
}
