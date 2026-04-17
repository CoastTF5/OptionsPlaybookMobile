import { describe, expect, it } from "vitest";
import { SnapshotSchema } from "@/lib/schema";
import { validSnapshot } from "./fixtures/snapshot";

describe("SnapshotSchema", () => {
  it("accepts a valid payload and preserves fields via round-trip", () => {
    const parsed = SnapshotSchema.parse(validSnapshot);
    expect(parsed.ops.status).toBe("READY");
    expect(parsed.queue).toHaveLength(1);
    expect(parsed.queue[0].pipeline.engine_key).toBe("THETA");
    expect(parsed.regime.tickers.find((t) => t.symbol === "SPX")?.price).toBe(7041.28);
  });

  it("rejects a payload missing generated_at", () => {
    const bad = { ...validSnapshot, generated_at: undefined };
    expect(() => SnapshotSchema.parse(bad)).toThrow();
  });

  it("rejects confidence values outside [0, 1]", () => {
    const bad = {
      ...validSnapshot,
      queue: [{ ...validSnapshot.queue[0], confidence: 1.5 }],
    };
    expect(() => SnapshotSchema.parse(bad)).toThrow();
  });

  it("rejects environment values outside paper|live", () => {
    const bad = { ...validSnapshot, environment: "staging" };
    expect(() => SnapshotSchema.parse(bad)).toThrow();
  });
});
