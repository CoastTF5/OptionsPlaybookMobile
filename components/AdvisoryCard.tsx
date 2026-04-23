"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import type { PositionAdvisory, AdvisoryType, AdvisorySeverity } from "@/lib/advisory-types";

function severityColor(severity: AdvisorySeverity): string {
  return severity === "ACTION" ? "text-red-400" : "text-yellow-400";
}

function advisoryIcon(type: AdvisoryType): string {
  switch (type) {
    case "PROFIT_TARGET":              return "✓";
    case "STOP_LOSS":                  return "⚠";
    case "DELTA_DRIFT":                return "Δ";
    case "ROLL_WINDOW":                return "↻";
    case "DATA_STALE":                 return "⏱";
    case "PORTFOLIO_STALE":            return "⏱";
    case "POLICY_AUTHORITY_UNAVAILABLE": return "⛔";
    default:                           return "•";
  }
}

function advisoryLabel(type: AdvisoryType): string {
  return type.replace(/_/g, " ");
}

function statusBadge(status: PositionAdvisory["status"]): { label: string; cls: string } {
  switch (status) {
    case "OPEN":         return { label: "OPEN",  cls: "text-yellow-400 bg-yellow-400/10" };
    case "ACKNOWLEDGED": return { label: "ACK",   cls: "text-sky-400 bg-sky-400/10" };
    case "RESOLVED":     return { label: "DONE",  cls: "text-green-400 bg-green-400/10" };
    case "EXPIRED":      return { label: "EXP",   cls: "text-muted bg-white/5" };
    default:             return { label: status,  cls: "text-muted bg-white/5" };
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

  return (
    <motion.article
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="relative rounded-lg bg-surface px-3 py-2.5 shadow-glass-inset mb-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn("text-[12px]", severityColor(advisory.severity))}>
            {advisoryIcon(advisory.advisory_type)}
          </span>
          <span className="text-[11px] font-semibold text-sky-300">{advisory.underlying_symbol}</span>
          {advisory.structure && (
            <span className="text-[10px] text-primary">{advisory.structure}</span>
          )}
          <span className="text-[9px] text-tertiary">{advisoryLabel(advisory.advisory_type)}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={cn("text-[8px] font-semibold rounded px-1.5 py-[1px]", badge.cls)}>
            {badge.label}
          </span>
          <span className={cn("text-[8px] font-semibold", severityColor(advisory.severity))}>
            {advisory.severity}
          </span>
        </div>
      </div>

      {recommendation && (
        <div className="mt-1 text-[10px] text-secondary">
          {recommendation}
        </div>
      )}

      <div className="mt-1 text-[9px] text-muted">{timeAgo(advisory.created_at)}</div>
    </motion.article>
  );
}
