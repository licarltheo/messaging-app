import { Hono } from "hono";
import { z } from "zod";

const prompts = new Hono();

const PromptSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  variables: z
    .array(z.object({ name: z.string(), defaultValue: z.string() }))
    .optional(),
  is_favorite: z.boolean().optional(),
});

const store: Array<z.infer<typeof PromptSchema> & { id: string; created_at: string }> = [];

prompts.get("/", (c) => {
  return c.json({ prompts: store });
});

prompts.get("/:id", (c) => {
  const item = store.find((p) => p.id === c.req.param("id"));
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

prompts.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = PromptSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid", details: parsed.error.flatten() }, 400);
  }
  const item = {
    ...parsed.data,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  store.unshift(item);
  return c.json(item, 201);
});

prompts.put("/:id", async (c) => {
  const idx = store.findIndex((p) => p.id === c.req.param("id"));
  if (idx === -1) return c.json({ error: "Not found" }, 404);
  const body = await c.req.json();
  const parsed = PromptSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid" }, 400);
  store[idx] = { ...store[idx], ...parsed.data };
  return c.json(store[idx]);
});

prompts.delete("/:id", (c) => {
  const idx = store.findIndex((p) => p.id === c.req.param("id"));
  if (idx === -1) return c.json({ error: "Not found" }, 404);
  store.splice(idx, 1);
  return c.json({ ok: true });
});

prompts.post("/optimize", async (c) => {
  const { content, mode } = await c.req.json();
  if (!content) return c.json({ error: "content required" }, 400);

  const modes: Record<string, string> = {
    grammar: "Improved grammar and clarity version of the prompt.",
    structure: "Restructured prompt with clearer sections and instructions.",
    reasoning: "Prompt enhanced with chain-of-thought and reasoning cues.",
    shorten: "Condensed version of the prompt.",
    expand: "Expanded prompt with more detail and constraints.",
    professional: "Professional-tone rewrite of the prompt.",
    creative: "Creative-tone rewrite of the prompt.",
    technical: "Technical-tone rewrite of the prompt.",
    academic: "Academic-tone rewrite of the prompt.",
  };

  return c.json({
    original: content,
    optimized: `[${mode ?? "structure"}] ${modes[mode] ?? modes.structure}\n\n---\n${content}`,
    mode: mode ?? "structure",
  });
});

export default prompts;
