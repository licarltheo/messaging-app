import { useState, useEffect } from "react";
import { BarChart3, Activity, DollarSign, Zap } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8787";

export function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/api/v1/analytics`).then((r) => r.json()).then(setData).catch(() => {});
    fetch(`${API}/api/v1/analytics/audit`).then((r) => r.json()).then((d) => setLogs(d.logs ?? [])).catch(() => {});
  }, []);

  const byType = data?.byType ?? {};
  const byDay = data?.byDay ?? {};
  const maxDay = Math.max(1, ...Object.values(byDay).map(Number));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Analytics</h2>
        <p className="text-sm text-muted-foreground">Usage, costs, and activity</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Events", value: data?.totalEvents ?? 0, icon: Activity },
          { label: "Tokens", value: data?.tokens ?? 0, icon: Zap },
          { label: "Est. Cost", value: `$${(data?.cost ?? 0).toFixed(4)}`, icon: DollarSign },
          { label: "Types", value: Object.keys(byType).length, icon: BarChart3 },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-primary/60" />
            </div>
            <p className="text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="mb-4 font-semibold">By type</h3>
          {Object.entries(byType).map(([k, v]) => (
            <div key={k} className="mb-2 flex items-center gap-3 text-sm">
              <span className="w-28 truncate text-muted-foreground">{k}</span>
              <div className="h-2 flex-1 rounded-full bg-white/5">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${Math.min(100, (Number(v) / Math.max(1, data?.totalEvents)) * 100)}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs">{String(v)}</span>
            </div>
          ))}
          {Object.keys(byType).length === 0 && (
            <p className="text-sm text-muted-foreground">No data yet</p>
          )}
        </div>
        <div className="glass-card p-5">
          <h3 className="mb-4 font-semibold">Daily activity</h3>
          <div className="flex h-32 items-end gap-1">
            {Object.entries(byDay).slice(-14).map(([day, count]) => (
              <div key={day} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/80"
                  style={{ height: `${(Number(count) / maxDay) * 100}%`, minHeight: 4 }}
                />
                <span className="text-[9px] text-muted-foreground">{day.slice(5)}</span>
              </div>
            ))}
            {Object.keys(byDay).length === 0 && (
              <p className="m-auto text-sm text-muted-foreground">No data</p>
            )}
          </div>
        </div>
      </div>
      <div className="glass-card p-5">
        <h3 className="mb-4 font-semibold">Audit log</h3>
        <div className="max-h-64 space-y-2 overflow-y-auto text-xs">
          {logs.map((l) => (
            <div key={l.id} className="flex gap-3 rounded-lg bg-white/5 px-3 py-2">
              <span className="text-muted-foreground">{new Date(l.at).toLocaleString()}</span>
              <span className="font-medium text-primary">{l.type}</span>
            </div>
          ))}
          {logs.length === 0 && <p className="text-muted-foreground">No events yet</p>}
        </div>
      </div>
    </div>
  );
}
