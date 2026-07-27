import { Hono } from "hono";
import { listMarket, getMarketItem, publishPrompt, installPrompt, ratePrompt, categories } from "../lib/marketplace.js";

const market = new Hono();
const DEMO = "demo-user";

market.get("/", (c) => {
  const category = c.req.query("category") || undefined;
  const q = c.req.query("q") || undefined;
  const featured = c.req.query("featured") === "1";
  return c.json({ prompts: listMarket({ category, q, featured }), categories: categories() });
});

market.get("/:id", (c) => {
  const item = getMarketItem(c.req.param("id"));
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

market.post("/", async (c) => {
  const body = await c.req.json();
  if (!body.title || !body.content) return c.json({ error: "title and content required" }, 400);
  return c.json(publishPrompt({ authorId: DEMO, authorName: body.authorName || "Demo User", title: body.title, description: body.description || "", content: body.content, category: body.category || "General", tags: body.tags || [] }), 201);
});

market.post("/:id/install", (c) => {
  const item = installPrompt(c.req.param("id"));
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

market.post("/:id/rate", async (c) => {
  const body = await c.req.json();
  const item = ratePrompt(c.req.param("id"), DEMO, body.userName || "Demo User", Number(body.rating) || 5, body.text || "");
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

export default market;
