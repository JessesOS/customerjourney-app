// AT Network (Rich Latimer and Martyn Hume Cobbe): a brand-new custom product,
// separate from Fin's. LIVE since 2026-10-25 (Jesse's OK after the walkthrough).
//
// Written from the AT Network session's handover, products/at-network/spec.md
// (2026-10-21), on a blank base. Two sides, defined once:
//   - the client's side: 25 steps in five stages (./client-steps.ts), restructured
//     2026-10-25 around the kickoff call, with the Scope and Map (./scope-map.ts);
//   - the team's side: the deliverables behind them (./team-tasks.ts).
// OPEN in the spec, so placeholders for now: total days and stage windows, every
// due date, the portal tagline, the welcome video (Jesse will send the mp4).

import { defineCustomProduct } from "../custom";
import type { ClientEmails } from "../types";
import { atNetworkAgreement } from "./agreement";
import { atNetworkScopeMap } from "./scope-map";
import { atNetworkStages, atNetworkSteps } from "./client-steps";
import { atNetworkTeamTasks } from "./team-tasks";

// Automatic emails (Jesse, 2026-10-29): one when each stage is done, to all four, Bcc the team.
// Claude's draft wording: Jesse to approve. {portal} becomes the portal link. Never prices.
const SIGN = "\n\nYour portal: {portal}\n\nJesse\nallconvos.ai";
const atNetworkEmails: ClientEmails = {
  to: ["rich@awaretrepreneur.global", "martyn@awaretrepreneur.global", "accounts@awaretrepreneur.global", "fiona@awaretrepreneur.global"],
  stageDone: {
    onboarding: {
      subject: "AT Network: Sign and start is done ✓",
      text: "Hi all,\n\nThat's \"Sign and start\" done: the agreement, the first payment and the kickoff are all ticked off. Thank you.\n\nNext up is \"What we need from you\": the content and details only you can give us. Each one has its own step in the portal, with what we need and when." + SIGN,
    },
    build: {
      subject: "AT Network: everything we need from you is in ✓",
      text: "Hi all,\n\nThat's everything in \"What we need from you\" ticked off. Thank you, that's the biggest job on your side done.\n\nNow it's our turn: we're building your site. We'll email you as soon as the first version is ready for you to review." + SIGN,
    },
    testing: {
      subject: "AT Network: your website is signed off ✓",
      text: "Hi all,\n\nYour website is signed off. Thank you.\n\nNext up is \"Funnel and ads\": your landing pages and ads. We'll email you when the first round is ready to review." + SIGN,
    },
    "go-live": {
      subject: "AT Network: your funnel and ads are signed off ✓",
      text: "Hi all,\n\nYour landing pages and ads are signed off. Thank you.\n\nOne stage to go: the final review and handover. One last look at everything, then we hand over your finished site and help you go live on your domain." + SIGN,
    },
    "post-launch": {
      subject: "AT Network: all done ✓",
      text: "Hi all,\n\nThat's the whole project done and handed over. Thank you for trusting us with it. It's been a real pleasure.\n\nYour portal stays open, with everything we made together in one place." + SIGN,
    },
  },
};

export const atNetwork = defineCustomProduct({
  id: "at-network",
  name: "AT Network (Rich and Martyn)",
  version: "2026-10-29.36",
  // Live (Jesse, 2026-10-25): he approved the wording in the walkthrough of 25 Oct.
  status: "live",
  clientType: "at-network",
  label: "AT Network",
  spec: "products/at-network/spec.md",
  base: "blank",
  idPrefix: "atn-",
  totalDays: 42, // PLACEHOLDER: total days are OPEN in the spec
  roles: ["Jesse Allan"],
  stages: atNetworkStages,
  steps: { add: atNetworkSteps },
  teamTasks: { add: atNetworkTeamTasks.map((task) => ({ task })) },
  portal: {
    brandName: "AT Network",
    // Draft tagline (Claude, Jesse's OK to choose, 2026-10-25). Shown under the name on the welcome screen.
    tagline: "Your website and funnel, built in the open.",
    lockedLook: "groveaurora", // an existing look; a look of its own would need code
    // Jesse's welcome walkthrough (videoprez, 29 Oct: the portal screen with Jesse's voice, 2:55; never the camera take. Handover: videoprez/notes/2026-10-29-at-portal-welcome-video-handover.md). Plays after
    // "Get started", before "Who's this?". The mp4 lives in R2 (media/), never in git.
    introVideo: {
      src: "/api/media/at-portal-welcome-v2.mp4",
      poster: "/portal/media/at-portal-welcome-poster.jpg",
      title: "Welcome to your AT Network portal",
    },
    // Ask Jesse is off for AT Network (Jesse, 2026-10-28): Messages covers requests, with email
    // alerts, step threads and records. It can come back once there is a reviewed pack to answer from.
    // Messages: step threads with the team (phase 1 of docs/at-network-communications-plan.md).
    // Sign-offs: completing these writes an Approval record (typed name) to the step's thread.
    // Who's this? (Jesse, 28 Oct): each device picks one of these once; ticks, uploads and messages carry the name.
    features: { comms: true, approvalSteps: ["atn-signoff-site", "atn-signoff-funnel", "atn-review-final"], people: ["Rich", "Ben", "Martyn", "Fiona"], clientEmails: atNetworkEmails },
    // Step 1: the agreement, accepted as a signed record (text OPEN: placeholder).
    agreement: atNetworkAgreement,
    // The Scope and Map on "Read your scope and map" (draft, 2026-10-25): two tracks, site map, Phase 2 list.
    journeyMap: { step: "atn-scope-map", content: atNetworkScopeMap },
  },
  draftCopy: [],
});
