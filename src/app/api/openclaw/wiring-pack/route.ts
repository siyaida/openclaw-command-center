import { NextResponse } from "next/server";
import { generateWiringPackZip } from "@/lib/wiring/zip";

export async function GET() {
  try {
    const buffer = await generateWiringPackZip();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="openclaw-wiring-pack.zip"',
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate wiring pack" },
      { status: 500 }
    );
  }
}
