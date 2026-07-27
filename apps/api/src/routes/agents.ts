import { Hono } from "hono";
import { z } from "zod";
import {
  listAgents, getAgent, createAgent, updateAgent, deleteAgent, bumpAgentMessages,
} from "../lib/agents.js";
import { getProvider } from "../providers/registry.js";
import { getDecryptedKey } from "../lib/keys.js";

const agents = new Hono();
const DEMO = "demo-user";

agents.get("/", (c) => c.json({ agents: listAgents(DEMO) }));

agents.get("/:id", (c) => {
  const a = getAgent(c.req.param("id"), DEMO);
  if (!a) return c.json({ error: "Not found" }, 404);
  return c.json(a);
});

agents.post("/", async (c) => {
  const body = await c.req.json();
  const schema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    avatar: z.string().optional(),
    personality: z.string().optional(),
    systemPrompt: z.string().optional(),
    provider: z.string().optional(),
    model: z.string().optional(),
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    tools: z.array(z.string()).optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  return c.json(createAgent(DEMO, parsed.data), 201);
});

agents.put("/:id", async (c) => {
  const body = await c.req.json();
  const a = updateAgent(c.req.param("id"), DEMO, body);
  if (!a) return c.json({ error: "Not found" }, 404);
  return c.json(a);
});

agents.delete("/:id", (c) => {
  if (!deleteAgent(c.req.param("id"), DEMO)) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

agents.post("/:id/chat", async (c) => {
  const agent = getAgent(c.req.param("id"), DEMO);
  if (!agent) return c.json({ error: "Not found" }, 404);
  const body = await c.req.json();
  const messages = body.messages as { role: string; content: string }[];
  const stream = body.stream !== false;

  const system = [
    agent.systemPrompt,
    agent.personality ? `Personality: ${agent.personality}` : "",
    agent.memory.longTerm.length ? `Long-term memory:\n${agent.memory.longTerm.join("\n")}` : "",
  ].filter(Boolean).join("\n\n");

  const provider = getProvider(agent.provider);
  if (!provider) return c.json({ error: "Provider unavailable" }, 400);
  const apiKey = getDecryptedKey(agent.provider, DEMO);
  if (!apiKey) return c.json({ error: "No API key for agent provider" }, 401);

  const fullMessages = [
    { role: "system" as const, content: system },
    ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  bumpAgentMessages(agent.id);

  if (stream) {
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of provider.chatStream(
            { messages: fullMessages, model: agent.model, temperature: agent.temperature, maxTokens: agent.maxTokens, stream: true },
            apiKey
          )) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk.delta }, finish_reason: chunk.finishReason }] })}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });
    return c.body(readable);
  }

  const result = await provider.chat(
    { messages: fullMessages, model: agent.model, temperature: agent.temperature, maxTokens: agent.maxTokens },
    apiKey
  );
  return c.json(result);
});

export default agents;
