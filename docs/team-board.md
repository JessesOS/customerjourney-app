# Team board (the back office)

Built 2026-10-17 (Option D, Phase 2). It replaces the old CSM dashboard. It lives in this app, so there is nothing to sync.

**Status:** live on prod since 2026-10-18 (Jesse's OK). There, sign-in is Jesse's access code only. Cloudflare Access and per-person logins wait until someone else joins (Jesse: he's the only team member). Staging keeps the full setup for testing.

## Where

| | Address | Sign-in |
|---|---|---|
| Staging | `https://scale-onboarding-portal-staging.jesse-b4e.workers.dev/admin` | Staging access code (in `.env.staging.local`), or Cloudflare Access once it's set up |
| Prod | `https://scale-onboarding-portal.jesse-b4e.workers.dev/admin` | Jesse's access code, which counts as `OWNER_EMAIL` (jesse@allconvos.ai). Later: `team.allconvos.ai` with Cloudflare Access, one email login per person |

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
- **Paused products can't start a board.** BSS Launchpad (`bss`, the old 41-step custom journey) is paused. Since 2026-10-17 (Phase 3) the Board shows `bss` clients with their BSS client steps and 42 days, read from `products/bss/`. Their board can't start: Start board says "BSS Launchpad (custom journey) is paused." Fin is on `bss-custom` (since 2026-10-18), not `bss`.

## Ask Jesse: the client's help panel (2026-10-18)

A sound-wave button, bottom right of the client's portal, opens a side panel. It's switched on per product (`portal.features.assistant`); today only `bss-custom` has it.

- **Ask:**
  - The client types, or speaks with the mic, and gets an answer from Claude (`claude-opus-5-5`, low effort, with server-side fallbacks).
  - It answers **only** from the client's reviewed knowledge pack and their live progress. Rules: no RT Digital, no passwords or seed phrases, no financial/legal/tax advice, no pricing or contract talk, and say so when unsure.
  - Limited to 30 questions an hour per client.
  - Without a pack or an `ANTHROPIC_API_KEY`, it offers "Send to Jesse" instead.
- **Requests:**
  - "Send to Jesse" creates a task on the client's board: category **Support requests**, high priority, "Reply within 1 business day", with the client's details in the notes. It also pings Slack (`PORTAL_SLACK_WEBHOOK`).
  - Without a board, it's Slack only.
  - Limited to 10 requests a day.
- **Replies:** a support task's drawer has **Reply to the client**. The reply shows in the client's panel under that request, with a dot on the button until they open it.
- **The client's chat** shows read-only on their board, under Activity ("Ask Jesse chat").
- **Knowledge pack:**
  - A Markdown file Jesse reviews (Fin's is `~/Master/Side_Projects/Clients/bitcoinsuccessschool/knowledge/fin-assistant-pack.md`).
  - Loaded with `node scripts/assistant-pack.mjs --env local|staging|prod --client <client id> --file <pack.md>` (prod needs `--yes-prod` and Jesse's OK; `--show` prints what's loaded).
  - The script refuses a pack that mentions RT Digital.
  - Never put prices, GST, contract terms, internal notes or other clients in a pack.
- **Data:** `portal_assistant_packs` and `portal_messages` (migration `0016_portal_assistant`, CREATE only).
- **Code:** `lib/assistantStore.ts`, `app/api/portal/[token]/assistant/` (GET, POST, `requests/`), `app/api/admin/team/tasks/[taskId]/reply`, `app/api/admin/team/clients/[id]/assistant`, `app/components/portal/PortalAssistant.tsx`.

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

| Setting | Staging | Prod |
|---|---|---|
| `TEAM_BOARD` | `1` | `1` (since 2026-10-18) |
| `TEAM_BOARD_AUTOSEED` | `1` | unset: a client's board starts when someone clicks Start board. It goes on once the Scale and Respond task lists are tidied, so new boards don't copy stale tasks |
| `PRODUCT_DRAFTS` | `1`. Draft products (status `draft`, e.g. a custom product being previewed) are offered in the Clients dropdown and their boards start | unset. Drafts are never offered and their boards never start. Set it locally in `.dev.vars` to preview a draft |
| `PUBLIC_PORTAL_BASE` | the staging address | unset (copy-link uses the page's own address) |
| `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` | empty until Access is set up | unset |
| `OWNER_EMAIL` | empty (shows as owner@local) | `jesse@allconvos.ai`. The access code counts as this team member, so "Mine" and My tasks work |

## Data (migration `drizzle/0015_team_board.sql`, CREATE only)

- `team_members`
- `team_boards` (one per client)
- `team_tasks`
- `team_task_events` (every change and comment)

Applied to staging on 2026-10-17. Prod gets it at go-live, **before** that deploy.

## Go-live (2026-10-18)

Done with Jesse's OK; details in `docs/option-d-build.md`.
- Migration 0015 applied to prod with Fin's go-live, before the code.
- Jesse added as the only team member (jesse@allconvos.ai, admin, role "Jesse Allan"). That has to happen before a board starts, so its tasks are assigned to him.
- `TEAM_BOARD=1` and `OWNER_EMAIL` deployed. No autoseed, no Access.

**Later: per-person logins** (when someone else joins):
1. allconvos.ai DNS on Cloudflare.
2. An Access app on `team.allconvos.ai` **only**. Never on the prod workers.dev address: that's every client's link.
3. Set `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` (and `PUBLIC_PORTAL_BASE`), deploy, and add the `team.allconvos.ai` custom domain.
4. Add each person on the Team page and in the Access policy.
