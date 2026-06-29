import { env } from "cloudflare:workers";
import {
  buildLiveBridgePayload,
  type BridgeClient,
  type BridgeTask,
} from "@/lib/liveScaleBridge";
import {
  getLiveDashboardStatus,
  writeLiveDashboardSnapshot,
} from "@/lib/liveDashboardStore";
import { readLiveDashboardOverrides } from "@/lib/liveDashboardOverrideStore";

type SyncRequestBody = {
  client?: BridgeClient;
  tasks?: BridgeTask[];
  dashboardUrl?: string;
  sourceClientId?: string;
  lastSyncMessage?: string;
};

function runtimeValue(key: string) {
  const runtime = env as Record<string, string | undefined>;
  return runtime[key] ?? process.env[key];
}

function isAuthorized(request: Request) {
  const expected = runtimeValue("LIVE_SCALE_SYNC_TOKEN");
  if (!expected) return false;

  const headerValue =
    request.headers.get("x-live-scale-sync-token") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  return Boolean(headerValue && headerValue === expected);
}

export async function GET() {
  try {
    return Response.json(await getLiveDashboardStatus());
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not read live dashboard sync status.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized sync request.",
      },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as SyncRequestBody;
    const client = body.client;
    const tasks = body.tasks;

    if (!client || !tasks) {
      return Response.json(
        {
          ok: false,
          error: "Missing client or tasks payload.",
        },
        { status: 400 },
      );
    }

    const persistedOverrides = await readLiveDashboardOverrides();
    const bridge = buildLiveBridgePayload(
      client,
      tasks,
      body.dashboardUrl ?? runtimeValue("LIVE_SCALE_DASHBOARD_URL") ?? "",
      persistedOverrides,
    );

    const syncedAt = new Date().toISOString();
    await writeLiveDashboardSnapshot({
      syncedAt,
      provider: "manual-curated-sync",
      sourceClientId: body.sourceClientId ?? client.id,
      lastSyncMessage:
        body.lastSyncMessage ??
        `Curated sync imported from live Scale source for ${client.name}.`,
      sourceClient: client,
      bridge: {
        ...bridge,
        syncedAt,
      },
      sourceTasks: tasks,
    });

    return Response.json({
      ok: true,
      syncedAt,
      sourceClientId: client.id,
      workingPlanCount: bridge.workingPlanItems.length,
      blockerCount: bridge.outstandingColumns[0]?.count ?? 0,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Curated live dashboard sync failed.",
      },
      { status: 500 },
    );
  }
}
