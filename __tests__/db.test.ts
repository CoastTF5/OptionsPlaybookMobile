import { afterEach, describe, expect, it, vi } from "vitest";

// Set DATABASE_URL before importing db so getPool() doesn't throw.
// The actual pg.Pool constructor is mocked, so no real connection is made.
process.env.DATABASE_URL = "postgres://mock:mock@localhost:5432/mock";

const mockQuery = vi.fn();

vi.mock("pg", () => {
  // Pool must be a real constructor function (not an arrow function) so `new Pool()` works.
  function MockPool() {
    return { query: mockQuery };
  }
  return { default: { Pool: MockPool } };
});

import { upsertSnapshot, getLatestSnapshot } from "@/lib/db";
import { validSnapshot } from "./fixtures/snapshot";

afterEach(() => mockQuery.mockReset());

describe("upsertSnapshot", () => {
  it("runs an INSERT ... ON CONFLICT with id='latest' and passes payload", async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });
    await upsertSnapshot(validSnapshot);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain("INSERT INTO mirror_snapshots");
    expect(sql).toContain("ON CONFLICT (id) DO UPDATE");
    expect(params?.[0]).toBe(JSON.stringify(validSnapshot));
    expect(params?.[1]).toBe(validSnapshot.generated_at);
  });
});

describe("getLatestSnapshot", () => {
  it("returns null when no row exists", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const result = await getLatestSnapshot();
    expect(result).toBeNull();
  });

  it("returns parsed payload and ingested_at when row exists", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ payload: validSnapshot, ingested_at: new Date("2026-04-17T14:16:00.000Z") }],
    });
    const result = await getLatestSnapshot();
    expect(result?.payload.ops.status).toBe("READY");
    expect(result?.ingested_at.toISOString()).toBe("2026-04-17T14:16:00.000Z");
  });
});
