# Product files: how they work

Each product is defined **once**, as a folder in `products/`. That folder holds everything about it: the client's steps, the team's tasks behind them, the timeline and the portal settings. The client portal, the admin and the team board all read it. Nothing is synced.

Change a product by asking Claude. The sheets in this folder (`scale.md`, `respond.md`, …) are generated from the files, so they always say what the files say.

## 1. What a product file holds

A product is a folder, `products/<id>/`. Its `index.ts` exports the product (`products/scale/index.ts` exports `scale`).

| Part | What it is |
|---|---|
| `id`, `name`, `version`, `status` | Who it is, which version (`YYYY-MM-DD.N`), and whether new clients can start on it. |
| `totalDays` | Days to go-live, shown in the portal header ("Day 4 / 30"). |
| `stages` | In journey order. Each stage has its days, its blurb, its status notes and its **client steps**: exactly what the client sees and does. A team-only stage never reaches the portal. |
| `teamTasks` | The work behind the steps. Each task names its stage, the step it sits behind (or none, for team-only work), its role, due window and the tasks to finish first. |
| `roles` | Who a task can be given to. |
| `portal` | Product-level portal settings: the name the client sees (`wordmark`), the voice guide, the Ask-AI answers and the step features. See §6. |
| `variants` | The client types that run on the product (for Scale: Meta, Google, Meta + Google, BSS Meta ads only). Each has its label, its ad channels and its own portal tweaks. |
| `source` | Where it came from. |

Today's products: **Scale** (live), **Respond** (live, shown to clients as "CRM"), **BSS Launchpad** (the custom 41-step journey, paused) and the **Website add-on** (draft, team tasks only).

## 2. Commands

| Command | What it does |
|---|---|
| `npm run products:render` | Writes `products/index.ts` (the list of product folders), then every sheet in `docs/products/`. A new folder is registered here. |
| `npm run products:lock` | Records each product's version and content hash in `products/versions.lock.json`. Refuses a changed product whose version wasn't bumped. |
| `npm run products:check` | All product checks (integrity, code boundaries, version lock, sheets and index; see the header of `scripts/products/check.ts`). |
| `npm run check:journeys` | Proves no client type's portal changed (§7). |
| `npm run check:fin` | Proves Fin's portal (`bss-meta`) is unchanged. |

After **any** product change: bump `version`, then run `products:lock`, `products:render`, `products:check`, `check:journeys` and `check:fin`.

## 3. How the portal reads it

- `lib/productRegistry.ts` is the one place the app asks "what does this client type get?". It reads the product files and answers with plain data.
- For the portal that answer is a **`PortalJourney`** (`lib/journeyTypes.ts`): the visible steps by stage (with the variant's wording applied), the days, the name and look, the per-step tweaks, the voice guide, Ask-AI and String Theory. The portal page builds it on the server and passes it to the portal component as a prop.
- **Client components never import `products/`.** Team tasks hold internal notes and staff names, and must never be bundled for a browser. `products:check` ("code boundaries") fails if a `"use client"` file reaches `products/`, the registry or other server-only code.
- The admin gets its labels, days, locks and checklists from the server too (`/api/admin/portal-clients`).
- `lib/journeyEngine.ts`, `lib/onboardingJourney.ts`, `lib/stageGuide.ts`, `lib/askAi.ts` and `lib/stringPlans.ts` are thin compatibility files for `check:fin` only. Never put journey data there, and never import them from app code.

## 4. Statuses

| | live | paused | draft |
|---|---|---|---|
| Admin dropdown (new clients) | offered (unless the variant says `offered: false`) | never offered | offered only where `PRODUCT_DRAFTS=1` (staging) |
| Admin API (create, change type) | accepted | accepted (existing clients keep it) | accepted only where `PRODUCT_DRAFTS=1` |
| Portal | renders | renders: existing clients keep it exactly as it was | renders |
| Team board | starts | never starts ("… is paused.") | starts only where `PRODUCT_DRAFTS=1` |
| GHL provisioning | only Scale and Respond, by name (`lib/productMapping.ts`) | never | never |

Prod leaves `PRODUCT_DRAFTS` unset, so a draft never reaches a real client.

## 5. Variants and client types

- A **client type** (`meta`, `google`, `meta-google`, `bss-meta`, `respond`, `bss`) is stored on every client (`portal_clients.client_type`). It is a variant's `clientType`, and the variant's `id` is the same.
- Client types are **stable**: never rename one, never reuse one. Existing clients would silently move to another journey.
- `ClientType` in TypeScript is generated from the product files, so a typo fails `tsc`. A new product folder adds its types automatically.
- A stored type no product knows renders as Scale with the channel-specific steps hidden, 30 days, the "Scale" name, the guides and Ask-AI (exactly as before the switch).
- `label` is the variant's name (team board); `adminLabel` is the admin wording when it differs; `pickerOrder` orders the admin dropdown (lower first, default 100).

## 6. Portal settings and their defaults

**Anything not set is off.** Existing products carry today's values, copied verbatim; `check:journeys` proves it.

Product level (`portal`):

| Setting | Default when absent |
|---|---|
| `wordmark` | required once a product has variants (the name shown when the variant has no `brandName`) |
| `voiceGuide` (`audioPrefix`, `scripts` per stage) | no voice guide |
| `askAi` (questions and answers per stage) | no Ask-AI chips |
| `features.playgroundSteps` | no live AI receptionist test |
| `features.receptionistScriptStep` | the test has no script (it answers "still being set up") |
| `features.landingPreviewSteps` | no landing-page preview |
| `features.nonBlockingSteps` | every open step blocks, in the journey-status report |

Variant level (`variants[].portal`):

| Setting | Default when absent |
|---|---|
| `brandName`, `tagline` | the product's `wordmark`, no tagline |
| `lockedLook` | the look stored on the client |
| `introVideo` | none |
| `hidesIncentive` | the $200 "move fast" popup shows |
| `taskNotes`, `taskDetails` | none, the step's own description |
| `hiddenTaskVideos`, `hiddenTaskBooking`, `hiddenTaskImportant`, `hiddenTaskPlayground` | nothing hidden |
| `hiddenGuideStages` | every stage with a script plays it |
| `stringPlan` | no String Theory tab |

## 7. Frozen journeys

`npm run check:journeys` freezes, for every client type (plus an unknown one), what the portal is built from and shows: steps and wording, every stage render, days, branding, per-step tweaks, voice guides, Ask-AI, String Theory, admin counts and labels, and the portal's server-rendered markup in every look. The fixtures are in `scripts/fixtures/journeys/`.

- It must pass before every commit, merge and deploy, with `check:fin`.
- Re-save a fixture (`npm run check:journeys -- --write <type>`) **only for a change Jesse approved**. `bss-meta` is Fin's: it also needs `--yes-fin`.
- A new live product needs its own fixture before it goes live; `products:check` fails until it has one.
- The fixtures can't see CSS: `app/globals.css` and `app/layout.tsx` still need Jesse's OK.
- To see what changed: `npm run check:journeys -- --dump <dir>` here and at the previous commit, then `diff -r`.

## 8. What still needs code

A product file can only switch on what already exists. These stay in code:

- **Forms** (`lib/onboardingForm.ts`). A step names a form by `formId`; `products:check` fails if the form doesn't exist.
- The **live AI receptionist test**, the **landing-page preview** and the `"landing-page"` content slot behind it.
- **Stages**: the five client stages and the team-only `support` stage (`STAGE_ORDER` in `products/types.ts`). A sixth client stage needs code.
- **Interview audio** is keyed by step id (`public/portal/voice/interview-<step>-<n>.m4a`). Changing an inherited interview needs a new step id.
- **GHL mapping** (`lib/productMapping.ts`): which product a sale provisions. Custom products are never provisioned automatically.
- The incentive popup's and the stage-complete screen's wording, the list of portal looks, and the journey-status report's portal address.
- **Media**: an intro video served from `/api/media/` is allowed automatically, but the file must be uploaded to both R2 buckets (prod and staging).
