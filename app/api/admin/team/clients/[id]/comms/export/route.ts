import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portalClients } from "@/db/schema";
import { commsEnabled, commsRecord, recordCsv, recordPageHtml } from "@/lib/commsStore";
import { requireTeam } from "@/lib/teamAuth";

/** GET ?format=csv|html: the client's approvals and change requests, with status history. Team only. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  const client = (await getDb().select().from(portalClients).where(eq(portalClients.id, (await params).id)).limit(1))[0];
  if (!client || !commsEnabled(client.clientType)) return new Response("Not found", { status: 404 });
  const rows = await commsRecord(client.id, client.clientType);
  const format = new URL(request.url).searchParams.get("format") === "csv" ? "csv" : "html";
  const safe = client.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  if (format === "csv") {
    return new Response(recordCsv(rows), {
      headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${safe}-approvals-and-change-requests.csv"`, "cache-control": "no-store" },
    });
  }
  return new Response(recordPageHtml(rows, client.name), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });
}
