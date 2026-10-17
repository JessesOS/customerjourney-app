# Team board (the back office)

Built 2026-10-17 (Option D, Phase 2). It replaces the old CSM dashboard. It lives in this app, so there is nothing to sync.

**Status:** on **staging** for Jesse's review. Not live. Prod has the code switched off (`TEAM_BOARD` unset), and its database has no team tables yet.

## Where

| | Address | Sign-in |
|---|---|---|
| Staging | `https://scale-onboarding-portal-staging.jesse-b4e.workers.dev/admin` | Staging access code (in `.env.staging.local`), or Cloudflare Access once it's set up |
| Prod (after go-live) | `team.allconvos.ai` | Cloudflare Access (one email login per person) |

## Screens

All live under `/admin`, with a menu across the top.

- **Board** (`/admin/board`): every client, worst first.
  - Shows client steps done, team tasks done, and when the client was last active.
  - Flags: blocked, overdue, stuck in progress for 5+ days, unassigned in the current stage, and client quiet for 3+ days.
  - Clients without a board yet sit at the bottom, with **Start board**.
- **Client board** (`/admin/clients/<id>/board`). Header: the client's step progress (purple) and team progress (teal). Three views:
  - **By client step:** each stage, then each client step (ticked when the client has done it), with the team tasks behind it. Team-only work in a stage is listed after its steps.
  - **Columns:** To do, In progress, Done. Drag a card to move it.
  - **Categories:** grouped like the old CSM board.

  Filters: Everyone, Mine or Unassigned, plus Hide done and a search box. **+ Add task** adds a custom task, and the activity feed shows who did what.
- **Task drawer** (click any task):
  - status, assignee, priority, due window;
  - blocked by;
  - "do these first";
  - Loom link;
  - how-to notes (the old SOP steps), editable;
  - comments and full history.

  Custom tasks can be deleted. Product tasks can't.
- **My tasks** (`/admin/my-tasks`): your open tasks across every client, plus unclaimed tasks in your roles, each with **Take it**.
- **Team** (`/admin/team`): admins add people, set their roles, and make them admins or inactive.
- **Clients** (`/admin/clients`): the same page as before, plus a **Team board** link per client.

## How it works

- **Each product is defined once** in `products/` (see `docs/products/README.md`). That file holds the client steps and the team tasks behind them.
- **A client's board is a copy.** Starting a board copies the team tasks for the client's variant, stamped with the product version. Later edits to a product file never change an existing board.
- **New clients get a board automatically** when `TEAM_BOARD_AUTOSEED=1`, whether created in admin or arriving via the GHL webhook. Existing clients, Fin included, only get one if someone clicks Start board.
- **"Done by client":** some tasks finish when the client finishes certain steps. For example, `scl-040` waits on `ob-6`, `ob-6b` and `ob-6c`. That's worked out when the board is read, and never written to the client's side.
- **The board never writes the portal's tables.** Ticking a client step is still done in the portal, or on the Clients page.
- **Auto-assign:** a task is assigned on start only when exactly one active team member covers its role. Otherwise it waits, unassigned, showing its role.

## Sign-in (`lib/teamAuth.ts`, `lib/accessJwt.ts`)

1. **Cloudflare Access:** the signed `Cf-Access-Jwt-Assertion` token is verified (RS256, audience, issuer, expiry). The email must be an active member on the Team page, or `OWNER_EMAIL`.
2. **Local dev:** exact localhost only.
3. **The access code:** shown as "Jesse (access code)". Jesse and the brain's nudge worker keep using it.

It never trusts a bare email header. `npm run check:team-auth` proves forged, expired, edited and wrongly-signed tokens are refused.

**Two lists, on purpose:**
- the Cloudflare Access policy, which lets someone through the door;
- the Team page, which says who they are here and what roles they cover.

Add a person to both.

## Settings (Worker vars, in `scripts/deploy-envs.mjs`)

| Setting | Staging | Prod (today) |
|---|---|---|
| `TEAM_BOARD` | `1` | unset. Every team route returns 404, and the Clients page is unchanged |
| `TEAM_BOARD_AUTOSEED` | `1` | unset |
| `PUBLIC_PORTAL_BASE` | the staging address | unset (copy-link uses the page's own address) |
| `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` | empty until Access is set up | unset |
| `OWNER_EMAIL` | empty (shows as owner@local) | unset |

## Data (migration `drizzle/0015_team_board.sql`, CREATE only)

- `team_members`
- `team_boards` (one per client)
- `team_tasks`
- `team_task_events` (every change and comment)

Applied to staging on 2026-10-17. Prod gets it at go-live, **before** that deploy.

## Go-live checklist (later, with Jesse's OK)

1. Jesse signs off on staging, and allconvos.ai DNS is on Cloudflare.
2. Set up an Access app on `team.allconvos.ai` **only**. Never on the prod workers.dev address: that's every client's link.
3. Merge `team-board` into `main`, then run `check:fin`, `products:check`, `check:team-auth` and `tsc`.
4. Note a prod D1 restore point, then `node scripts/d1-migrate.mjs --env prod --file drizzle/0015_team_board.sql --yes-prod`.
5. Set the prod vars (`TEAM_BOARD`, `ACCESS_*`, `OWNER_EMAIL`, `PUBLIC_PORTAL_BASE`; autoseed is Jesse's call), deploy, and add the `team.allconvos.ai` custom domain.
6. Smoke test: Fin's link by curl, `check:fin`, no board for Fin unless Jesse asks.
