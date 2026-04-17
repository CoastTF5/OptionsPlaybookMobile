"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { QueueItem } from "@/lib/schema";

function validationBarColor(status: QueueItem["validation"]["status"]): string {
  switch (status) {
    case "APPROVE":
      return "bg-green-400";
    case "REJECT":
      return "bg-red-400";
    case "WAIT":
      return "bg-yellow-400";
    default:
      return "bg-amber-400";
  }
}

function validationTextColor(status: QueueItem["validation"]["status"]): string {
  switch (status) {
    case "APPROVE":
      return "text-green-400";
    case "REJECT":
      return "text-red-400";
    case "WAIT":
      return "text-yellow-400";
    default:
      return "text-amber-400";
  }
}

export function MirrorTradeCard({ item }: { item: QueueItem }) {
  const popLabel = item.pop != null ? formatPercent(item.pop) : "—";
  const confLabel = item.confidence != null ? formatPercent(item.confidence) : "—";
  const ageLabel =
    item.validation.age_minutes < 60
      ? `${item.validation.age_minutes}m ago`
      : `${Math.round(item.validation.age_minutes / 60)}h ago`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={cn("relative rounded-lg bg-surface p-3 shadow-glass-inset mb-2")}
    >
      <header className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-sky-300">{item.symbol}</span>
          <span className="text-xs font-semibold text-primary">{item.structure}</span>
          <span className="text-[10px] text-muted">{item.dte}d</span>
          {item.mode === "CONSIDERED" && (
            <span className="text-[9px] font-semibold rounded-full bg-sky-500/10 text-sky-300 px-1.5 py-[1px]">
              CONSIDERED
            </span>
          )}
          {item.is_autopilot_pick && (
            <motion.span
              className="text-[9px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 px-1.5 py-[1px]"
              animate={{
                boxShadow: [
                  "0 0 0 rgba(16,185,129,0)",
                  "0 0 10px rgba(16,185,129,0.35)",
                  "0 0 0 rgba(16,185,129,0)",
                ],
              }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              AUTOPILOT
            </motion.span>
          )}
        </div>
        <div className="text-[11px] whitespace-nowrap">
          <span className="text-green-400 font-semibold">{formatCurrency(item.max_profit)}</span>
          <span className="text-muted"> / </span>
          <span className="text-red-400">{formatCurrency(item.max_loss)}</span>
        </div>
      </header>

      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-secondary">
        <span className="font-mono">{item.legs_label}</span>
        <span className="text-muted">·</span>
        <span>POP {popLabel}</span>
        <span className="text-muted">·</span>
        <span className="text-sky-300">Conf {confLabel}</span>
        <span className="text-muted">·</span>
        <span>Exp {item.expiry}</span>
        {item.spot_price != null && (
          <>
            <span className="text-muted">·</span>
            <span>
              {item.symbol} @ {item.spot_price.toLocaleString()}
            </span>
          </>
        )}
      </div>

      <div className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-tertiary">
        {item.pipeline.regime_key && (
          <span className="font-semibold text-yellow-400">{item.pipeline.regime_key}</span>
        )}
        {item.pipeline.regime_key && item.pipeline.archetype_key && <span>→</span>}
        {item.pipeline.archetype_key && (
          <span className="font-semibold text-sky-300">{item.pipeline.archetype_key}</span>
        )}
        {item.pipeline.archetype_key && item.pipeline.engine_key && <span>→</span>}
        {item.pipeline.engine_key && (
          <span className="font-semibold text-green-400">
            {item.pipeline.engine_key}
            {item.pipeline.engine_role ? ` ${item.pipeline.engine_role}` : ""}
          </span>
        )}
        {item.pipeline.strategy_label && (
          <>
            <span>·</span>
            <span>{item.pipeline.strategy_label}</span>
          </>
        )}
      </div>

      {item.market_analysis &&
        (item.market_analysis.vrp || item.market_analysis.skew || item.market_analysis.headline) && (
          <div className="mt-1 text-[10px] text-tertiary">
            {[
              item.market_analysis.headline,
              item.market_analysis.vrp && `VRP ${item.market_analysis.vrp}`,
              item.market_analysis.skew && `Skew ${item.market_analysis.skew}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        )}

      <div className="mt-2 flex items-center gap-2 pl-2 relative">
        <motion.span
          className={cn("absolute left-0 top-0 bottom-0 w-[2px] rounded-l", validationBarColor(item.validation.status))}
          aria-hidden
          animate={
            item.validation.status === "WAIT"
              ? { opacity: [0.45, 1, 0.45] }
              : item.validation.status === "APPROVE"
                ? {
                    boxShadow: [
                      "0 0 0 rgba(74,222,128,0)",
                      "0 0 6px rgba(74,222,128,0.6)",
                      "0 0 0 rgba(74,222,128,0)",
                    ],
                  }
                : { opacity: 1 }
          }
          transition={
            item.validation.status === "WAIT"
              ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
              : item.validation.status === "APPROVE"
                ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                : undefined
          }
        />
        <span className={cn("text-[10px]", validationTextColor(item.validation.status))}>
          {item.validation.summary}
        </span>
        <span className="text-[9px] text-muted ml-auto">{ageLabel}</span>
      </div>
    </motion.article>
  );
}
