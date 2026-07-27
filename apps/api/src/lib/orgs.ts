export type Role = "owner" | "admin" | "editor" | "viewer";

export interface OrgMember {
  userId: string; email: string; name: string; role: Role; joinedAt: string;
}

export interface Organization {
  id: string; name: string; slug: string; plan: "free" | "pro" | "enterprise";
  members: OrgMember[]; departments: { id: string; name: string }[]; createdAt: string;
}

export interface Invitation {
  id: string; orgId: string; email: string; role: Role; status: "pending" | "accepted" | "revoked"; createdAt: string;
}

const orgs = new Map<string, Organization>();
const invites = new Map<string, Invitation>();

const demoId = crypto.randomUUID();
orgs.set(demoId, {
  id: demoId, name: "Licarl Demo Org", slug: "licarl-demo", plan: "pro",
  members: [{ userId: "demo-user", email: "demo@licarl.app", name: "Demo User", role: "owner", joinedAt: new Date().toISOString() }],
  departments: [{ id: crypto.randomUUID(), name: "Engineering" }, { id: crypto.randomUUID(), name: "Marketing" }],
  createdAt: new Date().toISOString(),
});

export function listOrgs(userId: string) {
  return [...orgs.values()].filter((o) => o.members.some((m) => m.userId === userId));
}
export function getOrg(id: string) { return orgs.get(id) ?? null; }

export function createOrg(userId: string, email: string, name: string, userName: string) {
  const id = crypto.randomUUID();
  const org: Organization = {
    id, name, slug: name.toLowerCase().replace(/\s+/g, "-").slice(0, 40), plan: "free",
    members: [{ userId, email, name: userName, role: "owner", joinedAt: new Date().toISOString() }],
    departments: [], createdAt: new Date().toISOString(),
  };
  orgs.set(id, org);
  return org;
}

export function inviteMember(orgId: string, email: string, role: Role) {
  const inv: Invitation = { id: crypto.randomUUID(), orgId, email, role, status: "pending", createdAt: new Date().toISOString() };
  invites.set(inv.id, inv);
  return inv;
}

export function listInvites(orgId: string) {
  return [...invites.values()].filter((i) => i.orgId === orgId);
}

export function updateMemberRole(orgId: string, userId: string, role: Role) {
  const org = orgs.get(orgId);
  if (!org) return null;
  const m = org.members.find((x) => x.userId === userId);
  if (!m) return null;
  m.role = role;
  return org;
}
