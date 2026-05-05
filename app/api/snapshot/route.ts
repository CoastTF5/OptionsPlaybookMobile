export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getLatestSnapshot } from "@/lib/db";
import { SnapshotSchema } from "@/lib/schema";

type SnapshotRoutePayload = {
  payload: unknown;
  ingested_at: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function isIsoLike(value: string | null): value is string {
  if (!value) return false;
  return Number.isFinite(Date.parse(value));
}

function extractSnapshotRoutePayload(body: unknown): SnapshotRoutePayload | null {
  const root = asRecord(body);
  if (!root) return null;

  const directPayload = root.payload;
  if (directPayload != null) {
    return {
      payload: directPayload,
      ingested_at:
        asString(root.ingested_at) ??
        asString(root.generated_at) ??
        new Date().toISOString(),
    };
  }

  const data = asRecord(root.data);
  if (data?.payload != null) {
    return {
      payload: data.payload,
      ingested_at:
        asString(data.ingested_at) ??
        asString(data.generated_at) ??
        asString(root.ingested_at) ??
        asString(root.generated_at) ??
        new Date().toISOString(),
    };
  }

  const snapshot = root.snapshot;
  if (snapshot != null) {
    return {
      payload: snapshot,
      ingested_at:
        asString(root.ingested_at) ??
        asString(root.as_of) ??
        asString(root.generated_at) ??
        new Date().toISOString(),
    };
  }

  if (data?.snapshot != null) {
    return {
      payload: data.snapshot,
      ingested_at:
        asString(data.ingested_at) ??
        asString(data.as_of) ??
        asString(root.ingested_at) ??
        asString(root.as_of) ??
        new Date().toISOString(),
    };
  }

  return null;
}

async function fetchSnapshotFromUpstream(
  url: string,
  bearerToken: string | null,
  timeoutMs: number,
): Promise<SnapshotRoutePayload | null> {
  const headers: HeadersInit = { Accept: "application/json" };
  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  const upstream = await fetch(url, {
    cache: "no-store",
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (upstream.status === 404) {
    return null;
  }
  if (!upstream.ok) {
    throw new Error(`upstream status ${upstream.status}`);
  }

  const raw = (await upstream.json()) as unknown;
  const extracted = extractSnapshotRoutePayload(raw);
  if (!extracted) {
    throw new Error("upstream payload shape unsupported");
  }

  const parsed = SnapshotSchema.safeParse(extracted.payload);
  if (!parsed.success) {
    throw new Error("upstream payload failed SnapshotSchema validation");
  }

  const ingestedAt = isIsoLike(extracted.ingested_at)
    ? extracted.ingested_at
    : new Date().toISOString();

  return {
    payload: parsed.data,
    ingested_at: ingestedAt,
  };
}

export async function GET(): Promise<NextResponse> {
  const upstreamUrl = asString(process.env.MOBILE_SNAPSHOT_UPSTREAM_URL);
  const upstreamBearerToken = asString(process.env.MOBILE_SNAPSHOT_UPSTREAM_BEARER_TOKEN);
  const upstreamTimeoutMs = parsePositiveInt(
    process.env.MOBILE_SNAPSHOT_UPSTREAM_TIMEOUT_MS,
    4000,
  );
  const upstreamRequired = process.env.MOBILE_SNAPSHOT_UPSTREAM_REQUIRED === "true";

  if (upstreamUrl) {
    try {
      const upstreamSnapshot = await fetchSnapshotFromUpstream(
        upstreamUrl,
        upstreamBearerToken,
        upstreamTimeoutMs,
      );

      if (!upstreamSnapshot) {
        if (upstreamRequired) {
          return NextResponse.json({ error: "No upstream snapshot available" }, { status: 404 });
        }
      } else {
        return NextResponse.json(upstreamSnapshot, {
          status: 200,
          headers: { "cache-control": "no-store" },
        });
      }
    } catch (err) {
      console.error("[snapshot] upstream error:", err);
      if (upstreamRequired) {
        return NextResponse.json({ error: "Upstream snapshot unavailable" }, { status: 503 });
      }
    }
  }

  let row: Awaited<ReturnType<typeof getLatestSnapshot>>;

  try {
    row = await getLatestSnapshot();
  } catch (err) {
    console.error("[snapshot] DB error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }

  if (!row) {
    return NextResponse.json({ error: "No snapshot available" }, { status: 404 });
  }

  return NextResponse.json(
    { payload: row.payload, ingested_at: row.ingested_at },
    {
      status: 200,
      headers: { "cache-control": "no-store" },
    },
  );
}
