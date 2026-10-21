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

- **Fin Creighton** (Bitcoin Success School) has used the live portal since 2026-10-16. **Since 2026-10-18 his product is `bss-custom`** (`products/bss-custom/`, "BSS Launchpad"): 23 client steps over 30 days, with the 337 team tasks behind them. His start date is 2026-10-19, so launch (day 23) is 10 Nov and day 30 is 17 Nov. Before that he was on `bss-meta`, which only the test client JAT still uses.
- **The holding page stays in the code** (`app/components/portal/PortalPausedNotice.tsx`): a client whose `journey_state` is `paused` sees "A new version is on its way" instead of their portal. Fin saw it from 2026-10-17 23:25Z to 2026-10-18 04:27Z.
- **"Jesse test fin"** (prod) is a live copy of Fin's portal: `bss-custom`, same start date. It's Jesse's, so open it freely.
- **Every deploy to the live worker needs Jesse's explicit OK.** Send it as a package: the commits, the checks run, the version currently live, a D1 time-travel bookmark, and the rollback command.
- **`npm run check:fin` and `npm run check:journeys` must pass before every commit and deploy.** check:journeys freezes every client type, Fin's `bss-custom` included (`scripts/fixtures/journeys/bss-custom.json`). check:fin still guards the old `bss-meta` baseline. Only re-save a baseline (`-- --write`) for a change Jesse approved.
- **`--yes-fin` guards Fin's types** (`FIN_TYPES` in `scripts/journeys/run.ts`): `bss-custom`, his live journey, and `bss-meta`, his rollback. Re-saving either fixture needs it. So does re-saving `_global.json` when that would change their form questions, upload steps, editable steps, intro video or acceptance, which only `_global` freezes. `products:check` proves every refusal.
- **Not frozen by check:journeys:** the journey map's wording and the app icon (only the version lock covers them, so a change needs a version bump), and the journey map notes form (`bss-journey-map-notes-v1` in `lib/onboardingForm.ts`), which nothing freezes. Changing any of them changes Fin's live portal: Jesse's OK first.
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
- **Frozen journeys, not frozen files (2026-10-17).** The portal now reads its journeys from `products/`, so `app/portal/**`, `app/components/portal/**` and `lib/journey*.ts` differ from `main` on purpose; the empty-diff rule no longer applies. What protects clients is their output. `npm run check:journeys` freezes, for every client type (meta, google, meta-google, bss-meta, respond, bss, bss-custom and an unknown type), everything the portal is built from and shows: steps and wording, every stage render, days, branding, per-step tweaks, voice guides, Ask-AI, String Theory, admin counts and labels, and the portal's server-rendered markup in every look (`scripts/fixtures/journeys/`). `npm run check:fin` still guards the old `bss-meta` baseline. Both must pass before every commit, merge and deploy. Re-save a fixture (`npm run check:journeys -- --write <type>`) only for a change Jesse approved; Fin's `bss-custom` and `bss-meta` also need `--yes-fin`. The fixtures can't see CSS: `app/globals.css` and `app/layout.tsx` still need Jesse's OK. After merging `main`: if a fixture differs only because of a portal change already approved on `main`, inspect it with `--dump <dir>`, re-save it and say so in the commit message.
- **Feature flags** `TEAM_BOARD` / `TEAM_BOARD_AUTOSEED` (Worker vars): both on in staging. In prod, `TEAM_BOARD` has been on since 2026-10-18, with the access code as the only sign-in (it counts as `OWNER_EMAIL`, jesse@allconvos.ai). Autoseed stays off in prod until the Scale and Respond task lists are tidied. `PRODUCT_DRAFTS=1` (staging only, never prod) offers draft products in admin and lets their boards start. Prod has had the team and Ask Jesse tables (0015, 0016) since 2026-10-18. They're empty until those features are switched on.

## Products

- **Each product is one folder in `products/`:** client steps, team tasks and portal settings (wording, timeline, branding, voice guide, Ask-AI, String Theory). The portal, admin and board read it through `lib/productRegistry.ts`. The how-to is `docs/products/README.md`; the sheets in `docs/products/<id>.md` are generated.
- **Custom products** use `defineCustomProduct` (`products/custom.ts`): start from Scale, Respond or blank and describe only what differs.
- **`bss-custom` (live, Fin's product since 2026-10-18):** built from scratch from Jesse's BSS spec (`products/bss-custom/spec.md`). 23 client steps over 30 days, 337 team tasks. Ask Jesse is hidden for now. Every change to it is a change to Fin's live portal: Jesse's OK, a version bump, then a deploy package.
- **Building a product for a new client:** read `docs/new-client-product-playbook.md` first (order of work, go-live steps, traps).
- **After any product change:**
  1. Bump the version.
  2. Run `npm run products:lock`, `products:render`, `products:check`, `check:journeys` and `check:fin`.
- **Shims** (`lib/journeyEngine.ts`, `onboardingJourney.ts`, `stageGuide.ts`, `askAi.ts`, `stringPlans.ts`) exist only for check:fin. Never put journey data there, and never import them from app code.

**Changing a journey:**
- Note it in `docs/customer-journey-master-plan.md`.
- Keep the copy as it is unless Jesse asks. Flag any copy you draft as a draft: list the step ids in the product's `draftCopy`.

**Team board** (`docs/team-board.md`): the back office under `/admin`, behind the `TEAM_BOARD` flag. Live since 2026-10-18 on Jesse's access code; per-person logins come later. `npm run check:team-auth` must pass.

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
