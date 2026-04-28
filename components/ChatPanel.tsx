"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/cn";
import type { ChatMessage, ChatRequest, ChatResponse } from "@/lib/advisory-types";

const MD_COMPONENTS: Components = {
  p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
  h1: ({ children }) => <h3 className="text-[12px] font-semibold text-primary mt-1 mb-1">{children}</h3>,
  h2: ({ children }) => <h3 className="text-[12px] font-semibold text-primary mt-1 mb-1">{children}</h3>,
  h3: ({ children }) => <h4 className="text-[11px] font-semibold text-primary mt-1 mb-0.5">{children}</h4>,
  h4: ({ children }) => <h4 className="text-[11px] font-semibold text-primary mt-1 mb-0.5">{children}</h4>,
  ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5 mb-1.5 last:mb-0 marker:text-muted">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5 mb-1.5 last:mb-0 marker:text-muted">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
  em: ({ children }) => <em className="italic text-secondary">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-sky-300 underline underline-offset-2 hover:text-sky-200">
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) return <code className={className}>{children}</code>;
    return <code className="rounded bg-surface-elev px-1 py-[1px] font-mono text-[10px] text-sky-200">{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="my-1.5 rounded bg-background/80 p-2 overflow-x-auto font-mono text-[10px] text-secondary">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-white/10 pl-2 my-1.5 text-tertiary italic">{children}</blockquote>
  ),
  hr: () => <hr className="my-2 border-white/10" />,
  table: ({ children }) => (
    <div className="my-1.5 overflow-x-auto">
      <table className="text-[10px] border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-white/10 px-1.5 py-0.5 text-left font-semibold text-primary">{children}</th>,
  td: ({ children }) => <td className="border border-white/10 px-1.5 py-0.5 text-secondary">{children}</td>,
};

const SUGGESTED_PROMPTS = [
  "What's the market regime right now?",
  "What trades are the engines suggesting?",
  "Give me my morning briefing",
  "Should I be worried about anything?",
  "What's ATHENA seeing in volatility?",
  "How are my positions doing?",
  "Summarize the agent activity",
  "What happened today?",
];

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    const history = messages.map(({ role, content }) => ({ role, content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history } satisfies ChatRequest),
      });
      const data = await res.json() as ChatResponse;

      if (!data.ok) {
        setError(data.error ?? "Unknown error");
      } else {
        const aiMsg: ChatMessage = { role: "assistant", content: data.reply, timestamp: Date.now() };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading, messages]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {isEmpty && (
          <div className="pt-4">
            <p className="text-[10px] text-muted text-center mb-3">
              Ask anything about market conditions, positions, or trade suggestions
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => void send(p)}
                  className="text-[9px] rounded-full border border-white/10 px-2.5 py-1 text-tertiary hover:text-secondary hover:border-white/20 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.timestamp}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-[11px] leading-relaxed",
                  msg.role === "user"
                    ? "bg-sky-500/15 text-sky-100 rounded-br-sm"
                    : "bg-surface shadow-glass-inset text-secondary rounded-bl-sm"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
                <p className="text-[8px] text-muted mt-1 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-surface rounded-lg rounded-bl-sm px-3 py-2 shadow-glass-inset">
              <div className="flex gap-1 items-center h-4">
                {[0, 0.15, 0.3].map((delay) => (
                  <motion.span
                    key={delay}
                    className="w-1 h-1 rounded-full bg-sky-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="text-[10px] text-red-400 text-center py-1">{error}</div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <div className="flex items-end gap-2 pt-2 border-t border-white/5">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about regime, positions, suggestions…"
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-lg bg-surface px-3 py-2 text-[11px] text-primary placeholder-muted",
            "shadow-glass-inset border border-white/5 focus:outline-none focus:border-sky-500/30",
            "max-h-24 overflow-y-auto"
          )}
          style={{ lineHeight: "1.5" }}
        />
        <button
          onClick={() => void send(input)}
          disabled={!input.trim() || loading}
          className={cn(
            "flex-shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors",
            input.trim() && !loading
              ? "bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30"
              : "bg-surface text-muted border border-white/5 cursor-not-allowed"
          )}
        >
          Send
        </button>
      </div>
    </div>
  );
}
