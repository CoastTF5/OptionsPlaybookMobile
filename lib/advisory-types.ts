// ─── AMD Regime ───────────────────────────────────────────────────────────────

export type AmdState = "NORMAL" | "WATCH" | "RISK" | "CONFIRMED" | "SEVERE";
export type AmdIntegrity = "STABLE" | "FRAGILE" | "UNSTABLE" | "COMPROMISED" | "CRITICAL";
export type AmdTradingMode = "NORMAL" | "REDUCE_SIZE" | "REVIEW_ONLY" | "NO_NEW_TRADES" | "FORCE_DE_RISK";
export type AmdPhase = "ACCUMULATION" | "MANIPULATION" | "DISTRIBUTION" | "UNKNOWN";

export interface AmdStatus {
  computed_at: string;
  amd_score: number;           // 0–100 composite
  amd_state: AmdState;
  regime_integrity: AmdIntegrity;
  final_trading_mode: AmdTradingMode;
  base_regime: string | null;
  base_regime_confidence: number | null;
  // Sub-indices (0–100 each)
  vci_score: number;           // Volatility Compression Index
  vsi_score: number;           // Volatility Shock Index
  lsi_score: number;           // Liquidity Stress Index
  sdi_score: number;           // Skew Dislocation Index
  rii_score: number;           // Regime Instability Index
}

export interface AmdPhaseSignal {
  computed_at: string;
  dominant_phase: AmdPhase;
  phase_confidence: number;    // 0–1
  p_accumulation: number;
  p_manipulation: number;
  p_distribution: number;
  cum_delta: number | null;
  atr_ratio: number | null;
  iv_skew: number | null;
}

export interface AmdResponse {
  ok: boolean;
  status: AmdStatus | null;
  phase: AmdPhaseSignal | null;
  error?: string;
}

// ─── Market Briefing ──────────────────────────────────────────────────────────

export interface BriefingCache {
  cache_id: string;
  ts: string;
  key: string;
  payload: Record<string, unknown>;
}

export interface BriefingResponse {
  ok: boolean;
  briefing: BriefingCache | null;
  error?: string;
}

export interface BriefingsListResponse {
  ok: boolean;
  briefings: BriefingCache[];
  error?: string;
}

// ─── Position Advisories ──────────────────────────────────────────────────────

export type AdvisoryType =
  | "PROFIT_TARGET"
  | "STOP_LOSS"
  | "DELTA_DRIFT"
  | "ROLL_WINDOW"
  | "DATA_STALE"
  | "PORTFOLIO_STALE"
  | "POLICY_AUTHORITY_UNAVAILABLE";

export type AdvisorySeverity = "REVIEW" | "ACTION";
export type AdvisoryStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "EXPIRED";

export interface PositionLeg {
  strike?: number | string;
  right?: "C" | "P" | string;
  action?: "BUY" | "SELL" | string;
  ratio?: number;
  expiry?: string;
}

export interface AdvisoryPosition {
  legs: PositionLeg[] | null;
  expiry: string | null;
  entry_price: number | null;
  cost_basis: number | null;
  qty_open: number | null;
  unrealized_pnl: number | null;
  net_delta: number | null;
}

export interface PositionAdvisory {
  advisory_id: string;
  created_at: string;
  environment: string;
  underlying_symbol: string;
  structure: string | null;
  advisory_type: AdvisoryType;
  severity: AdvisorySeverity;
  status: AdvisoryStatus;
  trigger_snapshot: Record<string, unknown>;
  recommended_action: Record<string, unknown>;
  cooldown_until: string;
  resolved_reason: string | null;
  position?: AdvisoryPosition | null;
}

export interface AdvisoriesResponse {
  ok: boolean;
  advisories: PositionAdvisory[];
  error?: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ChatRequest {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface ChatResponse {
  ok: boolean;
  reply: string;
  error?: string;
}
