<!-- Jesse's spec for the bss-custom product: the BSS handover of 17 Oct 2026,
     copied word for word from ~/Master/Side_Projects/Clients/bitcoinsuccessschool/handover/bss-custom-product-spec.md
     with two redactions (Stripe ids, billing city). The original stays in the client folder.
     scripts/products/import-bss-spec.ts reads section 3 of this file. -->

# Bitcoin Success School: complete delivery spec for the custom onboarding product

Handover written 17 October 2026, from the full project record. It is for a session that knows nothing about this client. It is the input for building a **custom onboarding product** for Fin, made of two parts:

- **Client portal:** what Fin sees and does.
- **Team task board:** everything we do to deliver.

Every item Fin has asked for is broken down to single tasks. Nothing is merged to save space.

---

## 0. Read this first

### 0.1 Rules for anything Fin will see
1. **Never mention "RT Digital".** Our side is **allconvos.ai** (Jesse Allan, jesse@allconvos.ai). Stripe receipts show "All Convos AI".
2. **Never touch Fin's live site** (bitcoinsuccessschool.com) or submit its forms. Drafts are built separately and only go live with Fin's sign-off.
3. **Fin's claims and offer wording stay word for word** unless Fin signs off. This includes "Worth $21,000+", the "Clarity or Cancel" Guarantee and "Limited intake". The same applies to partner endorsements: change them only with that partner's OK.
4. **Never invent testimonials, numbers or results.** Never copy claims, counts or bonuses from the reference business (Imperial Wealth) that Fin showed: use it for structure only.
5. **Nobody ever asks for seed phrases, private keys, passwords or wallet balances.** That covers forms, the AI agent, emails and support.
6. **Access by invitation, not shared passwords.** Logins never go in email or in this folder. Jesse's logins are in `~/Master/_private/accounts-map.md`.
7. Wording in this file marked **(draft)** was written by us and has **not** been approved by Fin.
8. Ask Jesse before deploying, publishing or sending anything.

### 0.2 Legend
- **Who:** **Fin** = Fin Creighton (client). **Us** = Jesse Allan at allconvos.ai (the delivery team). **Both** = joint.
- **When:** week numbers count from the day Fin paid. **W1 = Thu 15 Oct to Wed 21 Oct 2026**, W2 = 22 to 28 Oct, W3 = 29 Oct to 4 Nov, W4 = 5 to 11 Nov, W5 = 12 to 18 Nov, W6 = 19 to 25 Nov, W7 = 26 Nov to 2 Dec, W8 = 3 to 9 Dec, W9 = 10 to 16 Dec, W10 = 17 to 23 Dec. M2 to M8 = months 2 to 8 (to mid-June 2027).
- **Status:** DONE, IN PROGRESS, TODO, BLOCKED (waiting on Fin or a decision), DEFERRED (Fin said later), OPTIONAL (only if Fin approves).
- **Source codes:**
  - **AGR** = the signed agreement v2 (https://bss-agreement.vercel.app, source `proposal/index.html`).
  - **BRIEF sN** = Fin's Word brief, section N (`notes/2026-10-15-fin-website-change-brief-v6.md`).
  - **LOOM m:ss** = Fin's Loom (`notes/2026-10-15-fin-loom-transcript.md`).
  - **EMAIL 14 Oct** = Fin's list and Jesse's replies (`notes/reply-to-fin.md`, `notes/2026-10-16-gmail-thread-with-fin-and-gaps.md`).
  - **WA** = WhatsApp (`notes/2026-10-16-whatsapp-fin-commitments-and-questions.md`).
  - **CALL 15 Oct** = Granola call log (`notes/2026-10-15-call-with-fin-calendly-switch.md`).

### 0.3 Sources, in order of authority
1. The signed agreement v2 (14 Oct 2026). Fin accepted and paid against it.
2. Emails and WhatsApps from Jesse sent **before** Fin paid. These are part of what he agreed to, so they're treated as commitments even though they're missing from the page (see 3.K).
3. Fin's Word brief v6 (15 Oct). For website copy, Fin calls it "the source of truth".
   - Sections 1 to 7 are instructions.
   - Sections 8 to 11 are "proposed, draft for Fin's approval".
4. Fin's Loom (15 Oct). Fin calls it "spitballing"; where it differs, the brief wins.
5. The call on 15 Oct: the booking tool changes from Cal.com to Calendly.

---

## 1. Project facts

| Item | Fact |
|---|---|
| Client | Bitcoin Success School (BSS), bitcoinsuccessschool.com. Owner and contact: **Fin Creighton**. |
| Fin's contact details | Email fin@fincreighton.com (the one he uses). Stripe customer email admin@bitcoinsuccessschool.com. WhatsApp (main informal channel). YouTube https://www.youtube.com/@FinCreighton. |
| Fin's billing address | [redacted here; in the client folder] (on the Stripe customer). In the UK. Open question: GST treatment, see 7. |
| What BSS sells | Bitcoin self-custody education and guided implementation. **Package:** 12 months of training and support, four private one-to-one implementation calls plus one bonus call, a monthly group training and Q&A call, a resource library, a Master Vault document and a private community. **Sales step:** a free 30-minute "Clarity Call". **Guarantee:** "Clarity or Cancel". |
| Other people on Fin's side | Implementation coaches: several, each to get a Calendly sub-account and a Zoom licence. A sales team is coming "later" (LOOM 6:20). Partner Sean Clarke (Gday/G'day Bitcoin) runs the referral page /call/gdaybitcoin. Bisher Khuderia co-hosted the old webinar "The Big Calm". |
| Our side | Jesse Allan, allconvos.ai, jesse@allconvos.ai. |
| Agreement | Version 2, 14 Oct 2026. Live (public, unlisted, noindex) at https://bss-agreement.vercel.app (Vercel project `bss-agreement`). Governing law: New South Wales. |
| Price | A$700 + GST a month for 8 months: A$5,600 + GST, or A$770 a month including GST (A$6,160 total). The 8 months is a payment plan, not the build time. |
| Payments | Stripe account "All Convos AI". Subscription and customer ids: [redacted here; in the client folder]. Payment 1 paid 14 Oct 2026, 21:11 UTC (15 Oct AEDT). Payments 2 to 8 on the 14th of each month, Nov 2026 to May 2027. `cancel_at` is set to 21 May 2027, so it stops automatically after payment 8. |
| Costs on top, at cost, paid by Fin | GoHighLevel subscription; business phone number (monthly); SMS, call and email usage; carrier or sender registration fees; domain and hosting; any paid widget (for example Instagram/X feeds); Calendly team plan; Zoom licences per coach. |
| Fin's current tech | **Website:** a Lovable app (React + Supabase), very likely hosted by Lovable behind Cloudflare (A record 185.158.133.1, an "Edit with Lovable" badge on the assessment site). **DNS and registrar:** Porkbun. **Booking:** Calendly (Cal.com was cancelled after a week because its reminders went to junk). **Video:** Zoom. **Call-booked videos:** Wistia. **Podcast:** Riverside RSS. **Existing GHL sub-account:** not yet audited. |
| Fin's existing app (the "vibe-coded CRM") | Six-question qualification modal → Supabase table `qualification_submissions` → edge function `sync-to-ghl` → booking. Security Score assessment at assess.bitcoinsuccessschool.com (table `assessment_submissions`, also calls `sync-to-ghl`). Also: referral partners, leads and commission payments; a merch store; phone enquiries; a Bali event system (attendees, bookings, speakers); webinar and checklist pages; an admin area; a client portal and resources. |
| Live routes that must keep working | `/call/<partner>` referral links, `/book`, `/callbooked`, `/not-qualified`, `/linktree`, `/podcast`, `/about`, `/privacy`, `/webinar`, `/webinar/thanks`, `/checklist`, `/merch`, `/partner`, `/bali/*`, `/admin`, `/phone`, `/circle`, plus the client portal and assess.bitcoinsuccessschool.com. |

### Key links (ours)
| What | Where |
|---|---|
| Website draft 1 review hub (Fin's review page, shared answers) | https://bss-website-draft.vercel.app/review.html (Vercel `bss-website-draft`, noindex). Files: `site-build/`. |
| Original pitch site | https://bss-motion-pitch.vercel.app (Vercel `bss-motion-pitch`). Files: `~/Master/Side_Projects/Jack Roberts Skills/Design/2. Claude Motion Design/Bitcoin Success School/site/`. |
| Pitch video sent to Fin | https://bitcoinsuccess.jesse-b4e.workers.dev/v/bitcoin-success-school-28caa831b6 |
| Website build spec, page by page | `notes/BUILD-SPEC-website-draft-1.md` |
| Fin's requirements cross-reference (W1 to W19, C1 to C8) | `notes/CROSS-REFERENCE-fin-requirements.md` |
| What changed on each draft page | `notes/drafts/CHANGES-*.md` |
| Live-site capture (exact copy, screenshots, Wistia IDs) | `notes/live-site/` |

---

## 2. Phases and timeline (as agreed with Fin)

From the agreement (section 04), plus Jesse's 14 Oct reply:
- The website, CRM, AI agent and first sequences are built and live in **about six weeks**, depending on access and approvals.
- Partner tracking, the webinar system and the onboarding flow follow, **by about week 10** (to be confirmed once the partner and payment setup is seen).
- Months 2 to 8 are refinement and support.
- Delays on Fin's side move the timeline by the same amount (AGR, Terms: Access and timing).

| Phase | Weeks | Dates (calculated, not promised as dates) | What happens (AGR wording) |
|---|---|---|---|
| 1. Onboard, map and evaluate | W1 to W2 | 15 to 28 Oct | Set up in the portal, kick-off, access, customer journey agreed. Partner, payment, webinar and booking setups mapped. |
| 2. Build | W2 to W4 | 22 Oct to 11 Nov | Website built out, CRM snapshot installed, contacts cleaned and imported. |
| 3. Connect | W5 | 12 to 18 Nov | Forms, chat widget, phone, texting, social channels and the booking tool (now Calendly) live. |
| 4. Automate and launch | W6 | 19 to 25 Nov | Lead nurture, call-booked sequence and AI lead agent tested and live. Core website launched. |
| 5. Partners, webinar and onboarding | W7 to W10 | 26 Nov to 23 Dec | Partner tracking, the weekly webinar system and the client onboarding flow built and live. |
| 6. Refine and support | M2 to M8 | to mid-June 2027 | Review real leads and AI conversations, tune what isn't working, walkthrough and guide, ongoing support. |

**Fin's own order (WA, 15 Oct 08:04):** "web stuff and core GHL first, then after that emails etc." With the brief he also said to **ignore the automation side for now**. So automations and sequences are DEFERRED until the website and core GHL are done. They still sit inside the W6 to W10 plan unless Fin's approvals slip.

**Faster promises made on WhatsApp (15 Oct):**
- The portal link and "the first version of the website" by Monday. The portal link was emailed 16 Oct; website draft 1 was built 17 Oct.
- Later the same day, the plan became: a customised onboarding/project dashboard by end of day Friday or early next week, web pages signed off next week, and GHL "ticking along task by task".

**Go-live:** the core website launches on Fin's domain on an agreed day in about W6 (the week of 19 to 25 Nov 2026). Fin's current site stays live until then (AGR Phase 3). No exact launch date has been agreed.

---

## 3. Every deliverable, broken into tasks

Columns: **ID · Task · Who · Depends on · When · Done when · Needs from Fin · Tools · Status (17 Oct).**

### 3.A Onboarding, portal, evaluation and admin

| ID | Task | Who | Depends on | When | Done when | Needs from Fin | Tools | Status |
|---|---|---|---|---|---|---|---|---|
| A01 | Take payment 1 and record consent and signature | Us | Agreement v2 | Done 14 Oct | Stripe shows A$770 paid, terms accepted, signature "Fin Creighton" | – | Stripe | DONE |
| A02 | Set the subscription to stop after payment 8 (`cancel_at` 21 May 2027) | Us | A01 | Done 15 Oct | `cancel_at` set; 7 payments remain on the 14th, Nov to May | – | Stripe | DONE |
| A03 | Check why Jesse got no Stripe email for the payment; fix notification settings | Us | – | W1 | Test payment notification arrives | – | Stripe | TODO |
| A04 | Send the welcome / kickoff email | Us | A01 | Done 15 Oct 08:35 | Sent to fin@fincreighton.com | – | Gmail | DONE |
| A05 | Send Fin his portal link | Us | Portal exists | Done 16 Oct | Emailed ("best on desktop") | – | Portal | DONE (current portal); the custom product replaces it |
| A06 | Build Fin's **custom onboarding product** (client portal + team board), from this file | Us | This spec | W1 to W2 | Fin logs in and sees his checklist, timeline, approvals and messages; the team board holds every task in section 3 | Fin uses it | Custom product | TODO |
| A07 | Load every task in section 3 into the team board, with owner, dependency, week and status | Us | A06 | W1 to W2 | Board matches this file | – | Custom product | TODO |
| A08 | Load Fin's checklist (section 4) into his portal | Us | A06 | W1 to W2 | Fin sees his to-dos in order | – | Custom product | TODO |
| A09 | Kick-off call: agree goals, who approves what, how to reach each other | Both | A06 | W1 to W2 | Call held; notes in the portal; approver named (default: Fin) | 45 minutes | Zoom, portal | TODO |
| A10 | Collect all access in the portal (see 4.1) | Both | A06 | W1 to W2 | Every row in 4.1 marked "granted" | Each invite | Portal | TODO |
| A11 | Map the customer journey end to end (first touch → nurture → booking → call → client → onboarding) | Us | A09, A10 | W1 to W2 | A one-page journey map in the portal | Review | Portal, diagram | TODO |
| A12 | Fin approves the customer journey map before anything is built on it | Fin | A11 | W2 | Approved in the portal | Approval | Portal | TODO |
| A13 | Analyse Fin's existing app ("vibe-coded CRM"): every table, page and tool; what it stores and does; keep, migrate or replace | Us | Lovable/Supabase access (A10) | W1 to W2 | Written inventory: tables, row counts, what syncs to GHL, what must keep working | Lovable + Supabase access | Lovable, GitHub, Supabase | BLOCKED (access) |
| A14 | Audit Fin's existing GHL sub-account: pipelines, workflows, calendars, forms, integrations, contacts, phone numbers, domains, users | Us | GHL access | W1 to W2 | Audit written | GHL access | GoHighLevel | BLOCKED (access) |
| A15 | Map every channel enquiries come in through today (website, quiz, assessment, checklist, Instagram, Facebook, YouTube, partner links, phone, email, WhatsApp, webinar) | Both | A09 | W1 to W2 | Channel list in the portal | The list | Portal | TODO |
| A16 | Map partner, commission and payout setup today (how partners are added, tracked and paid) | Both | A13 | W1 to W2 | Written plan shown to Fin; flagged before work if bigger than expected | Explanation + access | Lovable app, Supabase, GHL | BLOCKED |
| A17 | Map how Fin takes payment after a sales call (Stripe? invoice? other) | Both | A09 | W1 to W2 | Payment method and trigger known | Answer | – | BLOCKED (question asked 15 Oct, unanswered) |
| A18 | Confirm the webinar platform and licence (Zoom Meetings or Zoom Webinars) | Fin | – | W1 to W2 | Answer recorded | Answer | Zoom | BLOCKED |
| A19 | Research check: Calendly vs GHL native booking (cost, features, red flags), as agreed on the 15 Oct call | Us | – | W1 | A short note to Fin with a recommendation | – | Calendly, GHL | TODO |
| A20 | Written findings and recommendation: keep, migrate or replace; can the existing sub-account be used | Us | A13, A14, A15 | End W2 | Report in the portal, approved by Fin | Approval | Portal | TODO |
| A21 | Decide the sub-account: Fin's existing, or a new one Jesse provides (Jesse emailed "I will include a sub-account as part of this package"; the agreement says Fin owns and pays for his GHL) | Both | A20 | End W2 | Decision written down | Decision | GHL | TODO |
| A22 | Send the **clarifications addendum** (v2.1) by email: 3 rounds of website changes; extra (4th) scroll step; sub-account included, then A$50/month after month 8 (GST question open), exportable, no lock-in; Fin gets website admin and owns it; handover and export if we stop working together; Calendly replaces Cal.com | Us | – | W1 | Email sent; Fin replies OK | Read + OK | Gmail | Drafted in Gmail, NOT sent |
| A23 | Send the draft 1 review email with the review hub link and 26 questions | Us | Website draft 1 | W1 | Sent | – | Gmail | Drafted in Gmail, NOT sent |
| A24 | Update the agreement page and any emails from "Cal.com" to "Calendly" (or GHL, per A19) | Us | A19 | W1 to W2 | No live document says Cal.com | – | Vercel | TODO |
| A25 | Fix the client-portal booking link (CALL 15 Oct: clients currently hit a dead Cal.com link) | Fin or Us (decide) | Calendly set up (B501) | W1 | Clients reach a working Calendly page | Calendly link | Lovable app | TODO (owner to agree) |
| A26 | Weekly progress update to Fin in the portal | Us | A06 | Every week to M8 | Update posted | – | Portal | TODO |
| A27 | Ask the accountant about GST on a client billed to a UK address | Us | – | W1 to W2 | Answer recorded; invoices corrected if needed | – | Accountant | TODO |

### 3.B Website

Agreed scope (AGR "Website scope, precisely"): the **8 core pages** (Home, About, Podcast and socials, Book a call, Call booked, Not-qualified, Link-in-bio, Privacy), the **webinar pages** (registration and thank-you; a replay page was added from the Loom) and the **updated partner pages**.

The other 17 public pages can be added later, with the fee adjusted in writing first:
- Offer, Implementation overview, Group cohort
- Free equipment checklist
- Wealth Summit, Living Council
- Phone pages and the phone setup guide
- Merch (2 pages)
- Bali (7 pages)

**Rounds of changes:**
- Agreement: 2 rounds on core pages, 3 on webinar pages, 2 on partner pages.
- Jesse's email of 14 Oct: 3 rounds for Fin.
- Decision (Jesse, 17 Oct): **keep 3 rounds on paper**, aim to finish in 2.
- Fin's "tweaks from the call" list counts as round 1 (AGR).

**Build approach:** draft 1 is static HTML/CSS/JS in `site-build/`, in the pitch design system (vault-ink / paper / orange; Instrument Serif, Inter, JetBrains Mono; calm motion). The approved pages are then rebuilt **inside Fin's Lovable project** (GitHub sync), so his app routes keep working.

#### B1. Website: global items

| ID | Task | Who | Depends on | When | Done when | Needs from Fin | Tools | Status |
|---|---|---|---|---|---|---|---|---|
| B101 | Design system carried from the pitch homepage to every page (colours, type, spacing, motion rules) | Us | – | W1 | All draft pages use `styles.css` + `shared.css` | – | HTML/CSS | DONE (draft 1) |
| B102 | Main navigation: Home · Podcast & Videos + "Book Your Free Clarity Call" button; About and Privacy in the footer (BRIEF s10 proposal; Contact left out until decided) | Us | – | W1 | Same menu on every main page | Approve (Q5) | HTML | DONE (draft), awaiting Fin |
| B103 | Footer: disclaimer (unchanged), Pages links, Social links (Twitter/X, Instagram, YouTube, Spotify, Apple Podcasts) | Us | – | W1 | On every main page | – | HTML | DONE (draft) |
| B104 | Webinar pages use a focused header (logo only, no main menu, no assistant) (BRIEF s10) | Us | – | W1 | As described | – | HTML | DONE (draft) |
| B105 | Placeholder AI assistant bottom right (answers from the page FAQ, labelled placeholder, hands booking to the quiz) | Us | – | W1 | On Home, About, Podcast, Call booked, partner pages | – | JS | DONE (draft); the real agent is section 3.F |
| B106 | Every booking button opens the Book a Call quiz | Us | B201 | W1 | All CTAs carry `data-book` | – | JS | DONE (draft) |
| B107 | Motion: calm, plays once, respects "reduce motion"; videos load only when pressed | Us | – | W1 | Checked | – | JS/CSS | DONE (draft) |
| B108 | Fix the scroll-film crash ("Aw, Snap" error 11 on the second pass in Chrome) | Us | – | Done 17 Oct | Engine decodes from Blobs; 14 of 14 test runs clean; pitch site fixed too | – | `vendor/engine.js` | DONE |
| B109 | Mobile layouts for every page (390 wide) | Us | – | W1 | No sideways scroll, no errors | – | Playwright | DONE (draft) |
| B110 | Accessibility basics: focus states, labels, alt text, keyboard close on the quiz, screen-reader focus on quiz steps | Us | – | W1 to launch | Checked per page | – | – | DONE (draft), recheck at build |
| B111 | Page speed: frame images light set on phones; video facades; lazy images | Us | – | Launch | Lighthouse checked on the live build | – | Lighthouse | TODO (live build) |
| B112 | SEO basics for launch: titles, descriptions, social share image, sitemap, redirects for any changed URL; remove noindex at launch only | Us | Launch plan | W6 | Checked on the live domain | – | Lovable | TODO |
| B113 | Fin gets admin access so he can change the site himself, and owns it (WA promise) | Us | Lovable route (B602) | Launch | Fin can edit text/images in his Lovable project | – | Lovable | TODO |
| B114 | Review hub for each draft round (cards, Draft/Live toggle, numbered questions, shared answers saved as typed) | Us | – | Each round | Hub updated per round; answers visible to Jesse | – | `site-build/review.html`, `/api/answers`, Vercel Blob | DONE (round 1) |

#### B2. Website: page by page

For each page: build (draft) → Fin reviews in the hub → changes (rounds) → Fin approves → rebuild in Lovable → test → launch.

| ID | Page / item | Task | Who | Depends on | When | Done when | Needs from Fin | Tools | Status |
|---|---|---|---|---|---|---|---|---|---|
| B201 | **Book a Call quiz** (core page "Book a call", BRIEF s11) | Redesign the qualification pop-up: intro (BRIEF s9 proposed copy), Fin's six questions and options word for word, the same two disqualifying answers → /not-qualified, then first name + email, then the Calendly step | Us | – | W1 | Draft works, nothing saved | Approve intro (Q6) | `book.js` | DONE (draft) |
| B202 | Quiz | Decide which of the brief's five question improvements to make: (a) a path for "Not yet, but I'm planning to"; (b) multi-select storage plus "Not yet"/"Unsure"; (c) "What would you most like help with?"; (d) neutral readiness wording; (e) a free-resources route for "I don't need help" | Fin | Draft 1 review | W2 | Answer to Q7 | Decision | Hub | BLOCKED (Fin) |
| B203 | Quiz | Build the chosen question changes | Us | B202 | W2 to W3 | Approved | Approval | `book.js` → Lovable | TODO |
| B204 | Quiz | Replace the Calendly placeholder with Fin's Calendly embed, passing name, email and attribution (never sensitive answers in the URL) | Us | B501, B505 | W3 to W5 | A test booking works end to end | Calendly link + admin | Calendly | BLOCKED |
| B205 | Quiz | Live data handling (BRIEF s11): save answers durably first; sync to GHL with retries and a visible failure alert; one correlation ID linking answers, booking and contact; booking confirmed only by the Calendly webhook | Us | C-section fields, H03 | W4 to W6 | All s11 acceptance tests pass (B230) | Supabase + GHL access | Supabase edge function `sync-to-ghl`, GHL API/webhook, Calendly webhook | TODO |
| B206 | **Home** (BRIEF s1) | Fourth scroll step "A setup that doesn't die with you", same animation; counter 01–04; re-timed so step 4 lands on the open safe | Us | – | W1 | On desktop and phone | – | `index.html`, `app.js` | DONE (draft) |
| B207 | Home (BRIEF s2) | Problem: keep the opening line; replace the second line ("Taking self-custody yourself is the right move, but it requires a clear, secure process behind it."); remove "Information overload"; cards in order: Irreversible mistake, Exchange risk, Analysis paralysis, Inheritance planning; keep the support copy | Us | – | W1 | Matches the brief | Singular or plural (Q1) | HTML | DONE (draft) |
| B208 | Home (BRIEF s3) | Path: new subtext; new "Step by step guidance" and "Ongoing support" text; later ongoing-support bullet 2 → "Join other freedom-thinking Bitcoiners in our private community." | Us | – | W1 | Matches the brief | – | HTML | DONE (draft) |
| B209 | Home (BRIEF s4) | Benefits list: seven points in Fin's order | Us | – | W1 | Matches the brief | – | HTML | DONE (draft) |
| B210 | Home (BRIEF s5) | Package summary: heading "12 months of training and support"; counters 12 / 4+1 / 1; the free Clarity Call removed from paid inclusions and kept as the sales CTA | Us | – | W1 | Matches | Confirm reading (Q2) | HTML | DONE (draft) |
| B211 | Home (BRIEF s6) | FAQ "What's included?": new opening sentence; remove "Your setup plan"; five items (Secure your Bitcoin, Backup and recovery, Family access plan, Master Vault document, Ongoing support) | Us | – | W1 | Matches | – | HTML | DONE (draft) |
| B212 | Home (LOOM 1:15, BRIEF s9) | "Trusted by" → "Featured on" (Bitcoin MENA, Bitcoin Magazine logos) | Us | – | W1 | Label shown | Confirm accuracy (Q3) | HTML | DONE (draft), awaiting Fin |
| B213 | Home (LOOM 0:48) | Testimonial carousel that switches on at 4+ testimonials (today: Mark, Bailey, Kodie) | Us | – | W1 | Works | New testimonials with consent (Q4) | `app.js` | DONE (layout); content BLOCKED |
| B214 | Home | Add new testimonials when Fin sends them (with each client's written permission) | Us | B213, Fin's content | W2+ | Live in the carousel | Testimonials + consent | HTML | BLOCKED |
| B215 | Home | VSL slot kept in the design (the VSL itself is a separate add-on) | Us | – | Launch | Slot exists or is ready to drop in | – | – | TODO (not in draft 1) |
| B216 | Home | Keep unchanged: offer heading "Worth $21,000+", Clarity or Cancel Guarantee, other FAQs, final call | Us | – | Always | Checked line by line | – | – | DONE (draft) |
| B217 | **Call booked** (BRIEF s7) | Restyle in the homepage design with subtle motion; "You're One Step Closer to True Freedom"; remove only the two named sentences; keep all other copy; keep the 12 Wistia videos | Us | – | W1 | Line-by-line check vs live | – | `callbooked.html` | DONE (draft) |
| B218 | Call booked | Optional extras: readiness checklist; one testimonial near the videos | Fin decides, Us builds | Q8 | W2+ | Built only if approved | Decision | HTML | OPTIONAL |
| B219 | Call booked | Swap in Fin's re-filmed video embeds when ready (LOOM 1:43) | Us | Fin films | M2+ | New embeds live | New video links | Wistia/YouTube | DEFERRED (Fin) |
| B220 | Call booked | Move Fin's photo and the coffee image from hotlinks into the project | Us | Lovable | Build | No hotlinks | – | Lovable | TODO |
| B221 | **Podcast & Videos** (BRIEF s10, LOOM 4:15) | Hero (live copy + subscribe links + newest episode), "Start here" (six Featured Episodes), latest videos (auto), latest episodes with audio (auto), social links, closing CTA → quiz | Us | – | W1 | Draft works | Keep or swap picks (Q23) | `podcast.html`, `podcast.js`, `feeds.json`, `scripts/update-feeds.py` | DONE (draft) |
| B222 | Podcast | Live feed: YouTube Data API v3 (free; needs a Google API key) as primary, RSS fallback; podcast RSS `https://api.riverside.fm/hosting/err1MCUq.rss`; hourly refresh (suggested); keep the last good list if a feed fails | Us | API key | Build | Updates on its own on the live site | API key decision (whose Google account) | Google Cloud, scheduled job | TODO |
| B223 | Podcast | Instagram and X: links (not feeds) unless Fin wants a paid widget billed at cost | Fin decides | – | W2+ | Decided | Decision | – | Links DONE; widget OPTIONAL |
| B224 | **About** | Restyle, copy unchanged; "Secure My Set-Up" opens the quiz | Us | – | W1 | Line-by-line check | – | `about.html` | DONE (draft) |
| B225 | **Not qualified** | Restyle, copy and video unchanged; two proposed "Keep learning" links (podcast, Security Score) | Us | – | W1 | Draft done | Approve links (Q24) | `not-qualified.html` | DONE (draft) |
| B226 | **Link-in-bio** | Restyle as one card over a film still; same three links and words | Us | – | W1 | Draft done | – | `linktree.html` | DONE (draft) |
| B227 | **Privacy** | Restyle; today's text is the **Bali Retreat** policy, shown under a draft note | Us | – | W1 | Draft done | – | `privacy.html` | DONE (draft) |
| B228 | Privacy | New main-site privacy policy covering quiz answers, webinar sign-ups, SMS reminders, GHL, Calendly | Fin provides, or Us draft + Fin approves | Q25 | Before launch | Approved text live | Wording or approval | – | BLOCKED (Fin) |
| B229 | **Partner template** (BRIEF s9, LOOM 2:22) | One page; each partner = a record (name, organisation, photo, optional logo, label, heading, endorsement); keep /call/<slug> URLs; core offer the same for all; buttons "Book Your Free Clarity Call"; reassurance "30-minute call · Confidential · No obligation"; slug passed into the quiz | Us | – | W1 | Draft works with Sean Clarke | Approve wording (Q9) | `partner.html`, `partners.js` | DONE (draft) |
| B230 | Partner | Sean's endorsement: missing full stop; "Gday" vs "G'day"; original photo | Fin (asks Sean) | – | W2 | Answers to Q10 to Q12; photo received | Answers + photo | – | BLOCKED |
| B231 | Partner | Collect each other partner's name, photo or logo, welcome message and their OK on wording | Fin | Partner list (A16) | W2 to W7 | All records filled | Per partner content | Portal | BLOCKED |
| B232 | Partner | Exact partner pages confirmed in the first two weeks (AGR) | Both | A16 | End W2 | List agreed | Decision | – | TODO |
| B233 | **/book** | Same template, no partner intro (live /book wrongly shows Sean's intro) | Us | B229 | W1 | Draft done | Approve (Q13) | `book.html` | DONE (draft) |
| B234 | **Webinar registration** (BRIEF s8, LOOM 4:57) | Working title, supporting line, four pillars, "Reserve my place", host; weekday/date/time pills from one setting (Thursday 5:00 pm Brisbane); visitor's local time; countdown; form (first name, email, optional mobile with SMS consent); focused page | Us | – | W1 | Draft works | Q14 to Q20 | `webinar.html`, `webinar.js` | DONE (draft) |
| B235 | **Webinar confirmed** | "You're registered"; three next steps; Google and Apple/Outlook calendar links for the exact session; joining link by email only; no "reply YES" requirement; welcome video slot | Us | – | W1 | Draft works | Welcome video (Q21) | `webinar-confirmed.html` | DONE (draft) |
| B236 | **Webinar replay** (LOOM 6:48) | Dated label, heading (draft), weekly video embed, booking CTA; live only if Fin wants replays | Us | – | W1 | Draft works | Q19, Q22 | `webinar-replay.html` | DONE (draft) |
| B237 | Webinar | Show "registered" only after GHL confirms the registration; don't claim an email/SMS was sent unless it succeeded (BRIEF s8) | Us | Webinar workflow (D11) | W7 to W9 | Tested | – | GHL form/webhook | TODO |
| B238 | Webinar | Registration attached to the exact occurrence so reminders never drift to another week | Us | D11 | W7 to W9 | Tested across a week rollover | – | GHL custom field | TODO |
| B239 | Webinar | Room for page variants to test later (BRIEF s8) | Us | Launch | M2+ | Variant B possible | Approve variants | GHL / Lovable | OPTIONAL |
| B240 | **Contact page** (BRIEF s10) | Fields (Name, Email, Enquiry type, Message, optional Phone); GHL upsert; notify Fin's chosen inbox; acknowledgement to the enquirer; route partner / client support / sales; spam guard; sensitive-info warning; privacy link | Us | Jesse's decision (include or quote) | – | – | Receiving inbox | GHL form | NOT IN SCOPE until Jesse decides (Fin flagged the cost himself) |
| B241 | Draft 1 → Fin reviews in the hub (26 questions) | Fin | Email A23 | W1 to W2 | Answers saved in the hub | Answers | Review hub | TODO (email unsent) |
| B242 | Draft 2 (round 1 changes applied) | Us | B241 | W2 | New hub round published | – | `site-build/` | TODO |
| B243 | Draft 3 (round 2) | Us | Fin's round-2 feedback | W3 to W4 | Fin approves pages | Feedback | Hub | TODO |
| B244 | Round 3 (on paper; aim not to need it) | Us | – | If needed | – | – | – | TODO |
| B245 | Fin signs off each page for build | Fin | B243 | W4 | Approval per page in the portal | Approval | Portal | TODO |

#### B3. Assets the website needs

| ID | Asset | From | For | Status |
|---|---|---|---|---|
| B301 | New testimonials (text and/or video), each with written permission | Fin | Home carousel, partner pages, call booked (optional) | BLOCKED |
| B302 | Confirmation of "Featured on" relationships (Bitcoin MENA, Bitcoin Magazine) | Fin | Home, About, partner pages | BLOCKED |
| B303 | Sean Clarke's original photo (and any logo) | Fin / Sean | Partner page | BLOCKED |
| B304 | Every other partner's photo/logo, name, welcome message | Fin / partners | Partner pages | BLOCKED |
| B305 | Webinar welcome video | Fin films | Webinar confirmed | BLOCKED |
| B306 | Each week's webinar replay video link | Fin | Replay page | Weekly, once replays are approved |
| B307 | Re-filmed call-booked videos (optional, later) | Fin | Call booked | DEFERRED |
| B308 | Privacy policy wording (or approval of our draft) | Fin | Privacy | BLOCKED |
| B309 | Google API key for YouTube Data API | Fin or Us (decide) | Podcast page | TODO |
| B310 | Original files for Fin's photo, the coffee image, logos | Fin / Lovable project | All pages | TODO (pull from Lovable) |
| B311 | Film frames, design system, scroll film | Us (pitch build) | Home | DONE |

#### B4. Forms on the website (all wired into GHL; AGR Phase 4)

| ID | Form | Fields | Goes to | Status |
|---|---|---|---|---|
| B401 | Book a Call qualification quiz | 6 answers + first name + email (+ partner slug, UTM, correlation ID, hidden) | Supabase → GHL (`sync-to-ghl`) → Calendly | Draft visual DONE; live wiring TODO |
| B402 | Webinar registration | First name, email, optional mobile, SMS consent tick (+ occurrence, source, hidden) | GHL | Draft visual DONE; wiring TODO |
| B403 | Security Score assessment (assess.bitcoinsuccessschool.com) | Existing 6 questions | Already calls `sync-to-ghl`; check, tag, personalise follow-up | Keep as is; connect TODO |
| B404 | Free equipment checklist (/checklist) | Existing | Wire into GHL (AGR: every form on the current site) | TODO (page itself not redesigned) |
| B405 | Contact form | See B240 | GHL | Only if the Contact page is approved |
| B406 | Phone enquiries form (existing app) | Existing | Map in A13; connect if it collects leads | TODO (evaluate) |
| B407 | Partner sign-up / partner portal forms (existing app) | Existing | Map in A16; not rebuilt | TODO (evaluate) |
| B408 | Every form: SMS consent capture where a phone is asked; privacy link; "never share seed phrase / keys / passwords" line | – | – | Draft DONE on quiz and webinar |

#### B5. Booking and calendar embeds

| ID | Task | Who | Depends on | When | Done when | Needs from Fin | Tools | Status |
|---|---|---|---|---|---|---|---|---|
| B501 | Calendly account (overview account + a sub-account per implementation coach) | Fin (or Us with Fin's OK; owner to agree) | A19 | W1 to W2 | Account live | Sign-up + plan payment | Calendly | TODO |
| B502 | Invite Jesse as Calendly admin (jesse@allconvos.ai), by invite not password | Fin | B501 | W1 to W2 | Admin access works | Invite | Calendly | BLOCKED |
| B503 | Clarity Call event type: 30 minutes, Zoom, five-day booking horizon kept, standard Calendly emails kept for now (BRIEF s11) | Both | B501 | W2 | Event works | Coach availability | Calendly, Zoom | TODO |
| B504 | Calendly redirects to bitcoinsuccessschool.com/callbooked after booking | Us | B503 | W3 | Verified with a test booking | – | Calendly | TODO |
| B505 | Embed Calendly inside the quiz's last step (prefill name/email, attribution params) | Us | B503 | W3 to W5 | Test booking from the site | – | Calendly embed | TODO |
| B506 | Direct Calendly links (bypassing the quiz): flag missing answers and ask for a short pre-call form (BRIEF s11) | Both | B503 | W5 | Rule agreed and built | Decision | Calendly, GHL | TODO |
| B507 | Zoom licence per coach (Fin's cost) | Fin | – | W2 | Coaches have Zoom | Licences | Zoom | TODO |
| B508 | Webinar joining links: registrant-specific, by email only | Us | Platform (A18) | W7 to W9 | Tested | Platform access | Zoom Webinars/Meetings, GHL | TODO |

#### B6. Domain, DNS and hosting

| ID | Task | Who | Depends on | When | Done when | Needs from Fin | Tools | Status |
|---|---|---|---|---|---|---|---|---|
| B601 | Draft preview hosting (noindex) | Us | – | Done 17 Oct | https://bss-website-draft.vercel.app live, noindex header | – | Vercel | DONE |
| B602 | Get access to Fin's Lovable project (add Jesse as collaborator, or GitHub sync) | Fin | – | W1 to W2 | Jesse can open the code | Invite | Lovable, GitHub | BLOCKED (asked in the unsent addendum email) |
| B603 | Test the publish route on a **dummy** Lovable account first (Jesse creates account/repo; we prep files) | Both | – | W1 to W2 | The scroll film runs on Lovable hosting | – | Lovable | TODO ("tomorrow", 17 Oct) |
| B604 | Choose the publish route. Recommended: (A) through Fin's Lovable project. Alternatives: (B) Vercel + DNS change (breaks app routes unless split); (C) Cloudflare routing by path; (D) webinar pages as GHL funnels on a `go.` subdomain | Us recommends, Fin approves | B602, B603 | W2 | Route written down | Approval | – | TODO |
| B605 | Rebuild approved pages inside Lovable (React) without breaking existing routes | Us | B245, B604 | W4 to W6 | Every route in section 1 still works | – | Lovable, GitHub | TODO |
| B606 | DNS (Porkbun) and Cloudflare: only if the route needs it (for example a `go.` subdomain for GHL funnels, an email sending subdomain, Calendly or GHL domain verification) | Fin grants, Us set | C-section | W4 to W6 | Records verified | Porkbun access (invite / delegated) | Porkbun, Cloudflare | TODO |
| B607 | Launch day: publish, check every page and route, remove noindex from the live pages only, test forms and bookings, rollback plan ready | Us | All B tests | W6 (agreed day) | Live on bitcoinsuccessschool.com | Fin agrees the day | Lovable | TODO |
| B608 | Keep the old site live until launch day | Us | – | To W6 | – | – | – | Ongoing |
| B609 | Take down the pitch site and draft preview when the engagement ends | Us | – | End of engagement | Vercel projects removed | – | Vercel | TODO (later) |

#### B7. Tracking pixels and analytics

Nothing about ad pixels is in the agreement. Paid ads are excluded (AGR "Not included"). What **is** agreed: source tracking on every link (UTM / tagged links), partner attribution, and a GHL dashboard. Fin mentioned the webinar reference business "crushing it by running ads" (LOOM 4:57), so pixels are likely to come up.

| ID | Task | Who | Depends on | When | Done when | Needs from Fin | Tools | Status |
|---|---|---|---|---|---|---|---|---|
| B701 | Tagged links (UTM + GHL trigger links) for bio, YouTube descriptions, pinned comments, partner links, webinar ads | Us | C-section tags | W5 | Each link carries source; lands tagged in GHL | Channel list | GHL trigger links | TODO |
| B702 | Capture UTM and referrer on every form (hidden fields) | Us | B401, B402 | W5 | Visible on the GHL contact | – | GHL, Lovable | TODO |
| B703 | Meta pixel / Google tag / conversion events (registration, booking) | Us, if Fin asks | Fin's decision | – | – | Ad accounts | Meta, Google | NOT IN SCOPE (ask Fin; quote if wanted) |
| B704 | Site analytics (for example GA4 or Lovable/Cloudflare analytics) | Us | Fin's decision | Launch | – | Decision | – | OPEN QUESTION |

#### B8. Website testing (before launch)

| ID | Test | Who | When | Done when |
|---|---|---|---|---|
| B801 | Every page desktop + phone, no console errors, no sideways scroll | Us | Each round + launch | Passed |
| B802 | Copy check line by line against the live site for every "unchanged" line | Us | Each round | Passed (draft 1 DONE) |
| B803 | Quiz: happy path, both disqualify paths, abandoned at each step, partner attribution, returning contact, changed email in Calendly, duplicate submissions (BRIEF s11) | Us | W5 to W6 | All pass |
| B804 | Simulate a GHL sync failure: answers stay saved, retry works, alert reaches Jesse (and Fin if agreed) | Us | W5 to W6 | Pass |
| B805 | Booking: webhook links the booking to the right contact and answers; reschedule; cancel; five-day horizon; short-notice booking | Us | W5 to W6 | Pass |
| B806 | Webinar: registration, contact creation, attribution, consent, calendar links, private joining link, late registration, next weekly occurrence, duplicate submissions, unsubscribe, move into the call-booked journey (BRIEF s8) | Us | W8 to W9 | Pass |
| B807 | Partner journey for each partner incl. repeat submission and conversion to paid client (BRIEF s9) | Us | W8 to W9 | Pass |
| B808 | Feeds: refresh, a failing feed keeps the last good list | Us | Launch | Pass |
| B809 | Fin's acceptance: Fin clicks through the live staging and books a test call | Fin | W6 | Fin confirms in the portal |
| B810 | Scroll film stress test (no crash, memory flat) on the live build | Us | Launch | Pass (draft DONE) |

### 3.C GoHighLevel (CRM)

Everything here is **(draft)** design until the audit (A14) and Fin's approval of the journey (A12).

#### C1. Sub-account, users, settings

| ID | Task | Who | Depends on | When | Done when | Needs from Fin | Tools | Status |
|---|---|---|---|---|---|---|---|---|
| C101 | Decide existing vs new sub-account (A21); contingency: if Fin's can't be used, Jesse provides a new one and migrates, same scope and price | Both | A20 | End W2 | Written | Decision | GHL | TODO |
| C102 | Jesse's own GHL agency account set up again (he was "setting up my own GoHighLevel again" on 15 Oct) | Us | – | W1 | Agency account ready | – | GHL | IN PROGRESS |
| C103 | Install and configure the BSS snapshot (base CRM) | Us | C101 | W2 to W3 | Snapshot installed | – | GHL snapshots | TODO |
| C104 | Business profile: name, address, time zone **Australia/Brisbane**, logo, colours, email signature | Us | C103 | W2 to W3 | Set | Business details | GHL settings | TODO |
| C105 | Users and permissions: Fin (admin), Jesse (admin), each implementation coach (user, limited: own calendar and assigned contacts), future sales team (user) | Us | C103 | W3 | Each person logs in with the right access | Names + emails of coaches | GHL Team | TODO |
| C106 | Notification settings: who gets new-lead, hot-lead, booking, failure alerts (default Fin + Jesse) | Both | C105 | W3 | Test alerts arrive | Who gets what | GHL | TODO |
| C107 | Ownership in writing: Fin owns his contacts, data, content and GHL account (AGR); after month 8, A$50/month to keep the sub-account if it's Jesse's (WA) | Us | A22 | W1 | In the addendum | – | – | Drafted, unsent |

#### C2. Pipelines and stages (draft)

| ID | Pipeline | Stages (draft) | Moves automatically when |
|---|---|---|---|
| C201 | **Sales: Clarity Call** | New enquiry → Qualified (quiz complete) → Nurturing (no booking yet) → Call booked → Showed → No-show → Considering → Awaiting payment → Client (won) → Lost / Not now | Quiz submitted; nurture start; Calendly webhook booked; attendance marked; post-call outcome chosen by the coach; payment confirmed |
| C202 | **Not qualified** (or a stage + tag in C201) | Disqualified: not buying Bitcoin / Disqualified: wants free only | Quiz disqualifying answer |
| C203 | **Webinar** (per weekly occurrence) | Registered → Attended → Missed → Watched replay → Booked a call | Registration; platform attendance data; replay link clicked; booking |
| C204 | **Client onboarding** | Paid → Welcome sent → Portal access sent → Coach assigned → Implementation call 1 booked → Call 1 done → Call 2 → Call 3 → Call 4 → Bonus call → Master Vault document delivered → In support (12 months) → Renewal / alumni | Payment confirmed; then steps per the onboarding map (D08), "automated" vs "needs Fin" |
| C205 | **Partners** (optional, depends on A16) | Partner applied → Approved → Link live → First referral → Paying referral → Commission due → Paid | Depends on the partner system |
| C206 | Agree the pipelines with Fin before building | Both | A12 | W2 | Approved | – |

#### C3. Custom fields (draft)

| ID | Field | Type | Filled by |
|---|---|---|---|
| C301 | Q1 Have you bought Bitcoin? | Single choice | Quiz |
| C302 | Q2 How are you currently storing your Bitcoin? | Single (or multi, if Q7 b approved) | Quiz |
| C303 | Q3 What's stopped you from setting this up already? | Single | Quiz |
| C304 | Q4 What kind of support are you looking for? | Single | Quiz |
| C305 | Q5 Are you ready to invest in protecting your Bitcoin? | Single | Quiz |
| C306 | Q6 How soon would you want to get started? | Single | Quiz |
| C307 | Qualification summary (one readable paragraph for the coach before the call) | Long text | Workflow |
| C308 | Qualified (yes / no) + disqualify reason | Choice | Workflow |
| C309 | Qualification submitted at; correlation ID | Date; text | Quiz |
| C310 | Lead source (first touch) and latest source | Choice | Forms, trigger links |
| C311 | UTM source / medium / campaign / content; referrer; landing page | Text | Hidden fields |
| C312 | Partner slug; partner name | Text | /call/<slug> |
| C313 | Calendly event URI; invitee URI; call date-time; coach | Text; date | Calendly webhook |
| C314 | Call outcome (showed / no-show / considering / awaiting payment / won / lost) | Choice | Coach |
| C315 | Payment status; payment date; amount; method | Choice; date | Payment integration |
| C316 | Client start date; coach assigned; portal access sent | Date; user; yes/no | Onboarding |
| C317 | Webinar occurrence (date-time); registered at; attended; replay watched | Date; yes/no | Webinar form + platform |
| C318 | Webinar private joining link | URL | Platform integration |
| C319 | SMS consent (yes/no), consent time, consent wording version, source | Choice; date; text | Forms |
| C320 | Security Score result + assessment answers | Number; text | Assessment (`sync-to-ghl`) |
| C321 | Lead score | Number | Scoring rules (C501) |
| C322 | Checklist downloaded at | Date | Checklist form |
| C323 | Reactivation consent confirmed (by Fin) | Yes/no | Import |
| C324 | AI agent handoff summary | Long text | AI agent |

#### C4. Tags (draft)

- **Source:** `src:website`, `src:quiz`, `src:assessment`, `src:checklist`, `src:webinar`, `src:youtube`, `src:instagram`, `src:facebook`, `src:partner:<slug>`, `src:phone`, `src:email`, `src:reactivation`, `src:import:<origin>`
- **Status:** `qualified`, `not-qualified`, `booked`, `showed`, `no-show`, `considering`, `awaiting-payment`, `client`, `alumni`, `lost`
- **Webinar:** `webinar:registered:<date>`, `webinar:attended:<date>`, `webinar:missed:<date>`, `webinar:replay`
- **Consent and safety:** `sms-consent`, `email-unsub`, `dnd`, `do-not-reactivate`
- **Engagement:** `hot`, `warm`, `cold`; `ai-handoff`; `replied`
- **Interest (from the import):** `past-client`, `bali`, `merch-buyer`, `phone-enquiry`, `partner`

#### C5. Smart lists, lead score, dashboard

| ID | Task | Who | Depends on | When | Done when | Status |
|---|---|---|---|---|---|---|
| C501 | Lead score rules **(draft)**: Q1 "Yes" +20; Q5 "Yes, I know the cost…" +20; Q6 "Right away" +15 / "Within 7 days" +10; Q4 "walk me through it" +10; email click +5; reply +15; webinar attended +10; booked +25; 30 days of no activity −10. Hot ≥ 60, warm 30–59, cold < 30 | Us drafts, Fin approves | C3 | W3 | Rules approved and live | TODO |
| C502 | Smart lists: past clients; never booked; came from YouTube; came from each partner; webinar registrants this week; no-shows; hot leads; awaiting payment; SMS-consented and quiet 90+ days (reactivation); not qualified | Us | C3, C4 | W3 | Lists show correct counts | TODO |
| C503 | Dashboard: leads by source, bookings, show rate, conversions to client, partner performance, webinar registrations and attendance | Us | C2 to C5 | W6 (partners W10) | Fin can read it without help | TODO |

#### C6. Calendars

| ID | Task | Who | Depends on | When | Done when | Status |
|---|---|---|---|---|---|---|
| C601 | Calendly ↔ GHL: bookings, reschedules and cancels create and update GHL appointments and contacts | Us | B501, C103 | W5 | A test booking shows in GHL with answers linked | TODO |
| C602 | Decide who sends confirmations and reminders (Calendly's standard emails for now; GHL later) so nobody gets duplicates (BRIEF s11) | Both | C601 | W5 | Written rule | TODO |
| C603 | GHL calendars only if A19 picks GHL native booking (otherwise none, or a mirror calendar for reporting) | Us | A19 | W5 | – | DEPENDS |
| C604 | Coach calendars mapped (each coach's Calendly sub-account → GHL user) | Us | B501, C105 | W5 | Bookings land on the right coach | TODO |

#### C7. Phone, SMS, email deliverability

| ID | Task | Who | Depends on | When | Done when | Needs from Fin | Tools | Status |
|---|---|---|---|---|---|---|---|---|
| C701 | Decide the number's country: depends on where Fin's contacts are (Australia: ACMA sender rules; US: A2P 10DLC; UK: billing address suggests UK too) | Both | A15 | W2 | Decided | Where his audience is | – | OPEN |
| C702 | Buy the dedicated business number in GHL (monthly cost to Fin) | Us | C701 | W3 to W5 | Number live | Approval of cost | GHL LC Phone | TODO |
| C703 | SMS sender registration (A2P 10DLC brand + campaign, or AU/UK sender ID), completed or authorised by Fin | Both | C702 | W3 to W5 | Approved by carriers | Business details, authorisation | GHL, carriers | TODO |
| C704 | Two-way SMS from the GHL inbox; STOP/opt-out handling | Us | C703 | W5 | Test text both ways; STOP works | – | GHL | TODO |
| C705 | Missed-call text-back on the business number | Us | C702 | W5 | Test missed call → text | Wording approval | GHL | TODO |
| C706 | Email sending domain: a dedicated subdomain (for example `mail.bitcoinsuccessschool.com`) with **SPF, DKIM, DMARC** in Porkbun/Cloudflare DNS | Us | DNS access | W3 to W5 | Domain verified; test emails land in the inbox (Fin's Cal.com reminders went to junk) | DNS access | GHL LC Email / Mailgun, Porkbun, Cloudflare | TODO |
| C707 | From name and reply-to address for all emails (Fin's choice) | Fin | – | W3 | Set | Decision | GHL | TODO |
| C708 | Warm up sending gently (small volumes first; reactivation last) | Us | C706 | W5 to W7 | No deliverability alerts | – | GHL | TODO |
| C709 | Conversations inbox: SMS, email, chat widget, IG, FB in one place | Us | C7, C8 | W5 | All channels show in one inbox | – | GHL | TODO |

#### C8. Integrations

| ID | Integration | Task | Who | Depends on | When | Done when | Needs from Fin | Status |
|---|---|---|---|---|---|---|---|---|
| C801 | Calendly | See C601 to C604 | Us | B501 | W5 | Tested | Admin invite | BLOCKED |
| C802 | Website quiz (Supabase `sync-to-ghl`) | Reliable sync with retries, alert, correlation ID (BRIEF s11) | Us | A13 | W4 to W6 | B803/B804 pass | Supabase + Lovable access | BLOCKED |
| C803 | Security Score assessment | Confirm `sync-to-ghl` works; map answers to C320; tag `src:assessment` | Us | A13 | W5 | Test submission lands | Access | BLOCKED |
| C804 | Instagram + Facebook | Connect DMs to the GHL inbox; tag by channel | Both | Fin's Meta Business access | W5 | Test DM lands in GHL | Meta Business admin invite | TODO |
| C805 | YouTube | Trackable lead-capture links in descriptions and pinned comments; YouTube posting via GHL social planner where supported | Us | B701 | W5 | Link click → tagged contact | YouTube channel access (manager) | TODO |
| C806 | Chat widget | Install the GHL chat widget on the site (later the AI agent) | Us | C103, launch | W5 to W6 | Chat message lands in GHL | – | TODO |
| C807 | Payments | Connect how Fin takes payment (Stripe? invoices? other) so "payment confirmed" triggers onboarding and "awaiting payment" reminders | Us | A17 | W7 to W10 | Test payment moves the contact to Client | Payment account access | BLOCKED |
| C808 | Webinar platform (Zoom Meetings or Webinars) | Registration → unique join link → attendance back to GHL | Us | A18 | W7 to W9 | Attendance arrives in GHL | Zoom admin | BLOCKED |
| C809 | Partner system (Fin's app: partners, commissions) | Carry the partner ID from link → quiz → Calendly → GHL → payment; reporting | Us | A16 | W7 to W10 | Partner report shows leads, bookings, paid clients | Explanation + access | BLOCKED |
| C810 | Existing client portal | Link onboarding to it (portal access step); "look at how your portal might integrate with GHL if there is value there down the track" (Jesse, 14 Oct) | Us | A13 | W8 to W10 | Portal access step works | Access | TODO |
| C811 | Zapier or webhooks for anything without a native link | Us | Audits | As needed | Each tested | – | TODO |
| C812 | Any other tool Fin uses today that can be connected (AGR Phase 4) | Us | A15 | W5 | Listed and connected or ruled out | List | TODO |

#### C9. Data imports

| ID | Task | Who | Depends on | When | Done when | Needs from Fin | Status |
|---|---|---|---|---|---|---|---|
| C901 | Export existing contacts from: the existing GHL sub-account; Supabase tables (`qualification_submissions`, `assessment_submissions`, leads, partners, phone enquiries, Bali attendees/bookings, merch buyers, webinar/checklist sign-ups); any other list Fin has | Us | A13, A14 | W3 | All exports in hand | Access + any other lists | BLOCKED |
| C902 | Clean: remove duplicates, merge by email/phone, fix formats, drop junk | Us | C901 | W3 to W4 | Clean file | – | TODO |
| C903 | Tag each contact by source and interest (C4) | Us | C902 | W4 | Tags applied | – | TODO |
| C904 | Record consent status; Fin confirms which contacts agreed to hear from him (for reactivation, AGR) | Fin | C903 | W4 | Consent list confirmed | Confirmation | BLOCKED |
| C905 | Import into GHL; spot-check 20 records with Fin | Both | C904 | W4 | Counts match; Fin happy | Spot-check | TODO |

### 3.D Automations and workflows

All are **(draft)** designs to agree with Fin. **DEFERRED:** Fin said to ignore the automation side until the website and core GHL are done (WA 15 Oct). The planned order is in each row's "When".

**Global stop rules for every workflow:**
- Stop all prospect messages when the contact replies, books, becomes a client, opts out (STOP or unsubscribe), or Fin or the AI hands the conversation to a human.
- Never send acquisition follow-up to existing clients.
- Skip any reminder whose window has already passed.
- Never send missed messages in a burst.
- Quiet hours for SMS: 8 am to 8 pm in the contact's time zone, where known.

| ID | Workflow | Trigger | Steps, waits and timing | Branches | Stops when | Connects to | When | Status |
|---|---|---|---|---|---|---|---|---|
| D01 | **Speed to lead** (instant reply + alert) | New contact from any form, chat, DM, trigger link or call | 0 min: SMS (if consent) + email: thanks, booking link. 0 min: alert to Fin (and Jesse) with source and summary | Has phone + consent → SMS + email; else email only. Already booked → skip | Replies, books | All forms, inbox, C106 | W6 | DEFERRED |
| D02 | **Missed-call text-back** | Missed call on the business number | Within 1 min: SMS "Sorry we missed you…" (draft) with booking link; alert Fin | Existing client → support wording instead of sales | Reply | LC Phone | W5 | TODO |
| D03 | **Qualification submitted** | Quiz submitted (via `sync-to-ghl`) | Upsert contact by correlation ID + email; write C301–C309, source, partner; build summary C307; score C321; pipeline → Qualified | Disqualifying answer → tag `not-qualified`, pipeline Not qualified, enrol D18. Qualified but no booking after 1 hour → enrol D04 | Books | Supabase, GHL | W6 | DEFERRED |
| D04 | **Abandoned booking nudge** | Qualified, no booking 1 hour after the quiz | +1 h email: "Pick a time" + booking link. +24 h SMS (if consent). +48 h email. Then hand to D09 nurture | – | Books, replies | Calendly | W6 | DEFERRED |
| D05 | **Booking confirmed** | Calendly webhook "invitee created" (never a page view or quiz submit) | Link the booking to the contact (correlation ID + invitee ID); pipeline → Call booked; stop D04/D09/D11 prospect messages; enrol D06; alert coach and Fin with the qualification summary | Direct booking with no quiz answers → send the short pre-call form (B506) | – | Calendly, GHL | W6 | DEFERRED |
| D06 | **Call-booked sequence** (smart timing) | D05 | Immediate: confirmation (date, time in contact's zone, Zoom, reschedule/cancel links). Warm-up 1 and 2 spread over the gap before the call. Reminder 24 h before, 1 h before (SMS if consent) | Booking ≥ 3 days away: both warm-ups. 1–3 days: warm-up 1 only, then reminders. < 24 h: confirmation + 1 h reminder only. Five-day horizon kept | Call starts; cancelled; client | Calendly (avoid duplicate reminders, C602) | W6 | DEFERRED |
| D07 | **Reschedule / cancel** | Calendly webhook "rescheduled" / "canceled" | Rescheduled: update the appointment, restart D06 timing from the new time without re-sending warm-ups already sent. Cancelled: stop D06; +2 h email/SMS "want a new time?"; then D09 | – | Rebooks | Calendly | W6 | DEFERRED |
| D08 | **After the sales call** | Coach marks the outcome (or appointment status) | **Showed + won:** → D10 onboarding. **No-show:** +15 min SMS/email rebook link; +1 day; +3 days; then D09. **Considering:** +1 day FAQ-style follow-up; +3 days proof; +7 days door-open. **Awaiting payment:** +1 day reminder with payment link/invoice; +3 days nudge; +7 days alert Fin to call | Per outcome | Pays, rebooks, replies, says no | Payment integration (C807) | W7 to W10 | DEFERRED |
| D09 | **New-lead nurture (6 emails + texts)** | New contact not booked (enquiry, download, checklist, assessment, abandoned quiz, webinar no-show after D11) | 6 emails over about 2 weeks (draft timing: day 0, 2, 4, 7, 10, 14) + 2–3 texts (if consent) | Source-aware intro (YouTube / partner / checklist / assessment) | Books, replies, client, unsubscribes | Booking link | W6 | DEFERRED |
| D10 | **Client onboarding** | Payment confirmed | Pipeline → Client; stop all prospect workflows; welcome email + SMS; portal access step; coach assignment and intro; prompt to book implementation call 1; then steps per the onboarding map: each marked "automated" or "needs Fin" | – | – | Payment, client portal, coach calendars | W8 to W10 | DEFERRED |
| D11 | **Webinar system** | Webinar registration form | Immediate: confirmation email (date, time, calendar links, private join link) + confirmation SMS (if consent). Daily value + reminder emails from the day after registration to the day before. Day before: SMS. 1 hour before: email + SMS with the private link. After: 3–4 days of follow-up (D12) | Late registration: skip passed windows, no bursts. Already registered for this occurrence: no duplicate | Books a call (→ D05), client, unsubscribe | Zoom (attendance), GHL, B238 | W7 to W9 | DEFERRED |
| D12 | **Webinar follow-up** | Webinar end time | Attended: +1 h thanks + key takeaways + book a call; +1 day; +2 days; +3 days. Missed: +1 h "sorry we missed you" + replay (if approved) + next session; +1 day; +2 days; +3 days | Attended vs missed only if attendance data proves reliable (else one neutral version) | Books, client | Zoom attendance | W7 to W9 | DEFERRED |
| D13 | **Weekly webinar rollover** | Each session's end | Next Thursday 5:00 pm Brisbane becomes the open occurrence; registration ties to it; replay page shows the last session | – | – | Webinar pages (one setting) | W7 to W9 | Pages DONE (draft); GHL TODO |
| D14 | **Partner attribution** | Visit to /call/<slug> | Store the slug through quiz → booking → contact → payment; credit the partner; partner report updates | Repeat visitor with a different partner: keep first partner unless Fin decides otherwise | – | C809 | W7 to W10 | DEFERRED |
| D15 | **Database reactivation** | Manual launch on the consented list (C904) | Day 0: short personal SMS (draft). Day 3: one follow-up if no reply. Replies → Fin; booking link | – | Reply, book, STOP | C904 | After C708 (W7+) | DEFERRED |
| D16 | **Review / testimonial request** | Call outcome "showed" (or client milestone, if Fin prefers) | +1 day: email asking for a review or testimonial, with a permission line for website use | Client vs non-client wording | Responds | Review site or form | W8+ | DEFERRED |
| D17 | **Hot lead alert** | Lead score crosses Hot, or a hot lead replies or books | Instant alert to Fin (SMS/app/email) | – | – | C501 | W6 | DEFERRED |
| D18 | **Not qualified** | Disqualifying quiz answer | Email with free resources (podcast, Security Score, checklist) | "Not buying Bitcoin" vs "free only" wording | Unsubscribe | – | W6 | DEFERRED |
| D19 | **Security Score follow-up** | Assessment submitted | Tag; personalised email based on score band; invitation to book | Score bands (draft: low / medium / high risk) | Books | C803 | W6 | DEFERRED |
| D20 | **Checklist download** | Checklist form | Deliver the checklist; enrol in D09 | – | Books | B404 | W6 | DEFERRED |
| D21 | **Sync failure alert** | `sync-to-ghl` fails after retries | Alert Jesse (and Fin if agreed) with the stored record ID | – | – | Supabase, email/SMS | W6 | DEFERRED |
| D22 | **Opt-out handling** | STOP, unsubscribe, DND | Set DND for that channel; remove from all workflows on that channel | – | – | GHL | W5 | TODO |
| D23 | **Pipeline stage moves** | Each event above | Move stage automatically | – | – | C2 | W6 | DEFERRED |
| D24 | **AI agent handoff** | AI decides to hand over, or Fin replies | Assign to Fin; summary to C324; alert; pause the AI on that conversation | – | – | 3.F | W6 | DEFERRED |
| D25 | **Welcome and education flows** (AGR Phase 5) | New contact (by source) | Short welcome + education emails/texts, merged with D09 or separate (decide in mapping) | Source | Books | – | W6 | DEFERRED |
| D26 | **Contact form routing** (only if the Contact page is approved) | Contact form | Upsert; acknowledgement; notify chosen inbox; route partner / client support / sales; no automatic sales nurture | Enquiry type | – | B240 | – | NOT IN SCOPE yet |

### 3.E Email and SMS sequences: every message

Roughly 35 to 45 emails in total (AGR).
- **Written by:** us (allconvos.ai), in Fin's voice, using only claims Fin has approved. Fin is gathering a reference business's webinar and sales-call emails: use them for **structure only**, never their copy or claims (LOOM 7:57).
- **Approved by:** Fin, every message, before it goes live, in the portal.
- Subjects and wording below are **(draft)** purposes, not final copy.

#### E1. Speed to lead (D01)
| # | Channel | Timing | Purpose (draft) |
|---|---|---|---|
| E1.1 | SMS | 0 min | "Thanks for reaching out, here's a link to book your free Clarity Call" |
| E1.2 | Email | 0 min | Thanks + what happens next + booking link |
| E1.3 | Internal alert | 0 min | New lead, source, summary |

#### E2. Missed-call text-back (D02)
| # | Channel | Timing | Purpose (draft) |
|---|---|---|---|
| E2.1 | SMS | ≤ 1 min | Sorry we missed you; reply here or book a time |

#### E3. Abandoned booking (D04)
| # | Channel | Timing | Purpose (draft) |
|---|---|---|---|
| E3.1 | Email | +1 h | "Pick a time for your Clarity Call" |
| E3.2 | SMS | +24 h | Short nudge with link (if consent) |
| E3.3 | Email | +48 h | Last nudge; then nurture |

#### E4. Call-booked sequence (D06, D07)
| # | Channel | Timing | Purpose (draft) |
|---|---|---|---|
| E4.1 | Email | Immediately | Confirmation: date, time (contact's zone + Brisbane), Zoom, reschedule/cancel links (may stay with Calendly for now, C602) |
| E4.2 | SMS | Immediately | Short confirmation (if consent) |
| E4.3 | Email | Warm-up 1 (≥ 1 day before) | What the call covers, how to prepare, what to bring (links to the call-booked page) |
| E4.4 | Email | Warm-up 2 (≥ 2 days before, only if booked ≥ 3 days out) | The offer explained, proof, feeling confident about the conversation |
| E4.5 | Email | 24 h before | Reminder |
| E4.6 | SMS | 1 h before | Reminder with the Zoom link |
| E4.7 | Email | On reschedule | New time confirmed |
| E4.8 | Email + SMS | Cancelled +2 h | Want a new time? |

#### E5. After the sales call (D08)
| # | Branch | Channel | Timing | Purpose (draft) |
|---|---|---|---|---|
| E5.1 | No-show | SMS | +15 min | "We missed you, here's a link to rebook" |
| E5.2 | No-show | Email | +1 day | Rebook |
| E5.3 | No-show | Email | +3 days | Last rebook, then nurture |
| E5.4 | Considering | Email | +1 day | Answers to common questions |
| E5.5 | Considering | Email | +3 days | Proof / client story |
| E5.6 | Considering | Email | +7 days | Door open, reply any time |
| E5.7 | Awaiting payment | Email | +1 day | Payment link / invoice reminder |
| E5.8 | Awaiting payment | SMS | +3 days | Friendly nudge |
| E5.9 | Awaiting payment | Internal alert | +7 days | Fin to call |

#### E6. New-lead nurture: the six emails (D09). Outline from the agreement, "to be agreed with you"
| # | Timing (draft) | Purpose |
|---|---|---|
| E6.1 | Day 0 | Welcome: what to expect |
| E6.2 | Day 2 | The problem: why self-custody feels hard |
| E6.3 | Day 4 | The process: how the path works |
| E6.4 | Day 7 | Proof: others who did it |
| E6.5 | Day 10 | Questions: common doubts answered |
| E6.6 | Day 14 | Book a call: the Clarity Call |
| E6.7–E6.9 | Alongside (draft days 1, 6, 12) | 2–3 matching texts (if consent) |

#### E7. Welcome and education (D25), source-specific openers (draft)
| # | Channel | Timing | Purpose (draft) |
|---|---|---|---|
| E7.1 | Email | Day 0 | YouTube viewer welcome |
| E7.2 | Email | Day 0 | Partner referral welcome (names the partner) |
| E7.3 | Email | Day 0 | Checklist delivery |
| E7.4 | Email | Day 0 | Security Score result explained (per score band) |
| E7.5 | Email | Day 0 | Not qualified: free resources (D18) |

#### E8. Webinar (D11, D12): "roughly 12 to 18 emails" plus attendee and no-show versions (Jesse, 14 Oct)
| # | Channel | Timing | Purpose (draft) |
|---|---|---|---|
| E8.1 | Email | On registration | Confirmed: date, time (Brisbane + local), calendar links, private joining link |
| E8.2 | SMS | On registration | Confirmation (if consent) |
| E8.3–E8.7 | Email | Daily until the day before (only the remaining days; late registrants skip passed ones) | Value + reminder, one per pillar: Build your setup; Use it with confidence; Protect yourself and your family; Fund with confidence; plus a "what to bring" day |
| E8.8 | SMS | Day before | Reminder |
| E8.9 | Email | 1 h before | Join now, private link |
| E8.10 | SMS | 1 h before | Join now |
| E8.11–E8.14 | Email | Attended: +1 h, +1 day, +2 days, +3 days | Takeaways → book a Clarity Call |
| E8.15–E8.18 | Email | Missed: +1 h, +1 day, +2 days, +3 days | Replay (if approved) → next session → book a call |
| Rule | – | – | Up to three SMS per session in total (draft; Fin approves frequency and wording) |

#### E9. Client onboarding (D10), per the map agreed with Fin
| # | Channel | Timing | Purpose (draft) |
|---|---|---|---|
| E9.1 | Email + SMS | On payment | Welcome to Bitcoin Success School |
| E9.2 | Email | On payment | Portal access and how to start |
| E9.3 | Email | +1 day | Meet your implementation coach; book call 1 |
| E9.4 | Email | Before call 1 | How to prepare |
| E9.5+ | Email | Per step | Later steps per the map (monthly group call invites, community join, Master Vault) |

#### E10. Reactivation (D15)
| # | Channel | Timing | Purpose (draft) |
|---|---|---|---|
| E10.1 | SMS | Day 0 | Short personal check-in (draft) |
| E10.2 | SMS | Day 3 | One follow-up |

#### E11. Review request (D16)
| # | Channel | Timing | Purpose (draft) |
|---|---|---|---|
| E11.1 | Email | +1 day after call / milestone | Ask for a review or testimonial; permission for website use |

#### E12. Internal alerts (not client-facing)
- E12.1 New lead · E12.2 Hot lead · E12.3 Booking · E12.4 Sync failure · E12.5 AI handoff · E12.6 Awaiting payment after 7 days

**For every sequence:** we write in the portal → Fin approves each message → we build → test sends to Fin's inbox and phone → Fin approves live → we switch it on.

### 3.F AI lead agent (AGR "The AI lead agent")

| ID | Task | Who | Depends on | When | Done when | Needs from Fin | Tools | Status |
|---|---|---|---|---|---|---|---|---|
| F01 | Agent design: role, goals, tone of voice matched to Fin | Us | A12 | W5 | Design doc approved | Tone examples | Portal | DEFERRED |
| F02 | Knowledge base from Fin-approved wording only: FAQ, offer, guarantee, process | Both | Approved website copy | W5 | KB loaded | Approval of the KB | GHL Conversation AI | DEFERRED |
| F03 | Prompt engineering with rules for what it can and can't say | Us | F01 | W5 | Prompt v1 | – | GHL AI | DEFERRED |
| F04 | Conversational qualification using the six booking-form questions; answers into C301–C306, tags, lead score | Us | C3 | W5 to W6 | Test chats fill fields | – | GHL AI | DEFERRED |
| F05 | Speed to lead on every channel, day or night | Us | C709 | W6 | Replies within seconds | – | GHL | DEFERRED |
| F06 | Channels: website chat widget, SMS, Instagram and Facebook DMs where available | Us | C804, C806 | W6 | Live on each | Meta access | GHL | DEFERRED |
| F07 | Books the Clarity Call into the calendar | Us | C601 | W6 | Test booking via chat | – | Calendly/GHL | DEFERRED |
| F08 | Handoff to Fin with summary + instant alert (D24) | Us | – | W6 | Test handoff | Who it hands to | GHL | DEFERRED |
| F09 | Guardrails: approved answers only; says "I don't know" and brings Fin in; no financial, legal or tax advice; no promises; never asks for or accepts seed phrases, keys or passwords and tells people not to share them; respects opt-outs; stops when booked or Fin takes over | Us | F03 | W5 to W6 | Red-team tests pass | – | – | DEFERRED |
| F10 | Test against real audience questions (list from Fin + inbox history) | Both | F01–F09 | W6 | Test set passes | Real questions | – | DEFERRED |
| F11 | Fin approves the agent before launch | Fin | F10 | W6 | Approval in the portal | Approval | Portal | DEFERRED |
| F12 | Replace the website's placeholder assistant with the live agent | Us | F11, launch | W6 | Live | – | GHL widget | DEFERRED |
| F13 | Review conversations weekly in month 1, then monthly; tune through month 8 | Us | F12 | M2–M8 | Review notes in the portal | – | GHL | DEFERRED |
| F14 | Voice AI phone agent: NOT included; assess in the evaluation; quote separately | Us | A20 | – | – | – | – | NOT IN SCOPE |

### 3.G Funnels, webinars and lead magnets

| ID | Item | What's agreed | Status |
|---|---|---|---|
| G01 | Book a Call funnel (quiz → Calendly → call booked) | In scope (B201–B205, D03–D07) | Draft visual DONE |
| G02 | Weekly webinar funnel (registration → confirmed → reminders → live → replay → book a call) | In scope (B234–B239, D11–D13, E8) | Pages DONE (draft); comms DEFERRED |
| G03 | The webinar presentation itself, and new video production | NOT in scope (BRIEF s8: "does not commission a webinar presentation or new video production") | – |
| G04 | Security Score assessment | Keep as is; connect to CRM, link from the new site, personalise follow-up (AGR) | Link DONE (draft); connection TODO |
| G05 | Free equipment checklist | Page not redesigned (one of the 17 extra pages); its form wired to GHL (AGR Phase 4) | TODO |
| G06 | Partner funnel (/call/<slug> → quiz → booking → paying client) | In scope (B229–B233, D14) | Draft DONE |
| G07 | Old webinar "The Big Calm" page | Replaced by the new weekly webinar pages (it shows a stale 23 April date today) | Draft replacement DONE |

### 3.H Ads

| ID | Item | Status |
|---|---|---|
| H01 | Paid advertising (Google, Meta, other) | **NOT included** (AGR). Optional add-on "Paid advertising: ads to dedicated landing pages, with the CRM tracking which campaigns produce clients", quoted separately |
| H02 | Ad landing pages | Add-on |
| H03 | Pixels / conversion tracking | Not agreed; see B703 |

### 3.I Training, walkthroughs, handover and support

| ID | Task | Who | Depends on | When | Done when | Status |
|---|---|---|---|---|---|---|
| I01 | Walkthrough session for Fin (and coaches): the inbox, pipeline, contact record, qualification summary, booking, dashboard | Both | Core live | W6 | Session held and recorded | TODO |
| I02 | Short written guide (how to do the everyday things) | Us | I01 | W6 to W7 | Guide in the portal | TODO |
| I03 | Coach guide: marking call outcomes, reading the pre-call summary | Us | D08 | W7 to W8 | Guide in the portal | TODO |
| I04 | Webinar weekly routine guide: what Fin does each week (link, replay) | Us | D13 | W9 | Guide in the portal | TODO |
| I05 | Website editing guide (Lovable), since Fin edits the site himself | Us | B113 | W6 | Guide in the portal | TODO |
| I06 | Ongoing support through month 8: requests in the portal, tracked to done | Us | A06 | M2–M8 | Each request closed | TODO |
| I07 | Regular check-ins (customer success): monthly review of leads, bookings, conversions, AI conversations | Both | C503 | Monthly M2–M8 | Check-in notes | TODO |
| I08 | Handover and export if we stop working together: everything built to date handed over (AGR); sub-account exportable, no lock-in (WA) | Us | – | On exit | Export delivered | Commitment |
| I09 | After month 8: sub-account kept for A$50/month if it's Jesse's (WA; GST question open) | Both | A21 | June 2027 | Agreed | Commitment, unsent in writing |

### 3.J Optional add-ons (quoted separately, only if Fin wants)

| ID | Add-on | Notes |
|---|---|---|
| J01 | VSL (Fin to camera, about 90 seconds, with simple animation) | Slot kept in the design. Fin: "can come later" |
| J02 | Content engine (long-form videos cut into short reels) | – |
| J03 | Creative (ad creatives, graphics, page updates) | – |
| J04 | Paid advertising | – |
| J05 | Any of the 17 extra website pages | Monthly fee adjusted in writing first |
| J06 | Further email/SMS sequences beyond those listed | Quoted |
| J07 | Voice AI phone agent | Quoted after the evaluation |
| J08 | Contact page (if Jesse decides it's extra) | Fin raised the cost question himself |
| J09 | Paid Instagram/X feed widget | At cost |

### 3.K Commitments outside the signed page (send the v2.1 addendum, A22)

| # | Commitment | Where it was made | Status |
|---|---|---|---|
| K1 | 3 rounds of website changes | Email 14 Oct ("adjusted from 2 rounds of feedback to 3 rounds for you") | Keep 3 on paper (Jesse 17 Oct) |
| K2 | One or two extra animated scroll steps with text | Email 14 Oct 23:37 | 4th step DONE (draft) |
| K3 | A GHL sub-account included in the package | Email 14 Oct 23:37 | Decide in A21 |
| K4 | Sub-account stays Fin's, exportable, no lock-in; A$50/month after month 8 | WhatsApp 15 Oct | Write down |
| K5 | Fin gets website admin and owns it | WhatsApp 15 Oct | B113 |
| K6 | Handover and export on exit | WhatsApp 15 Oct | I08 |
| K7 | First website version and portal by "Monday" | WhatsApp 15 Oct | Portal sent 16 Oct; draft 1 built 17 Oct |
| K8 | Referral connections and webinar bookings fall within scope, barring "some crazy custom-built thing" | WhatsApp 15 Oct | Matches the agreement's "unknowns" term |
| K9 | Calendly replaces Cal.com | Call 15 Oct | Update documents (A24) |
| K10 | "We can look at how your portal might integrate with GHL if there is value there down the track" | Email 14 Oct | C810 |

---

## 4. What Fin needs to do, in order (plain words, for his portal; all wording **(draft)**)

### 4.1 Give access (W1 to W2). Always "invite Jesse", never send a password.
1. **Your website (Lovable):** add jesse@allconvos.ai to your Lovable project, or connect it to GitHub and add Jesse. *We need this to build the new pages inside your existing site, so nothing you already have breaks.*
2. **Your app's database (Supabase):** add Jesse as a team member. *So we can see what your current system stores and connect it properly.*
3. **GoHighLevel:** add Jesse as an admin user on your current sub-account. *So we can check what's there before we build.*
4. **Calendly:** invite jesse@allconvos.ai as an admin (once your Calendly account is set up). *So bookings flow into your CRM without double reminders.*
5. **Zoom** (if you run webinars on Zoom): add Jesse as an admin, or tell us your plan type. *So we can send private joining links and know who attended.*
6. **Meta (Instagram and Facebook):** add Jesse to your Meta Business account. *So messages land in one inbox.*
7. **YouTube:** add Jesse as a channel manager (optional). *For tracked links and posting through the CRM.*
8. **Domain (Porkbun) and Cloudflare:** add Jesse, or be ready to add a few records we send you. *Needed for email deliverability and launch day.*
9. **How you take payment:** access to whatever you use (for example Stripe). *So "payment confirmed" can start your client onboarding automatically.*
10. **Your existing client portal:** a test login. *So onboarding can point new clients to it.*

### 4.2 Answer questions (W1 to W2)
1. Which platform do you run webinars on? Zoom Meetings or Zoom Webinars?
2. How do you take payment after a sales call?
3. How does your partner and commission setup work today?
4. Which social accounts should we connect?
5. Where are most of your contacts: Australia, the UK, the US? *(This decides how text messaging is registered.)*
6. Who should get alerts for new leads, hot leads and bookings?
7. Who are your implementation coaches (names and emails)?
8. Which contacts have agreed to hear from you? *(Only those get the "reactivation" text.)*
9. Should the Contact page be part of the site? *(Jesse to confirm with you, since it wasn't in the agreement.)*
10. The 26 website questions in the review page (Q1 to Q26).

### 4.3 Send assets
1. New testimonials, with each client's permission to use them on the website.
2. Confirmation that "Featured on" is right for Bitcoin MENA and Bitcoin Magazine.
3. Sean Clarke's original photo (and logo, if any), plus his OK on any wording change.
4. For each other partner: name, photo or logo, and welcome message.
5. A short welcome video for the webinar "You're registered" page.
6. Each week's webinar replay video (if you want replays).
7. Your privacy policy wording, or approval of a draft from us.
8. Your existing email or text wording, and your booking link.
9. Real questions your audience asks (for testing the AI agent).
10. Later, optional: re-filmed call-booked videos.

### 4.4 Review and approve (what you'll be shown)
| # | You approve | You're shown | When |
|---|---|---|---|
| 1 | The customer journey map | One-page diagram | W2 |
| 2 | Findings and recommendation (keep, migrate, replace; sub-account) | Short written report | End W2 |
| 3 | Website round 1 | Review page: every page side by side with your current site, 26 questions | W1 to W2 |
| 4 | Website round 2 (and 3 if needed) | Updated review page | W3 to W4 |
| 5 | Each page signed off for launch | Final preview | W4 |
| 6 | Pipelines, fields, lead score | One-page CRM plan | W2 to W3 |
| 7 | Every email and text | Message by message in the portal | W5 to W9 |
| 8 | The AI agent (tone, knowledge, rules) | Test conversations | W6 |
| 9 | The client onboarding map ("automated" vs "needs you") | Step-by-step map | W8 |
| 10 | Partner tracking plan | Written plan | End W2 |
| 11 | Launch day | Proposed date | W5 |
| 12 | Reactivation text | The two messages + the list it goes to | W7+ |

### 4.5 Attend calls
1. Kick-off (about 45 minutes), W1 to W2.
2. Customer journey and findings walkthrough, end W2.
3. Partner and payment mapping (can be part of 2).
4. Launch walkthrough and training (record it), W6.
5. Onboarding map session, W8.
6. Monthly check-ins, months 2 to 8.

### 4.6 Test things
1. Book a test Clarity Call through the new site, end to end (W5 to W6).
2. Register for a test webinar and check the emails and texts (W8 to W9).
3. Receive every approved email and text on your own email and phone before it goes live.
4. Try the AI agent with your own questions (W6).
5. Click through the live site on launch day.

---

## 5. Branding for Fin's portal (all **(draft)**, nothing agreed with Fin)

| Item | Proposal |
|---|---|
| What Jesse has said | The portal is "your home base for the whole project: your project management, your timeline, your files and approvals, and all our communication in one place" (kickoff email). Jesse's standard portal is built around three products (Respond, Convert, Scale). Fin's is a bespoke fourth, custom to him, with a personal link (WA). |
| Name **(draft)** | **BSS Launchpad**. Alternatives: "BSS Build Room", "The Vault Build" (echoes Fin's "Master Vault"). |
| Tagline **(draft)** | "Your new website and client system, built step by step." Alternative: "Every lead, handled. One system." (the agreement hero). |
| Look | Bitcoin Success School's own look, matching the new website: dark vault-ink (#0E0E10) and graphite (#17181B) with paper (#F6F3EE) panels; orange accent #F89E16; type Instrument Serif (headings), Inter (body), JetBrains Mono (labels). BSS logo. Calm, no flashy motion. "Delivered by allconvos.ai" in the footer. |
| Welcome video **(draft)** | Jesse, about 60 to 90 seconds: thanks; what the portal is; the three things Fin does first (access, the review page, the four quick answers); the timeline at a glance. Not recorded yet. |
| First screen **(draft)** | Welcome video; "Your next three steps"; timeline (phases 1 to 6, with dates); "Waiting on you"; "Waiting on us"; latest update. |
| Intake form **(draft)** | Every question in 4.2, plus: (a) best way and times to reach you; (b) who else approves (if anyone); (c) your goals for the next 6 months (leads, calls, clients); (d) anything you never want said or promised; (e) your tone of voice in three words; (f) links to every place your audience finds you. |
| Access checklist | The ten items in 4.1, each with an "Invite sent" button and a status. |
| Approvals area | One card per item in 4.4: Approve / Request changes, with comments. That's the record of what was agreed (AGR "Communication and approvals"). |
| Support | "Raise a request"; status to done. |

---

## 6. Status today (17 October 2026)

**Done**
- Agreement v2 signed through Stripe; payment 1 of 8 paid; the subscription stops automatically after payment 8.
- Kickoff email sent (15 Oct); portal link sent (16 Oct).
- Every source logged: WhatsApp, Gmail, the call, Fin's Word brief, the Loom transcript, and the Loom frames (44 stills).
- Live-site capture: exact copy and screenshots of every in-scope page.
- **Website draft 1 built: 12 pages + the quiz.**
  - Home, Book a Call quiz, Call booked, Podcast & Videos
  - Partner template (Sean Clarke) and /book
  - Webinar registration, confirmed and replay
  - About, Not qualified, Link-in-bio, Privacy
  - Checked on desktop and phone, with no errors.
- Review hub live at https://bss-website-draft.vercel.app/review.html, with 26 numbered questions. Answers are shared: they save as Fin types, and Jesse sees them.
- Scroll-film Chrome crash fixed, on the draft and on the pitch site.

**In progress**
- Jesse's own GHL agency account being set up again.
- Two Gmail drafts, **not sent**:
  - "Your website brief, next steps and a few things in writing", with the addendum and the Lovable access request;
  - "Your new website: first draft is ready to review", with the hub link and 26 questions.
- Dummy-Lovable publish test (planned).

**Deferred by Fin**
- "Ignore the automation side for now" (with the brief, 15 Oct).
- His order: "web stuff and core GHL first, then after that emails etc."
- VSL: "can come later".
- Re-filmed call-booked videos: later.
- Sales team: later.

**Not started**
- Every GHL task (3.C), automations (3.D), sequences (3.E) and the AI agent (3.F).
- Evaluation (A13 to A20): waiting on access.
- Partner, payment and webinar mapping: waiting on Fin's answers.

---

## 7. Open questions and assumptions

### Open questions (who answers)
1. **Sub-account:** Fin's existing one, or one Jesse provides? A$50/month after month 8: including or excluding GST? (Jesse/Fin)
2. **GST:** Fin's billing address is in the UK. Is GST correct on his invoices? (Jesse's accountant)
3. **Where Fin's contacts are:** decides SMS registration (AU sender rules / US 10DLC / UK). (Fin)
4. **Booking tool:** Calendly confirmed, or GHL native after the research check? Who sets up Calendly and pays for the team plan? (Jesse/Fin)
5. **Webinar platform and licence:** Zoom Meetings or Webinars. Can it send attendance to GHL? (Fin)
6. **How Fin takes payment** after a sales call. (Fin)
7. **Partner, commission and payout setup** today, and whether it's bigger than expected. (Fin, then Jesse flags)
8. **Contact page:** include, or quote? (Jesse)
9. **Publish route:** Lovable (recommended) vs other. (Jesse, after access)
10. **Which inbox gets alerts and contact enquiries.** (Fin)
11. **Pixels and analytics:** wanted? Not in scope today. (Fin)
12. **Who owns the Google API key** for the YouTube feed. (Jesse/Fin)
13. **Replays:** yes or no, and for how long. (Fin, Q19)
14. The 26 website questions in the review hub. (Fin)
15. **Rounds:** 3 on paper, aiming for 2 (decided). Note: the agreement page itself says 2 core / 3 webinar / 2 partner.
16. **Who fixes the dead Cal.com link** in Fin's client portal (CALL 15 Oct). (Fin/Jesse)
17. **Direct Calendly bookings** that skip the quiz: what pre-call form, and how to flag them. (Fin)
18. **Lead score rules and pipeline stages:** drafts here, to approve. (Fin)

### Assumptions in this file
- Week 1 starts on the payment date (15 Oct 2026 AEDT). The calendar dates in section 2 are calculated, not promised.
- Fin approves everything himself unless he names someone else.
- The Brisbane time zone (UTC+10, no daylight saving) is the business time zone for GHL and the webinar.
- Email timing, SMS counts, lead-score numbers, pipeline stages, field and tag names, and the welcome and onboarding steps are our drafts.
- Calendly keeps sending its standard emails until we switch reminders to GHL (BRIEF s11).
- The existing client portal, admin area, merch, Bali and other app tools keep working untouched; none of them is rebuilt.
- Publishing goes through Fin's Lovable project (recommended, not yet confirmed).
