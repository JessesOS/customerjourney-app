# Building a client product: order of work and traps

Written 2026-10-21, from Fin's `bss-custom` build. Read this first when a new client needs their own portal. The mechanics of a custom product are in `docs/products/README.md` (sections 7 and 9). This page is the order of work and what went wrong or nearly did.

## Before you build

- **The client's own session writes the handover** (one page: client, product name, steps in order, team tasks behind them, due dates for the client's inputs, approvals, payment points, the communication rule, the first message). You read the file. You don't build on guesses. List any open points back to Jesse before writing wording.
- **Wording:** plain, short sentences. Nothing mentions RT Digital. The client-facing brand is allconvos.ai. Keep prices and contract terms out of portal wording (they live in the contract), unless Jesse says otherwise. Flag copy you draft with `draftCopy`.
- **A new client is a new product and a new client type.** Nothing of Fin's may change. The checks prove it.

## Order of work

1. Save the handover word for word as `products/<id>/spec.md` (`products:check` fails without it).
2. Create `products/<id>/`: `index.ts` (`defineCustomProduct`, `base: "blank"`, `idPrefix`, stages, `totalDays`, portal settings), `client-steps.ts`, `team-tasks.ts`, and `journey-map.ts` if wanted. Start with `status: "draft"`. Drafts show only locally (`PRODUCT_DRAFTS=1` in `.dev.vars`) and on staging, never on prod.
3. After every change: bump `version`, then run `npm run products:lock`, `products:render`, `products:check`, `check:journeys`, `check:fin`, `check:team-auth` and `npx tsc --noEmit`. An edit without a version bump fails.
4. Preview locally with the "dev" or "team-board" configurations in `.claude/launch.json`. A fresh local database has no tables: apply `drizzle/*.sql` with `sqlite3` to the file under `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`.
5. Staging: `npm run build && node scripts/patch-wrangler.mjs --env staging && npx wrangler deploy --config dist/server/wrangler.staging.json`. Create a "Demo — <client>" client in staging admin, and have Jesse review it. Staging's admin code is in the git-ignored `.env.staging.local`: never print it.
6. **Go live, with Jesse's explicit OK, as a package:** the commits, the checks run, the live version (`npx wrangler deployments list --name scale-onboarding-portal`), a D1 bookmark (`npx wrangler d1 time-travel info scale-onboarding-portal-prod`) and the rollback command. In this order: flip `status` to `"live"` and bump the version, add the client type to `CLIENT_TYPES` in `scripts/journeys/contract.ts`, save its fixture with `npm run check:journeys -- --write <type> _global`, then apply any prod migration (CREATE only), then build, patch and deploy. Jesse creates the client in prod admin. Verify by `curl`. Never open a client's link in a normal browser: it records a visit as theirs.
7. After go-live: Jesse clicks **Start board** on the client. Tick tasks that were already done. Record it in `docs/option-d-build.md`, add a line to `CLAUDE.md`, save a memory note, and push `main`, `motion-redesign` and `team-board` at one commit.

## Traps from Fin's build

- **Steps open one at a time**, in order. Plan the order, and give each step a `doneLabel` when "Done" reads oddly.
- **The welcome screen shows once per browser per link.** Share the link with `?welcome=1` to show it again.
- **Uploads:** `uploadOptions` takes any files, optional, with `stayOpen` to keep the step open after Next. Limits: 25MB per file, 50 files per step. `.mp4` and `.mov` are accepted, but most videos are bigger than 25MB, so ask for links (YouTube, Drive, Dropbox).
- **Welcome video:** `portal.introVideo` (`src` under `/api/media/`, `poster`, `title`). The mp4 must be in R2 and listed through the product (`mediaAllowlist` in `lib/productRegistry.ts`). Test on staging first. Steps can also carry `embedUrl`, `videoUrl` and `guideUrl`.
- **Not frozen by `check:journeys`:** the journey map wording and the app icon (only the version lock covers them) and the journey map notes form. Changing those on a live client is a change to their live portal: Jesse's OK first.
- **App icon:** `features.appIcon` needs `public/portal/icons/<name>-180.png`, `-192.png` and `-512.png`.
- **Ask Jesse** (`features.assistant`) is a help panel whose "Send a request" becomes a task on the client's board. Alerts go only to Slack, and Jesse has no Slack. It was hidden for Fin.
- **Typed-name approvals** (approve by typing a full name, stored with the time) aren't built. It's a small build if Jesse wants it.
- **Admin counts:** a client who changes product shows odd counts such as "25 of 23", because old ticks stay in the database. It's cosmetic.
- **Fin's guard:** never re-save a Fin fixture without `--yes-fin` and Jesse's OK.
- **Prod reads:** `npx wrangler d1 execute scale-onboarding-portal-prod --remote --json --command "SELECT ..."`. Read only unless Jesse has approved the change. Python `urllib` needs a user-agent header against the staging worker.
- **Gmail drafts** made through the connector get their links rewritten as Google redirects. Don't edit Jesse's drafts from this session: give him the text.
- **Commits:** explicit file paths, never `git add -A`. Write the message to a file and use `git commit -F`. End with the co-author line the session gives you.
- **Times:** Jesse's Mac clock looks an hour ahead of Brisbane (UTC+11). Say "your clock" or give UTC.

## Signing the agreement (from 2026-10-27)

The client signs on Launchpad's own signing page, not a separate site. On the client's board, Agreement section, copy the **signing link** (`/sign/<client id>/<code>`) and send it before the portal link. It shows the product's agreement (`portal.agreement`) with name, position, email and a tick; the entity is fixed. Pressing Accept records the signature (with the real IP and the exact text), ticks step 1, and emails the signer a copy with a print or save link (copied to `agreement.copyTo`, e.g. the client's accounts inbox) and alerts Jesse. Nothing to do in admin. "Record a signature made elsewhere" stays for a client who signed some other way.

**Wording for B14 in the next client's agreement** (AT Network's signed Version 2 keeps its own wording):

> You accept this agreement on behalf of your company on the signing page: tick the box, type your full name, position and email, and press Accept. That is your electronic signature. We record your name, position, email, the date and time, your IP address, this version and the exact text, and email you a copy straight away, which you can print or save as a PDF. A later version applies only once you accept it the same way.

Test each new client's signing link on staging first, with a demo client and your own email.
