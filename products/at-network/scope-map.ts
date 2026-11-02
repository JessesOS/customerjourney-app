// AT Network: the Scope and Map, shown on "Read your scope and map"
// (atn-scope-map) and readable after it's ticked. Drafted by Claude on
// 2026-10-25 from the agreement scope (AT session CLAUDE.md), Rich's 24 Oct
// voice note and Jesse's draft reply to his nine points. DRAFT: Jesse to edit.
//
// Three "journeys": the website build, the funnel, and the Phase 2 list
// (the parking lot: parked ideas go there, with a notes box, so a "no" has a
// home). Journey ids are the notes fields of lib/onboardingForm.ts
// at-network-scope-notes-v1. No prices anywhere.

import type { JourneyMapContent } from "../../lib/journeyTypes";

export const atNetworkScopeMap: JourneyMapContent = {
  title: "Your scope and map",
  intro:
    "Phase 1 is two tracks. The website build is your new site. The funnel sends your three ads to one main landing page first, so we get a clean read on which ad and audience works, then we learn and iterate. Everything in Phase 1 is below. Updated 3 November from Rich's 31 October brief and Jesse's 2 November reply.",
  draftNote: "", // no banner (Jesse, 2026-10-28)
  notesFormId: "at-network-scope-notes-v1",
  // "Us" read as a team to this client (Jesse, 2026-10-28): say what it means.
  whoLabels: { us: "We build" },
  journeys: [
    {
      id: "website",
      title: "Track 1: the website build",
      tagline: "The First Light site, built page by page. You see it on a review link as it grows.",
      accent: "purple",
      entries: ["Later ad tests", "LinkedIn and search", "The podcast", "Referrals and the Tribe"],
      steps: [
        {
          title: "Homepage",
          detail:
            "A visitor sees straight away who you are, the mission, who it's for, what you get, and the doorway in. The Academy is the main door, with Foundations as its first course. The free month is the sweetener, a welcome bonus, not the hook. Your impact video and the best testimonial videos sit here. The mock-ups include your long version and your simple version, each with a Learn More to every offer page.",
          who: "us",
          branches: [
            { label: "The Ascension pathway", detail: "The free Initiation and the four tiers drawn as a path. Each tier clicks through to its own page, so the site matches what members see inside the platform.", tone: "good" },
          ],
          pills: {
            label: "Links found on this page",
            groups: [
              { label: "Top menu", items: ["Offerings", "The Journey", "Stories", "FAQs", "Podcast", "Academy"] },
              { label: "The offer pages", items: ["Free Initiation", "Tier 1 Tribe", "Tier 2 Academy", "Tier 3 Mentor7 Clan", "Tier 4 Benevolent Executive", "Growth", "Legacy"] },
              { label: "Other links", items: ["The free guide", "The StarMap assessment", "Start your free month"] },
            ],
          },
        },
        {
          title: "Offerings: the overview and five offer pages",
          detail: "One Offerings page with everything in a nutshell: a Learn More to each offer's own page, and a free month button for Tribe and Academy. Then one page each, written from your brief, your copy and Ben's Google Docs: the free Initiation, Tribe, Academy, Mentor7 Clan and the Benevolent Executive. Each membership answers your five questions: who it's for, the pain, what you get, what changes, why upgrade.",
          who: "us",
          branches: [
            { label: "Foundations", detail: "The first course inside the Academy, and the one open today. People join the Academy and start here.", tone: "good" },
            { label: "Growth and Legacy", detail: "A page each, built from the outlines you supply and labelled as future releases: Growth at the end of 2027, Legacy at the end of 2028.", tone: "neutral" },
          ],
        },
        {
          title: "The Journey, Stories and FAQs",
          detail: "The Journey uses the Academy naming. Stories carries the testimonials. FAQs answers what the free month is, how the tiers work and what happens next.",
          who: "us",
        },
        {
          title: "The Foundations VSL",
          detail: "Martyn's full Foundations overview (about 3 minutes 40), re-edited in the First Light look: widescreen for desktop and a phone version, for the Academy page and the landing pages. We do the edit and the finishing (motion, framing, grade, sound, phone version). Want other footage in, say of Rich and Ben? Send it and we'll splice it in. One round of changes. It's a launch gift from us.",
          who: "us",
          pending: { label: "What we'll ask you for", question: "The original files of Martyn's overview (ideally the 4K master or the camera files), and footage of your networking calls (great to have).", whereLabel: "You'll send these", where: "later in this portal, in the stage called \"What we need from you\": one step for each." },
        },
        {
          title: "Podcast section, with a journal",
          detail: "A home for the podcast, with the intro and matching outro we make (one round), and a journal inside it for articles. A separate posting system for articles is Phase 2.",
          who: "us",
        },
        {
          title: "Lead magnets: the eBook page and the StarMap page",
          detail: "An eBook landing page with the free guide PDF, and the StarMap assessment restyled and embedded on its own page.",
          who: "us",
          pending: { question: "That your StarMap questions and report are final.", whereLabel: "You'll confirm this", where: "later in this portal, in the stage called \"What we need from you\": the step \"Confirm your StarMap questions and report\"." },
        },
      ],
      outcome: "A site you own, deployable on your hosting and editable by any developer, handed over on the final instalment.",
    },
    {
      id: "funnel",
      title: "Track 2: the funnel",
      tagline: "Three cold ads, one main landing page first, and a second page ready for the next test, with a tag on every link so we can see what converts.",
      accent: "orange",
      entries: ["Meta ads", "LinkedIn ads", "Retargeting"],
      steps: [
        {
          title: "Three cold video ads",
          detail: "Up to 15 seconds each, vertical, captions burned in. One per audience.",
          who: "us",
          branches: [
            { label: "People in Transition", detail: "Going through a big personal or professional change, looking for clarity and their next chapter.", tone: "good" },
            { label: "Conscious Entrepreneurs and Business Leaders", detail: "Want to bring more consciousness, purpose and meaning into their work.", tone: "neutral" },
            { label: "Struggling and Overwhelmed Business Owners", detail: "Everyday business owners feeling the pressure: burnout, money, isolation.", tone: "neutral" },
          ],
        },
        {
          title: "Where the ads send people",
          detail: "To start, all three ads go to one main landing page: C. One page gives us a clean read on which ad and audience works. Then we learn and iterate, including testing the homepage against it. We put a tag on every link, so you can see which ad, audience and page brought each person in, and which converted. Your ads team can weigh in.",
          branches: [
            { label: "Landing page C: the main page", detail: "The simple version of your site, where the three ads go first.", tone: "good" },
            { label: "Landing page B: no credit card", detail: "Built and ready for the next test. It takes the place of landing page A, the credit-card-first page named in the agreement.", tone: "neutral" },
          ],
        },
        {
          title: "Two statics and the LinkedIn banner",
          detail: "Two still ads and a banner for the company page.",
          who: "us",
        },
        {
          title: "The retargeting ladder",
          detail: "Written as a plan: who sees what after they've visited, and in what order. Your team sets it up in the ad accounts.",
          who: "us",
        },
        {
          title: "Running the ads",
          detail: "Your team runs the ad accounts, the checkout, the tracking and the posting. We hand over the assets and the plan.",
          who: "you",
        },
      ],
      outcome: "Assets and a plan your team can run, with the tags in place to see what converts from day one.",
    },
    {
      id: "phase2",
      title: "Phase 2: things we've talked about, not quoted yet",
      tagline: "Parked here so nothing is lost. We quote them once the site is live. Add your own in the notes.",
      accent: "teal",
      collapsed: true,
      entries: ["Your voice notes and messages", "The kickoff call", "Anything that comes up during the build"],
      steps: [
        { title: "Platform rebrand", detail: "Changing the platform's branding to match the new site." },
        { title: "More from the impact video", detail: "Recolouring or recreating the film, or running it through a model to blend in the branding." },
        { title: "More VSLs, 30-second cuts and portrait clips", detail: "Further VSLs, 30-second cuts and portrait social clips or reels beyond the Foundations VSL." },
        { title: "Avatar videos and a new sales video", detail: "Longer avatar videos come from your videographer. We place them on the site when you have them." },
        { title: "Branding the workbook", detail: "We use the workbook as it is in Phase 1." },
        { title: "Posting system for articles, podcast page", detail: "The journal in the podcast section covers Phase 1." },
        { title: "More static ads", detail: "Static ads for each landing page, beyond the two in Phase 1." },
        { title: "New openings for the video ads", detail: "New front ends on the video ads." },
        { title: "Targeting analysis", detail: "This sits with your ads team." },
        { title: "The Benevolent Executive film", detail: "We'll talk it through separately. It isn't in this portal's scope." },
      ],
      outcome: "One quote, when you're ready, for the ones you want.",
    },
  ],
  alsoRunning: [
    { title: "The podcast intro and outro", detail: "A matching pair in the same look. We agree the look first, then one round of changes on both." },
    { title: "Sales video scripts", detail: "We draft them from your brief, starting with the Academy. You send one combined list of changes: one round on each script. Filming is yours." },
    { title: "Your team owns", detail: "GoHighLevel, checkout, tracking, ad accounts, filming, posting and DNS." },
  ],
  rules: [
    "The list is the list. If it's in Phase 1, it's above. If it isn't, it's a change request: written here, quoted, approved before we start.",
    "One consolidated list per round, from Rich, Martyn and Ben together. Two rounds on each piece, four on the homepage. The last round is the last.",
    "Feedback, files and approvals go through this portal. WhatsApp is for logistics. We reply within one business day.",
    "Nothing starts before the first instalment. We build with the content we have by each due date; only late go-live access holds the launch.",
    "One person signs off. We build once that person has approved in writing.",
  ],
  toConfirm: [
    { question: "Who signs things off? It's Rich, unless you tell us otherwise.", where: "Tell us in Messages" },
    { question: "Phase 1 has three cold ads. The Executive audience isn't one of them. OK?", where: "Tell us in Messages" },
  ],
};
