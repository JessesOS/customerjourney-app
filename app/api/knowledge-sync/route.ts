import { requestCanAdmin } from "@/lib/adminAuth";
import { getKnowledgeStatus, summarizeKnowledgeStatus, syncKnowledgeLibrary } from "@/lib/knowledgeStore";

export async function POST(request: Request) {
  // Re-syncing walks the whole Drive folder with service-account credentials
  // and rewrites the D1 snapshot — team only.
  if (!requestCanAdmin(request)) {
    return Response.json(
      { ok: false, error: "Refreshing the library is limited to the RT Digital team." },
      { status: 403 },
    );
  }

  try {
    const snapshot = await syncKnowledgeLibrary();
    return Response.json({
      ok: true,
      syncedAt: snapshot.syncedAt,
      provider: snapshot.provider,
      lastSyncMessage: snapshot.lastSyncMessage,
      sourceCount: snapshot.sources.length,
      chunkCount: snapshot.chunks.length,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Knowledge sync failed.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const status = await getKnowledgeStatus();
  return Response.json(requestCanAdmin(request) ? status : summarizeKnowledgeStatus(status));
}
