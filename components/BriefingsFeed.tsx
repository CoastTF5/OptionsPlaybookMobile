"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/cn";
import type { BriefingCache } from "@/lib/advisory-types";
import { buildBriefingCard, relativeTime } from "@/lib/briefing";
import type { BriefingCardData, BriefingTone } from "@/lib/briefing";

const TONE_BORDER: Record<BriefingTone, string> = {
  success: "border-l-tone-success",
  warn:    "border-l-tone-warn",
  info:    "border-l-tone-info",
  muted:   "border-l-muted",
};

const TONE_TEXT: Record<BriefingTone, string> = {
  success: "text-tone-success",
  warn:    "text-tone-warn",
  info:    "text-tone-info",
  muted:   "text-muted",
};

const TONE_BG: Record<BriefingTone, string> = {
  success: "bg-tone-success-dim",
  warn:    "bg-tone-warn-dim",
  info:    "bg-tone-info-dim",
  muted:   "bg-white/[0.06]",
};

function BriefingCard({
  card,
  featured,
}: {
  card: BriefingCardData;
  featured: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={cn(
        "rounded-2xl bg-surface border border-border border-l-[3px] mb-2.5",
        TONE_BORDER[card.tone],
        featured ? "p-4" : "p-3.5",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-[9px] font-bold uppercase",
            TONE_TEXT[card.tone],
          )}
          style={{ letterSpacing: "0.14em" }}
        >
          {card.key}
        </span>
        <span className="text-[9px] text-muted">·</span>
        <span className="text-[9px] text-muted">{relativeTime(card.ts)}</span>
        {featured && (
          <span className="ml-auto rounded-full bg-tone-info-dim text-tone-info text-[9px] font-bold px-2 py-0.5 tracking-wider">
            LATEST
          </span>
        )}
      </div>

      <h3
        className={cn(
          "font-bold text-primary leading-snug mt-2",
          featured ? "text-[15px] tracking-tight" : "text-[13px]",
        )}
      >
        {card.title}
      </h3>

      {card.lede && (
        <p
          className="text-[11px] font-medium text-tertiary leading-relaxed mt-1"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {card.lede}
        </p>
      )}

      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "num rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide",
                TONE_BG[card.tone],
                TONE_TEXT[card.tone],
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {featured && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 text-[11px] font-semibold text-tone-info hover:opacity-80"
          >
            {expanded ? "Hide full brief ↑" : "Read full brief →"}
          </button>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="full"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 pt-3 border-t border-border text-[11px] text-secondary leading-relaxed whitespace-pre-wrap">
                  {card.fullText}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.article>
  );
}

export function BriefingsFeed({ briefings }: { briefings: BriefingCache[] }) {
  if (!briefings || briefings.length === 0) {
    return (
      <div className="rounded-2xl bg-surface border border-border p-6 text-center text-[11px] text-tertiary">
        No briefings yet.
      </div>
    );
  }

  const cards = briefings.map(buildBriefingCard);

  return (
    <div>
      {cards.map((card, idx) => (
        <BriefingCard key={card.cache_id} card={card} featured={idx === 0} />
      ))}
    </div>
  );
}
