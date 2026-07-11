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
1. **Stages 1, 4, 5 need real CSM content** (stage 3 done) — the main remaining task
2. Automation/notification wiring (optional, post-MVP)

## Historical note

An earlier phase of this project deployed via OpenAI Codex Sites (`.openai/hosting.json` is a
leftover of that). That path is superseded — deploys go straight to Cloudflare via wrangler now.
