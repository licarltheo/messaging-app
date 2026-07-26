import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

const app = new Hono();

app.use("*", logger());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "https://licarl.app"],
    credentials: true,
  })
);

app.get("/health", (c) => c.json({ status: "ok", service: "licarl-api" }));

app.get("/api/v1/providers", (c) =>
  c.json({
    providers: [
      { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "o1"] },
      { id: "anthropic", name: "Claude", models: ["claude-3-5-sonnet", "claude-3-opus"] },
      { id: "google", name: "Gemini", models: ["gemini-1.5-pro", "gemini-1.5-flash"] },
      { id: "xai", name: "Grok", models: ["grok-2", "grok-beta"] },
      { id: "deepseek", name: "DeepSeek", models: ["deepseek-chat", "deepseek-coder"] },
      { id: "mistral", name: "Mistral", models: ["mistral-large", "codestral"] },
      { id: "openrouter", name: "OpenRouter", models: ["auto"] },
      { id: "ollama", name: "Ollama", models: ["llama3.1", "qwen2.5"] },
    ],
  })
);

app.get("/api/v1/me", (c) => c.json({ message: "Auth middleware + Supabase JWT required" }));

const port = Number(process.env.PORT) || 8787;
console.log(`Licarl API running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
