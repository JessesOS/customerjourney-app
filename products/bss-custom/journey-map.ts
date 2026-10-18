// BSS custom: Fin's customer journey map, shown on "Approve your customer
// journey" (bssc-journey-map). DRAFT (Claude, 2026-10-18), for Jesse to check
// before Fin sees it.
//
// Built from Fin's brief v6 (sections 7 to 11: call-booked page, webinar,
// partner pages, qualification and booking), his Loom of 15 Oct, his email list
// of 14 Oct, and the spec's workflows and messages (products/bss-custom/spec.md,
// 3.C2, 3.D and 3.E). Wording a client sees: plain, short, no RT Digital, no
// prices. Every open question is flagged "To confirm" with where Fin answers it.
// Journey ids are the notes fields of lib/onboardingForm.ts
// bss-journey-map-notes-v1.

import type { JourneyMapContent } from "../../lib/journeyTypes";

const QUESTIONS = "Your answers in \"Answer a few questions\"";
const REVIEW = (q: string) => `Your review page (${q})`;

export const bssJourneyMap: JourneyMapContent = {
  title: "Your customer journey",
  intro:
    "How someone goes from first hearing about Bitcoin Success School to becoming a client. There are three journeys, and most people take the first. Read it through, add a note wherever you'd change something, then approve it. Nothing gets built in GoHighLevel until you do.",
  draftNote: "Our draft, built from your brief, your Loom and our calls. Anything marked \"To confirm\" is waiting on an answer from you.",
  notesFormId: "bss-journey-map-notes-v1",
  journeys: [
    {
      id: "book_a_call",
      title: "Book a Clarity Call",
      tagline: "Organic and referral leads, from the first click to a booked call.",
      accent: "purple",
      entries: ["Your website", "YouTube and the podcast", "Instagram and Facebook", "Partner pages", "Security Score", "Equipment checklist", "A call or message"],
      steps: [
        {
          title: "They take the Book a Call quiz",
          detail:
            "Your six questions, then their name and email. We save their answers straight away, even if they don't book, so nobody slips through. Their source stays with them too: YouTube, a partner, the checklist, and so on.",
          who: "them",
          branches: [
            { label: "A good fit", detail: "Goes straight on to choose a time.", tone: "good" },
            { label: "Not a fit yet", detail: "The same two answers as today lead to your not-qualified page, then one email with free resources: your podcast, the Security Score and the checklist.", tone: "neutral" },
          ],
          pending: { question: "Which of the five suggested quiz improvements you want.", where: REVIEW("question 7") },
        },
        {
          title: "They book in Calendly",
          detail:
            "Calendly opens inside the quiz with their name and email filled in, and your five-day booking window stays. When they book, they land on your call-booked page, and their answers sit on their contact for the call.",
          who: "them",
          messages: [
            { channel: "page", label: "Your call-booked page" },
            { channel: "alert", label: "You (or their coach): new booking, with a short summary of their answers" },
          ],
          pending: { question: "Calendly or GoHighLevel's own booking, and which one sends the confirmations and reminders, so nobody gets them twice.", where: "We'll recommend one after a quick check" },
        },
        {
          title: "Before the call: confirmation, warm-ups and reminders",
          detail:
            "Timed around when they booked, so nothing arrives late or in a burst. Book for tomorrow, and they get the confirmation and the 1-hour reminder only. Reschedule, and the reminders move. Cancel, and they get a \"want a new time?\" message two hours later.",
          timeline: {
            label: "Booked three or more days ahead",
            points: [
              { at: "Booked", label: "Confirmation (email and text)" },
              { at: "2 days before", label: "Why the call is worth it" },
              { at: "1 day before", label: "How to prepare" },
              { at: "24 hours", label: "Reminder email" },
              { at: "1 hour", label: "Text with the Zoom link" },
              { at: "The call", label: "Clarity Call" },
            ],
          },
        },
        {
          title: "Didn't book? A gentle nudge, then six emails",
          detail:
            "If they finish the quiz but don't book: a \"pick a time\" email after an hour, a text the next day, and a last email the day after. Then six emails over two weeks, opening differently for YouTube viewers, partner referrals, checklist downloads and Security Score results. Everything stops the moment they book or reply.",
          timeline: {
            label: "New-lead emails, over two weeks",
            points: [
              { at: "Day 0", label: "Welcome" },
              { at: "Day 2", label: "Why self-custody feels hard" },
              { at: "Day 4", label: "How the path works" },
              { at: "Day 7", label: "People who've done it" },
              { at: "Day 10", label: "Common doubts" },
              { at: "Day 14", label: "Book your Clarity Call" },
            ],
          },
        },
        {
          title: "The Clarity Call",
          detail: "You or your coach see their answers and where they came from before the call. Afterwards you mark how it went, and the right follow-up starts on its own.",
          who: "you",
          branches: [
            { label: "Joined", detail: "Moves on to onboarding (journey 3).", tone: "good" },
            { label: "Didn't show", detail: "A rebook text 15 minutes later, then two emails over three days.", tone: "neutral" },
            { label: "Thinking about it", detail: "Three emails over a week: common questions, a client story, and \"the door's open\".", tone: "neutral" },
            { label: "Waiting on payment", detail: "A reminder the next day, a friendly text after three days, and an alert for you to call after a week.", tone: "neutral" },
          ],
          pending: { question: "How you take payment after a call.", where: QUESTIONS },
        },
        {
          title: "Partner referrals: the same journey, credited to the partner",
          detail:
            "Leads from a partner's page take the same quiz, booking and emails. The partner stays attached from their link to a paying client, so you can see each partner's leads, calls and clients.",
          pending: { question: "How partners are added, tracked and paid today.", where: QUESTIONS },
        },
      ],
      outcome: "A booked Clarity Call, with their answers ready for you.",
    },
    {
      id: "webinar",
      title: "Weekly webinar",
      tagline: "Every Thursday at 5:00 pm Brisbane time, on repeat.",
      accent: "orange",
      entries: ["Your webinar page", "Your socials and YouTube", "Partner pages", "Your email list"],
      steps: [
        {
          title: "They register",
          detail:
            "First name, email, and an optional mobile with text consent. Their place is tied to that week's session, so reminders never drift to another week. The page only says \"You're registered\" once it's really done.",
          who: "them",
          messages: [
            { channel: "page", label: "\"You're registered\" page, with your welcome video" },
            { channel: "email", label: "Your place is confirmed: calendar links and their private joining link" },
            { channel: "text", label: "A short confirmation (if they agreed to texts)" },
          ],
        },
        {
          title: "Leading up to the session",
          detail:
            "One email a day: useful value from your four-step roadmap, plus a reminder to attend. Late sign-ups only get the days that are left, never a pile of catch-up emails. Up to three texts per session.",
          timeline: {
            label: "From sign-up to the live session",
            points: [
              { at: "Sign-up", label: "Confirmed, with the joining link" },
              { at: "Daily", label: "Build your setup" },
              { at: "Daily", label: "Use it with confidence" },
              { at: "Daily", label: "Protect yourself and your family" },
              { at: "Daily", label: "Fund with confidence" },
              { at: "Day before", label: "Reminder text" },
              { at: "1 hour", label: "Join now (email and text)" },
            ],
          },
        },
        {
          title: "After the session",
          detail: "Three to four days of follow-up, each leading to a free Clarity Call.",
          branches: [
            { label: "Attended", detail: "Four emails over three days: the key takeaways, then an invitation to book a Clarity Call.", tone: "good" },
            { label: "Missed it", detail: "Four emails over three days: the replay (if you offer one), the next session, and a Clarity Call.", tone: "neutral" },
          ],
          pending: {
            question: "Zoom Meetings or Zoom Webinars, and whether it can tell us who attended. Until it can, everyone gets one shared follow-up. Also: whether you offer replays, and for how long.",
            where: `${QUESTIONS}, and ${REVIEW("questions 17 and 19")}`,
          },
        },
        {
          title: "Books a call? Over to journey 1",
          detail: "The moment someone books, the webinar emails stop and the call-booked emails take over. Existing clients never get these prompts.",
        },
        {
          title: "Next week, it rolls over",
          detail: "After each session, the pages and emails switch to next Thursday on their own. The replay page shows the latest recording.",
          pending: { question: "The webinar's title, first date and how long it runs.", where: REVIEW("questions 14 to 16") },
        },
      ],
      outcome: "A booked Clarity Call, or a new contact in your new-lead emails.",
    },
    {
      id: "new_clients",
      title: "New client onboarding",
      tagline: "From payment to their first implementation call.",
      accent: "teal",
      entries: ["A payment after a Clarity Call"],
      steps: [
        {
          title: "Payment comes through",
          detail: "They become a client, and every sales email stops.",
          pending: { question: "How you take payment, so a payment can start this on its own.", where: QUESTIONS },
        },
        {
          title: "Welcome",
          detail: "Straight away, a warm welcome and how to get started.",
          messages: [
            { channel: "email", label: "Welcome to Bitcoin Success School (and a text)" },
            { channel: "email", label: "Your client portal: access and how to start" },
          ],
        },
        {
          title: "Meet your coach",
          detail: "The next day, an email introducing their implementation coach, with a link to book call 1. Then a \"how to prepare\" email before that call.",
          pending: { question: "Your implementation coaches' names and emails.", where: QUESTIONS },
        },
        {
          title: "Everything after that",
          detail:
            "Your monthly group calls, the community, the Master Vault document and their later calls. We'll map each step together, marked \"automated\" or \"needs you\", in week 8.",
        },
      ],
      outcome: "A new client, welcomed and booked in with their coach.",
    },
  ],
  alsoRunning: [
    { title: "Instant replies", detail: "Every new enquiry gets a reply within minutes: an email, plus a text if they agreed. You get an alert." },
    { title: "Missed calls", detail: "Miss a call on your business number and they get a text within a minute." },
    { title: "Your AI lead agent", detail: "Answers questions day and night on your website chat, texts, Instagram and Facebook. It asks your six questions, books Clarity Calls, and hands over to you with a summary." },
    { title: "Hot lead alerts", detail: "When a lead looks ready (strong answers, replies, a booking), you get an alert." },
    { title: "Past contacts", detail: "Two short texts to past contacts who agreed to hear from you, from week 7." },
    { title: "Testimonials", detail: "After a call or a milestone, an email asking for a review, with permission to use it on your website." },
  ],
  rules: [
    "Messages stop when someone replies, books, becomes a client or opts out.",
    "Clients never get sales messages.",
    "Texts only go out between 8 am and 8 pm their time.",
    "A reminder whose moment has passed is skipped, never sent late or in a burst.",
    "STOP and unsubscribe work everywhere, straight away.",
    "Every email and text is written in your voice, and you approve each one before it goes live.",
  ],
  toConfirm: [
    { question: "How you take payment after a call", where: QUESTIONS },
    { question: "Zoom Meetings or Zoom Webinars", where: QUESTIONS },
    { question: "How partners are added, tracked and paid", where: QUESTIONS },
    { question: "Your implementation coaches", where: QUESTIONS },
    { question: "Who gets alerts for new leads, hot leads and bookings", where: QUESTIONS },
    { question: "Where most of your contacts are (this decides how texts are registered)", where: QUESTIONS },
    { question: "The quiz improvements you want", where: REVIEW("question 7") },
    { question: "The webinar's title, first date and length", where: REVIEW("questions 14 to 16") },
    { question: "Replays, and for how long", where: REVIEW("question 19") },
    { question: "Calendly or GoHighLevel booking, and who sends the reminders", where: "We'll recommend one" },
    { question: "A short pre-call form for people who book through a Calendly link directly, skipping the quiz", where: "We'll suggest one in your CRM plan" },
    { question: "Which contacts agreed to hear from you", where: "\"Check your contacts before we import them\"" },
  ],
};
