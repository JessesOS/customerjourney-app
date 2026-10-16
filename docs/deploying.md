# Deploying to Production (Cloudflare Workers)

Current as of 2026-10-16. This replaces the old Codex Sites publish flow
(`publishing-to-codex-sites.md`, now superseded).

> **A real client is live (Fin Creighton, since 2026-10-16).**
> - Every prod deploy needs Jesse's explicit OK. Run `npm run check:fin` first.
> - Never put Cloudflare Access on the prod workers.dev address. It is every client's link.
> - Test on **staging** first (see "Staging" below).

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
3. **Patch the generated `wrangler.json`.** The build emits a config with placeholder values
   (`name` defaults to `site-creator-vinext-starter`, `database_id` to a zeroed placeholder).
   The patch is a committed script; environments live in `scripts/deploy-envs.mjs`:
   ```bash
   node scripts/patch-wrangler.mjs
   ```

4. **Apply any new migrations to production D1.** Schema changes only, and most deploys skip
   this. Additive only (new tables): the script refuses `ALTER`/`DROP` on `portal_*` tables.
   ```bash
   node scripts/d1-migrate.mjs --env prod --file drizzle/<new-migration>.sql --yes-prod
   ```
   Migrations 0000–0014 are applied to prod as of 2026-10-16.

   Before a prod migration or a risky deploy, note a restore point:
   ```bash
   npx wrangler d1 time-travel info scale-onboarding-portal-prod
   npx wrangler deployments list --name scale-onboarding-portal
   ```
   Rollback: `npx wrangler rollback <version-id> --name scale-onboarding-portal`.

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

## Staging (since 2026-10-16)

A private copy for testing, with its own D1 (`scale-onboarding-portal-staging`), its own R2
bucket (`scale-onboarding-portal-staging-uploads`) and its own secrets. It holds synthetic
data only.

- **URL:** `https://scale-onboarding-portal-staging.jesse-b4e.workers.dev`
- **Access:** Cloudflare Access protects it once set up. That's fine here: staging is never a client's link.

```bash
npm run build
node scripts/patch-wrangler.mjs --env staging          # writes dist/server/wrangler.staging.json only
node scripts/d1-migrate.mjs --env staging --file drizzle/<new>.sql   # if there's a migration
npx wrangler deploy --config dist/server/wrangler.staging.json
```

- The staging patch refuses to run if any setting points at a prod resource. It never writes the prod config file.
- If `dist/server/wrangler.json` ever holds staging values, the prod patch refuses until you rebuild.
- Staging secrets (`ADMIN_ACCESS_TOKEN`, `PORTAL_HOOK_SECRET`) are staging-only values, saved in the git-ignored `.env.staging.local`. Don't set Slack webhooks on staging.

## Worker secrets

Managed with `npx wrangler secret put <NAME> --name scale-onboarding-portal`:

- `ADMIN_ACCESS_TOKEN` — admin API/page token (also in the brain repo's `.env.local` as `SCALE_PORTAL_ADMIN_TOKEN`)
- `PORTAL_HOOK_SECRET` — auth for `/api/hooks/ghl/provision` (also in the brain's `.env.local`; see `docs/provision-webhook.md`)
- `PORTAL_SLACK_WEBHOOK` — Slack DM webhook the hook endpoints fail loud to
- `JOURNEY_SYNC_TOKEN` is no longer used: the BSS sync with the CSM dashboard was retired on
  2026-10-16, along with the `CSM_DASHBOARD` service binding.

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
