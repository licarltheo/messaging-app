import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Trash2, Search, Folder } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8787";

type KFile = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  folder: string;
  content: string;
  createdAt: string;
};

export function KnowledgeBase() {
  const [files, setFiles] = useState<KFile[]>([]);
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState<KFile | null>(null);

  const load = useCallback(async () => {
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    const res = await fetch(`${API}/api/v1/files${params}`);
    const data = await res.json();
    setFiles(data.files ?? []);
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async () => {
    if (!name.trim() || !content.trim()) return;
    await fetch(`${API}/api/v1/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        content,
        mimeType: "text/plain",
        folder: "General",
      }),
    });
    setName("");
    setContent("");
    await load();
  };

  const remove = async (id: string) => {
    await fetch(`${API}/api/v1/files/${id}`, { method: "DELETE" });
    setPreview(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold">Knowledge Base</h2>
          <p className="text-sm text-muted-foreground">Documents for agent context & retrieval</p>
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
      <div className="glass-card space-y-3 p-5">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Upload className="h-4 w-4" /> Add document
        </h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Filename"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="Paste content…"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono outline-none"
        />
        <Button variant="gradient" onClick={upload} disabled={!name.trim() || !content.trim()}>
          Upload
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((f) => (
          <div key={f.id} className="glass-card flex items-center gap-3 p-4">
            <FileText className="h-8 w-8 shrink-0 text-primary/60" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{f.name}</p>
              <p className="text-[11px] text-muted-foreground">
                <Folder className="mr-1 inline h-3 w-3" />
                {f.folder} · {(f.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setPreview(f)}>
              View
            </Button>
            <Button size="sm" variant="ghost" onClick={() => remove(f.id)}>
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
            </Button>
          </div>
        ))}
        {files.length === 0 && (
          <div className="col-span-full glass-card flex h-32 items-center justify-center text-sm text-muted-foreground">
            No files yet
          </div>
        )}
      </div>
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="glass-card max-h-[80vh] w-full max-w-lg overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold">{preview.name}</h3>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-black/40 p-4 text-xs">
              {preview.content}
            </pre>
            <Button className="mt-4" variant="outline" onClick={() => setPreview(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
