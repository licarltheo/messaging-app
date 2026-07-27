export interface Notification {
  id: string; userId: string; title: string; body: string;
  type: "info" | "success" | "warning" | "mention" | "workflow";
  read: boolean; createdAt: string;
}

const store: Notification[] = [];

export function notify(userId: string, title: string, body: string, type: Notification["type"] = "info") {
  const n: Notification = { id: crypto.randomUUID(), userId, title, body, type, read: false, createdAt: new Date().toISOString() };
  store.unshift(n);
  if (store.length > 200) store.pop();
  return n;
}

export function listNotifications(userId: string) {
  return store.filter((n) => n.userId === userId);
}

export function unreadCount(userId: string) {
  return store.filter((n) => n.userId === userId && !n.read).length;
}

export function markRead(id: string, userId: string) {
  const n = store.find((x) => x.id === id && x.userId === userId);
  if (n) n.read = true;
  return n;
}

export function markAllRead(userId: string) {
  for (const n of store) if (n.userId === userId) n.read = true;
}
