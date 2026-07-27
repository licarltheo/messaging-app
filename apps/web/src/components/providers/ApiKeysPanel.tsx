import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Key, Loader2, Trash2, Plus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

type KeyMeta = {
  id: string;
  provider: string;
  label: string;
  isDefault: boolean;
  lastSuccessAt: string | null;
  lastError: string | null;
  lastLatencyMs: number | null;
};

type ProviderInfo = { id: string; name: string };

export function ApiKeysPanel() {
  const [keys, setKeys] = useState<KeyMeta[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [kRes, pRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/keys`),
        fetch(`${API_URL}/api/v1/providers`),
      ]);
      const kData = await kRes.json();
      const pData = await pRes.json();
      setKeys(kData.keys ?? []);
      setProviders(pData.providers ?? []);
    } catch {
      setMessage({ type: "err", text: "Failed to load keys — is the API running?" });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!apiKey.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
          label: label || provider,
          isDefault: true,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setApiKey("");
      setLabel("");
      setMessage({ type: "ok", text: "API key saved (encrypted at rest)" });
      await load();
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`${API_URL}/api/v1/keys/${id}`, { method: "DELETE" });
    await load();
  };

  const test = async (providerId: string) => {
    setTesting(providerId);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/keys/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "ok", text: `${providerId} OK — ${data.latencyMs}ms` });
      } else {
        setMessage({ type: "err", text: data.error || "Connection failed" });
      }
      await load();
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="glass-card space-y-4 p-6">
        <h3 className="flex items-center gap-2 font-semibold">
          <Key className="h-4 w-4 text-primary" />
          Add API Key
        </h3>
        <p className="text-xs text-muted-foreground">
          Keys are encrypted with AES-256-GCM on the server and never returned to the client.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#0c0c0e]">
                {p.name}
              </option>
            ))}
          </select>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional)"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          />
        </div>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-... or provider key"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/50"
        />
        <Button variant="gradient" onClick={add} disabled={loading || !apiKey.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Save Key
        </Button>
        {message && (
          <p className={cn("text-xs", message.type === "ok" ? "text-emerald-400" : "text-red-400")}>
            {message.text}
          </p>
        )}
      </div>

      <div className="glass-card p-6">
        <h3 className="mb-4 font-semibold">Stored Keys</h3>
        {keys.length === 0 && (
          <p className="text-sm text-muted-foreground">No keys yet. Add one above.</p>
        )}
        <div className="space-y-2">
          {keys.map((k) => (
            <div
              key={k.id}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 px-4 py-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {k.label}
                  {k.isDefault && (
                    <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">
                      default
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {k.provider}
                  {k.lastSuccessAt && (
                    <span className="ml-2 text-emerald-400">
                      · last OK {new Date(k.lastSuccessAt).toLocaleString()}
                      {k.lastLatencyMs != null && ` (${k.lastLatencyMs}ms)`}
                    </span>
                  )}
                  {k.lastError && (
                    <span className="ml-2 text-red-400">· {k.lastError.slice(0, 60)}</span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => test(k.provider)}
                disabled={testing === k.provider}
              >
                {testing === k.provider ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                Test
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(k.id)}>
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
