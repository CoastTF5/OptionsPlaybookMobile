import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { AmdResponse } from "@/lib/advisory-types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!supabase) {
    return NextResponse.json<AmdResponse>({ ok: false, status: null, phase: null, error: "supabase_disabled" }, { status: 503 });
  }

  const env = process.env.TRADING_ENVIRONMENT ?? "paper";

  const [amdResult, phaseResult] = await Promise.all([
    supabase
      .from("amd_snapshots_v1")
      .select("computed_at,amd_score,amd_state,regime_integrity,final_trading_mode,base_regime,base_regime_confidence,vci_score,vsi_score,lsi_score,sdi_score,rii_score")
      .eq("environment", env)
      .order("computed_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("amd_phase_signals_v1")
      .select("computed_at,dominant_phase,phase_confidence,p_accumulation,p_manipulation,p_distribution,cum_delta,atr_ratio,iv_skew")
      .eq("environment", env)
      .order("computed_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  return NextResponse.json<AmdResponse>({
    ok: true,
    status: amdResult.data ?? null,
    phase: phaseResult.data ?? null,
  });
}
