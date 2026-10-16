import { requestCanAdmin } from "@/lib/adminAuth";
import { readLiveDashboardSnapshot } from "@/lib/liveDashboardStore";

// Codex-era dashboard data. Admin only since 2026-10-16 (it was open to anyone).
export async function GET(request: Request) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    const snapshot = await readLiveDashboardSnapshot();

    if (!snapshot) {
      return Response.json(
        {
          ok: false,
          error: "No curated live dashboard snapshot has been synced yet.",
        },
        { status: 404 },
      );
    }

    return Response.json({
      ok: true,
      syncedAt: snapshot.syncedAt,
      provider: snapshot.provider,
      bridge: snapshot.bridge,
      lastSyncMessage: snapshot.lastSyncMessage,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not read the curated live dashboard snapshot.",
      },
      { status: 500 },
    );
  }
}
