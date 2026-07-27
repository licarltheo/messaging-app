export interface MarketPrompt {
  id: string; authorId: string; authorName: string; title: string; description: string;
  content: string; category: string; tags: string[]; installs: number; rating: number;
  ratingCount: number; reviews: { userId: string; userName: string; rating: number; text: string; at: string }[];
  featured: boolean; createdAt: string;
}

const store = new Map<string, MarketPrompt>();

const seeds: Omit<MarketPrompt, "id" | "createdAt">[] = [
  { authorId: "licarl", authorName: "Licarl Official", title: "Code Reviewer Pro", description: "Expert code review with security and performance feedback.", content: "You are a senior engineer. Review this code for bugs, security, performance:\n\n{{code}}", category: "Development", tags: ["code", "review"], installs: 1240, rating: 4.8, ratingCount: 86, reviews: [], featured: true },
  { authorId: "licarl", authorName: "Licarl Official", title: "SEO Blog Writer", description: "SEO-optimized blog posts with meta description.", content: "Write an SEO blog post about {{topic}}. Include H2/H3 and meta description under 160 chars.", category: "Marketing", tags: ["seo", "writing"], installs: 980, rating: 4.6, ratingCount: 54, reviews: [], featured: true },
  { authorId: "licarl", authorName: "Licarl Official", title: "SQL Explainer", description: "Explain SQL in plain English.", content: "Explain this SQL step by step:\n\n{{query}}", category: "Data", tags: ["sql"], installs: 720, rating: 4.9, ratingCount: 41, reviews: [], featured: false },
  { authorId: "licarl", authorName: "Licarl Official", title: "Meeting Summarizer", description: "Transcripts to action items.", content: "Summarize into: 1) Decisions 2) Action items 3) Open questions\n\n{{transcript}}", category: "Productivity", tags: ["meetings"], installs: 1500, rating: 4.7, ratingCount: 112, reviews: [], featured: true },
];

for (const s of seeds) {
  const id = crypto.randomUUID();
  store.set(id, { ...s, id, createdAt: new Date().toISOString() });
}

export function listMarket(opts?: { category?: string; q?: string; featured?: boolean }) {
  let items = [...store.values()];
  if (opts?.category) items = items.filter((i) => i.category === opts.category);
  if (opts?.featured) items = items.filter((i) => i.featured);
  if (opts?.q) {
    const q = opts.q.toLowerCase();
    items = items.filter((i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.tags.some((t) => t.includes(q)));
  }
  return items.sort((a, b) => b.installs - a.installs);
}

export function getMarketItem(id: string) { return store.get(id) ?? null; }

export function publishPrompt(input: { authorId: string; authorName: string; title: string; description: string; content: string; category: string; tags: string[] }) {
  const item: MarketPrompt = { id: crypto.randomUUID(), ...input, installs: 0, rating: 0, ratingCount: 0, reviews: [], featured: false, createdAt: new Date().toISOString() };
  store.set(item.id, item);
  return item;
}

export function installPrompt(id: string) {
  const item = store.get(id);
  if (!item) return null;
  item.installs += 1;
  return item;
}

export function ratePrompt(id: string, userId: string, userName: string, rating: number, text: string) {
  const item = store.get(id);
  if (!item) return null;
  item.reviews.push({ userId, userName, rating, text, at: new Date().toISOString() });
  item.ratingCount = item.reviews.length;
  item.rating = item.reviews.reduce((s, r) => s + r.rating, 0) / item.ratingCount;
  return item;
}

export function categories() {
  return [...new Set([...store.values()].map((i) => i.category))];
}
