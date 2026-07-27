import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, MessageSquare, FileText, Workflow, Bot, Store, Settings, Menu, X,
  ChevronRight, Zap, Shield, Layers, ArrowRight, BarChart3, Users, FolderOpen, FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { PromptEditor } from "@/components/prompt/PromptEditor";
import { ApiKeysPanel } from "@/components/providers/ApiKeysPanel";
import { PromptTester } from "@/components/tester/PromptTester";
import { AgentsPage } from "@/components/agents/AgentsPage";
import { WorkflowBuilder } from "@/components/workflow/WorkflowBuilder";
import { MarketplacePage } from "@/components/marketplace/MarketplacePage";
import { KnowledgeBase } from "@/components/files/KnowledgeBase";
import { AnalyticsPage } from "@/components/analytics/AnalyticsPage";
import { OrgsPage } from "@/components/orgs/OrgsPage";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

type View =
  | "landing" | "login" | "signup" | "dashboard" | "chat" | "prompts"
  | "workflows" | "agents" | "marketplace" | "tester" | "files"
  | "analytics" | "orgs" | "settings";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: Layers },
  { id: "chat", label: "AI Chat", icon: MessageSquare },
  { id: "prompts", label: "Prompts", icon: FileText },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "marketplace", label: "Marketplace", icon: Store },
  { id: "tester", label: "Tester", icon: FlaskConical },
  { id: "files", label: "Knowledge", icon: FolderOpen },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "orgs", label: "Teams", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

const MOBILE_NAV = [
  { id: "dashboard", label: "Home", icon: Layers },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "prompts", label: "Prompts", icon: FileText },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "settings", label: "More", icon: Menu },
] as const;

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

  const go = (id: string) => {
    setView(id as View);
    setMobileMenu(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0b]">
      <aside
        className={cn(
          "hidden flex-col border-r border-white/5 bg-[#0c0c0e] transition-all duration-300 md:flex",
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
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
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

      {isMobile && mobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenu(false)} />
          <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-white/5 bg-[#0c0c0e] p-4">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-semibold">Licarl</span>
              </div>
              <button onClick={() => setMobileMenu(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  className={cn(
                    "mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm",
                    view === item.id ? "bg-primary/15 text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-white/5 px-4 md:h-16 md:px-6">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setMobileMenu(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold capitalize md:text-lg">
              {view === "files" ? "Knowledge" : view === "orgs" ? "Teams" : view}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent" />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {view === "dashboard" && <Dashboard onNavigate={go} />}
              {view === "chat" && <ChatInterface />}
              {view === "prompts" && (
                <div className="h-[calc(100vh-10rem)]">
                  <PromptEditor
                    onSave={(d) => console.log("save", d)}
                    onTest={(c) => console.log("test", c)}
                    onOptimize={(c) => console.log("opt", c)}
                  />
                </div>
              )}
              {view === "workflows" && <WorkflowBuilder />}
              {view === "agents" && <AgentsPage />}
              {view === "marketplace" && <MarketplacePage />}
              {view === "tester" && <PromptTester />}
              {view === "files" && <KnowledgeBase />}
              {view === "analytics" && <AnalyticsPage />}
              {view === "orgs" && <OrgsPage />}
              {view === "settings" && <ApiKeysPanel />}
            </motion.div>
          </AnimatePresence>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-white/5 bg-[#0c0c0e]/95 backdrop-blur-xl md:hidden">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.id || (item.id === "settings" && mobileMenu);
            return (
              <button
                key={item.id}
                onClick={() => (item.id === "settings" ? setMobileMenu(true) : go(item.id))}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px]",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </main>
    </div>
  );
}

function Dashboard({ onNavigate }: { onNavigate: (id: string) => void }) {
  const cards = [
    { label: "AI Chat", id: "chat", icon: MessageSquare, desc: "Multi-provider streaming" },
    { label: "Agents", id: "agents", icon: Bot, desc: "Specialized AI agents" },
    { label: "Workflows", id: "workflows", icon: Workflow, desc: "Visual pipelines" },
    { label: "Marketplace", id: "marketplace", icon: Store, desc: "Community prompts" },
    { label: "Knowledge", id: "files", icon: FolderOpen, desc: "Document base" },
    { label: "Analytics", id: "analytics", icon: BarChart3, desc: "Usage & costs" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Prompts", "Agents", "Workflows", "Providers"].map((label, i) => (
          <div key={label} className="glass-card p-5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{["—", "—", "—", "12"][i]}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => onNavigate(c.id)}
            className="glass-card p-5 text-left transition hover:border-primary/30"
          >
            <c.icon className="mb-3 h-6 w-6 text-primary" />
            <p className="font-semibold">{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.desc}</p>
          </button>
        ))}
      </div>
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
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onLogin}>Log in</Button>
            <Button variant="gradient" onClick={onGetStarted}>Get Started</Button>
          </div>
        </div>
      </nav>
      <section className="relative overflow-hidden pb-24 pt-32">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
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
          <p className="text-muted-foreground">Prompt engineering, agents, workflows, and enterprise collaboration</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: MessageSquare, title: "Multi-Provider Chat", desc: "OpenAI, Claude, Gemini, Grok, and more." },
            { icon: Bot, title: "AI Agents", desc: "Personality, memory, tools, knowledge files." },
            { icon: Workflow, title: "Visual Workflows", desc: "Drag-and-drop multi-step AI pipelines." },
            { icon: Store, title: "Marketplace", desc: "Publish, install, rate community prompts." },
            { icon: FolderOpen, title: "Knowledge Base", desc: "Upload docs for RAG-style agents." },
            { icon: Shield, title: "Enterprise", desc: "Orgs, roles, audit logs, encrypted keys." },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              className="glass-card p-6"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="glass-card p-12">
          <h2 className="mb-4 text-3xl font-bold">Ready to own your AI stack?</h2>
          <p className="mb-8 text-muted-foreground">Start free. Connect your keys. Scale to enterprise.</p>
          <Button size="lg" variant="gradient" onClick={onGetStarted} className="gap-2">
            Get Started Free <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
      <footer className="border-t border-white/5 py-12 text-center text-sm text-muted-foreground">
        © 2026 Licarl. The Complete AI Workspace.
      </footer>
    </div>
  );
}

function AuthView({
  mode, onSuccess, onSwitch, onBack,
}: {
  mode: "login" | "signup";
  onSuccess: () => void;
  onSwitch: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050507] px-4">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="mb-8 text-sm text-muted-foreground hover:text-white">
          ← Back
        </button>
        <div className="glass-card p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onSuccess();
            }}
          >
            {mode === "signup" && (
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none"
                placeholder="Name"
              />
            )}
            <input
              type="email"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none"
              placeholder="Email"
            />
            <input
              type="password"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none"
              placeholder="Password"
            />
            <Button type="submit" variant="gradient" className="w-full">
              {mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "No account?" : "Already have an account?"}{" "}
            <button onClick={onSwitch} className="text-primary hover:underline">
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
