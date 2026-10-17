import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { portalClients, portalMilestoneProgress, portalMilestoneUploads, teamBoards, teamMembers, teamTaskEvents, teamTasks } from "@/db/schema";
import { boardSeedFor, labelFor, liveRoles } from "@/lib/productRegistry";
import { computeCurrentDay, getLastActivityAt } from "@/lib/portalClientStore";
import { setting } from "@/lib/settings";
import { teamBoardEnabled, type TeamActor } from "@/lib/teamAuth";
import { dueDaysFor, productById, productForClientType, stepTree, teamTasksFor, variantFor } from "@/products/load";
import type { Product, ProductVariant } from "@/products/types";

/**
 * The team back office's data (Option D, 2026-10-17). Reads the portal's
 * tables (clients, completed steps) but never writes them: everything the team
 * does lives in the team_* tables, so nothing here can change a client's portal.
 */

export type TaskStatus = "queued" | "in_progress" | "complete";
export const TASK_STATUSES: TaskStatus[] = ["queued", "in_progress", "complete"];
export const TASK_PRIORITIES = ["low", "normal", "high", "critical"] as const;

type TaskRow = typeof teamTasks.$inferSelect;

function json<T>(text: string | null | undefined, fallback: T): T {
  if (!text) return fallback;
  try { return JSON.parse(text) as T; } catch { return fallback; }
}

function now() {
  return new Date().toISOString();
}

/** The product a client's board runs on: the stamped one if started, else the current one for their type. */
function productAndVariant(clientType: string, board?: { productId: string; variant: string } | null): { product: Product; variant: ProductVariant } | null {
  if (board) {
    const product = productById(board.productId);
    const variant = product?.variants.find((v) => v.id === board.variant);
    if (product && variant) return { product, variant };
  }
  const product = productForClientType(clientType);
  if (!product) return null;
  return { product, variant: variantFor(product, clientType) };
}

/** Why a client's board can't start, or null when it can (unknown type, or a paused or draft product). */
export function startBlockedReason(clientType: string): string | null {
  const seed = boardSeedFor(clientType, { drafts: false });
  return seed.ok ? null : seed.reason;
}

// ---- Starting a board ----

export async function seedTeamBoard(clientId: string, actor: TeamActor): Promise<{ ok: true; created: number } | { ok: false; error: string; status: number }> {
  const db = getDb();
  const client = (await db.select().from(portalClients).where(eq(portalClients.id, clientId)).limit(1))[0];
  if (!client) return { ok: false, error: "Unknown client.", status: 404 };
  const seed = boardSeedFor(client.clientType, { drafts: false });
  if (!seed.ok) return { ok: false, error: seed.reason, status: 409 };
  const existing = (await db.select().from(teamBoards).where(eq(teamBoards.clientId, clientId)).limit(1))[0];
  if (existing) return { ok: true, created: 0 };

  const { product, variant, tasks } = seed;

  // Auto-assign only when exactly one active member covers the role.
  const members = (await db.select().from(teamMembers).where(eq(teamMembers.active, true))).map((m) => ({ email: m.email, roles: json<string[]>(m.roles, []) }));
  const assigneeFor = (role: string) => {
    const covering = members.filter((m) => m.roles.includes(role));
    return covering.length === 1 ? covering[0].email : null;
  };

  const stamp = now();
  const rows = tasks.map((t, i) => {
    const days = dueDaysFor(t);
    return {
      clientId,
      templateId: t.id,
      productVersion: product.version,
      isCustom: false,
      title: t.title,
      notes: t.notes,
      stageId: t.stage,
      category: t.category,
      stepId: t.step ?? null,
      completesWithSteps: JSON.stringify(t.completesWithSteps ?? []),
      role: t.role,
      assigneeEmail: assigneeFor(t.role),
      status: "queued",
      blockedReason: "",
      priority: t.priority,
      dueWindow: t.due,
      dueDayStart: days?.start ?? null,
      dueDayEnd: days?.end ?? null,
      dependencies: JSON.stringify(t.dependencies),
      loomUrl: "",
      sortOrder: i,
      createdAt: stamp,
      updatedAt: stamp,
    };
  });

  // D1 allows 100 bound values per statement; a task row binds ~23. Three rows
  // per insert, all statements in one batch (atomic).
  const statements = [];
  statements.push(db.insert(teamBoards).values({ clientId, productId: product.id, productVersion: product.version, variant: variant.id, startedAt: stamp, startedBy: actor.email }).onConflictDoNothing());
  for (let i = 0; i < rows.length; i += 3) {
    statements.push(db.insert(teamTasks).values(rows.slice(i, i + 3)).onConflictDoNothing());
  }
  statements.push(db.insert(teamTaskEvents).values({ clientId, taskId: null, actorEmail: actor.email, actorName: actor.name, kind: "seed", fromValue: null, toValue: `${product.name} ${product.version} (${variant.label}), ${rows.length} tasks`, createdAt: stamp }));
  await db.batch(statements as unknown as [typeof statements[number], ...typeof statements]);
  return { ok: true, created: rows.length };
}

// ---- Reading a board ----

function effective(task: TaskRow, completedSteps: Set<string>) {
  const withSteps = json<string[]>(task.completesWithSteps, []);
  const doneByClient = task.status !== "complete" && withSteps.length > 0 && withSteps.every((s) => completedSteps.has(s));
  return { status: (doneByClient ? "complete" : task.status) as TaskStatus, doneByClient };
}

export type BoardTask = {
  id: number;
  templateId: string;
  title: string;
  notes: string;
  stageId: string;
  category: string;
  stepId: string | null;
  role: string;
  assigneeEmail: string | null;
  assigneeName: string | null;
  status: TaskStatus;
  storedStatus: TaskStatus;
  doneByClient: boolean;
  blockedReason: string;
  priority: string;
  dueWindow: string;
  dueDayStart: number | null;
  dueDayEnd: number | null;
  overdue: boolean;
  dependencies: { templateId: string; title: string; done: boolean }[];
  loomUrl: string;
  isCustom: boolean;
  updatedAt: string;
  statusChangedAt: string | null;
  completedAt: string | null;
  completedBy: string | null;
};

function toBoardTasks(rows: TaskRow[], completedSteps: Set<string>, calendarDay: number, names: Map<string, string>): BoardTask[] {
  const byTemplate = new Map(rows.map((r) => [r.templateId, r]));
  return rows
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
    .map((r) => {
      const eff = effective(r, completedSteps);
      return {
        id: r.id,
        templateId: r.templateId,
        title: r.title,
        notes: r.notes,
        stageId: r.stageId,
        category: r.category,
        stepId: r.stepId,
        role: r.role,
        assigneeEmail: r.assigneeEmail,
        assigneeName: r.assigneeEmail ? names.get(r.assigneeEmail) ?? r.assigneeEmail : null,
        status: eff.status,
        storedStatus: r.status as TaskStatus,
        doneByClient: eff.doneByClient,
        blockedReason: r.blockedReason,
        priority: r.priority,
        dueWindow: r.dueWindow,
        dueDayStart: r.dueDayStart,
        dueDayEnd: r.dueDayEnd,
        overdue: eff.status !== "complete" && r.dueDayEnd !== null && calendarDay > r.dueDayEnd,
        dependencies: json<string[]>(r.dependencies, []).map((id) => {
          const dep = byTemplate.get(id);
          return { templateId: id, title: dep?.title ?? id, done: dep ? effective(dep, completedSteps).status === "complete" : false };
        }),
        loomUrl: r.loomUrl,
        isCustom: r.isCustom,
        updatedAt: r.updatedAt,
        statusChangedAt: r.statusChangedAt,
        completedAt: r.completedAt,
        completedBy: r.completedBy,
      };
    });
}

async function memberNames() {
  const db = getDb();
  const members = await db.select().from(teamMembers);
  return { members, names: new Map(members.map((m) => [m.email, m.name])) };
}

export async function getBoard(clientId: string) {
  const db = getDb();
  const client = (await db.select().from(portalClients).where(eq(portalClients.id, clientId)).limit(1))[0];
  if (!client) return null;
  const clientType = client.clientType;
  const board = (await db.select().from(teamBoards).where(eq(teamBoards.clientId, clientId)).limit(1))[0] ?? null;
  const pv = productAndVariant(clientType, board);

  const [progressRows, uploadRows, taskRows, eventRows, { members, names }] = await Promise.all([
    db.select().from(portalMilestoneProgress).where(eq(portalMilestoneProgress.clientId, clientId)),
    db.select({ milestoneId: portalMilestoneUploads.milestoneId }).from(portalMilestoneUploads).where(eq(portalMilestoneUploads.clientId, clientId)),
    db.select().from(teamTasks).where(eq(teamTasks.clientId, clientId)),
    db.select().from(teamTaskEvents).where(eq(teamTaskEvents.clientId, clientId)).orderBy(desc(teamTaskEvents.id)).limit(50),
    memberNames(),
  ]);
  const completedSteps = new Set(progressRows.filter((r) => r.completedAt).map((r) => r.milestoneId));
  const notes = new Map(progressRows.filter((r) => r.note).map((r) => [r.milestoneId, r.note as string]));
  const uploads = new Map<string, number>();
  for (const u of uploadRows) uploads.set(u.milestoneId, (uploads.get(u.milestoneId) ?? 0) + 1);

  const totalDays = pv?.product.totalDays ?? 30;
  const day = computeCurrentDay(client.startDate, totalDays);
  const calendarDay = computeCurrentDay(client.startDate, 100000);
  const tasks = toBoardTasks(taskRows, completedSteps, calendarDay, names);

  const stages = pv
    ? stepTree(pv.product, pv.variant).map((node) => ({
        id: node.stage.id,
        name: node.stage.name,
        dayStart: node.stage.dayStart,
        dayEnd: node.stage.dayEnd,
        ongoing: Boolean(node.stage.ongoing),
        teamOnly: Boolean(node.stage.teamOnly),
        steps: node.steps.map((s) => ({
          id: s.step.id,
          title: s.step.title,
          done: completedSteps.has(s.step.id),
          clientOnly: Boolean(s.step.clientOnly),
          note: notes.get(s.step.id) ?? null,
          uploads: uploads.get(s.step.id) ?? 0,
        })),
      }))
    : [];

  const visibleSteps = stages.flatMap((s) => s.steps);
  const ev = eventRows.map((e) => ({ id: e.id, taskId: e.taskId, actorName: e.actorName, actorEmail: e.actorEmail, kind: e.kind, fromValue: e.fromValue, toValue: e.toValue, createdAt: e.createdAt }));
  return {
    client: {
      id: client.id,
      name: client.name,
      companyName: client.companyName,
      clientType,
      label: labelFor(clientType) ?? clientType,
      startDate: client.startDate,
      day,
      calendarDay,
      totalDays,
      journeyState: client.journeyState,
      firstOpenedAt: client.firstOpenedAt,
      lastOpenedAt: client.lastOpenedAt,
      portalToken: client.portalToken,
    },
    board: board ? { ...board, productName: pv?.product.name ?? board.productId } : null,
    startBlocked: board ? null : startBlockedReason(clientType),
    productNow: pv ? { id: pv.product.id, name: pv.product.name, version: pv.product.version, variant: pv.variant.label, tasks: teamTasksFor(pv.product, pv.variant).length } : null,
    stages,
    tasks,
    events: ev,
    members: members.filter((m) => m.active).map((m) => ({ email: m.email, name: m.name, roles: json<string[]>(m.roles, []) })),
    roles: pv?.product.roles ?? [],
    progress: {
      clientSteps: { done: visibleSteps.filter((s) => s.done).length, total: visibleSteps.length },
      team: { done: tasks.filter((t) => t.status === "complete").length, total: tasks.length },
    },
  };
}

// ---- Changing tasks ----

export type TaskPatch = Partial<{
  status: TaskStatus;
  assigneeEmail: string | null;
  blockedReason: string;
  priority: string;
  notes: string;
  loomUrl: string;
  title: string;
  dueWindow: string;
}>;

const EVENT_KIND: Record<keyof TaskPatch, string> = {
  status: "status",
  assigneeEmail: "assign",
  blockedReason: "blocked",
  priority: "priority",
  notes: "notes",
  loomUrl: "loom",
  title: "title",
  dueWindow: "due",
};

export async function updateTeamTask(taskId: number, patch: TaskPatch, actor: TeamActor, expectedUpdatedAt?: string): Promise<{ ok: true; task: TaskRow } | { ok: false; error: string; status: number }> {
  const db = getDb();
  const row = (await db.select().from(teamTasks).where(eq(teamTasks.id, taskId)).limit(1))[0];
  if (!row) return { ok: false, error: "Unknown task.", status: 404 };
  if (expectedUpdatedAt && expectedUpdatedAt !== row.updatedAt) {
    return { ok: false, error: "Someone else changed this task. Refresh to see their change.", status: 409 };
  }

  if (patch.status !== undefined && !TASK_STATUSES.includes(patch.status)) return { ok: false, error: "Unknown status.", status: 400 };
  if (patch.priority !== undefined && !(TASK_PRIORITIES as readonly string[]).includes(patch.priority)) return { ok: false, error: "Unknown priority.", status: 400 };
  if (patch.title !== undefined && !patch.title.trim()) return { ok: false, error: "A task needs a title.", status: 400 };
  if (patch.loomUrl && !/^https:\/\//.test(patch.loomUrl)) return { ok: false, error: "Links must start with https://", status: 400 };
  if (patch.assigneeEmail) {
    patch.assigneeEmail = patch.assigneeEmail.toLowerCase();
    const member = (await db.select().from(teamMembers).where(eq(teamMembers.email, patch.assigneeEmail)).limit(1))[0];
    if (!member || !member.active) return { ok: false, error: "That person isn't on the team.", status: 400 };
  }

  const stamp = now();
  const set: Partial<typeof teamTasks.$inferInsert> = { updatedAt: stamp };
  const events: (typeof teamTaskEvents.$inferInsert)[] = [];
  for (const key of Object.keys(patch) as (keyof TaskPatch)[]) {
    const next = patch[key] ?? null;
    const prev = (row as Record<string, unknown>)[key] ?? null;
    if (next === prev) continue;
    (set as Record<string, unknown>)[key] = typeof next === "string" ? next.slice(0, key === "notes" ? 20000 : 2000) : next;
    const short = (v: unknown) => (v === null || v === undefined ? null : String(v).slice(0, 300));
    events.push({ clientId: row.clientId, taskId: row.id, actorEmail: actor.email, actorName: actor.name, kind: EVENT_KIND[key], fromValue: key === "notes" ? null : short(prev), toValue: key === "notes" ? null : short(next), createdAt: stamp });
  }
  if (patch.status !== undefined && patch.status !== row.status) {
    set.statusChangedAt = stamp;
    set.completedAt = patch.status === "complete" ? stamp : null;
    set.completedBy = patch.status === "complete" ? actor.email : null;
  }
  if (events.length === 0) return { ok: true, task: row };

  const statements = [
    db.update(teamTasks).set(set).where(and(eq(teamTasks.id, row.id), eq(teamTasks.updatedAt, row.updatedAt))),
    db.insert(teamTaskEvents).values(events),
  ];
  await db.batch(statements as unknown as [typeof statements[number], ...typeof statements]);
  const updated = (await db.select().from(teamTasks).where(eq(teamTasks.id, row.id)).limit(1))[0];
  if (updated.updatedAt !== stamp) return { ok: false, error: "Someone else changed this task. Refresh to see their change.", status: 409 };
  return { ok: true, task: updated };
}

export async function createCustomTask(
  clientId: string,
  input: { title: string; stageId: string; stepId?: string | null; role?: string; priority?: string; dueWindow?: string; notes?: string },
  actor: TeamActor,
): Promise<{ ok: true; id: number } | { ok: false; error: string; status: number }> {
  const db = getDb();
  const board = (await db.select().from(teamBoards).where(eq(teamBoards.clientId, clientId)).limit(1))[0];
  if (!board) return { ok: false, error: "Start this client's board first.", status: 409 };
  const title = input.title?.trim();
  if (!title) return { ok: false, error: "A task needs a title.", status: 400 };
  const priority = (TASK_PRIORITIES as readonly string[]).includes(input.priority ?? "") ? input.priority! : "normal";
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const templateId = `custom-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
  const existing = await db.select({ sortOrder: teamTasks.sortOrder }).from(teamTasks).where(eq(teamTasks.clientId, clientId));
  const stamp = now();
  const inserted = await db
    .insert(teamTasks)
    .values({
      clientId, templateId, productVersion: board.productVersion, isCustom: true, title: title.slice(0, 2000), notes: (input.notes ?? "").slice(0, 20000),
      stageId: input.stageId || "onboarding", category: "Added by the team", stepId: input.stepId || null, role: input.role ?? "",
      assigneeEmail: null, status: "queued", priority, dueWindow: input.dueWindow ?? "", sortOrder: Math.max(0, ...existing.map((e) => e.sortOrder)) + 1,
      createdAt: stamp, updatedAt: stamp,
    })
    .returning({ id: teamTasks.id });
  const id = inserted[0].id;
  await db.insert(teamTaskEvents).values({ clientId, taskId: id, actorEmail: actor.email, actorName: actor.name, kind: "create", fromValue: null, toValue: title.slice(0, 300), createdAt: stamp });
  return { ok: true, id };
}

export async function deleteCustomTask(taskId: number, actor: TeamActor): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const db = getDb();
  const row = (await db.select().from(teamTasks).where(eq(teamTasks.id, taskId)).limit(1))[0];
  if (!row) return { ok: false, error: "Unknown task.", status: 404 };
  if (!row.isCustom) return { ok: false, error: "Only tasks the team added can be deleted.", status: 409 };
  const stamp = now();
  const statements = [
    db.delete(teamTasks).where(eq(teamTasks.id, row.id)),
    db.insert(teamTaskEvents).values({ clientId: row.clientId, taskId: null, actorEmail: actor.email, actorName: actor.name, kind: "delete", fromValue: row.title.slice(0, 300), toValue: null, createdAt: stamp }),
  ];
  await db.batch(statements as unknown as [typeof statements[number], ...typeof statements]);
  return { ok: true };
}

export async function addComment(taskId: number, text: string, actor: TeamActor): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const db = getDb();
  const body = text?.trim();
  if (!body) return { ok: false, error: "Write a comment first.", status: 400 };
  const row = (await db.select({ clientId: teamTasks.clientId }).from(teamTasks).where(eq(teamTasks.id, taskId)).limit(1))[0];
  if (!row) return { ok: false, error: "Unknown task.", status: 404 };
  await db.insert(teamTaskEvents).values({ clientId: row.clientId, taskId, actorEmail: actor.email, actorName: actor.name, kind: "comment", fromValue: null, toValue: body.slice(0, 4000), createdAt: now() });
  return { ok: true };
}

export async function taskEvents(taskId: number) {
  const db = getDb();
  return db.select().from(teamTaskEvents).where(eq(teamTaskEvents.taskId, taskId)).orderBy(desc(teamTaskEvents.id)).limit(100);
}

export async function teamTaskById(taskId: number) {
  const db = getDb();
  return (await db.select().from(teamTasks).where(eq(teamTasks.id, taskId)).limit(1))[0] ?? null;
}

// ---- Across clients ----

async function allBoardData() {
  const db = getDb();
  const [clients, boards, tasks, progress, { members, names }] = await Promise.all([
    db.select().from(portalClients),
    db.select().from(teamBoards),
    db.select().from(teamTasks),
    db.select().from(portalMilestoneProgress),
    memberNames(),
  ]);
  const completedByClient = new Map<string, Set<string>>();
  for (const p of progress) {
    if (!p.completedAt) continue;
    if (!completedByClient.has(p.clientId)) completedByClient.set(p.clientId, new Set());
    completedByClient.get(p.clientId)!.add(p.milestoneId);
  }
  const tasksByClient = new Map<string, TaskRow[]>();
  for (const t of tasks) {
    if (!tasksByClient.has(t.clientId)) tasksByClient.set(t.clientId, []);
    tasksByClient.get(t.clientId)!.push(t);
  }
  return { clients, boards: new Map(boards.map((b) => [b.clientId, b])), tasksByClient, completedByClient, members, names };
}

/** Every client with what needs attention, worst first. */
export async function teamOverview() {
  const { clients, boards, tasksByClient, completedByClient, names } = await allBoardData();
  const STUCK_DAYS = 5;
  const rows = await Promise.all(
    clients.map(async (c) => {
      const clientType = c.clientType;
      const board = boards.get(c.id) ?? null;
      const pv = productAndVariant(clientType, board);
      const completed = completedByClient.get(c.id) ?? new Set<string>();
      const calendarDay = computeCurrentDay(c.startDate, 100000);
      const tasks = toBoardTasks(tasksByClient.get(c.id) ?? [], completed, calendarDay, names);
      const tree = pv ? stepTree(pv.product, pv.variant) : [];
      const steps = tree.flatMap((n) => n.steps.map((s) => ({ id: s.step.id, title: s.step.title, stageId: n.stage.id, done: completed.has(s.step.id) })));
      const nextStep = steps.find((s) => !s.done) ?? null;
      const currentStage = nextStep?.stageId ?? null;
      const open = tasks.filter((t) => t.status !== "complete");
      const lastActivityAt = await getLastActivityAt(c.id);
      const daysSinceActivity = lastActivityAt ? Math.floor((Date.now() - Date.parse(lastActivityAt)) / 86400000) : null;
      const flags = {
        blocked: open.filter((t) => t.blockedReason).length,
        overdue: open.filter((t) => t.overdue).length,
        stuck: open.filter((t) => t.status === "in_progress" && t.statusChangedAt && Date.now() - Date.parse(t.statusChangedAt) > STUCK_DAYS * 86400000).length,
        unassignedNow: currentStage ? open.filter((t) => t.stageId === currentStage && !t.assigneeEmail).length : 0,
      };
      const severity = flags.blocked * 3 + flags.overdue * 2 + flags.stuck * 2 + (daysSinceActivity !== null && daysSinceActivity >= 3 && nextStep ? 1 : 0);
      return {
        id: c.id,
        name: c.name,
        companyName: c.companyName,
        label: labelFor(clientType) ?? clientType,
        day: computeCurrentDay(c.startDate, pv?.product.totalDays ?? 30),
        totalDays: pv?.product.totalDays ?? 30,
        journeyState: c.journeyState,
        boardStarted: Boolean(board),
        startBlocked: board ? null : startBlockedReason(clientType),
        clientSteps: { done: steps.filter((s) => s.done).length, total: steps.length },
        nextStep: nextStep ? { id: nextStep.id, title: nextStep.title } : null,
        team: { done: tasks.length - open.length, total: tasks.length },
        flags,
        lastOpenedAt: c.lastOpenedAt,
        lastActivityAt,
        daysSinceActivity,
        severity,
      };
    }),
  );
  return rows.sort((a, b) => Number(b.boardStarted) - Number(a.boardStarted) || b.severity - a.severity || a.name.localeCompare(b.name));
}

/** Tasks for one person: theirs, plus unclaimed ones in roles they cover. */
export async function listMyTasks(actor: TeamActor) {
  const { clients, tasksByClient, completedByClient, names } = await allBoardData();
  const clientsById = new Map(clients.map((c) => [c.id, c]));
  const mine: (BoardTask & { clientId: string; clientName: string })[] = [];
  const claimable: (BoardTask & { clientId: string; clientName: string })[] = [];
  for (const [clientId, rows] of tasksByClient) {
    const c = clientsById.get(clientId);
    if (!c) continue;
    const tasks = toBoardTasks(rows, completedByClient.get(clientId) ?? new Set(), computeCurrentDay(c.startDate, 100000), names);
    for (const t of tasks) {
      if (t.status === "complete") continue;
      const item = { ...t, clientId, clientName: c.name };
      if (t.assigneeEmail === actor.email) mine.push(item);
      else if (!t.assigneeEmail && t.role && actor.roles.includes(t.role)) claimable.push(item);
    }
  }
  const order = (a: BoardTask, b: BoardTask) => Number(b.overdue) - Number(a.overdue) || Number(Boolean(b.blockedReason)) - Number(Boolean(a.blockedReason)) || (a.dueDayEnd ?? 9999) - (b.dueDayEnd ?? 9999);
  return { mine: mine.sort(order), claimable: claimable.sort(order) };
}

// ---- Team members ----

export async function listMembers() {
  const db = getDb();
  const rows = await db.select().from(teamMembers);
  return rows
    .map((m) => ({ id: m.id, email: m.email, name: m.name, roles: json<string[]>(m.roles, []), isAdmin: m.isAdmin, active: m.active, lastSeenAt: m.lastSeenAt }))
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
}

export async function upsertMember(input: { email: string; name: string; roles?: string[]; isAdmin?: boolean; active?: boolean }): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const email = input.email?.trim().toLowerCase();
  const name = input.name?.trim();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Enter a valid email.", status: 400 };
  if (!name) return { ok: false, error: "Enter a name.", status: 400 };
  const db = getDb();
  const roles = JSON.stringify((input.roles ?? []).map((r) => r.trim()).filter(Boolean));
  const stamp = now();
  await db
    .insert(teamMembers)
    .values({ email, name, roles, isAdmin: Boolean(input.isAdmin), active: input.active ?? true, createdAt: stamp, updatedAt: stamp })
    .onConflictDoUpdate({ target: teamMembers.email, set: { name, roles, isAdmin: Boolean(input.isAdmin), active: input.active ?? true, updatedAt: stamp } });
  return { ok: true };
}

/** Every role any live product uses, for the Team page's pickers. */
export function allRoles(): string[] {
  return liveRoles();
}

/** Removes a client's team data (called when the client is deleted). */
export async function deleteTeamDataForClient(clientId: string) {
  const db = getDb();
  await db.delete(teamTaskEvents).where(eq(teamTaskEvents.clientId, clientId));
  await db.delete(teamTasks).where(eq(teamTasks.clientId, clientId));
  await db.delete(teamBoards).where(eq(teamBoards.clientId, clientId));
}

/** Boards started, by client id (for the admin client list). */
export async function boardsByClient(clientIds: string[]) {
  if (clientIds.length === 0) return new Map<string, typeof teamBoards.$inferSelect>();
  const db = getDb();
  const rows = await db.select().from(teamBoards).where(inArray(teamBoards.clientId, clientIds));
  return new Map(rows.map((b) => [b.clientId, b]));
}

/**
 * Starts a new client's board automatically when TEAM_BOARD_AUTOSEED=1 (and the
 * board is on). Never throws: a failure must not stop the client getting their
 * portal. Returns what happened, for the caller to report.
 */
export async function autoStartBoard(clientId: string, by: string): Promise<"started" | "skipped" | string> {
  if (!teamBoardEnabled() || setting("TEAM_BOARD_AUTOSEED") !== "1") return "skipped";
  try {
    const result = await seedTeamBoard(clientId, { email: "system", name: `Automatic (${by})`, isAdmin: true, roles: [], via: "local" });
    return result.ok ? "started" : result.status === 409 ? "skipped" : result.error;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}
