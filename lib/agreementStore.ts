import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portalAcceptances } from "@/db/schema";
import type { AgreementContent } from "@/lib/journeyTypes";
import { markMilestoneComplete } from "@/lib/portalClientStore";
import { portalJourneyFor } from "@/lib/productRegistry";

// Agreement acceptance (AT Network first, Jesse 2026-10-21): the portal is the
// signature. Each acceptance is an append-only row with the exact text accepted
// and its SHA-256, the agreement version, entity, typed name, email, time and
// IP address. The printable record (recordHtml) is the copy the client keeps
// until the emailed PDF exists.

export const MAX_FIELD = 200;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function agreementFor(clientType: string): AgreementContent | null {
  return portalJourneyFor(clientType).agreement ?? null;
}

/** The agreement as plain text: exactly what is stored and hashed. */
export function agreementText(a: AgreementContent): string {
  const lines = [`${a.title}`, `Version: ${a.version}`, ""];
  for (const s of a.sections) {
    lines.push(s.heading, ...s.paragraphs, "");
  }
  return lines.join("\n").trim();
}

export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function listAcceptances(clientId: string) {
  return getDb().select().from(portalAcceptances).where(eq(portalAcceptances.clientId, clientId)).orderBy(asc(portalAcceptances.id));
}

/** The latest signer's email: the only client email the portal holds. */
export async function latestSignerEmail(clientId: string): Promise<string | null> {
  const rows = await listAcceptances(clientId);
  return rows.at(-1)?.signerEmail ?? null;
}

export async function getAcceptance(clientId: string, id: number) {
  const row = (await getDb().select().from(portalAcceptances).where(eq(portalAcceptances.id, id)).limit(1))[0];
  return row && row.clientId === clientId ? row : null;
}

export type AcceptInput = { version: string; hash: string; entity: string; signerName: string; signerEmail: string; agreed: boolean; ip: string; userAgent: string; position?: string };

/** Records an acceptance of the current version and ticks the step. Refuses a stale version or text. */
export async function acceptAgreement(client: { id: string; clientType: string }, input: AcceptInput) {
  const a = agreementFor(client.clientType);
  if (!a) return { ok: false as const, status: 404, error: "Not found" };
  const text = agreementText(a);
  const hash = await sha256(text);
  if (input.version !== a.version || input.hash !== hash) {
    return { ok: false as const, status: 409, error: "The agreement has changed since you opened it. Reload the page and read it again." };
  }
  const entity = (a.entity ?? input.entity).trim();
  const name = input.signerName.trim();
  const email = input.signerEmail.trim();
  if (!input.agreed) return { ok: false as const, status: 400, error: "Tick the box to accept." };
  if (!entity) return { ok: false as const, status: 400, error: "Add the company or entity you accept for." };
  if (name.split(/\s+/).length < 2) return { ok: false as const, status: 400, error: "Type your full name, first and last." };
  if (!EMAIL.test(email)) return { ok: false as const, status: 400, error: "Add a valid email address." };
  if ([entity, name, email].some((v) => v.length > MAX_FIELD)) return { ok: false as const, status: 400, error: "One of the fields is too long." };
  const position = (input.position ?? "").trim();
  if (input.position !== undefined && !position) return { ok: false as const, status: 400, error: "Add your position, for example Director." };
  if (position.length > MAX_FIELD) return { ok: false as const, status: 400, error: "One of the fields is too long." };

  const acceptedAt = new Date().toISOString();
  const [row] = await getDb()
    .insert(portalAcceptances)
    .values({
      clientId: client.id,
      stepId: a.step,
      agreementVersion: a.version,
      agreementHash: hash,
      agreementText: text,
      entity,
      signerName: name,
      signerEmail: email,
      ip: input.ip.slice(0, 64),
      // Signed on the signing page: the position travels here (no new column; portal_* tables are never altered).
      userAgent: (position ? `signing page · position: ${position} · ${input.userAgent}` : input.userAgent).slice(0, 300),
      acceptedAt,
    })
    .returning();
  const note = `Accepted ${a.version} for ${entity} by ${name} (${email}) at ${acceptedAt}. Record #${row.id}.`;
  await markMilestoneComplete(client.id, a.step, note);
  return { ok: true as const, id: row.id, note, acceptedAt, row };
}

/**
 * The team records an acceptance made outside the portal (the client signed
 * before getting their link). Same append-only row, marked by `source`, and the
 * step is ticked. The exact current text is stored, so the record says what
 * version was in force.
 */
export async function recordAcceptanceManually(client: { id: string; clientType: string }, input: { entity: string; signerName: string; signerEmail: string; acceptedAt: string; source: string }) {
  const a = agreementFor(client.clientType);
  if (!a) return { ok: false as const, status: 404, error: "This product has no agreement." };
  // A product with a fixed entity always records that entity, whatever was typed.
  const entity = (a.entity ?? input.entity).trim(), name = input.signerName.trim(), email = input.signerEmail.trim();
  const when = new Date(input.acceptedAt);
  if (!entity || name.split(/\s+/).length < 2) return { ok: false as const, status: 400, error: "Entity and the signer's full name are required." };
  if (!EMAIL.test(email)) return { ok: false as const, status: 400, error: "A valid signer email is required." };
  if (Number.isNaN(when.getTime())) return { ok: false as const, status: 400, error: "A valid date and time is required." };
  const text = agreementText(a);
  const [row] = await getDb()
    .insert(portalAcceptances)
    .values({ clientId: client.id, stepId: a.step, agreementVersion: a.version, agreementHash: await sha256(text), agreementText: text, entity, signerName: name, signerEmail: email, ip: "", userAgent: `recorded by team: ${input.source.trim().slice(0, 200) || "signed outside the portal"}`, acceptedAt: when.toISOString() })
    .returning();
  await markMilestoneComplete(client.id, a.step, `Accepted ${a.version} for ${entity} by ${name} (${email}) at ${when.toISOString()}, recorded by the team. Record #${row.id}.`);
  return { ok: true as const, id: row.id };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The printable copy: the exact text accepted, then the acceptance details. Save as PDF from the browser's print. */
export function recordHtml(row: Awaited<ReturnType<typeof listAcceptances>>[number], clientName: string): string {
  const body = row.agreementText
    .split("\n")
    .map((line) => (line.trim() ? `<p>${esc(line)}</p>` : ""))
    .join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Agreement acceptance #${row.id}</title>
<style>body{font:15px/1.6 -apple-system,system-ui,sans-serif;color:#111;max-width:760px;margin:40px auto;padding:0 20px}
h1{font-size:22px;margin:0 0 4px}.sub{color:#666;font-size:13px;margin-bottom:28px}
.box{border:1px solid #ccc;border-radius:10px;padding:16px 20px;margin:28px 0}.box dt{font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#555;margin-top:10px}
.box dd{margin:2px 0 0}.hash{font-family:ui-monospace,monospace;font-size:12px;word-break:break-all}
button{padding:9px 16px;border-radius:8px;border:1px solid #999;background:#fff;cursor:pointer;font:inherit}@media print{button{display:none}}</style></head>
<body><button onclick="window.print()">Print or save as PDF</button>
<h1>Agreement acceptance record #${row.id}</h1><div class="sub">${esc(clientName)} · accepted in the client portal</div>
<div class="box"><dl>
<dt>Accepted for</dt><dd>${esc(row.entity)}</dd>
<dt>Signed by (typed name)</dt><dd>${esc(row.signerName)}</dd>
<dt>Email</dt><dd>${esc(row.signerEmail)}</dd>
<dt>Date and time (UTC)</dt><dd>${esc(row.acceptedAt)}</dd>
<dt>Agreement version</dt><dd>${esc(row.agreementVersion)}</dd>
<dt>IP address</dt><dd>${esc(row.ip || "not available")}</dd>
${row.userAgent.startsWith("recorded by team") ? `<dt>How it was recorded</dt><dd>${esc(row.userAgent)}</dd>` : ""}
${row.userAgent.startsWith("signing page") ? `<dt>Position</dt><dd>${esc(row.userAgent.split(" · ")[1]?.replace("position: ", "") ?? "")}</dd><dt>Signed on</dt><dd>The signing page</dd>` : ""}
<dt>Statement</dt><dd>I have read and accept the agreement on behalf of ${esc(row.entity)}.</dd>
<dt>SHA-256 of the text below</dt><dd class="hash">${esc(row.agreementHash)}</dd>
</dl></div>
<h2 style="font-size:17px">The text accepted</h2>
${body}
</body></html>`;
}
