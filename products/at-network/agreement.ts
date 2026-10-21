// AT Network: the agreement accepted on step 1. The portal is the signature
// (Jesse, 2026-10-21; spec "Acceptance"). Acceptances keep the exact text they
// accepted, so CHANGE THE VERSION WITH ANY CHANGE TO THE WORDING.
//
// OPEN: the Statement of Work and Master Services Agreement text (to come from
// the AT Network folder) and the legal entity. Until then this is a placeholder
// and must not be accepted for real. "How we work together" is the handover's
// decided first message.

import type { AgreementContent } from "../../lib/journeyTypes";

export const atNetworkAgreement: AgreementContent = {
  step: "atn-agreement",
  version: "draft-1",
  title: "AT Network agreement (DRAFT: not for signing)",
  // entity: OPEN. Absent, so the signer types it.
  sections: [
    {
      heading: "Statement of Work",
      paragraphs: ["[Text to come. OPEN: the final Statement of Work is not supplied yet.]"],
    },
    {
      heading: "Master Services Agreement",
      paragraphs: ["[Text to come. OPEN: the final Master Services Agreement is not supplied yet.]"],
    },
    {
      heading: "How we work together",
      paragraphs: [
        "1. One round = one consolidated feedback list sent here. Two rounds on the concept or script, two on the edit or build. A new concept after approval, or extra rounds, is a change request.",
        "2. You see everything on a review link as it is built. Handover (go-live, files, access) happens when the final instalment is paid.",
        "3. Deemed accepted 5 business days after the final review link, unless you send a written change list here.",
        "4. Anything outside the Statement of Work is a change request: written here, quoted, approved before work starts.",
        "5. Late items pause the timeline.",
      ],
    },
  ],
};
