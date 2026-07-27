import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import chat from "./routes/chat.js";
import prompts from "./routes/prompts.js";

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

app.get("/health", (c) => c.json({ status: "ok", service: "licarl-api", version: "1.0.0" }));

app.get("/api/v1/providers", (c) =>
  c.json({
    providers: [
      { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "o1", "o1-mini"] },
      { id: "anthropic", name: "Claude", models: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229"] },
      { id: "google", name: "Gemini", models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"] },
      { id: "xai", name: "Grok", models: ["grok-2", "grok-2-mini", "grok-beta"] },
      { id: "deepseek", name: "DeepSeek", models: ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"] },
      { id: "mistral", name: "Mistral", models: ["mistral-large-latest", "codestral-latest"] },
      { id: "openrouter", name: "OpenRouter", models: ["auto"] },
      { id: "ollama", name: "Ollama", models: ["llama3.1", "qwen2.5", "mistral"] },
    ],
  })
);

app.route("/api/v1/chat", chat);
app.route("/api/v1/prompts", prompts);

app.get("/api/v1/me", (c) =>
  c.json({ message: "Attach Supabase JWT middleware to protect this route" })
);

const port = Number(process.env.PORT) || 8787;
console.log(`Licarl API running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
