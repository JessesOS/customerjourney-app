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
3. **Patch the generated `wrangler.json`** with the real production D1 `database_id`
   (the build emits a config that doesn't know the production database — the id lives in the
   Cloudflare dashboard under D1, or in the dedicated Customer Journey session's notes).
4. **Deploy:**
   ```bash
   wrangler deploy
   ```

## After deploying — smoke test

- Visit `/admin/clients` on the live URL (token auth — first visit needs `?token=...`, then
  localStorage remembers it). If it 500s, migrations haven't been applied to production D1.
- Open a real client portal link in an incognito window: welcome video plays, journey shows the
  right day, milestones render.
- `/portal/demo` is code-only (no DB) — a quick sanity check that the build itself is healthy.

## Things that stay true

- Local dev (`npm run dev`, port 3333) and production use **separate D1 databases** — nothing
  local "activates" production.
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
