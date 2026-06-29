export type ManualTaskOwner = "chris" | "jesse";

export type ManualTaskOverride = {
  titleIncludes: string;
  visible?: boolean;
  owner?: ManualTaskOwner;
  title?: string;
  detail?: string;
  pinnedRank?: number;
  blocker?: boolean;
};

export const liveDashboardTaskOverrides: ManualTaskOverride[] = [
  {
    titleIncludes: "Client Review of SMS/Email Copy",
    owner: "chris",
    title: "Review SMS and email copy",
    detail: "Check the draft messaging and confirm it is ready to use.",
    pinnedRank: 1,
    blocker: true,
  },
  {
    titleIncludes: "Review the submitted onboard form with the client",
    owner: "chris",
    title: "Review onboarding form details",
    detail: "Confirm business info, access, ICP, and brand details are complete.",
    pinnedRank: 2,
    blocker: true,
  },
  {
    titleIncludes: "Have client connect their Calendar",
    owner: "chris",
    title: "Connect calendar and key CRM settings",
    detail: "Connect the calendar and finish the key CRM setup items.",
    pinnedRank: 3,
  },
  {
    titleIncludes: "prepare and upload a CSV database of their past leads",
    owner: "chris",
    title: "Upload past leads and lost quotes",
    detail: "Prepare and upload the CSV so retargeting and reactivation can be set up.",
    pinnedRank: 4,
  },
  {
    titleIncludes: "Change the approved AI question text to GREEN BOLD",
    visible: false,
  },
  {
    titleIncludes: "Add a comment \"approved by Client\"",
    visible: false,
  },
  {
    titleIncludes: "Warn the client that SaaS fees start ticking 14-30 days",
    owner: "jesse",
    title: "Confirm SaaS billing timing",
    detail: "Make sure billing timing is explained clearly and acknowledged.",
    pinnedRank: 1,
    blocker: true,
  },
  {
    titleIncludes: "Check that \"SaaS Fees Are Activated\"",
    owner: "jesse",
    title: "Activate SaaS fees",
    detail: "Confirm the recurring SaaS fee setup is live in the backend.",
    pinnedRank: 2,
  },
  {
    titleIncludes: "Determine their exact pre-qualification questions",
    owner: "jesse",
    title: "Lock qualification questions",
    detail: "Finalize the qualification questions the funnel and AI should use.",
    pinnedRank: 3,
  },
  {
    titleIncludes: "Get verbal approval from the client on the AI questions",
    owner: "jesse",
    title: "Get approval on qualification questions",
    detail: "Confirm the wording is approved before the build moves forward.",
    pinnedRank: 4,
  },
  {
    titleIncludes: "Walk the client through LaunchBay project milestones",
    title: "Walk through the client dashboard",
    detail: "Show Chris the milestones, tasks, and messaging flow in the dashboard.",
  },
  {
    titleIncludes: "Review your onboarding walkthrough",
    title: "Review onboarding walkthrough",
    detail: "Go through the onboarding sequence and confirm the next steps.",
  },
];
