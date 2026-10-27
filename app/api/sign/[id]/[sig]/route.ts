import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portalClients } from "@/db/schema";
import { acceptAgreement, agreementFor, agreementText, listAcceptances, sha256 } from "@/lib/agreementStore";
import { alertAgreementAccepted } from "@/lib/alerts";
import { verifySignLink } from "@/lib/signLink";

// The public signing page's API (2026-10-27): the same acceptance as the portal's
// step 1, reached by a signing link (/sign/<client id>/<sig>) before the client
// has their portal. Records the signature, ticks step 1, and emails the signer's
// copy (and copyTo) and the team. 404 for a wrong link or a product without an agreement.

async function clientFor(params: Promise<{ id: string; sig: string }>) {
  const { id, sig } = await params;
  if (!(await verifySignLink(id, sig))) return null;
  const client = (await getDb().select().from(portalClients).where(eq(portalClients.id, id)).limit(1))[0];
  if (!client || !agreementFor(client.clientType)) return null;
  return { client, sig };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; sig: string }> }) {
  const found = await clientFor(params);
  if (!found) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  const a = agreementFor(found.client.clientType)!;
  const rows = await listAcceptances(found.client.id);
  return Response.json({
    ok: true,
    version: a.version,
    hash: await sha256(agreementText(a)),
    acceptances: rows.map((r) => ({ id: r.id, version: r.agreementVersion, entity: r.entity, signerName: r.signerName, acceptedAt: r.acceptedAt })),
  });
}

/** POST { version, hash, signerName, position, signerEmail, agreed }: sign the current version. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string; sig: string }> }) {
  const found = await clientFor(params);
  if (!found) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  const { client, sig } = found;
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const result = await acceptAgreement(client, {
    version: str(b.version),
    hash: str(b.hash),
    entity: str(b.entity),
    signerName: str(b.signerName),
    signerEmail: str(b.signerEmail),
    position: str(b.position),
    agreed: b.agreed === true,
    ip: request.headers.get("cf-connecting-ip") ?? "",
    userAgent: request.headers.get("user-agent") ?? "",
  });
  if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: result.status });
  const origin = new URL(request.url).origin;
  const emails = await alertAgreementAccepted(
    origin,
    client,
    { id: result.id, version: result.row.agreementVersion, entity: result.row.entity, signerName: result.row.signerName, signerEmail: result.row.signerEmail, acceptedAt: result.row.acceptedAt, position: str(b.position).trim() },
    { recordUrl: `${origin}/api/sign/${client.id}/${sig}/${result.id}`, portalLink: false, via: "on the signing page" },
  );
  return Response.json({ ok: true, id: result.id, acceptedAt: result.acceptedAt, emails });
}
