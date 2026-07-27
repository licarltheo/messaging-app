import { Hono } from "hono";
import { getAnalytics, getAuditLog, track } from "../lib/analytics.js";
import { listNotifications, unreadCount, markRead, markAllRead, notify } from "../lib/notifications.js";

const analytics = new Hono();
const DEMO = "demo-user";

analytics.get("/", (c) => c.json(getAnalytics(DEMO)));
analytics.get("/audit", (c) => c.json({ logs: getAuditLog(DEMO, c.req.query("type") || undefined) }));
analytics.post("/track", async (c) => {
  const body = await c.req.json();
  track(DEMO, body.type || "custom", body.meta || {});
  return c.json({ ok: true });
});
analytics.get("/notifications", (c) =>
  c.json({ notifications: listNotifications(DEMO), unread: unreadCount(DEMO) })
);
analytics.post("/notifications/:id/read", (c) => {
  markRead(c.req.param("id"), DEMO);
  return c.json({ ok: true });
});
analytics.post("/notifications/read-all", (c) => {
  markAllRead(DEMO);
  return c.json({ ok: true });
});

notify(DEMO, "Welcome to Licarl", "Your AI workspace is ready. Add API keys in Settings.", "success");
notify(DEMO, "Workflow tip", "Create multi-step AI pipelines in the Workflow builder.", "info");

export default analytics;
