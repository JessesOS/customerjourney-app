import { env } from "cloudflare:workers";
import { getMilestoneContent, getPortalClientByToken } from "@/lib/portalClientStore";

/**
 * The AI receptionist test playground. Token-scoped: chats as THIS client's
 * receptionist, running the exact qualification script generated from their
 * website (ob-3 / rsp-018 content). Powers the "Test your AI receptionist
 * live" task — same brain the production GHL bot will get, demo body.
 */

type ChatMessage = { role: "user" | "assistant"; content: string };

const MAX_MESSAGES = 40;
const MAX_CONTENT_CHARS = 2000;

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const client = await getPortalClientByToken(token);
  if (!client) {
    return Response.json({ ok: false, error: "Unknown portal token." }, { status: 404 });
  }

  const apiKey = (env as Record<string, unknown>).ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey) {
    return Response.json({ ok: false, error: "The test line isn't connected yet." }, { status: 503 });
  }

  const qualifierMilestone = client.clientType === "respond" ? "rsp-018" : "ob-3";
  const script = await getMilestoneContent(client.id, qualifierMilestone);
  if (!script.trim()) {
    return Response.json({ ok: false, error: "Your AI is still being set up — its questions are being finalized. Check back shortly." }, { status: 409 });
  }

  let history: ChatMessage[] = [];
  try {
    const body = (await request.json()) as { messages?: ChatMessage[] };
    history = (body.messages ?? [])
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CONTENT_CHARS) }));
  } catch {
    return Response.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const business = client.companyName || client.name;
  const system = `You are the AI phone receptionist for ${business}, taking an incoming enquiry.
This is a live test: the caller is actually the business owner trying out their new AI —
but you play it completely straight, as if they were a real customer calling.

Your qualification script (generated for this business — work through it naturally):
${script}

Rules:
- Sound like a warm, capable Australian receptionist. Short conversational replies,
  one question at a time. Never a wall of questions.
- Adapt to what the caller says — skip questions they've already answered, follow up
  naturally on what they tell you.
- If they try to stump you or go off-script, handle it gracefully and steer back.
- Never ask for payment details. Never invent prices or commitments — "the team will
  confirm that with you" is the honest move.
- If this is the very start of the conversation (no messages yet), open with a
  friendly greeting as ${business}'s receptionist and your first question.
- Plain text only. No emoji, no markdown, no em dashes.`;

  const messages = history.length > 0 ? history : [{ role: "user" as const, content: "(The call connects.)" }];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: 300, system, messages }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("receptionist-chat upstream error", response.status, detail.slice(0, 200));
    return Response.json({ ok: false, error: "The receptionist dropped the call — try again." }, { status: 502 });
  }

  const data = (await response.json()) as { content?: { type: string; text?: string }[] };
  const reply = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n").trim();
  if (!reply) {
    return Response.json({ ok: false, error: "The receptionist dropped the call — try again." }, { status: 502 });
  }

  return Response.json({ ok: true, reply });
}
