# Customer Journey Project Context

## Purpose

Customer Journey is the customer lifecycle platform within the JesseOS ecosystem — the client
onboarding/fulfilment portal (currently branded as the **Scale Onboarding Portal**).

It covers onboarding, fulfilment, customer experience, guided workflows, lifecycle visibility,
and eventually deeper integration with AgencyOS.

## Location & Source Control (updated 2026-07-12)

- **Local codebase:** `~/Master/AI/customerjourney-app` (the single local home for all JesseOS
  projects — the old Google Drive "Codex Chris McBreen" path is retired)
- **Canonical repo:** `github.com/JessesOS/customerjourney-app` (branch `main`)
- One repo, one source of truth. All prior session work (admin UI, milestone videos, CSV upload,
  admin token auth) is in this history.

## Deployment (updated 2026-07-12)

- **Live URL:** `https://scale-onboarding-portal.jesse-b4e.workers.dev`
- **Host:** Cloudflare Workers (account: jesse@allconvos.ai), database: Cloudflare D1
- **Deploy:** via `wrangler deploy` — see `docs/deploying.md`
- Vercel and GitHub Pages were tried and **do not work** for this app (`vinext` outputs a
  Cloudflare Worker build, not a standard Next.js build)
- Admin panel: `/admin/clients` (token auth — token stored in browser localStorage after first
  visit; see `~/Master/_private/services.md` for where the token lives)
- Client demo: `/portal/demo`

## Relationship to JesseOS / AgencyOS

Customer Journey sits **under AgencyOS** conceptually (client delivery/lifecycle) and within the
JesseOS ecosystem. It should align with:
- JesseOS information lifecycle
- AgencyOS
- Review Queue / Knowledge Packets
- AI agent model and shared dashboard principles

## Current Status (as of 2026-07-12)

Functionally complete portal, live in production, with admin client management.
Outstanding work:
1. **UI/UX overhaul — see below, this is today's priority.**
2. Stages 1, 4, 5 need real CSM content (stage 3 done)
3. Automation/notification wiring (optional, post-MVP)

## Planned: UI/UX overhaul (2026-07-12)

Jesse's brief: "beautiful, but not quite right." **Content and tasking stay exactly as they
are — this is visual/UX only.**

**Scope boundary — state this explicitly at the start of the session so nothing outside it
gets touched:** no changes to admin logic, the milestone data model, or the token auth flow.
Pure visual/UX redesign, functional behavior locked.

**Before starting design work:**
1. Get 2-3 concrete complaints about the current look, not just "make it prettier" — too
   generic? too corporate? inconsistent spacing? Something specific to aim at.
2. Ask for a design reference or two if Jesse has one in mind ("more like X, less like Y").
3. Screenshot the current live portal first (both `/admin/clients` and a real `/portal/[token]`
   view) as the "before" — for diffing against and for Jesse to compare once done.

**Tooling:** try the built-in `design:design-critique` and `design:design-system` skills before
reaching for anything custom — they're already shaped for "here's a UI, make it better, keep it
consistent." Only build a bespoke skill if the same custom instructions end up repeating across
multiple redesign sessions — not before.

## Historical note

An earlier phase of this project deployed via OpenAI Codex Sites (`.openai/hosting.json` is a
leftover of that). That path is superseded — deploys go straight to Cloudflare via wrangler now.
