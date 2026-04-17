export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyIngestAuth } from "@/lib/auth";
import { SnapshotSchema } from "@/lib/schema";
import { upsertSnapshot } from "@/lib/db";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Auth guard
  if (!verifyIngestAuth(req.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. JSON parse guard
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 3. Zod schema guard
  const parsed = SnapshotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // 4. Upsert to DB
  try {
    await upsertSnapshot(parsed.data);
  } catch (err) {
    console.error("[ingest] DB error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }

  return new NextResponse(null, { status: 204 });
}
