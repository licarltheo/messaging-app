import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useProvidersStore } from "@/stores/providers";
import {
  Send,
  Paperclip,
  Copy,
  RefreshCw,
  ChevronDown,
  Bot,
  User,
  StopCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  provider?: string;
  tokens?: number;
  latencyMs?: number;
  costUsd?: number | null;
  error?: string;
};

export function ChatInterface() {
  const { providers, activeProvider, activeModel, setActiveProvider, setActiveModel } =
    useProvidersStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const currentProvider = providers.find((p) => p.id === activeProvider);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || streaming) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };
    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setStreaming(true);

    const assistantId = crypto.randomUUID();
    setMessages((m) => [
      ...m,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        model: activeModel,
        provider: activeProvider,
      },
    ]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${API_URL}/api/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          provider: activeProvider,
          model: activeModel,
          stream: true,
          temperature: 0.7,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let meta: { latencyMs?: number; estimatedCostUsd?: number | null } = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;

          try {
            const json = JSON.parse(payload);
            if (json.error) throw new Error(json.error);
            if (json.object === "licarl.meta") {
              meta = { latencyMs: json.latencyMs, estimatedCostUsd: json.estimatedCostUsd };
              continue;
            }
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              acc += delta;
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: acc } : msg
                )
              );
            }
            if (json.usage) {
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, tokens: json.usage.total_tokens }
                    : msg
                )
              );
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: acc,
                latencyMs: meta.latencyMs,
                costUsd: meta.estimatedCostUsd,
              }
            : msg
        )
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // user stopped
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setMessages((m) =>
          m.map((x) =>
            x.id === assistantId
              ? { ...x, content: x.content || "", error: msg }
              : x
          )
        );
      }
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, messages, activeProvider, activeModel]);

  const stopStreaming = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const retryLast = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser || streaming) return;
    setMessages((m) => {
      const copy = [...m];
      if (copy[copy.length - 1]?.role === "assistant") copy.pop();
      return copy;
    });
    setInput(lastUser.content);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowModelPicker(!showModelPicker)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            <span className="font-medium">{currentProvider?.name}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{activeModel}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          {showModelPicker && (
            <div className="absolute left-0 top-full z-50 mt-2 max-h-80 w-80 overflow-y-auto rounded-xl border border-white/10 bg-[#0c0c0e] p-2 shadow-2xl">
              {providers.map((p) => (
                <div key={p.id} className="mb-1">
                  <button
                    onClick={() => setActiveProvider(p.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm",
                      activeProvider === p.id ? "bg-primary/15 text-primary" : "hover:bg-white/5"
                    )}
                  >
                    <span>{p.name}</span>
                    {p.connected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                  {activeProvider === p.id && (
                    <div className="ml-3 space-y-0.5 border-l border-white/5 pl-2">
                      {p.models.map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            setActiveModel(m);
                            setShowModelPicker(false);
                          }}
                          className={cn(
                            "block w-full rounded px-2 py-1 text-left text-xs",
                            activeModel === m
                              ? "text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={() => setMessages([])} disabled={messages.length === 0}>
          Clear
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-white/5 bg-black/20 p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <Bot className="mb-3 h-10 w-10 opacity-40" />
            <p className="font-medium text-foreground">Start a conversation</p>
            <p className="mt-1 max-w-sm text-sm">
              Real streaming from OpenAI, Claude, Gemini, Grok, DeepSeek, Mistral, Groq, Together, OpenRouter, Cohere, Ollama.
              Add API keys in Settings.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            {msg.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-primary text-white"
                  : "bg-white/5 border border-white/5"
              )}
            >
              {msg.error && (
                <p className="mb-2 text-xs text-red-400">{msg.error}</p>
              )}
              {msg.role === "assistant" ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content || (streaming ? "…" : "")}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
              {msg.role === "assistant" && msg.content && (
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/5 pt-2 text-[10px] text-muted-foreground">
                  {msg.latencyMs != null && <span>{msg.latencyMs}ms</span>}
                  {msg.tokens != null && <span>{msg.tokens} tok</span>}
                  {msg.costUsd != null && <span>${msg.costUsd.toFixed(5)}</span>}
                  <div className="flex-1" />
                  <button
                    className="rounded p-1 hover:bg-white/5 hover:text-foreground"
                    onClick={() => navigator.clipboard.writeText(msg.content)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="rounded p-1 hover:bg-white/5 hover:text-foreground"
                    onClick={retryLast}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/20">
                <User className="h-4 w-4 text-secondary" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="icon" variant="outline" className="shrink-0" disabled>
          <Paperclip className="h-4 w-4" />
        </Button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
          placeholder={`Message ${activeModel}…`}
          disabled={streaming}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-primary/40 disabled:opacity-50"
        />
        {streaming ? (
          <Button variant="outline" onClick={stopStreaming}>
            <StopCircle className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="gradient" onClick={sendMessage} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
