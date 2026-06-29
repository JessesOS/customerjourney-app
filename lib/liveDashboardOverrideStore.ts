import { getDb } from "@/db";
import { liveDashboardOverrideState } from "@/db/schema";
import type { PersistedTaskOverride } from "@/lib/liveDashboardOverrides";

function safeParseOverrides(value: string): PersistedTaskOverride[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry): entry is PersistedTaskOverride => {
      return (
        typeof entry === "object" &&
        entry !== null &&
        "taskId" in entry &&
        typeof entry.taskId === "string"
      );
    });
  } catch {
    return [];
  }
}

export async function readLiveDashboardOverrides() {
  const db = getDb();
  const rows = await db.select().from(liveDashboardOverrideState).limit(1);
  const row = rows[0];

  if (!row) return [] as PersistedTaskOverride[];
  return safeParseOverrides(row.payload);
}

export async function writeLiveDashboardOverrides(overrides: PersistedTaskOverride[]) {
  const db = getDb();

  await db.delete(liveDashboardOverrideState);
  await db.insert(liveDashboardOverrideState).values({
    id: 1,
    payload: JSON.stringify(overrides),
  });
}
