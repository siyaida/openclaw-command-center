import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getStatus } from "@/lib/openclaw/client";

export async function GET() {
  try {
    const user = await requireUser();

    const workspace = await prisma.workspace.findFirst({
      where: { userId: user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const status = await getStatus(workspace.id);

    return NextResponse.json(status);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to get health status" },
      { status: 500 }
    );
  }
}
