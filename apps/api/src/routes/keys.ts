import { Hono } from "hono";
import { z } from "zod";
import {
  addKey,
  updateKey,
  deleteKey,
  listKeys,
  getDecryptedKey,
  getKeyRecord,
  markKeyResult,
  toPublic,
} from "../lib/keys.js";
import { getProvider } from "../providers/registry.js";

const keys = new Hono();
const DEMO_USER = "demo-user";

const AddSchema = z.object({
  provider: z.string().min(1),
  apiKey: z.string().min(8),
  label: z.string().optional(),
  isDefault: z.boolean().optional(),
});

keys.get("/", (c) => {
  return c.json({ keys: listKeys(DEMO_USER) });
});

keys.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = AddSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid", details: parsed.error.flatten() }, 400);
  }
  const record = addKey({
    userId: DEMO_USER,
    provider: parsed.data.provider,
    apiKey: parsed.data.apiKey,
    label: parsed.data.label,
    isDefault: parsed.data.isDefault,
  });
  return c.json(toPublic(record), 201);
});

keys.put("/:id", async (c) => {
  const body = await c.req.json();
  const updated = updateKey(c.req.param("id"), DEMO_USER, body);
  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(toPublic(updated));
});

keys.delete("/:id", (c) => {
  const ok = deleteKey(c.req.param("id"), DEMO_USER);
  if (!ok) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

keys.post("/test", async (c) => {
  const body = await c.req.json();
  const providerId = body.provider as string;
  const provider = getProvider(providerId);
  if (!provider) return c.json({ error: "Unknown provider" }, 400);

  let apiKey = body.apiKey as string | undefined;
  const record = getKeyRecord(providerId, DEMO_USER);
  if (!apiKey && record) {
    apiKey = getDecryptedKey(providerId, DEMO_USER) ?? undefined;
  }
  if (!apiKey) return c.json({ error: "No API key provided or stored" }, 400);

  const result = await provider.testConnection(apiKey);
  if (record) {
    markKeyResult(record.id, {
      success: result.ok,
      latencyMs: result.latencyMs,
      error: result.error,
    });
  }
  return c.json(result);
});

export default keys;
