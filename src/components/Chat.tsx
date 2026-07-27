"use client";

import { useState, useRef, useEffect, FormEvent } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  responseTimeMs?: number;
}

interface SessionStats {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalResponses: number;
}

const STORAGE_KEY = "groq-chat-messages";

function loadMessages(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMessages(msgs: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch {
    // silently ignore storage errors
  }
}

function computeStats(msgs: Message[]): SessionStats {
  const stats: SessionStats = {
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
    totalResponses: 0,
  };
  for (const m of msgs) {
    if (m.role === "assistant" && m.usage) {
      stats.totalPromptTokens += m.usage.prompt_tokens;
      stats.totalCompletionTokens += m.usage.completion_tokens;
      stats.totalTokens += m.usage.total_tokens;
      stats.totalResponses += 1;
    }
  }
  return stats;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    setMessages(loadMessages());
    setInitialized(true);
  }, []);

  // Save messages to localStorage on every change
  useEffect(() => {
    if (initialized) {
      saveMessages(messages);
    }
  }, [messages, initialized]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stats = computeStats(messages);
  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ Error: ${data.error}` },
        ]);
      } else {
        const assistantMsg: Message = {
          role: "assistant",
          content: data.reply,
          model: data.model,
          usage: data.usage,
          responseTimeMs: data.responseTimeMs,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ No se pudo conectar con el servidor.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  function handleClear() {
    if (confirm("¿Borrar todo el historial de la sesión?")) {
      setMessages([]);
    }
  }

  return (
    <>
      <div className="chat-area">
        {messages.length === 0 && (
          <div className="welcome">
            <h2>🤖 Groq Chat</h2>
            <p>Escribí un mensaje para empezar a chatear con la IA.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
            {msg.role === "assistant" && msg.usage && (
              <div className="message-meta">
                {msg.model} · {msg.responseTimeMs}ms · {msg.usage.total_tokens} tokens
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="message assistant">Pensando...</div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Panel de métricas */}
      {stats.totalResponses > 0 && (
        <div className="stats-panel">
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-label">Modelo</span>
              <span className="stat-value">{lastAssistant?.model ?? "—"}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Respuestas</span>
              <span className="stat-value">{stats.totalResponses}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Prompt tokens</span>
              <span className="stat-value">{stats.totalPromptTokens.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Completion tokens</span>
              <span className="stat-value">{stats.totalCompletionTokens.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Total tokens</span>
              <span className="stat-value">{stats.totalTokens.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Último tiempo</span>
              <span className="stat-value">{lastAssistant?.responseTimeMs ?? "—"}ms</span>
            </div>
          </div>
          <button className="clear-btn" onClick={handleClear}>🗑 Limpiar sesión</button>
        </div>
      )}

      <div className="input-area">
        <form className="input-wrapper" onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí tu mensaje..."
            rows={1}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Enviar
          </button>
        </form>
      </div>
    </>
  );
}
