export interface Agent {
  id: string;
  userId: string;
  name: string;
  description: string;
  avatar: string;
  personality: string;
  systemPrompt: string;
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  tools: string[];
  knowledgeFileIds: string[];
  memory: { longTerm: string[]; temporary: string[] };
  version: number;
  versions: { version: number; systemPrompt: string; savedAt: string }[];
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

const store = new Map<string, Agent>();

export function listAgents(userId: string): Agent[] {
  return [...store.values()].filter((a) => a.userId === userId);
}

export function getAgent(id: string, userId: string): Agent | null {
  const a = store.get(id);
  return a && a.userId === userId ? a : null;
}

export function createAgent(userId: string, input: Partial<Agent> & { name: string }): Agent {
  const now = new Date().toISOString();
  const agent: Agent = {
    id: crypto.randomUUID(),
    userId,
    name: input.name,
    description: input.description ?? "",
    avatar: input.avatar ?? "🤖",
    personality: input.personality ?? "Helpful and professional",
    systemPrompt: input.systemPrompt ?? "You are a helpful AI assistant.",
    provider: input.provider ?? "openai",
    model: input.model ?? "gpt-4o-mini",
    temperature: input.temperature ?? 0.7,
    maxTokens: input.maxTokens ?? 4096,
    tools: input.tools ?? [],
    knowledgeFileIds: input.knowledgeFileIds ?? [],
    memory: { longTerm: [], temporary: [] },
    version: 1,
    versions: [],
    messageCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  store.set(agent.id, agent);
  return agent;
}

export function updateAgent(id: string, userId: string, patch: Partial<Agent>): Agent | null {
  const a = getAgent(id, userId);
  if (!a) return null;
  if (patch.systemPrompt && patch.systemPrompt !== a.systemPrompt) {
    a.versions.push({ version: a.version, systemPrompt: a.systemPrompt, savedAt: a.updatedAt });
    a.version += 1;
  }
  Object.assign(a, patch, { updatedAt: new Date().toISOString() });
  store.set(id, a);
  return a;
}

export function deleteAgent(id: string, userId: string): boolean {
  const a = getAgent(id, userId);
  if (!a) return false;
  store.delete(id);
  return true;
}

export function bumpAgentMessages(id: string) {
  const a = store.get(id);
  if (a) {
    a.messageCount += 1;
    a.updatedAt = new Date().toISOString();
  }
}
