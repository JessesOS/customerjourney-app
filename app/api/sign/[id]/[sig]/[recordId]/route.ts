import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portalClients } from "@/db/schema";
import { getAcceptance, recordHtml } from "@/lib/agreementStore";
import { verifySignLink } from "@/lib/signLink";

/** GET: the printable copy of an acceptance, through the signing link (no portal link needed). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; sig: string; recordId: string }> }) {
  const { id, sig, recordId } = await params;
  if (!(await verifySignLink(id, sig))) return new Response("Not found", { status: 404 });
  const client = (await getDb().select().from(portalClients).where(eq(portalClients.id, id)).limit(1))[0];
  const row = client ? await getAcceptance(client.id, Number(recordId)) : null;
  if (!client || !row) return new Response("Not found", { status: 404 });
  return new Response(recordHtml(row, client.name), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}
