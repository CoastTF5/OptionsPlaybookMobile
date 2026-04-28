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
    .select(`
      advisory_id,created_at,environment,underlying_symbol,structure,advisory_type,severity,status,
      trigger_snapshot,recommended_action,cooldown_until,resolved_reason,
      position:positions_v1(legs,expiry,entry_price,cost_basis,qty_open,unrealized_pnl,net_delta)
    `)
    .eq("environment", env)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json<AdvisoriesResponse>({ ok: false, advisories: [], error: error.message });
  }

  // Supabase returns embedded one-to-one relation as either an object or array depending on FK
  // metadata; normalize to a single object (or null) for client consumption.
  const advisories = (data ?? []).map((row: Record<string, unknown>) => {
    const pos = row.position;
    return {
      ...row,
      position: Array.isArray(pos) ? (pos[0] ?? null) : (pos ?? null),
    };
  });

  return NextResponse.json<AdvisoriesResponse>({ ok: true, advisories: advisories as never });
}
