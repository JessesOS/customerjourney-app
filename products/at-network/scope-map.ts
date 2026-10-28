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
    "Phase 1 is two tracks that share one page. The website build is your new site. The funnel sends your ads to landing pages, and half of that traffic to the homepage, so we can see which page works best. Everything in Phase 1 is below.",
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
      entries: ["Ads (half of all ad traffic)", "LinkedIn and search", "The podcast", "Referrals and the Tribe"],
      steps: [
        {
          title: "Homepage",
          detail:
            "A visitor sees straight away who you are, the mission, who it's for, what you get, and the doorway in. Foundations is the main door and the hook. The free month is the sweetener, a welcome bonus, not the hook. Your impact video and the best testimonial videos sit here. One homepage, which is also landing page C.",
          who: "us",
          branches: [
            { label: "The Ascension pathway", detail: "The four levels drawn as a path. Each tier clicks through to its own page, so the site matches what members see inside the platform.", tone: "good" },
          ],
        },
        {
          title: "Offerings: five offer pages",
          detail: "One page per level, written from your copy and Ben's Google Docs. Level 0 Initiations (free), Level 1 Tribe, Level 2 Academy, Level 3 Mentor7, and the Benevolent Executive.",
          who: "us",
          branches: [
            { label: "Foundations", detail: "Its own page, linked from the top menu. It is a course inside Level 2 Academy.", tone: "good" },
            { label: "Growth and Legacy", detail: "A page each, built from the outlines you supply. They are Academy courses too, alongside Foundations, so the pathway is complete.", tone: "neutral" },
          ],
        },
        {
          title: "The Journey, Stories and FAQs",
          detail: "The Journey uses the Academy naming. Stories carries the testimonials. FAQs answers what the free month is, how levels work and what happens next.",
          who: "us",
        },
        {
          title: "The Foundations VSL",
          detail: "Martyn's full Foundations overview (about 3 minutes 40), re-edited in the First Light look: widescreen for desktop and a phone version, for the Foundations page and landing pages A and B. Your editor assembles and locks the edit; we do the finishing (motion, framing, grade, sound, phone version). One round of changes covers the finishing. It's a launch gift from us.",
          who: "us",
          pending: { label: "What we'll ask you for", question: "The original files of Martyn's overview (ideally the 4K master or the camera files), footage of your networking calls (great to have), and your locked edit of the VSL.", whereLabel: "You'll send these", where: "later in this portal, in the stage called \"What we need from you\": one step for each." },
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
      tagline: "Three cold ads, landing pages A and B, and the homepage as landing page C, with a tag on every link so we can see what converts.",
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
          detail: "Your team sets each ad's destination when the campaigns are built. Landing pages A and B, and the homepage as C, are all ready to receive them. We put a tag on every link, so you can see which ad, audience and page brought each person in, and which converted. Sending half the traffic to the homepage is a campaign setting, and it's yours to choose.",
          branches: [
            { label: "Landing pages A and B", detail: "A has the credit card up front, B doesn't. The headline and opening screen change for each audience, using the tag on the ad's link. We agree the three headlines with you at the kickoff.", tone: "good" },
            { label: "Landing page C: the homepage", detail: "The same homepage from Track 1, working alongside A and B.", tone: "neutral" },
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
        { title: "The Benevolent Executive film", detail: "We'll talk it through separately. It isn't in this portal's scope." },
      ],
      outcome: "One quote, when you're ready, for the ones you want.",
    },
  ],
  alsoRunning: [
    { title: "The podcast intro and outro", detail: "A matching pair in the same look. We agree the look first, then one round of changes on both." },
    { title: "Sales video scripts", detail: "Your team drafts one for each offer page (Levels 0 to 3). We give one round of edits." },
    { title: "Your team owns", detail: "GoHighLevel, checkout, tracking, ad accounts, filming, posting and DNS." },
  ],
  rules: [
    "The list is the list. If it's in Phase 1, it's above. If it isn't, it's a change request: written here, quoted, approved before we start.",
    "One consolidated list per round, from Rich, Martyn and Ben together. Two rounds on each piece. Round 2 is the last.",
    "Feedback, files and approvals go through this portal. WhatsApp is for logistics. We reply within one business day.",
    "Nothing starts before the first instalment. We build with the content we have by each due date; only late go-live access holds the launch.",
    "One person signs off. We build once that person has approved in writing.",
  ],
  toConfirm: [
    { question: "Who signs things off: Rich alone?", where: "The kickoff call, then the kickoff summary" },
    { question: "Phase 1 has three cold ads. The Executive audience isn't one of them. OK?", where: "The kickoff call" },
    { question: "The homepage is also landing page C. It's one homepage, not two versions.", where: "The kickoff call" },
  ],
};
