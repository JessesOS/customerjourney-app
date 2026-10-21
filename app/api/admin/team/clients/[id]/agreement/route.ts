import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portalClients } from "@/db/schema";
import { agreementFor, listAcceptances } from "@/lib/agreementStore";
import { requireTeam } from "@/lib/teamAuth";

/** GET: the client's agreement acceptances, with links to their printable records. Empty without an agreement. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  const client = (await getDb().select().from(portalClients).where(eq(portalClients.id, (await params).id)).limit(1))[0];
  if (!client) return Response.json({ ok: false, error: "Unknown client." }, { status: 404 });
  const a = agreementFor(client.clientType);
  if (!a) return Response.json({ ok: true, enabled: false, acceptances: [] });
  const rows = await listAcceptances(client.id);
  return Response.json({
    ok: true,
    enabled: true,
    currentVersion: a.version,
    acceptances: rows.map((r) => ({
      id: r.id, version: r.agreementVersion, entity: r.entity, signerName: r.signerName, signerEmail: r.signerEmail, ip: r.ip, acceptedAt: r.acceptedAt,
      recordUrl: `/api/portal/${client.portalToken}/agreement/${r.id}`,
    })),
  });
}
