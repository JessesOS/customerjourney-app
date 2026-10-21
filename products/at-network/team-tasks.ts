// AT Network: the team side. The deliverables behind each client step, from the
// handover ("Team deliverables behind each step"). Edited by hand: ask Claude.
// Bump the product version in index.ts with every change.
// Due windows are PLACEHOLDERS: the spec's start date and total days are OPEN.

import type { TeamTask } from "../types";

const R = "Jesse Allan";
const t = (
  id: string, title: string, stage: TeamTask["stage"], category: string, step: string | undefined,
  due: string, notes = "", dependencies: string[] = [],
): TeamTask => ({ id, title, notes, stage, category, step, role: R, priority: "normal", due, dependencies });

export const atNetworkTeamTasks: TeamTask[] = [
  // ── Get started ──
  t("atn-t01", "Send the Statement of Work and first invoice", "onboarding", "Admin", undefined, "Days 1-2"),
  t("atn-t02", "Confirm payment 1 in admin and tick the step (nothing starts before this)", "onboarding", "Admin", "atn-pay-1", "Days 1-3", "Jesse ticks it in admin.", ["atn-t01"]),
  t("atn-t05", "Check the typed-name acceptance and file the dated record", "onboarding", "Admin", "atn-how-we-work", "Days 1-2", "The typed name is stored with the time.", ["atn-t01"]),
  t("atn-t06", "Check the photos of Rich are usable; ask for more if not", "onboarding", "Content", "atn-photos-rich", "Days 3-7"),
  t("atn-t07", "Read the Academy course details; log gaps", "onboarding", "Content", "atn-academy", "Days 3-7"),
  t("atn-t08", "Set up the GHL contact person's access", "onboarding", "Admin", "atn-ghl-contact", "Days 3-7"),
  t("atn-t03", "Review the StarMap public artifact before it goes to the client", "onboarding", "StarMap", "atn-starmap", "Days 3-7", "Jesse reviews first. Page is confirmed once the questions are seen."),
  t("atn-t04", "Read the package breakdown and photos; log gaps", "onboarding", "Content", "atn-package-breakdown", "Days 3-7"),
  // ── Build ──
  t("atn-t10", "Build the First Light site: homepage, Offerings, The journey, Stories, FAQs", "build", "Site", "atn-review-site", "Days 8-24", "", ["atn-t02"]),
  t("atn-t11", "Build the five offer pages", "build", "Site", "atn-review-site", "Days 12-24"),
  t("atn-t12", "Build the StarMap page", "build", "Site", "atn-review-site", "Days 12-24", "Confirm once the questions are seen.", ["atn-t03"]),
  t("atn-t13", "Build the eBook landing page and the free guide PDF", "build", "Site", "atn-review-site", "Days 12-24"),
  t("atn-t14", "Build landing pages A, B and C", "build", "Site", "atn-review-site", "Days 16-26", "Sales video scripts come from the client (atn-scripts).", ["atn-t10"]),
  t("atn-t15", "Build the simple CMS", "build", "Site", "atn-review-site", "Days 16-26", "Field list is OPEN."),
  t("atn-t16", "Shape the client's script drafts with them", "build", "Video", "atn-scripts", "Days 10-20"),
  t("atn-t17", "Plan the shoot with the videographer", "build", "Video", "atn-videographer", "Days 10-20"),
  t("atn-t18", "Open the site review link and send it to the client", "build", "Review", "atn-review-site", "Day 26", "Opening the link makes payment 2 due.", ["atn-t10", "atn-t11", "atn-t13", "atn-t14"]),
  // ── Ads and review ──
  t("atn-t20", "Make three cold video ads (up to 15 s, vertical, captions burned in)", "testing", "Ads", "atn-review-ads", "Days 26-34"),
  t("atn-t21", "Make two statics and the LinkedIn banner", "testing", "Ads", "atn-review-ads", "Days 26-34"),
  t("atn-t22", "Write the retargeting ladder as a plan", "testing", "Ads", "atn-review-ads", "Days 26-34"),
  t("atn-t23", "Produce the podcast intro and outro", "testing", "Ads", "atn-review-ads", "Days 26-34"),
  t("atn-t24", "Confirm payment 2 in admin and tick the step", "testing", "Admin", "atn-pay-2", "Days 26-30", "Jesse ticks it in admin.", ["atn-t18"]),
  t("atn-t25", "Open the ads review link and send it to the client", "testing", "Review", "atn-review-ads", "Day 35", "", ["atn-t20", "atn-t21"]),
  // ── Final review ──
  t("atn-t30", "Apply the SEO checklist", "go-live", "Final", "atn-review-final", "Days 35-39"),
  t("atn-t31", "Prepare the final files", "go-live", "Final", "atn-review-final", "Days 35-39"),
  t("atn-t32", "Open the final review link and send it; the 5-business-day clock starts", "go-live", "Review", "atn-review-final", "Day 36", "Opening the link makes payment 3 due.", ["atn-t30", "atn-t31"]),
  t("atn-t33", "Confirm the final payment in admin and tick the step", "go-live", "Admin", "atn-pay-final", "Days 36-40", "Jesse ticks it in admin.", ["atn-t32"]),
  // ── Handover ──
  t("atn-t40", "Hand over the finished site files and assets", "post-launch", "Handover", undefined, "Day 41", "Deployable on GoDaddy and editable by any developer. Jesse keeps build scripts, templates, design system source, prompts, workflows and the AI pipeline.", ["atn-t33"]),
  t("atn-t41", "Go live on the client's domain", "post-launch", "Handover", "atn-domain-access", "Days 41-42", "Hosting of the live domain is OPEN.", ["atn-t33"]),
];
