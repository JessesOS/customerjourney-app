import {
  liveDashboardTaskOverrides,
  type ManualTaskOwner,
  type ManualTaskOverride,
  type PersistedTaskOverride,
} from "@/lib/liveDashboardOverrides";

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

type CuratedTask = BridgeTask & {
  curatedTitle: string;
  curatedDetail: string;
  curatedOwner?: ManualTaskOwner;
  curatedVisible: boolean;
  curatedPinnedRank?: number;
  curatedBlocker?: boolean;
};

export type AdminTask = {
  id: string;
  sourceTitle: string;
  sourceDetail: string;
  phase: string;
  status: BridgeTaskStatus;
  assignee: string;
  portalVisible: boolean;
  portalActionRequired: boolean;
  effective: {
    visible: boolean;
    owner: ManualTaskOwner | "auto";
    title: string;
    detail: string;
    pinnedRank: number | null;
    blocker: boolean;
  };
  persistedOverride: PersistedTaskOverride | null;
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

function presentCuratedTitle(task: CuratedTask) {
  return task.curatedTitle;
}

function presentCuratedDetail(task: CuratedTask) {
  return task.curatedDetail;
}

function normalizeText(value: string) {
  return value.toLowerCase();
}

function defaultOverrideForTask(task: BridgeTask) {
  const title = presentTitle(task);
  return liveDashboardTaskOverrides.find((override) =>
    normalizeText(title).includes(normalizeText(override.titleIncludes)),
  );
}

function persistedOverrideForTask(task: BridgeTask, persistedOverrides: PersistedTaskOverride[]) {
  return persistedOverrides.find((override) => override.taskId === task.id) ?? null;
}

function mergeOverride(
  task: BridgeTask,
  defaultOverride: ManualTaskOverride | undefined,
  persistedOverride: PersistedTaskOverride | null,
): CuratedTask {
  const title = persistedOverride?.title ?? defaultOverride?.title ?? presentTitle(task);
  const detail = persistedOverride?.detail ?? defaultOverride?.detail ?? detailFromTask(task);

  return {
    ...task,
    curatedTitle: title,
    curatedDetail: detail,
    curatedOwner: persistedOverride?.owner ?? defaultOverride?.owner,
    curatedVisible: persistedOverride?.visible ?? defaultOverride?.visible ?? true,
    curatedPinnedRank: persistedOverride?.pinnedRank ?? defaultOverride?.pinnedRank,
    curatedBlocker: persistedOverride?.blocker ?? defaultOverride?.blocker,
  };
}

function curateTasks(tasks: BridgeTask[], persistedOverrides: PersistedTaskOverride[] = []) {
  return tasks
    .map((task) =>
      mergeOverride(
        task,
        defaultOverrideForTask(task),
        persistedOverrideForTask(task, persistedOverrides),
      ),
    )
    .filter((task) => task.curatedVisible);
}

function dedupeTasks(tasks: CuratedTask[]) {
  const seen = new Set<string>();
  const deduped: CuratedTask[] = [];

  for (const task of tasks) {
    const key = presentCuratedTitle(task).trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(task);
  }

  return deduped;
}

function samePhaseTasks(tasks: CuratedTask[], phase: string) {
  return tasks.filter((task) => task.phase === phase);
}

function isClientOwnedPrompt(task: CuratedTask) {
  if (task.curatedOwner === "chris") return true;
  if (task.curatedOwner === "jesse") return false;

  const haystack = normalizeText(`${presentCuratedTitle(task)} ${presentCuratedDetail(task)}`);

  if (task.portalActionRequired) return true;

  if (
    /\b(complete|review|approve|connect|upload|prepare|bookmark|download|attend|provide|confirm|submit|share)\b/.test(
      haystack,
    )
  ) {
    return true;
  }

  if (
    /\b(walk the client through|ask the client|warn the client|post a recap|paste the read\.ai)\b/.test(
      haystack,
    )
  ) {
    return false;
  }

  return false;
}

function sortCuratedTasks(tasks: CuratedTask[]) {
  return [...tasks].sort((left, right) => {
    const leftPinned = left.curatedPinnedRank ?? Number.MAX_SAFE_INTEGER;
    const rightPinned = right.curatedPinnedRank ?? Number.MAX_SAFE_INTEGER;

    if (leftPinned !== rightPinned) return leftPinned - rightPinned;

    return sortTasks([left, right])[0] === left ? -1 : 1;
  });
}

function clientFacingTasks(tasks: CuratedTask[], currentPhase: string) {
  const phaseTasks = samePhaseTasks(tasks, currentPhase).filter(
    (task) => task.status !== "complete",
  );

  const explicitClientTasks = dedupeTasks(
    sortCuratedTasks(
      phaseTasks.filter(
        (task) => (task.portalVisible || task.portalActionRequired) && isClientOwnedPrompt(task),
      ),
    ),
  );

  if (explicitClientTasks.length) return explicitClientTasks;

  return dedupeTasks(
    sortCuratedTasks(phaseTasks.filter((task) => task.portalVisible || task.portalActionRequired)),
  );
}

function internalTasks(tasks: CuratedTask[], currentPhase: string) {
  const phaseTasks = samePhaseTasks(tasks, currentPhase).filter(
    (task) => task.status !== "complete",
  );

  return dedupeTasks(
    sortCuratedTasks(
      phaseTasks.filter(
        (task) =>
          !isClientOwnedPrompt(task) &&
          ["blocked", "in_progress", "review"].includes(task.status),
      ),
    ),
  );
}

function recentMovement(tasks: CuratedTask[]) {
  return [...tasks]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 4)
    .map((task) => ({
      text:
        task.status === "complete"
          ? `${presentCuratedTitle(task)} marked complete.`
          : task.status === "blocked" || task.curatedBlocker
            ? `${presentCuratedTitle(task)} is blocked.`
            : `${presentCuratedTitle(task)} is ${task.status.replace("_", " ")}.`,
      tone:
        task.status === "blocked" || task.curatedBlocker
          ? "red"
          : task.status === "complete"
            ? "teal"
            : "gold",
    }));
}

export function buildLiveBridgePayload(
  client: BridgeClient,
  tasks: BridgeTask[],
  dashboardBaseUrl: string,
  persistedOverrides: PersistedTaskOverride[] = [],
): LiveBridgePayload {
  const curatedTasks = curateTasks(tasks, persistedOverrides);
  const openTasks = curatedTasks.filter((task) => task.status !== "complete");
  const currentStageIndex = normalizePhaseToSequenceIndex(client.phase);
  const currentPhaseTasks = samePhaseTasks(openTasks, client.phase);
  const currentPhaseBlocked = sortCuratedTasks(
    currentPhaseTasks.filter((task) => task.status === "blocked" || task.curatedBlocker),
  );
  const clientOpen = clientFacingTasks(curatedTasks, client.phase);
  const internalOpen = internalTasks(curatedTasks, client.phase);
  const launchCountdown = daysToLaunch(client.goLiveDate);
  const completed = curatedTasks.filter((task) => task.status === "complete").length;
  const curatedOpenCount = dedupeTasks([...clientOpen, ...internalOpen]).length;
  const currentStageLabel = phaseSequence[currentStageIndex] ?? titleCasePhase(client.phase);
  const nextStageLabel = phaseSequence[Math.min(currentStageIndex + 1, phaseSequence.length - 1)] ?? "Next phase";

  const statusCards: StatusCard[] = [
    {
      label: "Project Health",
      title: labelForHealth(client.health),
      detail:
        currentPhaseBlocked.length > 0
          ? `${currentPhaseBlocked.length} item${currentPhaseBlocked.length === 1 ? "" : "s"} currently blocking ${currentStageLabel.toLowerCase()}.`
          : `${currentPhaseTasks.length} active ${currentStageLabel.toLowerCase()} item${currentPhaseTasks.length === 1 ? "" : "s"} remain in the live checklist.`,
      tone: toneForHealth(client.health),
    },
    {
      label: "Blockers",
      title: String(currentPhaseBlocked.length),
      meta: currentPhaseBlocked.length ? "open - needs resolution" : "none active",
      badge: currentPhaseBlocked.length ? "Needs attention" : undefined,
      bullets: currentPhaseBlocked.slice(0, 3).map((task) => presentCuratedTitle(task)),
      tone: currentPhaseBlocked.length ? "red" : "teal",
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
      value: String(clientOpen.slice(0, 4).length),
      detail: "priority client asks",
      tone: "gold",
    },
    {
      label: "Awaiting RT Digital",
      value: String(internalOpen.slice(0, 4).length),
      detail: "priority internal items",
      tone: "teal",
    },
    {
      label: "Open Actions",
      value: `${curatedOpenCount}/${curatedTasks.length}`,
      detail: `${completed} done overall`,
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
      count: currentPhaseBlocked.length,
      tone: "red",
      items: currentPhaseBlocked.slice(0, 3).map((task) => ({
        title: presentCuratedTitle(task),
        detail: presentCuratedDetail(task),
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
        title: presentCuratedTitle(task),
        detail: presentCuratedDetail(task),
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
        title: presentCuratedTitle(task),
        detail: presentCuratedDetail(task),
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
      title: presentCuratedTitle(task),
      detail: presentCuratedDetail(task),
      completed: false,
    })),
    ...internalOpen.slice(0, 4)
      .map((task) => ({
        id: task.id,
        owner: "jesse" as const,
        title: presentCuratedTitle(task),
        detail: `${task.assignee} · ${presentCuratedDetail(task)}`,
        completed: false,
      })),
  ];

  const topbarBadge = `${labelForHealth(client.health)} · ${currentPhaseBlocked.length} BLOCKER${currentPhaseBlocked.length === 1 ? "" : "S"}`;

  return {
    syncedAt: new Date().toISOString(),
    updatedStamp: formatUpdatedStamp(),
    topbarBadge,
    statusCards,
    summaryMetrics,
    deliveryPipeline,
    outstandingColumns,
    workingPlanItems,
    latestMovement: recentMovement(curatedTasks),
    ownerLabels: {
      chris: "Client action items",
      jesse: "RT Digital action items",
    },
    portalUrl: client.portalToken ? `${dashboardBaseUrl.replace(/\/$/, "")}/portal/${client.portalToken}` : undefined,
  };
}

export function buildAdminTasks(
  tasks: BridgeTask[],
  persistedOverrides: PersistedTaskOverride[] = [],
) {
  return tasks
    .map((task) => {
      const defaultOverride = defaultOverrideForTask(task);
      const persistedOverride = persistedOverrideForTask(task, persistedOverrides);
      const curatedTask = mergeOverride(task, defaultOverride, persistedOverride);

      return {
        id: task.id,
        sourceTitle: presentTitle(task),
        sourceDetail: detailFromTask(task),
        phase: task.phase,
        status: task.status,
        assignee: task.assignee,
        portalVisible: task.portalVisible,
        portalActionRequired: task.portalActionRequired,
        effective: {
          visible: curatedTask.curatedVisible,
          owner: curatedTask.curatedOwner ?? "auto",
          title: curatedTask.curatedTitle,
          detail: curatedTask.curatedDetail,
          pinnedRank: curatedTask.curatedPinnedRank ?? null,
          blocker: Boolean(curatedTask.curatedBlocker),
        },
        persistedOverride,
      } satisfies AdminTask;
    })
    .sort((left, right) => {
      if (left.phase !== right.phase) return left.phase.localeCompare(right.phase);
      if (left.effective.pinnedRank !== right.effective.pinnedRank) {
        const leftRank = left.effective.pinnedRank ?? Number.MAX_SAFE_INTEGER;
        const rightRank = right.effective.pinnedRank ?? Number.MAX_SAFE_INTEGER;
        return leftRank - rightRank;
      }
      return left.sourceTitle.localeCompare(right.sourceTitle);
    });
}
