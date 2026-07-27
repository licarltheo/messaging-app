import { Hono } from "hono";
import { z } from "zod";

const chat = new Hono();

const ChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    })
  ),
  provider: z.string(),
  model: z.string(),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  stream: z.boolean().optional().default(true),
});

/**
 * POST /api/v1/chat/completions
 * Multi-provider chat endpoint.
 * In production: route to OpenAI / Anthropic / Gemini / xAI / etc. adapters
 * based on `provider`, stream SSE tokens back.
 */
chat.post("/completions", async (c) => {
  const body = await c.req.json();
  const parsed = ChatSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
  }

  const { messages, provider, model, temperature, stream } = parsed.data;
  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  const reply = {
    id: `chatcmpl-${crypto.randomUUID().slice(0, 8)}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    provider,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: `Scaffold reply from ${provider}/${model} (temp=${temperature}).\n\nYou said: "${lastUser?.content ?? ""}"\n\nWire the real adapter for this provider next.`,
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 42,
      completion_tokens: 28,
      total_tokens: 70,
    },
  };

  if (stream) {
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");

    const encoder = new TextEncoder();
    const streamBody = new ReadableStream({
      start(controller) {
        const content = reply.choices[0].message.content;
        const chunks = content.split(" ");
        let i = 0;
        const interval = setInterval(() => {
          if (i >= chunks.length) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            clearInterval(interval);
            return;
          }
          const delta = (i === 0 ? "" : " ") + chunks[i];
          const payload = {
            id: reply.id,
            object: "chat.completion.chunk",
            choices: [{ index: 0, delta: { content: delta }, finish_reason: null }],
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          i++;
        }, 30);
      },
    });

    return c.body(streamBody);
  }

  return c.json(reply);
});

export default chat;
