import { beforeEach, describe, expect, it, vi } from "vitest";
import { validSnapshot } from "./fixtures/snapshot";

vi.mock("@/lib/db", () => ({
  getLatestSnapshot: vi.fn(),
}));

import { getLatestSnapshot } from "@/lib/db";
import { GET } from "@/app/api/snapshot/route";

beforeEach(() => {
  vi.mocked(getLatestSnapshot).mockReset();
});

describe("GET /api/snapshot", () => {
  it("returns 200 with payload and ingested_at when a row exists", async () => {
    const ingestedAt = new Date("2026-04-17T14:16:00.000Z");
    vi.mocked(getLatestSnapshot).mockResolvedValue({
      payload: validSnapshot,
      ingested_at: ingestedAt,
    });

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");

    const body = await res.json();
    expect(body.payload.ops.status).toBe("READY");
    expect(body.ingested_at).toBe(ingestedAt.toISOString());
  });

  it("returns 404 when no row exists", async () => {
    vi.mocked(getLatestSnapshot).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns 503 when the DB throws", async () => {
    vi.mocked(getLatestSnapshot).mockRejectedValue(new Error("connection refused"));

    const res = await GET();
    expect(res.status).toBe(503);
  });
});
