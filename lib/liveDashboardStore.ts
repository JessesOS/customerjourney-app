import { getDb } from "@/db";
import { liveDashboardSnapshot } from "@/db/schema";
import type { BridgeClient, BridgeTask, LiveBridgePayload } from "@/lib/liveScaleBridge";

export type PersistedDashboardSnapshot = {
  syncedAt: string;
  provider: string;
  sourceClientId: string;
  lastSyncMessage: string;
  sourceClient: BridgeClient;
  bridge: LiveBridgePayload;
  sourceTasks: BridgeTask[];
};

function safeParsePayload(value: string): PersistedDashboardSnapshot | null {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "bridge" in parsed &&
      "sourceClient" in parsed &&
      "sourceTasks" in parsed &&
      Array.isArray(parsed.sourceTasks)
    ) {
      return parsed as PersistedDashboardSnapshot;
    }

    return null;
  } catch {
    return null;
  }
}

export async function readLiveDashboardSnapshot() {
  const db = getDb();
  const rows = await db.select().from(liveDashboardSnapshot).limit(1);
  const row = rows[0];

  if (!row) return null;

  const payload = safeParsePayload(row.payload);
  if (!payload) return null;

  return {
    syncedAt: row.syncedAt,
    provider: row.provider,
    sourceClientId: row.sourceClientId,
    lastSyncMessage: row.lastSyncMessage,
    sourceClient: payload.sourceClient,
    bridge: payload.bridge,
    sourceTasks: payload.sourceTasks,
  } satisfies PersistedDashboardSnapshot;
}

export async function writeLiveDashboardSnapshot(snapshot: PersistedDashboardSnapshot) {
  const db = getDb();

  await db.delete(liveDashboardSnapshot);
  await db.insert(liveDashboardSnapshot).values({
    id: 1,
    syncedAt: snapshot.syncedAt,
    provider: snapshot.provider,
    sourceClientId: snapshot.sourceClientId,
    lastSyncMessage: snapshot.lastSyncMessage,
    payload: JSON.stringify({
      sourceClient: snapshot.sourceClient,
      bridge: snapshot.bridge,
      sourceTasks: snapshot.sourceTasks,
    }),
  });
}

export async function getLiveDashboardStatus() {
  const snapshot = await readLiveDashboardSnapshot();

  return {
    ok: Boolean(snapshot),
    syncedAt: snapshot?.syncedAt ?? null,
    provider: snapshot?.provider ?? null,
    sourceClientId: snapshot?.sourceClientId ?? null,
    lastSyncMessage: snapshot?.lastSyncMessage ?? null,
  };
}
