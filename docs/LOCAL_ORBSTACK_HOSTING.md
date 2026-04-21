# Local-first hosting (OrbStack + Cloudflare Tunnel)

Replaces the Railway deploy documented in the main README. Rationale in
`../../options-playbook-supabase/memory/project_runtime_architecture.md`:
Railway + Vercel deprecated 2026-03-24; everything runs locally.

## Architecture

```
IBKR/Tradier daemons          (Mac, launchd)
        ↓
TradeBridge ops               (Mac, Supabase edge fns)
        ↓
mirror-pusher daemon          (Mac, launchd, 20s interval)
        ↓ POST /api/ingest with Bearer MIRROR_INGEST_SECRET
Next.js mobile site           (this app, Mac :3001)
        ↓ writes snapshot row
OrbStack Postgres             (mirror_snapshots table)
        ↓ reads on every poll
cloudflared tunnel            (Mac, quick or named)
        ↓ public HTTPS
Your phone                    (cellular or WiFi, anywhere)
```

No Railway. No Vercel. No cloud DB.

## Prerequisites on the Mac

- OrbStack running with Supabase stack (Postgres on `127.0.0.1:54322`)
- `cloudflared` (`brew install cloudflared`)
- Node ≥ 22

## One-time setup

### 1. Seed the mirror database

Uses the existing OrbStack Supabase Postgres — no new container. Tables are
created in the `postgres` database on host port 54322.

```bash
cd ~/Development/OptionsPlaybookMobile
DATABASE_URL="postgres://postgres:postgres@127.0.0.1:54322/postgres" npm run migrate
```

Grant access to standard Supabase roles (one-time, as `postgres` superuser):

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
GRANT ALL ON public.mirror_snapshots TO supabase_admin, service_role, authenticated, anon;
GRANT ALL ON public.mirror_schema_migrations TO supabase_admin, service_role;"
```

### 2. Create `.env.local`

```bash
cat > .env.local <<'EOF'
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres
MIRROR_INGEST_SECRET=<shared 32-byte hex — must match pusher daemon>
STALENESS_WARN_SECONDS=60
STALENESS_STALE_SECONDS=120
PORT=3001
EOF
```

The `MIRROR_INGEST_SECRET` must exactly match the `MIRROR_INGEST_SECRET`
value in `~/Library/LaunchAgents/com.optionsplaybook.mirror-pusher.plist`.
Rotate with `openssl rand -hex 32` in both places to revoke the old one.

### 3. Retarget the mirror-pusher daemon

Update the plist to point at localhost instead of the dead Railway URL:

```bash
plutil -replace 'EnvironmentVariables.MIRROR_INGEST_URL' \
  -string "http://127.0.0.1:3001/api/ingest" \
  ~/Library/LaunchAgents/com.optionsplaybook.mirror-pusher.plist

launchctl unload ~/Library/LaunchAgents/com.optionsplaybook.mirror-pusher.plist
launchctl load   ~/Library/LaunchAgents/com.optionsplaybook.mirror-pusher.plist
```

Verify pushes are landing:
```bash
tail -f /tmp/mirror-pusher.out.log   # should show "push ok" every 20s
```

### 4. Build + run the Next.js site

```bash
npm run build
npm run start   # listens on :3001 bound to 0.0.0.0
```

Health + snapshot check:
```bash
curl http://localhost:3001/api/health    # → {"status":"ok"}
curl http://localhost:3001/api/snapshot  # → payload from latest push (after pusher runs once)
```

### 5. Expose publicly via Cloudflare Tunnel

**Quick tunnel** (no account, ephemeral URL — good for validation):

```bash
cloudflared tunnel --url http://localhost:3001
# Look for: https://<random-name>.trycloudflare.com
```

URL rotates every ~24h or whenever cloudflared restarts.

**Named tunnel** (stable URL, requires free Cloudflare account):

```bash
cloudflared tunnel login                    # browser auth once
cloudflared tunnel create options-mobile
cloudflared tunnel route dns options-mobile <subdomain>.<yourdomain>.com
cloudflared tunnel run options-mobile
```

If you don't own a domain, Cloudflare gives `*.cfargotunnel.com` hostnames
via `cloudflared tunnel route ...`. Tunnel stays on the same URL across
restarts.

## Persistence across reboots

Neither the Next.js app nor cloudflared auto-starts yet. To persist both,
drop these plists in `~/Library/LaunchAgents/`:

### `com.optionsplaybook.mobile-site.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.optionsplaybook.mobile-site</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/env</string>
    <string>bash</string><string>-lc</string>
    <string>cd ~/Development/OptionsPlaybookMobile && npm run start</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict>
  <key>StandardOutPath</key><string>/tmp/optionsplaybookmobile.out.log</string>
  <key>StandardErrorPath</key><string>/tmp/optionsplaybookmobile.err.log</string>
</dict>
</plist>
```

### `com.optionsplaybook.cloudflared-tunnel.plist`

(Only if you've promoted to a named tunnel — quick tunnels aren't worth persisting.)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.optionsplaybook.cloudflared-tunnel</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/cloudflared</string>
    <string>tunnel</string>
    <string>run</string>
    <string>options-mobile</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/cloudflared.out.log</string>
  <key>StandardErrorPath</key><string>/tmp/cloudflared.err.log</string>
</dict>
</plist>
```

Load both:
```bash
launchctl load ~/Library/LaunchAgents/com.optionsplaybook.mobile-site.plist
launchctl load ~/Library/LaunchAgents/com.optionsplaybook.cloudflared-tunnel.plist
```

## Troubleshooting

| Symptom | Check |
|---|---|
| `/api/snapshot` → `"No snapshot available"` | Pusher daemon hasn't run or is 503-ing. Check `/tmp/mirror-pusher.err.log` |
| `/api/ingest` → 401 Unauthorized | `MIRROR_INGEST_SECRET` in `.env.local` doesn't match the pusher plist value |
| `/api/ingest` → 503 | DB connection failing. Verify `DATABASE_URL` reachable: `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT 1"` |
| Cloudflare tunnel fails with DNS errors | Mac is behind a proxy/VPN. Try `cloudflared tunnel --url http://localhost:3001 --protocol http2` |
| Site works locally but not via tunnel | Firewall. `sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate` — should be disabled or have rule for Node |

## Rotating the ingest secret

```bash
NEW=$(openssl rand -hex 32)

# Update .env.local
sed -i '' "s|^MIRROR_INGEST_SECRET=.*|MIRROR_INGEST_SECRET=$NEW|" .env.local

# Update launchd plist
plutil -replace 'EnvironmentVariables.MIRROR_INGEST_SECRET' \
  -string "$NEW" \
  ~/Library/LaunchAgents/com.optionsplaybook.mirror-pusher.plist

# Restart both
launchctl unload ~/Library/LaunchAgents/com.optionsplaybook.mirror-pusher.plist
launchctl load   ~/Library/LaunchAgents/com.optionsplaybook.mirror-pusher.plist

# Restart the Next.js app to pick up .env.local
# (if running under launchd, kickstart the mobile-site plist)
```

Old secret becomes inert the moment either side restarts with the new value.
