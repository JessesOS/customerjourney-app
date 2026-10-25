import { latestSignerEmail } from "@/lib/agreementStore";
import { commsSteps, STATUS_LABEL, type ChangeStatus, type CommKind } from "@/lib/commsStore";
import { sendEmail, sendEmails, teamEmail, type EmailResult } from "@/lib/email";
import { portalJourneyFor } from "@/lib/productRegistry";

// What each event emails, and to whom (AT Network first, 2026-10-25).
//   Team (TEAM_EMAIL): every client message, approval and change request; every
//   sign-off and agreement acceptance, with the record link.
//   Client: the signer's email from their latest agreement acceptance (the only
//   client email we hold). A team reply, a change-request status, and their
//   copy of the acceptance. No signer yet = no client email, and that's fine.
// Nothing here throws; results are returned for the caller to log or ignore.

type Client = { id: string; name: string; clientType: string; portalToken: string };

const KIND_WORD: Record<CommKind, string> = { message: "message", approval: "approval", change_request: "change request", status: "status update" };

function brand(client: Client) {
  const j = portalJourneyFor(client.clientType);
  return j.brandName ?? j.wordmark;
}
function stepTitle(client: Client, stepId: string) {
  return stepId ? commsSteps(client.clientType).find((s) => s.id === stepId)?.title ?? stepId : "General";
}
function portalUrl(origin: string, client: Client, stepId?: string) {
  return `${origin}/portal/${client.portalToken}${stepId ? `?task=${stepId}` : ""}`;
}
function boardUrl(origin: string, client: Client) {
  return `${origin}/admin/clients/${client.id}/board`;
}

/** The client wrote something: tell the team. */
export async function alertTeamOfClientComm(origin: string, client: Client, c: { kind: CommKind; stepId: string; authorName: string; body: string }): Promise<EmailResult> {
  const kind = KIND_WORD[c.kind];
  return sendEmail({
    to: teamEmail(),
    subject: `${client.name}: new ${kind} on "${stepTitle(client, c.stepId)}"`,
    text: `${c.authorName} sent a ${kind} in the ${brand(client)} portal.\n\nStep: ${stepTitle(client, c.stepId)}\n\n${c.body}\n\nReply on the board: ${boardUrl(origin, client)}\n\nThe rule: reply within one business day.`,
  });
}

/** The team replied or moved a change request: tell the client, if we have their email. */
export async function alertClientOfTeamComm(origin: string, client: Client, c: { kind: CommKind; stepId: string; authorName: string; body: string; status?: ChangeStatus | null }): Promise<EmailResult> {
  const to = await latestSignerEmail(client.id);
  if (!to) return "skipped";
  const step = stepTitle(client, c.stepId);
  const what = c.kind === "status" && c.status ? `Your change request is now ${STATUS_LABEL[c.status]}` : `${c.authorName} replied`;
  return sendEmail({
    to,
    subject: `${brand(client)}: ${what} (${step})`,
    text: `${what} on "${step}".\n\n${c.body}\n\nOpen your portal to read it and reply: ${portalUrl(origin, client, c.stepId || undefined)}\n\nPlease reply in the portal, not to this email, so it stays on the record.`,
    replyTo: teamEmail(),
  });
}

/** A sign-off step was completed: tell the team. */
export async function alertTeamOfSignoff(origin: string, client: Client, stepId: string, signer: string): Promise<EmailResult> {
  return sendEmail({
    to: teamEmail(),
    subject: `${client.name}: "${stepTitle(client, stepId)}" signed off by ${signer}`,
    text: `${signer} signed off "${stepTitle(client, stepId)}" in the ${brand(client)} portal.\n\nThe approval record is on the step's thread and in the export: ${boardUrl(origin, client)}`,
  });
}

/** The agreement was accepted: the signer's copy, and the team's. */
export async function alertAgreementAccepted(origin: string, client: Client, a: { id: number; version: string; entity: string; signerName: string; signerEmail: string; acceptedAt: string }): Promise<EmailResult[]> {
  const record = `${origin}/api/portal/${client.portalToken}/agreement/${a.id}`;
  return sendEmails([
    {
      to: a.signerEmail,
      subject: `Your signed agreement with ${brand(client)}`,
      text: `Hi ${a.signerName.split(/\s+/)[0]},\n\nThank you. You accepted the agreement (version ${a.version}) on behalf of ${a.entity} at ${a.acceptedAt} UTC.\n\nYour copy, with the full text and the acceptance details, is here. You can print it or save it as a PDF:\n${record}\n\nYour portal: ${portalUrl(origin, client)}`,
      replyTo: teamEmail(),
    },
    {
      to: teamEmail(),
      subject: `${client.name}: agreement accepted by ${a.signerName} (${a.version})`,
      text: `${a.signerName} (${a.signerEmail}) accepted version ${a.version} for ${a.entity} at ${a.acceptedAt} UTC.\n\nRecord: ${record}\nBoard: ${boardUrl(origin, client)}`,
    },
  ]);
}
