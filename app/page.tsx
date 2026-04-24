import { MirrorClient } from "./MirrorClient";
import { MirrorStrip } from "@/components/MirrorStrip";
import { MirrorTradeCard } from "@/components/MirrorTradeCard";
import { TickerRow } from "@/components/TickerRow";
import { StaleBanner } from "@/components/StaleBanner";
import { getFixtureSnapshot } from "@/lib/fixture";
import { computeStaleness } from "@/lib/staleness";

export const dynamic = "force-dynamic";

function FixtureView() {
  const payload = getFixtureSnapshot();
  const staleness = computeStaleness({
    generated_at: payload.generated_at,
    warnSeconds: 60,
    staleSeconds: 120,
  });
  return (
    <>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted font-bold">
            Signals
          </div>
          <h1 className="mt-0.5 text-[22px] font-bold tracking-[-0.02em] text-primary">
            {payload.queue.length} ready
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-tone-success animate-pulse" />
          <span className="text-[10px] text-muted font-semibold">DEMO</span>
        </div>
      </div>
      <StaleBanner level={staleness.level} age_seconds={staleness.age_seconds} />
      <MirrorStrip ops={payload.ops} regime={payload.regime} />
      <TickerRow tickers={payload.regime.tickers} />
      {payload.queue.map((item) => (
        <MirrorTradeCard key={item.candidate_id} item={item} />
      ))}
    </>
  );
}

export default function Page() {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_FIXTURE === "true";
  const warnSeconds = Number(process.env.STALENESS_WARN_SECONDS ?? 60);
  const staleSeconds = Number(process.env.STALENESS_STALE_SECONDS ?? 120);

  return (
    <main className="mx-auto max-w-[720px] p-4">
      {demoMode ? (
        <FixtureView />
      ) : (
        <MirrorClient
          pollIntervalMs={20_000}
          warnSeconds={warnSeconds}
          staleSeconds={staleSeconds}
        />
      )}
    </main>
  );
}
