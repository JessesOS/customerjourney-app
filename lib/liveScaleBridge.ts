export type BridgeTaskStatus =
  | "queued"
  | "in_progress"
  | "blocked"
  | "review"
  | "complete";

export type BridgeTask = {
  id: string;
  title: string;
  category: string;
  phase: string;
  status: BridgeTaskStatus;
  assignee: string;
  dueWindow: string;
  priority: string;
  notes: string;
  portalVisible: boolean;
  portalTitle: string;
  portalNote: string;
  portalActionRequired: boolean;
  portalActionUrl?: string;
  portalActionLabel?: string;
  updatedAt: string;
};

export type BridgeClient = {
  id: string;
  environment: string;
  product: string;
  scaleVariant?: string;
  portalToken?: string;
  name: string;
  companyName?: string;
  code: string;
  industry: string;
  owner: string;
  phase: string;
  health: string;
  progress: number;
  currentTask: string;
  goLiveDate: string;
  goLiveLabel: string;
  lastUpdate: string;
  nextStep: string;
  blocker: string;
  risk: string;
  activeTasks: number;
  completedTasks: number;
};

export type StatusCard = {
  label: string;
  title: string;
  detail?: string;
  meta?: string;
  badge?: string;
  bullets?: string[];
  progress?: string;
  next?: string;
  eta?: string;
  tone: "teal" | "gold" | "red" | "neutral";
};

export type SummaryMetric = {
  label: string;
  value: string;
  detail: string;
  tone: "teal" | "gold" | "red" | "neutral";
};

export type PipelineStage = {
  label: string;
  status: "done" | "current" | "next" | "later";
};

export type OutstandingItem = {
  title: string;
  detail: string;
  owner: string;
  initials: string;
  age: string;
};

export type OutstandingColumn = {
  title: string;
  count: number;
  tone: "teal" | "gold" | "red";
  items: OutstandingItem[];
};

export type ChecklistTask = {
  id: string;
  owner: "chris" | "jesse";
  title: string;
  detail: string;
  completed: boolean;
};

export type LiveBridgePayload = {
  syncedAt: string;
  updatedStamp: string;
  topbarBadge: string;
  statusCards: StatusCard[];
  summaryMetrics: SummaryMetric[];
  deliveryPipeline: PipelineStage[];
  outstandingColumns: OutstandingColumn[];
  workingPlanItems: ChecklistTask[];
  latestMovement: Array<{ text: string; tone: "teal" | "gold" | "red" }>;
  ownerLabels: {
    chris: string;
    jesse: string;
  };
  portalUrl?: string;
};

const phaseSequence = [
  "Pre-onboarding",
  "Onboarding",
  "Strategy",
  "Creative",
  "Build",
  "Launch",
  "Optimise",
] as const;

function toneForHealth(health: string): "teal" | "gold" | "red" {
  if (health === "on_track") return "teal";
  if (health === "at_risk") return "gold";
  return "red";
}

function labelForHealth(health: string) {
  if (health === "on_track") return "ON TRACK";
  if (health === "at_risk") return "AT RISK";
  if (health === "on_hold") return "ON HOLD";
  return "OFF TRACK";
}

function normalizePhaseToSequenceIndex(phase: string) {
  const normalized = phase.toLowerCase();
  if (normalized.includes("onboard")) return 1;
  if (normalized.includes("strateg")) return 2;
  if (normalized.includes("creative")) return 3;
  if (normalized.includes("build") || normalized.includes("implement")) return 4;
  if (normalized.includes("go-live") || normalized.includes("launch") || normalized.includes("testing")) return 5;
  if (normalized.includes("post") || normalized.includes("support")) return 6;
  return 0;
}

function titleCasePhase(phase: string) {
  if (!phase) return "Onboarding";
  return phase.replace(/-/g, " ");
}

function statusRank(status: BridgeTaskStatus) {
  switch (status) {
    case "blocked":
      return 0;
    case "in_progress":
      return 1;
    case "review":
      return 2;
    case "queued":
      return 3;
    case "complete":
      return 4;
    default:
      return 5;
  }
}

function priorityRank(priority: string) {
  if (priority === "critical") return 0;
  if (priority === "high") return 1;
  if (priority === "normal") return 2;
  return 3;
}

function sortTasks(tasks: BridgeTask[]) {
  return [...tasks].sort((left, right) => {
    const statusDelta = statusRank(left.status) - statusRank(right.status);
    if (statusDelta !== 0) return statusDelta;
    const priorityDelta = priorityRank(left.priority) - priorityRank(right.priority);
    if (priorityDelta !== 0) return priorityDelta;
    return left.title.localeCompare(right.title);
  });
}

function initialsFromOwner(owner: string) {
  const compact = owner
    .split(/[\s/-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return compact.slice(0, 2) || "NA";
}

function ageFromUpdatedAt(updatedAt: string) {
  const parsed = new Date(updatedAt);
  if (Number.isNaN(parsed.getTime())) return "";
  const diffMs = Date.now() - parsed.getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (days === 0) return "today";
  return `${days}d`;
}

function daysToLaunch(goLiveDate: string) {
  const now = new Date();
  const target = new Date(goLiveDate);
  if (Number.isNaN(target.getTime())) return null;
  const diffMs = target.getTime() - new Date(now.toDateString()).getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function formatUpdatedStamp() {
  return `Updated today · ${new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date())}`;
}

function detailFromTask(task: BridgeTask) {
  return task.portalNote || task.notes || task.dueWindow || task.assignee;
}

function presentTitle(task: BridgeTask) {
  return task.portalTitle || task.title;
}

function clientFacingTasks(tasks: BridgeTask[]) {
  return tasks.filter((task) => task.status !== "complete" && (task.portalVisible || task.portalActionRequired));
}

function internalTasks(tasks: BridgeTask[]) {
  return tasks.filter((task) => task.status !== "complete" && !task.portalActionRequired);
}

function recentMovement(tasks: BridgeTask[]) {
  return [...tasks]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 4)
    .map((task) => ({
      text:
        task.status === "complete"
          ? `${presentTitle(task)} marked complete.`
          : task.status === "blocked"
            ? `${presentTitle(task)} is blocked.`
            : `${presentTitle(task)} is ${task.status.replace("_", " ")}.`,
      tone:
        task.status === "blocked"
          ? "red"
          : task.status === "complete"
            ? "teal"
            : "gold",
    }));
}

export function buildLiveBridgePayload(
  client: BridgeClient,
  tasks: BridgeTask[],
  dashboardBaseUrl: string
): LiveBridgePayload {
  const openTasks = tasks.filter((task) => task.status !== "complete");
  const blocked = sortTasks(openTasks.filter((task) => task.status === "blocked"));
  const clientOpen = sortTasks(clientFacingTasks(tasks));
  const internalOpen = sortTasks(
    internalTasks(tasks).filter((task) => task.status === "blocked" || task.status === "in_progress" || task.status === "review")
  );
  const currentStageIndex = normalizePhaseToSequenceIndex(client.phase);
  const launchCountdown = daysToLaunch(client.goLiveDate);
  const completed = tasks.filter((task) => task.status === "complete").length;
  const openCount = openTasks.length;
  const currentStageLabel = phaseSequence[currentStageIndex] ?? titleCasePhase(client.phase);
  const nextStageLabel = phaseSequence[Math.min(currentStageIndex + 1, phaseSequence.length - 1)] ?? "Next phase";

  const statusCards: StatusCard[] = [
    {
      label: "Project Health",
      title: labelForHealth(client.health),
      detail:
        blocked.length > 0
          ? `${blocked.length} item${blocked.length === 1 ? "" : "s"} currently blocking progress.`
          : `${openCount} open implementation items remain in the live Scale checklist.`,
      tone: toneForHealth(client.health),
    },
    {
      label: "Blockers",
      title: String(blocked.length),
      meta: blocked.length ? "open - needs resolution" : "none active",
      badge: blocked.length ? "Needs attention" : undefined,
      bullets: blocked.slice(0, 3).map((task) => presentTitle(task)),
      tone: blocked.length ? "red" : "teal",
    },
    {
      label: "Current Stage",
      title: currentStageLabel,
      progress: `${String(currentStageIndex + 1).padStart(2, "0")} / ${String(phaseSequence.length).padStart(2, "0")}`,
      next: `Next - ${nextStageLabel}`,
      eta:
        launchCountdown !== null
          ? `${client.goLiveLabel} - ${launchCountdown} day${launchCountdown === 1 ? "" : "s"}`
          : client.goLiveLabel,
      tone: "teal",
    },
  ];

  const summaryMetrics: SummaryMetric[] = [
    {
      label: "Awaiting Client",
      value: String(clientOpen.length),
      detail: "portal-facing items",
      tone: "gold",
    },
    {
      label: "Awaiting RT Digital",
      value: String(internalOpen.length),
      detail: "internal tasks in motion",
      tone: "teal",
    },
    {
      label: "Open Actions",
      value: `${openCount}/${tasks.length}`,
      detail: `${completed} done`,
      tone: "neutral",
    },
    {
      label: "Days to Launch",
      value: launchCountdown !== null ? String(launchCountdown) : "-",
      detail: `target ${client.goLiveLabel}`,
      tone: "gold",
    },
  ];

  const deliveryPipeline: PipelineStage[] = phaseSequence.map((label, index) => ({
    label,
    status:
      index < currentStageIndex
        ? "done"
        : index === currentStageIndex
          ? "current"
          : index === currentStageIndex + 1
            ? "next"
            : "later",
  }));

  const outstandingColumns: OutstandingColumn[] = [
    {
      title: "Blocking Now",
      count: blocked.length,
      tone: "red",
      items: blocked.slice(0, 3).map((task) => ({
        title: presentTitle(task),
        detail: detailFromTask(task),
        owner: task.assignee,
        initials: initialsFromOwner(task.assignee),
        age: ageFromUpdatedAt(task.updatedAt),
      })),
    },
    {
      title: "Awaiting Client",
      count: clientOpen.length,
      tone: "gold",
      items: clientOpen.slice(0, 3).map((task) => ({
        title: presentTitle(task),
        detail: detailFromTask(task),
        owner: client.name,
        initials: initialsFromOwner(client.name),
        age: ageFromUpdatedAt(task.updatedAt),
      })),
    },
    {
      title: "On RT Digital",
      count: internalOpen.length,
      tone: "teal",
      items: internalOpen.slice(0, 3).map((task) => ({
        title: presentTitle(task),
        detail: detailFromTask(task),
        owner: task.assignee,
        initials: initialsFromOwner(task.assignee),
        age: ageFromUpdatedAt(task.updatedAt),
      })),
    },
  ];

  const workingPlanItems: ChecklistTask[] = [
    ...clientOpen.slice(0, 4).map((task) => ({
      id: task.id,
      owner: "chris" as const,
      title: presentTitle(task),
      detail: detailFromTask(task),
      completed: false,
    })),
    ...sortTasks(
      internalTasks(tasks).filter((task) =>
        task.status === "blocked" || task.status === "in_progress" || task.status === "review" || task.phase === client.phase
      )
    )
      .slice(0, 4)
      .map((task) => ({
        id: task.id,
        owner: "jesse" as const,
        title: presentTitle(task),
        detail: `${task.assignee} · ${detailFromTask(task)}`,
        completed: false,
      })),
  ];

  const topbarBadge = `${labelForHealth(client.health)} · ${blocked.length} BLOCKER${blocked.length === 1 ? "" : "S"}`;

  return {
    syncedAt: new Date().toISOString(),
    updatedStamp: formatUpdatedStamp(),
    topbarBadge,
    statusCards,
    summaryMetrics,
    deliveryPipeline,
    outstandingColumns,
    workingPlanItems,
    latestMovement: recentMovement(tasks),
    ownerLabels: {
      chris: "Client action items",
      jesse: "RT Digital action items",
    },
    portalUrl: client.portalToken ? `${dashboardBaseUrl.replace(/\/$/, "")}/portal/${client.portalToken}` : undefined,
  };
}
