import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { updateBoardSchema } from "@/lib/validators";

async function verifyBoardAccess(boardId: string, userId: string) {
  const workspace = await prisma.workspace.findFirst({
    where: { userId },
  });

  if (!workspace) return null;

  const board = await prisma.board.findFirst({
    where: { id: boardId, workspaceId: workspace.id },
  });

  return board;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const user = await requireUser();
    const { boardId } = await params;

    const board = await verifyBoardAccess(boardId, user.id!);
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const fullBoard = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json(fullBoard);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch board" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const user = await requireUser();
    const { boardId } = await params;

    const board = await verifyBoardAccess(boardId, user.id!);
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateBoardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.board.update({
      where: { id: boardId },
      data: { ...parsed.data },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update board" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const user = await requireUser();
    const { boardId } = await params;

    const board = await verifyBoardAccess(boardId, user.id!);
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    await prisma.board.delete({ where: { id: boardId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete board" },
      { status: 500 }
    );
  }
}
