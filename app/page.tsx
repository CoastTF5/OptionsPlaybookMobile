import { MirrorClient } from "./MirrorClient";
import { MirrorStrip } from "@/components/MirrorStrip";
import { MirrorTradeCard } from "@/components/MirrorTradeCard";
import { StaleBanner } from "@/components/StaleBanner";
import { AmdRegimePanel } from "@/components/AmdRegimePanel";
import { MarketBriefingPanel } from "@/components/MarketBriefingPanel";
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
      <StaleBanner level={staleness.level} age_seconds={staleness.age_seconds} />
      <MirrorStrip ops={payload.ops} regime={payload.regime} />
      <AmdRegimePanel status={null} phase={null} />
      <MarketBriefingPanel briefing={null} />
      <div className="mb-2 text-[9px] text-muted px-1">
        {payload.queue.length} suggestions (demo fixture)
      </div>
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
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h1 className="text-[11px] uppercase tracking-[0.18em] text-tertiary">
          Options Advisory
        </h1>
        <span className="text-[9px] text-muted">
          {demoMode ? "demo · fixture data" : "live · advisory only"}
        </span>
      </div>
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
