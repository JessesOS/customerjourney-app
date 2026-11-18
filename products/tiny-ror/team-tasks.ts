// Tiny ROR: the team side. One task behind each client step (the bookmark step
// is client-only), plus the drafting work behind the policy and consent steps.
// From spec.md and tiny-ror/brief.md (sections 9 and 10). Edited by hand: ask
// Claude. Bump the product version in index.ts with every change.

import type { TeamTask } from "../types";

const R = "Jesse Allan";
const t = (
  id: string, title: string, stage: TeamTask["stage"], category: string, step: string | undefined,
  due: string, notes = "", dependencies: string[] = [],
): TeamTask => ({ id, title, notes, stage, category, step, role: R, priority: "normal", due, dependencies });

export const tinyRorTeamTasks: TeamTask[] = [
  // ── This week ──
  t("tror-t01", "Meet Luisa and go through the whole list", "onboarding", "Kickoff", "tror-book", "Days 1-7", "About an hour. Buy the domain together if her ABN is ready. Set up Instagram and Facebook with her if she hasn't."),
  t("tror-t02", "Send Luisa the Claude interview message; file what comes back", "onboarding", "Interview", "tror-interview", "Days 3-10", "The message is tiny-ror/luisa-interview-prompt.md. File her interview in tiny-ror/notes/YYYY-MM-DD-luisa-interview.md. If she sends audio instead: Whisper, and the audio goes to ~/Master/Archive/videos/rorthejourney/, never git."),
  // ── Must-haves before we launch ──
  t("tror-t03", "Put the venue details into the site and the booking page", "build", "Must-haves", "tror-venue", "Days 3-14"),
  t("tror-t04", "Put the class day, time and length into the offer and the site", "build", "Must-haves", "tror-class-time", "Days 3-14"),
  t("tror-t05", "Add the WWCC number to the site", "build", "Must-haves", "tror-wwcc", "Days 3-14"),
  t("tror-t06", "Check the insurance covers children's group classes; file the certificate", "build", "Must-haves", "tror-insurance", "Days 3-14"),
  t("tror-t07", "Record the ABN and business name; use it for the domain", "build", "Must-haves", "tror-abn", "Days 3-10"),
  t("tror-t08", "Draft the child safe policy (NSW Child Safe Standards, with an incident process) and paste it into the step", "build", "Policies", "tror-child-safe", "Days 1-7", "Paste into the step's content in admin. She presses Looks right or sends changes."),
  t("tror-t09", "Make Luisa's changes to the child safe policy and publish it", "build", "Policies", "tror-child-safe", "Days 7-14", "", ["tror-t08"]),
  t("tror-t10", "Draft the photo and video consent form and paste it into the step", "build", "Policies", "tror-consent", "Days 1-7", "Used for the staged shoot and the tasters. Paste into the step's content in admin."),
  t("tror-t11", "Make Luisa's changes to the consent form and set it up for parents to sign", "build", "Policies", "tror-consent", "Days 7-14", "", ["tror-t10"]),
  t("tror-t12", "Put the taster dates into the booking page", "build", "Must-haves", "tror-taster-dates", "Days 7-21"),
  t("tror-t13", "Turn her refund, missed-class and sick-day rules into a short policy", "build", "Policies", "tror-policies", "Days 7-14"),
  // ── The offer ──
  t("tror-t14", "Update the site copy: parents stay or drop off", "testing", "Offer", "tror-parents-stay", "Days 7-14"),
  t("tror-t15", "Put the real tool names into the offer and the site", "testing", "Offer", "tror-tools", "Days 7-14"),
  t("tror-t16", "Lock the prices in tiny-ror/offer.md", "testing", "Offer", "tror-prices", "Days 7-12", "Brief section 10: offer locked by 20 Nov."),
  t("tror-t17", "Call the local parents (15 minutes each) and write up what they said", "testing", "Offer", "tror-parent-chats", "Days 7-14", "Notes to tiny-ror/notes/, one file per call."),
  // ── Accounts to set up ──
  t("tror-t18", "Buy the new Tiny ROR web address with Luisa, in her Porkbun account", "go-live", "Accounts", "tror-domain", "Days 3-14", "tinyror.com.au needs her ABN. Check Porkbun sells .com.au first; if not, pick the registrar with Jesse.", ["tror-t07", "tror-t29"]),
  t("tror-t19", "Add the Instagram and Facebook links to the site footer", "go-live", "Accounts", "tror-socials", "Days 7-21"),
  t("tror-t20", "Connect her Stripe account to the Tiny ROR workspace (she logs in herself)", "go-live", "Accounts", "tror-stripe", "Days 14-21", "No keys in files or messages. The Tiny ROR workspace isn't created yet: ask Jesse first."),
  t("tror-t21", "Send Luisa the Meta Business ID; accept the partner request; check the page, Instagram and ad account", "go-live", "Accounts", "tror-meta", "Days 7-21", "She adds her own card. Set a daily cap and an end date before any ad runs."),
  t("tror-t22", "Accept the manager invite; check and refine her Google listing (free, no Google Ads)", "go-live", "Accounts", "tror-google-listing", "Days 7-21", "Catch the other spelling of the name (\"roar\")."),
  t("tror-t25", "Accept the Wix invite; copy her current site, ready to move to Porkbun", "go-live", "Accounts", "tror-wix", "Days 7-14"),
  t("tror-t26", "Move her web address from Wix to Porkbun with Luisa, on a call; then move the site", "go-live", "Accounts", "tror-domain-move", "Days 14-28", "She logs in to both; never take a login. Check the address is over 60 days old and unlocked. Note her email records before the move so email keeps working.", ["tror-t29"]),
  t("tror-t29", "Check her Porkbun account is open, in her name, with two-step login", "go-live", "Accounts", "tror-porkbun-account", "Days 7-14"),
  t("tror-t27", "Put her phone and email on the site, the messages and the concierge", "go-live", "Accounts", "tror-contact", "Days 14-21"),
  // ── Photos ──
  t("tror-t23", "Book the photo shoot with the families and get their consent forms signed", "post-launch", "Photos", "tror-shoot-families", "Days 14-28", "About 6 Dec. Consent first, every family.", ["tror-t11"]),
  t("tror-t24", "Pick the photos of Luisa for the About section", "post-launch", "Photos", "tror-photos-luisa", "Days 14-28"),
  t("tror-t28", "File her logo and brand files, or lift them from the site", "post-launch", "Photos", "tror-brand-files", "Days 14-28"),
];
