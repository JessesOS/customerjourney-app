import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portalClients, portalMilestoneProgress } from "@/db/schema";
import { journeyTemplate, journeyTotalDays } from "@/lib/onboardingJourney";

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

export async function markMilestoneComplete(clientId: string, milestoneId: string) {
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
      .set({ completedAt: now, updatedAt: now })
      .where(eq(portalMilestoneProgress.id, row.id));
  } else {
    await db.insert(portalMilestoneProgress).values({
      clientId,
      milestoneId,
      completedAt: now,
      updatedAt: now,
    });
  }
}

/** Day 1 = the client's start date. Clamped to the 30-day journey length. */
export function computeCurrentDay(startDate: string, totalDays: number = journeyTotalDays): number {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return 1;

  const diffDays = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(totalDays, Math.max(1, diffDays + 1));
}
