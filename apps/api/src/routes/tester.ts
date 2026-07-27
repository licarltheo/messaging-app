import { Hono } from "hono";
import { z } from "zod";
import { getProvider } from "../providers/registry.js";
import { getDecryptedKey, getKeyRecord, markKeyResult } from "../lib/keys.js";

const tester = new Hono();
const DEMO_USER = "demo-user";

const TestSchema = z.object({
  prompt: z.string().min(1),
  system: z.string().optional(),
  targets: z
    .array(z.object({ provider: z.string(), model: z.string() }))
    .min(1)
    .max(8),
  temperature: z.number().optional().default(0.7),
  maxTokens: z.number().optional(),
});

tester.post("/run", async (c) => {
  const body = await c.req.json();
  const parsed = TestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid", details: parsed.error.flatten() }, 400);
  }

  const { prompt, system, targets, temperature, maxTokens } = parsed.data;
  const messages = [
    ...(system ? [{ role: "system" as const, content: system }] : []),
    { role: "user" as const, content: prompt },
  ];

  const results = await Promise.all(
    targets.map(async (t) => {
      const provider = getProvider(t.provider);
      if (!provider) {
        return {
          provider: t.provider,
          model: t.model,
          ok: false,
          error: "Unknown provider",
          content: null,
          latencyMs: 0,
          usage: null,
          estimatedCostUsd: null,
        };
      }
      const apiKey = getDecryptedKey(t.provider, DEMO_USER);
      if (!apiKey) {
        return {
          provider: t.provider,
          model: t.model,
          ok: false,
          error: "No API key configured",
          content: null,
          latencyMs: 0,
          usage: null,
          estimatedCostUsd: null,
        };
      }
      const record = getKeyRecord(t.provider, DEMO_USER);
      const start = Date.now();
      try {
        const result = await provider.chat(
          { messages, model: t.model, temperature, maxTokens, stream: false },
          apiKey
        );
        if (record) markKeyResult(record.id, { success: true, latencyMs: result.latencyMs });
        return {
          provider: t.provider,
          model: result.model,
          ok: true,
          error: null,
          content: result.content,
          latencyMs: result.latencyMs,
          usage: result.usage,
          estimatedCostUsd: result.estimatedCostUsd,
          finishReason: result.finishReason,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (record) {
          markKeyResult(record.id, { success: false, latencyMs: Date.now() - start, error: msg });
        }
        return {
          provider: t.provider,
          model: t.model,
          ok: false,
          error: msg,
          content: null,
          latencyMs: Date.now() - start,
          usage: null,
          estimatedCostUsd: null,
        };
      }
    })
  );

  return c.json({ results });
});

export default tester;
