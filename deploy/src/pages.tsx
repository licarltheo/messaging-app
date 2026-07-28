import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, MessageSquare, Bot, Workflow, Store, FolderOpen,
  Zap, Shield, ArrowRight, Plus, Send, Play, Star, Download, Bell, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const API = import.meta.env.VITE_API_URL || "https://licarl-api.vercel.app";

export function Dashboard({ onNavigate }: { onNavigate: (id: string) => void }) {
  const cards = [
    { label: "AI Chat", id: "chat", icon: MessageSquare, desc: "Multi-provider streaming" },
    { label: "Agents", id: "agents", icon: Bot, desc: "Specialized AI agents" },
    { label: "Workflows", id: "workflows", icon: Workflow, desc: "Visual pipelines" },
    { label: "Marketplace", id: "marketplace", icon: Store, desc: "Community prompts" },
    { label: "Knowledge", id: "files", icon: FolderOpen, desc: "Document base" },
    { label: "Analytics", id: "analytics", icon: Star, desc: "Usage and costs" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Prompts", "Agents", "Workflows", "Providers"].map((label) => (
          <div key={label} className="glass-card p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">—</p></div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <button key={c.id} onClick={() => onNavigate(c.id)} className="glass-card p-5 text-left transition hover:border-primary/30">
            <c.icon className="mb-3 h-6 w-6 text-primary" />
            <p className="font-semibold">{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatPage() {
  const [msgs, setMsgs] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const send = async () => {
    if (!input.trim() || streaming) return;
    const userMsg = { role: "user", content: input.trim() };
    const history = [...msgs, userMsg];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    try {
      const res = await fetch(API + "/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, provider, model, stream: true }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "", acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const p = line.slice(5).trim();
          if (p === "[DONE]") continue;
          try {
            const j = JSON.parse(p);
            const d = j.choices?.[0]?.delta?.content || "";
            if (d) {
              acc += d;
              setMsgs((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: acc }; return c; });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setMsgs((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: e.message || "Error" }; return c; });
    } finally { setStreaming(false); }
  };
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <select value={provider} onChange={(e) => setProvider(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
          {["openai","anthropic","gemini","xai","deepseek","mistral","groq","openrouter"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <input value={model} onChange={(e) => setModel(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm" />
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-white/5 bg-black/20 p-4">
        {msgs.length === 0 && <p className="text-center text-sm text-muted-foreground">Start a conversation. Add API keys in Settings for live models.</p>}
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[75%] rounded-2xl px-4 py-2 text-sm", m.role === "user" ? "bg-primary text-white" : "border border-white/5 bg-white/5")}>
              {m.role === "assistant" ? <ReactMarkdown>{m.content || "..."}</ReactMarkdown> : m.content}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()} placeholder="Message..." className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none" disabled={streaming} />
        <Button variant="gradient" onClick={send} disabled={streaming || !input.trim()}><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

export function PromptsPage() {
  const [content, setContent] = useState("You are a helpful assistant.\n\nTask: {{task}}");
  const [name, setName] = useState("Untitled prompt");
  const save = async () => {
    await fetch(API + "/api/v1/prompts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: name, content }) });
    alert("Saved");
  };
  return (
    <div className="space-y-4">
      <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold outline-none" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={16} className="w-full rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-sm outline-none" />
      <Button variant="gradient" onClick={save}>Save Prompt</Button>
    </div>
  );
}

export function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [name, setName] = useState("");
  const load = useCallback(async () => {
    const r = await fetch(API + "/api/v1/agents");
    setAgents((await r.json()).agents || []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const create = async () => {
    if (!name.trim()) return;
    await fetch(API + "/api/v1/agents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, systemPrompt: "You are " + name }) });
    setName(""); load();
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent name" className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
        <Button variant="gradient" onClick={create}><Plus className="h-4 w-4" /> Create</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((a) => (
          <div key={a.id} className="glass-card p-4">
            <span className="text-2xl">{a.avatar || "🤖"}</span>
            <p className="mt-2 font-semibold">{a.name}</p>
            <p className="text-xs text-muted-foreground">{a.provider}/{a.model}</p>
          </div>
        ))}
        {agents.length === 0 && <p className="col-span-full text-sm text-muted-foreground">No agents yet</p>}
      </div>
    </div>
  );
}

export function WorkflowsPage() {
  const [wfs, setWfs] = useState<any[]>([]);
  const load = useCallback(async () => {
    const r = await fetch(API + "/api/v1/workflows");
    setWfs((await r.json()).workflows || []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const create = async () => {
    await fetch(API + "/api/v1/workflows", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "New Workflow" }) });
    load();
  };
  const run = async (id: string) => {
    const r = await fetch(API + "/api/v1/workflows/" + id + "/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: "Hello" }) });
    alert(JSON.stringify(await r.json(), null, 2));
  };
  return (
    <div className="space-y-4">
      <Button variant="gradient" onClick={create}><Plus className="h-4 w-4" /> New Workflow</Button>
      <div className="grid gap-3 sm:grid-cols-2">
        {wfs.map((w) => (
          <div key={w.id} className="glass-card p-4">
            <p className="font-semibold">{w.name}</p>
            <p className="text-xs text-muted-foreground">{(w.nodes?.length || 0)} nodes · {(w.runCount || 0)} runs</p>
            <Button size="sm" className="mt-2" variant="outline" onClick={() => run(w.id)}><Play className="h-3.5 w-3.5" /> Run</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetch(API + "/api/v1/marketplace").then((r) => r.json()).then((d) => setItems(d.prompts || []));
  }, []);
  const install = async (id: string) => {
    await fetch(API + "/api/v1/marketplace/" + id + "/install", { method: "POST" });
    alert("Installed");
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <div key={p.id} className="glass-card p-5">
          <h3 className="font-semibold">{p.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Star className="h-3 w-3 text-amber-400" /> {p.rating} · <Download className="h-3 w-3" /> {p.installs}
          </div>
          <Button size="sm" className="mt-3" variant="gradient" onClick={() => install(p.id)}>Install</Button>
        </div>
      ))}
    </div>
  );
}

export function TesterPage() {
  const [prompt, setPrompt] = useState("Explain quantum computing simply.");
  const [results, setResults] = useState<any[]>([]);
  const run = async () => {
    const r = await fetch(API + "/api/v1/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, providers: ["openai", "anthropic", "gemini"] }) });
    setResults((await r.json()).results || []);
  };
  return (
    <div className="space-y-4">
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none" />
      <Button variant="gradient" onClick={run}>Run multi-provider test</Button>
      <div className="grid gap-3 md:grid-cols-3">
        {results.map((r, i) => (
          <div key={i} className="glass-card p-4 text-sm">
            <p className="font-semibold text-primary">{r.provider}</p>
            <p className="mt-1 text-xs text-muted-foreground">{r.latencyMs}ms · {r.tokens} tokens</p>
            <p className="mt-2">{r.response}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FilesPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const load = useCallback(async () => {
    const r = await fetch(API + "/api/v1/files");
    setFiles((await r.json()).files || []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const upload = async () => {
    if (!name.trim() || !content.trim()) return;
    await fetch(API + "/api/v1/files", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, content }) });
    setName(""); setContent(""); load();
  };
  return (
    <div className="space-y-4">
      <div className="glass-card space-y-2 p-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Filename" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} placeholder="Content" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
        <Button variant="gradient" onClick={upload}><Upload className="h-4 w-4" /> Upload</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {files.map((f) => (
          <div key={f.id} className="glass-card p-4">
            <p className="font-medium">{f.name}</p>
            <p className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch(API + "/api/v1/analytics").then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: "Events", value: data?.totalEvents ?? 0 },
        { label: "Tokens", value: data?.tokens ?? 0 },
        { label: "Est. Cost", value: "$" + ((data?.cost ?? 0).toFixed(4)) },
        { label: "Types", value: Object.keys(data?.byType || {}).length },
      ].map((s) => (
        <div key={s.label} className="glass-card p-5">
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className="mt-1 text-2xl font-semibold">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

export function OrgsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [name, setName] = useState("");
  const load = useCallback(async () => {
    const r = await fetch(API + "/api/v1/orgs");
    setOrgs((await r.json()).organizations || []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const create = async () => {
    if (!name.trim()) return;
    await fetch(API + "/api/v1/orgs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setName(""); load();
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Organization name" className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
        <Button variant="gradient" onClick={create}>Create</Button>
      </div>
      {orgs.map((o) => (
        <div key={o.id} className="glass-card p-4">
          <p className="font-semibold">{o.name}</p>
          <p className="text-xs text-muted-foreground">{o.plan} · {o.members?.length} members</p>
        </div>
      ))}
    </div>
  );
}

export function SettingsPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const load = useCallback(async () => {
    const r = await fetch(API + "/api/v1/keys");
    setKeys((await r.json()).keys || []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const add = async () => {
    if (!apiKey.trim()) return;
    await fetch(API + "/api/v1/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, apiKey }) });
    setApiKey(""); load();
  };
  const test = async (p: string) => {
    const r = await fetch(API + "/api/v1/keys/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: p }) });
    const d = await r.json();
    alert(d.ok ? "OK (" + d.latencyMs + "ms)" : d.error);
  };
  return (
    <div className="max-w-xl space-y-4">
      <p className="text-sm text-muted-foreground">API keys are encrypted server-side and never exposed to the browser.</p>
      <div className="glass-card space-y-3 p-4">
        <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
          {["openai","anthropic","gemini","xai","deepseek","mistral","groq","together","openrouter","cohere","ollama","azure"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API key" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
        <Button variant="gradient" onClick={add}>Add key</Button>
      </div>
      {keys.map((k) => (
        <div key={k.id} className="glass-card flex items-center justify-between p-4">
          <div>
            <p className="font-medium">{k.provider}</p>
            <p className="text-xs text-muted-foreground">{k.keyPreview}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => test(k.provider)}>Test</Button>
        </div>
      ))}
    </div>
  );
}

export function NotifBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    fetch(API + "/api/v1/analytics/notifications").then((r) => r.json()).then((d) => {
      setItems(d.notifications || []);
      setUnread(d.unread || 0);
    }).catch(() => {});
  }, []);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative rounded-lg p-2 text-muted-foreground hover:bg-white/5">
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-white/10 bg-[#0c0c0e] shadow-2xl">
          <div className="border-b border-white/5 px-4 py-3 text-sm font-semibold">Notifications</div>
          {items.map((n) => (
            <div key={n.id} className="border-b border-white/5 px-4 py-3">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Landing({ onGetStarted, onLogin }: { onGetStarted: () => void; onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#050507]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary"><Sparkles className="h-4 w-4" /></div>
            <span className="font-semibold">Licarl</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onLogin}>Log in</Button>
            <Button variant="gradient" onClick={onGetStarted}>Get Started</Button>
          </div>
        </div>
      </nav>
      <section className="relative overflow-hidden pb-24 pt-32">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-accent" /> The Complete AI Workspace
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Every model.<br /><span className="text-gradient">Every prompt.</span><br />One workspace.
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Agents, workflows, marketplace, knowledge base, and multi-provider chat — built for teams and enterprises.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" variant="gradient" onClick={onGetStarted} className="gap-2">Launch App <ArrowRight className="h-4 w-4" /></Button>
              <Button size="lg" variant="outline" onClick={onLogin}>Log in</Button>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: MessageSquare, title: "Multi-Provider Chat", desc: "OpenAI, Claude, Gemini, Grok, and more." },
            { icon: Bot, title: "AI Agents", desc: "Personality, memory, tools, knowledge files." },
            { icon: Workflow, title: "Visual Workflows", desc: "Drag-and-drop multi-step AI pipelines." },
            { icon: Store, title: "Marketplace", desc: "Publish, install, rate community prompts." },
            { icon: FolderOpen, title: "Knowledge Base", desc: "Upload docs for RAG-style agents." },
            { icon: Shield, title: "Enterprise", desc: "Orgs, roles, audit logs, encrypted keys." },
          ].map((f) => (
            <div key={f.title} className="glass-card p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><f.icon className="h-5 w-5" /></div>
              <h3 className="mb-2 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t border-white/5 py-12 text-center text-sm text-muted-foreground">© 2026 Licarl. The Complete AI Workspace.</footer>
    </div>
  );
}

export function AuthView({ mode, onSuccess, onSwitch, onBack }: { mode: "login" | "signup"; onSuccess: () => void; onSwitch: () => void; onBack: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050507] px-4">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="mb-8 text-sm text-muted-foreground hover:text-white">← Back</button>
        <div className="glass-card p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary"><Sparkles className="h-6 w-6 text-white" /></div>
            <h1 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create account"}</h1>
            <p className="mt-2 text-xs text-muted-foreground">Demo mode — any email/password works</p>
          </div>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSuccess(); }}>
            {mode === "signup" && <input className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none" placeholder="Name" />}
            <input type="email" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none" placeholder="Email" defaultValue="demo@licarl.app" />
            <input type="password" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none" placeholder="Password" defaultValue="demo" />
            <Button type="submit" variant="gradient" className="w-full">{mode === "login" ? "Sign in" : "Create account"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "No account?" : "Already have an account?"}{" "}
            <button onClick={onSwitch} className="text-primary hover:underline">{mode === "login" ? "Sign up" : "Sign in"}</button>
          </p>
        </div>
      </div>
    </div>
  );
}
