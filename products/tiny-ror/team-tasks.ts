// Tiny ROR: the team side. One task behind each client step (the bookmark step
// is client-only), plus the drafting work behind the policy and consent steps.
// From spec.md and tiny-ror/brief.md (sections 9 and 10). Edited by hand: ask
// Claude. Bump the product version in index.ts with every change.
// Each access task says how Jesse can tell it is done from his own side ("Done when"):
// her tick is not the test. Days count from her start date (23 Nov 2026); ads are
// planned for day 17 (9 Dec), the go or no-go check for day 10 (2 Dec).

import type { TeamTask } from "../types";

const R = "Jesse Allan";
const t = (
  id: string, title: string, stage: TeamTask["stage"], category: string, step: string | undefined,
  due: string, notes = "", dependencies: string[] = [],
): TeamTask => ({ id, title, notes, stage, category, step, role: R, priority: "normal", due, dependencies });

export const tinyRorTeamTasks: TeamTask[] = [
  // ── Start here ──
  t("tror-t01", "Go through the list with Luisa when she needs it (no booking step: Jesse, 2026-11-19)", "onboarding", "Kickoff", undefined, "Days 1-7", "Do the Meta, Porkbun and new web address steps with her on a call if she gets stuck."),
  t("tror-t02", "Send Luisa the Claude interview message; file what comes back", "onboarding", "Interview", "tror-interview", "Days 1-5", "The message is tiny-ror/luisa-interview-prompt.md. File her interview in tiny-ror/notes/YYYY-MM-DD-luisa-interview.md. If she sends audio instead: Whisper, and the audio goes to ~/Master/Archive/videos/rorthejourney/, never git."),
  // ── Accounts and access ──
  t("tror-t07", "Record the ABN and business name; use it for the web address, Stripe and Meta's tax question", "build", "Accounts", "tror-abn", "Days 1-2", "Done when: the ABN shows as active on abr.business.gov.au under the name she gave."),
  t("tror-t30", "Check she has two-step login on before the partner step", "build", "Accounts", "tror-fb-2step", "Days 1-2", "Meta lists it as a prerequisite for partner access. Done when: the partner request in tror-meta goes through."),
  t("tror-t31", "Check her Meta business account exists and she has full control", "build", "Accounts", "tror-meta-account", "Days 1-3", "Open it early: a new business starts with one ad account and a low daily spend limit that rises with payment history (Meta publishes no figure). Done when: she can read you her Business ID."),
  t("tror-t21", "Send Luisa the Meta Business ID; then create the ad account, link the page and Instagram, and set up tracking in her account", "build", "Accounts", "tror-meta", "Days 2-5", "Done when: her page, Instagram and ad account show under Partners in your own Business Settings, with full control. Phone: not confirmed, so offer a call. The web address no longer has to be verified for conversion events (Meta), but verify it anyway by DNS once it exists.", ["tror-t30", "tror-t31"]),
  t("tror-t32", "Tell Luisa the ad account is ready for her card; set a daily cap and an end date", "build", "Accounts", "tror-meta-card", "Days 3-7", "Done when: Payment settings on the ad account shows her card with no failed hold, and the daily spending limit is visible. If she is not GST-registered, Meta adds GST. Decide with Jesse whether to run a small approved post first so the spend limit has history before day 17.", ["tror-t21"]),
  t("tror-t19", "Check the Instagram is a professional account, joined to the page, in her business; add the links to the site footer", "build", "Accounts", "tror-socials", "Days 2-5", "Done when: the Instagram account appears as an asset beside the page in the partner view."),
  t("tror-t29", "Check her Porkbun account is open, in her name, with two-step login", "build", "Accounts", "tror-porkbun-account", "Days 1-3", "Done when: she confirms on the call and can see an empty account."),
  t("tror-t18", "Buy the new Tiny ROR web address with Luisa, in her Porkbun account; then set it up", "build", "Accounts", "tror-domain", "Days 2-5", "tinyror.com.au needs her ABN, and the name must match her business or describe the service (auDA). Porkbun sells .com.au; approval there is not confirmed, so have a second registrar in mind. Ask her to point the name servers at Cloudflare once, so every later change is yours. Done when: a whois lookup shows the name registered and it resolves to the holding page.", ["tror-t07", "tror-t29"]),
  t("tror-t20", "Check her Stripe account is active; later, connect it to the Tiny ROR workspace with her on a call", "build", "Accounts", "tror-stripe", "Days 2-7", "Stripe Australia wants photo ID and proof of home address; reviews take up to 24 hours. First payout lands 7 to 14 days after the first live payment. No keys in files or messages. The Tiny ROR workspace isn't created yet: ask Jesse first. Done when: a real $20 test booking reaches her Stripe."),
  t("tror-t22", "Accept the manager invite; check and refine her Google listing (free, no Google Ads)", "build", "Accounts", "tror-google-listing", "Days 3-7", "Access is immediate once accepted. A brand-new listing needs Google's verification: up to 5 business days, or a postcard in about 14. Catch the other spelling of the name (\"roar\"). Done when: the listing shows under your own Google account."),
  t("tror-t25", "Accept the Wix invite; copy her current site", "build", "Accounts", "tror-wix", "Days 3-7", "Done when: her site shows in your own Wix account."),
  t("tror-t27", "Put her phone and email on the site, the messages and the concierge", "build", "Accounts", "tror-contact", "Days 3-10"),
  // ── Must-haves before we launch ──
  t("tror-t03", "Put the venue details into the site and the booking page", "testing", "Must-haves", "tror-venue", "Days 1-10"),
  t("tror-t04", "Put the class day, time and length into the offer and the site", "testing", "Must-haves", "tror-class-time", "Days 1-10"),
  t("tror-t05", "Add the WWCC number to the site", "testing", "Must-haves", "tror-wwcc", "Days 1-10", "Done when: the number checks out on the NSW Office of the Children's Guardian lookup."),
  t("tror-t06", "Check the insurance covers children's group classes; file the certificate", "testing", "Must-haves", "tror-insurance", "Days 1-10", "The slowest must-have if she has to buy it: chase on day 3."),
  t("tror-t08", "Draft the child safe policy (NSW Child Safe Standards, with an incident process) and paste it into the step", "testing", "Policies", "tror-child-safe", "Days 1-5", "Paste into the step's content in admin. She presses Looks right or sends changes."),
  t("tror-t09", "Make Luisa's changes to the child safe policy and publish it", "testing", "Policies", "tror-child-safe", "Days 5-10", "", ["tror-t08"]),
  t("tror-t10", "Draft the photo and video consent form and paste it into the step", "testing", "Policies", "tror-consent", "Days 1-5", "Used for the staged shoot and the tasters. Paste into the step's content in admin."),
  t("tror-t11", "Make Luisa's changes to the consent form and set it up for parents to sign", "testing", "Policies", "tror-consent", "Days 5-10", "", ["tror-t10"]),
  t("tror-t12", "Put the taster dates into the booking page", "testing", "Must-haves", "tror-taster-dates", "Days 3-10", "NSW summer holidays run 18 Dec 2026 to 27 Jan 2027; Term 1 starts Wed 3 Feb 2027."),
  t("tror-t13", "Turn her refund, missed-class and sick-day rules into a short policy", "testing", "Policies", "tror-policies", "Days 5-10"),
  // ── The offer and your approvals ──
  t("tror-t14", "Update the site copy: parents stay or drop off", "go-live", "Offer", "tror-parents-stay", "Days 3-10"),
  t("tror-t15", "Put the real tool names into the offer and the site", "go-live", "Offer", "tror-tools", "Days 3-10"),
  t("tror-t16", "Lock the prices in tiny-ror/offer.md", "go-live", "Offer", "tror-prices", "Days 3-7"),
  t("tror-t17", "Call the local parents (15 minutes each) and write up what they said", "go-live", "Offer", "tror-parent-chats", "Days 3-10", "Notes to tiny-ror/notes/, one file per call."),
  t("tror-t33", "Paste the quiz, its four results and the follow-up messages into the step for her yes", "go-live", "Approvals", "tror-quiz-approve", "Days 8-12", "Done when: a test quiz submission lands in the list and its result email arrives. Needs the Tiny ROR workspace."),
  t("tror-t34", "Paste the four ads into the step for her yes; submit them two days before they run", "go-live", "Approvals", "tror-ads-approve", "Days 10-14", "Meta reviews most ads within 24 hours; allow two days. No child's face in any ad. Done when: every ad shows as approved and paused in her ad account.", ["tror-t32"]),
  // ── Photos, and later ──
  t("tror-t24", "Pick the photos of Luisa for the About section and the first ads", "post-launch", "Photos", "tror-photos-luisa", "Days 5-12", "No children in these."),
  t("tror-t23", "Book the photo shoot with the families and get their consent forms signed", "post-launch", "Photos", "tror-shoot-families", "Days 7-14", "About 6 Dec. Consent first, every family.", ["tror-t11"]),
  t("tror-t28", "File her logo and brand files, or lift them from the site", "post-launch", "Photos", "tror-brand-files", "Days 5-14"),
  t("tror-t26", "After launch: move her old web address from Wix to Porkbun with Luisa, on a call; then move the site", "post-launch", "Later", "tror-domain-move", "Days 20-30", "Not on the launch path. She logs in to both; never take a login. Wix: up to 7 days, a 60-day lock after registration or a contact change, the Wix site disconnects once the address leaves, and email records must be re-added. Build the DNS at Porkbun first. Whether the same rules hold for a .com.au name is not confirmed. Done when: whois shows Porkbun and her email still arrives.", ["tror-t29"]),
];
