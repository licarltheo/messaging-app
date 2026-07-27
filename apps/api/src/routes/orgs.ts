import { Hono } from "hono";
import { listOrgs, getOrg, createOrg, inviteMember, listInvites, updateMemberRole } from "../lib/orgs.js";

const orgRoutes = new Hono();
const DEMO = "demo-user";

orgRoutes.get("/", (c) => c.json({ organizations: listOrgs(DEMO) }));
orgRoutes.get("/:id", (c) => {
  const o = getOrg(c.req.param("id"));
  if (!o) return c.json({ error: "Not found" }, 404);
  return c.json(o);
});
orgRoutes.post("/", async (c) => {
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "name required" }, 400);
  return c.json(createOrg(DEMO, "demo@licarl.app", body.name, body.userName || "Demo User"), 201);
});
orgRoutes.post("/:id/invite", async (c) => {
  const body = await c.req.json();
  if (!body.email) return c.json({ error: "email required" }, 400);
  return c.json(inviteMember(c.req.param("id"), body.email, body.role || "viewer"), 201);
});
orgRoutes.get("/:id/invites", (c) => c.json({ invites: listInvites(c.req.param("id")) }));
orgRoutes.patch("/:id/members/:userId", async (c) => {
  const body = await c.req.json();
  const o = updateMemberRole(c.req.param("id"), c.req.param("userId"), body.role);
  if (!o) return c.json({ error: "Not found" }, 404);
  return c.json(o);
});

export default orgRoutes;
