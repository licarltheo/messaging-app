import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProvidersStore } from "@/stores/providers";
import { Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

type Target = { provider: string; model: string };

type Result = {
  provider: string;
  model: string;
  ok: boolean;
  error: string | null;
  content: string | null;
  latencyMs: number;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number } | null;
  estimatedCostUsd: number | null;
};

export function PromptTester() {
  const { providers } = useProvidersStore();
  const [prompt, setPrompt] = useState("Explain quantum entanglement in two sentences.");
  const [selected, setSelected] = useState<Target[]>([]);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  const toggle = (provider: string, model: string) => {
    setSelected((prev) => {
      const exists = prev.some((t) => t.provider === provider && t.model === model);
      if (exists) return prev.filter((t) => !(t.provider === provider && t.model === model));
      if (prev.length >= 6) return prev;
      return [...prev, { provider, model }];
    });
  };

  const run = async () => {
    if (!prompt.trim() || selected.length === 0) return;
    setRunning(true);
    setResults([]);
    try {
      const res = await fetch(`${API_URL}/api/v1/test/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, targets: selected, temperature: 0.7 }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
    } catch (e) {
      setResults([
        {
          provider: "system",
          model: "-",
          ok: false,
          error: e instanceof Error ? e.message : String(e),
          content: null,
          latencyMs: 0,
          usage: null,
          estimatedCostUsd: null,
        },
      ]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card space-y-4 p-6">
        <h2 className="text-lg font-semibold">Prompt Tester</h2>
        <p className="text-sm text-muted-foreground">
          Run the same prompt against multiple providers simultaneously. Requires stored API keys.
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-primary/40"
          placeholder="Enter prompt to test…"
        />
        <div className="flex flex-wrap gap-2">
          {providers.flatMap((p) =>
            p.models.slice(0, 2).map((m) => {
              const active = selected.some((t) => t.provider === p.id && t.model === m);
              return (
                <button
                  key={`${p.id}-${m}`}
                  onClick={() => toggle(p.id, m)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs transition",
                    active
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p.name} · {m}
                </button>
              );
            })
          )}
        </div>
        <Button variant="gradient" onClick={run} disabled={running || selected.length === 0}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run against {selected.length} model{selected.length !== 1 ? "s" : ""}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {results.map((r, i) => (
            <div key={i} className="glass-card flex flex-col p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.provider}</p>
                  <p className="text-xs text-muted-foreground">{r.model}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {r.ok ? (
                    <>
                      <p className="text-emerald-400">{r.latencyMs}ms</p>
                      {r.usage && <p>{r.usage.totalTokens} tok</p>}
                      {r.estimatedCostUsd != null && <p>${r.estimatedCostUsd.toFixed(5)}</p>}
                    </>
                  ) : (
                    <p className="text-red-400">Failed</p>
                  )}
                </div>
              </div>
              {r.error && <p className="mb-2 text-xs text-red-400">{r.error}</p>}
              {r.content && (
                <div className="prose prose-invert prose-sm max-h-64 flex-1 overflow-y-auto">
                  <ReactMarkdown>{r.content}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
