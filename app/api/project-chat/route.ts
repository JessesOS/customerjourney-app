import { env } from "cloudflare:workers";
import { getKnowledgeSnapshot, type KnowledgeSnapshot } from "@/lib/knowledgeStore";

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

type RetrievedChunk = KnowledgeSnapshot["chunks"][number] & {
  score: number;
};

type ContractRequest = {
  asksAboutContract: boolean;
  asksAboutFinancials: boolean;
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

function retrieveRelevantSources(question: string, snapshot: KnowledgeSnapshot) {
  const terms = keywords(question);
  return snapshot.sources
    .map((source) => {
      const searchable = `${source.title} ${source.source} ${source.kind} ${source.note ?? ""}`.toLowerCase();
      const score = terms.reduce((total, term) => {
        const direct = searchable.includes(term) ? 3 : 0;
        const partial = searchable.split(term).length - 1;
        return total + direct + partial;
      }, 0);
      return { ...source, score };
    })
    .filter((source) => source.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function detectContractRequest(input: string): ContractRequest {
  const normalized = input.toLowerCase();
  return {
    asksAboutContract:
      /\bcontract\b|\bagreement\b|\bterms\b|\bobligation\b|\bobligations\b|\bcancellation\b|\bnotice\b|\brefund\b/.test(
        normalized
      ),
    asksAboutFinancials:
      /\bfinancial\b|\bpayment\b|\bpayments\b|\bfee\b|\bfees\b|\bcost\b|\bcosts\b|\brefund\b|\bno refund\b|\bminimum term\b/.test(
        normalized
      ),
  };
}

function isContractLikeChunk(chunk: KnowledgeSnapshot["chunks"][number]) {
  const searchable = `${chunk.title} ${chunk.source} ${chunk.text} ${(chunk.aliases ?? []).join(" ")}`.toLowerCase();
  return (
    chunk.kind === "contract" ||
    searchable.includes("contract") ||
    searchable.includes("agreement") ||
    searchable.includes("minimum term") ||
    searchable.includes("notice period") ||
    searchable.includes("refund") ||
    searchable.includes("cancellation")
  );
}

function latestMeetingSession(snapshot: KnowledgeSnapshot) {
  return snapshot.chunks.reduce((max, chunk) => {
    if (typeof chunk.session !== "number") return max;
    return Math.max(max, chunk.session);
  }, 0);
}

function retrieveContext(question: string, snapshot: KnowledgeSnapshot) {
  const terms = keywords(question);
  const meetingRequest = detectMeetingRequest(question);
  const contractRequest = detectContractRequest(question);
  const latestSession = latestMeetingSession(snapshot);
  const wantsTranscript = /\btranscript\b/.test(question.toLowerCase());
  const pool = contractRequest.asksAboutContract
    ? snapshot.chunks.filter((chunk) => isContractLikeChunk(chunk))
    : snapshot.chunks;
  const scored = pool
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
      if (contractRequest.asksAboutContract) {
        if (isContractLikeChunk(chunk)) score += 20;
        if (contractRequest.asksAboutFinancials) {
          if (
            searchable.includes("minimum term") ||
            searchable.includes("notice") ||
            searchable.includes("refund") ||
            searchable.includes("no-refund")
          ) {
            score += 15;
          }
        }
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
  return matches.length ? matches : snapshot.chunks.slice(0, 5);
}

function isDirectQuestion(question: string) {
  const normalized = question.toLowerCase();
  return (
    /\bwhat\s+(was|is)\s+the\s+name\b/.test(normalized) ||
    /\bwhat\s+did\b.*\bcall\b/.test(normalized) ||
    /\bwhat\s+did\b.*\bmention\b/.test(normalized) ||
    /\bwhich\s+calculator\b/.test(normalized)
  );
}

function extractCalculatorName(text: string) {
  const explicitMatch = text.match(
    /\b(profit leakage calculator|score app|profit leakage calculator or score app)\b/i
  );
  if (explicitMatch) return explicitMatch[0];
  return null;
}

function directAnswer(question: string, matches: RetrievedChunk[]) {
  const normalized = question.toLowerCase();
  const top = matches[0];
  if (!top) return null;

  if (normalized.includes("calculator") && /\bname\b|\bcall\b|\bmention\b/.test(normalized)) {
    const names = matches
      .map((chunk) => extractCalculatorName(chunk.text))
      .filter((value): value is string => Boolean(value));
    const uniqueNames = [...new Set(names.map((name) => name.toLowerCase()))];

    if (uniqueNames.length) {
      const preferred =
        uniqueNames.find((name) => name.includes("profit leakage calculator")) ??
        uniqueNames[0];
      const answer =
        preferred === "profit leakage calculator or score app"
          ? "Chris referred to it as a profit leakage calculator, and also described it as a score app."
          : `Chris referred to it as the ${preferred}.`;
      return {
        answer,
        sources: matches.map((chunk) => ({
          title: chunk.title,
          source: chunk.source,
        })),
        mode: "project-search",
      };
    }
  }

  return null;
}

function fallbackAnswer(question: string, snapshot: KnowledgeSnapshot) {
  const matches = retrieveContext(question, snapshot) as RetrievedChunk[];
  const meetingRequest = detectMeetingRequest(question);
  const contractRequest = detectContractRequest(question);
  const relevantSources = retrieveRelevantSources(question, snapshot);
  const latestMeetingRequest = meetingRequest?.latest;
  if (meetingRequest?.number !== undefined && matches.length === 0) {
    return {
      answer: `I do not yet have a confirmed source for meeting ${meetingRequest.number}. I can stop matching to meeting 1 once you add or rename the real meeting ${meetingRequest.number} doc in Drive.`,
      sources: [],
      mode: "project-search",
    };
  }
  if (contractRequest.asksAboutContract) {
    const primary = matches[0];
    if (!primary) {
      const contractSources = relevantSources.filter((source) => source.kind === "contract");
      return {
        answer: contractSources.length
          ? "I found contract files in the library, but they are not indexed as searchable text yet, so I cannot answer contract obligations reliably from source text."
          : "I do not have indexed contract material for that question yet.",
        sources: contractSources.map((source) => ({ title: source.title, source: source.source })),
        mode: "project-search",
      };
    }

    if (contractRequest.asksAboutFinancials) {
      return {
        answer: `From the indexed contract-related material I currently have: ${primary.text}`,
        sources: matches.map((chunk) => ({
          title: chunk.title,
          source: chunk.source,
        })),
        mode: "project-search",
      };
    }
  }
  if (!matches.length && relevantSources.length) {
    const unavailable = relevantSources.filter((source) => (source.status ?? "indexed") !== "indexed");
    if (unavailable.length) {
      return {
        answer:
          "I found relevant files in the library, but they are not currently indexed as searchable text. I can see the source exists, but I should not answer confidently from it yet.",
        sources: unavailable.map((source) => ({
          title: source.title,
          source: source.source,
        })),
        mode: "project-search",
      };
    }
  }
  const direct = isDirectQuestion(question) ? directAnswer(question, matches) : null;
  if (direct) return direct;
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
  const snapshot = await getKnowledgeSnapshot();
  if (!apiKey) return fallbackAnswer(question, snapshot);

  const matches = retrieveContext(question, snapshot);
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
            "You are the AI project brain for the Strategize / Chris McBreen Canterbury pilot. Answer only from the supplied project context unless clearly labelling a recommendation as an inference. Answer the current user question directly. Do not repeat or summarize the previous answer unless the new question clearly asks for it. For simple factual follow-ups, lead with the exact answer in one or two sentences.",
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

  if (!response.ok) return fallbackAnswer(question, snapshot);

  const payload = (await response.json()) as {
    output_text?: string;
  };

  return {
    answer: payload.output_text ?? fallbackAnswer(question, snapshot).answer,
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
