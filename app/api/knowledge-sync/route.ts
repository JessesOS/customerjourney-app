import { getKnowledgeStatus, syncKnowledgeLibrary } from "@/lib/knowledgeStore";

export async function POST() {
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

export async function GET() {
  return Response.json(await getKnowledgeStatus());
}
