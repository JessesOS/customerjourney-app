# AT Network: communications build (2026-10-21)

**Status:** Phase 1 built and on staging only (version c9c42261, 21 Oct). Migration 0017 is applied to staging, not prod. Jesse's answers: no dollar amounts in the portal (quotes stay off it), a typed name is enough for approvals, no files in threads, threads stay open after a step is ticked, keep Ask Jesse alongside. Still to do in phase 1: a "Messages" link on each step (the panel opens on a step via `window.dispatchEvent(new CustomEvent("pjc:open", { detail: stepId }))`, not wired into the step views yet). Email alerts: the app sends no email today.

Source: `products/at-network/spec.md` ("Communication rule"). Nothing here is built. Jesse's calls so far: build it today or tomorrow; start with the simple send-a-request panel that already exists.

## What the client rule needs

- Scope, feedback, files and approvals go through the portal only.
- A thread sits on each step.
- A Communications tab shows all threads, filterable.
- Messages typed **Approval** or **Change Request** become dated records, exportable.
- Rich and Martyn share one link, so every message needs a typed author name.
- Reply within one business day (the team needs to see what is overdue).

## What exists today (reuse it)

- **Ask Jesse panel** (`PortalAssistant.tsx`, `lib/assistantStore.ts`, `portal_messages`): bottom-right panel, "Send a request" becomes a board task, team replies come back with an unread dot. On for at-network already. Keep it for quick questions.
- **Step notes**: each step's typed answer is stored with the time in `portal_milestone_progress.note`. Step 1's typed-name acceptance already lives there.
- **Board** (`teamTasks`, `teamTaskEvents`) and the client page `app/admin/clients/[id]`.
- Alerts only go to Slack, and Jesse has no Slack (see open question 1).

## Design

**Data (additive only, new tables, migration 0017, CREATE only):**
- `portal_comms`: `id`, `client_id`, `step_id` (null = general), `kind` (`message` | `approval` | `change_request` | `status`), `author_side` (`client` | `team`), `author_name`, `body`, `parent_id` (reply or link to a request), `status` (change requests: `open` | `quoted` | `approved` | `declined` | `done`), `created_at`. Index on `(client_id, created_at)` and `(client_id, step_id)`.
- `portal_comms_seen`: `client_id`, `side`, `last_seen_id`. Drives unread dots on both sides.
- **Append-only records.** No edit or delete of approval and change-request rows. A status change is a new `status` row. This is what makes the export a trustworthy record.

**Switch:** `portal.features.comms` (off by default), same pattern as `assistant`. Every existing client's markup stays identical, so `check:journeys` and `check:fin` must keep passing with no fixture change except at-network's own at go-live.

**Client portal:**
- A "Messages" link under each step opens that step's thread. A composer with a type picker (Message, Approval, Change request) and a required name field (remembered in the browser).
- Approval and Change request need the typed full name. An Approval is shown to the client as a dated receipt.
- The Communications view is a slide-over panel opened from a button beside Ask Jesse, with filters by step and type. A true tab in each hub (Grove, Aurora, Cobalt) is later.
- Unread dot when the team replies.

**Admin (client page and board):**
- A thread view per step on `app/admin/clients/[id]`, a reply box, and a status picker for change requests.
- Board badge for unanswered client messages, and a flag when one is older than one business day.

**Export:** `GET /api/admin/portal-clients/[id]/comms/export?format=csv|html`. The CSV has one row per approval or change request (date, step, author, text, status history). The HTML is a printable page, so print-to-PDF works. Admin only.

**Wiring:** step 1 acceptance and review steps 10, 12 and 13 also write an `approval` record when completed, so the record is complete without the client doing it twice.

## Phases

1. **Phase 1 (today): threads.** Migration 0017, store and API (list, post, seen), `features.comms` flag, step thread and Communications panel in the portal, admin reply, and checks green. Deploy to staging.
2. **Phase 2 (tomorrow): records.** Approval and Change request kinds, status flow, auto-approval records from steps 1, 10, 12 and 13, CSV and HTML export, and the overdue flag.
3. **Later:** email alerts, a Communications tab in each hub, file attachments in threads, per-person logins, PDF export.

## Checks and safety

- Prod gets migration 0017 before any code that needs it, with Jesse's OK and the time-travel bookmark. Not before go-live.
- Run `products:lock`, `products:render`, `products:check`, `check:journeys`, `check:fin`, `check:team-auth` and `tsc` after each phase.
- Touching `app/components/portal/**` is allowed (frozen by output, not by file), but the flag keeps Fin's markup byte-identical. `app/globals.css` needs Jesse's OK: I plan to avoid it.

## Open questions for Jesse

1. **Alerts:** no Slack. Email you on each client message? (Does the app already send email? I haven't checked. If not, that is a separate small build.) Until then the board badge is the only signal.
2. **Quotes:** the handover says a change request is "quoted", but also no amounts in the portal. Should quotes stay off the portal (you reply "quote sent by email") or can a dollar figure appear in a thread?
3. **Approval strength:** is a typed full name per approval enough, with the time? Any need for an IP or device record?
4. **Files in threads:** not in v1 (the step uploads cover it). OK?
5. **Closed steps:** keep a step's thread open for comments after the step is ticked?
6. **Ask Jesse vs threads:** keep both (quick questions vs step threads), or fold requests into threads?
