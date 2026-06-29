import {
  buildLiveBridgePayload,
  buildAdminTasks,
  type BridgeTask,
} from "@/lib/liveScaleBridge";
import {
  readLiveDashboardSnapshot,
  writeLiveDashboardSnapshot,
} from "@/lib/liveDashboardStore";
import {
  readLiveDashboardOverrides,
  writeLiveDashboardOverrides,
} from "@/lib/liveDashboardOverrideStore";
import { isAdminEmail, isLocalDevelopmentHost } from "@/lib/adminAuth";
import type { PersistedTaskOverride } from "@/lib/liveDashboardOverrides";

function requestCanAdmin(request: Request) {
  const email = request.headers.get("oai-authenticated-user-email");
  if (isAdminEmail(email)) return true;

  const host = request.headers.get("host");
  if (isLocalDevelopmentHost(host)) return true;

  return false;
}

function sanitizeOverrides(input: unknown) {
  if (!Array.isArray(input)) return [] as PersistedTaskOverride[];

  return input
    .filter((entry): entry is PersistedTaskOverride => {
      return (
        typeof entry === "object" &&
        entry !== null &&
        "taskId" in entry &&
        typeof entry.taskId === "string"
      );
    })
    .map((entry) => ({
      taskId: entry.taskId,
      visible:
        typeof entry.visible === "boolean" ? entry.visible : undefined,
      owner:
        entry.owner === "chris" || entry.owner === "jesse"
          ? entry.owner
          : undefined,
      title:
        typeof entry.title === "string" && entry.title.trim()
          ? entry.title.trim()
          : undefined,
      detail:
        typeof entry.detail === "string" && entry.detail.trim()
          ? entry.detail.trim()
          : undefined,
      pinnedRank:
        typeof entry.pinnedRank === "number" && Number.isFinite(entry.pinnedRank)
          ? entry.pinnedRank
          : undefined,
      blocker:
        typeof entry.blocker === "boolean" ? entry.blocker : undefined,
    }));
}

export async function GET(request: Request) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const snapshot = await readLiveDashboardSnapshot();
    const overrides = await readLiveDashboardOverrides();

    if (!snapshot) {
      return Response.json(
        { ok: false, error: "No synced dashboard snapshot available yet." },
        { status: 404 },
      );
    }

    return Response.json({
      ok: true,
      syncedAt: snapshot.syncedAt,
      sourceClientId: snapshot.sourceClientId,
      overrides,
      tasks: buildAdminTasks(snapshot.sourceTasks, overrides),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not load live dashboard admin data.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const payload = (await request.json()) as {
      overrides?: PersistedTaskOverride[];
    };

    const snapshot = await readLiveDashboardSnapshot();
    if (!snapshot) {
      return Response.json(
        { ok: false, error: "No synced dashboard snapshot available yet." },
        { status: 404 },
      );
    }

    const overrides = sanitizeOverrides(payload.overrides ?? []);
    await writeLiveDashboardOverrides(overrides);

    const syncedAt = new Date().toISOString();
    const nextBridge = buildLiveBridgePayload(
      snapshot.sourceClient,
      snapshot.sourceTasks,
      snapshot.bridge.portalUrl
        ? snapshot.bridge.portalUrl.replace(/\/portal\/.+$/, "")
        : process.env.LIVE_SCALE_DASHBOARD_URL ?? "",
      overrides,
    );

    await writeLiveDashboardSnapshot({
      ...snapshot,
      syncedAt,
      lastSyncMessage: `Admin overrides updated at ${syncedAt}.`,
      bridge: {
        ...nextBridge,
        syncedAt,
      },
    });

    return Response.json({
      ok: true,
      overrideCount: overrides.length,
      tasks: buildAdminTasks(snapshot.sourceTasks as BridgeTask[], overrides),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not save live dashboard admin overrides.",
      },
      { status: 500 },
    );
  }
}
