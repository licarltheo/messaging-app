import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus, Play, Copy, Trash2, Download, Zap, GitBranch, Clock, Globe, Braces, Variable, Outdent, Type, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL || "http://localhost:8787";

type WfNode = { id: string; type: string; label: string; x: number; y: number; data: Record<string, unknown> };
type WfEdge = { id: string; source: string; target: string };
type Workflow = {
  id: string; name: string; description: string; nodes: WfNode[]; edges: WfEdge[];
  runCount: number; lastRunAt: string | null;
};

const NODE_META: Record<string, { icon: typeof Type; color: string }> = {
  input: { icon: Type, color: "bg-blue-500/20 text-blue-400" },
  prompt: { icon: MessageSquare, color: "bg-purple-500/20 text-purple-400" },
  ai_chat: { icon: Zap, color: "bg-violet-500/20 text-violet-400" },
  decision: { icon: GitBranch, color: "bg-amber-500/20 text-amber-400" },
  condition: { icon: GitBranch, color: "bg-amber-500/20 text-amber-400" },
  delay: { icon: Clock, color: "bg-slate-500/20 text-slate-400" },
  http: { icon: Globe, color: "bg-emerald-500/20 text-emerald-400" },
  json_parser: { icon: Braces, color: "bg-cyan-500/20 text-cyan-400" },
  variable: { icon: Variable, color: "bg-pink-500/20 text-pink-400" },
  output: { icon: Outdent, color: "bg-green-500/20 text-green-400" },
};

export function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [active, setActive] = useState<Workflow | null>(null);
  const [runInput, setRunInput] = useState("Hello from Licarl");
  const [runResult, setRunResult] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`${API}/api/v1/workflows`);
    const data = await res.json();
    setWorkflows(data.workflows ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    const res = await fetch(`${API}/api/v1/workflows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Workflow", description: "" }),
    });
    const w = await res.json();
    await load();
    setActive(w);
  };

  const save = async () => {
    if (!active) return;
    const res = await fetch(`${API}/api/v1/workflows/${active.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes: active.nodes, edges: active.edges, name: active.name }),
    });
    const w = await res.json();
    setActive(w);
    await load();
  };

  const duplicate = async (id: string) => {
    await fetch(`${API}/api/v1/workflows/${id}/duplicate`, { method: "POST" });
    await load();
  };

  const remove = async (id: string) => {
    await fetch(`${API}/api/v1/workflows/${id}`, { method: "DELETE" });
    if (active?.id === id) setActive(null);
    await load();
  };

  const run = async () => {
    if (!active) return;
    setRunning(true);
    setRunResult(null);
    try {
      await save();
      const res = await fetch(`${API}/api/v1/workflows/${active.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: runInput }),
      });
      setRunResult(await res.json());
    } finally {
      setRunning(false);
    }
  };

  const addNode = (type: string) => {
    if (!active) return;
    const id = `n${Date.now()}`;
    setActive({
      ...active,
      nodes: [
        ...active.nodes,
        {
          id,
          type,
          label: type.replace("_", " "),
          x: 200 + Math.random() * 200,
          y: 100 + Math.random() * 200,
          data: {},
        },
      ],
    });
  };

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    if (!active) return;
    const node = active.nodes.find((n) => n.id === id);
    if (!node) return;
    dragRef.current = { id, ox: e.clientX - node.x, oy: e.clientY - node.y };
    setSelectedNode(id);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current || !active) return;
    const { id, ox, oy } = dragRef.current;
    setActive({
      ...active,
      nodes: active.nodes.map((n) =>
        n.id === id ? { ...n, x: e.clientX - ox, y: e.clientY - oy } : n
      ),
    });
  };

  const onMouseUp = () => {
    dragRef.current = null;
  };

  const exportWf = () => {
    if (!active) return;
    const blob = new Blob([JSON.stringify(active, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.name}.json`;
    a.click();
  };

  if (!active) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Workflows</h2>
            <p className="text-sm text-muted-foreground">Visual multi-step AI pipelines</p>
          </div>
          <Button variant="gradient" onClick={create}>
            <Plus className="h-4 w-4" /> New Workflow
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((w) => (
            <div
              key={w.id}
              className="glass-card cursor-pointer p-5 hover:border-primary/30"
              onClick={() => setActive(w)}
            >
              <h3 className="font-semibold">{w.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {w.nodes.length} nodes · {w.runCount} runs
              </p>
              <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="ghost" onClick={() => duplicate(w.id)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(w.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
          {workflows.length === 0 && (
            <div className="col-span-full glass-card flex h-40 items-center justify-center text-sm text-muted-foreground">
              No workflows yet
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => setActive(null)}>
          ← Back
        </Button>
        <input
          value={active.name}
          onChange={(e) => setActive({ ...active, name: e.target.value })}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold outline-none"
        />
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={save}>
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={exportWf}>
          <Download className="h-3.5 w-3.5" />
        </Button>
        <input
          value={runInput}
          onChange={(e) => setRunInput(e.target.value)}
          className="w-40 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs outline-none"
          placeholder="Run input"
        />
        <Button size="sm" variant="gradient" onClick={run} disabled={running}>
          <Play className="h-3.5 w-3.5" /> {running ? "Running…" : "Run"}
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.keys(NODE_META).map((t) => (
          <button
            key={t}
            onClick={() => addNode(t)}
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] capitalize hover:bg-white/10"
          >
            + {t.replace("_", " ")}
          </button>
        ))}
      </div>

      <div
        className="relative flex-1 overflow-hidden rounded-xl border border-white/5 bg-[#08080a]"
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {active.edges.map((e) => {
            const s = active.nodes.find((n) => n.id === e.source);
            const t = active.nodes.find((n) => n.id === e.target);
            if (!s || !t) return null;
            return (
              <line
                key={e.id}
                x1={s.x + 70}
                y1={s.y + 28}
                x2={t.x}
                y2={t.y + 28}
                stroke="rgba(139,92,246,0.4)"
                strokeWidth={2}
              />
            );
          })}
        </svg>
        {active.nodes.map((n) => {
          const meta = NODE_META[n.type] || NODE_META.input;
          const Icon = meta.icon;
          const result = runResult?.nodeResults?.[n.id];
          return (
            <div
              key={n.id}
              onMouseDown={(e) => onMouseDown(e, n.id)}
              className={cn(
                "absolute w-[140px] cursor-grab select-none rounded-xl border bg-[#0c0c0e] p-3 shadow-lg",
                selectedNode === n.id ? "border-primary" : "border-white/10",
                result?.status === "ok" && "ring-1 ring-emerald-500/50",
                result?.status === "error" && "ring-1 ring-red-500/50"
              )}
              style={{ left: n.x, top: n.y }}
            >
              <div className="flex items-center gap-2">
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", meta.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-medium capitalize">{n.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {runResult && (
        <div className="max-h-32 overflow-y-auto rounded-xl border border-white/5 bg-black/30 p-3 text-xs">
          <p className="mb-1 font-medium">Run: {runResult.status}</p>
          {Object.entries(runResult.nodeResults || {}).map(([id, r]: any) => (
            <p key={id} className="text-muted-foreground">
              {id}: {r.status}{" "}
              {r.output != null && `→ ${String(r.output).slice(0, 80)}`}
              {r.error && <span className="text-red-400"> {r.error}</span>}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
