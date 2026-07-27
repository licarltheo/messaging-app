import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Users, Plus, Mail } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8787";

export function OrgsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [name, setName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`${API}/api/v1/orgs`);
    const data = await res.json();
    setOrgs(data.organizations ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    await fetch(`${API}/api/v1/orgs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    await load();
  };

  const invite = async () => {
    if (!selected || !inviteEmail.trim()) return;
    await fetch(`${API}/api/v1/orgs/${selected.id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: "editor" }),
    });
    setInviteEmail("");
    const res = await fetch(`${API}/api/v1/orgs/${selected.id}`);
    setSelected(await res.json());
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Organizations</h2>
        <p className="text-sm text-muted-foreground">Teams, roles, and shared workspaces</p>
      </div>
      <div className="glass-card flex gap-2 p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Organization name"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
        />
        <Button variant="gradient" onClick={create}>
          <Plus className="h-4 w-4" /> Create
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {orgs.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelected(o)}
              className={`glass-card w-full p-4 text-left ${selected?.id === o.id ? "border-primary/40" : ""}`}
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{o.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.plan} · {o.members?.length} members
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
        {selected && (
          <div className="glass-card space-y-4 p-5">
            <h3 className="font-semibold">{selected.name}</h3>
            <p className="text-xs text-muted-foreground">
             Slug: {selected.slug} · Plan: {selected.plan}
            </p>
            <div>
              <p className="mb-2 text-sm font-medium">Members</p>
              {selected.members?.map((m: any) => (
                <div
                  key={m.userId}
                  className="mb-1 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
                >
                  <span>{m.name}</span>
                  <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Invite email"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              />
              <Button variant="outline" onClick={invite}>
                <Mail className="h-4 w-4" /> Invite
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
