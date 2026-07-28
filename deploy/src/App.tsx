import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, MessageSquare, FileText, Workflow, Bot, Store, Settings, Menu, X,
  Layers, BarChart3, Users, FolderOpen, FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dashboard, ChatPage, PromptsPage, WorkflowsPage, AgentsPage, MarketPage,
  TesterPage, FilesPage, AnalyticsPage, OrgsPage, SettingsPage, NotifBell,
  Landing, AuthView,
} from "./pages";

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

  if (view === "landing") return <Landing onGetStarted={() => setView("dashboard")} onLogin={() => setView("login")} />;
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

  const go = (id: string) => { setView(id as View); setMobileMenu(false); };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0b]">
      <aside className={cn("hidden flex-col border-r border-white/5 bg-[#0c0c0e] transition-all duration-300 md:flex", sidebarOpen ? "w-64" : "w-16")}>
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && <div><p className="text-sm font-semibold">Licarl</p><p className="text-[10px] text-muted-foreground">Prompt Maker</p></div>}
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => go(item.id)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all", view === item.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground")}>
                <Icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/5 p-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-white/5">
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {isMobile && mobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenu(false)} />
          <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-white/5 bg-[#0c0c0e] p-4">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><span className="font-semibold">Licarl</span></div>
              <button onClick={() => setMobileMenu(false)}><X className="h-5 w-5" /></button>
            </div>
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => go(item.id)} className={cn("mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm", view === item.id ? "bg-primary/15 text-primary" : "text-muted-foreground")}>
                  <Icon className="h-4 w-4" />{item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-white/5 px-4 md:h-16 md:px-6">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setMobileMenu(true)}><Menu className="h-5 w-5" /></button>
            <h1 className="text-base font-semibold capitalize md:text-lg">{view === "files" ? "Knowledge" : view === "orgs" ? "Teams" : view}</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotifBell />
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent" />
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {view === "dashboard" && <Dashboard onNavigate={go} />}
              {view === "chat" && <ChatPage />}
              {view === "prompts" && <PromptsPage />}
              {view === "workflows" && <WorkflowsPage />}
              {view === "agents" && <AgentsPage />}
              {view === "marketplace" && <MarketPage />}
              {view === "tester" && <TesterPage />}
              {view === "files" && <FilesPage />}
              {view === "analytics" && <AnalyticsPage />}
              {view === "orgs" && <OrgsPage />}
              {view === "settings" && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
        </div>
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-white/5 bg-[#0c0c0e]/95 backdrop-blur-xl md:hidden">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.id || (item.id === "settings" && mobileMenu);
            return (
              <button key={item.id} onClick={() => (item.id === "settings" ? setMobileMenu(true) : go(item.id))} className={cn("flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px]", active ? "text-primary" : "text-muted-foreground")}>
                <Icon className="h-5 w-5" />{item.label}
              </button>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
