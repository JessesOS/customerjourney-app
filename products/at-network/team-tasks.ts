// AT Network: the team side. The deliverables behind each client step, from the
// handover ("Team deliverables behind each step") and the 2026-10-25
// restructure. Edited by hand: ask Claude. Bump the product version in index.ts
// with every change. Due windows are PLACEHOLDERS: start date and total days are OPEN.

import type { TeamTask } from "../types";

const R = "Jesse Allan";
const t = (
  id: string, title: string, stage: TeamTask["stage"], category: string, step: string | undefined,
  due: string, notes = "", dependencies: string[] = [],
): TeamTask => ({ id, title, notes, stage, category, step, role: R, priority: "normal", due, dependencies });

export const atNetworkTeamTasks: TeamTask[] = [
  // ── Sign and start ──
  t("atn-t01", "Send the agreement and the first invoice to Ben", "onboarding", "Admin", undefined, "Days 1-2", "Chase Ben as well as Rich. Nothing starts before payment 1."),
  t("atn-t05", "Check the signed acceptance and save its printable copy", "onboarding", "Admin", "atn-agreement", "Days 1-2", "The board's Agreement section lists each acceptance with its record link. Email and PDF copies come later.", ["atn-t01"]),
  t("atn-t02", "Confirm payment 1 in admin and tick the step", "onboarding", "Admin", "atn-pay-1", "Days 1-3", "Jesse ticks it in admin.", ["atn-t01"]),
  t("atn-t09", "Edit the Scope and Map before the client reads it", "onboarding", "Kickoff", "atn-scope-map", "Days 1-3", "products/at-network/scope-map.ts is Claude's draft. Check the In, Out and Phase 2 lists against the agreement."),
  t("atn-t10", "Book the kickoff call and send the agenda", "onboarding", "Kickoff", "atn-book-kickoff", "Days 2-5", "Agenda: look inside the platform, lock the homepage brief, confirm who signs off, the trial length, three ads not four, one homepage.", ["atn-t02"]),
  t("atn-t11", "Run the kickoff call", "onboarding", "Kickoff", "atn-book-kickoff", "Days 3-7", "", ["atn-t10"]),
  t("atn-t12", "Write the kickoff summary and paste it into the step", "onboarding", "Kickoff", "atn-kickoff-summary", "Days 3-7", "One \"locked on\" message: every decision from the call, the open answers, the approver. Paste into the step's content in admin. The approver types their name to approve: that's the brief.", ["atn-t11"]),
  // ── What we need from you ──
  t("atn-t03", "Add Martyn's StarMap link to the step; build the page once he confirms Final", "build", "Inputs", "atn-starmap", "Days 3-7", "The artifact link goes in guideUrl. Build only after his Final."),
  t("atn-t04", "Read Ben's package breakdown (received 24 Oct); log gaps", "build", "Inputs", "atn-package-breakdown", "Days 3-7", "Tick the client's confirmation step in admin if they don't."),
  t("atn-t13", "Put the prices and free-month terms into the offer pages and landing pages A and B", "build", "Inputs", "atn-prices", "Days 3-10"),
  t("atn-t19", "Place the Benevolent Executive Program page copy", "build", "Inputs", "atn-exec-copy", "Days 3-10"),
  t("atn-t20", "Link the StarMap page from where Rich says", "build", "Inputs", "atn-starmap-link", "Days 3-10"),
  t("atn-t06", "Check the photos of Rich are usable; ask for more if not", "build", "Inputs", "atn-photos-rich", "Days 3-7"),
  t("atn-t07", "Read the Academy course details and the Foundations outline; log gaps", "build", "Inputs", "atn-academy", "Days 3-7"),
  t("atn-t14", "File the workbook as received (no branding in Phase 1)", "build", "Inputs", "atn-workbook", "Days 3-10"),
  t("atn-t18", "Review the stinger references and brief the intro ident", "build", "Inputs", "atn-stinger-ref", "Days 3-10", "Intro only in Phase 1 (one round). The outro is Phase 2."),
  t("atn-t08", "Set up the GHL contact person's access", "build", "Admin", "atn-ghl-contact", "Days 3-7"),
  t("atn-t16", "Give one round of edits on the client's script drafts", "build", "Video", "atn-scripts", "Days 10-20"),
  // ── Website build ──
  t("atn-t29", "Build the First Light site: homepage, Offerings, The Journey, Stories, FAQs", "testing", "Site", "atn-review-site", "Days 8-24", "", ["atn-t12"]),
  t("atn-t21", "Build the five offer pages, the Foundations page and the Growth and Legacy pages", "testing", "Site", "atn-review-site", "Days 12-24", "Growth and Legacy from Rich's outlines (agreement A2).", ["atn-t13"]),
  t("atn-t22", "Build the StarMap page", "testing", "Site", "atn-review-site", "Days 12-24", "Confirm once the questions are seen.", ["atn-t03"]),
  t("atn-t23", "Build the eBook landing page, the free guide PDF and the podcast section with its journal", "testing", "Site", "atn-review-site", "Days 12-24"),
  t("atn-t24", "Set up the content editor and the SEO basics", "testing", "Site", "atn-review-site", "Days 16-26"),
  t("atn-t25", "Open the site review link and send it; payment 2 is now due", "testing", "Review", "atn-review-site", "Day 26", "Check every page on phones and desktop first. Opening the link makes payment 2 due.", ["atn-t29", "atn-t21", "atn-t23"]),
  t("atn-t26", "Confirm payment 2 in admin and tick the step", "testing", "Admin", "atn-pay-2", "Days 26-30", "Jesse ticks it in admin.", ["atn-t25"]),
  t("atn-t27", "Make the round 1 changes to the site and reopen the link", "testing", "Review", "atn-review-site-2", "Days 27-30", "", ["atn-t25"]),
  t("atn-t28", "Make the round 2 changes and ask for sign-off", "testing", "Review", "atn-signoff-site", "Days 30-33", "After sign-off, site changes are change requests.", ["atn-t27"]),
  // ── Funnel and ads ──
  t("atn-t30", "Build landing pages A, B and C with the tags", "go-live", "Funnel", "atn-review-landing", "Days 20-30", "One per ad. Half the traffic to the homepage. UTM on every link.", ["atn-t16"]),
  t("atn-t31", "Make three cold video ads (up to 15 s, vertical, captions burned in)", "go-live", "Ads", "atn-review-ads", "Days 20-30", "Foundations, Tribe, Mentor7."),
  t("atn-t32", "Make two statics and the LinkedIn banner", "go-live", "Ads", "atn-review-ads", "Days 20-30"),
  t("atn-t33", "Write the retargeting ladder as a plan", "go-live", "Ads", "atn-review-ads", "Days 24-30"),
  t("atn-t34", "Produce the podcast intro stinger (one round)", "go-live", "Ads", "atn-review-ads", "Days 24-30", "", ["atn-t18"]),
  t("atn-t35", "Open the funnel review link and send it", "go-live", "Review", "atn-review-landing", "Day 30", "", ["atn-t30", "atn-t31", "atn-t32"]),
  t("atn-t36", "Make the round 1 changes to the funnel and reopen the link", "go-live", "Review", "atn-review-funnel-2", "Days 31-33", "", ["atn-t35"]),
  t("atn-t37", "Make the round 2 changes and ask for sign-off", "go-live", "Review", "atn-signoff-funnel", "Days 33-34", "", ["atn-t36"]),
  // ── Final review and handover ──
  t("atn-t40", "Prepare the final files and apply the SEO checklist", "post-launch", "Final", "atn-review-final", "Days 34-38"),
  t("atn-t41", "Open the final review link and send it; the 5-business-day clock starts; payment 3 is due", "post-launch", "Review", "atn-review-final", "Day 38", "", ["atn-t40"]),
  t("atn-t42", "Confirm the final payment in admin and tick the step", "post-launch", "Admin", "atn-pay-final", "Days 38-42", "Jesse ticks it in admin.", ["atn-t41"]),
  t("atn-t43", "Go live on the client's domain", "post-launch", "Handover", "atn-domain-access", "Days 41-42", "Hosting of the live domain is OPEN.", ["atn-t42"]),
  t("atn-t44", "Hand over the finished site files, assets and access", "post-launch", "Handover", "atn-handover", "Day 42", "Deployable on their hosting, editable by any developer. Jesse keeps build scripts, templates, design system source, prompts, workflows and the AI pipeline.", ["atn-t42"]),
];
