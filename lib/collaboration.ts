export type ChecklistOwner = "chris" | "jesse";

export type ChecklistItem = {
  id: string;
  owner: ChecklistOwner;
  title: string;
  detail: string;
  completed: boolean;
};

export type ProjectStage = {
  label: string;
  detail: string;
  status: "done" | "current" | "next" | "later";
};

export const projectStages: ProjectStage[] = [
  {
    label: "Trust reset",
    detail: "Align on a more strategic, hands-on working rhythm.",
    status: "done",
  },
  {
    label: "Offer lock",
    detail: "Choose the strongest hook and what Chris is comfortable saying.",
    status: "current",
  },
  {
    label: "Creative build",
    detail: "Turn the offer into ad concepts, scripts, and visual proof.",
    status: "next",
  },
  {
    label: "Funnel build",
    detail: "Meta/Google capture, GHL forms, CRM tags, and lead routing.",
    status: "later",
  },
  {
    label: "AI qualification",
    detail: "Pre-qualify the right owners and protect the team from low-fit leads.",
    status: "later",
  },
  {
    label: "Launch + optimise",
    detail: "Run tests, review lead quality, and tune based on real results.",
    status: "later",
  },
];

export const defaultChecklistItems: ChecklistItem[] = [
  {
    id: "chris-benchmark-sample",
    owner: "chris",
    title: "Send anonymised benchmark / gap analysis sample",
    detail: "A screenshot or white-labelled report section is enough for the first creative pass.",
    completed: false,
  },
  {
    id: "chris-offer-comfort",
    owner: "chris",
    title: "Confirm compliant offer language",
    detail: "What can we safely say about benchmarking, $875 value, and possible $100K-$200K gaps?",
    completed: false,
  },
  {
    id: "chris-client-fit",
    owner: "chris",
    title: "Clarify ideal client filters",
    detail: "Staff count, trade categories, turnover signals, location, and disqualifiers.",
    completed: false,
  },
  {
    id: "chris-proof-options",
    owner: "chris",
    title: "Identify testimonial or proof options",
    detail: "Names can stay confidential; we just need the proof shape and what is safe to use.",
    completed: false,
  },
  {
    id: "jesse-creative-angles",
    owner: "jesse",
    title: "Draft first creative angles",
    detail: "Profit gap, productivity gap, wage leakage, margin/pricing, grants, and proof-led routes.",
    completed: false,
  },
  {
    id: "jesse-ads-structure",
    owner: "jesse",
    title: "Shape the A/B campaign structure with ads team",
    detail: "Cold Meta lead magnet, warm consult retargeting, and possible Google intent funnel.",
    completed: false,
  },
  {
    id: "jesse-calculator-feasibility",
    owner: "jesse",
    title: "Explore calculator / teaser funnel feasibility",
    detail: "A lightweight input-to-gap concept that creates curiosity without giving away the model.",
    completed: false,
  },
  {
    id: "jesse-next-agenda",
    owner: "jesse",
    title: "Prepare structured 90-minute workshop agenda",
    detail: "Use the next call to lock offer, message, assets, targeting, and launch sequence.",
    completed: false,
  },
];
