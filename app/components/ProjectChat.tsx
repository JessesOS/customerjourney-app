"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

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
  const [isOpen, setIsOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask me anything about the Strategize / McBreen pilot: offer, system map, working plan, campaign angles, qualification, or next actions.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

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
    <aside
      aria-label="AI project chat"
      className={`project-chat ${isOpen ? "chat-open" : ""}`}
      id="project-chat"
    >
      <button
        aria-expanded={isOpen}
        className="chat-launcher"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="chat-launcher-kicker">AI Project Chat</span>
        <strong>Ask AI anything about this project, system, offer, contract, etc.</strong>
        <small>Seeded with the meeting, offer, system map, and working plan.</small>
      </button>

      <div className="chat-shell" hidden={!isOpen}>
        <div className="chat-panel-header">
          <div>
            <p>AI Project Chat</p>
            <h2>Ask the project brain.</h2>
            <span>
              Seeded with the current meeting, offer, system, and working-plan context.
            </span>
          </div>
          <button
            aria-label="Close AI project chat"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            ×
          </button>
        </div>

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
            ref={inputRef}
            type="text"
            value={question}
          />
          <button disabled={isLoading || !question.trim()} type="submit">
            Ask
          </button>
        </form>
      </div>
    </aside>
  );
}
