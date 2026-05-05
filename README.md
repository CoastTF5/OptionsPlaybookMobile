# OptionsPlaybookMobile

A lightweight public read-only mobile view of the Options Playbook trading dashboard.
Receives snapshots from the private system via a secured ingest endpoint — no auth
required to read, bearer auth required to write.

## Stack

- **Next.js 14** (App Router, Node.js runtime)
- **PostgreSQL** via Railway Postgres plugin
- **Zod** for payload validation
- **Vitest** for unit tests

## Local development

```bash
npm install
npm run dev        # starts on :3001
```

By default the page polls `/api/snapshot`. To view the app with hard-coded
fixture data (useful when no DB / no pusher is available), set
`NEXT_PUBLIC_DEMO_FIXTURE=true` in `.env.local`.

For DB-dependent features set `DATABASE_URL` in `.env.local`.

To point the app at the new cloud/mobile shaper feed, set:

```bash
MOBILE_SNAPSHOT_UPSTREAM_URL=https://<new-feed-host>/v1/snapshot
MOBILE_SNAPSHOT_UPSTREAM_BEARER_TOKEN=<optional-bearer-token>
MOBILE_SNAPSHOT_UPSTREAM_TIMEOUT_MS=4000
MOBILE_SNAPSHOT_UPSTREAM_REQUIRED=false
```

Behavior:

- If `MOBILE_SNAPSHOT_UPSTREAM_URL` is set, `/api/snapshot` reads upstream first.
- If upstream fails and `MOBILE_SNAPSHOT_UPSTREAM_REQUIRED=false`, it falls back to local DB.
- If upstream fails and `MOBILE_SNAPSHOT_UPSTREAM_REQUIRED=true`, `/api/snapshot` returns `503`.

## Running tests

```bash
npm test           # vitest run (no DB required)
```

## Deploy to Railway

1. Create a new Railway project and link this repo.
2. Add a **Postgres** plugin to the service — Railway injects `DATABASE_URL`
   automatically. Until the plugin is attached the app still deploys; the
   migration step is a no-op without `DATABASE_URL`.
3. Set the following environment variables in the Railway service's Variables tab:

   | Variable | Purpose |
   |---|---|
   | `MIRROR_INGEST_SECRET` | Shared bearer token — must match the private pusher daemon's secret (`openssl rand -hex 32`) |
   | `MOBILE_SNAPSHOT_UPSTREAM_URL` | New cloud/mobile-shaper feed endpoint (example: `https://<host>/v1/snapshot`) |
   | `MOBILE_SNAPSHOT_UPSTREAM_BEARER_TOKEN` | Optional bearer token for upstream snapshot feed |
   | `MOBILE_SNAPSHOT_UPSTREAM_TIMEOUT_MS` | Optional timeout for upstream snapshot fetch (default `4000`) |
   | `MOBILE_SNAPSHOT_UPSTREAM_REQUIRED` | Optional strict mode (`true` disables DB fallback when upstream fails) |
   | `STALENESS_WARN_SECONDS` | Seconds before the stale banner turns amber (default `60`) |
   | `STALENESS_STALE_SECONDS` | Seconds before the stale banner turns red (default `120`) |
   | `NEXT_PUBLIC_DEMO_FIXTURE` | Optional. Set to `true` to render fixture data instead of polling `/api/snapshot` — useful before the pusher is live |

4. Deploy. On boot `npm run migrate` runs; if `DATABASE_URL` is set it creates
   the `mirror_snapshots` table (idempotent). The app listens on `$PORT` bound
   to `0.0.0.0`.

5. Verify `GET /api/health` returns `200 {"status":"ok"}` — this is the
   healthcheck path configured in `railway.toml`.

## Secret rotation

1. Generate a new secret: `openssl rand -hex 32`
2. Update `MIRROR_INGEST_SECRET` in Railway and let the service restart.
3. Update the matching secret in the pusher daemon (`MIRROR_INGEST_SECRET` env
   var) and reload the launchd plist.
4. Confirm ingest resumes: Railway logs should show `204` responses from
   `POST /api/ingest` within the next push cycle (~20s).

> The old secret stops working the moment the Railway service restarts with
> the new value — no token revocation list is needed.
