import { Chip } from "@/components/ui/Chip";
import type { Snapshot } from "@/lib/schema";

function opsTone(status: Snapshot["ops"]["status"]): "success" | "warn" | "danger" | "muted" {
  if (status === "READY") return "success";
  if (status === "DEGRADED") return "warn";
  if (status === "BLOCKED") return "danger";
  return "muted";
}

export function MirrorStrip({
  ops,
  regime,
}: {
  ops: Snapshot["ops"];
  regime: Snapshot["regime"];
}) {
  const regimeConf =
    regime.regime_confidence != null ? Math.round(regime.regime_confidence * 100) : null;
  const archConf =
    regime.archetype_confidence != null ? Math.round(regime.archetype_confidence * 100) : null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-lg bg-surface px-3 py-2 shadow-glass-inset">
      <Chip tone={opsTone(ops.status)}>● {ops.status}</Chip>
      {ops.chips.map((chip, i) => (
        <Chip key={`ops-${i}`} tone={chip.tone} title={chip.hint}>
          {chip.label}
        </Chip>
      ))}
      {regime.regime_key && (
        <Chip tone="warn">
          {regime.regime_key}
          {regimeConf != null ? ` ${regimeConf}%` : ""}
        </Chip>
      )}
      {regime.archetype_key && (
        <Chip tone="success">
          {regime.archetype_key}
          {archConf != null ? ` ${archConf}%` : ""}
        </Chip>
      )}
      {regime.signals.map((s, i) => (
        <Chip key={`sig-${i}`} tone={s.tone ?? "muted"}>
          {s.key} {s.value}
        </Chip>
      ))}
      {regime.tickers.map((t, i) => (
        <Chip key={`tk-${i}`} tone="muted">
          {t.symbol} {t.price != null ? t.price.toLocaleString() : "—"}
        </Chip>
      ))}
    </div>
  );
}
