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

Not started.

### Phase 2: team board on staging (branch `team-board`)

Not started.

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
