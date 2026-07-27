import { Hono } from "hono";
import { getAllProviderIds, getProvider } from "../providers/registry.js";
import { listKeys, getKeyRecord } from "../lib/keys.js";

const health = new Hono();
const DEMO_USER = "demo-user";

health.get("/providers", async (c) => {
  const keys = listKeys(DEMO_USER);
  const status = getAllProviderIds().map((id) => {
    const p = getProvider(id)!;
    const record = getKeyRecord(id, DEMO_USER);
    const keyMeta = keys.find((k) => k.provider === id);
    return {
      id: p.id,
      name: p.name,
      supportsStreaming: p.supportsStreaming,
      connected: !!record,
      keyValid: record ? !record.lastError : false,
      lastSuccessAt: record?.lastSuccessAt ?? null,
      lastError: record?.lastError ?? null,
      lastLatencyMs: record?.lastLatencyMs ?? null,
      label: keyMeta?.label ?? null,
    };
  });
  return c.json({ providers: status });
});

health.get("/providers/:id/models", async (c) => {
  const id = c.req.param("id");
  const p = getProvider(id);
  if (!p) return c.json({ error: "Unknown provider" }, 404);
  const models = await p.listModels("").catch(() => []);
  return c.json({ models });
});

export default health;
