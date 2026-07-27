const events: { id: string; userId: string; type: string; meta: Record<string, unknown>; at: string }[] = [];

export function track(userId: string, type: string, meta: Record<string, unknown> = {}) {
  events.push({ id: crypto.randomUUID(), userId, type, meta, at: new Date().toISOString() });
  if (events.length > 5000) events.shift();
}

export function getAnalytics(userId: string) {
  const mine = events.filter((e) => e.userId === userId);
  const byType: Record<string, number> = {};
  const byDay: Record<string, number> = {};
  let tokens = 0;
  let cost = 0;
  for (const e of mine) {
    byType[e.type] = (byType[e.type] || 0) + 1;
    const day = e.at.slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
    if (typeof e.meta.tokens === "number") tokens += e.meta.tokens;
    if (typeof e.meta.cost === "number") cost += e.meta.cost;
  }
  return { totalEvents: mine.length, byType, byDay, tokens, cost, recent: mine.slice(-20).reverse() };
}

export function getAuditLog(userId: string, filter?: string) {
  let items = events.filter((e) => e.userId === userId);
  if (filter) items = items.filter((e) => e.type.includes(filter));
  return items.slice(-200).reverse();
}
