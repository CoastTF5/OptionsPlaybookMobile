import { cn } from "@/lib/cn";
import type { Snapshot } from "@/lib/schema";

type Ticker = Snapshot["regime"]["tickers"][number];

function formatChange(pct: number): string {
  const abs = Math.abs(pct);
  return `${abs.toFixed(pct.toString().includes(".") ? 2 : 1)}%`;
}

export function TickerRow({ tickers }: { tickers: Ticker[] }) {
  if (!tickers || tickers.length === 0) return null;

  return (
    <div className="mb-3 flex gap-2">
      {tickers.map((t) => {
        const change = t.change_pct ?? null;
        const isUp = change != null && change >= 0;
        const glyph = change == null ? "·" : isUp ? "▲" : "▼";
        const toneCls =
          change == null
            ? "text-muted"
            : isUp
              ? "text-tone-success"
              : "text-tone-danger";

        return (
          <div
            key={t.symbol}
            className="flex-1 min-w-0 bg-surface border border-border rounded-xl p-2"
          >
            <div className="text-[10px] font-bold text-tertiary tracking-wider">
              {t.symbol}
            </div>
            <div className="num text-[12px] font-bold text-primary mt-0.5">
              {t.price != null ? t.price.toLocaleString() : "—"}
            </div>
            <div className={cn("num text-[9px] mt-0.5", toneCls)}>
              {glyph} {change != null ? formatChange(change) : "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
