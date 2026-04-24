"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import type { AmdStatus, AmdPhaseSignal, AmdState, AmdPhase } from "@/lib/advisory-types";

function stateChip(state: AmdState): string {
  switch (state) {
    case "NORMAL":    return "text-tone-success bg-tone-success-dim";
    case "WATCH":     return "text-tone-warn bg-tone-warn-dim";
    case "RISK":      return "text-tone-warn bg-tone-warn-dim";
    case "CONFIRMED": return "text-tone-danger bg-tone-danger-dim";
    case "SEVERE":    return "text-tone-danger bg-tone-danger-dim";
    default:          return "text-muted bg-white/[0.06]";
  }
}

function phaseChip(phase: AmdPhase): string {
  switch (phase) {
    case "ACCUMULATION": return "text-tone-info bg-tone-info-dim";
    case "MANIPULATION": return "text-tone-warn bg-tone-warn-dim";
    case "DISTRIBUTION": return "text-tone-danger bg-tone-danger-dim";
    default:             return "text-muted bg-white/[0.06]";
  }
}

function modeTone(mode: string): string {
  switch (mode) {
    case "NORMAL":          return "text-tone-success";
    case "REDUCE_SIZE":     return "text-tone-warn";
    case "REVIEW_ONLY":     return "text-tone-warn";
    case "NO_NEW_TRADES":   return "text-tone-danger";
    case "FORCE_DE_RISK":   return "text-tone-danger";
    default:                return "text-muted";
  }
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-[3px] w-full rounded-full bg-white/5 overflow-hidden">
      <motion.div
        className={cn("h-full rounded-full", color)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, value)}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </div>
  );
}

const SUB_INDICES = [
  { key: "vci_score", label: "VCI", hint: "Volatility Compression", color: "bg-tone-info" },
  { key: "vsi_score", label: "VSI", hint: "Volatility Shock",       color: "bg-tone-danger" },
  { key: "lsi_score", label: "LSI", hint: "Liquidity Stress",       color: "bg-tone-warn" },
  { key: "sdi_score", label: "SDI", hint: "Skew Dislocation",       color: "bg-tone-info" },
  { key: "rii_score", label: "RII", hint: "Regime Instability",     color: "bg-tone-warn" },
] as const;

export function AmdRegimePanel({
  status,
  phase,
}: {
  status: AmdStatus | null;
  phase: AmdPhaseSignal | null;
}) {
  if (!status && !phase) {
    return (
      <div className="rounded-2xl bg-surface border border-border px-3 py-2.5 mb-3 text-[10px] text-muted">
        AMD regime data unavailable
      </div>
    );
  }

  const score = status?.amd_score ?? 0;
  const scoreColor =
    score < 25 ? "bg-tone-success" :
    score < 45 ? "bg-tone-warn" :
    score < 65 ? "bg-tone-warn" : "bg-tone-danger";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-surface border border-border mb-3 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2 flex-wrap">
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted">
          AMD Regime
        </span>
        {status && (
          <span
            className={cn(
              "text-[9px] font-bold rounded-full px-2 py-0.5 tracking-wider",
              stateChip(status.amd_state),
            )}
          >
            {status.amd_state}
          </span>
        )}
        {phase && phase.dominant_phase !== "UNKNOWN" && (
          <span
            className={cn(
              "text-[9px] font-bold rounded-full px-2 py-0.5 tracking-wider",
              phaseChip(phase.dominant_phase),
            )}
          >
            {phase.dominant_phase}
          </span>
        )}
        {status && (
          <span className={cn("ml-auto text-[9px] font-bold tracking-wider", modeTone(status.final_trading_mode))}>
            {status.final_trading_mode.replace(/_/g, " ")}
          </span>
        )}
      </div>

      {status && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted w-12">
              Score
            </span>
            <div className="flex-1">
              <ScoreBar value={score} color={scoreColor} />
            </div>
            <span className="num text-[11px] font-bold text-primary w-8 text-right">
              {score.toFixed(0)}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 mt-2">
            {SUB_INDICES.map(({ key, label, hint, color }) => (
              <div key={key} className="flex flex-col gap-1" title={hint}>
                <ScoreBar value={(status as unknown as Record<string, number>)[key] ?? 0} color={color} />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted text-center">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase && (
        <div className="border-t border-border px-3 py-2 flex gap-3 text-[9px] flex-wrap">
          <span className="text-muted">
            Phase conf <span className="num text-secondary">{(phase.phase_confidence * 100).toFixed(0)}%</span>
          </span>
          <span className="text-tone-info">
            ACC <span className="num">{(phase.p_accumulation * 100).toFixed(0)}%</span>
          </span>
          <span className="text-tone-warn">
            MAN <span className="num">{(phase.p_manipulation * 100).toFixed(0)}%</span>
          </span>
          <span className="text-tone-danger">
            DIS <span className="num">{(phase.p_distribution * 100).toFixed(0)}%</span>
          </span>
          {status?.base_regime && (
            <span className="ml-auto text-tone-warn font-bold tracking-wider">
              {status.base_regime}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
