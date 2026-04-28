import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { AdvisoriesResponse, AdvisoryPosition } from "@/lib/advisory-types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!supabase) {
    return NextResponse.json<AdvisoriesResponse>({ ok: false, advisories: [], error: "supabase_disabled" }, { status: 503 });
  }

  const env = process.env.TRADING_ENVIRONMENT ?? "paper";

  // Fetch ALL advisories — no KAREN/veto filter. Advisory-only view of what the system sees.
  const { data, error } = await supabase
    .from("trade_management_advisories_v1")
    .select("advisory_id,created_at,environment,underlying_symbol,structure,advisory_type,severity,status,trigger_snapshot,recommended_action,cooldown_until,resolved_reason,position_id")
    .eq("environment", env)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json<AdvisoriesResponse>({ ok: false, advisories: [], error: error.message });
  }

  const rows = data ?? [];
  const positionIds = Array.from(
    new Set(rows.map((r) => r.position_id).filter((id): id is string => typeof id === "string" && id.length > 0)),
  );

  // Fetch the linked positions in one batch — there's no FK in PostgREST so embedding
  // doesn't work; this preserves the conversational trade-setup view in the Intel tab.
  const positionsById = new Map<string, AdvisoryPosition>();
  if (positionIds.length > 0) {
    const { data: positions, error: posErr } = await supabase
      .from("positions_v1")
      .select("position_id,legs,expiry,entry_price,cost_basis,qty_open,unrealized_pnl,net_delta")
      .in("position_id", positionIds);

    if (posErr) {
      // Non-fatal: degrade to advisories without trade setup detail.
      console.warn("[/api/advisories] positions fetch failed:", posErr.message);
    } else {
      for (const p of positions ?? []) {
        positionsById.set(p.position_id as string, {
          legs: (p.legs as AdvisoryPosition["legs"]) ?? null,
          expiry: (p.expiry as string | null) ?? null,
          entry_price: (p.entry_price as number | null) ?? null,
          cost_basis: (p.cost_basis as number | null) ?? null,
          qty_open: (p.qty_open as number | null) ?? null,
          unrealized_pnl: (p.unrealized_pnl as number | null) ?? null,
          net_delta: (p.net_delta as number | null) ?? null,
        });
      }
    }
  }

  const advisories = rows.map((row) => {
    const { position_id, ...rest } = row;
    return {
      ...rest,
      position: position_id ? positionsById.get(position_id) ?? null : null,
    };
  });

  return NextResponse.json<AdvisoriesResponse>({ ok: true, advisories: advisories as never });
}
