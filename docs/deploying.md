# Deploying to Production (Cloudflare Workers)

Current as of 2026-07-12. This replaces the old Codex Sites publish flow
(`publishing-to-codex-sites.md`, now superseded).

**Live URL:** `https://scale-onboarding-portal.jesse-b4e.workers.dev`
**Host:** Cloudflare Workers (account: jesse@allconvos.ai) · **DB:** Cloudflare D1

This app is built with `vinext`, which outputs a Cloudflare Worker build — it cannot deploy to
Vercel or GitHub Pages (both were tried). Wrangler is the only supported path.

---

## Deploy steps

From the repo root (`~/Master/AI/customerjourney-app`):

1. **Clean tree, pushed:**
   ```bash
   git status && git log --oneline -3
   ```
2. **Build:**
   ```bash
   npm run build
   ```
3. **Patch the generated `wrangler.json`** — the build emits a config with placeholder values
   (`name` defaults to `site-creator-vinext-starter`, `database_id` to a zeroed placeholder).
   The patch is a committed script (since 2026-08-08, per master plan §5.5):
   ```bash
   node scripts/patch-wrangler.mjs
   ```

4. **Apply any new migrations to production D1** (schema changes only — most deploys skip this):
   ```bash
   npx wrangler d1 execute scale-onboarding-portal-prod --remote --file drizzle/<new-migration>.sql
   ```
   Migrations 0000–0011 are applied as of 2026-08-08. Verify with
   `... --remote --command "PRAGMA table_info(portal_clients)"`.

5. **Deploy:**
   ```bash
   npx wrangler deploy --config dist/server/wrangler.json
   ```
   The first request or two after a deploy can still hit the old version (isolate
   propagation) — a 404 on a brand-new route immediately after deploying is not a bug;
   retry before diagnosing.

## After deploying — smoke test

- Visit `/admin/clients` on the live URL (token auth — first visit needs `?token=...`, then
  localStorage remembers it). If it 500s, migrations haven't been applied to production D1.
- Open a real client portal link in an incognito window: welcome video plays, journey shows the
  right day, milestones render.
- `/portal/demo` is code-only (no DB) — a quick sanity check that the build itself is healthy.

## Worker secrets

Managed with `npx wrangler secret put <NAME> --name scale-onboarding-portal`:

- `ADMIN_ACCESS_TOKEN` — admin API/page token (also in the brain repo's `.env.local` as `SCALE_PORTAL_ADMIN_TOKEN`)
- `PORTAL_HOOK_SECRET` — auth for `/api/hooks/ghl/provision` (also in the brain's `.env.local`; see `docs/provision-webhook.md`)
- `PORTAL_SLACK_WEBHOOK` — Slack DM webhook the hook endpoints fail loud to

Local dev reads `.dev.vars` (gitignored) for the same names.

## R2 uploads (LIVE since 2026-08-09)

Client file uploads live in the `scale-onboarding-portal-uploads` R2 bucket (binding
`UPLOADS`, keys `uploads/<clientId>/<milestoneId>`); D1 keeps the metadata row, with
empty `content` marking an R2-backed row. Legacy inline rows still serve from D1.
Client deletion also deletes the client's R2 objects. Live-verified 2026-08-09:
upload → object in bucket → admin download → delete → object gone.

Jesse enabled R2 in the dashboard 2026-08-09 (account payment step, free tier covers
this usage). `R2_READY = true` in `scripts/patch-wrangler.mjs` writes the real bucket
name into the generated config — if a deploy ever fails on a missing bucket, check
that flag and the bucket before anything else. Local dev always uses an emulated
bucket (miniflare), separate from production.

## Things that stay true

- Local dev (`npm run dev`, port 3000) and production use **separate D1 databases** — nothing
  local "activates" production. Local migrations: apply the SQL file to the sqlite under
  `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`.
- Journey content (`lib/onboardingJourney.ts`) is code — changing it requires commit + redeploy.
- Client records live only in the database and never ship with code.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `/admin/clients` 500s | Migrations not applied to production D1 |
| `/portal/[token]` 404s | Wrong token, or client not actually created (check `/admin/clients`) |
| "Day X" looks wrong | Client start date entered incorrectly |
| Milestone approval doesn't stick | Failed `POST /api/portal/[token]/complete` — check console; likely a production auth/binding issue |
| `/portal/demo` changed unexpectedly | That route is code-only — check `git log` for what got deployed |
