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

  // Reads from public.v_mobile_briefing_v1, the BriefingCache-shaped adapter
  // over cognitive.premarket_analyses_v1 (where ATHENA actually writes).
  // Migration: supabase/migrations/20260430000711_mobile_briefing_view_v1.sql
  const { data, error } = await supabase
    .from("v_mobile_briefing_v1")
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
