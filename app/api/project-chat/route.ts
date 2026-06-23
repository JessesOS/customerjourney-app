import { env } from "cloudflare:workers";
import { projectKnowledge } from "@/lib/projectKnowledge";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
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

function keywords(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9$]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function retrieveContext(question: string) {
  const terms = keywords(question);
  const scored = projectKnowledge
    .map((chunk) => {
      const haystack = `${chunk.title} ${chunk.source} ${chunk.text}`.toLowerCase();
      const score = terms.reduce((total, term) => {
        const direct = haystack.includes(term) ? 3 : 0;
        const partial = haystack.split(term).length - 1;
        return total + direct + partial;
      }, 0);
      return { ...chunk, score };
    })
    .sort((a, b) => b.score - a.score);

  const matches = scored.filter((chunk) => chunk.score > 0).slice(0, 5);
  return matches.length ? matches : projectKnowledge.slice(0, 5);
}

function fallbackAnswer(question: string) {
  const matches = retrieveContext(question);
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
