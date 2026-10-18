import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { portalAssistantPacks, portalMessages, teamTaskEvents, teamTasks } from "@/db/schema";
import { notifyHook } from "@/lib/hookNotify";
import { portalJourneyFor } from "@/lib/productRegistry";
import { computeCurrentDay, getCompletedMilestoneIds } from "@/lib/portalClientStore";
import { teamBoardEnabled, type TeamActor } from "@/lib/teamAuth";
import { createCustomTask } from "@/lib/teamStore";

// The "Ask Jesse" panel (Jesse, 2026-10-18). A client's questions, the
// assistant's answers and the team's replies live in portal_messages. The
// assistant answers only from the client's reviewed pack
// (portal_assistant_packs) and their live progress. A support request becomes
// a task on the client's board (category "Support requests") and pings Slack.

export const SUPPORT_CATEGORY = "Support requests";
/** Questions a client can ask in an hour, and requests they can raise in a day. */
export const QUESTIONS_PER_HOUR = 30;
export const REQUESTS_PER_DAY = 10;
/** A client message that is a support request starts with this (title on the first line, details after). */
const REQUEST_PREFIX = "Request: ";

type Client = { id: string; name: string; clientType: string; startDate: string };

const now = () => new Date().toISOString();
const since = (ms: number) => new Date(Date.now() - ms).toISOString();

export async function getAssistantPack(clientId: string): Promise<string | null> {
  const row = (await getDb().select().from(portalAssistantPacks).where(eq(portalAssistantPacks.clientId, clientId)).limit(1))[0];
  return row?.content.trim() ? row.content : null;
}

export async function addPortalMessage(clientId: string, role: "client" | "assistant" | "team", body: string, requestTaskId: number | null = null) {
  await getDb().insert(portalMessages).values({ clientId, role, body: body.slice(0, 8000), requestTaskId, createdAt: now() });
}

/** The client's panel, oldest first: questions, answers, requests and team replies. */
export async function listPortalMessages(clientId: string, limit = 100) {
  const rows = await getDb().select().from(portalMessages).where(eq(portalMessages.clientId, clientId)).orderBy(desc(portalMessages.id)).limit(limit);
  return rows.reverse();
}

export async function questionsInLastHour(clientId: string): Promise<number> {
  const rows = await getDb()
    .select({ id: portalMessages.id })
    .from(portalMessages)
    .where(and(eq(portalMessages.clientId, clientId), eq(portalMessages.role, "client"), gte(portalMessages.createdAt, since(60 * 60 * 1000))));
  return rows.length;
}

/** The client's support requests: one per board task they raised (or Slack-only, without a board). */
export async function listSupportRequests(clientId: string) {
  const db = getDb();
  const asked = await db
    .select()
    .from(portalMessages)
    .where(and(eq(portalMessages.clientId, clientId), eq(portalMessages.role, "client")))
    .orderBy(desc(portalMessages.id));
  const requests = asked.filter((m) => m.body.startsWith(REQUEST_PREFIX));
  const taskIds = requests.map((r) => r.requestTaskId).filter((id): id is number => id !== null);
  const tasks = taskIds.length ? await db.select().from(teamTasks).where(inArray(teamTasks.id, taskIds)) : [];
  const status = new Map(tasks.map((t) => [t.id, t.status]));
  const replies = taskIds.length
    ? await db.select().from(portalMessages).where(and(eq(portalMessages.role, "team"), inArray(portalMessages.requestTaskId, taskIds)))
    : [];
  return requests.map((r) => {
    const [title, ...rest] = r.body.slice(REQUEST_PREFIX.length).split("\n");
    return {
      id: r.id,
      taskId: r.requestTaskId,
      title: title.trim(),
      detail: rest.join("\n").trim(),
      status: (r.requestTaskId !== null ? status.get(r.requestTaskId) : undefined) ?? "queued",
      createdAt: r.createdAt,
      replies: replies.filter((m) => m.requestTaskId === r.requestTaskId).map((m) => ({ body: m.body, createdAt: m.createdAt })),
    };
  });
}

/** The client's stage, day and steps, in plain words, for the assistant. */
export async function liveContextFor(client: Client): Promise<string> {
  const journey = portalJourneyFor(client.clientType);
  const done = await getCompletedMilestoneIds(client.id);
  const day = computeCurrentDay(client.startDate, journey.totalDays);
  const lines = [`Client: ${client.name}. Day ${day} of ${journey.totalDays} to launch.`];
  let next: string | null = null;
  for (const stage of journey.stages) {
    const steps = stage.milestones;
    const left = steps.filter((m) => !done.has(m.id));
    if (!next && left.length) next = `${left[0].title} (stage "${stage.name}")`;
    lines.push(`Stage "${stage.name}" (${stage.ongoing ? "ongoing" : `days ${stage.dayStart}-${stage.dayEnd}`}): ${steps.map((m) => `${m.title} [${done.has(m.id) ? "done" : "to do"}]`).join("; ")}`);
  }
  lines.push(next ? `His next step in the portal: ${next}.` : "Every portal step is done.");
  const requests = await listSupportRequests(client.id);
  if (requests.length) {
    lines.push("His support requests:");
    for (const r of requests.slice(0, 10)) lines.push(`- ${r.title} [${r.status === "complete" ? "done" : r.status === "in_progress" ? "in progress" : "open"}]${r.replies.length ? `; Jesse replied: ${r.replies[r.replies.length - 1].body}` : ""}`);
  }
  return lines.join("\n");
}

/** The stage to file a request under: the first one with a step left to do. */
async function currentStageId(client: Client): Promise<string> {
  const journey = portalJourneyFor(client.clientType);
  const done = await getCompletedMilestoneIds(client.id);
  return journey.stages.find((s) => s.milestones.some((m) => !done.has(m.id)))?.id ?? journey.stages[journey.stages.length - 1]?.id ?? "onboarding";
}

export async function createSupportRequest(
  client: Client,
  input: { title?: string; detail?: string },
): Promise<{ ok: true; onBoard: boolean } | { ok: false; error: string; status: number }> {
  const title = (input.title ?? "").trim().replace(/\s+/g, " ").slice(0, 160);
  const detail = (input.detail ?? "").trim().slice(0, 4000);
  if (!title) return { ok: false, error: "Say what it's about in a few words.", status: 400 };
  const today = (await listSupportRequests(client.id)).filter((r) => r.createdAt >= since(24 * 60 * 60 * 1000)).length;
  if (today >= REQUESTS_PER_DAY) return { ok: false, error: "That's a lot of requests today. Jesse will work through them, or message him directly.", status: 429 };

  const actor: TeamActor = { email: "client@portal", name: `${client.name} (portal)`, isAdmin: false, roles: [], via: "portal" };
  let taskId: number | null = null;
  if (teamBoardEnabled()) {
    const created = await createCustomTask(
      client.id,
      { title, stageId: await currentStageId(client), category: SUPPORT_CATEGORY, priority: "high", dueWindow: "Reply within 1 business day", notes: detail ? `From ${client.name}, in the portal:\n\n${detail}` : `From ${client.name}, in the portal.` },
      actor,
    );
    if (created.ok) taskId = created.id;
  }
  await addPortalMessage(client.id, "client", `${REQUEST_PREFIX}${title}${detail ? `\n${detail}` : ""}`, taskId);
  await notifyHook(`New support request from ${client.name}: ${title}${taskId === null ? " (no team board yet: reply directly)" : ""}`);
  return { ok: true, onBoard: taskId !== null };
}

/** A team reply on a support task: shown in the client's panel. */
export async function replyToClient(taskId: number, text: string, actor: TeamActor): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const body = text?.trim();
  if (!body) return { ok: false, error: "Write a reply first.", status: 400 };
  const db = getDb();
  const task = (await db.select().from(teamTasks).where(eq(teamTasks.id, taskId)).limit(1))[0];
  if (!task) return { ok: false, error: "Unknown task.", status: 404 };
  if (task.category !== SUPPORT_CATEGORY) return { ok: false, error: "Only support requests can be replied to.", status: 409 };
  const stamp = now();
  const statements = [
    db.insert(portalMessages).values({ clientId: task.clientId, role: "team", body: body.slice(0, 4000), requestTaskId: taskId, createdAt: stamp }),
    db.insert(teamTaskEvents).values({ clientId: task.clientId, taskId, actorEmail: actor.email, actorName: actor.name, kind: "comment", fromValue: null, toValue: `Replied to the client: ${body.slice(0, 3900)}`, createdAt: stamp }),
  ];
  await db.batch(statements as unknown as [typeof statements[number], ...typeof statements]);
  return { ok: true };
}
