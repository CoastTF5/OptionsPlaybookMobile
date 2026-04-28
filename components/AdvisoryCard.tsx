"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import type {
  PositionAdvisory,
  AdvisoryType,
  AdvisorySeverity,
  PositionLeg,
} from "@/lib/advisory-types";

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

const STRUCTURE_NAMES: Record<string, string> = {
  PCS: "Put Credit Spread",
  CCS: "Call Credit Spread",
  BPS: "Bull Put Spread",
  BCS: "Bear Call Spread",
  IC:  "Iron Condor",
  IB:  "Iron Butterfly",
  CSP: "Cash-Secured Put",
  CC:  "Covered Call",
  LCALL: "Long Call",
  LPUT:  "Long Put",
  SCALL: "Short Call",
  SPUT:  "Short Put",
};

function structureLabel(structure: string | null): string | null {
  if (!structure) return null;
  return STRUCTURE_NAMES[structure.toUpperCase()] ?? structure;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function fmtMoney(n: number, opts: { sign?: boolean; decimals?: number } = {}): string {
  const decimals = opts.decimals ?? 2;
  const sign = opts.sign && n > 0 ? "+" : "";
  return `${sign}$${Math.abs(n).toFixed(decimals)}${n < 0 ? "" : ""}`.replace("$-", "-$");
}

function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  // Accept "YYYY-MM-DD" or full ISO; render as "Apr 30"
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function legSign(leg: PositionLeg): string {
  const a = (leg.action ?? "").toString().toUpperCase();
  if (a === "SELL") return "−";
  if (a === "BUY") return "+";
  return "";
}

function legStrike(leg: PositionLeg): string {
  const s = asNumber(leg.strike);
  if (s == null) return "?";
  return Number.isInteger(s) ? s.toString() : s.toFixed(1).replace(/\.0$/, "");
}

function formatLegs(legs: PositionLeg[] | null | undefined): string | null {
  if (!legs || legs.length === 0) return null;
  // Sort short legs first for credit spreads (SELL before BUY) — reads more naturally.
  const ordered = [...legs].sort((a, b) => {
    const aSell = (a.action ?? "").toString().toUpperCase() === "SELL" ? 0 : 1;
    const bSell = (b.action ?? "").toString().toUpperCase() === "SELL" ? 0 : 1;
    return aSell - bSell;
  });
  return ordered
    .map((l) => {
      const right = (l.right ?? "").toString().toUpperCase();
      const r = right === "C" ? "C" : right === "P" ? "P" : "";
      return `${legSign(l)}${legStrike(l)}${r}`;
    })
    .join(" / ");
}

function entryCreditDebit(
  entry: number | null,
  legs: PositionLeg[] | null | undefined,
): { label: "credit" | "debit" | "premium"; value: number } | null {
  if (entry == null) return null;
  // Convention varies, but for credit spreads the engine records entry_price as a positive
  // credit amount per contract. Best-effort labeling: net SELL → credit, net BUY → debit.
  let label: "credit" | "debit" | "premium" = "premium";
  if (legs && legs.length > 0) {
    const sells = legs.filter((l) => (l.action ?? "").toString().toUpperCase() === "SELL").length;
    const buys = legs.filter((l) => (l.action ?? "").toString().toUpperCase() === "BUY").length;
    if (sells > buys) label = "credit";
    else if (buys > sells) label = "debit";
  }
  return { label, value: Math.abs(entry) };
}

function recommendationHeadline(advisory: PositionAdvisory): string {
  const action = advisory.recommended_action ?? {};
  const details = typeof action.details === "string" ? action.details : null;
  if (details && details.length > 0) return details;

  switch (advisory.advisory_type) {
    case "PROFIT_TARGET": return "Profit target reached — consider closing";
    case "STOP_LOSS":     return "Stop-loss breached — consider closing";
    case "DELTA_DRIFT":   return "Delta drift outside band — consider adjusting";
    case "ROLL_WINDOW":   return "Inside roll window — consider rolling";
    case "DATA_STALE":    return "Position data is stale";
    case "PORTFOLIO_STALE": return "Portfolio data is stale";
    case "POLICY_AUTHORITY_UNAVAILABLE": return "Policy authority unavailable";
    default: return String(advisory.advisory_type).replace(/_/g, " ").toLowerCase();
  }
}

function actionVerb(advisory: PositionAdvisory): string | null {
  const a = (advisory.recommended_action?.action as string | undefined)?.toUpperCase();
  if (!a) return null;
  switch (a) {
    case "CLOSE":  return "Close";
    case "ADJUST": return "Adjust";
    case "ROLL":   return "Roll";
    case "WAIT":   return "Wait";
    default:       return a;
  }
}

export function AdvisoryCard({ advisory }: { advisory: PositionAdvisory }) {
  const badge = statusBadge(advisory.status);
  const sev = severityClasses(advisory.severity);
  const struct = structureLabel(advisory.structure);
  const pos = advisory.position ?? null;

  const legsLine = formatLegs(pos?.legs);
  const expiry = fmtDate(pos?.expiry ?? null);
  const credit = entryCreditDebit(asNumber(pos?.entry_price), pos?.legs);

  // Trigger metrics (varies by advisory_type)
  const snap = advisory.trigger_snapshot ?? {};
  const pnlPct = asNumber((snap as Record<string, unknown>).pnl_pct);
  const unrealized = asNumber(pos?.unrealized_pnl ?? (snap as Record<string, unknown>).unrealized_pnl);
  const netDelta = asNumber(pos?.net_delta ?? (snap as Record<string, unknown>).net_delta);
  const dte = asNumber((snap as Record<string, unknown>).dte);

  const verb = actionVerb(advisory);
  const headline = recommendationHeadline(advisory);

  return (
    <motion.article
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="rounded-2xl bg-surface border border-border p-3 mb-2.5"
    >
      {/* Header row: symbol + structure label + status/severity badges */}
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
          <span className="text-[13px] font-bold text-tone-info">
            {advisory.underlying_symbol}
          </span>
          {struct && (
            <span className="text-[11px] font-semibold text-primary">{struct}</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={cn("text-[9px] font-bold rounded-full px-2 py-0.5 tracking-wider", badge.cls)}>
            {badge.label}
          </span>
          <span className={cn("text-[9px] font-bold rounded-full px-2 py-0.5 tracking-wider", sev.bg, sev.text)}>
            {advisory.severity}
          </span>
        </div>
      </div>

      {/* Trade setup line: legs · expiry · credit */}
      {(legsLine || expiry || credit) && (
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {legsLine && (
            <span className="text-[12px] font-mono font-semibold text-primary tracking-tight">
              {legsLine}
            </span>
          )}
          {expiry && (
            <span className="text-[10px] text-tertiary">exp {expiry}</span>
          )}
          {credit && (
            <span className="text-[10px] text-tertiary">
              {credit.label} {credit.value.toFixed(2)}
            </span>
          )}
          {pos?.qty_open != null && pos.qty_open > 0 && (
            <span className="text-[10px] text-muted">×{pos.qty_open}</span>
          )}
        </div>
      )}

      {/* Headline recommendation in plain English */}
      <div className="mt-2 text-[12px] leading-snug text-secondary">
        {verb ? <span className="font-semibold text-primary">{verb}: </span> : null}
        {headline}
      </div>

      {/* Live metrics row */}
      {(unrealized != null || pnlPct != null || netDelta != null || dte != null) && (
        <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] text-tertiary">
          {unrealized != null && (
            <span className={cn(
              "font-semibold",
              unrealized > 0 ? "text-tone-success" : unrealized < 0 ? "text-tone-danger" : "text-tertiary",
            )}>
              P&L {fmtMoney(unrealized, { sign: true })}
              {pnlPct != null && ` (${pnlPct > 0 ? "+" : ""}${pnlPct.toFixed(1)}%)`}
            </span>
          )}
          {unrealized == null && pnlPct != null && (
            <span className={cn(
              "font-semibold",
              pnlPct > 0 ? "text-tone-success" : pnlPct < 0 ? "text-tone-danger" : "text-tertiary",
            )}>
              {pnlPct > 0 ? "+" : ""}{pnlPct.toFixed(1)}%
            </span>
          )}
          {netDelta != null && <span>Δ {netDelta >= 0 ? "+" : ""}{netDelta.toFixed(2)}</span>}
          {dte != null && <span>{dte} DTE</span>}
        </div>
      )}

      <div className="mt-1.5 text-[9px] text-muted">{timeAgo(advisory.created_at)}</div>
    </motion.article>
  );
}
