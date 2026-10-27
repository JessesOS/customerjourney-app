// Journey types shared by the portal, the admin, the product files and the
// scripts. Types only, no imports: safe for any module, server or browser, and
// the bottom of the import graph (see lib/productRegistry.ts for the rest).

export type MilestoneStatus = "done" | "current" | "upcoming";
export type StageStatus = "done" | "current" | "locked";

export type ClientChannel = "meta" | "google";

export type JourneyMilestone = {
  id: string;
  title: string;
  detail: string;
  status: MilestoneStatus;
  formId?: string;
  notePrompt?: string;
  notePlaceholder?: string;
  noteRequired?: boolean;
  hasEditableContent?: boolean;
  pendingContentText?: string;
  videoUrl?: string;
  hasUpload?: boolean;
  awaitingTeam?: boolean;
  bookingUrl?: string;
  /** Generic embedded page (e.g. a testimonial form) with its own heading/note. */
  embedUrl?: string;
  embedTitle?: string;
  embedNote?: string;
  guideUrl?: string;
  guideLabel?: string;
  important?: string;
  /** Numbered action steps shown in a card, e.g. "1. Check your inbox, 2. Go
      to the login page, 3. Log in." */
  steps?: string[];
  /** Shows a "copy your portal link" card instead of the usual content — for
      tasks that just ask the client to bookmark where they already are. */
  showPortalLink?: boolean;
  /** A picture shown under the step's how-to list (e.g. what the portal looks like saved to a phone). */
  imageUrl?: string;
  imageAlt?: string;
  /** An "any files" upload for a hasUpload step (photos, PDFs, documents, zips). Absent = the CSV lead-list upload Scale uses. */
  uploadOptions?: UploadOptions;
  /** Voice interview: questions asked one at a time; the answers are saved
      as the task's note. */
  interview?: string[];
  /** An email the client invites to their accounts, shown with a copy button. */
  inviteEmail?: string;
  /** The finish button's wording, in place of "Approve & continue". */
  doneLabel?: string;
  /** Hosted voice agent that runs the interview as a live call; the
      `interview` questions remain as the typed fallback. */
  interviewAgentId?: string;
};

export type JourneyStage = {
  id: string;
  name: string;
  dayStart: number;
  dayEnd: number;
  ongoing?: boolean;
  status: StageStatus;
  blurb?: string;
  milestones: JourneyMilestone[];
  statusNotes: string[];
};

export type MilestoneTemplate = {
  id: string;
  title: string;
  detail: string;
  formId?: string;
  notePrompt?: string;
  notePlaceholder?: string;
  noteRequired?: boolean;
  hasEditableContent?: boolean;
  /** What an editable-content step says while the team hasn't pasted anything yet. Absent = the stock line. */
  pendingContentText?: string;
  videoUrl?: string;
  hasUpload?: boolean;
  awaitingTeam?: boolean;
  bookingUrl?: string;
  embedUrl?: string;
  embedTitle?: string;
  embedNote?: string;
  guideUrl?: string;
  guideLabel?: string;
  important?: string;
  steps?: string[];
  showPortalLink?: boolean;
  /** A picture shown under the step's how-to list (e.g. what the portal looks like saved to a phone). */
  imageUrl?: string;
  imageAlt?: string;
  /** An "any files" upload for a hasUpload step (photos, PDFs, documents, zips). Absent = the CSV lead-list upload Scale uses. */
  uploadOptions?: UploadOptions;
  interview?: string[];
  interviewAgentId?: string;
  inviteEmail?: string;
  doneLabel?: string;
  /** Hidden from the client flow entirely (not rendered, not counted). Flip to
      re-enable a task without deleting it. */
  hidden?: boolean;
  /** Restrict a task to specific ad channels (Scale only). Omit = shown to
      every client of the product. ["meta"] = Meta clients (and Meta+Google);
      ["google"] = Google clients (and Meta+Google). Irrelevant for Respond. */
  channels?: ClientChannel[];
};

export type StageTemplate = {
  id: string;
  name: string;
  dayStart: number;
  dayEnd: number;
  /** An open-ended stage (support after launch): shown without days, and
      outside the day count in the portal header. */
  ongoing?: boolean;
  blurb?: string;
  milestones: MilestoneTemplate[];
  statusNotes: string[];
};

/**
 * Per-stage voice-guide scripts (Imprint-style breathing orb + narration).
 * The caption bubble shows this exact text while the audio plays, so script
 * and audio must be regenerated together — see scripts/generate-voice.sh.
 * Audio files live in public/portal/voice/{scale|respond}-{stageId}.m4a and
 * are placeholder macOS TTS (Karen, en_AU) until a branded voice replaces
 * them — swapping the files requires no code change.
 */
export type StageGuide = { script: string; audioSrc: string };

/**
 * "Ask AI" chips — Imprint-style example questions per stage, with scripted
 * answers. This is the placeholder generation of the assistant: real questions
 * clients actually ask, answered in an AI-chat-shaped bubble, so the UI shell
 * is already the one a live assistant plugs into later. Answers stay
 * process-oriented — they point at the portal, the tasks, and the team, and
 * promise nothing the journey templates don't already say.
 */
/**
 * "Any files" upload on a hasUpload step (BSS custom's "Send the files for
 * your website", Jesse 2026-10-18). Takes several files, one at a time or many
 * at once; the client can press Next without any (everything is optional); with
 * stayOpen the step keeps its upload box after it is ticked, so more can be
 * added later. A step with a notePrompt also shows that text box here.
 */
export type UploadOptions = {
  /** The file picker's accept list, e.g. ".png,.jpg,.pdf". */
  accept: string;
  title: string;
  hint: string;
  choose: string;
  chooseMore: string;
  stayOpen?: boolean;
};

export type AskItem = { q: string; a: string };

/**
 * A product's customer journey map, shown on one approval step (BSS custom
 * first, Jesse 2026-10-18): each journey as a visual flow, open questions
 * flagged "To confirm", and a notes box per journey that saves as the client
 * types (a hidden form, notesFormId, one textarea per journey id plus
 * "also_running" and "anything_else").
 */
export type JourneyMapMessage = { channel: "email" | "text" | "alert" | "page"; label: string };
export type JourneyMapStep = {
  title: string;
  detail: string;
  /** Who does it: shown as a small tag. Absent = it happens on its own. */
  who?: "you" | "them" | "us";
  messages?: JourneyMapMessage[];
  /** A small timeline drawn across the step (e.g. the reminders before a call). */
  timeline?: { label: string; points: { at: string; label: string }[] };
  /** Paths that split here (e.g. good fit / not a fit). */
  branches?: { label: string; detail: string; tone?: "good" | "neutral" }[];
  /** An open question this step waits on, and where the client answers it. */
  pending?: { question: string; where: string };
};
export type JourneyMapJourney = {
  /** Also the notes field id in notesFormId. */
  id: string;
  title: string;
  tagline: string;
  accent: "purple" | "orange" | "teal";
  /** Where people come in. */
  entries: string[];
  steps: JourneyMapStep[];
  outcome: string;
  /** Starts folded, with one tap to open (a parking lot the client needn't read first). */
  collapsed?: boolean;
};
/**
 * A versioned agreement the client accepts on one step (AT Network first,
 * 2026-10-21: the portal is the signature). Change any word and the version
 * must change too: acceptances keep the exact text they accepted.
 */
export type AgreementContent = {
  /** The step the agreement and its acceptance form sit on. */
  step: string;
  version: string;
  title: string;
  /** The entity the signer accepts for. Absent = the signer types it. */
  entity?: string;
  sections: { heading: string; paragraphs: string[] }[];
  /** Extra addresses copied on the signer's confirmation email (e.g. the client's accounts inbox). */
  copyTo?: string[];
};

export type JourneyMapContent = {
  title: string;
  intro: string;
  /** Shown as a small banner: whose draft this is. */
  draftNote: string;
  journeys: JourneyMapJourney[];
  /** Smaller flows that run alongside, and the rules every message follows. */
  alsoRunning: { title: string; detail: string }[];
  rules: string[];
  /** Every open question, with where the client answers it. */
  toConfirm: { question: string; where: string }[];
  /** The hidden form (lib/onboardingForm.ts) that keeps the client's notes. */
  notesFormId: string;
};

/**
 * Plans for the "String Theory" view in the progress panel: a product's work
 * as parallel workstreams across its timeline. Days are journey days (day 1 =
 * the client's start). `ongoing` strings run past the end of the axis.
 * `after` names the workstreams that feed this one (drawn as threads).
 */
export type StringWorkstream = { id: string; name: string; dayStart: number; dayEnd: number; ongoing?: boolean; taskIds: string[]; after?: string[] };
export type StringPlan = { weeks: number; goLiveDay: number; tailLabel: string; workstreams: StringWorkstream[] };

/** A portal look (PORTAL_THEME_VARIANTS in lib/portalClientStore.ts, which asserts the two agree). */
export type PortalLook = "grove" | "groveaurora" | "handoff" | "cobalt" | "aurora" | "calm" | "warm" | "cool" | "neutral";

/** A video that plays after the welcome's "Get started", before the journey page. */
export type IntroVideo = { src: string; poster: string; title: string };

/** An option in the admin's product dropdown. */
export type ClientTypeOption = { value: string; label: string };

/** One stage of the admin's task checklist for a client. */
export type ChecklistStage = { id: string; name: string; milestones: { id: string; title: string; awaitingTeam: boolean }[] };

/** Everything the client portal needs for one client type. Plain data: built on the
    server by lib/productRegistry.ts, passed to ClientPortalExperience as a prop.
    Holds no team tasks, labels or internal ids. Treat as read-only (it is cached). */
export type PortalJourney = {
  totalDays: number;              // header "Day x / N" and the current-day cap
  wordmark: string;               // "Scale" | "CRM": house name when brandName is unset
  brandName?: string;
  tagline?: string;
  introVideo?: IntroVideo;
  lockedLook?: PortalLook;
  hidesIncentive: boolean;
  /** Portal stages in order: team-only stages dropped; hidden and other-channel steps
      dropped (hidden/channels keys removed); the variant's taskDetails applied. */
  stages: StageTemplate[];
  taskNotes: Record<string, string>;
  hiddenTaskVideos: string[];
  hiddenTaskBooking: string[];
  hiddenTaskImportant: string[];
  playgroundSteps: string[];      // visible steps that show the live AI receptionist test
  landingPreviewSteps: string[];  // visible steps that show the landing-page preview
  stageGuides: Record<string, StageGuide>; // only stages that have one
  askItems: Record<string, AskItem[]>;     // only stages that have items
  stringPlan: StringPlan | null;
  /** The "Ask Jesse" help panel is on. Absent (not false) when off, so other products' journeys are unchanged. */
  assistant?: true;
  /** Communications (step threads and the Messages panel) are on. Absent when off, so other products' journeys are unchanged. */
  comms?: true;
  /** Steps whose completion note is a typed-name approval, recorded in the step's thread. Absent when none. */
  approvalSteps?: string[];
  /** Home-screen app icon name (public/portal/icons/<name>-<size>.png). Absent when the product has none. */
  appIcon?: string;
  /** The customer journey map and the step it shows on. Absent when the product has none. */
  journeyMap?: { step: string; content: JourneyMapContent };
  /** The agreement the client accepts on one step. Absent when the product has none. */
  agreement?: AgreementContent;
};
