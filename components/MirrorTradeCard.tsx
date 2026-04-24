"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { QueueItem } from "@/lib/schema";

type ValidationStatus = QueueItem["validation"]["status"];

function validationTone(status: ValidationStatus): {
  dot: string;
  text: string;
} {
  switch (status) {
    case "APPROVE":
      return { dot: "bg-tone-success", text: "text-tone-success" };
    case "WAIT":
      return { dot: "bg-tone-warn", text: "text-tone-warn" };
    case "REVIEW":
      return { dot: "bg-tone-warn", text: "text-tone-warn" };
    case "REJECT":
      return { dot: "bg-tone-danger", text: "text-tone-danger" };
    default:
      return { dot: "bg-muted", text: "text-muted" };
  }
}

function ConfidenceRing({ confidence }: { confidence: number | null }) {
  const pct = confidence != null ? Math.round(confidence * 100) : 0;
  const size = 56;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(1, confidence ?? 0)));

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Confidence ${pct}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#7dd3fc"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="num text-[12px] font-bold text-primary">
          {confidence != null ? pct : "—"}
        </span>
      </div>
    </div>
  );
}

export function MirrorTradeCard({ item }: { item: QueueItem }) {
  const reduceMotion = useReducedMotion();
  const popPct = item.pop != null ? Math.round(item.pop * 100) : null;
  const ageLabel =
    item.validation.age_minutes < 60
      ? `${item.validation.age_minutes}m ago`
      : `${Math.round(item.validation.age_minutes / 60)}h ago`;

  const tone = validationTone(item.validation.status);
  const strategy = item.pipeline.strategy_label ?? item.structure;
  const expiryShort = item.expiry.length >= 10 ? item.expiry.slice(5) : item.expiry;

  const dotAnimate =
    !reduceMotion && item.validation.status === "WAIT"
      ? { opacity: [0.45, 1, 0.45] }
      : !reduceMotion && item.validation.status === "APPROVE"
        ? {
            boxShadow: [
              "0 0 0 rgba(52,211,153,0)",
              "0 0 8px rgba(52,211,153,0.7)",
              "0 0 0 rgba(52,211,153,0)",
            ],
          }
        : undefined;

  const dotTransition =
    !reduceMotion && item.validation.status === "WAIT"
      ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" as const }
      : !reduceMotion && item.validation.status === "APPROVE"
        ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const }
        : undefined;

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="rounded-2xl bg-surface border border-border p-3.5 mb-2.5"
    >
      <div className="flex items-start gap-3">
        <ConfidenceRing confidence={item.confidence} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[17px] font-bold text-primary"
              style={{ letterSpacing: "-0.01em" }}
            >
              {item.symbol}
            </span>
            <span className="text-[11px] font-semibold text-tertiary">{strategy}</span>
            {item.is_autopilot_pick && (
              <motion.span
                className="text-[9px] font-bold rounded-full bg-tone-success-dim text-tone-success px-2 py-0.5 tracking-wider"
                animate={
                  !reduceMotion
                    ? {
                        boxShadow: [
                          "0 0 0 rgba(52,211,153,0)",
                          "0 0 10px rgba(52,211,153,0.35)",
                          "0 0 0 rgba(52,211,153,0)",
                        ],
                      }
                    : undefined
                }
                transition={
                  !reduceMotion
                    ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                    : undefined
                }
              >
                AUTOPILOT
              </motion.span>
            )}
            {item.mode === "CONSIDERED" && !item.is_autopilot_pick && (
              <span className="text-[9px] font-bold rounded-full bg-tone-info-dim text-tone-info px-2 py-0.5 tracking-wider">
                CONSIDERED
              </span>
            )}
          </div>
          <div className="num text-[11px] text-tertiary mt-0.5">
            {item.legs_label} · {item.dte}d · exp {expiryShort}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px bg-border rounded-lg overflow-hidden mt-3">
        <div className="bg-surface-elev p-2.5">
          <div className="text-[9px] font-semibold uppercase tracking-widest text-muted">
            Max Profit
          </div>
          <div className="num text-[14px] font-bold text-tone-success mt-0.5">
            {formatCurrency(item.max_profit)}
          </div>
        </div>
        <div className="bg-surface-elev p-2.5">
          <div className="text-[9px] font-semibold uppercase tracking-widest text-muted">
            Max Loss
          </div>
          <div className="num text-[14px] font-bold text-tone-danger mt-0.5">
            {item.max_loss != null ? `\u2212$${Math.abs(item.max_loss).toLocaleString()}` : "—"}
          </div>
        </div>
        <div className="bg-surface-elev p-2.5">
          <div className="text-[9px] font-semibold uppercase tracking-widest text-muted">
            POP
          </div>
          <div className="num text-[14px] font-bold text-primary mt-0.5">
            {popPct != null ? `${popPct}%` : "—"}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <motion.span
          className={cn("h-1.5 w-1.5 rounded-full", tone.dot)}
          aria-hidden
          animate={dotAnimate}
          transition={dotTransition}
        />
        <span className={cn("text-[11px]", tone.text)}>{item.validation.summary}</span>
        <span className="text-[9px] text-muted ml-auto">{ageLabel}</span>
      </div>
    </motion.article>
  );
}
