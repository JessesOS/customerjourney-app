# Conversion report: CSM task lists → product files (October 2026)

Written by `scripts/products/import-csm-templates.ts` on 2026-10-16. A one-off, kept for provenance. Plan: `~/.claude/plans/temporal-waddling-wave.md`, Phase 1.

**Source:** `~/Master/AI/csm-dashboard` (frozen) at commit `5c9abc9`. Read only; the CSM app was never run.

| File | sha256 |
|---|---|
| `lib/scaleTasks.ts` | `e4fd2757ae6b5dbf55c808f3127ca24bf19e6fdc717665cc66c2dbd5e826bf48` |
| `lib/respondTasks.ts` | `d4ca5a67e654094dae1f65858ce6053dd38cca31d0885e08ec7783dc63ce36ff` |
| `lib/bssTasks.ts` | `4dc0689547928ca1dfc783683867ebe13a79d80203d55de79690a96eb01e5103` |
| `lib/types.ts` | `3c3ad28e42a8f4a24e9875cac0ef18b4bcb7fb95dc1ad5f3aabddd4fe0919958` |

**Needs Jesse:** the step mapping (review it in the sheets, `docs/products/*.md`) and the [flags](#flags-for-jesse-not-fixed) at the end.

## Summary

| Product | Status | Source tasks | In the product | Behind a client step | Team-only (stage level) | Flagged unplaced |
|---|---|---|---|---|---|---|
| Scale | live | 87 (86 in the list + `scl-309` injected in code) | 87 | 56 | 27 | 4 (team-only too) |
| Respond | live | 53 | 53 | 26 | 27 | 0 |
| BSS Launchpad | paused (reference) | 40 (`bss-002` retired, not carried) | 40 | 0 (no client steps converted) | 40 | 0 |
| Website add-on | draft | 4 (`bss-014`…`bss-017`) | 4 | 0 (no client steps yet) | 4 | 0 |

Team tasks a client gets, by variant:

| Variant | Channels | Team tasks |
|---|---|---|
| Scale — Meta ads (`meta`) | meta | 76 |
| Scale — Google Ads (`google`) | google | 71 |
| Scale — Meta + Google Ads (`meta-google`) | meta, google | 87 |
| BSS Meta ads only (`bss-meta`) | meta (the Meta set) | 76 |
| CRM — Respond (`respond`) | none | 53 |

Checked id for id against CSM's own task sets (`scaleTasksForVariant`): meta 76, google 71, meta_google 87, bss_meta 76.

## Rules applied

1. **Ids kept.** Every task keeps its CSM id (`scl-…`, `rsp-…`, `bss-…`). Client steps keep their portal ids.
2. **Wording.** Team side: CSM's title wins. Client side: the portal's wording wins. Client steps are verbatim copies of `lib/onboardingJourney.ts` and `lib/respondJourney.ts`; this script does not touch them.
3. **Notes kept as guidance.** CSM gave new clients blank notes (`seedTemplateTasksForClient` dropped them unless `useTemplateState` was set), so the "Merged SOP steps" only showed on demo clients. Product files keep every template note on purpose, as the task's guidance. 90 tasks carry notes.
4. **Stage = CSM phase.** Onboarding → `onboarding`, Build → `build`, Testing → `testing`, Go-Live → `go-live`, Post-Launch → `post-launch`, Support → `support` (team-only, never reaches the portal). Where a task's stage differs from its client step's stage it is kept and flagged, not moved.
5. **Scale channels**, by CSM's category rule (`scaleCategoriesForVariant`): categories `scale-04` and `scale-05` → `["meta"]`; `scale-06` and `scl-309` → `["google"]`. `bss-meta` gets the Meta set (CSM's `taskSetForVariant`).
6. **`scl-309`** existed only in code (`scaleTasksForVariant` pushed it for Google variants). It is now an ordinary task with `channels: ["google"]`, placed at the top of the Google category (its `Days 1-5` window) rather than at the end of the list.
7. **Roles** are each product's CSM team list, minus "Unassigned" (no task uses it; an unassigned task simply has no assignee on the board). Person-named roles (Rich, Joseph, Accounts - Sandy) are kept for now.
8. **Order** is CSM's order (by `sortOrder`), apart from `scl-309`.
9. **Placement.** Every task sits in exactly one place: behind one client step (`step`), or team-only at stage level. `scl-040` sits behind `ob-6` and counts as done when the client finishes `ob-6`, `ob-6b` and `ob-6c` (`completesWithSteps`).

## Changes made

### "RT Digital" → "allconvos.ai" (CSM hand-off note 1)

Every exact "RT Digital" in a team task's title or notes. Jesse wants no RT Digital anywhere for BSS, and `bss-meta` runs on Scale's tasks.

| Task | Field | Before | After |
|---|---|---|---|
| `scl-001` | notes | - Log into the GoHighLevel (GHL) Agency View -> RT Digital sub-account. Contacts, Scott Lambert Check comms with client. Message replies etc. Also, check clients sub account comms. | - Log into the GoHighLevel (GHL) Agency View -> allconvos.ai sub-account. Contacts, Scott Lambert Check comms with client. Message replies etc. Also, check clients sub account comms. |
| `scl-104` | title | Get RT Digital partner access to Meta Business Suite | Get allconvos.ai partner access to Meta Business Suite |
| `scl-104` | notes | - Instruct the client to add RT Digital as a "Partner" in their Meta Business Suite. | - Instruct the client to add allconvos.ai as a "Partner" in their Meta Business Suite. |
| `scl-104` | notes | - Send the client the Scribe guide: "How to Add RT Digital as a Partner on Meta Business Suite". | - Send the client the Scribe guide: "How to Add allconvos.ai as a Partner on Meta Business Suite". |
| `scl-104` | notes | - Provide the client with the RT Digital Business ID to enter. | - Provide the client with the allconvos.ai Business ID to enter. |
| `scl-107` | title | Assign client's FB Page, Ad Account & Instagram to RT Digital | Assign client's FB Page, Ad Account & Instagram to allconvos.ai |
| `scl-107` | notes | - Once Partner access is granted, log into the RT Digital Meta Business Portfolio. | - Once Partner access is granted, log into the allconvos.ai Meta Business Portfolio. |
| `scl-132` | notes | - Log into the RT Digital Google Ads Manager (MCC) account via the Projects Chrome profile. | - Log into the allconvos.ai Google Ads Manager (MCC) account via the Projects Chrome profile. |
| `scl-141` | notes | - Check Google Business Profile manager under projects@richtraining.com.au to ensure RT Digital is invited to manage it. | - Check Google Business Profile manager under projects@richtraining.com.au to ensure allconvos.ai is invited to manage it. |

Check these still match the real accounts: `scl-001` (the GHL sub-account's name), `scl-104` (the Scribe guide is still titled "How to Add RT Digital as a Partner…"), `scl-107` (the Meta Business Portfolio's name), `scl-132` (the Google Ads MCC's name). Other spellings were left alone, see the flags.

`scl-104`'s client-facing portal title ("Add RT Digital as a Partner in your Meta Business Suite") is dropped with the other portal fields. The client sees the portal's own `bd-3` wording, "Grant us partner access to your Meta Business Suite".

### BSS

- Category "Intake & Kick-off" → "Intake" (CSM hand-off note 5; the kick-off call `bss-002` is retired): `bss-001`, `bss-003`.
- Roles: "Jesse Allan" only (hand-off note 4).
- Retired and not carried over: `bss-002` (kick-off call).
- Reference only: status `paused`. No client steps converted; BSS's client journey stays in `lib/bssJourney.ts` (also paused). `productForClientType("bss")` returns null.

### Website add-on (draft)

- Copied from BSS, ids kept: `bss-014`, `bss-015`, `bss-016`, `bss-017`, category "Website Build", role "Jesse Allan".
- Dependencies on BSS tasks outside the add-on were dropped: `bss-014` (was after `bss-004`); `bss-015` (was after `bss-004`); `bss-016` (was after `bss-007`).
- No client steps and no timeline yet (`totalDays: null`). One Build stage, days 8–35, borrowed from BSS's build window.

### Respond

- The portal's Respond journey has no Build stage (Onboarding days 1–2, then Testing days 3–8). CSM's 15 Build tasks keep their phase, so the product gets a **team-only Build stage** (days 2–7, from their due windows) that never reaches the portal: `rsp-020`, `rsp-021`, `rsp-022`, `rsp-023`, `rsp-025`, `rsp-026`, `rsp-027`, `rsp-028`, `rsp-029`, `rsp-030`, `rsp-031`, `rsp-032`, `rsp-035`, `rsp-037`, `rsp-038`.
- Respond's client step ids are CSM template ids, so 12 team tasks share an id with the step they sit behind (`rsp-012` behind `rsp-012`, and so on). Step ids and task ids are separate namespaces; the integrity check allows it.

## Dropped (not carried into product files)

- **`status`**: demo progress, not template content. Non-queued in the source: complete `scl-001`, `scl-019a`, `rsp-001`, `rsp-002`; in_progress `scl-005`, `rsp-007`, `rsp-010`. Every task starts queued on a new board.
- **`blockedReason`**: demo state. `scl-018` "Waiting on the client to submit their onboarding form"; `scl-095` "Waiting on campaign strategy inputs before the build can start"; `rsp-012` "Waiting on the client to submit their onboarding form"; `rsp-025` "Waiting on the client's contact CSV upload"; `rsp-030` "Waiting on the client's number decision or porting authorisation"; `rsp-038` "Waiting on client website content for the knowledgebase".
- **`loomUrl` / `loomTitle`**: none set in any template. Phase 2 boards hold a Loom link per client task.
- **`sortOrder`**: file order is the order.
- **Portal fields** (`portalVisible`, `portalTitle`, `portalNote`, `portalActionRequired`, `portalActionUrl`, `portalActionLabel`, `portalConfigured`): the client steps speak to the client now. The portal-visible tasks, with the step that replaces their portal wording:

| Task | CSM portal title (dropped) | CSM portal note (dropped) | Now behind client step |
|---|---|---|---|
| `scl-018` | Complete your onboarding form | Log in to your portal and submit the onboarding form before your Welcome Call. | `ob-1` Tell us about your business |
| `scl-026` | Bookmark your portal link | Save your portal link so you can access it anytime. | `ob-2` Book your Welcome Call & portal walkthrough |
| `scl-028` | Send a test message in your portal | Open your portal onboarding task and send us a test message to confirm everything is working. | none (team-only) |
| `scl-033` | Review & approve your AI qualification questions | We'll go through your AI's qualification questions together on your Welcome Call. | `ob-3` Review & approve your AI receptionist's qualification questions |
| `scl-038` | Download the LeadConnector Mobile App | Search 'LeadConnector' in the App Store or Google Play and install it before your next call. | `ob-4` Download the mobile app |
| `scl-039` | Review your SMS & email message copy | We'll walk through your messaging templates together on the call. | `ob-5` Review your SMS/Email message copy |
| `scl-040` | Connect your calendar, social accounts & payment method | We'll help you set these up during your Welcome Call. | `ob-6` Connect your calendar |
| `scl-041` | Upload your past leads (CSV) | Prepare a CSV of your past leads and lost quotes — we'll walk you through the upload. | `ob-7` Upload your past leads (CSV) |
| `scl-047` | Grant access to your Google My Business Profile | We'll need this to connect your local business listing. We'll send instructions during your Welcome Call. | none (team-only) |
| `scl-048` | Grant domain & website builder access | We'll need access to your domain provider and website builder to set up your funnel. | `ob-1` Tell us about your business |
| `scl-060` | Review & approve your eBook lead magnet content | We'll share a Google Doc link in your portal — please review and send us your feedback. | `bd-1` Review & approve your eBook lead magnet content |
| `scl-103` | Approve your Meta ad campaigns & creative assets | We'll share your strategy doc and ad creatives in your portal for your final sign-off. | `bd-2` Approve your Meta ad campaigns & creative assets |
| `scl-104` | Add RT Digital as a Partner in your Meta Business Suite | We'll send you our Business ID and a step-by-step guide to complete this in your portal. | `bd-3` Grant us partner access to your Meta Business Suite |
| `scl-131` | Watch your ad campaign walkthrough video | We've recorded a Loom walkthrough of your live campaigns — check your portal messages for the link. | none (team-only) |
| `scl-224` | Test your AI receptionist live | Use the link we send you to chat and speak with your AI — try different personas to put it through its paces. | `ts-2` Test your AI receptionist live |
| `scl-231` | Your Go-Live Call is scheduled | We'll confirm the exact date and time via your portal messages. | `ts-3` Book your Go-Live Call |
| `scl-242` | Your live system walkthrough | On the Go-Live Call we'll show you how to handle calls, manage contacts, and use notifications. | `gl-2` Learn your live system |
| `scl-260` | You're live! Access your recording & support links | Your system is now live. Check your portal messages for your call recording and support resources. | `gl-5` You're live — access your recording & support links |
| `scl-278` | Your Week 1 check-in call | A 30-minute Zoom to review your first week — we'll be in touch to confirm the time. | `pl-1` Book your Week 1 check-in call |
| `scl-279` | Your Week 2 check-in call | A 30-minute Zoom to review your progress and answer any questions. | `pl-2` Book your Week 2 check-in call |
| `scl-308` | Share your experience — send us a testimonial | We'd love to hear how your journey has gone. A short video or written testimonial means the world to us! | `pl-3` Send us a testimonial |
| `scl-309` | Grant access to Google Ads Manager & Google Analytics | We'll need admin access to your Google Ads account and Google Analytics to set up tracking and campaigns. | `bd-g1` Link your Google Ads account to ours |
| `rsp-012` | Complete your onboarding form | Log in to your portal and submit the onboarding form before your Welcome Call. | `rsp-012` Tell us about your business |
| `rsp-014` | Attend your Welcome Call & portal walkthrough | We'll walk you through your portal, your project milestones, and the messaging center on the call. | `rsp-014` Attend your Welcome Call & portal walkthrough |
| `rsp-015` | Bookmark your portal link | Save your portal link so you can get back to it anytime. | `rsp-015` Bookmark your portal link |
| `rsp-017` | Upload your client database (CSV) | Prepare a CSV of your past customers and leads — we'll walk you through the upload. | `rsp-017` Upload your client database (CSV) |
| `rsp-018` | Review & approve your AI qualification questions | We'll go through your AI receptionist's qualifying questions together on the Welcome Call. | `rsp-018` Review & approve your AI qualification questions |
| `rsp-048` | Test your AI receptionist live | On the AI Test Call we'll have you chat and speak with your AI to make sure it's ready to go. | `rsp-048` Test your AI receptionist live |
| `rsp-049` | Download the LeadConnector app | Search 'LeadConnector' in the App Store or Google Play and install it before your Go-Live call. | `rsp-049` Download the LeadConnector app |
| `rsp-059` | Your Go-Live walkthrough | On the Go-Live call we'll show you how to handle calls, contacts, AI summaries, and notifications. | `rsp-059` Your Go-Live walkthrough |
| `rsp-062` | Approve updating your website & Google Business Profile | We'll switch your website and Google listing to your new AI phone number — we just need your go-ahead. | `rsp-062` Approve updating your website & Google Business Profile |
| `rsp-064` | You're live! Access your recording & support links | Your system is live. Check your portal messages for your call recording, user manual, and support resources. | `rsp-064` You're live! Access your recording & support links |
| `rsp-072` | Share your experience — send us a testimonial | We'd love to hear how it's going. A short video or written testimonial means the world to us! | `rsp-072` Share your experience — send us a testimonial |
| `rsp-073` | Your check-in calls | We'll schedule regular check-ins to review performance and answer questions — we'll confirm times in your portal. | `rsp-073` Your check-in calls |
| `bss-001` | Your intake interview | Answer a few short questions so we can tailor the CRM, website, and AI agent to your business. Your answers are saved here. | (BSS, reference) |
| `bss-003` | Invite us to your accounts | Invite admin@allconvos.ai as an admin on each: your current CRM, GoHighLevel sub-account, Calendly, domain provider and website hosting. No passwords change hands. Anything that won't accept an invite, we sort out together on a call. | (BSS, reference) |
| `bss-014` | Your new website — core pages | Home, About, Podcast & socials, Book a call, Call booked, Not-qualified, Link-in-bio, Privacy. Two rounds of changes included. | (BSS, reference) |
| `bss-015` | Webinar pages | Registration and thank-you pages. Three rounds of changes included. | (BSS, reference) |
| `bss-016` | Partner pages | Exact pages confirmed in the first two weeks. Two rounds of changes included. | (BSS, reference) |
| `bss-027` | Website launch | We launch on your domain on an agreed day. | (BSS, reference) |
| `bss-037` | Client onboarding flow | Triggered when payment is confirmed; linked to the portal and the implementation coach handover. | (BSS, reference) |
| `bss-038` | Your walkthrough & guide | A live walkthrough plus a short written guide to running everything. | (BSS, reference) |
| `bss-041` | Ongoing support | We review and support through month 8. | (BSS, reference) |

## Step mapping as applied

### Scale

| Client step | Stage | Team tasks behind it |
|---|---|---|
| `ob-0` Your voice interview | onboarding | client only: Voice interview: the client answers, nobody on the team acts on it as a task. |
| `ob-1` Tell us about your business | onboarding | `scl-018`, `scl-019a`, `scl-048` |
| `ob-2` Book your Welcome Call & portal walkthrough | onboarding | `scl-019`, `scl-023`, `scl-026`, `scl-036`, `scl-043` |
| `ob-3` Review & approve your AI receptionist's qualification questions | onboarding | `scl-029`, `scl-033` |
| `ob-5` Review your SMS/Email message copy | onboarding | `scl-039` |
| `ob-4` Download the mobile app | onboarding | `scl-038` |
| `ob-crm` Log into your CRM | onboarding | `scl-189` |
| `ob-6` Connect your calendar | onboarding | `scl-040` |
| `ob-6b` Connect your social accounts | onboarding | `scl-040` (done with it) |
| `ob-6c` Set up a payment mechanism | onboarding | `scl-040` (done with it) |
| `ob-7` Upload your past leads (CSV) | onboarding | `scl-041` |
| `ob-8` Grant access to your accounts (hidden) | onboarding | client only: Hidden in the portal (muted 2026-07-12). |
| `bd-1` Review & approve your eBook lead magnet content | build | `scl-049`, `scl-055`, `scl-060`, `scl-062`, `scl-072`, `scl-077`, `scl-082`, `scl-087`, `scl-089` |
| `bd-2` Approve your Meta ad campaigns & creative assets | build | `scl-095`, `scl-103`, `scl-123` |
| `bd-3` Grant us partner access to your Meta Business Suite | build | `scl-104`, `scl-107` |
| `bd-g1` Link your Google Ads account to ours | build | `scl-309`, `scl-132`, `scl-141` |
| `bd-g3` Review & approve your Google Ads keywords | build | `scl-144`, `scl-149` |
| `bd-g2` Review & approve your Google Ads landing page copy | build | `scl-152`, `scl-158`, `scl-168`, `scl-176`, `scl-181`, `scl-183` |
| `bd-4` Watch your ad campaign walkthrough video (hidden) | build | client only: Hidden in the portal until the walkthrough flow is reworked. |
| `ts-1` Confirm your app, calendar & social accounts are connected | testing | `scl-218` |
| `ts-2` Test your AI receptionist live | testing | `scl-212`, `scl-224`, `scl-228` |
| `ts-3` Book your Go-Live Call | testing | `scl-231` |
| `gl-1` Attend your Go-Live walkthrough call | go-live | `scl-232`, `scl-240` |
| `gl-2` Learn your live system | go-live | `scl-242` |
| `gl-3` See your AI in action | go-live | `scl-249` |
| `gl-4` Set your team's usage standards | go-live | `scl-258` |
| `gl-5` You're live — access your recording & support links | go-live | `scl-260` |
| `pl-1` Book your Week 1 check-in call | post-launch | `scl-278` |
| `pl-2` Book your Week 2 check-in call | post-launch | `scl-279`, `scl-280` |
| `pl-3` Send us a testimonial | post-launch | `scl-276`, `scl-308` |

Team-only, at stage level:

- onboarding: `scl-001`, `scl-005`, `scl-009`, `scl-015`, `scl-028` (flagged), `scl-047` (flagged)
- build: `scl-129` (flagged), `scl-131` (flagged), `scl-192`, `scl-197`, `scl-206`, `scl-211`
- post-launch: `scl-264`, `scl-271`, `scl-282`, `scl-286`, `scl-292`
- support: `scl-294`, `scl-295`, `scl-296`, `scl-297`, `scl-298`, `scl-299`, `scl-300`, `scl-301`, `scl-302`, `scl-303`, `scl-304`, `scl-305`, `scl-306`, `scl-307`

### Respond

| Client step | Stage | Team tasks behind it |
|---|---|---|
| `rsp-000` Your voice interview | onboarding | client only: Voice interview, as Scale's ob-0. No CSM task behind it. |
| `rsp-012` Tell us about your business | onboarding | `rsp-012`, `rsp-016` |
| `rsp-014` Attend your Welcome Call & portal walkthrough | onboarding | `rsp-014`, `rsp-019` |
| `rsp-015` Bookmark your portal link | onboarding | `rsp-015` |
| `rsp-017` Upload your client database (CSV) | onboarding | `rsp-017`, `rsp-025` |
| `rsp-018` Review & approve your AI qualification questions | onboarding | `rsp-018` |
| `rsp-048` Test your AI receptionist live | testing | `rsp-041`, `rsp-044`, `rsp-046`, `rsp-048` |
| `rsp-049` Download the LeadConnector app | testing | `rsp-049` |
| `rsp-059` Your Go-Live walkthrough | go-live | `rsp-050`, `rsp-054`, `rsp-057`, `rsp-058`, `rsp-059`, `rsp-063` |
| `rsp-062` Approve updating your website & Google Business Profile | go-live | `rsp-029`, `rsp-030`, `rsp-031`, `rsp-062` |
| `rsp-064` You're live! Access your recording & support links | go-live | `rsp-064` |
| `rsp-072` Share your experience — send us a testimonial | post-launch | `rsp-072` |
| `rsp-073` Your check-in calls | post-launch | `rsp-073` |

Team-only, at stage level:

- onboarding: `rsp-001`, `rsp-002`, `rsp-007`, `rsp-009`, `rsp-010`
- build: `rsp-020`, `rsp-021`, `rsp-022`, `rsp-023`, `rsp-026`, `rsp-027`, `rsp-028`, `rsp-032`, `rsp-035`, `rsp-037`, `rsp-038`
- post-launch: `rsp-065`, `rsp-067`, `rsp-071`, `rsp-075`, `rsp-076`, `rsp-078`
- support: `rsp-079`, `rsp-080`, `rsp-081`, `rsp-082`, `rsp-083`

## Flags for Jesse (not fixed)

### 1. Tasks with no client step

Placed team-only at stage level for now. Decide where they go, or retire them.

- `scl-028` "Ask the client to send a test message on the onboarding form task in LaunchBay to confirm they understand the system.": The portal has no "send a test message" step. Could sit behind ob-2 (Welcome Call), or be retired.
- `scl-047` "Chase the client to provide access to Google My Business Profile.": Its natural step, ob-8, is hidden (Jesse, 2026-07-12: GBP access no longer needed). Probably retire.
- `scl-129` "Record the ad campaign walkthrough Loom": Its natural step, bd-4 (the walkthrough video), is hidden until that flow is reworked. Move behind bd-4 if it comes back.
- `scl-131` "Post the Loom video link in the LaunchBay messaging center for the client.": Same as scl-129: belongs behind bd-4 if it comes back.

### 2. LaunchBay / Magic Link wording

The team works in this portal now, not LaunchBay. Titles still naming LaunchBay or the Magic Link:

- Scale, 8 titles: `scl-009`, `scl-018`, `scl-026`, `scl-028`, `scl-043`, `scl-131`, `scl-211`, `scl-276`. Also in the notes of `scl-015`, `scl-023`, `scl-060`, `scl-212`, `scl-228`, `scl-260`, `scl-271`, `scl-280`, `scl-286`.
- Respond, 15 titles: `rsp-001`, `rsp-002`, `rsp-007`, `rsp-009`, `rsp-012`, `rsp-015`, `rsp-017`, `rsp-025`, `rsp-030`, `rsp-031`, `rsp-048`, `rsp-063`, `rsp-064`, `rsp-071`, `rsp-072`. Also in the notes of `rsp-038`, `rsp-046`, `rsp-073`, `rsp-076`.

### 3. Respond go-live: day 14 in CSM, day 10 in the portal

The portal promises go-live on day 10 (`respondJourneyTotalDays`); CSM's windows run to day 14. `rsp-019` tells the client "14 days to Go-Live". Tasks due after day 10: `rsp-049` (Days 10-13), `rsp-050` (Day 13), `rsp-054` (Day 13), `rsp-057` (Day 14), `rsp-058` (Day 14), `rsp-059` (Day 14), `rsp-062` (Day 14), `rsp-063` (Day 14), `rsp-064` (Day 14), `rsp-065` (Day 14), `rsp-067` (Day 14), `rsp-071` (Days 14-21).

### 4. `ob-crm` timing

The client is asked to log into their CRM in Onboarding (days 1–2), but `scl-189` (set up the GHL sub-account and add the client as a user) is a Build task due days 8–13.

### 5. Team tasks in a different stage from their client step

- `scl-189` "Set up the client's GHL sub-account & access" (build, Days 8-13) sits behind `ob-crm` (onboarding).
- `rsp-025` "Import the client contact database after CSV upload and mark the LaunchBay import task complete." (build, Days 2-5) sits behind `rsp-017` (onboarding).
- `rsp-029` "Submit ABN/ACN documents for Twilio Regulatory and Address Bundles." (build, Days 4-6) sits behind `rsp-062` (go-live).
- `rsp-030` "Purchase an SMS/MMS capable mobile number or manage the Porting stage in LaunchBay." (build, Days 4-6) sits behind `rsp-062` (go-live).
- `rsp-031` "Mark Procure & Submit Phone for Approval and Configure Phone Settings complete in LaunchBay." (build, Days 4-6) sits behind `rsp-062` (go-live).

Kept as CSM had them. The product sheets show each one under its step and note the different stage.

### 6. Brand wording left as it is

Only the exact phrase "RT Digital" was changed. These name real systems, so they were left for Jesse:

- `scl-001` notes: Log into the RTDigital Agency Slack to check Slack comms, multiple channels and DM's daily.
- `scl-197` notes: Select Provider as RTD OpenAi.
- `scl-197` notes: Connect to RTDigital Agency and the appropriate client GHL subaccount.
- `scl-240` notes: Have the client open https://aiss-live.rtdigital.com.au/.
- Client-facing, in the portal's own steps (protected, verbatim): `bd-3`'s guide link is the Scribe "How_to_Add_RT_Digital_as_a_Partner…"; `ob-crm` links to `crm.rtdigital.agency`; the booking links are `go.rt-d.com/jesse30`.

### 7. Person-named roles

Scale and Respond keep CSM's roles, including people: Rich, Joseph, Accounts - Sandy. Keep, or rename to functions (plan, question 9).

