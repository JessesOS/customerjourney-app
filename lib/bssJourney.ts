import { buildStagesFromTemplate, type JourneyStage, type StageTemplate } from "./journeyEngine";

// BSS Launchpad: the custom journey for Bitcoin Success School (Fin Creighton),
// the first signed client. The tasks, their ids (bss-001 … bss-041) and their
// stages are the CSM dashboard's BSS template (csm-dashboard lib/bssTasks.ts),
// itself drawn line by line from the signed Scope & Agreement v2
// (https://bss-agreement.vercel.app/). Same ids on both sides, so a task ticked
// here and the same task on the CSM board are one task.
//
// Jesse, 2026-10-15: every task is shown to Fin for now. Tasks the team does
// carry `awaitingTeam` and show as "With us"; the team ticks them off in the
// portal admin. The client-facing wording is a first draft for Jesse to check.
// Fin uses Calendly, not Cal.com as the agreement says (Jesse, 2026-10-16).
// Timings follow the agreement: weeks 1–2 onboarding, weeks 2–5 build, week 6
// test and launch, weeks 7–10 partners and webinar, support to month 8.
// Post-Launch is marked ongoing: no days shown, not in the header count.

const team = { awaitingTeam: true } as const;

export const bssJourneyTemplate: StageTemplate[] = [
  {
    id: "onboarding",
    name: "Onboarding",
    dayStart: 1,
    dayEnd: 14,
    blurb: "Two weeks to get to know your business, gather access, and map your customer journey before anything is built.",
    milestones: [
      {
        id: "bss-001",
        title: "Your intake interview",
        detail: "Tell us about your business in your own words, out loud or typed. About 5 minutes. It shapes your CRM, website and AI agent.",
        noteRequired: true,
        interviewAgentId: "agent_3001m4pqxn11ecs9s47qarwvsbp1",
        interview: [
          "What does your business do, and who do you do it for?",
          "Which services or products do you most want more enquiries for?",
          "Who is your ideal customer, and where are they?",
          "Why do customers choose you over someone else?",
          "What happens today when a new enquiry comes in?",
          "What would a great result look like 90 days from now?",
        ],
      },
      { id: "bss-002", title: "Kick-off call & portal walkthrough", detail: "We set you up here, walk through your journey together, and agree the next steps.", ...team },
      {
        id: "bss-003",
        title: "Share your access",
        detail: "Give us access to your existing CRM, your GoHighLevel sub-account, your Calendly account, your domain, your hosting and your social accounts.",
        notePrompt: "Anything we should know about your access?",
        notePlaceholder: "Optional. Please don't put passwords here; we'll arrange access with you directly.",
        important: "Please don't share passwords in this portal. Tick this off once you've given us access, and tell us here if anything is stuck.",
      },
      {
        id: "bss-004",
        title: "Agree your customer journey",
        detail: "We map how a lead becomes a paying client, end to end, and agree it with you before any build starts.",
        notePrompt: "Anything you'd like changed in the journey?",
        notePlaceholder: "Optional — leave blank if it looks right.",
      },
      { id: "bss-005", title: "Audit of your current CRM and GoHighLevel account", detail: "We review what you have and write up what to keep, migrate or replace.", ...team },
      { id: "bss-006", title: "Map where your enquiries come from today", detail: "Every channel a new enquiry arrives through, listed and checked.", ...team },
      { id: "bss-007", title: "Map your partner, payment, webinar and Calendly setup", detail: "How partners and payouts work today, how payment is taken after sales calls, your webinar platform, and Calendly.", ...team },
    ],
    statusNotes: [
      "Nothing is built until your customer journey is mapped and agreed with you.",
      "We'll confirm your partner pages and how payment is taken in these first two weeks.",
    ],
  },
  {
    id: "build",
    name: "Build",
    dayStart: 8,
    dayEnd: 35,
    blurb: "Weeks 2 to 5: your CRM, your website and your messaging channels are built and connected.",
    milestones: [
      { id: "bss-008", title: "Install and set up your GoHighLevel system", detail: "The core CRM set-up your pipeline, automations and pages run on.", ...team },
      { id: "bss-009", title: "Pipeline stages, tags and custom fields", detail: "So every lead lands in the right place with the right details.", ...team },
      { id: "bss-010", title: "Move and tidy your contacts", detail: "Your contacts migrated, cleaned, de-duplicated and tagged by where they came from.", ...team },
      { id: "bss-011", title: "Smart lists and lead scoring", detail: "Hot, warm and cold leads sorted automatically.", ...team },
      { id: "bss-012", title: "Business phone number and missed-call text-back", detail: "A missed call gets a text back straight away.", ...team },
      { id: "bss-013", title: "Calendar, booking, confirmations and reminders", detail: "Connected to Calendly, without doubled-up reminders.", ...team },
      {
        id: "bss-014",
        title: "Review your new website's core pages",
        detail: "Home, About, Podcast & socials, Book a call, Call booked, Not-qualified, Link-in-bio and Privacy, on desktop and mobile. Two rounds of changes are included.",
        notePrompt: "Any changes you'd like to the core pages?",
        notePlaceholder: "Optional — leave blank if they look right.",
      },
      {
        id: "bss-015",
        title: "Review your webinar pages",
        detail: "Your registration and thank-you pages. Three rounds of changes are included.",
        notePrompt: "Any changes you'd like to the webinar pages?",
        notePlaceholder: "Optional — leave blank if they look right.",
      },
      {
        id: "bss-016",
        title: "Review your partner pages",
        detail: "The exact pages are confirmed in your first two weeks. Two rounds of changes are included.",
        notePrompt: "Any changes you'd like to the partner pages?",
        notePlaceholder: "Optional — leave blank if they look right.",
      },
      { id: "bss-017", title: "A space for your video sales letter", detail: "A placeholder slot on the site, ready for a VSL later.", ...team },
      { id: "bss-018", title: "Forms, booking buttons and chat connected", detail: "Every form, booking button and the chat widget wired into your CRM.", ...team },
      { id: "bss-019", title: "Two-way text and email, with consent", detail: "Two-way messaging switched on, with text consent captured on your sign-up forms.", ...team },
      { id: "bss-020", title: "Instagram and Facebook messages connected", detail: "Messages from both arrive in your CRM, tagged by channel.", ...team },
      { id: "bss-021", title: "Trackable YouTube links", detail: "Lead links from YouTube you can track back to the source.", ...team },
    ],
    statusNotes: ["Your existing copy, claims and offers stay as they are unless you approve a change."],
  },
  {
    id: "testing",
    name: "Testing",
    dayStart: 36,
    dayEnd: 39,
    blurb: "Everything is tested end to end before it goes live.",
    milestones: [
      { id: "bss-022", title: "Booked-call sequence tested", detail: "Booking windows, short-notice bookings, reschedules and cancellations all checked.", ...team },
      { id: "bss-023", title: "New-lead warm-up tested", detail: "The six warm-up emails and their texts, drafted with you and approved by you before they go live.", ...team },
      { id: "bss-024", title: "AI lead agent tested", detail: "It qualifies a lead, saves the answers to your CRM and books the call, across chat, text, Instagram and Facebook.", ...team },
      { id: "bss-025", title: "Reactivation and no-show follow-up tested", detail: "Reaching past contacts, and following up no-shows and quiet leads.", ...team },
      { id: "bss-026", title: "Full journey tested", detail: "From form to pipeline to dashboard, end to end.", ...team },
    ],
    statusNotes: ["Your AI lead agent only uses wording you've approved."],
  },
  {
    id: "go-live",
    name: "Go-Live",
    dayStart: 40,
    dayEnd: 42,
    blurb: "Week 6: your website launches on your domain and your automations switch on.",
    milestones: [
      {
        id: "bss-027",
        title: "Confirm your website launch day",
        detail: "We launch your core website on your domain on a day we agree together.",
        notePrompt: "Your preferred launch day",
        notePlaceholder: "e.g. a weekday that suits you",
      },
      { id: "bss-028", title: "Lead nurture sequence live", detail: "New leads are warmed up automatically.", ...team },
      { id: "bss-029", title: "Booked-call sequence live", detail: "Confirmations and reminders run themselves.", ...team },
      { id: "bss-030", title: "AI lead agent live", detail: "On chat, text, Instagram and Facebook.", ...team },
      { id: "bss-031", title: "Reactivation text campaign live", detail: "To past contacts who have already given consent.", ...team },
      { id: "bss-032", title: "Missed-call text-back and two-way messaging live", detail: "Every missed call and message gets a reply.", ...team },
      { id: "bss-033", title: "Pipeline moves itself", detail: "Leads move stage automatically, and follow-ups stop when they reply or book.", ...team },
      { id: "bss-034", title: "Your leads and bookings dashboard live", detail: "Leads, bookings and conversions in one view.", ...team },
    ],
    statusNotes: [],
  },
  {
    id: "post-launch",
    name: "Post-Launch",
    dayStart: 43,
    dayEnd: 240,
    ongoing: true,
    blurb: "Weeks 7 to 10 add partners, webinars and client onboarding. Then we review, tune and support you through month 8.",
    milestones: [
      { id: "bss-035", title: "Partner and referral tracking live", detail: "See which partners bring paying clients, from their link through to payment.", ...team },
      { id: "bss-036", title: "Weekly webinar system live", detail: "Registration confirmations, reminders and follow-up after every webinar, repeating each week.", ...team },
      { id: "bss-037", title: "Client onboarding flow live", detail: "When a payment is confirmed, your new client is onboarded and handed to the implementation coach.", ...team },
      { id: "bss-038", title: "Your walkthrough and written guide", detail: "A live walkthrough plus a short written guide to running everything.", ...team },
      { id: "bss-039", title: "Review real leads and tune", detail: "We look at real leads and AI conversations, and fix what isn't working.", ...team },
      { id: "bss-040", title: "Follow-up after sales calls", detail: "No-show, nurture and unpaid-invoice follow-up.", ...team },
      { id: "bss-041", title: "Ongoing support through month 8", detail: "We keep reviewing and supporting you through month 8.", ...team },
    ],
    statusNotes: [],
  },
];

// The header counts the days to Go-Live (week 6); support after that is ongoing
// and not counted (Jesse, 2026-10-15).
export const bssJourneyTotalDays = 42;

export function buildBssJourneyStages(completedIds: Set<string>, currentDay: number): JourneyStage[] {
  return buildStagesFromTemplate(bssJourneyTemplate, completedIds, currentDay, "bss");
}

/** The parallel workstreams behind the five stages, with their weeks, for the
    "String Theory" view in the progress panel. Groups and windows are the CSM
    board's categories and due windows (csm-dashboard lib/bssTasks.ts), from the
    agreement. `ongoing` runs past week 10 (support to month 8). `after` names
    the workstreams that feed this one, drawn as threads between strings. */
export type Workstream = { id: string; name: string; weekStart: number; weekEnd: number; ongoing?: boolean; taskIds: string[]; after?: string[] };

const ids = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `bss-${String(from + i).padStart(3, "0")}`);

export const bssWorkstreams: Workstream[] = [
  { id: "intake", name: "Intake & kick-off", weekStart: 1, weekEnd: 2, taskIds: ids(1, 3) },
  { id: "mapping", name: "Mapping & audit", weekStart: 1, weekEnd: 2, taskIds: ids(4, 7), after: ["intake"] },
  { id: "crm", name: "CRM build", weekStart: 2, weekEnd: 4, taskIds: ids(8, 13), after: ["mapping"] },
  { id: "website", name: "Website build", weekStart: 2, weekEnd: 4, taskIds: ids(14, 18), after: ["mapping"] },
  { id: "channels", name: "Channel connections", weekStart: 5, weekEnd: 5, taskIds: ids(19, 21), after: ["crm", "website"] },
  { id: "testing", name: "Testing & QA", weekStart: 6, weekEnd: 6, taskIds: ids(22, 26), after: ["channels"] },
  { id: "launch", name: "Launch & automate", weekStart: 6, weekEnd: 6, taskIds: ids(27, 34), after: ["testing"] },
  { id: "partners", name: "Partners, webinar & onboarding", weekStart: 7, weekEnd: 10, taskIds: ids(35, 37), after: ["launch"] },
  { id: "support", name: "Refine & support", weekStart: 7, weekEnd: 10, ongoing: true, taskIds: ids(38, 41), after: ["launch"] },
];
