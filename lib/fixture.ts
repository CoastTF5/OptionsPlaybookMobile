import type { Snapshot } from "./schema";

/**
 * Demo-only fixture for the preview scaffold. Real data arrives via /api/ingest
 * once the local pusher daemon is wired up.
 */
export function getFixtureSnapshot(): Snapshot {
  return {
    generated_at: new Date().toISOString(),
    environment: "paper",
    ops: {
      status: "READY",
      hydration_age_seconds: 12,
      chips: [
        { label: "daemon ✓", tone: "success" },
        { label: "hydration 12s", tone: "muted" },
      ],
    },
    regime: {
      regime_key: "MID_IV",
      regime_confidence: 0.8,
      archetype_key: "RANGE",
      archetype_confidence: 0.74,
      signals: [
        { key: "VRP", value: "+2.4σ", tone: "success" },
        { key: "Skew", value: "neutral", tone: "muted" },
      ],
      tickers: [
        { symbol: "SPX", price: 7041.28, change_pct: 0.24 },
        { symbol: "VIX", price: 14.2, change_pct: -1.1 },
        { symbol: "US500", price: 4321, change_pct: 0.1 },
      ],
    },
    queue: [
      {
        candidate_id: "cand_abc123",
        symbol: "SPX",
        structure: "CCS",
        dte: 7,
        expiry: "2026-04-24",
        legs_label: "7230/7180C",
        max_profit: 1095,
        max_loss: 3905,
        pop: null,
        confidence: 0.8,
        spot_price: 7041.28,
        pipeline: {
          regime_key: "MID_IV",
          archetype_key: "RANGE",
          engine_key: "THETA",
          engine_role: "primary",
          strategy_label: "Call Credit Spread",
        },
        market_analysis: { vrp: "+2.4σ", skew: "neutral", headline: null },
        validation: { status: "APPROVE", summary: "Ready to trade", age_minutes: 2 },
        mode: "CONSIDERED",
        is_autopilot_pick: false,
        created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      },
      {
        candidate_id: "cand_def456",
        symbol: "XSP",
        structure: "IC",
        dte: 14,
        expiry: "2026-05-01",
        legs_label: "445/440C · 410/405P",
        max_profit: 340,
        max_loss: 860,
        pop: 0.68,
        confidence: 0.72,
        spot_price: 427.5,
        pipeline: {
          regime_key: "MID_IV",
          archetype_key: "RANGE",
          engine_key: "THETA",
          engine_role: "primary",
          strategy_label: "Iron Condor",
        },
        market_analysis: { vrp: "+2.4σ", skew: null, headline: null },
        validation: { status: "APPROVE", summary: "Ready to trade", age_minutes: 4 },
        mode: "CONSIDERED",
        is_autopilot_pick: false,
        created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      },
      {
        candidate_id: "cand_ghi789",
        symbol: "SPX",
        structure: "IC",
        dte: 21,
        expiry: "2026-05-08",
        legs_label: "7280/7230C · 6800/6750P",
        max_profit: 920,
        max_loss: 4080,
        pop: 0.72,
        confidence: 0.76,
        spot_price: 7041.28,
        pipeline: {
          regime_key: "MID_IV",
          archetype_key: "RANGE",
          engine_key: "THETA",
          engine_role: "primary",
          strategy_label: "Iron Condor",
        },
        market_analysis: { vrp: null, skew: null, headline: null },
        validation: { status: "WAIT", summary: "Waiting on liquidity", age_minutes: 7 },
        mode: "CONSIDERED",
        is_autopilot_pick: true,
        created_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      },
    ],
  };
}
