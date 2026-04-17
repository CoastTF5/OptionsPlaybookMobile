import { cn } from "@/lib/cn";
import type { StalenessLevel } from "@/lib/staleness";

export function StaleBanner({
  level,
  age_seconds,
}: {
  level: StalenessLevel;
  age_seconds: number | null;
}) {
  if (level === "fresh") return null;

  if (level === "unknown") {
    return (
      <div className="mb-3 rounded-md bg-amber-500/15 px-3 py-2 text-[11px] text-amber-300">
        No snapshot yet — waiting for the first push from the local daemon.
      </div>
    );
  }

  const isStale = level === "stale";
  return (
    <div
      className={cn(
        "mb-3 rounded-md px-3 py-2 text-[11px]",
        isStale ? "bg-red-500/15 text-red-400" : "bg-yellow-500/15 text-yellow-300",
      )}
    >
      {isStale ? "No updates" : "Last update"} {age_seconds}s ago
      {isStale ? " — check the local pusher daemon" : ""}
    </div>
  );
}
