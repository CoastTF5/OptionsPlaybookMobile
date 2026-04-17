import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifyIngestAuth } from "@/lib/auth";

function makeHeaders(authorization?: string): Headers {
  const h = new Headers();
  if (authorization !== undefined) h.set("authorization", authorization);
  return h;
}

describe("verifyIngestAuth", () => {
  beforeEach(() => {
    process.env.INGEST_SECRET = "test-secret-value";
  });

  afterEach(() => {
    delete process.env.INGEST_SECRET;
  });

  it("returns true when Bearer token matches INGEST_SECRET", () => {
    expect(verifyIngestAuth(makeHeaders("Bearer test-secret-value"))).toBe(true);
  });

  it("returns false when Authorization header is missing", () => {
    expect(verifyIngestAuth(makeHeaders())).toBe(false);
  });

  it("returns false when token is wrong", () => {
    expect(verifyIngestAuth(makeHeaders("Bearer wrong-token"))).toBe(false);
  });

  it("returns false when INGEST_SECRET is not set", () => {
    delete process.env.INGEST_SECRET;
    expect(verifyIngestAuth(makeHeaders("Bearer test-secret-value"))).toBe(false);
  });
});
