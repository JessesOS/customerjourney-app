import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portalActivity } from "@/db/schema";
import { latestSignerEmail } from "@/lib/agreementStore";
import { EMAIL_KIND } from "@/lib/activityStore";
import { sendEmail, teamEmail, type EmailResult } from "@/lib/email";
import { getCompletedMilestoneIds } from "@/lib/portalClientStore";
import { clientEmailsFor, portalJourneyFor } from "@/lib/productRegistry";

// Automatic emails to a client's people (AT Network first, Jesse 2026-10-29):
// "stage done" once per stage, and who hears about something new to look at.
// Who: the product's clientEmails.to, but only for a client who has signed the
// agreement (a demo never emails anyone). On staging every client email goes
// to the team instead, marked with who it would have gone to. Nothing throws.

type Client = { id: string; name: string; clientType: string; portalToken: string };

const isStaging = (origin: string) => /staging|localhost|127\.0\.0\.1/.test(new URL(origin).hostname);

export function portalLink(origin: string, client: Client, stepId?: string) {
  return `${origin}/portal/${client.portalToken}${stepId ? `?task=${stepId}` : ""}`;
}

/** Who a client email goes to. Products without clientEmails: the signer only (the old rule). */
export async function clientRecipients(origin: string, client: Client): Promise<{ to: string[]; bcc: string[]; staging: boolean } | null> {
  const signer = await latestSignerEmail(client.id);
  if (!signer) return null;
  const listed = clientEmailsFor(client.clientType)?.to ?? [];
  const to = listed.length ? listed : [signer];
  if (isStaging(origin)) return { to: [teamEmail()], bcc: [], staging: true };
  return { to, bcc: listed.length ? [teamEmail()] : [], staging: false };
}

/** Sends to the client's people (see clientRecipients). */
export async function sendToClient(origin: string, client: Client, subject: string, text: string): Promise<EmailResult> {
  const r = await clientRecipients(origin, client);
  if (!r) return "skipped";
  const would = r.staging ? `[Staging: on prod this goes to ${(clientEmailsFor(client.clientType)?.to ?? ["the signer"]).join(", ")}]\n\n` : "";
  return sendEmail({ to: r.to[0], extraTo: r.to.slice(1), bcc: r.bcc, subject: r.staging ? `[staging] ${subject}` : subject, text: would + text, replyTo: teamEmail() });
}

async function alreadySent(clientId: string, ref: string): Promise<boolean> {
  try {
    const row = await getDb().select({ id: portalActivity.id }).from(portalActivity)
      .where(and(eq(portalActivity.clientId, clientId), eq(portalActivity.kind, EMAIL_KIND), eq(portalActivity.ref, ref))).limit(1);
    return row.length > 0;
  } catch {
    return true; // No activity table: don't risk sending twice.
  }
}

async function markSent(clientId: string, ref: string) {
  await getDb().insert(portalActivity).values({ clientId, kind: EMAIL_KIND, ref, person: "system", createdAt: new Date().toISOString() });
}

/** A step was just ticked: if that finished its stage, send the stage's email (once). */
export async function emailIfStageDone(origin: string, client: Client, stepId: string): Promise<EmailResult> {
  try {
    const messages = clientEmailsFor(client.clientType)?.stageDone;
    if (!messages) return "skipped";
    const stage = portalJourneyFor(client.clientType).stages.find((s) => s.milestones.some((m) => m.id === stepId));
    const message = stage && messages[stage.id];
    if (!stage || !message) return "skipped";
    const done = await getCompletedMilestoneIds(client.id);
    if (!stage.milestones.every((m) => done.has(m.id))) return "skipped";
    const ref = `stage-done:${stage.id}`;
    if (await alreadySent(client.id, ref)) return "skipped";
    if (!(await clientRecipients(origin, client))) return "skipped";
    await markSent(client.id, ref); // Before sending: two ticks at once must not send twice.
    const link = portalLink(origin, client);
    return await sendToClient(origin, client, message.subject, message.text.replaceAll("{portal}", link));
  } catch (error) {
    console.error("stage email failed:", error);
    return "failed";
  }
}
