"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { BriefingCache } from "@/lib/advisory-types";

function extractText(payload: Record<string, unknown>): string {
  // ATHENA stores briefings in various shapes. Walk common keys to find text.
  const candidates = [
    payload.summary,
    payload.analysis,
    payload.briefing,
    payload.content,
    payload.text,
    payload.narrative,
    payload.market_summary,
    payload.output,
    payload.response,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) return c.trim();
  }
  // Check nested sections
  const sections = payload.sections as Record<string, unknown>[] | undefined;
  if (Array.isArray(sections)) {
    return sections
      .map((s) => {
        const title = typeof s.title === "string" ? `**${s.title}**` : "";
        const body = typeof s.content === "string" ? s.content : typeof s.body === "string" ? s.body : "";
        return [title, body].filter(Boolean).join("\n");
      })
      .join("\n\n");
  }
  return JSON.stringify(payload, null, 2).slice(0, 800);
}

function timeAgo(ts: string): string {
  const diff = (Date.now() - new Date(ts).getTime()) / 60_000;
  if (diff < 1) return "just now";
  if (diff < 60) return `${Math.round(diff)}m ago`;
  return `${Math.round(diff / 60)}h ago`;
}

export function MarketBriefingPanel({ briefing }: { briefing: BriefingCache | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!briefing) {
    return (
      <div className="rounded-lg bg-surface px-3 py-2 shadow-glass-inset mb-3 text-[10px] text-muted">
        No ATHENA briefing available
      </div>
    );
  }

  const text = extractText(briefing.payload);
  const isLong = text.length > 300;
  const displayText = !expanded && isLong ? text.slice(0, 300) + "…" : text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg bg-surface shadow-glass-inset mb-3"
    >
      <button
        className="w-full flex items-center gap-2 px-3 pt-2.5 pb-2 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-[9px] uppercase tracking-widest text-muted">ATHENA Briefing</span>
        <span className="text-[9px] text-muted ml-1">{timeAgo(briefing.ts)}</span>
        {briefing.key && (
          <span className="text-[8px] rounded bg-white/5 px-1 py-[1px] text-tertiary font-mono ml-1 truncate max-w-[120px]">
            {briefing.key}
          </span>
        )}
        <span className="ml-auto text-[9px] text-muted">{expanded ? "▲" : "▼"}</span>
      </button>

      <AnimatePresence initial={false}>
        {expanded || !isLong ? (
          <motion.div
            key="body"
            initial={isLong ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 text-[10px] text-secondary leading-relaxed whitespace-pre-wrap">
              {displayText}
              {!expanded && isLong && (
                <button
                  className="block mt-1 text-sky-400 hover:text-sky-300 text-[9px]"
                  onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                >
                  Read more
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="preview" className="px-3 pb-3 text-[10px] text-secondary leading-relaxed">
            {displayText}
            <button
              className="block mt-1 text-sky-400 hover:text-sky-300 text-[9px]"
              onClick={() => setExpanded(true)}
            >
              Read more
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
