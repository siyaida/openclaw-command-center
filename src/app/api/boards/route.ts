import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createBoardSchema } from "@/lib/validators";

export async function GET() {
  try {
    const user = await requireUser();

    const workspace = await prisma.workspace.findFirst({
      where: { userId: user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const boards = await prisma.board.findMany({
      where: { workspaceId: workspace.id },
      include: {
        columns: {
          orderBy: { order: "asc" },
          include: {
            _count: {
              select: { tasks: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = boards.map((board) => ({
      ...board,
      columns: board.columns.map((col) => ({
        id: col.id,
        title: col.title,
        order: col.order,
        taskCount: col._count.tasks,
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch boards" },
      { status: 500 }
    );
  }
}

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
    const parsed = createBoardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const board = await prisma.board.create({
      data: {
        title: parsed.data.title,
        workspaceId: workspace.id,
        columns: {
          create: [
            { title: "To Do", order: 0 },
            { title: "In Progress", order: 1 },
            { title: "Done", order: 2 },
          ],
        },
      },
      include: {
        columns: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create board" },
      { status: 500 }
    );
  }
}
