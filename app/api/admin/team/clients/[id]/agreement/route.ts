import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portalClients } from "@/db/schema";
import { agreementFor, listAcceptances, recordAcceptanceManually } from "@/lib/agreementStore";
import { signPath } from "@/lib/signLink";
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
    entity: a.entity,
    signUrl: await (async () => { const path = await signPath(client.id); return path ? `${new URL(request.url).origin}${path}` : null; })(),
    acceptances: rows.map((r) => ({
      id: r.id, version: r.agreementVersion, entity: r.entity, signerName: r.signerName, signerEmail: r.signerEmail, ip: r.ip, acceptedAt: r.acceptedAt,
      recordUrl: `/api/portal/${client.portalToken}/agreement/${r.id}`,
    })),
  });
}

/** POST { entity, signerName, signerEmail, acceptedAt, source }: record an acceptance made outside the portal. Ticks the step. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireTeam(request);
  if (actor instanceof Response) return actor;
  const client = (await getDb().select().from(portalClients).where(eq(portalClients.id, (await params).id)).limit(1))[0];
  if (!client) return Response.json({ ok: false, error: "Unknown client." }, { status: 404 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const result = await recordAcceptanceManually(client, { entity: str(b.entity), signerName: str(b.signerName), signerEmail: str(b.signerEmail), acceptedAt: str(b.acceptedAt), source: str(b.source) });
  if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: result.status });
  return Response.json({ ok: true, id: result.id });
}
