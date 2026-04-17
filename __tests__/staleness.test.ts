import { describe, expect, it } from "vitest";
import { computeStaleness } from "@/lib/staleness";

describe("computeStaleness", () => {
  const now = new Date("2026-04-17T14:16:00.000Z");
  const warnSeconds = 60;
  const staleSeconds = 120;

  it("returns fresh when age is under warn threshold", () => {
    const generated = new Date("2026-04-17T14:15:30.000Z").toISOString(); // 30s ago
    const result = computeStaleness({ generated_at: generated, now, warnSeconds, staleSeconds });
    expect(result.level).toBe("fresh");
    expect(result.age_seconds).toBe(30);
  });

  it("returns warn when age is between warn and stale", () => {
    const generated = new Date("2026-04-17T14:14:30.000Z").toISOString(); // 90s ago
    const result = computeStaleness({ generated_at: generated, now, warnSeconds, staleSeconds });
    expect(result.level).toBe("warn");
    expect(result.age_seconds).toBe(90);
  });

  it("returns stale when age exceeds stale threshold", () => {
    const generated = new Date("2026-04-17T14:13:00.000Z").toISOString(); // 180s ago
    const result = computeStaleness({ generated_at: generated, now, warnSeconds, staleSeconds });
    expect(result.level).toBe("stale");
    expect(result.age_seconds).toBe(180);
  });

  it("clamps future timestamps to age 0 and returns fresh", () => {
    const generated = new Date("2026-04-17T14:17:00.000Z").toISOString(); // 60s in the future
    const result = computeStaleness({ generated_at: generated, now, warnSeconds, staleSeconds });
    expect(result.level).toBe("fresh");
    expect(result.age_seconds).toBe(0);
  });

  it("returns unknown when generated_at is null", () => {
    const result = computeStaleness({ generated_at: null, now, warnSeconds, staleSeconds });
    expect(result.level).toBe("unknown");
    expect(result.age_seconds).toBeNull();
  });
});
