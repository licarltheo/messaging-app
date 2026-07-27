import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import chat from "./routes/chat.js";
import prompts from "./routes/prompts.js";
import keys from "./routes/keys.js";
import tester from "./routes/tester.js";
import health from "./routes/health.js";
import { getAllProviderIds, getProvider } from "./providers/registry.js";

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

app.get("/health", (c) =>
  c.json({ status: "ok", service: "licarl-api", version: "1.1.0", providers: getAllProviderIds() })
);

app.get("/api/v1/providers", (c) => {
  const list = getAllProviderIds().map((id) => {
    const p = getProvider(id)!;
    return { id: p.id, name: p.name, supportsStreaming: p.supportsStreaming };
  });
  return c.json({ providers: list });
});

app.route("/api/v1/chat", chat);
app.route("/api/v1/prompts", prompts);
app.route("/api/v1/keys", keys);
app.route("/api/v1/test", tester);
app.route("/api/v1/status", health);

app.get("/api/v1/me", (c) =>
  c.json({ message: "Attach Supabase JWT middleware to protect this route" })
);

const port = Number(process.env.PORT) || 8787;
console.log(`Licarl API v1.1 running on http://localhost:${port}`);
console.log(`Providers: ${getAllProviderIds().join(", ")}`);

serve({
  fetch: app.fetch,
  port,
});
