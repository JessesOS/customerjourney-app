import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  portalClients,
  portalFormResponses,
  portalFormUploads,
  portalMilestoneContent,
  portalMilestoneProgress,
  portalMilestoneUploads,
  portalWebhookLog,
} from "@/db/schema";
import { formUploadObjectKey, getUploadsBucket, uploadFileObjectKey } from "@/lib/uploadsBucket";
import { adminLabelFor, DEFAULT_CLIENT_TYPE, lockedLookFor, totalDaysFor, totalMilestoneCountFor } from "@/lib/productRegistry";
import type { PortalFormResponses } from "@/lib/onboardingForm";
import type { PortalLook } from "@/lib/journeyTypes";
import type { ClientType } from "@/products";

export async function getPortalClientByToken(token: string) {
  const db = getDb();
  const rows = await db.select().from(portalClients).where(eq(portalClients.portalToken, token)).limit(1);
  return rows[0] ?? null;
}

export function generatePortalToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function listPortalClients() {
  const db = getDb();
  const clients = await db.select().from(portalClients);
  const progress = await db.select().from(portalMilestoneProgress);

  return clients
    .map((client) => {
      const completedCount = progress.filter((p) => p.clientId === client.id && p.completedAt).length;
      // Days, counts, label and look all come from the client's product file (lib/productRegistry.ts).
      const type = client.clientType;
      const totalDays = totalDaysFor(type);
      return {
        ...client,
        currentDay: computeCurrentDay(client.startDate, totalDays),
        completedMilestoneCount: completedCount,
        totalMilestoneCount: totalMilestoneCountFor(type),
        totalDays,
        clientTypeLabel: adminLabelFor(type),
        lockedLook: lockedLookFor(type) ?? null,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** The client opened their portal: keep the first time, move the last. */
export async function recordPortalOpen(clientId: string) {
  const db = getDb();
  const now = new Date().toISOString();
  await db
    .update(portalClients)
    .set({ firstOpenedAt: sql`coalesce(${portalClients.firstOpenedAt}, ${now})`, lastOpenedAt: now })
    .where(eq(portalClients.id, clientId));
}

// "grove" is the clean green look from the motion redesign, the default for new
// clients from 2026-10-12 (Jesse). TEXT column, so no schema change.
// Every look on the demo switcher is assignable from the admin (Jesse 2026-10-12).
export const PORTAL_THEME_VARIANTS = ["grove", "groveaurora", "handoff", "cobalt", "aurora", "calm", "warm", "cool", "neutral"] as const;
export type PortalThemeVariant = (typeof PORTAL_THEME_VARIANTS)[number];

// Compile-time check: the looks a product file can lock (PortalLook in
// lib/journeyTypes.ts) are exactly these.
type SameType<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const portalLookMatchesThemeVariants: SameType<PortalLook, PortalThemeVariant> = true;
void portalLookMatchesThemeVariants;

export function isPortalThemeVariant(value: unknown): value is PortalThemeVariant {
  return typeof value === "string" && (PORTAL_THEME_VARIANTS as readonly string[]).includes(value);
}

export async function createPortalClient(input: {
  name: string;
  companyName: string;
  startDate: string;
  clientType?: ClientType;
  themeVariant?: PortalThemeVariant;
}) {
  const db = getDb();
  const id = crypto.randomUUID();
  const token = generatePortalToken();

  await db.insert(portalClients).values({
    id,
    name: input.name,
    companyName: input.companyName,
    portalToken: token,
    startDate: input.startDate,
    clientType: input.clientType ?? DEFAULT_CLIENT_TYPE,
    themeVariant: input.themeVariant ?? "grove",
  });

  return { id, portalToken: token };
}

export type JourneyState = "active" | "paused" | "completed" | "cancelled";

export function isJourneyState(value: unknown): value is JourneyState {
  return value === "active" || value === "paused" || value === "completed" || value === "cancelled";
}

export async function getPortalClientById(id: string) {
  const db = getDb();
  const rows = await db.select().from(portalClients).where(eq(portalClients.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getPortalClientByGhlContactId(ghlContactId: string) {
  const db = getDb();
  const rows = await db.select().from(portalClients).where(eq(portalClients.ghlContactId, ghlContactId)).limit(1);
  return rows[0] ?? null;
}

export async function getWebhookEvent(eventId: string) {
  const db = getDb();
  const rows = await db.select().from(portalWebhookLog).where(eq(portalWebhookLog.eventId, eventId)).limit(1);
  return rows[0] ?? null;
}

export async function recordWebhookEvent(eventId: string, result: string, clientId: string | null, payload: unknown) {
  const db = getDb();
  const receivedAt = new Date().toISOString();
  const serialized = JSON.stringify(payload ?? {});
  await db
    .insert(portalWebhookLog)
    .values({ eventId, result, clientId, payload: serialized, receivedAt })
    .onConflictDoUpdate({
      target: portalWebhookLog.eventId,
      set: { result, clientId, payload: serialized, receivedAt },
    });
}

/**
 * Creates a provisioned portal client and its webhook-log row in one atomic
 * D1 batch, so a crash mid-provision can never leave a client without its
 * idempotency record (or vice versa). A replayed eventId or a duplicate
 * ghl_contact_id makes the whole batch fail on the unique constraint.
 */
export async function provisionPortalClient(input: {
  eventId: string;
  payload: unknown;
  name: string;
  companyName: string;
  startDate: string;
  clientType: ClientType;
  clientTypeConfirmed: boolean;
  ghlContactId: string;
  ghlLocationId: string | null;
  ghlOpportunityId: string | null;
  email: string | null;
  phone: string | null;
  productCode: string;
  sourceOrderId: string | null;
}) {
  const db = getDb();
  const id = crypto.randomUUID();
  const token = generatePortalToken();
  const now = new Date().toISOString();

  await db.batch([
    db.insert(portalClients).values({
      id,
      name: input.name,
      companyName: input.companyName,
      portalToken: token,
      startDate: input.startDate,
      clientType: input.clientType,
      clientTypeConfirmed: input.clientTypeConfirmed,
      ghlContactId: input.ghlContactId,
      ghlLocationId: input.ghlLocationId,
      ghlOpportunityId: input.ghlOpportunityId,
      email: input.email,
      phone: input.phone,
      productCode: input.productCode,
      sourceOrderId: input.sourceOrderId,
      provisionedAt: now,
      // New clients open in the Grove design by default (Jesse 2026-10-12;
      // it was the handoff design from 2026-08-10).
      themeVariant: "grove",
      journeyState: "active",
    }),
    db
      .insert(portalWebhookLog)
      .values({
        eventId: input.eventId,
        result: "ok",
        clientId: id,
        payload: JSON.stringify(input.payload ?? {}),
        receivedAt: now,
      })
      // The eventId may already hold an error row (e.g. unmapped product,
      // since fixed) — a retry must overwrite it, not die on the constraint.
      .onConflictDoUpdate({
        target: portalWebhookLog.eventId,
        set: { result: "ok", clientId: id, payload: JSON.stringify(input.payload ?? {}), receivedAt: now },
      }),
  ]);

  return { id, portalToken: token };
}

export async function updatePortalClientAdminFields(
  clientId: string,
  fields: Partial<{ journeyState: JourneyState; clientTypeConfirmed: boolean; clientType: ClientType; ghlContactId: string; phone: string; email: string }>,
) {
  const db = getDb();
  await db
    .update(portalClients)
    .set({ ...fields, updatedAt: new Date().toISOString() })
    .where(eq(portalClients.id, clientId));
}

export async function setPortalClientTheme(clientId: string, themeVariant: PortalThemeVariant) {
  const db = getDb();
  await db
    .update(portalClients)
    .set({ themeVariant, updatedAt: new Date().toISOString() })
    .where(eq(portalClients.id, clientId));
}

export async function deletePortalClient(id: string) {
  const db = getDb();
  const bucket = getUploadsBucket();
  if (bucket) {
    for (const prefix of [`uploads/${id}/`, `form-uploads/${id}/`]) {
      const listed = await bucket.list({ prefix });
      if (listed.objects.length > 0) {
        await bucket.delete(listed.objects.map((o) => o.key));
      }
    }
  }
  await db.delete(portalMilestoneProgress).where(eq(portalMilestoneProgress.clientId, id));
  await db.delete(portalFormResponses).where(eq(portalFormResponses.clientId, id));
  await db.delete(portalMilestoneContent).where(eq(portalMilestoneContent.clientId, id));
  await db.delete(portalMilestoneUploads).where(eq(portalMilestoneUploads.clientId, id));
  await db.delete(portalFormUploads).where(eq(portalFormUploads.clientId, id));
  await db.delete(portalClients).where(eq(portalClients.id, id));
}

export async function getCompletedMilestoneIds(clientId: string): Promise<Set<string>> {
  const db = getDb();
  const rows = await db
    .select()
    .from(portalMilestoneProgress)
    .where(eq(portalMilestoneProgress.clientId, clientId));

  return new Set(rows.filter((r) => r.completedAt).map((r) => r.milestoneId));
}

export async function markMilestoneComplete(clientId: string, milestoneId: string, note?: string) {
  const db = getDb();
  const existing = await db
    .select()
    .from(portalMilestoneProgress)
    .where(eq(portalMilestoneProgress.clientId, clientId));

  const row = existing.find((r) => r.milestoneId === milestoneId);
  const now = new Date().toISOString();

  if (row) {
    await db
      .update(portalMilestoneProgress)
      .set({ completedAt: now, updatedAt: now, ...(note !== undefined ? { note } : {}) })
      .where(eq(portalMilestoneProgress.id, row.id));
  } else {
    await db.insert(portalMilestoneProgress).values({
      clientId,
      milestoneId,
      completedAt: now,
      note: note ?? null,
      updatedAt: now,
    });
  }
}

/** The team ticks a task off (or back on) from the admin. Un-ticking keeps any
    note the client left. */
export async function setMilestoneDone(clientId: string, milestoneId: string, done: boolean) {
  if (done) return markMilestoneComplete(clientId, milestoneId);
  const db = getDb();
  const rows = await db.select().from(portalMilestoneProgress).where(eq(portalMilestoneProgress.clientId, clientId));
  const row = rows.find((r) => r.milestoneId === milestoneId);
  if (!row) return;
  await db
    .update(portalMilestoneProgress)
    .set({ completedAt: null, updatedAt: new Date().toISOString() })
    .where(eq(portalMilestoneProgress.id, row.id));
}

export async function getMilestoneNotes(clientId: string): Promise<Record<string, string>> {
  const db = getDb();
  const rows = await db
    .select()
    .from(portalMilestoneProgress)
    .where(eq(portalMilestoneProgress.clientId, clientId));

  return Object.fromEntries(rows.filter((r) => r.note).map((r) => [r.milestoneId, r.note as string]));
}

export async function getMilestoneContent(clientId: string, milestoneId: string): Promise<string> {
  const db = getDb();
  const rows = await db
    .select()
    .from(portalMilestoneContent)
    .where(and(eq(portalMilestoneContent.clientId, clientId), eq(portalMilestoneContent.milestoneId, milestoneId)))
    .limit(1);

  return rows[0]?.content ?? "";
}

export async function getAllMilestoneContent(clientId: string): Promise<Record<string, string>> {
  const db = getDb();
  const rows = await db.select().from(portalMilestoneContent).where(eq(portalMilestoneContent.clientId, clientId));
  return Object.fromEntries(rows.map((r) => [r.milestoneId, r.content]));
}

export async function setMilestoneContent(clientId: string, milestoneId: string, content: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(portalMilestoneContent)
    .where(and(eq(portalMilestoneContent.clientId, clientId), eq(portalMilestoneContent.milestoneId, milestoneId)))
    .limit(1);

  const now = new Date().toISOString();
  const existing = rows[0];

  if (existing) {
    await db.update(portalMilestoneContent).set({ content, updatedAt: now }).where(eq(portalMilestoneContent.id, existing.id));
  } else {
    await db.insert(portalMilestoneContent).values({ clientId, milestoneId, content, updatedAt: now });
  }
}

/** Content row incl. the unpublished AI draft — admin/API use only. */
export async function getMilestoneContentFull(clientId: string, milestoneId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(portalMilestoneContent)
    .where(and(eq(portalMilestoneContent.clientId, clientId), eq(portalMilestoneContent.milestoneId, milestoneId)))
    .limit(1);
  const row = rows[0];
  return { content: row?.content ?? "", draft: row?.draft ?? "", draftSource: row?.draftSource ?? "" };
}

/** Stores an AI draft for team review. Never touches `content`, so the client sees nothing. */
export async function setMilestoneDraft(clientId: string, milestoneId: string, draft: string, draftSource: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(portalMilestoneContent)
    .where(and(eq(portalMilestoneContent.clientId, clientId), eq(portalMilestoneContent.milestoneId, milestoneId)))
    .limit(1);
  const now = new Date().toISOString();
  if (rows[0]) {
    await db.update(portalMilestoneContent).set({ draft, draftSource, updatedAt: now }).where(eq(portalMilestoneContent.id, rows[0].id));
  } else {
    await db.insert(portalMilestoneContent).values({ clientId, milestoneId, content: "", draft, draftSource, updatedAt: now });
  }
}

/** Publishes the pending draft into live content (or clears it with publish=false). */
export async function resolveMilestoneDraft(clientId: string, milestoneId: string, publish: boolean) {
  const db = getDb();
  const rows = await db
    .select()
    .from(portalMilestoneContent)
    .where(and(eq(portalMilestoneContent.clientId, clientId), eq(portalMilestoneContent.milestoneId, milestoneId)))
    .limit(1);
  const row = rows[0];
  if (!row || !row.draft) return false;
  const now = new Date().toISOString();
  await db
    .update(portalMilestoneContent)
    .set(publish ? { content: row.draft, draft: "", draftSource: "", updatedAt: now } : { draft: "", draftSource: "", updatedAt: now })
    .where(eq(portalMilestoneContent.id, row.id));
  return true;
}

export async function getFormResponses(clientId: string, formId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(portalFormResponses)
    .where(and(eq(portalFormResponses.clientId, clientId), eq(portalFormResponses.formId, formId)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    responses: JSON.parse(row.responses) as PortalFormResponses,
    completedAt: row.completedAt,
  };
}

export async function saveFormResponses(
  clientId: string,
  formId: string,
  responses: PortalFormResponses,
  completed: boolean,
) {
  const db = getDb();
  const rows = await db
    .select()
    .from(portalFormResponses)
    .where(and(eq(portalFormResponses.clientId, clientId), eq(portalFormResponses.formId, formId)))
    .limit(1);

  const now = new Date().toISOString();
  const serialized = JSON.stringify(responses);
  const existing = rows[0];

  if (existing) {
    await db
      .update(portalFormResponses)
      .set({ responses: serialized, completedAt: completed ? now : existing.completedAt, updatedAt: now })
      .where(eq(portalFormResponses.id, existing.id));
  } else {
    await db.insert(portalFormResponses).values({
      clientId,
      formId,
      responses: serialized,
      completedAt: completed ? now : null,
      updatedAt: now,
    });
  }
}

// ---- Task file uploads (CSV) ----
// A task can hold several files (Jesse, 2026-10-16: a client's lead list may
// come in more than one CSV). One row per file. Bodies live in R2 under
// uploads/{clientId}/{milestoneId}/{rowId}. Without R2 the body stays inline
// in D1 (empty content marks an R2-backed row). The one upload stored under the
// older single-file key (uploads/{clientId}/{milestoneId}) was moved to its
// per-file key when this shipped, so there is no fallback to that key.

export type MilestoneUploadMeta = { id: number; fileName: string; uploadedAt: string };

export async function addMilestoneUpload(
  clientId: string,
  milestoneId: string,
  fileName: string,
  content: string | ArrayBuffer,
  contentType?: string,
): Promise<MilestoneUploadMeta> {
  const db = getDb();
  const bucket = getUploadsBucket();
  const now = new Date().toISOString();
  // A binary file (a photo, a PDF) only ever lives in R2: the row holds no content.
  if (typeof content !== "string" && !bucket) throw new Error("File uploads are not available right now.");
  const inserted = await db
    .insert(portalMilestoneUploads)
    .values({ clientId, milestoneId, fileName, content: bucket || typeof content !== "string" ? "" : content, uploadedAt: now })
    .returning({ id: portalMilestoneUploads.id });
  const id = inserted[0].id;
  if (bucket) {
    try {
      await bucket.put(uploadFileObjectKey(clientId, milestoneId, id), content, contentType ? { httpMetadata: { contentType } } : undefined);
    } catch (error) {
      await db.delete(portalMilestoneUploads).where(eq(portalMilestoneUploads.id, id));
      throw error;
    }
  }
  return { id, fileName, uploadedAt: now };
}

/** Removes one file from a task. Returns false when it isn't this task's file. */
export async function deleteMilestoneUpload(clientId: string, milestoneId: string, uploadId: number): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select()
    .from(portalMilestoneUploads)
    .where(and(eq(portalMilestoneUploads.clientId, clientId), eq(portalMilestoneUploads.milestoneId, milestoneId), eq(portalMilestoneUploads.id, uploadId)))
    .limit(1);
  const row = rows[0];
  if (!row) return false;
  const bucket = getUploadsBucket();
  if (bucket && !row.content) {
    await bucket.delete(uploadFileObjectKey(clientId, milestoneId, row.id));
  }
  await db.delete(portalMilestoneUploads).where(eq(portalMilestoneUploads.id, row.id));
  return true;
}

/** One file's content. With no uploadId, the most recent file for the task. */
export async function getMilestoneUpload(clientId: string, milestoneId: string, uploadId?: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(portalMilestoneUploads)
    .where(and(eq(portalMilestoneUploads.clientId, clientId), eq(portalMilestoneUploads.milestoneId, milestoneId)));
  const row = uploadId !== undefined ? rows.find((r) => r.id === uploadId) : rows.sort((x, y) => y.id - x.id)[0];
  if (!row) return null;

  // Inline rows carry the file; R2-backed rows have empty content.
  if (row.content) return { ...row, bytes: undefined as ArrayBuffer | undefined };

  const bucket = getUploadsBucket();
  if (!bucket) {
    console.error(`Upload row ${row.id} is R2-backed but no UPLOADS binding is available.`);
    return null;
  }
  const object = await bucket.get(uploadFileObjectKey(clientId, milestoneId, row.id));
  if (!object) {
    console.error(`Upload row ${row.id} is R2-backed but the object is missing.`);
    return null;
  }
  // Read once as bytes (a photo must not be decoded as text); `content` is the same bytes as text, as before.
  const bytes = await object.arrayBuffer();
  return { ...row, content: new TextDecoder().decode(bytes), bytes };
}

/** Every task's files, oldest first, keyed by task id. */
export async function getAllMilestoneUploadsMeta(clientId: string): Promise<Record<string, MilestoneUploadMeta[]>> {
  const db = getDb();
  const rows = await db.select().from(portalMilestoneUploads).where(eq(portalMilestoneUploads.clientId, clientId));
  const out: Record<string, MilestoneUploadMeta[]> = {};
  for (const r of rows.sort((x, y) => x.id - y.id)) (out[r.milestoneId] ??= []).push({ id: r.id, fileName: r.fileName, uploadedAt: r.uploadedAt });
  return out;
}

// ---- Guided-form file uploads (R2-only bodies, metadata in D1) ----

export async function saveFormUpload(
  clientId: string,
  fieldId: string,
  fileName: string,
  contentType: string,
  body: ArrayBuffer,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const bucket = getUploadsBucket();
  if (!bucket) {
    // Binary files never go inline in D1 — without R2 the client uses the
    // paste-a-link fallback instead. Live prod has had the binding since 2026-08-09.
    return { ok: false, error: "File uploads are not available right now — paste a link instead." };
  }

  const db = getDb();
  await bucket.put(formUploadObjectKey(clientId, fieldId), body, { httpMetadata: { contentType } });

  const now = new Date().toISOString();
  const rows = await db
    .select()
    .from(portalFormUploads)
    .where(and(eq(portalFormUploads.clientId, clientId), eq(portalFormUploads.fieldId, fieldId)))
    .limit(1);

  if (rows[0]) {
    await db
      .update(portalFormUploads)
      .set({ fileName, contentType, size: body.byteLength, uploadedAt: now })
      .where(eq(portalFormUploads.id, rows[0].id));
  } else {
    await db.insert(portalFormUploads).values({ clientId, fieldId, fileName, contentType, size: body.byteLength, uploadedAt: now });
  }
  return { ok: true };
}

export async function getFormUpload(clientId: string, fieldId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(portalFormUploads)
    .where(and(eq(portalFormUploads.clientId, clientId), eq(portalFormUploads.fieldId, fieldId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const bucket = getUploadsBucket();
  if (!bucket) {
    console.error(`Form upload row ${row.id} exists but no UPLOADS binding is available.`);
    return null;
  }
  const object = await bucket.get(formUploadObjectKey(clientId, fieldId));
  if (!object) {
    console.error(`Form upload row ${row.id} exists but the R2 object is missing.`);
    return null;
  }
  return { meta: row, body: await object.arrayBuffer() };
}

/**
 * The most recent sign of life from a client: a milestone ticked or noted, a
 * form answer saved, or a file uploaded. Used to spot a stalled journey.
 */
export async function getLastActivityAt(clientId: string): Promise<string | null> {
  const db = getDb();
  const [progress, forms, uploads, taskFiles] = await Promise.all([
    db.select().from(portalMilestoneProgress).where(eq(portalMilestoneProgress.clientId, clientId)),
    db.select().from(portalFormResponses).where(eq(portalFormResponses.clientId, clientId)),
    db.select().from(portalFormUploads).where(eq(portalFormUploads.clientId, clientId)),
    // A CSV added to an upload task counts before the task is finished.
    db.select({ uploadedAt: portalMilestoneUploads.uploadedAt }).from(portalMilestoneUploads).where(eq(portalMilestoneUploads.clientId, clientId)),
  ]);
  const stamps = [
    ...progress.map((r) => r.updatedAt),
    ...forms.map((r) => r.updatedAt),
    ...uploads.map((r) => r.uploadedAt),
    ...taskFiles.map((r) => r.uploadedAt),
  ].filter(Boolean) as string[];
  if (stamps.length === 0) return null;
  return stamps.sort().at(-1) ?? null;
}

export async function getAllFormUploadsMeta(clientId: string): Promise<Record<string, { fileName: string; contentType: string; size: number; uploadedAt: string }>> {
  const db = getDb();
  const rows = await db.select().from(portalFormUploads).where(eq(portalFormUploads.clientId, clientId));
  return Object.fromEntries(rows.map((r) => [r.fieldId, { fileName: r.fileName, contentType: r.contentType, size: r.size, uploadedAt: r.uploadedAt }]));
}

/** Day 1 = the client's start date. Clamped to the journey length (totalDaysFor in lib/productRegistry.ts). */
export function computeCurrentDay(startDate: string, totalDays: number): number {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return 1;

  const diffDays = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(totalDays, Math.max(1, diffDays + 1));
}
