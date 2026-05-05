import { beforeEach, describe, expect, it, vi } from "vitest";
import { validSnapshot } from "./fixtures/snapshot";

vi.mock("@/lib/db", () => ({
  getLatestSnapshot: vi.fn(),
}));

import { getLatestSnapshot } from "@/lib/db";
import { GET } from "@/app/api/snapshot/route";

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.mocked(getLatestSnapshot).mockReset();
  vi.restoreAllMocks();
  process.env = { ...originalEnv };
});

describe("GET /api/snapshot", () => {
  it("uses upstream feed when MOBILE_SNAPSHOT_UPSTREAM_URL is set", async () => {
    process.env.MOBILE_SNAPSHOT_UPSTREAM_URL = "https://mobile-shaper.example/v1/snapshot";
    process.env.MOBILE_SNAPSHOT_UPSTREAM_BEARER_TOKEN = "token-123";

    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        payload: validSnapshot,
        ingested_at: "2026-05-05T13:30:00.000Z",
      }),
    } as Response);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://mobile-shaper.example/v1/snapshot",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({
          Accept: "application/json",
          Authorization: "Bearer token-123",
        }),
      }),
    );

    const body = await res.json();
    expect(body.payload.ops.status).toBe("READY");
    expect(body.ingested_at).toBe("2026-05-05T13:30:00.000Z");
    expect(getLatestSnapshot).not.toHaveBeenCalled();
  });

  it("falls back to DB when upstream is set but unavailable", async () => {
    process.env.MOBILE_SNAPSHOT_UPSTREAM_URL = "https://mobile-shaper.example/v1/snapshot";

    vi.spyOn(global, "fetch").mockRejectedValue(new Error("connect ECONNREFUSED"));
    const ingestedAt = new Date("2026-04-17T14:16:00.000Z");
    vi.mocked(getLatestSnapshot).mockResolvedValue({
      payload: validSnapshot,
      ingested_at: ingestedAt,
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.payload.ops.status).toBe("READY");
    expect(body.ingested_at).toBe(ingestedAt.toISOString());
    expect(getLatestSnapshot).toHaveBeenCalledTimes(1);
  });

  it("returns 503 when upstream is required and unavailable", async () => {
    process.env.MOBILE_SNAPSHOT_UPSTREAM_URL = "https://mobile-shaper.example/v1/snapshot";
    process.env.MOBILE_SNAPSHOT_UPSTREAM_REQUIRED = "true";

    vi.spyOn(global, "fetch").mockRejectedValue(new Error("timeout"));

    const res = await GET();
    expect(res.status).toBe(503);
    expect(getLatestSnapshot).not.toHaveBeenCalled();
  });

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
