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

A **custom product** is a folder too, but its `index.ts` describes only how it differs from a base (Scale, Respond, any product file, or blank). See §9.

## 2. Commands

| Command | What it does |
|---|---|
| `npm run products:render` | Writes `products/index.ts` (the list of product folders), then every sheet in `docs/products/`. A new folder is registered here. |
| `npm run products:lock` | Records each product's version and content hash in `products/versions.lock.json`. Refuses a changed product whose version wasn't bumped. |
| `npm run products:check` | All six product checks: frozen journeys, integrity, the custom-product proof, code boundaries, version lock, sheets and index (see the header of `scripts/products/check.ts`). |
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
- A new live product needs its own fixture before it goes live; `products:check` fails until it has one. Its client type must first be added to `CLIENT_TYPES` in `scripts/journeys/contract.ts`: `check:journeys` refuses a fixture for a type not on that list.
- `_global.json` freezes lists across every product, any status: every step id (first id wins), upload steps, forms, media, accepted types and the admin dropdown. A new product folder with new step ids (even a draft) changes it, so `check:journeys` fails until `_global` is re-saved (`npm run check:journeys -- --write _global`). Do that only as part of the product change Jesse approved, after a `--dump` diff shows nothing but that product's additions.
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

## 9. Making a custom product

A custom product is a product file written as **differences from a base**: Scale, Respond, any other product file, or blank. `defineCustomProduct` (`products/custom.ts`) resolves it into a plain product when it loads, so the portal, the admin, the board, the sheets, the version lock and every check treat it like any other. It throws on any mistake and lists every one.

1. **Save Jesse's spec** as `products/<id>/spec.md`, word for word. `products:check` fails if the file is missing.
2. **Pick the base and the variant**, and pin the base's version. A Scale base needs a variant (`meta`, `google`, `meta-google` or `bss-meta`): only that variant's steps and tasks are kept. If the base later changes, the product fails to load until someone reviews the change and updates `base.version`.
3. **Write `products/<id>/index.ts`** with `defineCustomProduct`. It must export the camelCase id (`products/bss-custom/index.ts` exports `bssCustom`). For example:

   ```ts
   import { scale } from "../scale";
   import { defineCustomProduct } from "../custom";

   export const bssCustom = defineCustomProduct({
     id: "bss-custom", name: "BSS custom journey", version: "2026-10-20.1", status: "draft",
     clientType: "bss-custom", label: "BSS custom", spec: "products/bss-custom/spec.md",
     base: { product: scale, version: "2026-10-17.1", variant: "meta" },
     idPrefix: "bssc-",
     totalDays: 21,
     stages: { "go-live": { dayStart: 21, dayEnd: 21 }, "post-launch": { dayStart: 22, dayEnd: 22 } },
     steps: {
       remove: ["ob-4"],
       change: { "ob-2": { title: "Book your strategy call" } },
       add: [{ stage: "build", after: "bd-2", step: { id: "bssc-1", title: "Approve your offer", detail: "…" } }],
     },
     teamTasks: {
       add: [{ task: { id: "bssc-t1", title: "Draft the offer", notes: "", stage: "build", category: "Offer",
         step: "bssc-1", role: "Scale CSM", priority: "normal", due: "Days 8-10", dependencies: [] } }],
     },
     portal: { brandName: "BSS Launchpad" },
     draftCopy: ["bssc-1"],
   });
   ```

   `npm run products:check` builds a product just like this one in memory on every run (the "custom-product proof"), so the pattern is known to work. The example above is not a real product: none has been added yet.
4. **Follow the rules:**
   - Keep the base's ids for the steps you keep. Clients' ticks are stored by step id.
   - Every new step and task id starts with `idPrefix` (e.g. `bssc-`).
   - A step whose meaning changes, or whose interview changes, needs a **new id**: remove the old step and add a new one. Interview audio is keyed by step id, so changing an inherited interview throws.
   - Stage ids are fixed: `onboarding`, `build`, `testing`, `go-live`, `post-launch` and the team-only `support`. A stage can be patched, added (with `name`, `dayStart`, `dayEnd`) or dropped (`null`, once it is empty).
   - If the timeline changes, fix any wording that quotes days. The sheet's "Wording to check" lists inherited wording that does.
   - No RT Digital in client wording (`products:check` fails on it).
   - Forms and step features are code: a product can only switch on what exists (§8).
   - The voice guide, Ask-AI and step features are **off unless set**. `"inherit"` takes the base's, and is only allowed for the voice guide and Ask-AI when the timeline is the base's (their scripts quote its days).
   - The $200 "move fast" popup is **off by default**. Set `portal.incentive: true` to show it.
   - The name the client sees is `portal.brandName` or the wordmark (the base's, or `portal.wordmark`). Never `name`: that's the team's name for it.
   - A product file that throws stops the Worker. Never deploy without `products:check` passing.
5. **List drafted wording** in `draftCopy`: the ids of steps whose client wording Claude wrote rather than Jesse. Flag it as a draft in the conversation too.
6. **Run the commands:** `npm run products:render` (it registers the folder in `products/index.ts` and writes the sheet), then `products:lock`, `products:check`, `check:journeys` and `check:fin`. New step ids change `_global.json`, so `check:journeys` fails until you re-save `_global` as part of this approved change (§7). Deleting or renaming a folder is also just `products:render`: it rewrites the index and removes the old sheet.
7. **Review the sheet** (`docs/products/<id>.md`), starting with "Differences from <base>": removed, changed and added steps and tasks, dropped dependencies, inherited settings and the timeline.
8. **Preview** with `status: "draft"` on a synthetic client: on staging (`PRODUCT_DRAFTS=1` is set there), or locally with `PRODUCT_DRAFTS=1` in `.dev.vars`. A draft is offered in admin and its board starts only there.
9. **Go live, with Jesse's OK:** set `status: "live"`, empty `draftCopy` (Jesse approved the wording), bump the version, add the client type to `CLIENT_TYPES` in `scripts/journeys/contract.ts`, freeze it with `npm run check:journeys -- --write <client type> _global`, then send the deploy package. Upload any intro video to both R2 buckets (prod and staging) first.
10. **Moving an existing client** (for example Fin onto a custom BSS product) is a separate prod data change, with Jesse's OK and its own deploy package. Ticks carry over for every step id the new product kept.
