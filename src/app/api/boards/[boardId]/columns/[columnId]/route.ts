import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

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

export async function PUT(
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
    const { title } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const updated = await prisma.column.update({
      where: { id: columnId },
      data: { title: title.trim() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update column" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await prisma.column.delete({ where: { id: columnId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete column" },
      { status: 500 }
    );
  }
}
