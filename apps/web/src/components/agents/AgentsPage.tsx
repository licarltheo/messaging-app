import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Plus, MessageSquare, Settings2, Trash2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const API = import.meta.env.VITE_API_URL || "http://localhost:8787";

type Agent = {
  id: string;
  name: string;
  description: string;
  avatar: string;
  personality: string;
  systemPrompt: string;
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  messageCount: number;
  version: number;
};

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [mode, setMode] = useState<"list" | "edit" | "chat">("list");
  const [form, setForm] = useState({
    name: "",
    description: "",
    avatar: "🤖",
    personality: "Helpful and professional",
    systemPrompt: "You are a helpful AI assistant.",
    provider: "openai",
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 4096,
  });
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<{ role: string; content: string }[]>([]);
  const [streaming, setStreaming] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`${API}/api/v1/agents`);
    const data = await res.json();
    setAgents(data.agents ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    const res = await fetch(`${API}/api/v1/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const a = await res.json();
    await load();
    setSelected(a);
    setMode("edit");
  };

  const save = async () => {
    if (!selected) return;
    await fetch(`${API}/api/v1/agents/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    await load();
  };

  const remove = async (id: string) => {
    await fetch(`${API}/api/v1/agents/${id}`, { method: "DELETE" });
    setSelected(null);
    setMode("list");
    await load();
  };

  const openEdit = (a: Agent) => {
    setSelected(a);
    setForm({
      name: a.name,
      description: a.description,
      avatar: a.avatar,
      personality: a.personality,
      systemPrompt: a.systemPrompt,
      provider: a.provider,
      model: a.model,
      temperature: a.temperature,
      maxTokens: a.maxTokens,
    });
    setMode("edit");
  };

  const openChat = (a: Agent) => {
    setSelected(a);
    setChatMsgs([]);
    setMode("chat");
  };

  const sendChat = async () => {
    if (!selected || !chatInput.trim() || streaming) return;
    const userMsg = { role: "user", content: chatInput.trim() };
    const history = [...chatMsgs, userMsg];
    setChatMsgs(history);
    setChatInput("");
    setStreaming(true);
    setChatMsgs((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${API}/api/v1/agents/${selected.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, stream: true }),
      });
      if (!res.body) throw new Error("No body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              acc += delta;
              setChatMsgs((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {
            /* skip */
          }
        }
      }
    } catch (e) {
      setChatMsgs((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: e instanceof Error ? e.message : "Error",
        };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  if (mode === "chat" && selected) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        <div className="mb-4 flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={() => setMode("list")}>
            ← Back
          </Button>
          <span className="text-2xl">{selected.avatar}</span>
          <div>
            <p className="font-semibold">{selected.name}</p>
            <p className="text-xs text-muted-foreground">{selected.model}</p>
          </div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-white/5 bg-black/20 p-4">
          {chatMsgs.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                  m.role === "user" ? "bg-primary text-white" : "bg-white/5 border border-white/5"
                )}
              >
                {m.role === "assistant" ? (
                  <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="Message agent…"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
            disabled={streaming}
          />
          <Button variant="gradient" onClick={sendChat} disabled={streaming || !chatInput.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={() => setMode("list")}>
            ← Back
          </Button>
          <h2 className="text-lg font-semibold">{selected ? "Edit Agent" : "New Agent"}</h2>
        </div>
        <div className="glass-card space-y-3 p-6">
          {[
            ["name", "Name"],
            ["avatar", "Avatar (emoji)"],
            ["description", "Description"],
            ["personality", "Personality"],
            ["provider", "Provider"],
            ["model", "Model"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
              <input
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">System Prompt</label>
            <textarea
              value={form.systemPrompt}
              onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
              rows={6}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm outline-none"
            />
          </div>
          <div className="flex gap-2">
            <label className="text-xs text-muted-foreground">Temp {form.temperature}</label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={form.temperature}
              onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
              className="flex-1"
            />
          </div>
          <div className="flex gap-2">
            {selected ? (
              <Button variant="gradient" onClick={save}>
                Save
              </Button>
            ) : (
              <Button variant="gradient" onClick={create}>
                Create
              </Button>
            )}
            {selected && (
              <Button variant="outline" onClick={() => openChat(selected)}>
                <MessageSquare className="h-4 w-4" /> Chat
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">AI Agents</h2>
          <p className="text-sm text-muted-foreground">Specialized agents with memory and personality</p>
        </div>
        <Button
          variant="gradient"
          onClick={() => {
            setSelected(null);
            setForm({
              name: "",
              description: "",
              avatar: "🤖",
              personality: "Helpful and professional",
              systemPrompt: "You are a helpful AI assistant.",
              provider: "openai",
              model: "gpt-4o-mini",
              temperature: 0.7,
              maxTokens: 4096,
            });
            setMode("edit");
          }}
        >
          <Plus className="h-4 w-4" /> New Agent
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((a) => (
          <div key={a.id} className="glass-card p-5">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-3xl">{a.avatar}</span>
              <div className="flex gap-1">
                <button onClick={() => openChat(a)} className="rounded p-1.5 hover:bg-white/10">
                  <MessageSquare className="h-4 w-4" />
                </button>
                <button onClick={() => openEdit(a)} className="rounded p-1.5 hover:bg-white/10">
                  <Settings2 className="h-4 w-4" />
                </button>
                <button onClick={() => remove(a.id)} className="rounded p-1.5 text-red-400 hover:bg-white/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <h3 className="font-semibold">{a.name}</h3>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {a.description || a.personality}
            </p>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>
                {a.provider}/{a.model}
              </span>
              <span>·</span>
              <span>{a.messageCount} msgs</span>
              <span>·</span>
              <span>v{a.version}</span>
            </div>
          </div>
        ))}
        {agents.length === 0 && (
          <div className="col-span-full glass-card flex h-40 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Bot className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">No agents yet. Create your first one.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
