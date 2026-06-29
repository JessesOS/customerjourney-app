import { getDb } from "@/db";
import { liveDashboardSnapshot } from "@/db/schema";
import type { LiveBridgePayload } from "@/lib/liveScaleBridge";

export type PersistedDashboardSnapshot = {
  syncedAt: string;
  provider: string;
  sourceClientId: string;
  lastSyncMessage: string;
  bridge: LiveBridgePayload;
};

function safeParsePayload(value: string): LiveBridgePayload | null {
  try {
    return JSON.parse(value) as LiveBridgePayload;
  } catch {
    return null;
  }
}

export async function readLiveDashboardSnapshot() {
  const db = getDb();
  const rows = await db.select().from(liveDashboardSnapshot).limit(1);
  const row = rows[0];

  if (!row) return null;

  const bridge = safeParsePayload(row.payload);
  if (!bridge) return null;

  return {
    syncedAt: row.syncedAt,
    provider: row.provider,
    sourceClientId: row.sourceClientId,
    lastSyncMessage: row.lastSyncMessage,
    bridge,
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
    payload: JSON.stringify(snapshot.bridge),
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
