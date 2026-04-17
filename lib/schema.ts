import { z } from "zod";

const ToneSchema = z.enum(["success", "warn", "danger", "muted"]);

const OpsChipSchema = z.object({
  label: z.string(),
  tone: ToneSchema,
  hint: z.string().optional(),
});

const SignalSchema = z.object({
  key: z.string(),
  value: z.string(),
  tone: ToneSchema.optional(),
});

const TickerSchema = z.object({
  symbol: z.string(),
  price: z.number().nullable(),
  change_pct: z.number().nullable().optional(),
});

const PipelineSchema = z.object({
  regime_key: z.string().nullable(),
  archetype_key: z.string().nullable(),
  engine_key: z.string().nullable(),
  engine_role: z.enum(["primary", "promoted", "allowed"]).nullable(),
  strategy_label: z.string().nullable(),
});

const MarketAnalysisSchema = z.object({
  vrp: z.string().nullable(),
  skew: z.string().nullable(),
  headline: z.string().nullable(),
});

const ValidationSchema = z.object({
  status: z.enum(["APPROVE", "REVIEW", "WAIT", "REJECT", "UNKNOWN"]),
  summary: z.string(),
  age_minutes: z.number().int().nonnegative(),
});

const QueueItemSchema = z.object({
  candidate_id: z.string(),
  symbol: z.string(),
  structure: z.string(),
  dte: z.number().int().nonnegative(),
  expiry: z.string(),
  legs_label: z.string(),
  max_profit: z.number().nullable(),
  max_loss: z.number().nullable(),
  pop: z.number().min(0).max(1).nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  spot_price: z.number().nullable(),
  pipeline: PipelineSchema,
  market_analysis: MarketAnalysisSchema.optional(),
  validation: ValidationSchema,
  mode: z.enum(["CONSIDERED", "APPROVED"]),
  is_autopilot_pick: z.boolean(),
  created_at: z.string(),
});

export const SnapshotSchema = z.object({
  generated_at: z.string(),
  environment: z.enum(["paper", "live"]),
  ops: z.object({
    status: z.enum(["READY", "DEGRADED", "BLOCKED", "UNKNOWN"]),
    hydration_age_seconds: z.number().int().nonnegative().nullable(),
    chips: z.array(OpsChipSchema),
  }),
  regime: z.object({
    regime_key: z.string().nullable(),
    regime_confidence: z.number().min(0).max(1).nullable(),
    archetype_key: z.string().nullable(),
    archetype_confidence: z.number().min(0).max(1).nullable(),
    signals: z.array(SignalSchema),
    tickers: z.array(TickerSchema),
  }),
  queue: z.array(QueueItemSchema),
});

export type Snapshot = z.infer<typeof SnapshotSchema>;
export type QueueItem = z.infer<typeof QueueItemSchema>;
export type Tone = z.infer<typeof ToneSchema>;
