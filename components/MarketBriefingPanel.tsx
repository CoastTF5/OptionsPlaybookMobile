"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { BriefingCache } from "@/lib/advisory-types";
import { extractText, relativeTime } from "@/lib/briefing";

export function MarketBriefingPanel({ briefing }: { briefing: BriefingCache | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!briefing) {
    return (
      <div className="rounded-2xl bg-surface border border-border px-3 py-2.5 mb-3 text-[10px] text-muted">
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
      className="rounded-2xl bg-surface border border-border mb-3 overflow-hidden"
    >
      <button
        className="w-full flex items-center gap-2 px-3 pt-2.5 pb-2 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted">
          ATHENA Briefing
        </span>
        <span className="text-[9px] text-muted ml-1">{relativeTime(briefing.ts)}</span>
        {briefing.key && (
          <span className="num text-[9px] rounded bg-white/5 px-1.5 py-[1px] text-tertiary ml-1 truncate max-w-[120px]">
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
            <div className="px-3 pb-3 text-[11px] text-secondary leading-relaxed whitespace-pre-wrap">
              {displayText}
              {!expanded && isLong && (
                <button
                  className="block mt-1 text-tone-info hover:opacity-80 text-[10px]"
                  onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                >
                  Read more
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="preview" className="px-3 pb-3 text-[11px] text-secondary leading-relaxed">
            {displayText}
            <button
              className="block mt-1 text-tone-info hover:opacity-80 text-[10px]"
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
