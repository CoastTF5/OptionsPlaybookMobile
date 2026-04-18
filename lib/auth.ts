import { timingSafeEqual } from "node:crypto";

/**
 * Verifies that the incoming request carries a valid Bearer token matching
 * the MIRROR_INGEST_SECRET environment variable.
 *
 * Fail-closed: returns false if MIRROR_INGEST_SECRET is not set.
 */
export function verifyIngestAuth(headers: Headers): boolean {
  const secret = process.env.MIRROR_INGEST_SECRET;
  if (!secret) return false;

  const authorization = headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return false;

  const token = authorization.slice("Bearer ".length);

  // Use timingSafeEqual to prevent timing-based token enumeration.
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(secret);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
