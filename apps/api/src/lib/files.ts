export interface KnowledgeFile {
  id: string; userId: string; name: string; mimeType: string; size: number;
  content: string; folder: string; tags: string[]; createdAt: string;
}

const store = new Map<string, KnowledgeFile>();

export function listFiles(userId: string, folder?: string) {
  let items = [...store.values()].filter((f) => f.userId === userId);
  if (folder) items = items.filter((f) => f.folder === folder);
  return items;
}

export function getFile(id: string, userId: string) {
  const f = store.get(id);
  return f && f.userId === userId ? f : null;
}

export function addFile(input: { userId: string; name: string; mimeType: string; size: number; content: string; folder?: string; tags?: string[] }) {
  const f: KnowledgeFile = {
    id: crypto.randomUUID(), userId: input.userId, name: input.name, mimeType: input.mimeType,
    size: input.size, content: input.content, folder: input.folder || "General", tags: input.tags || [],
    createdAt: new Date().toISOString(),
  };
  store.set(f.id, f);
  return f;
}

export function deleteFile(id: string, userId: string) {
  const f = getFile(id, userId);
  if (!f) return false;
  store.delete(id);
  return true;
}

export function searchFiles(userId: string, q: string) {
  const lower = q.toLowerCase();
  return listFiles(userId).filter((f) => f.name.toLowerCase().includes(lower) || f.content.toLowerCase().includes(lower) || f.tags.some((t) => t.includes(lower)));
}
