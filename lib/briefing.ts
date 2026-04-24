import type { BriefingCache } from "./advisory-types";

export type BriefingTone = "success" | "warn" | "info" | "muted";

export interface BriefingCardData {
  cache_id: string;
  title: string;
  lede: string;
  tags: string[];
  tone: BriefingTone;
  ts: string;
  key: string;
  fullText: string;
}

export function extractText(payload: Record<string, unknown>): string {
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

export function relativeTime(ts: string): string {
  const now = Date.now();
  const then = new Date(ts).getTime();
  if (!Number.isFinite(then)) return "—";
  const diffMs = now - then;
  const diffMin = diffMs / 60_000;
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${Math.round(diffMin)}m ago`;
  const diffHr = diffMin / 60;
  if (diffHr < 24) return `${Math.round(diffHr)}h ago`;
  if (diffHr < 48) return "yesterday";
  const d = new Date(then);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function humanizeKey(key: string): string {
  const slug = key.split(/[-_.:/]/).pop() ?? key;
  return slug.toUpperCase().slice(0, 12);
}

function deriveTone(key: string): BriefingTone {
  const lc = key.toLowerCase();
  if (lc.includes("session-close") || lc.includes("close")) return "success";
  if (lc.includes("advisory") || lc.includes("alert")) return "warn";
  if (lc.startsWith("amd") || lc.includes("regime")) return "info";
  return "muted";
}

function splitTitleAndLede(text: string): { title: string; lede: string } {
  const cleaned = text.replace(/^\*+|\*+$/g, "").trim();
  const firstBreak = cleaned.search(/\n|\.\s|\!\s|\?\s/);
  let rawTitle = firstBreak > 0 ? cleaned.slice(0, firstBreak) : cleaned.slice(0, 80);
  let rest = firstBreak > 0 ? cleaned.slice(firstBreak).replace(/^[\s\.\!\?]+/, "") : "";

  rawTitle = rawTitle.replace(/^[\s\*#>\-]+/, "").replace(/[\s\.\!\?\:,;]+$/, "");
  if (rawTitle.length > 80) {
    const cut = rawTitle.slice(0, 80);
    const lastSpace = cut.lastIndexOf(" ");
    rawTitle = (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim();
  }

  let lede = rest.slice(0, 260);
  if (lede.length === 260) {
    const lastStop = Math.max(lede.lastIndexOf(". "), lede.lastIndexOf("! "), lede.lastIndexOf("? "));
    if (lastStop > 120) lede = lede.slice(0, lastStop + 1);
  }
  lede = lede.trim();

  return { title: rawTitle || "Briefing", lede };
}

function deriveTags(text: string, key: string): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();

  const push = (t: string) => {
    const token = t.trim();
    if (!token || token.length > 10) return;
    const norm = token.toUpperCase();
    if (seen.has(norm)) return;
    seen.add(norm);
    tags.push(token);
  };

  const allcapsRe = /\b[A-Z][A-Z0-9_]{2,9}\b/g;
  const matches = text.match(allcapsRe);
  if (matches) {
    for (const m of matches) {
      if (tags.length >= 3) break;
      push(m);
    }
  }

  if (tags.length < 3) {
    const kh = humanizeKey(key);
    if (kh) push(kh);
  }

  if (tags.length < 3) {
    const numRe = /(?:[+\-−]?\$\d+(?:\.\d+)?[kKmM]?|VRP\s*[+\-−]?\d+(?:\.\d+)?σ?|\d+(?:\.\d+)?σ)/g;
    const nm = text.match(numRe);
    if (nm) {
      for (const m of nm) {
        if (tags.length >= 3) break;
        push(m.replace(/\s+/g, ""));
      }
    }
  }

  return tags.slice(0, 3);
}

export function buildBriefingCard(briefing: BriefingCache): BriefingCardData {
  const fullText = extractText(briefing.payload);
  const { title, lede } = splitTitleAndLede(fullText);
  const tags = deriveTags(fullText, briefing.key);
  const tone = deriveTone(briefing.key);
  return {
    cache_id: briefing.cache_id,
    title,
    lede,
    tags,
    tone,
    ts: briefing.ts,
    key: humanizeKey(briefing.key),
    fullText,
  };
}
