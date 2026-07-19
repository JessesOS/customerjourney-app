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

## Current Status (as of 2026-07-12, late night)

Live in production with admin client management, **four client types, and two
products** — all sharing one rendering engine and one warm visual identity:

- **Products/types** (admin dropdown; `portal_clients.client_type`): Scale —
  Meta+Google / Meta only / Google only (channel-tagged tasks in
  `lib/onboardingJourney.ts`) and **Respond** (own template in
  `lib/respondJourney.ts`, 12 tasks, 4 stages, 10-day timeline, "respond"
  wordmark). Shared generic engine: `lib/journeyEngine.ts`;
  `lib/allJourneys.ts` = cross-product milestone union for API validation.
- **Content shipped today:** Scale onboarding at 10 tasks (SMS copy before app
  download; new "Log into your TradeAI CRM" task with steps card + login pill;
  GBP form field and ob-8 "Grant access" both **muted** via `hidden: true` —
  reasons in code comments). Booking embed (Google scheduler iframe, ob-2 +
  rsp-014, link `go.rt-d.com/jesse30`). Scribe guides on calendar/social/Meta
  partner tasks. Google Ads task collects Customer ID (required note). Full
  T&Cs in a scrollable frame on the form's final step (`lib/termsText.ts`).
  First walkthrough video live (`download-app-walkthrough.mp4`, ffmpeg'd
  27MB→5.4MB — Cloudflare caps assets at 25MB).
- **Milestone feature flags** (all in the templates): `hidden`, `channels`,
  `steps`, `important`, `guideUrl/Label`, `bookingUrl`, `notePlaceholder` +
  `noteRequired` (gates approve), `showPortalLink` (copy-link card),
  `awaitingTeam` (exists, none tagged yet).

Outstanding work:
1. Remaining walkthrough `.mp4`s: `connect-accounts-`, `meta-partner-access-`
   (drop in `public/portal/`, compress under 25MB, deploy).
2. Respond: 1–2 extra tasks Jesse may add; per-task guides/videos.
3. Stages 4, 5 CSM content depth; `awaitingTeam` tagging.
4. Automation/notification wiring (post-MVP). PWA install layer (discussed,
   agreed as the mobile path — not started).
5. Cleanup: assorted test clients in production admin (Jesse deletes as he goes).

## Completed: UI/UX overhaul (shipped 2026-07-12)

Redesigned the client portal from a dark cinematic layout to a **warm, editorial direction**
(reference: attn:os) with far clearer task orientation. Content and tasking unchanged; this was
visual/UX + structure only. Validated via mockups first, then built in 7 phases behind an
approved plan. Live on production.

- **Direction:** cream ground, white cards, terracotta = the one action colour, sage = done,
  plum = "with us". Type ended up **Hanken Grotesk** throughout (headings heavier) — the doc
  previously said Fraunces, which was dropped during the build. Namespaced
  `--pj-*` tokens in `globals.css` (single-theme by design; never collide with the dark
  strategy-room tokens).
- **Structure:** persistent left **stage rail** (all 5 stages always visible) + focused content
  pane; **one-thing-per-page** task view; four-status vocabulary (Done / Your turn / With us /
  Up next / Locked); **stage-completion payoff screen** with next-stage preview. Retired the
  cinematic welcome-video intro (video still on-demand via the walkthrough button). Responsive:
  rail collapses to a segmented stage bar under 820px. Layout centred (1180px) on wide screens.
- **Key files:** `app/components/portal/` — `ClientPortalExperience.tsx` (home + task +
  complete views), `StageRail.tsx`, `TaskRow.tsx`, `StatusChip.tsx`, `UpNextCard.tsx`,
  `StageCompleteView.tsx`, `PortalButton.tsx`, `OnboardingFormStepper.tsx` (reskinned).
  `lib/onboardingJourney.ts` gained the `awaitingTeam` flag.

**Lesson worth keeping:** `npm run build` (vinext) passes even with runtime `ReferenceError`s —
it only does static analysis. Always load `/portal/demo` on the running server after a change;
a green build is not proof the page renders.

## Completed: Organic reskin (2026-07-19)

Token-level visual reskin from a Claude Design handoff (design-system project "Organic",
handoff bundle preserved in `design/`). **Zero UX/flow/markup/API changes** — values only:

- **Tokens** (`globals.css --pj-*`): warmer sand ground `#f5ead8`, off-white cards `#f9f4ed`,
  action clay→terracotta `#c67139`, status inks deepened to 700-steps (done `#56633f`,
  with-us plum `#7d5468` OKLCH-derived, up next `#a19786`), fills to 200-steps.
- **Type:** Hanken Grotesk → **Figtree** (both heading/body slots, headings heavier);
  IBM Plex Mono unchanged (chips/kickers — deliberate portal signature).
- **Inline hardcodes** updated to match in TaskRow, StageRail, UpNextCard,
  StageCompleteView, ClientPortalExperience (incl. two act-orange rgba stragglers the
  handoff table missed). PlayIcon defaults now token-based.
- **Walkthrough video modal** warmed to match (was the last dark/gold surface): card
  surface on warm-ink scrim per Organic's dialog pattern. Dead dark-theme consts
  (`teal`/`gold`/`ink`/`text`) removed from ClientPortalExperience.
- **Design round-trip that worked:** components pushed to the Claude Design project as
  static previews (`code-build/` in the DS project + `design/code-build/` here); Design
  returned `design_handoff_portal_reskin.zip` (token delta + restyled previews) — kept
  under `design/`. Note: the Design chat's uploads and the DS project file store are
  **separate** — files must be attached into the chat, sync only reaches the project store.

**Bold pass (same day, after Jesse shared his reference set directly):** the token handoff
alone read as near-identical, so a second pass built from the references (attn:os serif
editorial, AgentOS soft-3D clay, winding journey-map path): headings → **Fraunces**
(display serif; Figtree stays body), new clay-3D tokens in `globals.css`
(`--pj-glow`, `--pj-card-grad`, `--pj-shadow-card`, `--pj-btn-grad`, `--pj-shadow-btn`),
warm radial glow ground, extruded primary buttons, dotted journey path in the StageRail,
and the stage task list collapsed to a status-dot summary bar (expand on click; hero card
is the page's one large object). Welcome video (`welcome-to-scale.mp4`) fully removed —
button + asset; per-task videos unchanged.

## Historical note

An earlier phase of this project deployed via OpenAI Codex Sites (`.openai/hosting.json` is a
leftover of that). That path is superseded — deploys go straight to Cloudflare via wrangler now.
