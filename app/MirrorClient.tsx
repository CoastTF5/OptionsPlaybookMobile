"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { MirrorStrip } from "@/components/MirrorStrip";
import { MirrorTradeCard } from "@/components/MirrorTradeCard";
import { TickerRow } from "@/components/TickerRow";
import { StaleBanner } from "@/components/StaleBanner";
import { AmdRegimePanel } from "@/components/AmdRegimePanel";
import { MarketBriefingPanel } from "@/components/MarketBriefingPanel";
import { AdvisoryCard } from "@/components/AdvisoryCard";
import { ChatPanel } from "@/components/ChatPanel";
import { computeStaleness } from "@/lib/staleness";
import type { Snapshot } from "@/lib/schema";
import type { AmdResponse, BriefingResponse, AdvisoriesResponse } from "@/lib/advisory-types";

// ─── Snapshot polling ─────────────────────────────────────────────────────────

type SnapshotResponse = { payload: Snapshot; ingested_at: string };
type FetchState<T> =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "ok"; data: T }
  | { kind: "error"; message: string };

async function fetchSnapshot(): Promise<FetchState<SnapshotResponse>> {
  try {
    const res = await fetch("/api/snapshot", { cache: "no-store" });
    if (res.status === 404) return { kind: "empty" };
    if (res.status === 503) return { kind: "error", message: "Backend unavailable" };
    if (!res.ok) return { kind: "error", message: `HTTP ${res.status}` };
    return { kind: "ok", data: await res.json() as SnapshotResponse };
  } catch (err) {
    return { kind: "error", message: err instanceof Error ? err.message : "network error" };
  }
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

// ─── Tab definition ───────────────────────────────────────────────────────────

type Tab = "signals" | "intel" | "chat";

const TABS: { id: Tab; label: string }[] = [
  { id: "signals", label: "Signals" },
  { id: "intel",   label: "Intel" },
  { id: "chat",    label: "Chat" },
];

// ─── Main client component ────────────────────────────────────────────────────

export function MirrorClient({
  pollIntervalMs,
  warnSeconds,
  staleSeconds,
}: {
  pollIntervalMs: number;
  warnSeconds: number;
  staleSeconds: number;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("signals");
  const [snapshot, setSnapshot] = useState<FetchState<SnapshotResponse>>({ kind: "loading" });
  const [amd, setAmd] = useState<AmdResponse | null>(null);
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [advisories, setAdvisories] = useState<AdvisoriesResponse | null>(null);

  const tickSnapshot = useCallback(async () => {
    const next = await fetchSnapshot();
    setSnapshot(next);
  }, []);

  const tickSupabase = useCallback(async () => {
    const [a, b, adv] = await Promise.all([
      fetchJson<AmdResponse>("/api/amd"),
      fetchJson<BriefingResponse>("/api/briefing"),
      fetchJson<AdvisoriesResponse>("/api/advisories"),
    ]);
    if (a) setAmd(a);
    if (b) setBriefing(b);
    if (adv) setAdvisories(adv);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const runAll = async () => {
      await Promise.all([tickSnapshot(), tickSupabase()]);
    };

    void runAll();
    const id = setInterval(() => { if (!cancelled) void runAll(); }, pollIntervalMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [pollIntervalMs, tickSnapshot, tickSupabase]);

  // Derive staleness from snapshot
  const staleness =
    snapshot.kind === "ok"
      ? computeStaleness({ generated_at: snapshot.data.payload.generated_at, warnSeconds, staleSeconds })
      : null;

  const payload = snapshot.kind === "ok" ? snapshot.data.payload : null;
  const advisoryCount = advisories?.advisories.length ?? 0;
  const queueCount = payload?.queue.length ?? 0;

  const counts: Record<Tab, number | null> = {
    signals: payload ? queueCount : null,
    intel: advisories ? advisoryCount : null,
    chat: null,
  };

  const headerKicker = TABS.find((t) => t.id === activeTab)?.label ?? "Signals";
  const headerTitle =
    activeTab === "signals"
      ? (payload ? `${queueCount} ready` : "Loading…")
      : activeTab === "intel"
        ? (advisories ? `${advisoryCount} advisor${advisoryCount === 1 ? "y" : "ies"}` : "Loading…")
        : "Ask anything";

  return (
    <div className="flex flex-col gap-0">
      {/* Page header */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted font-bold">
            {headerKicker}
          </div>
          <h1 className="mt-0.5 text-[22px] font-bold tracking-[-0.02em] text-primary">
            {headerTitle}
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-tone-success animate-pulse" />
          <span className="text-[10px] text-muted font-semibold">LIVE</span>
        </div>
      </div>

      {/* Staleness banner */}
      {snapshot.kind === "loading" && (
        <div className="text-tertiary text-sm">Loading…</div>
      )}
      {snapshot.kind === "error" && (
        <div className="text-sm text-tone-danger mb-2">{snapshot.message}</div>
      )}
      {snapshot.kind === "empty" && (
        <StaleBanner level="unknown" age_seconds={null} />
      )}
      {staleness && (
        <StaleBanner level={staleness.level} age_seconds={staleness.age_seconds} />
      )}

      {/* Ops + market strip (always visible if we have data) */}
      {payload && (
        <>
          <MirrorStrip ops={payload.ops} regime={payload.regime} />
          <TickerRow tickers={payload.regime.tickers} />
        </>
      )}

      {/* Tab bar */}
      <div className="flex gap-5 px-1 mb-3 border-b border-border">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const count = counts[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-[12px] font-semibold pb-2 transition-colors",
                active
                  ? "text-primary border-b-2 border-tone-info -mb-px"
                  : "text-muted hover:text-secondary",
              )}
            >
              {tab.label}
              {count != null && (
                <span className="num text-muted ml-1.5 font-normal">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── SIGNALS TAB ── */}
      {activeTab === "signals" && (
        <motion.div key="signals" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {!payload ? (
            <div className="rounded-2xl bg-surface border border-border p-6 text-center text-[11px] text-tertiary">
              Waiting for trade data…
            </div>
          ) : payload.queue.length === 0 ? (
            <div className="rounded-2xl bg-surface border border-border p-6 text-center text-[11px] text-tertiary">
              No trade suggestions right now.
            </div>
          ) : (
            payload.queue.map((item) => (
              <MirrorTradeCard key={item.candidate_id} item={item} />
            ))
          )}
        </motion.div>
      )}

      {/* ── INTEL TAB ── */}
      {activeTab === "intel" && (
        <motion.div key="intel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AmdRegimePanel
            status={amd?.status ?? null}
            phase={amd?.phase ?? null}
          />
          <MarketBriefingPanel briefing={briefing?.briefing ?? null} />

          {/* Position advisories */}
          <div className="mb-2 mt-1 text-[9px] font-bold uppercase tracking-widest text-muted px-1">
            Position Advisories
          </div>
          {!advisories ? (
            <div className="rounded-2xl bg-surface border border-border px-3 py-2.5 text-[10px] text-muted mb-2">
              Loading advisories…
            </div>
          ) : advisories.advisories.length === 0 ? (
            <div className="rounded-2xl bg-surface border border-border px-3 py-2.5 text-[10px] text-muted mb-2">
              No open position advisories.
            </div>
          ) : (
            advisories.advisories.map((adv) => (
              <AdvisoryCard key={adv.advisory_id} advisory={adv} />
            ))
          )}
        </motion.div>
      )}

      {/* ── CHAT TAB ── */}
      {activeTab === "chat" && (
        <motion.div
          key="chat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col"
          style={{ minHeight: "60vh" }}
        >
          <ChatPanel />
        </motion.div>
      )}
    </div>
  );
}
