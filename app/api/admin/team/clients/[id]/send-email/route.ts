import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portalClients } from "@/db/schema";
import { sendEmail, teamEmail, textToHtml } from "@/lib/email";
import { requireTeam } from "@/lib/teamAuth";

// A one-off email to a client from portal@allconvos.ai (2026-10-27: "thanks
// for signing" to AT Network). Admin only. Replies go to the team inbox.
// Sends exactly what it's given: the caller writes the words and the recipients.

const MAX_ATTACH_BYTES = 5_000_000;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireTeam(request, { admin: true });
  if (actor instanceof Response) return actor;
  const client = (await getDb().select().from(portalClients).where(eq(portalClients.id, (await params).id)).limit(1))[0];
  if (!client) return Response.json({ ok: false, error: "Unknown client." }, { status: 404 });
  const b = (await request.json().catch(() => ({}))) as {
    to?: unknown; bcc?: unknown; subject?: unknown; text?: unknown; html?: unknown;
    attachments?: { filename?: unknown; contentBase64?: unknown }[];
  };
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  const to = list(b.to);
  const subject = typeof b.subject === "string" ? b.subject.trim() : "";
  const text = typeof b.text === "string" ? b.text : "";
  if (!to.length || !subject || !text) return Response.json({ ok: false, error: "to, subject and text are required." }, { status: 400 });
  const attachments = (b.attachments ?? [])
    .filter((a) => typeof a.filename === "string" && typeof a.contentBase64 === "string")
    .map((a) => ({ filename: a.filename as string, contentBase64: a.contentBase64 as string }));
  if (attachments.some((a) => a.contentBase64.length * 0.75 > MAX_ATTACH_BYTES)) return Response.json({ ok: false, error: "Attachment too large." }, { status: 400 });
  const result = await sendEmail({
    to: to[0],
    extraTo: to.slice(1),
    bcc: list(b.bcc),
    subject,
    text,
    html: typeof b.html === "string" && b.html ? b.html : textToHtml(text),
    replyTo: teamEmail(),
    attachments,
  });
  return Response.json({ ok: result === "sent", result, client: client.name }, { status: result === "sent" ? 200 : 502 });
}
