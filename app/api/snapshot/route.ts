export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getLatestSnapshot } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  let row: Awaited<ReturnType<typeof getLatestSnapshot>>;

  try {
    row = await getLatestSnapshot();
  } catch (err) {
    console.error("[snapshot] DB error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }

  if (!row) {
    return NextResponse.json({ error: "No snapshot available" }, { status: 404 });
  }

  return NextResponse.json(
    { payload: row.payload, ingested_at: row.ingested_at },
    {
      status: 200,
      headers: { "cache-control": "no-store" },
    },
  );
}
