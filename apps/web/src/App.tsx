import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  MessageSquare,
  FileText,
  Workflow,
  Bot,
  Store,
  Settings,
  Menu,
  X,
  ChevronRight,
  Zap,
  Shield,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { PromptEditor } from "@/components/prompt/PromptEditor";
import { ApiKeysPanel } from "@/components/providers/ApiKeysPanel";
import { PromptTester } from "@/components/tester/PromptTester";

type View = "landing" | "login" | "signup" | "dashboard" | "chat" | "prompts" | "workflows" | "agents" | "marketplace" | "settings";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: Layers },
  { id: "chat", label: "AI Chat", icon: MessageSquare },
  { id: "prompts", label: "Prompts", icon: FileText },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "marketplace", label: "Tester", icon: Store },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (view === "landing") {
    return <Landing onGetStarted={() => setView("signup")} onLogin={() => setView("login")} />;
  }

  if (view === "login" || view === "signup") {
    return (
      <AuthView
        mode={view}
        onSuccess={() => setView("dashboard")}
        onSwitch={() => setView(view === "login" ? "signup" : "login")}
        onBack={() => setView("landing")}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0b]">
      <aside
        className={cn(
          "flex flex-col border-r border-white/5 bg-[#0c0c0e] transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="text-sm font-semibold tracking-tight">Licarl</p>
              <p className="text-[10px] text-muted-foreground">Prompt Maker</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as View)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-white/5"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-white/5 px-6">
          <h1 className="text-lg font-semibold capitalize">{view === "marketplace" ? "Tester" : view}</h1>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent" />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {view === "dashboard" && <Dashboard />}
              {view === "chat" && <ChatInterface />}
              {view === "prompts" && <PromptsPlaceholder />}
              {view === "workflows" && <WorkflowsPlaceholder />}
              {view === "agents" && <AgentsPlaceholder />}
              {view === "marketplace" && <PromptTester />}
              {view === "settings" && <ApiKeysPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function Landing({ onGetStarted, onLogin }: { onGetStarted: () => void; onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#050507]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">Licarl</span>
          </div>
          <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#docs" className="hover:text-white transition">Docs</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onLogin}>Log in</Button>
            <Button variant="gradient" onClick={onGetStarted}>Get Started</Button>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden pt-32 pb-24">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-accent" />
              The Complete AI Workspace
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Every model.<br /><span className="text-gradient">Every prompt.</span><br />One workspace.
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
              Create, optimize, test, automate and collaborate on AI prompts across OpenAI, Claude, Gemini, Grok and more.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" variant="gradient" onClick={onGetStarted} className="gap-2">
                Launch App <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={onLogin}>View Demo</Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold">Everything you need</h2>
          <p className="text-muted-foreground">Prompt engineering, multi-model chat, agents, workflows and team collaboration.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: MessageSquare, title: "Multi-Provider Chat", desc: "Chat with every major model from one interface." },
            { icon: FileText, title: "Prompt Builder", desc: "Monaco editor with variables, versioning, templates." },
            { icon: Workflow, title: "Workflow Automation", desc: "Chain AI steps visually with variables." },
            { icon: Bot, title: "AI Agents", desc: "System prompts, memory, tools and knowledge bases." },
            { icon: Store, title: "Prompt Tester", desc: "Run the same prompt across multiple providers." },
            { icon: Shield, title: "Enterprise Security", desc: "Encrypted API keys, RBAC, audit logs." },
          ].map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }} className="glass-card p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 py-12 text-center text-sm text-muted-foreground">
        © 2026 Licarl. The Complete AI Workspace.
      </footer>
    </div>
  );
}

function AuthView({ mode, onSuccess, onSwitch, onBack }: { mode: "login" | "signup"; onSuccess: () => void; onSwitch: () => void; onBack: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050507] px-4">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="mb-8 text-sm text-muted-foreground hover:text-white">← Back</button>
        <div className="glass-card p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create account"}</h1>
          </div>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSuccess(); }}>
            {mode === "signup" && (
              <input className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none" placeholder="Name" />
            )}
            <input type="email" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none" placeholder="Email" />
            <input type="password" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none" placeholder="Password" />
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

function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Prompts", "Chats this week", "Tokens used", "Est. cost"].map((label, i) => (
          <div key={label} className="glass-card p-5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{["128", "47", "1.2M", "$18.40"][i]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptsPlaceholder() {
  return (
    <div className="h-[calc(100vh-8rem)]">
      <PromptEditor
        onSave={(data) => console.log("Save", data)}
        onTest={(c) => console.log("Test", c)}
        onOptimize={(c) => console.log("Optimize", c)}
      />
    </div>
  );
}

function WorkflowsPlaceholder() {
  return (
    <div className="glass-card flex h-[60vh] items-center justify-center p-8 text-center text-muted-foreground">
      <div>
        <Workflow className="mx-auto mb-3 h-10 w-10 opacity-40" />
        <p className="font-medium text-foreground">Visual Workflow Builder</p>
        <p className="mt-1 text-sm">Coming next — multi-step AI pipelines</p>
      </div>
    </div>
  );
}

function AgentsPlaceholder() {
  return (
    <div className="glass-card flex h-[60vh] items-center justify-center p-8 text-center text-muted-foreground">
      <div>
        <Bot className="mx-auto mb-3 h-10 w-10 opacity-40" />
        <p className="font-medium text-foreground">AI Agents</p>
        <p className="mt-1 text-sm">System prompts · Memory · Tools</p>
      </div>
    </div>
  );
}
