import { Hono } from "hono";
import {
  listWorkflows, getWorkflow, createWorkflow, updateWorkflow, deleteWorkflow,
  duplicateWorkflow, runWorkflow, getRun,
} from "../lib/workflows.js";
import { getProvider } from "../providers/registry.js";
import { getDecryptedKey } from "../lib/keys.js";

const workflows = new Hono();
const DEMO = "demo-user";

workflows.get("/", (c) => c.json({ workflows: listWorkflows(DEMO) }));
workflows.get("/:id", (c) => {
  const w = getWorkflow(c.req.param("id"), DEMO);
  if (!w) return c.json({ error: "Not found" }, 404);
  return c.json(w);
});
workflows.post("/", async (c) => {
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "name required" }, 400);
  return c.json(createWorkflow(DEMO, body), 201);
});
workflows.put("/:id", async (c) => {
  const w = updateWorkflow(c.req.param("id"), DEMO, await c.req.json());
  if (!w) return c.json({ error: "Not found" }, 404);
  return c.json(w);
});
workflows.delete("/:id", (c) => {
  if (!deleteWorkflow(c.req.param("id"), DEMO)) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});
workflows.post("/:id/duplicate", (c) => {
  const w = duplicateWorkflow(c.req.param("id"), DEMO);
  if (!w) return c.json({ error: "Not found" }, 404);
  return c.json(w, 201);
});
workflows.post("/:id/run", async (c) => {
  const body = await c.req.json();
  try {
    const run = await runWorkflow(c.req.param("id"), DEMO, body.input ?? "", async (prompt, provider, model) => {
      const p = getProvider(provider);
      if (!p) throw new Error(`Unknown provider ${provider}`);
      const key = getDecryptedKey(provider, DEMO);
      if (!key) throw new Error(`No API key for ${provider}`);
      const result = await p.chat({ messages: [{ role: "user", content: prompt }], model, maxTokens: 1024 }, key);
      return result.content;
    });
    return c.json(run);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
workflows.get("/runs/:runId", (c) => {
  const r = getRun(c.req.param("runId"));
  if (!r) return c.json({ error: "Not found" }, 404);
  return c.json(r);
});

export default workflows;
