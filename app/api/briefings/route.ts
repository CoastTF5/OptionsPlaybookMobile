import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { BriefingsListResponse } from "@/lib/advisory-types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!supabase) {
    return NextResponse.json<BriefingsListResponse>(
      { ok: false, briefings: [], error: "supabase_disabled" },
      { status: 503 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  const { data, error } = await client
    .schema("agent_athena")
    .from("caches")
    .select("cache_id,ts,key,payload")
    .order("ts", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json<BriefingsListResponse>({
      ok: false,
      briefings: [],
      error: String(error.message ?? error),
    });
  }

  return NextResponse.json<BriefingsListResponse>({ ok: true, briefings: data ?? [] });
}
