import { Hono } from "hono";
import { z } from "zod";
import { getProvider } from "../providers/registry.js";
import { getDecryptedKey, getKeyRecord, markKeyResult } from "../lib/keys.js";

const chat = new Hono();
const DEMO_USER = "demo-user";

const ChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    })
  ),
  provider: z.string(),
  model: z.string(),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().optional(),
  stream: z.boolean().optional().default(true),
  apiKey: z.string().optional(),
});

chat.post("/completions", async (c) => {
  const body = await c.req.json();
  const parsed = ChatSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
  }

  const { messages, provider: providerId, model, temperature, maxTokens, stream, apiKey: bodyKey } =
    parsed.data;

  const provider = getProvider(providerId);
  if (!provider) {
    return c.json({ error: `Unknown provider: ${providerId}` }, 400);
  }

  const apiKey = bodyKey || getDecryptedKey(providerId, DEMO_USER);
  if (!apiKey) {
    return c.json(
      { error: `No API key for provider "${providerId}". Add one via Settings → API Keys.` },
      401
    );
  }

  const record = getKeyRecord(providerId, DEMO_USER);
  const start = Date.now();

  try {
    if (stream) {
      c.header("Content-Type", "text/event-stream");
      c.header("Cache-Control", "no-cache");
      c.header("Connection", "keep-alive");
      c.header("X-Accel-Buffering", "no");

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            let usage = null as
              | { promptTokens: number; completionTokens: number; totalTokens: number }
              | null;
            for await (const chunk of provider.chatStream(
              { messages, model, temperature, maxTokens, stream: true },
              apiKey
            )) {
              if (chunk.usage) usage = chunk.usage;
              const payload = {
                id: chunk.id,
                object: "chat.completion.chunk",
                provider: providerId,
                model,
                choices: [
                  {
                    index: 0,
                    delta: { content: chunk.delta },
                    finish_reason: chunk.finishReason,
                  },
                ],
                usage: chunk.usage
                  ? {
                      prompt_tokens: chunk.usage.promptTokens,
                      completion_tokens: chunk.usage.completionTokens,
                      total_tokens: chunk.usage.totalTokens,
                    }
                  : undefined,
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
            }
            const latencyMs = Date.now() - start;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  id: "meta",
                  object: "licarl.meta",
                  latencyMs,
                  estimatedCostUsd: usage ? provider.estimateCost(usage, model) : null,
                })}\n\n`
              )
            );
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            if (record) markKeyResult(record.id, { success: true, latencyMs });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
            );
            if (record) {
              markKeyResult(record.id, {
                success: false,
                latencyMs: Date.now() - start,
                error: msg,
              });
            }
          } finally {
            controller.close();
          }
        },
      });

      return c.body(readable);
    }

    const result = await provider.chat(
      { messages, model, temperature, maxTokens, stream: false },
      apiKey
    );
    if (record) markKeyResult(record.id, { success: true, latencyMs: result.latencyMs });
    return c.json({
      id: result.id,
      object: "chat.completion",
      provider: result.provider,
      model: result.model,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: result.content },
          finish_reason: result.finishReason,
        },
      ],
      usage: {
        prompt_tokens: result.usage.promptTokens,
        completion_tokens: result.usage.completionTokens,
        total_tokens: result.usage.totalTokens,
      },
      latencyMs: result.latencyMs,
      estimatedCostUsd: result.estimatedCostUsd,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (record) {
      markKeyResult(record.id, { success: false, latencyMs: Date.now() - start, error: msg });
    }
    return c.json({ error: msg }, 502);
  }
});

export default chat;
