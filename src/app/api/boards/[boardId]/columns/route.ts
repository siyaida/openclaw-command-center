import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createColumnSchema, reorderColumnsSchema } from "@/lib/validators";

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

    const columns = await prisma.column.findMany({
      where: { boardId },
      orderBy: { order: "asc" },
      include: {
        tasks: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(columns);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch columns" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const parsed = createColumnSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const maxOrder = await prisma.column.aggregate({
      where: { boardId },
      _max: { order: true },
    });

    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const column = await prisma.column.create({
      data: {
        title: parsed.data.title,
        boardId,
        order: nextOrder,
      },
    });

    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create column" },
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
    const parsed = reorderColumnsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { columnIds } = parsed.data;

    await prisma.$transaction(
      columnIds.map((id, index) =>
        prisma.column.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    const columns = await prisma.column.findMany({
      where: { boardId },
      orderBy: { order: "asc" },
      include: {
        tasks: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(columns);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to reorder columns" },
      { status: 500 }
    );
  }
}
