import { Hono } from "hono";
import { listFiles, getFile, addFile, deleteFile, searchFiles } from "../lib/files.js";

const files = new Hono();
const DEMO = "demo-user";

files.get("/", (c) => {
  const folder = c.req.query("folder") || undefined;
  const q = c.req.query("q");
  if (q) return c.json({ files: searchFiles(DEMO, q) });
  return c.json({ files: listFiles(DEMO, folder) });
});

files.get("/:id", (c) => {
  const f = getFile(c.req.param("id"), DEMO);
  if (!f) return c.json({ error: "Not found" }, 404);
  return c.json(f);
});

files.post("/", async (c) => {
  const body = await c.req.json();
  if (!body.name || body.content === undefined) return c.json({ error: "name and content required" }, 400);
  return c.json(addFile({ userId: DEMO, name: body.name, mimeType: body.mimeType || "text/plain", size: body.size || body.content.length, content: body.content, folder: body.folder, tags: body.tags }), 201);
});

files.delete("/:id", (c) => {
  if (!deleteFile(c.req.param("id"), DEMO)) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

export default files;
