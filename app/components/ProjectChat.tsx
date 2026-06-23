"use client";

import { FormEvent, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; source: string }[];
};

const starterQuestions = [
  "What is the strongest offer direction?",
  "What are Chris's action items?",
  "Explain the lead to booked consult system.",
  "What did Chris say about subsidies and grants?",
];

export function ProjectChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask me anything about the Strategize / McBreen pilot: offer, system map, working plan, campaign angles, qualification, or next actions.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function askProjectBrain(nextQuestion: string) {
    const trimmed = nextQuestion.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setQuestion("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/project-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      const payload = (await response.json()) as {
        answer?: string;
        sources?: { title: string; source: string }[];
        error?: string;
      };

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: payload.answer ?? payload.error ?? "I could not answer that yet.",
          sources: payload.sources,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I could not reach the project brain. Try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askProjectBrain(question);
  }

  return (
    <section className="project-chat section-band" id="project-chat">
      <div className="section-title chat-title">
        <div>
          <p>AI Project Chat</p>
          <h2>Ask the project brain.</h2>
        </div>
        <span>Seeded with the current meeting, offer, system, and working-plan context.</span>
      </div>

      <div className="chat-shell">
        <div className="chat-messages" aria-live="polite">
          {messages.map((message, index) => (
            <article className={`chat-message chat-${message.role}`} key={`${message.role}-${index}`}>
              <p>{message.content}</p>
              {message.sources?.length ? (
                <div className="chat-sources">
                  {message.sources.slice(0, 3).map((source) => (
                    <span key={`${source.title}-${source.source}`}>
                      {source.title}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
          {isLoading ? (
            <article className="chat-message chat-assistant">
              <p>Thinking through the project notes...</p>
            </article>
          ) : null}
        </div>

        <div className="starter-questions" aria-label="Suggested project questions">
          {starterQuestions.map((starter) => (
            <button
              disabled={isLoading}
              key={starter}
              onClick={() => void askProjectBrain(starter)}
              type="button"
            >
              {starter}
            </button>
          ))}
        </div>

        <form className="chat-form" onSubmit={submitQuestion}>
          <input
            aria-label="Ask the project brain"
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about the offer, contract, system, CRM, next steps..."
            type="text"
            value={question}
          />
          <button disabled={isLoading || !question.trim()} type="submit">
            Ask
          </button>
        </form>
      </div>
    </section>
  );
}

