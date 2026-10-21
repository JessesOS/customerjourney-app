import { getAcceptance, recordHtml } from "@/lib/agreementStore";
import { getPortalClientByToken } from "@/lib/portalClientStore";

/** GET: the printable copy of one acceptance (its exact text and details), for the client and the team. */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await params;
  const client = await getPortalClientByToken(token);
  const row = client ? await getAcceptance(client.id, Number(id)) : null;
  if (!client || !row) return new Response("Not found", { status: 404 });
  return new Response(recordHtml(row, client.name), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}
