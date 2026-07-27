import { useState, useEffect, useCallback } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const API = import.meta.env.VITE_API_URL || "http://localhost:8787";

export function NotificationCenter() {
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/analytics/notifications`);
      const data = await res.json();
      setItems(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const markAll = async () => {
    await fetch(`${API}/api/v1/analytics/notifications/read-all`, { method: "POST" });
    await load();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-white/10 bg-[#0c0c0e] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            <Button size="sm" variant="ghost" onClick={markAll}>
              <Check className="h-3.5 w-3.5" /> Mark all
            </Button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {items.map((n) => (
              <div
                key={n.id}
                className={`border-b border-white/5 px-4 py-3 ${n.read ? "opacity-60" : ""}`}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.body}</p>
              </div>
            ))}
            {items.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">All caught up</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
