# Options Playbook Mirror

A lightweight public read-only mirror of the Options Playbook trading dashboard.
Receives snapshots from the private system via a secured ingest endpoint and serves
them as a static-ish JSON feed — no auth required to read, auth required to write.

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

For DB-dependent features set `DATABASE_URL` in `.env.local`.

## Running tests

```bash
npm test           # vitest run (no DB required)
```

## Deploy to Railway

1. Create a new Railway project and link this repo.
2. Add a **Postgres** plugin to the service — Railway injects `DATABASE_URL` automatically.
3. Set the following environment variables in the Railway service settings:

   | Variable | Description |
   |---|---|
   | `INGEST_SECRET` | Shared bearer token — must match the private system's outbound secret |
   | `PORT` | Set by Railway automatically; the start command respects `${PORT:-3001}` |

4. Deploy. On first boot `npm run migrate` runs automatically and creates the
   `mirror_snapshots` table. Subsequent deploys are idempotent (already-applied
   migrations are skipped).

5. Verify the health check passes:
   ```
   GET https://<your-railway-domain>/api/snapshot
   ```
   Returns `404` (no data yet) or `200` (snapshot present) — both are healthy
   from a connectivity standpoint. Railway's health check will pass on either `2xx`
   status; set `healthcheckPath = "/api/snapshot"` (already in `railway.toml`).

## Secret rotation

To rotate `INGEST_SECRET`:

1. Generate a new secret: `openssl rand -hex 32`
2. Update `INGEST_SECRET` in Railway service environment variables.
3. Update the matching secret in the private Options Playbook system
   (`MIRROR_INGEST_SECRET` env var or equivalent).
4. Redeploy the Railway service so the new value is loaded.
5. Confirm ingest resumes: check Railway logs for `204` responses from
   `POST /api/ingest` within the next hydration cycle (~5 min).

> There is no token revocation list — the old secret stops working the moment the
> Railway service restarts with the new value.
