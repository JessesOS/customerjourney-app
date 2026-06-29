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
  "a",
  "an",
  "about",
  "all",
  "am",
  "and",
  "any",
  "after",
  "again",
  "anything",
  "are",
  "at",
  "be",
  "both",
  "can",
  "client",
  "dashboard",
  "for",
  "give",
  "got",
  "how",
  "i",
  "if",
  "in",
  "into",
  "it",
  "its",
  "just",
  "last",
  "latest",
  "main",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "please",
  "points",
  "quick",
  "question",
  "right",
  "so",
  "summary",
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
  "those",
  "to",
  "us",
  "was",
  "we",
  "will",
  "you",
]);

function normalizeText(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9$]+/g, " ").trim();
}

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
  return normalizeText(input)
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function countOccurrences(haystack: string, needle: string) {
  if (!needle) return 0;
  const matches = haystack.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"));
  return matches?.length ?? 0;
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function detectTopicIntent(input: string) {
  const normalized = input.toLowerCase();
  return {
    asksAboutOffer: /\boffer\b|\bhook\b|\bangle\b|\bstrongest direction\b/.test(normalized),
    asksAboutActions: /\baction items\b|\bnext steps\b|\bwhat happens next\b|\bto do\b/.test(normalized),
    asksForDefinition:
      /\bwhat is\b|\bwhat's\b|\bdefine\b|\bexplain\b/.test(normalized),
    asksAboutSystem:
      /\bsystem\b|\bfunnel\b|\blead to booked consult\b|\bbooked consult\b|\bqualification\b/.test(normalized),
    asksAboutContract:
      /\bcontract\b|\bagreement\b|\bterms\b|\bobligation\b|\bobligations\b|\bcancellation\b|\bnotice\b|\brefund\b/.test(
        normalized
      ),
  };
}

function trimMatches(matches: RetrievedChunk[], limit = 4) {
  const bySource = new Map<string, number>();
  const result: RetrievedChunk[] = [];

  for (const match of matches) {
    const seen = bySource.get(match.sourceId) ?? 0;
    if (seen >= 2) continue;
    bySource.set(match.sourceId, seen + 1);
    result.push(match);
    if (result.length >= limit) break;
  }

  return result;
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
  const asksAboutFinancials =
    /\bfinancial\b|\bpayment\b|\bpayments\b|\bfee\b|\bfees\b|\bcost\b|\bcosts\b|\bprice\b|\bpricing\b|\bmonthly\b|\brefund\b|\bno refund\b|\bminimum term\b/.test(
      normalized
    );
  const asksAboutContract =
    /\bcontract\b|\bagreement\b|\bterms\b|\bobligation\b|\bobligations\b|\bcancellation\b|\bnotice\b|\brefund\b/.test(
      normalized
    ) || asksAboutFinancials;

  return {
    asksAboutContract,
    asksAboutFinancials,
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
  const topicIntent = detectTopicIntent(question);
  const latestSession = latestMeetingSession(snapshot);
  const wantsTranscript = /\btranscript\b/.test(question.toLowerCase());
  const pool = contractRequest.asksAboutContract
    ? snapshot.chunks.filter((chunk) => isContractLikeChunk(chunk))
    : snapshot.chunks;
  const scored = pool
    .map((chunk) => {
      const titleText = normalizeText(chunk.title);
      const sourceText = normalizeText(chunk.source);
      const bodyText = normalizeText(chunk.text);
      const aliasText = normalizeText((chunk.aliases ?? []).join(" "));
      const searchable = `${titleText} ${sourceText} ${bodyText} ${aliasText}`;
      let score = terms.reduce((total, term) => {
        const titleHits = countOccurrences(titleText, term) * 8;
        const sourceHits = countOccurrences(sourceText, term) * 6;
        const aliasHits = countOccurrences(aliasText, term) * 10;
        const bodyHits = countOccurrences(bodyText, term) * 3;
        const exactTitle = titleText.includes(term) ? 4 : 0;
        const exactAlias = aliasText.includes(term) ? 5 : 0;
        return total + titleHits + sourceHits + aliasHits + bodyHits + exactTitle + exactAlias;
      }, 0);
      const matchedTerms = unique(terms.filter((term) => searchable.includes(term))).length;
      score += matchedTerms * 4;

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
      if (topicIntent.asksAboutActions) {
        if (chunk.kind === "working-plan") score += 30;
        if (chunk.kind === "meeting-summary") score += 10;
        if (aliasText.includes("action items") || titleText.includes("action")) score += 15;
      }
      if (topicIntent.asksForDefinition) {
        if (titleText.includes("overview")) score += 24;
        if (titleText.includes("what is")) score += 18;
      }
      if (topicIntent.asksAboutSystem) {
        if (chunk.kind === "system") score += 24;
        if (aliasText.includes("lead to booked consult") || aliasText.includes("system map")) score += 16;
      }
      if (topicIntent.asksAboutOffer) {
        if (chunk.kind === "meeting-summary" || chunk.kind === "meeting-transcript") score += 18;
        if (
          aliasText.includes("offer") ||
          aliasText.includes("hook") ||
          bodyText.includes("benchmark report") ||
          bodyText.includes("profit leakage")
        ) {
          score += 14;
        }
      }
      if (contractRequest.asksAboutContract) {
        if (isContractLikeChunk(chunk)) score += 20;
        if (contractRequest.asksAboutFinancials) {
          if (
            searchable.includes("monthly fee") ||
            searchable.includes("setup pricing") ||
            searchable.includes("full setup price") ||
            searchable.includes("minimum term") ||
            searchable.includes("notice") ||
            searchable.includes("refund") ||
            searchable.includes("no refund") ||
            searchable.includes("gst")
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
        .slice(0, 5);
    }
  }

  const matches = trimMatches(scored.filter((chunk) => chunk.score >= 8), 5);
  if (meetingRequest?.number !== undefined) {
    const meetingMatches = trimMatches(
      scored.filter((chunk) => chunk.session === meetingRequest.number && chunk.score >= 4),
      4
    );
    if (meetingMatches.length) return meetingMatches;
    return [];
  }
  if (contractRequest.asksAboutContract) {
    return matches;
  }
  return matches;
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

function isShortQuestion(question: string) {
  const normalized = question.toLowerCase().trim();
  const termCount = keywords(question).length;
  return (
    normalized.length <= 100 &&
    (termCount <= 6 ||
      /\bwhat\b|\bwhich\b|\bwho\b|\bwhen\b|\bhow much\b|\bmonthly\b|\bfee\b|\bcost\b|\bname\b|\bsummary\b/.test(
        normalized
      ))
  );
}

function cleanAnswer(answer: string, terse = false) {
  const normalized = answer
    .replace(/^Based on the project knowledge I have so far:\s*/i, "")
    .replace(/^[A-Z][A-Za-z0-9' /&+:-]{0,80}:\s+/m, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+\n/g, "\n")
    .trim();

  if (!terse) return normalized;

  const firstBlock = normalized.split(/\n\n/)[0]?.trim() ?? normalized;
  const compact = firstBlock.replace(/\s+/g, " ").trim();

  if (compact.length <= 260) return compact;

  const sentenceSplit = compact.match(/.*?[.!?](?:\s|$)/g);
  if (sentenceSplit?.length) {
    return sentenceSplit.slice(0, 2).join(" ").trim();
  }

  return compact.slice(0, 257).trimEnd() + "...";
}

function buildContext(matches: RetrievedChunk[], terse = false) {
  const scoped = terse ? matches.slice(0, 2) : matches.slice(0, 4);
  return scoped
    .map((chunk) => `[${chunk.title} | ${chunk.source}]\n${chunk.text}`)
    .join("\n\n");
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

  if (
    /\bexplain\b.*\blead to booked consult\b|\blead to booked consult\b.*\bsystem\b|\bsystem map\b|\bbooked consult system\b/.test(
      normalized
    )
  ) {
    const primarySystem =
      matches.find((chunk) => chunk.kind === "system") ??
      matches.find((chunk) => chunk.title.toLowerCase().includes("meeting 2 summary")) ??
      top;
    return {
      answer:
        "The flow is ad click to lead capture to CRM entry to AI nurture and qualification, then booked consult and human handoff. In practice: Meta or Google traffic hits the calculator or landing page, the lead is captured into GHL, qualified on revenue, staff, coach status, and location, then strong-fit prospects are offered a booked consult.",
      sources: [
        {
          title: primarySystem.title,
          source: primarySystem.source,
        },
      ],
      mode: "project-search",
    };
  }

  if (/\bsubsid(?:y|ies)\b|\bgrants?\b|\bwage subsidies?\b|\bregional business partner\b/.test(normalized)) {
    const subsidyChunk =
      matches.find((chunk) => /subsid|grant|wage/i.test(chunk.text)) ??
      matches.find((chunk) => chunk.title.toLowerCase().includes("meeting 2 summary")) ??
      top;
    return {
      answer:
        "Chris mentioned wage subsidies and regional business partner grants as possible offer angles, but said they felt weaker and more boring than the benchmark or profit-gap direction. He wanted them kept as secondary options, not the main lead offer.",
      sources: [
        {
          title: subsidyChunk.title,
          source: subsidyChunk.source,
        },
      ],
      mode: "project-search",
    };
  }

  if (/\bwhat is scale\b|\bwhat's scale\b|\bdefine scale\b/.test(normalized)) {
    const overview =
      matches.find((chunk) => chunk.title.toLowerCase().includes("scale product overview")) ?? top;
    return {
      answer: "Scale is RTD's end-to-end AI sales and marketing system: ads, CRM automation, AI qualification, and booked-appointment flow in one structured service.",
      sources: [
        {
          title: overview.title,
          source: overview.source,
        },
      ],
      mode: "project-search",
    };
  }

  if (normalized.includes("action items") && (normalized.includes("chris") || normalized.includes("client"))) {
    const actionChunk =
      matches.find((chunk) => chunk.kind === "working-plan") ??
      matches.find((chunk) => chunk.title.toLowerCase().includes("meeting 2 summary")) ??
      top;
    const text = actionChunk.text.toLowerCase();
    const concise =
      text.includes("benchmark")
        ? "Chris's action items are to provide benchmark examples or screenshots, confirm offer language, lock ideal client filters, and identify proof assets or testimonials."
        : cleanAnswer(actionChunk.text, true);

    return {
      answer: concise,
      sources: [
        {
          title: actionChunk.title,
          source: actionChunk.source,
        },
      ],
      mode: "project-search",
    };
  }

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

  const meetingRequest = detectMeetingRequest(question);
  if (meetingRequest?.number !== undefined && meetingRequest.wantsSummary) {
    const summaryChunk =
      matches.find(
        (chunk) => chunk.session === meetingRequest.number && chunk.kind === "meeting-summary"
      ) ??
      matches.find((chunk) => chunk.session === meetingRequest.number) ??
      top;
    return {
      answer: cleanAnswer(summaryChunk.text, true),
      sources: [
        {
          title: summaryChunk.title,
          source: summaryChunk.source,
        },
      ],
      mode: "project-search",
    };
  }

  return null;
}

function fallbackAnswer(question: string, snapshot: KnowledgeSnapshot) {
  const matches = retrieveContext(question, snapshot) as RetrievedChunk[];
  const meetingRequest = detectMeetingRequest(question);
  const contractRequest = detectContractRequest(question);
  const relevantSources = retrieveRelevantSources(question, snapshot);
  const latestMeetingRequest = meetingRequest?.latest;
  const terse = isShortQuestion(question) || isDirectQuestion(question);
  if (meetingRequest?.number !== undefined && matches.length === 0) {
    return {
      answer: `I do not have a confirmed indexed source for meeting ${meetingRequest.number} yet.`,
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
          ? "I found contract files, but I do not yet have searchable contract text for that exact pricing answer."
          : "I do not have indexed contract or pricing material for that question yet.",
        sources: contractSources.map((source) => ({ title: source.title, source: source.source })),
        mode: "project-search",
      };
    }

    if (contractRequest.asksAboutFinancials) {
      return {
        answer: cleanAnswer(primary.text, true),
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
        answer: "I found relevant files, but they are not currently indexed as searchable text yet.",
        sources: unavailable.map((source) => ({
          title: source.title,
          source: source.source,
        })),
        mode: "project-search",
      };
    }
  }
  const direct = directAnswer(question, matches);
  if (direct) return direct;
  if (meetingRequest?.number !== undefined && meetingRequest.wantsSummary && matches.length) {
    const summaryChunk =
      matches.find((chunk) => chunk.session === meetingRequest.number && chunk.kind === "meeting-summary") ??
      matches.find((chunk) => chunk.session === meetingRequest.number) ??
      matches[0];
    return {
      answer: cleanAnswer(summaryChunk.text, true),
      sources: matches.map((chunk) => ({
        title: chunk.title,
        source: chunk.source,
      })),
      mode: "project-search",
    };
  }
  if (latestMeetingRequest && matches.length) {
    const summaryChunk =
      matches.find((chunk) => chunk.kind === "meeting-summary") ?? matches[0];
    return {
      answer: cleanAnswer(summaryChunk.text, terse),
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

  if (!summary) {
    return {
      answer: "I do not have a strong enough indexed match for that yet.",
      sources: relevantSources.map((source) => ({
        title: source.title,
        source: source.source,
      })),
      mode: "project-search",
    };
  }

  return {
    answer: cleanAnswer(summary, terse),
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
  const terse = isShortQuestion(question) || isDirectQuestion(question);
  const direct = directAnswer(question, matches);
  if (direct) return direct;
  if (meetingRequest?.number !== undefined && meetingRequest.wantsSummary && matches.length) {
    const summaryChunk =
      matches.find((chunk) => chunk.session === meetingRequest.number && chunk.kind === "meeting-summary") ??
      matches.find((chunk) => chunk.session === meetingRequest.number) ??
      matches[0];
    return {
      answer: cleanAnswer(summaryChunk.text, true),
      sources: matches.map((chunk) => ({
        title: chunk.title,
        source: chunk.source,
      })),
      mode: "project-search",
    };
  }
  if (meetingRequest?.latest && matches.length) {
    const summaryChunk =
      matches.find((chunk) => chunk.kind === "meeting-summary") ?? matches[0];
    return {
      answer: cleanAnswer(summaryChunk.text, terse),
      sources: matches.map((chunk) => ({
        title: chunk.title,
        source: chunk.source,
      })),
      mode: "project-search",
    };
  }
  const context = buildContext(matches, terse);

  if (!context) {
    return fallbackAnswer(question, snapshot);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      max_output_tokens: terse ? 140 : 320,
      input: [
        {
          role: "system",
          content:
            terse
              ? "You are the AI project brain for the Strategize / Chris McBreen client dashboard. Answer only from the supplied project context unless clearly labelling a recommendation as an inference. Give the exact answer first. Keep it to one or two short sentences. Do not restate the question. Do not add background unless it is essential. Do not list multiple document summaries. If the context is insufficient, say that plainly."
              : "You are the AI project brain for the Strategize / Chris McBreen client dashboard. Answer only from the supplied project context unless clearly labelling a recommendation as an inference. Answer the current user question directly, using the fewest words needed. Do not repeat previous answers. Do not quote raw chunk labels like 'Part 3' unless the user asks for sources. If the context is insufficient, say so plainly instead of guessing. For factual follow-ups, lead with the exact answer in one or two sentences, then add at most three short bullets if helpful.",
        },
        {
          role: "user",
          content: terse
            ? `Project context:\n${context}\n\nQuestion: ${question}`
            : `Project context:\n${context}\n\nRecent chat:\n${messages
                .slice(-4)
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
    answer: cleanAnswer(payload.output_text ?? fallbackAnswer(question, snapshot).answer, terse),
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
