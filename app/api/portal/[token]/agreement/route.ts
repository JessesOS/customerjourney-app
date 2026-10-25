import { acceptAgreement, agreementFor, agreementText, listAcceptances, sha256 } from "@/lib/agreementStore";
import { getPortalClientByToken } from "@/lib/portalClientStore";
import { alertAgreementAccepted } from "@/lib/alerts";

// The agreement on step 1 (AT Network first): what the client reads, their past
// acceptances, and the acceptance itself. 404 unless the product has one.

async function clientFor(params: Promise<{ token: string }>) {
  const { token } = await params;
  const client = await getPortalClientByToken(token);
  if (!client || !agreementFor(client.clientType)) return null;
  return client;
}

/** GET: the current version and its hash (sent back on accept), and every acceptance so far. */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const client = await clientFor(params);
  if (!client) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  const a = agreementFor(client.clientType)!;
  const rows = await listAcceptances(client.id);
  return Response.json({
    ok: true,
    version: a.version,
    hash: await sha256(agreementText(a)),
    acceptances: rows.map((r) => ({ id: r.id, version: r.agreementVersion, entity: r.entity, signerName: r.signerName, acceptedAt: r.acceptedAt })),
  });
}

/** POST { version, hash, entity, signerName, signerEmail, agreed }: accept the current version. */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const client = await clientFor(params);
  if (!client) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const result = await acceptAgreement(client, {
    version: str(b.version),
    hash: str(b.hash),
    entity: str(b.entity),
    signerName: str(b.signerName),
    signerEmail: str(b.signerEmail),
    agreed: b.agreed === true,
    ip: request.headers.get("cf-connecting-ip") ?? "",
    userAgent: request.headers.get("user-agent") ?? "",
  });
  if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: result.status });
  // The signer's copy and the team alert. Never fails the acceptance.
  const emails = await alertAgreementAccepted(new URL(request.url).origin, client, { id: result.id, version: result.row.agreementVersion, entity: result.row.entity, signerName: result.row.signerName, signerEmail: result.row.signerEmail, acceptedAt: result.row.acceptedAt });
  const { row: _row, ...out } = result;
  return Response.json({ ...out, emails });
}
