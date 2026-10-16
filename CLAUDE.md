# CLAUDE.md — Customer Journey (client portal + team back office)

Project rules for every session rooted here. The layer above is `~/Master/CLAUDE.md`.

## What this is

- **Client portal:** each client opens `/portal/<code>` and works through their onboarding journey.
- **Admin:** `/admin/clients`.
- **Team back office (being built, Option D, 2026-10-16):** the team's task board lives in this app too. Each product is defined **once**, holding the client steps and the team tasks behind them, so there is no sync. The old CSM dashboard (`~/Master/AI/csm-dashboard`) is **frozen** and being retired.
  - Plan: `~/.claude/plans/temporal-waddling-wave.md`.
  - Build log: `docs/option-d-build.md`.

This one session owns the portal and the back office. GHL automation belongs to the brain session (`~/Master/Labs/stanley-henry-ai-brain`).

## A real client is live: protect him

- **Fin Creighton** (Bitcoin Success School) has used the live portal since 2026-10-16. His product is `bss-meta` ("BSS Meta ads only"): the Scale journey for Meta only, plus product-level notes and hides in `lib/journeyEngine.ts`.
- **Every deploy to the live worker needs Jesse's explicit OK.** Send it as a package: the commits, the checks run, the version currently live, a D1 time-travel bookmark, and the rollback command.
- **`npm run check:fin` must pass before every commit and deploy.** It proves everything Fin's portal is built from is unchanged. Only re-save its baseline (`-- --write`) for a change Jesse approved.
- **Never open Fin's link in a normal browser.** It records a visit as his. Use `curl`, or a browser where admin is unlocked.
- **Never put Cloudflare Access on `scale-onboarding-portal.jesse-b4e.workers.dev`.** That address is every client's link. Access goes on team hostnames only.

## Environments

| | prod | staging |
|---|---|---|
| Worker | `scale-onboarding-portal` | `scale-onboarding-portal-staging` |
| D1 | `scale-onboarding-portal-prod` | `scale-onboarding-portal-staging` |
| R2 | `scale-onboarding-portal-uploads` | `scale-onboarding-portal-staging-uploads` |
| Config | `dist/server/wrangler.json` | `dist/server/wrangler.staging.json` |
| Data | real clients | synthetic only |
| Secrets | Cloudflare | Cloudflare (staging-only values in git-ignored `.env.staging.local`) |

Settings live in `scripts/deploy-envs.mjs`. Full steps are in `docs/deploying.md`.

```bash
npm run build && node scripts/patch-wrangler.mjs                 # prod (then deploy with Jesse's OK)
npm run build && node scripts/patch-wrangler.mjs --env staging   # staging
npx wrangler deploy --config dist/server/wrangler.staging.json
```

## Database rules

- **Additive only.** New tables, never `ALTER` or `DROP` on `portal_*`, since Fin's portal reads those. `scripts/d1-migrate.mjs` refuses anything else.
- Generate migrations with `npx drizzle-kit generate --name <name>`.
- Apply a migration to prod **before** deploying the code that needs it: `node scripts/d1-migrate.mjs --env prod --file drizzle/<file>.sql --yes-prod` (with Jesse's OK).
- Staging: `--env staging`.
- Local: `sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/<file>.sqlite < drizzle/<file>.sql`.

## Branches

- **`main` (with `motion-redesign`) is the live line.**
- **Back-office work goes on branch `team-board`.**
- Keep this `git diff main...team-board` empty, so Fin's portal can't change by accident:
  - `app/portal/**`, `app/components/portal/**`, `app/api/portal/**`
  - `lib/{onboardingJourney,respondJourney,bssJourney,journeyEngine,onboardingForm,stageGuide,stringPlans}.ts`
  - `app/layout.tsx`, `app/globals.css`
- **Feature flags** `TEAM_BOARD` / `TEAM_BOARD_AUTOSEED` (Worker vars): on in staging, off in prod until go-live.

## Products

**Today:** journeys are code in `lib/onboardingJourney.ts` (Scale), `lib/respondJourney.ts` (CRM — Respond) and `lib/bssJourney.ts` (paused). Per-product tweaks live in the `product*` maps in `lib/journeyEngine.ts`.

**Changing a journey:**
- Note it in `docs/customer-journey-master-plan.md`.
- Keep the copy as it is unless Jesse asks. Flag any copy you draft as a draft.

**Coming in Phase 1:** product files under `products/`, with a generated sheet per product in `docs/products/`. Change those by asking Claude.

## Working rules

- **Commit:**
  - by explicit file paths, never `git add -A`;
  - run `npx tsc --noEmit` and the relevant checks first;
  - push at the end of a session.
- **Plan → Build → Verify → Record.** Verify by observing real output, and update the docs that describe what changed in the same session.
- **Local dev:** the "dev" preview server on port 3333. Local admin works without a code.
- **Admin auth (`lib/adminAuth.ts`):** the access code (`x-admin-token` header or `?token=`), or an exact localhost hostname. It never trusts identity headers.
- **No RT Digital** in anything client-facing. The client-facing brand is allconvos.ai.
- **House style:** plain language, short sentences.
