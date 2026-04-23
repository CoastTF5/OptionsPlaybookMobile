import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { AdvisoriesResponse } from "@/lib/advisory-types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!supabase) {
    return NextResponse.json<AdvisoriesResponse>({ ok: false, advisories: [], error: "supabase_disabled" }, { status: 503 });
  }

  const env = process.env.TRADING_ENVIRONMENT ?? "paper";

  // Fetch ALL advisories — no KAREN/veto filter. Advisory-only view of what the system sees.
  const { data, error } = await supabase
    .from("trade_management_advisories_v1")
    .select("advisory_id,created_at,environment,underlying_symbol,structure,advisory_type,severity,status,trigger_snapshot,recommended_action,cooldown_until,resolved_reason")
    .eq("environment", env)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json<AdvisoriesResponse>({ ok: false, advisories: [], error: error.message });
  }

  return NextResponse.json<AdvisoriesResponse>({ ok: true, advisories: data ?? [] });
}
