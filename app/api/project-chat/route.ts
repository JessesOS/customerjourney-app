import { env } from "cloudflare:workers";
import { projectKnowledge } from "@/lib/projectKnowledge";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type MeetingRequest = {
  number?: number;
  raw?: string;
  latest?: boolean;
  wantsSummary?: boolean;
};

const stopWords = new Set([
  "about",
  "after",
  "again",
  "anything",
  "what",
  "when",
  "where",
  "which",
  "with",
  "from",
  "have",
  "this",
  "that",
  "there",
  "their",
  "project",
  "please",
]);

function detectMeetingRequest(input: string): MeetingRequest | null {
  const normalized = input.toLowerCase();
  const match = normalized.match(/\bmeeting\s*(\d+)\b/);
  const latest = /\b(last|latest|most recent)\s+meeting\b|\bour last meeting\b|\bquick summary\b|\bsummary of our last meeting\b/.test(
    normalized
  );
  const wantsSummary = /\bsummary\b|\bsummarize\b|\bsummarise\b/.test(normalized);
  if (!match && !latest) return null;
  return {
    number: match ? Number(match[1]) : undefined,
    raw: match?.[0],
    latest,
    wantsSummary,
  };
}

function keywords(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9$]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function latestMeetingSession() {
  return projectKnowledge.reduce((max, chunk) => {
    if (typeof chunk.session !== "number") return max;
    return Math.max(max, chunk.session);
  }, 0);
}

function retrieveContext(question: string) {
  const terms = keywords(question);
  const meetingRequest = detectMeetingRequest(question);
  const latestSession = latestMeetingSession();
  const wantsTranscript = /\btranscript\b/.test(question.toLowerCase());
  const scored = projectKnowledge
    .map((chunk) => {
      const haystack = `${chunk.title} ${chunk.source} ${chunk.text}`.toLowerCase();
      const aliasText = (chunk.aliases ?? []).join(" ").toLowerCase();
      const searchable = `${haystack} ${aliasText}`;
      let score = terms.reduce((total, term) => {
        const direct = haystack.includes(term) ? 3 : 0;
        const aliasDirect = aliasText.includes(term) ? 2 : 0;
        const partial = searchable.split(term).length - 1;
        return total + direct + aliasDirect + partial;
      }, 0);
      if (meetingRequest?.number !== undefined) {
        if (chunk.session === meetingRequest.number) {
          score += 25;
        } else if (chunk.session !== undefined) {
          score -= 10;
        }
      }
      if (meetingRequest?.latest) {
        if (chunk.session === latestSession) {
          score += 30;
        } else if (chunk.session !== undefined) {
          score -= 12;
        }
        if (meetingRequest.wantsSummary && chunk.kind === "meeting-summary") {
          score += 12;
        }
        if (wantsTranscript && chunk.kind === "meeting-transcript") {
          score += 12;
        }
      }
      if (meetingRequest && searchable.includes(meetingRequest.raw ?? "")) {
        score += 8;
      }
      return { ...chunk, score };
    })
    .sort((a, b) => b.score - a.score);

  if (meetingRequest?.latest) {
    const latestMatches = scored.filter((chunk) => chunk.session === latestSession);
    if (latestMatches.length) {
      return latestMatches
        .sort((a, b) => {
          const aPriority =
            meetingRequest.wantsSummary && a.kind === "meeting-summary"
              ? 2
              : wantsTranscript && a.kind === "meeting-transcript"
                ? 2
                : a.kind?.startsWith("meeting-")
                  ? 1
                  : 0;
          const bPriority =
            meetingRequest.wantsSummary && b.kind === "meeting-summary"
              ? 2
              : wantsTranscript && b.kind === "meeting-transcript"
                ? 2
                : b.kind?.startsWith("meeting-")
                  ? 1
                  : 0;
          return bPriority - aPriority;
        })
        .slice(0, 3);
    }
  }

  const matches = scored.filter((chunk) => chunk.score > 0).slice(0, 5);
  if (meetingRequest?.number !== undefined) {
    const meetingMatches = scored.filter((chunk) => chunk.session === meetingRequest.number).slice(0, 3);
    if (meetingMatches.length) return meetingMatches;
    return [];
  }
  return matches.length ? matches : projectKnowledge.slice(0, 5);
}

function fallbackAnswer(question: string) {
  const matches = retrieveContext(question);
  const meetingRequest = detectMeetingRequest(question);
  const latestMeetingRequest = meetingRequest?.latest;
  if (meetingRequest?.number !== undefined && matches.length === 0) {
    return {
      answer: `I do not yet have a confirmed source for meeting ${meetingRequest.number}. I can stop matching to meeting 1 once you add or rename the real meeting ${meetingRequest.number} doc in Drive.`,
      sources: [],
      mode: "project-search",
    };
  }
  if (latestMeetingRequest && matches.length) {
    const summaryChunk =
      matches.find((chunk) => chunk.kind === "meeting-summary") ?? matches[0];
    return {
      answer: `${summaryChunk.title}:\n\n${summaryChunk.text}`,
      sources: matches.map((chunk) => ({
        title: chunk.title,
        source: chunk.source,
      })),
      mode: "project-search",
    };
  }
  const summary = matches
    .slice(0, 3)
    .map((chunk) => `${chunk.title}: ${chunk.text}`)
    .join("\n\n");

  return {
    answer: `Based on the project knowledge I have so far:\n\n${summary}\n\nAdd more source notes or documents and I can answer with a deeper project memory.`,
    sources: matches.map((chunk) => ({
      title: chunk.title,
      source: chunk.source,
    })),
    mode: "project-search",
  };
}

async function openAiAnswer(question: string, messages: ChatMessage[]) {
  const apiKey = (env as { OPENAI_API_KEY?: string }).OPENAI_API_KEY;
  if (!apiKey) return fallbackAnswer(question);

  const matches = retrieveContext(question);
  const meetingRequest = detectMeetingRequest(question);
  if (meetingRequest?.latest && matches.length) {
    const summaryChunk =
      matches.find((chunk) => chunk.kind === "meeting-summary") ?? matches[0];
    return {
      answer: summaryChunk.text,
      sources: matches.map((chunk) => ({
        title: chunk.title,
        source: chunk.source,
      })),
      mode: "project-search",
    };
  }
  const context = matches
    .map((chunk) => `[${chunk.title} | ${chunk.source}]\n${chunk.text}`)
    .join("\n\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are the AI project brain for the Strategize / Chris McBreen Canterbury pilot. Answer only from the supplied project context unless clearly labelling a recommendation as an inference. Be concise, useful, and cite the source titles you used.",
        },
        {
          role: "user",
          content: `Project context:\n${context}\n\nRecent chat:\n${messages
            .slice(-6)
            .map((message) => `${message.role}: ${message.content}`)
            .join("\n")}\n\nQuestion: ${question}`,
        },
      ],
    }),
  });

  if (!response.ok) return fallbackAnswer(question);

  const payload = (await response.json()) as {
    output_text?: string;
  };

  return {
    answer: payload.output_text ?? fallbackAnswer(question).answer,
    sources: matches.map((chunk) => ({
      title: chunk.title,
      source: chunk.source,
    })),
    mode: "ai",
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      question?: string;
      messages?: ChatMessage[];
    };
    const question = body.question?.trim();

    if (!question) {
      return Response.json({ error: "Ask a project question first." }, { status: 400 });
    }

    const result = await openAiAnswer(question, body.messages ?? []);
    return Response.json(result);
  } catch {
    return Response.json({ error: "Project chat failed." }, { status: 500 });
  }
}
