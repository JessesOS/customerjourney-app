export type KnowledgeKind =
  | "meeting-summary"
  | "meeting-transcript"
  | "strategy-chat"
  | "strategy-note"
  | "working-plan"
  | "system"
  | "form-structure"
  | "contract";

export type KnowledgeSource = {
  id: string;
  title: string;
  source: string;
  folder: string;
  kind: KnowledgeKind;
  date?: string;
  session?: number;
  indexed: boolean;
};

export type KnowledgeChunk = {
  id: string;
  sourceId: string;
  title: string;
  source: string;
  text: string;
  kind: KnowledgeKind;
  folder?: string;
  session?: number;
  date?: string;
  aliases?: string[];
};

export const projectKnowledgeIndex = {
  syncedAt: "2026-06-28",
  syncMode: "manual-on-change + weekly-sanity-refresh",
  sourceFolderLabel: "Strategize / Chris McBreen shared Drive library",
  sources: [
    {
      id: "meeting-1-transcript",
      title: "Meeting 01 - 2026-06-22 - Chris McBreen - Transcript",
      source: "01 - transcripts / Meeting 01 - 2026-06-22 - Chris McBreen - Transcript",
      folder: "01 - transcripts",
      kind: "meeting-transcript",
      date: "2026-06-22",
      session: 1,
      indexed: true,
    },
    {
      id: "meeting-1-summary",
      title: "Meeting 01 - 2026-06-23 - Chris McBreen - Summary",
      source: "01 - transcripts / Meeting 01 - 2026-06-23 - Chris McBreen - Summary",
      folder: "01 - transcripts",
      kind: "meeting-summary",
      date: "2026-06-23",
      session: 1,
      indexed: true,
    },
    {
      id: "meeting-2-transcript",
      title: "Meeting 02 - 2026-06-27 - Chris McBreen - Transcript",
      source: "01 - transcripts / Meeting 02 - 2026-06-27 - Chris McBreen - Transcript",
      folder: "01 - transcripts",
      kind: "meeting-transcript",
      date: "2026-06-27",
      session: 2,
      indexed: true,
    },
    {
      id: "meeting-2-summary",
      title: "Meeting 02 - 2026-06-27 - Chris McBreen - Summary",
      source: "01 - transcripts / Meeting 02 - 2026-06-27 - Chris McBreen - Summary",
      folder: "01 - transcripts",
      kind: "meeting-summary",
      date: "2026-06-27",
      session: 2,
      indexed: true,
    },
    {
      id: "lead-gen-strategy-chat",
      title: "ChatGPT Strategize Chat from Feb to June26",
      source: "01 - transcripts / ChatGPT Strategize Chat from Feb to June26",
      folder: "01 - transcripts",
      kind: "strategy-chat",
      date: "2026-06-26",
      indexed: true,
    },
    {
      id: "system-walkthrough",
      title: "System Explanation / Walk through",
      source: "03 - system / System Explanation / Walk through",
      folder: "03 - system",
      kind: "system",
      indexed: true,
    },
    {
      id: "scale-product-overview",
      title: "System Explanation from RTD's Notebook LM - Scale Product 270626",
      source: "03 - system / System Explanation from RTD's Notebook LM - Scale Product 270626",
      folder: "03 - system",
      kind: "system",
      date: "2026-06-27",
      indexed: true,
    },
    {
      id: "onboarding-form-structure",
      title: "# Scale (Meta & Google Ads) - Onboarding Form Structure",
      source: "03 - system / # Scale (Meta & Google Ads) - Onboarding Form Structure",
      folder: "03 - system",
      kind: "form-structure",
      date: "2026-06-26",
      indexed: true,
    },
    {
      id: "scale-contract",
      title: "Stratagize TAI Scale - (CRM+Ads) - Contract.pdf",
      source: "04 - contracts / Stratagize TAI Scale - (CRM+Ads) - Contract.pdf",
      folder: "04 - contracts",
      kind: "contract",
      indexed: false,
    },
    {
      id: "basic-contract-template",
      title: "Christ Strategize Trades Coaching - TAI Basic (CRM+Ads) - Contract - Template.pdf",
      source: "04 - contracts / Christ Strategize Trades Coaching - TAI Basic (CRM+Ads) - Contract - Template.pdf",
      folder: "04 - contracts",
      kind: "contract",
      indexed: false,
    },
    {
      id: "referral-partnership-agreement",
      title: "Strategize - Referral Partnership Agreement.pdf",
      source: "04 - contracts / Strategize - Referral Partnership Agreement.pdf",
      folder: "04 - contracts",
      kind: "contract",
      indexed: false,
    },
  ] satisfies KnowledgeSource[],
  chunks: [
    {
      id: "project-purpose",
      sourceId: "meeting-1-summary",
      title: "Project purpose",
      source: "Portal brief",
      kind: "strategy-note",
      aliases: ["project brain", "portal brief", "shared strategy room"],
      text: "This is a shared strategy room for the Canterbury pilot with Chris McBreen and Strategize. The purpose is to clarify the offer, shape the campaign, and map how qualified trade-business owners move from ad click to booked consult.",
    },
    {
      id: "meeting-1-summary-core",
      sourceId: "meeting-1-summary",
      title: "Meeting 1 summary",
      source: "01 - transcripts / Meeting 01 - 2026-06-23 - Chris McBreen - Summary",
      kind: "meeting-summary",
      folder: "01 - transcripts",
      session: 1,
      date: "2026-06-23",
      aliases: ["meeting 1 summary", "session 1 summary", "first meeting summary"],
      text: "Meeting 1 focused on trust reset, client-fit clarity, and the campaign offer. Chris needs a strategic, consistent approach after a poor onboarding experience. The commercial model is high-ticket long-term strategy support for trades businesses with roughly 5 to 20 staff, and low-fit one-man bands should be screened out. The strongest campaign hook is a free benchmarking or gap report that reveals hidden profit leakage, with creative centered on tangible red-flag losses in wages, productivity, and margin. Jesse's next steps were to draft creative angles, structure A/B campaign tests, and explore a simple calculator or teaser funnel, while Chris was to provide benchmark examples, proof assets, and clearer client filters.",
    },
    {
      id: "meeting-1-transcript-trust",
      sourceId: "meeting-1-transcript",
      title: "Meeting 1 transcript: trust and client fit",
      source: "01 - transcripts / Meeting 01 - 2026-06-22 - Chris McBreen - Transcript",
      kind: "meeting-transcript",
      folder: "01 - transcripts",
      session: 1,
      date: "2026-06-22",
      aliases: ["meeting 1", "session 1", "first meeting", "onboarding"],
      text: "Chris was unhappy with the previous onboarding and felt the work lacked strategic depth and creative effort. He wants a hands-on, credible partner who understands his reputation risk with higher-value trade clients. The ideal Strategize client is not a generic small business owner but an established trade business with multiple staff, enough turnover, and a need for operational and strategic support.",
    },
    {
      id: "meeting-1-transcript-offer",
      sourceId: "meeting-1-transcript",
      title: "Meeting 1 transcript: offer and lead quality",
      source: "01 - transcripts / Meeting 01 - 2026-06-22 - Chris McBreen - Transcript",
      kind: "meeting-transcript",
      folder: "01 - transcripts",
      session: 1,
      date: "2026-06-22",
      aliases: ["benchmarking", "gap analysis", "lead quality", "telemarketing"],
      text: "Chris emphasized that lead quality matters more than volume. Telemarketing is already producing qualified appointments, so ads must compete on that quality. The most compelling offer is a benchmarking or gap-analysis style asset that reveals missing profit, productivity gaps, wage overspend, or marketing waste. He described this as a high-value conversion asset because owners react strongly when they see a clear dollar gap in red.",
    },
    {
      id: "meeting-2-summary-core",
      sourceId: "meeting-2-summary",
      title: "Meeting 2 summary",
      source: "01 - transcripts / Meeting 02 - 2026-06-27 - Chris McBreen - Summary",
      kind: "meeting-summary",
      folder: "01 - transcripts",
      session: 2,
      date: "2026-06-27",
      aliases: ["meeting 2 summary", "session 2 summary", "second meeting summary", "last meeting", "latest meeting"],
      text: "Meeting 2 locked the core direction around a value-first diagnostic funnel: ad to calculator to lead capture to qualification call to in-person consult. Chris validated the profit leakage calculator as the primary offer, with wage subsidy and buying group angles as secondary tests. The calculator should feel fast and simple, using a few inputs to estimate hidden profit loss and trigger curiosity. Qualification remains critical: revenue, staff size, existing coach, and location are the main filters, with a focus on multi-staff trade businesses in Canterbury. The campaign should start with 2 to 4 ad variants and a retargeting sequence, keep the human touch early, and avoid over-automating until the campaign proves lead quality.",
    },
    {
      id: "meeting-2-transcript-calculator",
      sourceId: "meeting-2-transcript",
      title: "Meeting 2 transcript: calculator concept",
      source: "01 - transcripts / Meeting 02 - 2026-06-27 - Chris McBreen - Transcript",
      kind: "meeting-transcript",
      folder: "01 - transcripts",
      session: 2,
      date: "2026-06-27",
      aliases: ["meeting 2", "calculator", "profit leakage", "score app"],
      text: "Chris wants the lead magnet and funnel centered on a profit leakage calculator or score app. It should ask for a few simple inputs such as turnover, staff count, and gross margin, then show likely missing profit based on the trade category. He believes the strongest emotional trigger is showing an owner that they may be off by $100K or more and should call to understand the gap.",
    },
    {
      id: "meeting-2-transcript-qualification",
      sourceId: "meeting-2-transcript",
      title: "Meeting 2 transcript: qualification rules",
      source: "01 - transcripts / Meeting 02 - 2026-06-27 - Chris McBreen - Transcript",
      kind: "meeting-transcript",
      folder: "01 - transcripts",
      session: 2,
      date: "2026-06-27",
      aliases: ["qualification", "disqualifier", "existing coach", "location"],
      text: "Meeting 2 made the qualification logic explicit. The key qualifying fields are revenue, staff size, whether the business is already working with a coach, and location. One-man bands and low-revenue operators should be filtered out. Canterbury is the initial geographic focus, and location matters because Strategize dispatches local consultants for the first in-person visit.",
    },
    {
      id: "meeting-2-transcript-automation",
      sourceId: "meeting-2-transcript",
      title: "Meeting 2 transcript: automation posture",
      source: "01 - transcripts / Meeting 02 - 2026-06-27 - Chris McBreen - Transcript",
      kind: "meeting-transcript",
      folder: "01 - transcripts",
      session: 2,
      date: "2026-06-27",
      aliases: ["automation", "GoHighLevel", "Pipedrive", "human follow-up"],
      text: "Chris is open to GHL and AI, but he does not want heavy automation before the marketing is proven. During business hours, the team can handle prompt human follow-up. After hours, AI can qualify and nurture. The principle is to validate the campaign and lead quality first, then automate what is already working.",
    },
    {
      id: "lead-gen-strategy-chat-core",
      sourceId: "lead-gen-strategy-chat",
      title: "Lead gen strategy chat",
      source: "01 - transcripts / ChatGPT Strategize Chat from Feb to June26",
      kind: "strategy-chat",
      folder: "01 - transcripts",
      date: "2026-06-26",
      aliases: ["ads", "lead gen", "meta ads", "support guide"],
      text: "This is a strategy chat about Meta lead generation for established NZ trades businesses, not a Chris meeting transcript. It focuses on titles, hooks, lead magnets, support wording, and Meta funnel messaging. Strong lead magnet options include a systems map, business health scorecard, profit leak checklist, and trades business support guide framed in practical commercial language rather than boring funding language.",
    },
    {
      id: "system-walkthrough-funnel",
      sourceId: "system-walkthrough",
      title: "System walkthrough: funnel architecture",
      source: "03 - system / System Explanation / Walk through",
      kind: "system",
      folder: "03 - system",
      aliases: ["lead to booked consult", "system map", "funnel", "booked consult"],
      text: "The Scale system runs a hybrid Meta and Google funnel. Meta captures cold and warm traffic through a lead magnet and consult offer, while Google routes high-intent traffic to a two-step GHL landing page. Leads enter the CRM instantly, trigger source tagging and immediate SMS/email follow-up, then move through AI qualification and booking before handoff to a human closer.",
    },
    {
      id: "system-walkthrough-ai",
      sourceId: "system-walkthrough",
      title: "System walkthrough: AI behavior",
      source: "03 - system / System Explanation / Walk through",
      kind: "system",
      folder: "03 - system",
      aliases: ["AI nurture", "AI qualification", "booking process"],
      text: "The AI sales assistant should sound warm and human, ask questions one at a time, handle basic objections, and gather pain point, motivation, service fit, address, timezone, and missing contact fields. Once qualified, it should suggest specific calendar slots, book the appointment, then shut down so the human rep can review the transcript and continue the sale.",
    },
    {
      id: "scale-product-overview-core",
      sourceId: "scale-product-overview",
      title: "Scale product overview",
      source: "03 - system / System Explanation from RTD's Notebook LM - Scale Product 270626",
      kind: "system",
      folder: "03 - system",
      date: "2026-06-27",
      aliases: ["scale product", "30 day build", "SOP", "go live"],
      text: "The Scale product is an end-to-end AI sales and marketing machine combining Meta ads, Google ads, GHL CRM automation, and AI booking logic. It follows a 30-day implementation path from onboarding and asset creation through AI test calls and go-live. The operational model is highly structured, with CRM-first communication, staged approvals, ad asset workflows, AI configuration, and weekly/monthly post-launch review rhythms.",
    },
    {
      id: "scale-product-contracts",
      sourceId: "scale-product-overview",
      title: "Scale product overview: contract settings",
      source: "03 - system / System Explanation from RTD's Notebook LM - Scale Product 270626",
      kind: "system",
      folder: "03 - system",
      date: "2026-06-27",
      aliases: ["contract", "cancellation", "minimum term", "notice period"],
      text: "According to the system overview, Scale SaaS products carry a 9-month minimum term that effectively includes a 3-month notice period for cancellation, and ad management requires 1 month's notice. The same source also states a no-refund position and an internal escalation process before confirming any client exit.",
    },
    {
      id: "onboarding-form-icp",
      sourceId: "onboarding-form-structure",
      title: "Onboarding form structure: client inputs",
      source: "03 - system / # Scale (Meta & Google Ads) - Onboarding Form Structure",
      kind: "form-structure",
      folder: "03 - system",
      date: "2026-06-26",
      aliases: ["onboarding form", "ICP", "ideal customer profile", "AI setup"],
      text: "The onboarding form captures business basics, address, ideal customer profile, pain points, reasons to choose the business, AI assistant setup preferences, callback preferences, lead nurture behavior, lead source channels, CRM access, and Google platform access. It also asks for strategy inputs such as focus services, customer frustrations, and any proprietary process or framework.",
    },
    {
      id: "onboarding-form-qualification",
      sourceId: "onboarding-form-structure",
      title: "Onboarding form structure: qualification and access",
      source: "03 - system / # Scale (Meta & Google Ads) - Onboarding Form Structure",
      kind: "form-structure",
      folder: "03 - system",
      date: "2026-06-26",
      aliases: ["qualification fields", "lead sources", "team access", "brand assets"],
      text: "The form structure also covers how the AI should handle bookings, preferred callback windows, lead nurture cadence, AI answering-service number setup, existing lead database size, team CRM access, domain and DNS access, Google Ads account access, business profile access, analytics access, tag manager access, brand asset links, and terms acceptance.",
    },
    {
      id: "working-plan-core",
      sourceId: "meeting-1-summary",
      title: "Working plan",
      source: "Working plan",
      kind: "working-plan",
      folder: "16 - working-plan",
      aliases: ["working plan", "action items", "next steps"],
      text: "The current visible working plan is centered on offer lock, creative build, funnel build, AI qualification, and launch plus optimise. Chris's action items include providing benchmark examples, confirming safe offer language, clarifying ideal client filters, and identifying proof assets. Jesse's action items include drafting creative angles, shaping the ad structure, exploring a calculator or teaser funnel, and preparing a structured workshop agenda.",
    },
  ] satisfies KnowledgeChunk[],
};
