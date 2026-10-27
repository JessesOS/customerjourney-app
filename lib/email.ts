import { setting } from "@/lib/settings";

/**
 * Email alerts (AT Network first, Jesse 2026-10-25), sent through Resend's
 * HTTPS API: no library. Settings (Worker vars and secrets):
 *   EMAIL_API_KEY  secret: the Resend key. Unset = "unconfigured": the email is
 *                  logged, nothing is sent, and the request still succeeds.
 *   EMAIL_FROM     var: the sender, e.g. "Launchpad <portal@allconvos.ai>".
 *                  The domain must be verified in Resend.
 *   TEAM_EMAIL     var: where team alerts go (default jesse@allconvos.ai).
 * A send never fails the request that triggered it: the result says what
 * happened, like notifyHook.
 */

export type EmailResult = "sent" | "failed" | "unconfigured" | "skipped";
export type Attachment = { filename: string; contentBase64: string };
export type Email = { to: string; subject: string; text: string; html?: string; replyTo?: string; cc?: string[]; bcc?: string[]; attachments?: Attachment[]; extraTo?: string[] };

const DEFAULT_FROM = "Launchpad <portal@allconvos.ai>";
const DEFAULT_TEAM = "jesse@allconvos.ai";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function teamEmail(): string {
  return setting("TEAM_EMAIL") ?? DEFAULT_TEAM;
}

export function emailConfigured(): boolean {
  return Boolean(setting("EMAIL_API_KEY"));
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Plain text as a simple HTML email: paragraphs, and bare links made clickable. */
export function textToHtml(text: string): string {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => esc(p).replace(/\n/g, "<br>").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>'))
    .map((p) => `<p style="margin:0 0 14px">${p}</p>`)
    .join("");
  return `<div style="font:15px/1.6 -apple-system,system-ui,sans-serif;color:#111;max-width:620px">${paras}</div>`;
}

export async function sendEmail(email: Email): Promise<EmailResult> {
  if (!EMAIL_RE.test(email.to)) return "skipped";
  const key = setting("EMAIL_API_KEY");
  if (!key) {
    console.log(`[email unconfigured] to=${email.to} subject=${JSON.stringify(email.subject)}`);
    return "unconfigured";
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: setting("EMAIL_FROM") ?? DEFAULT_FROM,
        to: [email.to, ...(email.extraTo ?? []).filter((t) => EMAIL_RE.test(t))],
        subject: email.subject,
        text: email.text,
        html: email.html ?? textToHtml(email.text),
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
        ...(email.cc?.filter((c) => EMAIL_RE.test(c)).length ? { cc: email.cc.filter((c) => EMAIL_RE.test(c)) } : {}),
        ...(email.bcc?.filter((c) => EMAIL_RE.test(c)).length ? { bcc: email.bcc.filter((c) => EMAIL_RE.test(c)) } : {}),
        ...(email.attachments?.length ? { attachments: email.attachments.map((a) => ({ filename: a.filename, content: a.contentBase64 })) } : {}),
      }),
    });
    if (!res.ok) {
      console.error(`email failed (${res.status}) to=${email.to}:`, await res.text().catch(() => ""));
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("email threw:", error);
    return "failed";
  }
}

/** Several sends at once; none can throw. */
export async function sendEmails(emails: Email[]): Promise<EmailResult[]> {
  return Promise.all(emails.map(sendEmail));
}
