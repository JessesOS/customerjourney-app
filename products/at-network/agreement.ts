// AT Network: the agreement accepted on step 1. The portal is the signature
// (Jesse, 2026-10-21; spec "Acceptance"). Acceptances keep the exact text they
// accepted, so CHANGE THE VERSION WITH ANY CHANGE TO THE WORDING.
//
// Version 1, 25 October 2026, as updated on the page the same day (late content
// no longer pauses the timeline; handover template and guide). The text of
// https://agreements.allconvos.ai/at-network (Jesse, 2026-10-25), word for word, generated from the page by the build
// session. The page's own acceptance form is not part of the text. B14 describes
// signing on that page; a client who signs there is recorded in admin
// ("Record a signed acceptance") and this step arrives done.

import type { AgreementContent } from "../../lib/journeyTypes";

export const atNetworkAgreement: AgreementContent = {
  step: "atn-agreement",
  // Changed from "v1-2026-10-25" when the page text changed (no acceptances existed yet).
  version: "v1.1-2026-10-25",
  title: "Agreement · AT Network Phase 1 · Version 1 · 25 October 2026",
  // The client's legal entity (Jesse, 2026-10-25). Fixed, so the signer can't mistype it.
  entity: "AT Network Pty Ltd (ABN 69 684 621 887)",
  sections: [
    {
      "heading": "Agreement · AT Network Phase 1",
      "paragraphs": [
        "AT Network, Phase 1. The Statement of Work and the standard terms, in one place. Read it, then accept it at the bottom.",
        "Version 1 · 25 October 2026",
        "Provider: AWE2M8 AI Pty Ltd trading as All Convos AI. ABN 31 687 348 134 · ACN 687 348 134. 50A Habitat Way, Lennox Head NSW 2478, acting through its director, Jesse Allan (\"I\", \"me\").",
        "Client: AT Network Pty Ltd. ABN 69 684 621 887, acting through the person who accepts below (\"you\").",
        "This agreement has two parts. Part A is the work for Phase 1, the Statement of Work. Part B is the standard terms, which also apply to any later work you order. It replaces the Terms in the proposal of 19 October 2026."
      ]
    },
    {
      "heading": "Part A · Statement of Work, Phase 1",
      "paragraphs": []
    },
    {
      "heading": "A1 Price",
      "paragraphs": [
        "A$9,000 plus GST (A$9,900 including GST), in three payments of A$3,000 plus GST (A$3,300 each)."
      ]
    },
    {
      "heading": "A2 What I build",
      "paragraphs": [
        "The First Light website, on one scrolling page, with motion that plays once and then settles:",
        "Homepage, The journey (including the Academy: Foundations, Growth and Legacy, with Academy Membership as the tier that holds them), Stories (with testimonials and the podcast feed) and FAQs.",
        "The Offerings page, on its own, with each offer linking to its own page.",
        "Five offer pages: Levels 0 to 3 and the Benevolent Executive Program (its copy supplied by you), plus a page each for the Growth and Legacy courses, built from the outlines you supply.",
        "The eBook landing page, with your GHL form placed in it, and the free guide as a PDF.",
        "The StarMap Assessment landing page, designed in the First Light look, with your existing StarMap assessment (the 21-question Star Map you sent on 21 October) restyled into the First Light look and embedded. The questions, scoring and results wording stay yours and unchanged. Your team builds and runs everything else: the form that collects visitors' details, sending their scores to GHL, and the personalised report and the email that delivers it.",
        "Landing pages A (card up front) and B (no card), with the first screen swapping per audience, and C (the First Light homepage).",
        "A simple content editor for the text and images that can be changed safely: headings, text, offer details, prices and FAQs, and image swaps that check the size and shape before they are accepted. The final list of editable fields is shown at handover. Layout, structure, motion and design are not changed through the editor; they are changed in the site files (B7) or as a change request. After handover you hold the full site files and can edit anything yourselves, or have a developer or AI tool do it.",
        "SEO (search engine optimisation) basics built in: page titles and descriptions, canonical links, social sharing tags, structured data, sitemap, robots file, image alt text and a speed check. At launch the site matches what your current site already does, at least.",
        "The funnel and creative:",
        "Three cold video ads, one per audience, up to 15 seconds each, vertical 9:16, captions burned in.",
        "Two static ads (one sized for Facebook and Instagram, one for LinkedIn) and a LinkedIn banner.",
        "The retargeting ladder, as a written plan.",
        "The podcast intro. Before the build we agree the look together from a short set of title-sequence references, keeping the real, human feel of your podcast. It is then finished with one round of changes on details and music.",
        "A journal inside the podcast section: a listing and one article template, for you to fill with your own articles. After handover, new articles are added in the site files, by you, a developer or an AI tool. A posting system isn't included."
      ]
    },
    {
      "heading": "A3 Not included",
      "paragraphs": [
        "These are not part of Phase 1. Each can be quoted as a change request (B4):",
        "the podcast outro, unless it is a simple version of the intro (a short closing cut using the same look and music), in which case I include it. We decide which once you have seen the intro;",
        "a posting system for new articles, or an automatic podcast-to-article feed (a menu link to the podcast section and the journal in A2 are included);",
        "the Benevolent Executive film;",
        "extra ad versions, new hooks and short cut-downs;",
        "changes to the StarMap's questions, scoring or results content, or a new assessment;",
        "anything not listed in A2.",
        "Your team handles: GoHighLevel (forms, pipelines, automations, emails), checkout, payments and the free month, Mighty Networks, tracking pixels, ad accounts, campaigns and ad spend, filming and your videographer, posting to social media, and your domain and DNS. I place your forms and link the buttons as you specify."
      ]
    },
    {
      "heading": "A4 Items I need from you",
      "paragraphs": [
        "The timeline pauses only while go-live access (domain and hosting) is late. Everything else below is built with what is available by its due date: see “Content that isn’t ready” after this table.",
        "StarMap assessment. From: Martyn. Due: Received 21 October.",
        "Product package breakdown (website copy for Levels 0 to 3). From: Ben. Due: Received 24 October.",
        "Prices and free-month terms for each level (needed for the offer pages and landing pages A and B). From: Rich. Due: 3 business days after payment 1.",
        "New photos of Rich. From: Rich. Due: 3 business days after payment 1.",
        "Academy course details. From: Rich. Due: 3 business days after payment 1.",
        "Executive Program page copy. From: Rich. Due: 3 business days after payment 1.",
        "GHL contact person. From: Rich. Due: 3 business days after payment 1.",
        "Where the StarMap page links from on your site. From: Rich. Due: 3 business days after payment 1.",
        "First draft of each of the four sales-video scripts. From: Your team. Due: 7 days after payment 1.",
        "Domain and hosting access, for go-live. From: Rich. Due: At go-live.",
        "Already received: the final eBook, Martyn’s Foundations course document, and Ben’s copy for the four subscription levels.",
        "Sales-video scripts: four sales videos, one for each offer page (Levels 0 to 3; not the Benevolent Executive page, and not landing pages A, B and C). Your team writes the first draft of each script from your product package breakdown. I give one round of direction and changes on each. Filming and editing the videos are yours.",
        "Content that isn’t ready. Some content may not exist yet, such as course outlines and details, Executive Program copy, or new courses still being written. That does not slow the project or move any payment. I build every page in A2 with the content available by the due dates above, and mark clearly where something is still to come. Rounds of changes (B2) and acceptance (B3) apply to the work as built with that content, and a page that is built and waiting only on your content counts as ready for review for payments 2 and 3. Pages and content that arrive later can be added by you after handover, in the same look, using the page template and guide I hand over (B7), or by me as a change request (B4)."
      ]
    },
    {
      "heading": "A5 Payments and timeline",
      "paragraphs": [
        "Payment 1, on acceptance. Work starts when it is received.",
        "Payment 2, when the site and landing pages are ready for your review on the review link.",
        "Payment 3, when the final work is ready for your review. Handover (B7) happens on this payment.",
        "Launch is about five weeks from the day payment 1 is received, if go-live access (A4) is ready on time. Content that is not ready does not move the date."
      ]
    },
    {
      "heading": "Part B · Standard terms",
      "paragraphs": []
    },
    {
      "heading": "B1 Working together",
      "paragraphs": [
        "Scope, feedback, files and approvals go in writing, through the client portal. Messages marked as an approval or a change request are the written record of this agreement. WhatsApp and calls are for logistics only; nothing said there changes the scope. We each aim to reply within one business day.",
        "One approver. You name one person to approve the work and send feedback (Rich, unless you tell me otherwise in writing). I act on that person’s written instructions. Feedback from others in your team comes to me through them as one combined list. If your team disagrees internally, you settle it before sending; I don’t decide between conflicting instructions. Time lost waiting on a decision moves the timeline by the same amount, and changing something already approved because someone else on your side wants it different is a change request (B4)."
      ]
    },
    {
      "heading": "B2 Rounds of changes",
      "paragraphs": [
        "Each piece includes two rounds of changes (the podcast intro: one, as in A2). One round is one combined list of feedback, sent in writing. Once a concept or script is approved, a new concept is a change request. Extra rounds are quoted."
      ]
    },
    {
      "heading": "B3 Review and acceptance of the work",
      "paragraphs": [
        "You see the work on a review link as it is built. Each delivery is accepted when you approve it in writing, or 5 business days after it is delivered for review, unless you send a list of changes in writing in that time."
      ]
    },
    {
      "heading": "B4 Change requests",
      "paragraphs": [
        "Anything outside Part A is a change request. You send it in writing; I quote it; work starts once you approve the quote. Findings from a third-party review (for example an SEO audit) are change requests, not defects, unless they show that something in A2 was not delivered."
      ]
    },
    {
      "heading": "B5 Payment",
      "paragraphs": [
        "Prices are in Australian dollars, plus GST at 10%. Payments are made by invoice through Stripe, by card or bank transfer as shown on the invoice, and are due on receipt. If a payment is more than 14 days late, I may pause the work until it is paid."
      ]
    },
    {
      "heading": "B6 Pause and ending",
      "paragraphs": [
        "If a payment is late, or approvals and the go-live items in A4 stop for 30 days, the work pauses, and restarting may need a new start date. Either of us may end this agreement in writing. If it ends, payments for work already delivered remain payable, payments made are not refunded, and you receive the work completed and paid for to date."
      ]
    },
    {
      "heading": "B7 Handover, hosting and code",
      "paragraphs": [
        "During the build I host the review site. You have no server or code access during the build. On payment 3, I hand over the finished site files and assets: clean static HTML, CSS and JavaScript (no server-side code) that can be hosted on GoDaddy or elsewhere and edited by any developer or AI tool. I help with go-live on your domain, on hosting you choose. The handover includes a page template and a short guide, so you can add new pages in the same look. After handover, hosting, updates and changes are yours, or can be quoted."
      ]
    },
    {
      "heading": "B8 Ownership",
      "paragraphs": [
        "You own your content, contacts, data and accounts. When you have paid in full, you own the finished work I make for you and may use it in your own business. You may not resell, sublicense or white-label it to others, including your agency's clients, without my written agreement. I keep my tools and methods: build scripts, templates, design-system source, prompts, workflows and the AI pipeline. Concepts, scripts, storyboards and proof scenes I showed during the pitch that are not part of Part A stay mine."
      ]
    },
    {
      "heading": "B9 Your wording, people and claims",
      "paragraphs": [
        "Your existing copy stays unchanged unless you approve a change. New copy, course details and offer details are approved by you before they go live. You are responsible for written permission from anyone shown on camera. Real people and real footage come first. Any AI-made imagery is used only with your approval, anything depicting a real member is made with their consent, and nothing is used to mislead. I will not make claims about results, healing or guaranteed revenue."
      ]
    },
    {
      "heading": "B10 Third-party costs",
      "paragraphs": [
        "Ad spend, domain and hosting after handover, GoHighLevel and other tools, music licences, stock media, your videographer and crew, venues and travel are not part of my fee."
      ]
    },
    {
      "heading": "B11 No guaranteed results",
      "paragraphs": [
        "I deliver the work in Part A. I do not promise search rankings, ad approval, sign-ups, members or revenue."
      ]
    },
    {
      "heading": "B12 Confidentiality and liability",
      "paragraphs": [
        "Each of us keeps the other's non-public information confidential. To the extent the law allows, my total liability under this agreement is limited to the fees you have paid."
      ]
    },
    {
      "heading": "B13 Law",
      "paragraphs": [
        "This agreement is governed by the laws of New South Wales, Australia."
      ]
    },
    {
      "heading": "B14 Acceptance and electronic signature",
      "paragraphs": [
        "You accept this agreement on behalf of your company by ticking the box below, typing your full name and details, and sending the confirmation email the page prepares. That is your electronic signature. The confirmation records your name, company, ABN, email, the date and time, this version, and a fingerprint of this exact text. Keep a PDF copy with the Save button. A later version applies only once you accept it the same way."
      ]
    }
  ],
};
