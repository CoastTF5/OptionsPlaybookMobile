"use client";

import { useEffect, useState } from "react";
import { MirrorStrip } from "@/components/MirrorStrip";
import { MirrorTradeCard } from "@/components/MirrorTradeCard";
import { StaleBanner } from "@/components/StaleBanner";
import { computeStaleness } from "@/lib/staleness";
import type { Snapshot } from "@/lib/schema";

type SnapshotResponse = { payload: Snapshot; ingested_at: string };
type FetchState =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "ok"; data: SnapshotResponse }
  | { kind: "error"; message: string };

async function fetchSnapshot(): Promise<FetchState> {
  try {
    const res = await fetch("/api/snapshot", { cache: "no-store" });
    if (res.status === 404) return { kind: "empty" };
    if (res.status === 503) return { kind: "error", message: "Backend unavailable" };
    if (!res.ok) return { kind: "error", message: `HTTP ${res.status}` };
    const body = (await res.json()) as SnapshotResponse;
    return { kind: "ok", data: body };
  } catch (err) {
    return { kind: "error", message: err instanceof Error ? err.message : "network error" };
  }
}

export function MirrorClient({
  pollIntervalMs,
  warnSeconds,
  staleSeconds,
}: {
  pollIntervalMs: number;
  warnSeconds: number;
  staleSeconds: number;
}) {
  const [state, setState] = useState<FetchState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const next = await fetchSnapshot();
      if (!cancelled) setState(next);
    };
    void tick();
    const id = setInterval(tick, pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollIntervalMs]);

  if (state.kind === "loading") {
    return <div className="text-tertiary text-sm">Loading…</div>;
  }

  if (state.kind === "error") {
    return <div className="text-sm text-red-400">{state.message}</div>;
  }

  if (state.kind === "empty") {
    return <StaleBanner level="unknown" age_seconds={null} />;
  }

  const { payload } = state.data;
  const staleness = computeStaleness({
    generated_at: payload.generated_at,
    warnSeconds,
    staleSeconds,
  });

  return (
    <>
      <StaleBanner level={staleness.level} age_seconds={staleness.age_seconds} />
      <MirrorStrip ops={payload.ops} regime={payload.regime} />
      {payload.queue.length === 0 ? (
        <div className="rounded-lg bg-surface p-6 text-center text-[11px] text-tertiary shadow-glass-inset">
          Queue empty — no considered trades right now.
        </div>
      ) : (
        payload.queue.map((item) => <MirrorTradeCard key={item.candidate_id} item={item} />)
      )}
    </>
  );
}
