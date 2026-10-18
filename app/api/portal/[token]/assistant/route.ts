import Anthropic from "@anthropic-ai/sdk";
import { getPortalClientByToken } from "@/lib/portalClientStore";
import { portalJourneyFor } from "@/lib/productRegistry";
import { setting } from "@/lib/settings";
import {
  QUESTIONS_PER_HOUR,
  addPortalMessage,
  getAssistantPack,
  listPortalMessages,
  listSupportRequests,
  liveContextFor,
  questionsInLastHour,
} from "@/lib/assistantStore";

// The "Ask Jesse" panel (Jesse, 2026-10-18). GET: the client's history and
// requests. POST { message }: an answer from Claude, grounded only in the
// client's reviewed pack and live progress. Token auth like every portal route;
// 404 unless the client's product switches the assistant on.

const MODEL = "claude-opus-5-5";
const MAX_MESSAGE = 2000;
const HISTORY = 20;

const RULES = `You are the help assistant inside a client's onboarding portal, run by allconvos.ai (Jesse Allan, jesse@allconvos.ai). You answer the client's questions about their project.

How to answer:
- Answer only from the project notes and progress below. If they don't cover it, say you're not sure and offer to send the question to Jesse. Never guess dates, prices, features or promises.
- Plain words, short sentences, warm and direct. Usually two to five sentences. No markdown headings.
- Speak about "we" (allconvos.ai) and "Jesse". Never mention RT Digital or any other client.
- Never ask for, accept or repeat seed phrases, private keys, passwords, recovery codes or wallet balances. If the client shares one, tell them to stop and not share it anywhere.
- No financial, legal or tax advice. Don't comment on Bitcoin prices or investments.
- Never invent testimonials, numbers or results. Keep the client's own claims and offer wording exactly as they are.
- Don't discuss pricing, invoices, payments to us or contract terms: offer to send it to Jesse.
- Wording marked (draft) in the notes is not agreed yet: say so if you use it.
- The client can raise a request for Jesse in this panel. Set suggestRequest to true when the client asks for a change, reports a problem, asks something only Jesse can answer, or wants Jesse to get back to them. Then requestTitle is a short title for it (under 10 words), written from the client's side. Otherwise suggestRequest is false and requestTitle is "".`;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    suggestRequest: { type: "boolean" },
    requestTitle: { type: "string" },
  },
  required: ["reply", "suggestRequest", "requestTitle"],
  additionalProperties: false,
} as const;

async function clientFor(params: Promise<{ token: string }>) {
  const { token } = await params;
  const client = await getPortalClientByToken(token);
  if (!client || !portalJourneyFor(client.clientType).assistant) return null;
  return client;
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const client = await clientFor(params);
  if (!client) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  const [messages, requests] = await Promise.all([listPortalMessages(client.id), listSupportRequests(client.id)]);
  return Response.json({
    ok: true,
    available: Boolean(setting("ANTHROPIC_API_KEY")),
    messages: messages.map((m) => ({ id: m.id, role: m.role, body: m.body, requestTaskId: m.requestTaskId, createdAt: m.createdAt })),
    requests,
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const client = await clientFor(params);
  if (!client) return Response.json({ ok: false, error: "Not found" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as { message?: unknown };
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return Response.json({ ok: false, error: "Type a question first." }, { status: 400 });
  if (message.length > MAX_MESSAGE) return Response.json({ ok: false, error: `Keep it under ${MAX_MESSAGE} characters.` }, { status: 400 });
  if ((await questionsInLastHour(client.id)) >= QUESTIONS_PER_HOUR) {
    return Response.json({ ok: false, error: "You've asked a lot this hour. Take a break, or send it to Jesse below." }, { status: 429 });
  }

  const earlier = (await listPortalMessages(client.id, HISTORY)).filter((m) => m.role === "client" || m.role === "assistant");
  await addPortalMessage(client.id, "client", message);

  const answer = async (reply: string, suggestRequest: boolean, requestTitle = "") => {
    await addPortalMessage(client.id, "assistant", reply);
    return Response.json({ ok: true, reply, suggestRequest, requestTitle });
  };

  const apiKey = setting("ANTHROPIC_API_KEY");
  const pack = await getAssistantPack(client.id);
  if (!apiKey || !pack) {
    return answer("I can't answer questions just yet, but Jesse can. Send this to him below and he'll get back to you.", true, message.slice(0, 80));
  }

  // The conversation: earlier questions and answers (requests and team replies are in the live notes), then this question.
  const history: Anthropic.Beta.BetaMessageParam[] = [];
  for (const m of earlier) {
    if (m.role === "client" && m.body.startsWith("Request: ")) continue;
    const role = m.role === "client" ? "user" : "assistant";
    if (!history.length && role === "assistant") continue;
    history.push({ role, content: m.body });
  }
  history.push({ role: "user", content: message });

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
      system: [
        // Rules and the reviewed pack change rarely: cached. Live progress changes every visit: after the breakpoint.
        { type: "text", text: `${RULES}\n\n<project_notes>\n${pack}\n</project_notes>`, cache_control: { type: "ephemeral" } },
        { type: "text", text: `<live_progress>\n${await liveContextFor(client)}\n</live_progress>` },
      ],
      messages: history,
    });

    if (response.stop_reason === "refusal") {
      return answer("I can't help with that one here. Send it to Jesse and he'll get back to you.", true, message.slice(0, 80));
    }
    const text = response.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const parsed = JSON.parse(text) as { reply?: unknown; suggestRequest?: unknown; requestTitle?: unknown };
    const reply = typeof parsed.reply === "string" && parsed.reply.trim() ? parsed.reply.trim() : "Sorry, I didn't get that. Could you ask another way?";
    return answer(reply, parsed.suggestRequest === true, typeof parsed.requestTitle === "string" ? parsed.requestTitle.slice(0, 160) : "");
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ ok: false, error: "The assistant is busy right now. Try again in a minute, or send it to Jesse below." }, { status: 503 });
    }
    console.error("assistant: answer failed", error instanceof Anthropic.APIError ? `${error.status} ${error.message}` : error);
    return Response.json({ ok: false, error: "Something went wrong answering that. Try again, or send it to Jesse below." }, { status: 502 });
  }
}
