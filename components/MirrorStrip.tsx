"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import type { Snapshot } from "@/lib/schema";

function opsDotColor(status: Snapshot["ops"]["status"]): string {
  if (status === "READY") return "bg-tone-success";
  if (status === "DEGRADED") return "bg-tone-warn";
  if (status === "BLOCKED") return "bg-tone-danger";
  return "bg-muted";
}

export function MirrorStrip({
  ops,
  regime,
}: {
  ops: Snapshot["ops"];
  regime: Snapshot["regime"];
}) {
  const reduceMotion = useReducedMotion();
  const regimeConf =
    regime.regime_confidence != null ? Math.round(regime.regime_confidence * 100) : null;
  const archConf =
    regime.archetype_confidence != null ? Math.round(regime.archetype_confidence * 100) : null;

  const vrpSignal = regime.signals.find((s) => s.tone === "success");
  const skewSignal = regime.signals.find(
    (s) => s.key.toLowerCase() === "skew" || s.key.toLowerCase().includes("skew"),
  );

  const dotColor = opsDotColor(ops.status);

  return (
    <div className="rounded-2xl bg-surface border border-border p-3 mb-3 flex items-center gap-3">
      <motion.span
        aria-label={`Ops ${ops.status}`}
        className={cn("h-[7px] w-[7px] rounded-full flex-shrink-0", dotColor)}
        animate={
          !reduceMotion && ops.status === "READY" ? { opacity: [0.45, 1, 0.45] } : undefined
        }
        transition={
          !reduceMotion && ops.status === "READY"
            ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      />

      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-widest text-muted">
          Regime
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {regime.regime_key ? (
            <>
              <span className="text-[13px] font-bold text-tone-warn">
                {regime.regime_key}
              </span>
              {regimeConf != null && (
                <span className="text-[10px] text-tertiary">({regimeConf}%)</span>
              )}
            </>
          ) : (
            <span className="text-[13px] text-muted">—</span>
          )}
          {regime.regime_key && regime.archetype_key && (
            <span className="text-[11px] text-muted">→</span>
          )}
          {regime.archetype_key && (
            <>
              <span className="text-[13px] font-bold text-tone-info">
                {regime.archetype_key}
              </span>
              {archConf != null && (
                <span className="text-[10px] text-tertiary">({archConf}%)</span>
              )}
            </>
          )}
        </div>
        {skewSignal && (
          <div className="text-[10px] text-tertiary mt-0.5">
            {skewSignal.key} {skewSignal.value}
          </div>
        )}
      </div>

      {vrpSignal && (
        <span className="flex-shrink-0 rounded-full bg-tone-success-dim text-tone-success text-[10px] font-bold tracking-wide px-2.5 py-1 whitespace-nowrap">
          {vrpSignal.key} {vrpSignal.value}
        </span>
      )}
    </div>
  );
}
