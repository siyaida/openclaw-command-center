import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    // Create default workspace, board, and columns
    const workspace = await prisma.workspace.create({
      data: {
        name: `${name}'s Workspace`,
        userId: user.id,
      },
    });

    const board = await prisma.board.create({
      data: {
        title: "My First Board",
        workspaceId: workspace.id,
      },
    });

    await prisma.column.createMany({
      data: [
        { title: "To Do", boardId: board.id, order: 0 },
        { title: "In Progress", boardId: board.id, order: 1 },
        { title: "Done", boardId: board.id, order: 2 },
      ],
    });

    // Create default OpenClaw config in mock mode
    await prisma.openClawConfig.create({
      data: {
        workspaceId: workspace.id,
        mode: process.env.OPENCLAW_DEFAULT_MODE ?? "mock",
        baseUrl: process.env.OPENCLAW_DEFAULT_BASE_URL ?? "",
        healthPath: process.env.OPENCLAW_DEFAULT_HEALTH_PATH ?? "/health",
      },
    });

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      workspaceId: workspace.id,
      boardId: board.id,
    }, { status: 201 });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
