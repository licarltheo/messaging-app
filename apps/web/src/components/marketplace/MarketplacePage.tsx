import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Star, Download, Search, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL || "http://localhost:8787";

type Item = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  installs: number;
  rating: number;
  ratingCount: number;
  authorName: string;
  featured: boolean;
};

export function MarketplacePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat) params.set("category", cat);
    const res = await fetch(`${API}/api/v1/marketplace?${params}`);
    const data = await res.json();
    setItems(data.prompts ?? []);
    setCategories(data.categories ?? []);
  }, [q, cat]);

  useEffect(() => {
    load();
  }, [load]);

  const install = async (id: string) => {
    const res = await fetch(`${API}/api/v1/marketplace/${id}/install`, { method: "POST" });
    const item = await res.json();
    setMsg(`Installed "${item.title}"`);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold">Prompt Marketplace</h2>
          <p className="text-sm text-muted-foreground">Discover, install, and share prompts</p>
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm outline-none"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCat("")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs",
            !cat ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"
          )}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs",
              cat === c ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"
            )}
          >
            {c}
          </button>
        ))}
      </div>
      {msg && <p className="text-xs text-emerald-400">{msg}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="glass-card flex flex-col p-5">
            <div className="mb-2 flex items-start justify-between">
              <h3 className="font-semibold">{item.title}</h3>
              {item.featured && <TrendingUp className="h-4 w-4 text-accent" />}
            </div>
            <p className="mb-3 flex-1 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-400" /> {item.rating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" /> {item.installs}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="gradient" onClick={() => install(item.id)}>
                Install
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelected(item)}>
                View
              </Button>
            </div>
          </div>
        ))}
      </div>
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="glass-card max-h-[80vh] w-full max-w-lg overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">{selected.title}</h3>
            <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-black/40 p-4 text-xs font-mono">
              {selected.content}
            </pre>
            <Button className="mt-4" variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
