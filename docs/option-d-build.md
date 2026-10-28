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

### Home-screen app for BSS custom (2026-10-18)

Saved to an iPhone's home screen (Safari: Share, Add to Home Screen), Fin's portal now opens full screen with a "BSS" icon.

- **Draft icon:** a white "BSS" on vault-ink, with a purple and BSS-orange glow (`public/portal/icons/bss-launchpad-{180,192,512}.png`).
- **Product setting:** `portal.features.appIcon`. `products:check` fails if an icon file is missing.
- **The page head** gets the icons, the Apple full-screen tags and a per-client manifest (`/api/portal/<token>/manifest`, which opens that client's own link).
- **Scope:** only `bss-custom` (version `2026-10-18.5`). Other products' pages are unchanged; `check:journeys` and a curl of the Scale demo confirm it.

### Customer journey map on "Approve your customer journey" (2026-10-18)

Jesse asked for the three journeys, laid out visually, on Fin's journey approval step, with notes. Built from Fin's brief v6 (sections 7 to 11), his Loom, his email list of 14 Oct, and the spec's workflows and messages.

- **Content** (`products/bss-custom/journey-map.ts`, draft for Jesse):
  - three journeys:
    1. Book a Clarity Call, the main one, covering organic and referral leads;
    2. the weekly webinar;
    3. new client onboarding;
  - "also running" flows and the rules every message follows;
  - 12 items marked "To confirm", each saying where Fin answers it.
- **Display** (`JourneyMap.tsx`): an overview diagram, a flowing line per journey, timelines with a moving marker, branches and "To confirm" boxes. It works on phone and desktop, with reduced motion respected.
- **Notes:** a box per journey, plus "Also running" and "Anything else". They save as he types (hidden form `bss-journey-map-notes-v1`) and travel with his approval to the board.
- **Step changes:**
  - "Approve your customer journey" is now just the map.
  - Findings and the partner plan moved to "Approve your CRM plan and our findings" (they need his systems first), along with their 7 team tasks (A16, A19, A20, A21, B232, B604, C101).
- **Product setting:** `portal.journeyMap`, checked by `products:check`. Version `2026-10-18.12`. Frozen journeys are unchanged; `_global` lost one review card (the journey step).

### Files step takes real files; Meta access dropped for now (2026-10-18)

- **"Send the files for your website"** now takes photos, logos, PDFs, documents, short videos and zips.
  - Several files at once, up to 50.
  - A box for pasting the privacy policy wording.
  - Next is always there, so Fin can carry on without everything.
  - The box stays open after he ticks it, so he can add more later.
- **How:**
  - A step setting, `uploadOptions` (`lib/journeyTypes.ts`).
  - The upload route takes multipart files into R2 (25MB each).
  - Admin downloads come back as the real file type.
  - Steps without it (Scale's CSV lead list) are unchanged; `check:journeys` renders are identical.
- **"Give Jesse access to your other tools"** no longer asks for Meta (Jesse: not for now). Fin's Ask Jesse pack says the same.
- Version `2026-10-18.13`.

### "Send us your contact lists" (2026-10-18)

A new weeks 1-2 step after "Give Jesse access to your other tools".
- **What Fin uploads:** his GoHighLevel export, the list from the app he built, and any other lists. Each is its own CSV or Excel file, so it keeps its source; we combine them and remove duplicates.
- **How the step works:** how-tos for each export, a privacy note, a "which list is which" box, and Next always available. The box stays open afterwards.
- **Board:** team task C901 (export existing contacts) moved behind the step.
- **Uploads** now also take `.xlsx` and `.xls`.
- Version `2026-10-18.14`.

### 30-day journey; Ask Jesse hidden (2026-10-18)

- **Timeline:** compressed from 6 weeks to launch (week 10 for partners) to 30 days.

  | Stage | Days |
  |---|---|
  | Onboard, map and evaluate | 1-7 |
  | Build | 4-16 |
  | Connect | 17-20 |
  | Automate and launch | 21-23 |
  | Partners, webinar and support | 24-30, then support to month 8 |

- **Task dates:** all 321 dated team tasks re-dated with the same proportional map; month-based support starts after day 30.
- **Wording:** stage blurbs no longer quote weeks, and the journey map no longer mentions weeks 7 or 8.
- **String Theory:** 5 weeks, go-live on day 23.
- **Agreement mismatch:** the signed agreement still says about 6 weeks to launch and about 10 weeks for partners. The portal now promises faster.
- **Ask Jesse:** hidden for BSS custom (`features.assistant` removed). The code, routes and Fin's pack stay; the pack still describes the old weeks, so update it before switching the panel back on.
- **Existing boards don't change:** boards already started on staging keep their old dates. A board started from now on gets the new ones.
- Version `2026-10-18.15`.

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

## Fin's holding page (2026-10-18, live)

Jesse asked for Fin's old link to say a new version is coming, while his custom product (`bss-custom`, branch `team-board`) is reviewed.

- `79ff499`: a client whose `journey_state` is `paused` sees "A new version is on its way" (with their first name and brand) instead of their portal. It still records the visit. Active clients are unchanged. The copy is written for Fin ("ready by Sunday night, and this same link will open it").
- Deployed with Jesse's OK: version `669af5da` (was `b9498d0f`). tsc and check:fin passed; the demo portal and Fin's normal portal returned 200 by curl before the data change.
- Data change: Fin's record set to `paused` (1 row). D1 bookmark before it: `00000172-00000000-00005107-c818293b1d9e95aca8dd009cf5d53eed`. By curl, his link now returns the notice. He had opened his link once (17 Oct) and done nothing in it.
- Undo: set his `journey_state` back to `active` (no deploy). Code rollback: `npx wrangler rollback b9498d0f-2f28-4749-a4f0-5daeecf9d251 --name scale-onboarding-portal`.
- ~~**Next:** merge `main` into `team-board` before that branch goes live, so it keeps this page.~~ Done (4180cf6). The page stays in the code for any paused client.

## Fin goes live on BSS custom (2026-10-18, live)

Jesse approved the go-live package ("I'm ready for you to deploy"), plus switching the test client "testfin" too.

**What changed on prod, in order:**
1. D1 bookmark before any change (04:25Z): `00000177-00000000-00005108-fd337082ad04694c228f9fec0c0b52a8`.
2. Migrations 0015 (team board) and 0016 (Ask Jesse), CREATE only: 6 new tables, all empty. No `portal_*` table touched; still 3 clients.
3. Code: `main` fast-forwarded to `team-board` (f4ce0df, 43 commits), deployed as version `384aadb0-e29d-41ed-b9dd-6ec51442367c` (was `669af5da`). `motion-redesign` fast-forwarded too. All three branches are at f4ce0df.
4. Fin's record (04:27:24Z): `bss-meta`, `paused` became `bss-custom`, `active` (1 row). Same link, start date unchanged (19 Oct).
5. "testfin" (04:28:04Z): renamed "Jesse test fin", switched to `bss-custom`, start date set to 19 Oct to match Fin's (1 row).

**Checks before deploying:** tsc, check:fin, check:journeys (8 client types, 699 renders, 472 markup renders), products:check 6/6, check:team-auth. All passed twice: on team-board in the worktree, then on `main` in the main checkout. The three bss-custom portals on staging returned 200. The prod config had no vars (so `TEAM_BOARD`, `TEAM_BOARD_AUTOSEED` and `PRODUCT_DRAFTS` are off), the prod D1, and the prod R2 bucket.

**Verified by curl** (no browser, so no visits recorded for Fin):
- Before the data change: Fin's link still showed the holding page. testfin, JAT, `/portal/demo` and the new icon and phone image returned 200. Admin APIs returned 403 without the code; team APIs returned 404 (flag off).
- After: Fin's link shows the BSS Launchpad portal, with "Bookmark your portal" first and "Day 1 / 30 · on track" (start date tomorrow, no negative days). It has the app icon tags and his own manifest. There's no holding page, no Ask Jesse, no $200 popup and no RT Digital. "Jesse test fin" shows the same. JAT (bss-meta) is unchanged.

**Facts for later:**
- Fin's old bss-meta ticks don't carry over, because the step ids differ. He had done nothing in it.
- His last recorded open is 2026-10-17 23:26Z, two minutes after the holding page went live. It was a real browser, probably Jesse's check, since visits are recorded by the page's script and curl doesn't run it.
- Dates: day 1 is 19 Oct, launch (day 23) is 10 Nov, day 30 is 17 Nov. The signed agreement still says about 6 weeks to launch and about 10 for partners.

**Undo, in this order** (the old code doesn't know bss-custom, so the data goes back first):
1. Put Fin back: `UPDATE portal_clients SET client_type = 'bss-meta', journey_state = 'paused', updated_at = CURRENT_TIMESTAMP WHERE portal_token = '<Fin's token>' AND client_type = 'bss-custom'`. Do the same for "Jesse test fin" (`bss-meta`, `active`).
2. Roll back the code: `npx wrangler rollback 669af5da-d012-491a-ab0f-1106d3e08bd3 --name scale-onboarding-portal`.
3. Only if the database itself is wrong: `npx wrangler d1 time-travel restore scale-onboarding-portal-prod --bookmark=00000177-00000000-00005108-fd337082ad04694c228f9fec0c0b52a8`. This also removes the 6 empty tables and loses anything Fin did since.

**Next:**
- Jesse sends Fin his link with `?welcome=1` on the end (his browser already saw the old welcome).
- ~~Extend the `--yes-fin` guard to cover `bss-custom` and its forms in `_global`.~~ Done the same day (see below).
- Team board on prod: Access on a team hostname, the allconvos.ai DNS move, then `TEAM_BOARD`.
- Ask Jesse: update Fin's pack to the 30-day timeline before switching the panel back on. Alerts by email or WhatsApp, not Slack.
- Retire `bss-meta` (JAT is the last client on it). Tidy the staging demos ("Demo — BSS custom", "Fin Rehearsal").

## The `--yes-fin` guard covers bss-custom (2026-10-18)

Jesse asked for it after the go-live. These are check scripts only: no deploy and no prod data.

- **One list of Fin's types:** `FIN_TYPES` in `scripts/journeys/run.ts`, holding `bss-custom` (live) and `bss-meta` (his rollback, guarded until it's retired).
  - Re-saving either fixture needs `--yes-fin`.
  - So does re-saving `_global` when it would change either type's form questions, upload steps, editable steps, intro video or acceptance.
  - The refusal rule is one pure function, `fixtureWriteRefusal`, used by both the CLI and `writeFixtures`. The test can call it without any chance of writing a fixture.
- **`products:check` (check 3, section G)** proves every refusal for both types, and that `--yes-fin` allows each one. Changes outside Fin's types (Respond's form, the respond fixture) still need no flag. The list itself is pinned, so dropping a type can't quietly drop its proofs.
- **Checked by breaking it on purpose** (temporary edits, restored byte for byte):
  - the `_global` guard skipping bss-custom gave 4 failures (form, upload, editable step, acceptance);
  - the fixture guard removed gave 2 failures;
  - bss-custom dropped from the list was caught by the pin.
- **The real commands:**
  - `check:journeys -- --write bss-custom` and `--write bss-meta` are refused;
  - `--write _global`, with Fin's first intake question temporarily reworded, is refused and names the question.
  - No fixture was written.
- **Still not frozen by check:journeys:**
  - the journey map's wording and the app icon (only the version lock covers them);
  - the journey map notes form (`bss-journey-map-notes-v1`), which nothing freezes.
  - Closing this means adding them to the frozen contract, then one re-save of every fixture, which needs Jesse's OK.

## Team board live in prod (2026-10-18)

Jesse approved the package ("go for it"). **Decision:** no Cloudflare Access or per-person logins yet, because he's the only team member. The board runs on his access code, which counts as `OWNER_EMAIL` (jesse@allconvos.ai). Autoseed stays off until the Scale and Respond task lists are tidied, so new boards don't copy stale LaunchBay tasks.

**In order:**
1. Restore point before any change (05:29Z): `0000017a-00000004-00005108-58ba49c5d0f39f8416075d6a40346d37`.
2. Jesse added as the only team member (`team_members`: jesse@allconvos.ai, admin, role "Jesse Allan"). This came before any board, so their tasks are assigned to him.
3. `43dc849` (prod vars `TEAM_BOARD=1`, `OWNER_EMAIL`) deployed as version `f40cdad5-c6af-4e24-8c70-cff94a29e67f` (was `384aadb0`). tsc and check:fin passed in the main checkout. All five checks had passed on the same commit in the worktree.
4. Jesse started the boards: "Jesse test fin" (05:32Z) and Fin (05:39Z). Each has 337 tasks at bss-custom `2026-10-18.17`, all assigned to him, with him recorded as starter. That proves the access code maps to `OWNER_EMAIL`.
5. Restore point `0000017a-00000010-00005108-eb3dfd9c737a7ffd859624482cf9dbd5`, then Fin's 38 tasks marked done. Those are the ones whose spec notes say "Status on 17 Oct: DONE":
   - 4 onboarding/admin (payment 1, subscription end, welcome email, portal link);
   - 11 website global items;
   - 21 website pages;
   - 1 asset and 1 hosting item.

   Each got a history line "Done before the board started (from the spec)". Result: 38 done and 299 to do. The test board is untouched.

**Rehearsed first, locally, on a throwaway client** (since removed):
- one member, so all 337 tasks were assigned to him;
- the board read "Team tasks 38 / 337";
- running the mark-done SQL twice changed nothing.

**Verified by curl after the deploy:**
- Fin's, Jesse test fin's and JAT's links are unchanged, and `/portal/demo` returns 200.
- The team APIs now return 403 without the code (they returned 404 while the board was off).
- `/admin/board` and `/admin/my-tasks` return 200.

**Undo:** `npx wrangler rollback 384aadb0-e29d-41ed-b9dd-6ec51442367c --name scale-onboarding-portal` switches the board off. The board's data sits unused in its own tables. Fin's portal isn't touched either way.

## 2026-10-25: AT Network live (version 558906f3)

AT Network (Rich Latimer, Martyn Hume Cobbe) went live on prod on 2026-10-25 with Jesse's OK, after a full walkthrough on staging the same day. Branch `at-network` merged into `main` at a92f953; `motion-redesign` and `team-board` fast-forwarded to it.

- **Product `at-network`:** five stages (Sign and start, What we need from you, Website build, Funnel and ads, Final review and handover), 26 client steps, 40-odd team tasks, the Scope and Map (two tracks and a collapsed Phase 2 list), agreement v1 of 25 Oct (the text of agreements.allconvos.ai/at-network, word for word, entity AT Network Pty Ltd), the kickoff booking page (Google Calendar on jesse@allconvos.ai), Martyn's StarMap link, input steps aligned to the agreement's A4 list. Spec: `products/at-network/spec.md`.
- **New shared features, off unless a product sets them:** `features.comms` (Messages: step threads, Approval and Change request kinds, team statuses, overdue flag, CSV/HTML export; tables `portal_comms`, `portal_comms_seen`, migration 0017), `portal.agreement` (signed acceptance as an append-only record with the exact text and SHA-256, printable copy, team-recorded acceptances; table `portal_acceptances`, migration 0018), `features.approvalSteps`, `MilestoneTemplate.pendingContentText`, `JourneyMapJourney.collapsed`, email alerts through Resend (`lib/email.ts`, `lib/alerts.ts`; `EMAIL_API_KEY` secret per environment). Fin's `bss-custom` fixture and `check:fin` are unchanged.
- **Prod:** migrations 0017 and 0018 applied (CREATE only) before the deploy. Previous live version f40cdad5; D1 bookmark before the change `000001ae-00000000-0000510f-16aff70c59cc294b052d4a9239b6724c`. Verified by curl: Fin's portal and "Jesse test fin" return 200 with "BSS Launchpad" and none of the new markup; admin loads.
- **After go-live (Jesse):** create "AT Network" in prod admin with Rich's start date, Start board, record the signed acceptance in the Agreement section, set `EMAIL_API_KEY` on prod (dry-run until then).
- **Plan and status:** `docs/at-network-communications-plan.md`. Playbook: `docs/new-client-product-playbook.md`.

**2026-10-25 (later): agreement v1.1 on prod (version aa5a8859).** Jesse updated the agreement page: late content no longer pauses the timeline (A4, new "Content that isn't ready", A5, B6); handover includes a page template and guide (B7). Portal agreement id `v1.1-2026-10-25`; three portal lines aligned. No acceptances existed. Previous live 45b703fc (the email-key secret change on top of 558906f3); D1 bookmark `000001b0-00000004-0000510f-ee66da32b6ea779c20cb7cf35e256734`. Verified by curl: Rich's portal serves v1.1 with 0 acceptances and is still unopened; Fin's portal unchanged.

**2026-10-27: agreement Version 2 on prod (version 14c629c8).** Rich Latimer signed Version 2 of 26 October on agreements.allconvos.ai on 27 Oct 3:39 pm Sydney (PDF in Jesse's Downloads; page fingerprint 6cfd4c4e…). Launchpad now holds that text word for word (`v2-2026-10-26`, 0 word differences against the PDF). Portal aligned: the two-minute impact-video cut-down and the matching podcast outro are in Phase 1 (map, stinger step, tasks t18, t34, new t45). Fix: team-recorded acceptances always store the product's fixed entity; the admin date field reads local time. Previous live aa5a8859; D1 bookmark `000001b3-00000000-00005111-27f5c58dd5f550c798f7ea90a923f243`. Verified by curl: Rich's portal serves Version 2 with 0 acceptances and is still unopened; Fin's portal unchanged. Next: Jesse records Rich's signature in admin.

**2026-10-27 (later): signing page on prod (version 95c3ab18).** Clients sign on Launchpad's own page (`/sign/<client id>/<code>`, link and Copy button in the board's Agreement section) before getting their portal. Accept records the signature (real IP, position, exact text), ticks step 1, emails the signer a copy (cc `agreement.copyTo`) and alerts Jesse through Resend. Replaces the per-client Vercel agreement pages for future clients; AT Network's signed text and its Vercel page are unchanged. Admin form fields made visible. Previous live 14c629c8; D1 bookmark `000001b7-00000000-00005111-8f1f4038437cc0fe5087b965ca31d835`. Verified by curl: Rich's portal 200 with his v2 acceptance, still unopened; a wrong signing link 404s; Fin's portal shows BSS Launchpad and none of the new markup (`check:fin` passes; the page is 85 bytes larger from new build file names).

**2026-10-28: AT Network update on prod (version 3151ff30).** Foundations VSL (confirmation tick, original files, networking footage, locked edit, one-round review, board tasks, map item); nothing client-facing mentions the two-minute cut (the signed v2 text still does); save-to-phone step optional ("Skip for now": new `optional` flag); Scope and Map trims, Phase 2 in its own block, "We build" tag (`whoLabels`), Home wording, one free month, no ads on Home; signer helper line on the accept form; holding texts now reach the portal (journeyBuild copies `pendingContentText` and `optional`); team email sender (`/send-email`). Previous live 95c3ab18; D1 bookmark `000001bc-00000000-00005112-e31bce6d9a220a281c1df13703a7a503`; no migration. Verified by curl: Rich's portal serves all of it, still unopened, signature intact; Fin's portal unchanged (BSS Launchpad, no AT markup; the "We build" match is his own copy). Handover: `docs/handover-at-network-2026-10-28.md`.

**2026-10-28 (later): AT Network batch on prod (version 61f1ff29), from fa69ad3.** Scope and Map: Homepage wording, plain orange blocks, no Under the hood or draft banner, one cold ad per audience, who decides ad destinations, landing pages A and B (credit card), grouped homepage link pills. Ask Jesse off; Messages is the one place. Approvals only on work sign-offs (site, funnel, final review). Kickoff summary is a confirmation ("That's right"). Simpler Messages panel (no pickers or tabs; name asked once; change request is a link). Previous live 3151ff30; D1 bookmark `000001be-00000000-00005112-d336b28726fcb96c46d938432128e685`; no migration. Verified by curl: Rich's portal serves it, still unopened, v2 signature intact; Fin's portal unchanged (BSS Launchpad, no Messages markup).

**2026-10-28 (evening): AT Network batch on prod (version 8d954469), from 6b6899f.** Academy step names Ben's levels document as received. Removed steps atn-vsl-edit (Jesse edits the Foundations VSL and splices in footage they send) and atn-starmap-link (the StarMap links from the homepage, as on the Scope and Map); tasks atn-t51 removed, atn-t49 and atn-t20 reworded. Sales video scripts step: the four levels in bold (new StepLine: a leading **Name** in a steps line shows bold; no other product uses it), 60 seconds max. Version 2026-10-28.29. Previous live 61f1ff29; D1 bookmark `000001c0-00000000-00005112-8367d531a5fc05a71048b516348d506c`; no migration. Verified by curl: Rich's portal serves it, still unopened, v2 signature intact; Fin's portal unchanged. Outside the portal: the kickoff booking page (Google appointment schedule) now offers one morning and one afternoon window per weekday, 36 hours' notice, 30 days ahead.

**2026-10-28 (late): AT Network levels diagram on prod (version f034e017), from e0cbd42.** `public/portal/at-network/levels.svg` on "Confirm your product package breakdown" (imageUrl), client wording softened from the internal note. Version 2026-10-28.30. Previous live 8d954469; D1 bookmark `000001c1-00000000-00005112-ea656a7502e80f20251947eb896e8717`; no migration. Verified by curl: the image serves, Rich's portal references it, still unopened, v2 signature intact; Fin's portal unchanged.
