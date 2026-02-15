import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jobStatusWebhookSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("X-OPENCLAW-SECRET");
    const expectedSecret = process.env.OPENCLAW_WEBHOOK_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = jobStatusWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { jobId, status, result, error } = parsed.data;

    const job = await prisma.openClawJob.findUnique({
      where: { jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await prisma.openClawJob.update({
      where: { jobId },
      data: {
        status,
        lastResponse: result ? JSON.stringify(result) : error ?? null,
      },
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
