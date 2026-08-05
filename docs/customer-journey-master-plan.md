# Customer Journey: end-to-end master plan

**Written:** 2026-08-06 (overnight planning run)
**Scope:** checkout payment page → sub-account + snapshot → nurture/remind/follow-up/inspire → customer journey dashboard
**Status:** PLAN ONLY. Nothing was built. Nothing in GHL or the portal was changed.

Everything in "What already exists" was checked **live against the real APIs tonight**, not
recalled from notes. Where I could not verify something, it says so.

This document extends `ghl-automation-handoff.md`, which covered the demo chain. That doc's
open question ("what is the actual moment in GHL that means a deal closed?") is answered here.

---

## 1. The frame

One line, so we agree on the goal before the detail:

> **Turn a paid sale into a client who is guided, nurtured, and visibly progressing, without
> anyone re-keying anything, by joining GHL's money-and-messaging spine to the portal's
> journey state in both directions.**

The important word is **both**. Today information flows one way by hand: Jesse reads a sale,
Jesse creates a portal client, Jesse pastes a link. The portal then goes silent forever. It
never tells GHL that a client finished a task, or stalled on one. That silence is why no
nurture, reminder or follow-up can exist yet. Fix the silence and the rest becomes ordinary
workflow work.

---

## 2. What already exists (verified live, 2026-08-06)

This is the single biggest finding of the run: **far more is built than the docs suggest.**
This is not a greenfield project. It is a join.

### 2.1 Checkout and payment: LIVE, in production

GHL Payments is already taking real money. Not a plan, not a sandbox.

| Thing | Detail |
|---|---|
| Checkout funnels | `Checkout Funnel (AUD)` `539d9tdGYCjpbPJ5nOhs`, `(AUD) Copy NEW` `XRZ5lBAide6D0cnbgkes`, `(USD) new` `RUF0nheT4KAriGfTEpAl`, plus two OLD ones |
| Products | **50 active**, split Setup vs Monthly, tagged `[Trial & Sub]` vs `[No Trial / Sub]` |
| Product lines | Scale, Convert, Respond, AISS, TAI (TradeAI), LOP |
| Orders sampled | last **100**: **88 paid**, 12 unpaid |

**How the money actually arrives** (last 100 orders):

- **63 via funnel** (`two_step_order_form` 53, `one_step_order_form` 10)
- **35 manual** (`contact_view` 14, `saas_subscription` 14, `subscription_view` 7)
- 1 point of sale, 1 payment link

**This single fact drives the whole design.** A third of real revenue never touches the
checkout page. The two largest recent orders (Chris McBreen, **AUD 8,250** and **AUD 2,200**)
were both `manual/saas_subscription`. So the automation must **not** trigger off the checkout
funnel. It must trigger off payment, which catches both.

### 2.2 The "deal closed" moment: ANSWERED

Pipeline **`5. CLOSER PIPELINE (RESPOND)`** (`9rE5dJONyfKXkBiT74JN`, 402 opportunities) has
explicit won stages, and **the stage name carries the product**:

| Stage | ID |
|---|---|
| `SCALE WON` | `15d0e840-a384-41e6-b210-e377bea60974` |
| `RESPOND WON (0-30 Days)` | `35b7ebfa-1987-47b9-80fd-9ce13d8e0807` |
| `CONVERT WON` | `576e9c08-b670-4923-a95c-15c6658e74dd` |
| `SEND CONTRACT` | `1da70b9b-4120-47ce-91de-8dd7f8e7949f` |
| `CONTRACT SENT/PENDING` | `63b82375-7792-439b-8b0f-b86dc9af2eb8` |

That resolves the old open question, and it partly resolves a second one: the handoff noted
"nothing reads the sold package to choose `clientType`". The won stage now gives you the
product. It does **not** give you the Scale channel split (meta / google / meta-google), which
still needs a second signal. See Decision 3.

### 2.3 Post-payment automation: BUILT, PUBLISHED, WIRED TO NOTHING

This is the most useful thing in the whole map.

Three **published** workflows fire on subscription activation, one per product line. Their
old destination is retired and no longer in use (confirmed by Jesse, 2026-08-06). They still
fire. They just hand off to nothing.

**So the current state of post-payment onboarding is: it runs, and then it stops.** A client
gets nothing automatically. Onboarding only happens when a human notices the sale.

That is the cheapest possible starting position. The trigger is already correct, already
published, and already segmented by product. **Only the destination needs replacing.** There
is no migration, no parallel running, and nothing to decommission.

The three workflows:

| Workflow | ID |
|---|---|
| `Subscription Activated -> Trigger LaunchBay Zap (For Scale)` | `df513bbb-ac9e-4252-9b4e-ea08531659d2` |
| `Subscription Activated -> Trigger LaunchBay Zap (For Convert)` | `88c77aa8-a5d0-4ece-a431-fa99ddc14fdf` |
| `Subscription Activated -> Trigger LaunchBay Zap (Respond)` | `cf62da7d-b8ac-4b3c-9e8e-fa63e7d14553` |

**Rename these when you repoint them.** The names still carry the old destination, and a
workflow named after a tool nobody uses is how the next person gets confused.

This is the spine of the plan: **repoint the destination, keep the trigger.**

Other relevant published workflows (238 total in the location, 42 on-topic):

- `Won Deal Celebration and Onboarding` `40294d1f-7b86-482d-af90-b3d6a691317e`
- `RESPOND Package Purchased & Opportunities Update` `d4d5f32f-5e78-46dd-9fd3-fadd8dcfe7dc`
- `AISS: Add Purchased Tag to AUD Checkout` `2acd9b8f-4e28-4254-a972-39417d31dd01`
- `Sales: TradeAi – New Client Onboarding Trigger (Slack)` `61fd3a6d-b10f-4f66-9a0a-bab94934777e`
- `SMS & Email Sequence After Welcome Onboard Calendar Booking` `b5e3a973-a462-4496-93b6-cfab897cdee3`
- `Jesse Onboard Demo` `e88fd7ba-4b05-46f3-84de-aefa9144b6d8` (the 2026-07-19 demo, still published)

**Do not build new workflows before auditing these.** Several already do part of the job, and
duplicate automation on one contact is how clients get spammed.

### 2.4 Sub-account and snapshot

- GHL **SaaS Mode** auto-creates a sub-account when a Stripe subscription created by the SaaS
  Configurator is paid. The `[Trial & Sub]` product naming and the `saas_subscription` order
  subtype both point at this being in use already.
- **15 snapshots** available. Relevant own-snapshots: `Tradeai V2` `hnLrk3WGPvRvPWDNjNHu`,
  `TradeAi` `KfZSwsRx8ifXmSqs6F6u`, `Convert Snapshot` `wI6rD2x4SCfu8Wwmax18`,
  `LenderlyAi` `Il3QKeg8hd1gfS4i59MU`, `Miramint Snap`, `AT Network`.
- Snapshot load is **asynchronous, roughly 30 seconds to a few minutes**. This is a real race
  condition. See Failure mode F1.

### 2.5 The portal

- Live, HTTP **200**, at `https://scale-onboarding-portal.jesse-b4e.workers.dev`
- **1 client record** right now, a test called "v". Jesse has cleaned house, so this is a
  clean slate for real clients.
- 5 stages: Onboarding (d1-2), Build (d2-13), Testing (d14), Go-Live (d30), Post-Launch (d31)
- 26 visible milestones for `meta-google`
- Two products (Scale, Respond), four client types, two themes, stage voice guide
- `contact.onboarding_link` custom field exists in RTD: `I6gvzTG5hVisdCT6xpTa`

### 2.6 Credentials and boundaries

- The **portal repo holds no GHL credentials**. The keys live in the brain repo's `.env.local`
  (`GHL_AGENCY_PIT`, `GHL_RTD_LOCATION_PIT`, `SCALE_PORTAL_ADMIN_TOKEN`).
- The agency PIT **cannot mint location tokens** (401, tested 2026-08-03). Agency access means
  list, read, create shells. Not reach inside.
- Only **3 of 58** locations have a Firebase refresh token, which is what workflow *building*
  requires.
- **Publishing a workflow is manual and always will be.** GHL's public API has no create or
  publish endpoint for workflows. This is a platform limit.

---

## 3. The five real gaps

Everything else is detail. These five are what actually block the journey.

| # | Gap | Why it blocks everything |
|---|---|---|
| **G1** | **Identity.** `portal_clients` has no `ghl_contact_id`, no `ghl_location_id`, no email, no phone. | Nothing can join a portal client to a GHL contact. Without the join, no message can reference journey state, and no journey event can reach a contact. This is the keystone. |
| **G2** | **Events.** The portal emits nothing outward. Ever. | Milestone completion is invisible to GHL, so reminders, follow-ups and celebrations have nothing to fire on. |
| **G3** | **Trigger.** Provisioning is a hand-run API call. Nothing reads the sold product to pick `clientType`. | Every new client is manual work and a chance to mis-key. |
| **G4** | **Dead end.** Three published workflows fire on every sale and hand off to a destination that is no longer in use. | Post-payment onboarding runs and then stops. Nothing reaches the client automatically. This is live today, on real sales. |
| **G5** | **Deliverability.** The portal is on `workers.dev`. | Known, already observed: the welcome email lands in Gmail spam because of the `workers.dev` link, while Mailgun reports it delivered. The whole journey starts with a link nobody sees. |

---

## 4. Decisions only Jesse can make

These are genuinely his calls. Each has a recommendation, but the choice changes the build.

### Decision 1: How does the portal talk back to GHL?

The portal is a Cloudflare Worker. It is always on. The brain is a laptop that sleeps, and we
have proof that scheduled work on it silently misses fires (the morning-shift DarkWake
failures). **A payment-triggered provisioning path must not depend on the laptop.** So the
orchestrator should be the Worker. The question is how it authenticates to GHL.

| Option | How | Trade-off |
|---|---|---|
| **A. Inbound-webhook URLs (recommended)** | Portal POSTs to per-event GHL Inbound Webhook trigger URLs. The GHL workflow does the field write, tagging and sending. | **Portal never holds a GHL API key.** The credential boundary survives intact. URLs are capability tokens, rotatable. Needs the LC Premium inbound-webhook trigger (included on paid agency plans, **verify**). |
| B. GHL API key as a Worker secret | Portal calls the GHL API directly to write fields and tags. | More control and better error reporting, but it puts a live CRM write key in the portal, breaking the boundary the handoff doc deliberately drew. |
| C. Keep Zapier in the middle | Point the existing Zap step at the portal instead. | Least new code, fastest interim. But opaque, costs money per task, and adds a third system to debug. |

**Recommendation: A**, with **C as a short interim** only if you want a client landing in the
portal this week, before the Worker work lands.

### Decision 2: One journey per product, or per product plus channel?

`clientType` supports `meta`, `google`, `meta-google`, `respond`. The won stage tells you Scale
vs Respond vs Convert. It does not tell you the ad channel. Also note: **Convert has a won
stage and a snapshot, but no portal journey template exists for it.**

Options: derive channel from the purchased product name, add a required field on the checkout,
or default to `meta-google` and let the CSM correct it in admin.

**Recommendation:** default to `meta-google`, flag it visibly in admin as "unconfirmed", and
have the first onboarding task confirm it. Never silently guess a client into the wrong journey.

### Decision 3: Which checkout funnel is the real one?

There are five checkout funnels, two named `OLD`, one named `Copy NEW`, two currencies. Before
anything triggers off checkout, **exactly one AUD and one USD funnel should be canonical and
the rest archived.** I cannot tell from the API which is live. This is a ten-minute tidy that
prevents a class of bug that is very hard to diagnose later.

### Decision 4: Custom domain for the portal

`workers.dev` is why the welcome email gets junked. Recommend `portal.rtdigital.com.au` or
similar on an RT Digital domain, with SPF/DKIM aligned to the sending domain.

**This should be done first, before any automation.** Automating delivery of a link that lands
in spam just automates the failure.

### Decision 5: What happens on refund, cancellation or failed payment?

Not designed anywhere today. A client whose card fails should not keep receiving "inspire"
messages about their launch. Needs a defined pause state.

---

## 5. Target architecture

### 5.1 The spine

```
STAGE 0  SALE
         Opportunity moves to SCALE WON / RESPOND WON / CONVERT WON
                         |
STAGE 1  PAYMENT
         GHL Payments (funnel checkout 63%, manual 35%) -> Stripe
         Trigger: Payment Received / Subscription Activated  <-- NOT "funnel submitted"
                         |
STAGE 2  PROVISION
         GHL SaaS Mode creates sub-account, snapshot loads (ASYNC, 30s - few min)
         GHL -> webhook -> PORTAL /api/hooks/ghl/provision
         Portal creates client record, stores GHL ids, returns portal link
                         |
STAGE 3  WELCOME  (gated on snapshot verified ready)
         Portal -> GHL inbound webhook -> writes contact.onboarding_link, adds tag
         Existing GHL workflow sends SMS + email with the link
                         |
STAGE 4  GUIDED JOURNEY
         Client works the portal. 5 stages, 26 milestones, voice guide.
         Every completion writes to portal_events (outbox)
                         |
STAGE 5  NURTURE LOOP  (the four verbs)
         Portal outbox -> GHL inbound webhooks -> workflows -> SMS/email
         REMIND / FOLLOW-UP / NURTURE / INSPIRE, through ONE governor
                         |
STAGE 6  DASHBOARDS
         Client-facing: the portal itself
         Agency-facing: onboarding pipeline view (who is stuck, where, how long)
                         |
STAGE 7  HANDOVER TO BAU
         Go-live -> existing client-dashboard health model takes over
```

### 5.2 The two-way contract

**Inbound: GHL to portal.** One endpoint, one shape.

```
POST /api/hooks/ghl/provision
Header: x-portal-hook-secret: <shared secret, Worker secret>
Body:  {
  eventId,            // idempotency key, required
  contactId,          // GHL contact id
  locationId,         // the client's new sub-account id
  opportunityId,
  email, phone, firstName, lastName, companyName,
  productName,        // drives clientType mapping
  orderId, amount, currency
}
```

Rules: **idempotent on `eventId`** (GHL retries, and a double-fire creates a duplicate portal
client with a different link, which is very confusing to unpick). Unknown `productName` must
**fail loud** to Slack, never guess a journey.

**Outbound: portal to GHL.** One inbound-webhook URL per event type.

| Event | Fires when | Carries |
|---|---|---|
| `portal.provisioned` | client record created | contactId, portalLink |
| `milestone.completed` | client ticks a task | contactId, milestoneId, stageId |
| `stage.completed` | last visible milestone in a stage done | contactId, stageId, nextStageId |
| `client.stalled` | open task untouched > N days | contactId, milestoneId, daysStalled |
| `form.submitted` | guided setup finished | contactId |
| `journey.completed` | post-launch reached | contactId |

**Delivery uses an outbox, not inline calls.** Write the event to a table, drain it on a
schedule. If GHL is down, or a URL rotates, nothing is lost and nothing blocks the client's
click. This is the difference between a demo and a system.

### 5.3 Data model changes

```
portal_clients  ADD
  ghl_contact_id, ghl_location_id, ghl_opportunity_id
  email, phone
  product_code            -- what was actually sold
  source_order_id         -- ties back to the payment
  provisioned_at, go_live_at
  journey_state           -- active | paused | completed | cancelled   (Decision 5)

NEW portal_events         -- the outbox
  id, client_id, type, payload, created_at, delivered_at, attempts, last_error

NEW portal_webhook_log    -- inbound idempotency
  event_id (unique), received_at, result
```

### 5.4 The four verbs, and the governor

Jesse named four jobs: nurture, remind, follow-up, inspire. They are genuinely different and
should not be one sequence.

| Verb | Trigger | Cadence | Example |
|---|---|---|---|
| **Remind** | state-based: task open > 48h | max 2 per task, then escalate to a human | "Your logo upload is still open, it's the one thing holding up your build" |
| **Follow-up** | event-based: stage completed | immediate | "Onboarding done. Here's what we do next and when" |
| **Nurture** | time-based: day 3, 7, 14 regardless of state | fixed | education, what good looks like, what to expect |
| **Inspire** | milestone-based: stage payoff, go-live, first lead | on the event | celebration, proof, momentum |

**The governor is the non-obvious part and the thing most likely to be skipped.** Four
independent tracks pointed at one contact will collide, and a client can easily receive three
messages in an hour. Before any track goes live there must be **one gate every send passes
through**:

- quiet hours (client timezone, not ours)
- max messages per contact per day, across all tracks
- suppression while `journey_state` is `paused` or `cancelled`
- one channel per event (do not SMS and email the same thing)

### 5.5 Stalled detection

Add a **Cloudflare Cron Trigger** to the portal Worker (daily). It sweeps clients, computes
staleness from `portal_milestone_progress`, and writes `client.stalled` events to the outbox.

It must run on the Worker, not the brain, for the sleep reason in Decision 1. Note the deploy
wrinkle: `wrangler.json` is **generated by the build and hand-patched** on every deploy. Adding
cron triggers and secrets makes that patch bigger, so **the patch should become a committed
script**, not a snippet pasted from `deploying.md`.

---

## 6. Failure modes to design for

| # | Failure | Mitigation |
|---|---|---|
| **F1** | **Snapshot race.** Welcome SMS fires before the snapshot finishes loading. Client logs into a half-built CRM on day one. | Gate stage 3 on a readiness check: poll the sub-account until expected assets exist, then send. Never send on a timer alone. |
| **F2** | **Duplicate provisioning.** GHL retries the webhook, two portal clients exist, two different links. | Idempotency on `eventId` plus a uniqueness constraint on `ghl_contact_id`. |
| **F3** | **Manual sales missed.** 35% of orders never touch checkout. | Trigger on Payment Received / Subscription Activated, not funnel submission. |
| **F4** | **Spam.** Four nurture tracks collide. | The governor in 5.4. Non-negotiable, build it with the first track, not after the fourth. |
| **F5** | **Junked welcome email.** `workers.dev` link. | Custom domain first (Decision 4). |
| **F6** | **Wrong journey.** Unknown product maps to a default silently. | Fail loud to Slack. An unmapped product is a stop, not a guess. |
| **F7** | **Refund or cancel.** Messages keep flowing to someone who left. | `journey_state` pause, wired to the subscription cancelled trigger. |
| **F8** | **Double automation.** New workflows duplicate the 42 that already exist. | Audit before build. Phase 1 job. |
| **F9** | **Publish forgotten.** GHL ignores triggers on draft workflows, and publishing does **not** replay missed events. | Every workflow ships as draft, Jesse publishes, then a test fire verifies. Already a known gotcha. |

---

## 7. Phased plan

Each phase is independently shippable, independently reversible, and delivers something
useful on its own. No phase depends on a later one.

### Phase 0: Decide and clear the ground
- Answer Decisions 1 to 5.
- Point the portal at a real RT Digital domain, verify an email lands in an inbox, not spam.
- Archive the dead checkout funnels so exactly one AUD and one USD remain.
- **Outcome:** a link that arrives, and one obvious checkout.

### Phase 1: See what is really there
- Audit the 42 on-topic workflows. Which fire today, which are dead, which overlap.
- Decide what the three subscription-activated workflows should do in the meantime: turn them
  off, or leave them firing into nothing until Phase 3 repoints them. Either is fine. Leaving
  them on by accident is what is not fine.
- Confirm the inbound-webhook premium trigger is available on the plan.
- **Outcome:** a one-page map of what fires on a sale today. No build without it.

### Phase 2: Identity (the keystone)
- Add the GHL id columns and `journey_state` to `portal_clients`.
- Backfill by hand for the small number of live clients.
- Admin UI shows the linked GHL contact.
- **Outcome:** every portal client is joined to its GHL contact. Still fully manual, but the
  join exists. Nothing downstream is possible before this.

### Phase 3: Inbound provisioning
- Build `/api/hooks/ghl/provision`, idempotent, secret-protected.
- Product to `clientType` mapping table, fail loud on unknown.
- Repoint **one** product line to the portal (recommend Respond: smallest journey, 4 stages).
  Leave the other two firing as they are until this one is proven on a real sale.
- **Outcome:** a real Respond sale creates a portal client automatically, no hands.

### Phase 4: Outbound events and welcome
- `portal_events` outbox plus the drain.
- `portal.provisioned` writes the link back and tags the contact.
- Existing SMS/email workflow sends the link, gated on the F1 readiness check.
- **Outcome:** sale to welcome message, end to end, untouched by a human.

### Phase 5: The four verbs
- Build the governor **first**.
- Then one track at a time, in this order: **Remind** (highest value, it unblocks builds),
  Follow-up, Inspire, Nurture.
- Copy drafted with `nurture-campaign-writer` (see skill gap note), reviewed by Jesse, shipped
  as draft workflows, published by Jesse.
- **Outcome:** clients get chased and encouraged without a CSM doing it by hand.

### Phase 6: Stalled sweep
- Cron trigger on the Worker, staleness rules, `client.stalled` events.
- **Outcome:** nobody goes quiet for a week unnoticed.

### Phase 7: Dashboard
- Repoint the remaining two product lines, so all three run through the portal.
- Agency-facing onboarding pipeline view: who is in which stage, how long, what is blocking.
  Feeds the existing `client-dashboard` health model at go-live.
- **Outcome:** every sale lands in the portal, and you can see at a glance who is stuck.

---

## 8. Skill gaps

Per the planner's rules, jobs map to real skills or get flagged. These are flagged, **not
invented**:

| Job | Skill | State |
|---|---|---|
| Nurture copy | `nurture-campaign-writer` | **Exists, but scoped to pre-sale prospect-to-booked-call.** Post-sale onboarding nurture is a different job with a different voice. Needs a scope extension or a sibling skill. |
| Agency dashboard | `client-dashboard` | Exists, health model reusable at Phase 7. |
| Build GHL workflows | **GAP** | The builders are Python scripts in `leadgen-ghl-cli/builders/`, not a brain skill. Works, but undocumented as a repeatable job. |
| Deploy the portal | **GAP** | `deploying.md` is a manual runbook with a hand-patch step. Should be a script. |
| Verify a webhook contract end to end | **GAP** | No skill tests a two-way integration. |

---

## 9. The safety line

The constitution applies unchanged, and it lands on this project in three specific places:

1. **The client pays with their own card, on Stripe, through GHL.** That is the customer moving
   their own money. Nothing here has the AI charge a card, issue a refund, or change a price.
   Those stay human, always.
2. **Sending.** GHL sends the SMS and email, from a workflow a human published. The AI drafts
   copy and builds workflows **as drafts**. Jesse publishes. Conveniently, GHL's platform limit
   and the safety rule agree exactly: publishing cannot be automated, and should not be.
3. **Cancellation, refund and dunning** are money and relationship decisions. The system may
   pause a journey and notify. It may not chase a payment.

---

## 10. What I could not verify

Stated plainly so nothing here reads as more certain than it is:

- **Workflow internals.** GHL's public API has no read-by-id for workflows (confirmed: 404). I
  can list all 238 and see names and status, but not their triggers or steps. The Phase 1 audit
  needs the UI or the internal API.
- **Which checkout funnel is live.** Names suggest it, the API does not confirm it.
- **Whether SaaS Mode is actually configured** for each product line. The order subtypes and
  product naming both strongly imply it, but the SaaS Configurator itself is agency-UI only.
- **Inbound-webhook trigger availability** on RT Digital's specific plan.

---

## 11. Where the work happens

- **Portal, schema, webhooks, cron:** `~/Master/AI/customerjourney-app` (this repo)
- **GHL workflow building:** `~/Master/Labs/stanley-henry-ai-brain` and
  `~/Master/Labs/leadgen-ghl-cli`, because that is where the credentials are

Per the session-root protocol, **start a session rooted at the repo the work is in.** Do not
try to do both halves from one session.
