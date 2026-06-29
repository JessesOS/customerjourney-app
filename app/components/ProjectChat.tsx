"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; source: string }[];
};

type KnowledgeStatus = {
  syncedAt: string;
  syncMode: string;
  provider: string;
  lastSyncMessage: string;
  indexedSourceCount: number;
  unsupportedSourceCount: number;
  failedSourceCount: number;
  chunkCount: number;
};

const starterQuestions = [
  "What is the strongest offer direction?",
  "What are Chris's action items?",
  "Explain the lead to booked consult system.",
  "What did Chris say about subsidies and grants?",
];

export function ProjectChat() {
  const [isOpen, setIsOpen] = useState(false);
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [knowledgeStatus, setKnowledgeStatus] = useState<KnowledgeStatus | null>(null);
  const usingLiveDrive = knowledgeStatus?.provider === "google-drive";

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleOpen() {
      setIsOpen(true);
    }

    window.addEventListener("open-project-chat", handleOpen);
    return () => {
      window.removeEventListener("open-project-chat", handleOpen);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const response = await fetch("/api/knowledge-status");
        const payload = (await response.json()) as KnowledgeStatus;
        if (!cancelled) setKnowledgeStatus(payload);
      } catch {
        if (!cancelled) setKnowledgeStatus(null);
      }
    }

    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshKnowledgeLibrary() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/knowledge-sync", { method: "POST" });
      const payload = (await response.json()) as
        | (KnowledgeStatus & { ok?: boolean })
        | { error?: string };

      if ("error" in payload && payload.error) {
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: `Knowledge sync failed: ${payload.error}`,
          },
        ]);
        return;
      }

      const statusResponse = await fetch("/api/knowledge-status");
      const statusPayload = (await statusResponse.json()) as KnowledgeStatus;
      setKnowledgeStatus(statusPayload);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `Library refreshed. ${statusPayload.lastSyncMessage}`,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I could not refresh the knowledge library just now.",
        },
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }

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
    setIsOpen(true);
    void askProjectBrain(question);
  }

  return (
    <aside
      aria-label="AI project chat"
      className={`project-chat ${isOpen ? "chat-open" : ""}`}
      id="project-chat"
    >
      <div className="chat-launcher" hidden={isOpen}>
        <button
          aria-expanded={isOpen}
          className="chat-launcher-copy"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <span className="chat-launcher-dot-wrap" aria-hidden="true">
            <span className="chat-launcher-dot" />
          </span>
          <strong>Ask the project brain</strong>
        </button>
      </div>

      <div className="chat-shell" hidden={!isOpen}>
        <div className="chat-panel-header">
          <div>
            <p>AI Project Chat</p>
            <h2>Ask the project brain.</h2>
            <span>
              Ask across meetings, summaries, system docs, contracts, and the working plan.
            </span>
            {knowledgeStatus ? (
              <div className="chat-knowledge-status">
                <strong>
                  {knowledgeStatus.indexedSourceCount} indexed docs / {knowledgeStatus.chunkCount} chunks
                </strong>
                <span>
                  {knowledgeStatus.unsupportedSourceCount} not searchable • {knowledgeStatus.failedSourceCount} failed • synced {knowledgeStatus.syncedAt}
                </span>
                {!usingLiveDrive ? (
                  <span className="chat-sync-warning">{knowledgeStatus.lastSyncMessage}</span>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="chat-header-actions">
            <button
              aria-label="Refresh project knowledge library"
              className="chat-refresh-button"
              disabled={isRefreshing}
              onClick={() => void refreshKnowledgeLibrary()}
              type="button"
            >
              {isRefreshing ? "Refreshing..." : "Refresh Library"}
            </button>
            <button
              className="chat-close-button"
              aria-label="Close AI project chat"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>
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
