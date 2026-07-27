export type NodeType = "input" | "prompt" | "ai_chat" | "decision" | "condition" | "loop" | "delay" | "http" | "json_parser" | "variable" | "output";

export interface WfNode { id: string; type: NodeType; label: string; x: number; y: number; data: Record<string, unknown>; }
export interface WfEdge { id: string; source: string; target: string; }
export interface Workflow {
  id: string; userId: string; name: string; description: string; nodes: WfNode[]; edges: WfEdge[];
  version: number; runCount: number; lastRunAt: string | null; createdAt: string; updatedAt: string;
}
export interface WfRun {
  id: string; workflowId: string; status: "running" | "completed" | "failed";
  nodeResults: Record<string, { status: string; output?: unknown; error?: string }>;
  startedAt: string; finishedAt: string | null;
}

const store = new Map<string, Workflow>();
const runs = new Map<string, WfRun>();

export function listWorkflows(userId: string) {
  return [...store.values()].filter((w) => w.userId === userId);
}
export function getWorkflow(id: string, userId: string) {
  const w = store.get(id);
  return w && w.userId === userId ? w : null;
}

export function createWorkflow(userId: string, input: { name: string; description?: string; nodes?: WfNode[]; edges?: WfEdge[] }) {
  const now = new Date().toISOString();
  const w: Workflow = {
    id: crypto.randomUUID(), userId, name: input.name, description: input.description ?? "",
    nodes: input.nodes ?? [
      { id: "n1", type: "input", label: "Input", x: 80, y: 160, data: {} },
      { id: "n2", type: "ai_chat", label: "AI Chat", x: 320, y: 160, data: { provider: "openai", model: "gpt-4o-mini" } },
      { id: "n3", type: "output", label: "Output", x: 560, y: 160, data: {} },
    ],
    edges: input.edges ?? [{ id: "e1", source: "n1", target: "n2" }, { id: "e2", source: "n2", target: "n3" }],
    version: 1, runCount: 0, lastRunAt: null, createdAt: now, updatedAt: now,
  };
  store.set(w.id, w);
  return w;
}

export function updateWorkflow(id: string, userId: string, patch: Partial<Workflow>) {
  const w = getWorkflow(id, userId);
  if (!w) return null;
  Object.assign(w, patch, { updatedAt: new Date().toISOString(), version: w.version + 1 });
  store.set(id, w);
  return w;
}

export function deleteWorkflow(id: string, userId: string) {
  if (!getWorkflow(id, userId)) return false;
  store.delete(id);
  return true;
}

export function duplicateWorkflow(id: string, userId: string) {
  const w = getWorkflow(id, userId);
  if (!w) return null;
  return createWorkflow(userId, { name: `${w.name} (copy)`, description: w.description, nodes: w.nodes, edges: w.edges });
}

export async function runWorkflow(
  id: string, userId: string, input: string,
  executeAi: (prompt: string, provider: string, model: string) => Promise<string>
): Promise<WfRun> {
  const w = getWorkflow(id, userId);
  if (!w) throw new Error("Workflow not found");
  const run: WfRun = { id: crypto.randomUUID(), workflowId: id, status: "running", nodeResults: {}, startedAt: new Date().toISOString(), finishedAt: null };
  runs.set(run.id, run);
  const byId = Object.fromEntries(w.nodes.map((n) => [n.id, n]));
  const outgoing = new Map<string, string[]>();
  for (const e of w.edges) {
    if (!outgoing.has(e.source)) outgoing.set(e.source, []);
    outgoing.get(e.source)!.push(e.target);
  }
  let current = w.nodes.find((n) => n.type === "input")?.id;
  let value: unknown = input;
  const visited = new Set<string>();
  try {
    while (current && !visited.has(current)) {
      visited.add(current);
      const node = byId[current];
      if (!node) break;
      try {
        switch (node.type) {
          case "input": run.nodeResults[node.id] = { status: "ok", output: value }; break;
          case "prompt":
          case "ai_chat": {
            const provider = (node.data.provider as string) || "openai";
            const model = (node.data.model as string) || "gpt-4o-mini";
            const template = (node.data.prompt as string) || "{{input}}";
            const prompt = template.replace(/\{\{input\}\}/g, String(value));
            const out = await executeAi(prompt, provider, model);
            value = out;
            run.nodeResults[node.id] = { status: "ok", output: out };
            break;
          }
          case "delay": {
            await new Promise((r) => setTimeout(r, Math.min(Number(node.data.ms ?? 500), 5000)));
            run.nodeResults[node.id] = { status: "ok", output: value };
            break;
          }
          case "json_parser": {
            try { value = typeof value === "string" ? JSON.parse(value) : value; run.nodeResults[node.id] = { status: "ok", output: value }; }
            catch { run.nodeResults[node.id] = { status: "error", error: "Invalid JSON" }; }
            break;
          }
          case "variable": {
            value = { [(node.data.key as string) || "var"]: value };
            run.nodeResults[node.id] = { status: "ok", output: value };
            break;
          }
          case "http": {
            const url = node.data.url as string;
            if (url) { const res = await fetch(url, { method: (node.data.method as string) || "GET" }); value = await res.text(); run.nodeResults[node.id] = { status: "ok", output: value }; }
            else run.nodeResults[node.id] = { status: "error", error: "No URL" };
            break;
          }
          case "decision":
          case "condition": {
            const expr = String(node.data.condition ?? "true");
            const pass = expr === "true" || String(value).includes(expr);
            run.nodeResults[node.id] = { status: pass ? "ok" : "skipped", output: pass };
            break;
          }
          case "output": run.nodeResults[node.id] = { status: "ok", output: value }; break;
          default: run.nodeResults[node.id] = { status: "ok", output: value };
        }
      } catch (e) {
        run.nodeResults[node.id] = { status: "error", error: e instanceof Error ? e.message : String(e) };
      }
      current = outgoing.get(current)?.[0];
    }
    run.status = "completed";
  } catch { run.status = "failed"; }
  run.finishedAt = new Date().toISOString();
  w.runCount += 1; w.lastRunAt = run.finishedAt; store.set(w.id, w); runs.set(run.id, run);
  return run;
}

export function getRun(id: string) { return runs.get(id) ?? null; }
