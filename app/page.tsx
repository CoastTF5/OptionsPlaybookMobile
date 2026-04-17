import { MirrorStrip } from "@/components/MirrorStrip";
import { MirrorTradeCard } from "@/components/MirrorTradeCard";
import { StaleBanner } from "@/components/StaleBanner";
import { getFixtureSnapshot } from "@/lib/fixture";
import { computeStaleness } from "@/lib/staleness";

export const dynamic = "force-dynamic";

export default function Page() {
  const payload = getFixtureSnapshot();
  const staleness = computeStaleness({
    generated_at: payload.generated_at,
    warnSeconds: 60,
    staleSeconds: 120,
  });

  return (
    <main className="mx-auto max-w-[720px] p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h1 className="text-[11px] uppercase tracking-[0.18em] text-tertiary">
          Options Playbook · Mirror
        </h1>
        <span className="text-[9px] text-muted">preview · fixture data</span>
      </div>
      <StaleBanner level={staleness.level} age_seconds={staleness.age_seconds} />
      <MirrorStrip ops={payload.ops} regime={payload.regime} />
      {payload.queue.length === 0 ? (
        <div className="rounded-lg bg-surface p-6 text-center text-[11px] text-tertiary shadow-glass-inset">
          Queue empty — no considered trades right now.
        </div>
      ) : (
        payload.queue.map((item) => <MirrorTradeCard key={item.candidate_id} item={item} />)
      )}
    </main>
  );
}
