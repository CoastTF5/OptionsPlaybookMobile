import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { BriefingResponse } from "@/lib/advisory-types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!supabase) {
    return NextResponse.json<BriefingResponse>({ ok: false, briefing: null, error: "supabase_disabled" }, { status: 503 });
  }

  // agent_athena.caches stores briefings keyed by market condition bucket.
  // Take the most recent cache entry — these are ATHENA's latest market analysis.
  // NOTE: agent_athena schema must be listed in Supabase "Exposed schemas" settings.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  const { data, error } = await client
    .schema("agent_athena")
    .from("caches")
    .select("cache_id,ts,key,payload")
    .order("ts", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json<BriefingResponse>({ ok: false, briefing: null, error: String(error.message ?? error) });
  }

  return NextResponse.json<BriefingResponse>({ ok: true, briefing: data });
}
