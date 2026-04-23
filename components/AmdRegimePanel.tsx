"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import type { AmdStatus, AmdPhaseSignal, AmdState, AmdPhase } from "@/lib/advisory-types";

function stateTone(state: AmdState): string {
  switch (state) {
    case "NORMAL":    return "text-green-400 bg-green-400/10 border-green-400/20";
    case "WATCH":     return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    case "RISK":      return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    case "CONFIRMED": return "text-red-400 bg-red-400/10 border-red-400/20";
    case "SEVERE":    return "text-red-300 bg-red-300/15 border-red-300/30";
    default:          return "text-muted bg-surface border-white/5";
  }
}

function phaseTone(phase: AmdPhase): string {
  switch (phase) {
    case "ACCUMULATION": return "text-sky-300 bg-sky-400/10 border-sky-400/20";
    case "MANIPULATION": return "text-orange-300 bg-orange-400/10 border-orange-400/20";
    case "DISTRIBUTION": return "text-purple-300 bg-purple-400/10 border-purple-400/20";
    default:             return "text-muted bg-surface border-white/5";
  }
}

function modeTone(mode: string): string {
  switch (mode) {
    case "NORMAL":          return "text-green-400";
    case "REDUCE_SIZE":     return "text-yellow-400";
    case "REVIEW_ONLY":     return "text-orange-400";
    case "NO_NEW_TRADES":   return "text-red-400";
    case "FORCE_DE_RISK":   return "text-red-300";
    default:                return "text-muted";
  }
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
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
  { key: "vci_score", label: "VCI", hint: "Volatility Compression", color: "bg-blue-400" },
  { key: "vsi_score", label: "VSI", hint: "Volatility Shock",       color: "bg-red-400" },
  { key: "lsi_score", label: "LSI", hint: "Liquidity Stress",       color: "bg-orange-400" },
  { key: "sdi_score", label: "SDI", hint: "Skew Dislocation",       color: "bg-purple-400" },
  { key: "rii_score", label: "RII", hint: "Regime Instability",     color: "bg-yellow-400" },
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
      <div className="rounded-lg bg-surface px-3 py-2 shadow-glass-inset mb-3 text-[10px] text-muted">
        AMD regime data unavailable
      </div>
    );
  }

  const score = status?.amd_score ?? 0;
  const scoreColor =
    score < 25 ? "bg-green-400" :
    score < 45 ? "bg-yellow-400" :
    score < 65 ? "bg-orange-400" : "bg-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg bg-surface shadow-glass-inset mb-3 overflow-hidden"
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2 flex-wrap">
        <span className="text-[9px] uppercase tracking-widest text-muted">AMD Regime</span>
        {status && (
          <span className={cn("text-[9px] font-semibold rounded border px-1.5 py-[1px]", stateTone(status.amd_state))}>
            {status.amd_state}
          </span>
        )}
        {phase && phase.dominant_phase !== "UNKNOWN" && (
          <span className={cn("text-[9px] font-semibold rounded border px-1.5 py-[1px]", phaseTone(phase.dominant_phase))}>
            {phase.dominant_phase}
          </span>
        )}
        {status && (
          <span className={cn("ml-auto text-[9px] font-semibold", modeTone(status.final_trading_mode))}>
            {status.final_trading_mode.replace(/_/g, " ")}
          </span>
        )}
      </div>

      {/* Score bar + composite */}
      {status && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] text-muted w-12">Score</span>
            <div className="flex-1">
              <ScoreBar value={score} color={scoreColor} />
            </div>
            <span className="text-[10px] font-mono font-semibold text-primary w-8 text-right">
              {score.toFixed(0)}
            </span>
          </div>

          {/* Sub-indices */}
          <div className="grid grid-cols-5 gap-1 mt-1.5">
            {SUB_INDICES.map(({ key, label, hint, color }) => (
              <div key={key} className="flex flex-col gap-0.5" title={hint}>
                <ScoreBar value={(status as unknown as Record<string, number>)[key] ?? 0} color={color} />
                <span className="text-[8px] text-muted text-center">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase probabilities */}
      {phase && (
        <div className="border-t border-white/5 px-3 py-2 flex gap-3 text-[9px]">
          <span className="text-muted">Phase conf {(phase.phase_confidence * 100).toFixed(0)}%</span>
          <span className="text-sky-300">ACC {(phase.p_accumulation * 100).toFixed(0)}%</span>
          <span className="text-orange-300">MAN {(phase.p_manipulation * 100).toFixed(0)}%</span>
          <span className="text-purple-300">DIS {(phase.p_distribution * 100).toFixed(0)}%</span>
          {status?.base_regime && (
            <span className="ml-auto text-yellow-400">{status.base_regime}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
