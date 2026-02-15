import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { openclawConfigSchema } from "@/lib/validators";
import { encrypt } from "@/lib/encryption";
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

    const config = await prisma.openClawConfig.findUnique({
      where: { workspaceId: workspace.id },
    });

    if (!config) {
      return NextResponse.json({
        baseUrl: "",
        mode: "mock",
        healthPath: "/health",
        hasToken: false,
        lastStatus: null,
        lastLatencyMs: null,
      });
    }

    return NextResponse.json({
      id: config.id,
      workspaceId: config.workspaceId,
      baseUrl: config.baseUrl,
      mode: config.mode,
      healthPath: config.healthPath,
      hasToken: !!config.tokenEncrypted,
      lastStatus: config.lastStatus,
      lastLatencyMs: config.lastLatencyMs,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();

    const workspace = await prisma.workspace.findFirst({
      where: { userId: user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = openclawConfigSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { baseUrl, token, mode, healthPath } = parsed.data;

    const data: Record<string, unknown> = {
      baseUrl,
      mode,
      healthPath,
    };

    if (token) {
      data.tokenEncrypted = encrypt(token);
    }

    const config = await prisma.openClawConfig.upsert({
      where: { workspaceId: workspace.id },
      update: data,
      create: {
        workspaceId: workspace.id,
        baseUrl,
        mode,
        healthPath,
        tokenEncrypted: token ? encrypt(token) : "",
      },
    });

    const status = await getStatus(workspace.id);

    return NextResponse.json({
      config: {
        id: config.id,
        workspaceId: config.workspaceId,
        baseUrl: config.baseUrl,
        mode: config.mode,
        healthPath: config.healthPath,
        hasToken: !!config.tokenEncrypted,
        lastStatus: config.lastStatus,
        lastLatencyMs: config.lastLatencyMs,
        updatedAt: config.updatedAt,
      },
      status,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update config" },
      { status: 500 }
    );
  }
}
