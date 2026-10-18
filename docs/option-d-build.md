# Option D build log: folding the CSM back office into this app

Plan: `~/.claude/plans/temporal-waddling-wave.md` (approved by Jesse 2026-10-16).
This file records progress, decisions and anything the next session must know.

## Decisions (Jesse, 2026-10-16)

- **Option D:** one repo, one session, one database. Each product is defined once (client steps plus the team tasks behind them). No sync.
- **This round stops at a working team board on staging** for Jesse to review. Then go-live.
- **Per-person email login** via Cloudflare Access on an `allconvos.ai` subdomain. Jesse's access code keeps working.
- **Product wording lives as files in GitHub**, changed by asking Claude. Each live client stays pinned to the version they started on.
- **GHL pipeline view and GHL import are dropped for now.** New clients still arrive via `/api/hooks/ghl/provision`.
- **Start clean:** carry over the task lists and team roles only, no CSM client records.
- **Old CSM:** export its database, then take its public address offline.
- **Fin** (`bss-meta`) stays exactly as he is. No team board for him unless Jesse asks.

## Status

### Phase 0: safety and prep

**Done:**
- CSM database exported to `~/Master/_private/backups/csm-dashboard/csm-dashboard-db-2026-10-16.sql` (git-ignored).
  - Checked: 21 clients, 1,252 task rows, 23 events, 9 automatic snapshots, 7 training lessons (placeholders, no videos).
  - No saved "master" task list, so CSM's code files are the source.
- CSM frozen: banner in `csm-dashboard/CLAUDE.md` (commit a0da9c6). The CSM session confirmed it has stopped.
- `npm run check:fin`: baseline proof of Fin's portal (`scripts/fixtures/fin-bss-meta-journey.json`).
- Security batch, **live 2026-10-16** (version b9498d0f, Jesse's OK; previous version a3694869):
  - localhost check by exact hostname;
  - `GET /api/live-scale-bridge`, `GET /api/live-scale-sync` and `POST /api/project-chat` need admin;
  - `/` replaced by a neutral page.
- BSS sync retired, **live 2026-10-16** (same deploy):
  - removed: both pushes, `/api/csm-sync/*`, `lib/csmSync.ts`, and the `CSM_DASHBOARD` binding;
  - `setting()` moved to `lib/settings.ts`.
- Environment-aware deploys: `scripts/deploy-envs.mjs`, `scripts/patch-wrangler.mjs --env staging` and `scripts/d1-migrate.mjs`.
  - The prod config is byte-identical to before (apart from the retired binding).
  - Staging can't touch prod.
- Staging is up: `https://scale-onboarding-portal-staging.jesse-b4e.workers.dev`.
  - Its own D1, built from 0000–0014, with the same tables as prod.
  - Its own R2 bucket.
  - Staging-only `ADMIN_ACCESS_TOKEN` / `PORTAL_HOOK_SECRET`, saved in `.env.staging.local`.

**Waiting on Jesse:**
1. ~~OK to deploy the security batch and the sync retirement to prod.~~ Done 2026-10-16.
2. ~~Switch off CSM's public address.~~ Done 2026-10-17 via the Cloudflare API (workers.dev + previews off; worker and D1 kept; reversible by re-enabling the subdomain).
3. ~~Rotate the Fish Audio key.~~ Jesse: not needed, the key is unused. Then delete the stray `.env.local<key>` file in the repo root.
4. Create a Zero Trust organisation (Free) and turn on Access for the **staging** worker's workers.dev address. Add the team's emails, and copy the AUD tag into `scripts/deploy-envs.mjs`.
5. Move allconvos.ai DNS from Porkbun to Cloudflare. Needed before go-live, not before staging.
6. The team list: names, sign-in emails, roles, admins.

### Phase 1: product files (branch `team-board`)

Done 2026-10-17 (commit 5108957). Product files for Scale (all variants incl. bss-meta) and Respond, BSS (reference, paused) and a Website add-on (draft). 184 team tasks placed behind client steps. `npm run products:check` passes 6/6 (portal journeys generated from the files equal today's exactly). Sheets and the conversion report are in `docs/products/`. **Waiting on Jesse:** the 8 decisions in the conversion report (unplaced tasks, LaunchBay wording, Respond go-live day, ob-crm timing, stage mismatches, brand names, account-name check, person-named roles).

### Phase 2: team board on staging (branch `team-board`)

Built 2026-10-17. See `docs/team-board.md`.

- Migration 0015 (team tables, CREATE only), applied to **staging** only.
- Sign-in: Cloudflare Access token check plus the access code. `npm run check:team-auth`: 19/19.
- APIs under `/api/admin/team/**` and the screens under `/admin`: Board, client board, task drawer, My tasks, Team. The Clients page has a Team board link.
- Behind the `TEAM_BOARD` flag. With it off (prod), every team route is 404 and the Clients page is unchanged (tested).
- Staging deployed (version ce3f7997) with 5 fake clients, one per product, plus a test teammate.
- Protected-path diff vs `main` is empty, and `check:fin` passes.

**Waiting on Jesse:**
1. Review staging.
2. Zero Trust and Access on the staging worker (per-person login).
3. His sign-in email as `OWNER_EMAIL`.
4. The team list.
5. The allconvos.ai DNS move, before go-live.

### Phase 3: the portal reads product files (branch `team-board`)

Built 2026-10-17. **Nothing deployed:** prod and staging are untouched, no remote database was touched. The client portal, the admin and the board now all read each client type's journey from `products/`, through `lib/productRegistry.ts`. No client wording changed. How it works: `docs/products/README.md`.

**Commits:**
1. `0a006b2` C1: freeze every client type's portal (`npm run check:journeys`) before the switch.
2. `43b7a43` C2: shared journey types (`lib/journeyTypes.ts`) and the pure stage builder (`lib/journeyBuild.ts`).
3. `84009ff` C3: product files carry the portal settings; BSS converted into `products/bss`; the registry; `products/index.ts` generated.
4. `15778f4` C4a: server routes and the admin read journeys, days and labels from the registry.
5. `48db4f4` C4b: the client portal reads its journey from the registry; `lib/respondJourney.ts` and `lib/bssJourney.ts` deleted; the old `lib/*` journey files are compat shims for `check:fin` only.
6. `8ff3212` + `ff514d3` C5: custom products (`defineCustomProduct`), drafts behind `PRODUCT_DRAFTS`, the custom-product proof in `products:check`.
7. C6: this log.

**Decisions:**
- **D1 Freeze first, switch later.** Fixtures for 7 client types (meta, google, meta-google, bss-meta, respond, bss, and an unknown type) store outputs: templates, renders, decisions and hashes of server-rendered markup. They were written once in C1 and never re-saved.
- **D2 One answer per client type.** `portalJourneyFor(clientType)` returns plain data; the server passes it as a prop. No `isRespond`/`isBss`/`clientType ===` branches remain, and client components never import `products/`, so the 184 team tasks never reach a browser.
- **D3 BSS converted faithfully** into `products/bss` (paused): client steps, a `bss` variant, each `bss-NNN` task behind its step. One code path, no legacy fallback.
- **D4 Paused:** existing clients keep rendering; never offered in the admin dropdown; the board never starts. The API still accepts the type.
- **D5 `ClientType` is generated from the product files**, so a typo fails `tsc`. Unknown stored types render as before (Scale, channel steps hidden, 30 days).
- **D6 Portal extras live with the product:** product `portal` (wordmark, voice guide, Ask-AI, features) and variant overrides. Anything absent is off; existing types carry today's values verbatim.
- **D7 Step features** (playground, landing preview, receptionist script, non-blocking) are lists of step ids on the product, so step objects (and check:fin's template) stay unchanged.
- **D8 Compat shims:** `lib/journeyEngine.ts`, `onboardingJourney.ts`, `stageGuide.ts`, `askAi.ts`, `stringPlans.ts` stay as thin re-exports because `scripts/check-fin-journey.ts` imports them. That script and its fixture were never edited.
- **D9 One import direction:** `lib/journeyTypes` → `lib/journeyBuild` → `products/**` (types only from lib) → `lib/productRegistry` → shims, server and routes. A static check enforces it.
- **D10 `products/index.ts` is generated** by `npm run products:render` from the folders. A new product is one folder.
- **D11 `defineCustomProduct`** resolves a base plus differences into a plain product at import time, and throws on any mistake.
- **D12 Drafts:** the Worker var `PRODUCT_DRAFTS=1` (staging, or locally in `.dev.vars`) offers draft products in admin and lets their boards start. Prod leaves it unset.
- **D13 Id checks stay union-based** (first id wins), except the form route, which now resolves per client.
- **D14 Still code:** forms, the playground and landing-preview components, the `"landing-page"` slot, `STAGE_ORDER`, interview-audio naming, GHL mapping, incentive and stage-complete copy, the look list.

**Checks (all pass at the end of the phase):**
- `npx tsc --noEmit`.
- `npm run check:fin` (Fin's baseline; `scripts/check-fin-journey.ts` and its fixture unchanged since `983ffb1`).
- `npm run check:journeys`: 7 client types, 618 renders, 413 markup renders; fixtures unchanged since C1. It also cross-checks Fin's `check:fin` baseline.
- `npm run products:check`: six checks: frozen journeys, integrity, custom-product proof, code boundaries, version lock, sheets and index.
- `npm run check:team-auth`.
- `npm run build` succeeds, and no team-task text (e.g. "Accounts - Sandy", "RTDigital Agency Slack", "Merged SOP steps") is in `dist/client`.
- Page and API captures on the local server: C3 against C1 differs only in the bss board rows (below); C4a against C3, and C4b against C4a, are identical, every portal page included.
- The voice generators' `--list` output is identical before and after (9 guide lines, 18 interview lines).
- A manual draft test on the local server: a temporary draft custom product was offered only with `PRODUCT_DRAFTS=1`, its client's portal rendered and its board started. The test client and folder were deleted afterwards.

**Intentional admin-only wording changes (C4a):**
- The theme lock's tooltip now reads "Locked by the product (<label>): always uses <look>".
- The invalid client-type error lists the accepted types from the product files.
- The client-type dropdown fills once the client list loads (its options come from the API).

**Team board change (C3):** `bss` clients (local and staging test clients only) now show their BSS client steps, 42 days and a next step on the Board, instead of 0 steps and 30 days. Their board still can't start; the message is now "BSS Launchpad (custom journey) is paused."

**Notes for the next session:**
- A new product folder with new step ids changes `scripts/fixtures/journeys/_global.json` (the step-id union), even as a draft. Re-save `_global` only as part of the product change Jesse approved. A new live client type must also be added to `CLIENT_TYPES` in `scripts/journeys/contract.ts` before it can be frozen. Both are in `docs/products/README.md` §7 and §9.
- `npm run products:render` now also handles a deleted or renamed product folder: it rewrites the index and removes the old sheet.
- `PRODUCT_DRAFTS: "1"` is in the staging vars (`scripts/deploy-envs.mjs`); it takes effect on the next staging deploy.

**Waiting on Jesse:**
1. Review Phase 3 before it is merged or deployed. A deploy needs the usual package.
2. **Moving Fin onto a custom product** is a separate, approved prod data change: its own deploy package and a `check:journeys -- --write bss-meta --yes-fin` re-save. Nothing here moved him.
3. Existing issues, untouched on purpose (frozen for Fin):
   - the `bss-meta` testing Ask-AI still promises a day-14 test call;
   - the `bd-3` guide URL contains `RT_Digital`;
   - `go.rt-d.com` booking links on `ob-2`, `ts-3`, `pl-1`, `pl-2` and `rsp-014`;
   - `crm.rtdigital.agency` on `ob-crm`.
4. Out of scope, flagged for later:
   - **Portal version pinning.** Only boards are stamped with a product version. A future step is an additive `client_product_pins` table.
   - Product-specific copy in `StageCompleteView` and `IncentiveModal` (possible product settings).
   - The admin forms list is still the union of all products, so a reworded reused id shows the base title in admin.

#### Review fixes for custom products (2026-10-17)

A review of Phase 3 found eight latent problems. None affects a current client: they bite only once a custom product exists, and none does yet. **Nothing deployed; no product, fixture or sheet changed.** Each rule has its own case in the custom-product proof (`products:check`, check 3), and each case was seen to fail with its fix switched off.

**Commits:**
1. `bf981a8` (A, F) The server checks uploads, forms and editable content by step id against every product's steps (first id wins).
   - `defineCustomProduct` throws on a change to `hasUpload`, `hasEditableContent` or `formId` of an inherited step, and on `channels` on added or changed steps and tasks.
   - `products:check` integrity fails when one step id in two products disagrees on those fields, when a custom product's added id exists in another product, or when its `idPrefix` starts another product's ids (`bss-`).
2. `1c2ade5` (B, C) Base variant tweaks and a complete Differences section.
   - A base variant with portal tweaks (`bss-meta`) needs `variantPortal`: `"inherit"` keeps them, cut to the steps and stages kept, with each `portal` key set replacing that key; `"none"` leaves them out.
   - `CustomDerivation` now records what was inherited, owned and dropped, plus stage patches (old → new), role changes and dropped completion links. The sheet's Differences section lists them all, so "anything it doesn't list is the base variant's" is true.
3. `6b49ec9` (D) A new timeline also notes inherited team tasks due outside their stage's new days, and a String Theory plan that no longer matches ("Wording and dates to check", and `products:check` notes).
4. `b73f770` (E) Integrity fails if `lib/productMapping.ts` (GHL) can return a client type that isn't live. Today: `respond` and `meta-google`, both live.
5. `bded8f1` (G) Fin's form questions, upload steps and intro video are frozen only in `_global.json`. `check:journeys -- --write _global` now refuses to change them without `--yes-fin`. Noted in `CLAUDE.md` and README §7 and §9.
6. `e87bdfc` (H) `npm run products:check -- --compare <old> <new>` prints what moving a client between two client types changes. README §9 step 10 makes it part of moving a client.
7. This entry.

**Checks:** `tsc`, `check:fin`, `check:journeys` (618 renders, 413 markup renders, fixtures unchanged), `products:check` 6/6 and `check:team-auth` pass after every commit.

**Flagged, not fixed:** a stage patch can't set `teamOnly`, so re-adding the team-only `support` stage to a custom product would make it a client stage. No product does this.

### BSS custom: Fin's own product, as a draft (branch `team-board`, 2026-10-17)

The first real custom product. Jesse approved it ("go ahead matey"): Fin's side short, every granular team task behind it, automations on hold, drafts kept as drafts. **Fin stays on `bss-meta`.** Moving him is a separate prod change (README §9 step 10).

**What it is** (`products/bss-custom/`, blank base, status `draft`, version `2026-10-17.3`):
- **Spec:** `spec.md`, the BSS handover word for word, with the Stripe ids and billing city redacted (the original stays in the client folder).
- **Fin's side:** 21 client steps over 5 stages (Onboard, map and evaluate days 1-14; Build 8-28; Connect 29-35; Automate and launch 36-42; Partners, webinar and support 43 on, ongoing). Access, questions, content, approvals, calls and tests from spec §4 and the intake form in §5. **All wording is a draft** (`draftCopy` lists all 21).
- **Team side:** 337 tasks. One per row of every table in spec §3, one per message in §3.E, one per tag group, plus the workflow stop rules (D00) and three tasks §4 implies (`bssc-x-…`). 241 sit behind a client step; 96 are team-only by week. Notes keep the spec's columns word for word, with each item's status on 17 Oct. Out-of-scope items (B240, B703, D26, F14, G03, §3.H, §3.J) are listed in one task; the §3.K commitments sit in A22's notes.
- **Generated once** by `scripts/products/import-bss-spec.ts` (kept for provenance; from now on the task file is edited by hand).
- **Portal:** BSS Launchpad name, draft tagline, `groveaurora` (Fin's current look), String Theory with 8 strands. No intro video, voice guide or Ask-AI.

**Commits:**
1. `99bd6c3` the product, its sheet, the import script, `_global` re-saved (only the 21 new step ids, 5 review cards and 1 upload step were added).
2. `58e8ad2` the portal opens one step at a time, so each stage puts what Fin can do now first (access, then the website draft). The no-passwords rule became an Important box on both access steps.
3. `21734d3` button labels on the 14 steps that aren't approvals ("I've sent the invites", "Send my answers"…).
4. This entry.

**Checks after every commit:** `tsc`, `check:fin`, `check:journeys`, `products:check` 6/6, `check:team-auth`.

**Staging** (version `8ec598e2`): client "Demo — BSS custom" (`c49b7f60-…`). Its board started on create: all 337 tasks seeded in one batch (about 115 statements, no D1 limit hit). Portal 200 with the BSS Launchpad name and the new steps; no team notes and no RT Digital in the page. The same demo client exists locally (port 3334, `PRODUCT_DRAFTS=1` in the worktree's `.dev.vars`).

**Known, for Jesse:**
- 38 tasks the spec marks DONE start as To do on a new board (boards can't seed a status). Tick them when Fin's board starts, or ask for a "starts done" field.
- Tasks auto-assign only when one active member covers the role "Jesse Allan". Add yourself on the Team page with that role before Fin's board starts.
- `--compare bss-meta bss-custom`: none of Fin's 25 current steps carry over (new ids), and his current intro video would go.

**Update 2026-10-18 (Jesse's review):**
- The members' area test account moved from the first access step to the onboarding map step (week 8). Version `2026-10-18.1`.
- "Answer a few questions" is now **type or talk**. Fin chooses the guided form (`bss-custom-intake-v1` in `lib/onboardingForm.ts`: 15 questions, one per screen, a "Not sure yet" option on every choice) or a spoken interview (11 questions in the Scale interview's voice). Either one finishes the step, and he can switch at any time. Portal code: a step with both `formId` and `interview` shows the choice first; no other step has both, so `check:journeys` renders are unchanged. `_global` re-saved: only the new form was added. Version `2026-10-18.2`.
- Then the voice option was hidden (Jesse: he'll first rework the ElevenLabs prompt for a free-flowing conversation). The questions are saved as `bssCustomInterview` in `products/bss-custom/client-steps.ts`, and the clips stay in `public/portal/voice/`. Add `interview: bssCustomInterview` back to bring the choice back. Version `2026-10-18.3`.

### Ask Jesse: the client's help panel (branch `team-board`, 2026-10-18)

Jesse asked for a help widget in Fin's portal: ask a question (typed or spoken), get an answer that knows his project, or raise a support request. Plan in `~/.claude/plans/temporal-waddling-wave.md`. Jesse chose a reviewed knowledge pack (not a live Gmail/WhatsApp feed: those hold other clients, pricing and RT Digital), text plus speak-to-type for now, and requests as board tasks.

- **Data:** migration `0016_portal_assistant`, CREATE only (`portal_assistant_packs`, `portal_messages`).
- **Server:**
  - `lib/assistantStore.ts`;
  - portal routes `assistant` (GET history, POST question) and `assistant/requests`;
  - team routes `tasks/[taskId]/reply` and `clients/[id]/assistant`.
- **Model and limits:** `claude-opus-5-5` at low effort, with `fallbacks: "default"` (`@anthropic-ai/sdk` added). 30 questions an hour, 10 requests a day.
- **Portal:** `PortalAssistant.tsx`, shown only when the product sets `portal.features.assistant`. Only `bss-custom` (version `2026-10-18.4`) does, so every frozen journey is unchanged.
- **Board:**
  - support tasks get "Reply to the client";
  - the client board shows the client's chat under Activity;
  - `createCustomTask` takes a category, and `TeamActor.via` gains `"portal"`.
- **Pack:** Fin's draft is in the BSS client folder (`knowledge/fin-assistant-pack.md`), for Jesse's review. It's loaded by `scripts/assistant-pack.mjs`.
- **Verified locally** (phone and desktop):
  - the 404 for products without it;
  - the fallback answer without a key;
  - a request becoming a board task;
  - a team reply in the panel with the unread dot;
  - the rate limit at 30 an hour;
  - a non-support task refusing replies.
- **Not yet verified:** real answers. Staging and local have no `ANTHROPIC_API_KEY` (prod has one).

## Hand-off notes from the CSM session (2026-10-16)

Apply these during the conversion:

1. **RT Digital leaks into BSS Meta.**
   - `scl-104` is client-facing, with the title "Get RT Digital partner access to Meta Business Suite" and the portal title "Add RT Digital as a Partner in your Meta Business Suite".
   - `scl-107`'s internal title also names RT Digital.
   - Reword both when converting. Jesse wants no RT Digital anywhere for BSS.
2. **The service binding woke CSM.** While the portal had the BSS push code and the `CSM_DASHBOARD` binding, any BSS completion woke the CSM worker. That ran its cold-start migrations against its D1. Fixed: the push, the binding and the endpoints are all removed in 923917a (live once deployed).
3. **Task notes.** New CSM clients started with **blank** notes: `seedTemplateTasksForClient` drops template notes unless `useTemplateState` is set. The agreement guidance in `bssTasks.ts` and the "Merged SOP steps" in Scale and Respond only showed on demo clients. Decide on purpose whether product files show template notes to the team. Recommended: yes, as the task's guidance.
4. **BSS roles:** just "Jesse Allan" (plus Unassigned). The Scale and Respond team lists are in their files.
5. **Stale BSS wording:** rename the category "Intake & Kick-off" to "Intake" (bss-002 is retired).
6. **Never built in CSM:**
   - a Scale variant badge;
   - changing a Scale variant after a client is created;
   - a resync after a failed push;
   - removing "[warmly]"-style cues from jessetest's transcript.
7. **Gotchas:**
   - Cloudflare error 1042: worker-to-worker calls need a service binding.
   - A just-deployed change can look unapplied for a few seconds.
   - A client's identity is the portal id, not their name.

- 2026-10-17: Phase 3 (portal reads product files + custom-product tool + review fixes A-H) deployed to **staging** (version 8cb0762f, `PRODUCT_DRAFTS=1`). Every demo client portal, admin and board load (200); admin without the code is 403. Prod untouched.
- 2026-10-17: BSS custom (draft) deployed to **staging** (version 8ec598e2) with the "Demo — BSS custom" client; its board seeded 337 tasks. Prod untouched.
