import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portalClients, portalMilestoneProgress } from "@/db/schema";
import { journeyTotalDays } from "@/lib/onboardingJourney";

export async function getPortalClientByToken(token: string) {
  const db = getDb();
  const rows = await db.select().from(portalClients).where(eq(portalClients.portalToken, token)).limit(1);
  return rows[0] ?? null;
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
