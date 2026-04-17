import { beforeEach, describe, expect, it, vi } from "vitest";
import { validSnapshot } from "./fixtures/snapshot";

// Mock auth and db before importing the route
vi.mock("@/lib/auth", () => ({
  verifyIngestAuth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  upsertSnapshot: vi.fn(),
}));

import { verifyIngestAuth } from "@/lib/auth";
import { upsertSnapshot } from "@/lib/db";
import { POST } from "@/app/api/ingest/route";

// Minimal NextRequest stand-in that the route handler uses
function makeRequest(options: {
  authorized?: boolean;
  body?: string | null;
  badJson?: boolean;
}): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (options.authorized) headers.set("authorization", "Bearer secret");

  let bodyInit: string | undefined;
  if (options.badJson) {
    bodyInit = "not-json{{{";
  } else if (options.body !== undefined && options.body !== null) {
    bodyInit = options.body;
  } else if (options.body === null) {
    bodyInit = undefined;
  }

  return new Request("http://localhost/api/ingest", {
    method: "POST",
    headers,
    body: bodyInit,
  });
}

beforeEach(() => {
  vi.mocked(verifyIngestAuth).mockReturnValue(false);
  vi.mocked(upsertSnapshot).mockResolvedValue(undefined);
});

describe("POST /api/ingest", () => {
  it("returns 401 when no Authorization header", async () => {
    vi.mocked(verifyIngestAuth).mockReturnValue(false);
    const req = makeRequest({ authorized: false, body: JSON.stringify(validSnapshot) });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("returns 401 when wrong token", async () => {
    vi.mocked(verifyIngestAuth).mockReturnValue(false);
    const req = makeRequest({ authorized: true, body: JSON.stringify(validSnapshot) });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("returns 400 when payload is malformed JSON", async () => {
    vi.mocked(verifyIngestAuth).mockReturnValue(true);
    const req = makeRequest({ authorized: true, badJson: true });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("returns 204 on valid payload", async () => {
    vi.mocked(verifyIngestAuth).mockReturnValue(true);
    vi.mocked(upsertSnapshot).mockResolvedValue(undefined);
    const req = makeRequest({ authorized: true, body: JSON.stringify(validSnapshot) });
    const res = await POST(req as any);
    expect(res.status).toBe(204);
    expect(upsertSnapshot).toHaveBeenCalledWith(validSnapshot);
  });
});
