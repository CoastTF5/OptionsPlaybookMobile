"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import type { PositionAdvisory, AdvisoryType, AdvisorySeverity } from "@/lib/advisory-types";

type ToneClasses = { icon: string; bg: string; text: string };

function severityClasses(severity: AdvisorySeverity): ToneClasses {
  if (severity === "ACTION") {
    return {
      icon: "text-tone-danger",
      bg: "bg-tone-danger-dim",
      text: "text-tone-danger",
    };
  }
  return {
    icon: "text-tone-warn",
    bg: "bg-tone-warn-dim",
    text: "text-tone-warn",
  };
}

function advisoryIcon(type: AdvisoryType): string {
  switch (type) {
    case "PROFIT_TARGET":              return "✓";
    case "STOP_LOSS":                  return "!";
    case "DELTA_DRIFT":                return "Δ";
    case "ROLL_WINDOW":                return "↻";
    case "DATA_STALE":                 return "·";
    case "PORTFOLIO_STALE":            return "·";
    case "POLICY_AUTHORITY_UNAVAILABLE": return "×";
    default:                           return "·";
  }
}

function advisoryLabel(type: AdvisoryType): string {
  return type.replace(/_/g, " ");
}

function statusBadge(status: PositionAdvisory["status"]): { label: string; cls: string } {
  switch (status) {
    case "OPEN":         return { label: "OPEN", cls: "text-tone-warn bg-tone-warn-dim" };
    case "ACKNOWLEDGED": return { label: "ACK",  cls: "text-tone-info bg-tone-info-dim" };
    case "RESOLVED":     return { label: "DONE", cls: "text-tone-success bg-tone-success-dim" };
    case "EXPIRED":      return { label: "EXP",  cls: "text-muted bg-white/[0.06]" };
    default:             return { label: status, cls: "text-muted bg-white/[0.06]" };
  }
}

function timeAgo(ts: string): string {
  const diff = (Date.now() - new Date(ts).getTime()) / 60_000;
  if (diff < 1) return "just now";
  if (diff < 60) return `${Math.round(diff)}m ago`;
  return `${Math.round(diff / 60)}h ago`;
}

function extractRecommendation(action: Record<string, unknown>): string {
  const parts: string[] = [];
  if (action.order_intent) parts.push(String(action.order_intent));
  if (action.ratio != null) parts.push(`${(Number(action.ratio) * 100).toFixed(0)}%`);
  if (action.reason) parts.push(String(action.reason));
  if (action.target_delta != null) parts.push(`Δ→${action.target_delta}`);
  return parts.join(" · ") || JSON.stringify(action).slice(0, 80);
}

export function AdvisoryCard({ advisory }: { advisory: PositionAdvisory }) {
  const badge = statusBadge(advisory.status);
  const recommendation = extractRecommendation(advisory.recommended_action);
  const sev = severityClasses(advisory.severity);

  return (
    <motion.article
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="rounded-2xl bg-surface border border-border p-3 mb-2.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span
            className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center text-[14px] font-bold flex-shrink-0",
              sev.bg,
              sev.icon,
            )}
            aria-hidden
          >
            {advisoryIcon(advisory.advisory_type)}
          </span>
          <span className="text-[12px] font-bold text-tone-info">
            {advisory.underlying_symbol}
          </span>
          {advisory.structure && (
            <span className="text-[11px] font-semibold text-primary">{advisory.structure}</span>
          )}
          <span className="text-[10px] text-tertiary">{advisoryLabel(advisory.advisory_type)}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span
            className={cn("text-[9px] font-bold rounded-full px-2 py-0.5 tracking-wider", badge.cls)}
          >
            {badge.label}
          </span>
          <span
            className={cn("text-[9px] font-bold rounded-full px-2 py-0.5 tracking-wider", sev.bg, sev.text)}
          >
            {advisory.severity}
          </span>
        </div>
      </div>

      {recommendation && (
        <div className="mt-2 text-[11px] font-medium text-secondary">{recommendation}</div>
      )}

      <div className="mt-1 text-[9px] text-muted">{timeAgo(advisory.created_at)}</div>
    </motion.article>
  );
}
