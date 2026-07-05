import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  portalClients,
  portalFormResponses,
  portalMilestoneContent,
  portalMilestoneProgress,
  portalMilestoneUploads,
} from "@/db/schema";
import { journeyTemplate, journeyTotalDays } from "@/lib/onboardingJourney";
import type { PortalFormResponses } from "@/lib/onboardingForm";

const totalMilestoneCount = journeyTemplate.reduce((sum, stage) => sum + stage.milestones.length, 0);

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
      return {
        ...client,
        currentDay: computeCurrentDay(client.startDate),
        completedMilestoneCount: completedCount,
        totalMilestoneCount,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createPortalClient(input: { name: string; companyName: string; startDate: string }) {
  const db = getDb();
  const id = crypto.randomUUID();
  const token = generatePortalToken();

  await db.insert(portalClients).values({
    id,
    name: input.name,
    companyName: input.companyName,
    portalToken: token,
    startDate: input.startDate,
  });

  return { id, portalToken: token };
}

export async function deletePortalClient(id: string) {
  const db = getDb();
  await db.delete(portalMilestoneProgress).where(eq(portalMilestoneProgress.clientId, id));
  await db.delete(portalFormResponses).where(eq(portalFormResponses.clientId, id));
  await db.delete(portalMilestoneContent).where(eq(portalMilestoneContent.clientId, id));
  await db.delete(portalMilestoneUploads).where(eq(portalMilestoneUploads.clientId, id));
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

export async function saveMilestoneUpload(clientId: string, milestoneId: string, fileName: string, content: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(portalMilestoneUploads)
    .where(and(eq(portalMilestoneUploads.clientId, clientId), eq(portalMilestoneUploads.milestoneId, milestoneId)))
    .limit(1);

  const now = new Date().toISOString();
  const existing = rows[0];

  if (existing) {
    await db
      .update(portalMilestoneUploads)
      .set({ fileName, content, uploadedAt: now })
      .where(eq(portalMilestoneUploads.id, existing.id));
  } else {
    await db.insert(portalMilestoneUploads).values({ clientId, milestoneId, fileName, content, uploadedAt: now });
  }
}

export async function getMilestoneUpload(clientId: string, milestoneId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(portalMilestoneUploads)
    .where(and(eq(portalMilestoneUploads.clientId, clientId), eq(portalMilestoneUploads.milestoneId, milestoneId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function getAllMilestoneUploadsMeta(clientId: string): Promise<Record<string, { fileName: string; uploadedAt: string }>> {
  const db = getDb();
  const rows = await db.select().from(portalMilestoneUploads).where(eq(portalMilestoneUploads.clientId, clientId));
  return Object.fromEntries(rows.map((r) => [r.milestoneId, { fileName: r.fileName, uploadedAt: r.uploadedAt }]));
}

/** Day 1 = the client's start date. Clamped to the 30-day journey length. */
export function computeCurrentDay(startDate: string, totalDays: number = journeyTotalDays): number {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return 1;

  const diffDays = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(totalDays, Math.max(1, diffDays + 1));
}
