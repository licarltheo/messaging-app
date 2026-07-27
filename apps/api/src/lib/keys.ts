import { encrypt, decrypt } from "./crypto.js";

export interface StoredKey {
  id: string;
  userId: string;
  provider: string;
  label: string;
  encryptedKey: string;
  isDefault: boolean;
  lastSuccessAt: string | null;
  lastError: string | null;
  lastLatencyMs: number | null;
  createdAt: string;
  updatedAt: string;
}

const store = new Map<string, StoredKey>();

export function addKey(input: {
  userId: string;
  provider: string;
  label?: string;
  apiKey: string;
  isDefault?: boolean;
}): StoredKey {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  if (input.isDefault) {
    for (const [k, v] of store) {
      if (v.userId === input.userId && v.provider === input.provider) {
        store.set(k, { ...v, isDefault: false });
      }
    }
  }
  const record: StoredKey = {
    id,
    userId: input.userId,
    provider: input.provider,
    label: input.label ?? input.provider,
    encryptedKey: encrypt(input.apiKey),
    isDefault: input.isDefault ?? true,
    lastSuccessAt: null,
    lastError: null,
    lastLatencyMs: null,
    createdAt: now,
    updatedAt: now,
  };
  store.set(id, record);
  return record;
}

export function updateKey(
  id: string,
  userId: string,
  patch: { label?: string; apiKey?: string; isDefault?: boolean }
): StoredKey | null {
  const existing = store.get(id);
  if (!existing || existing.userId !== userId) return null;
  if (patch.isDefault) {
    for (const [k, v] of store) {
      if (v.userId === userId && v.provider === existing.provider && k !== id) {
        store.set(k, { ...v, isDefault: false });
      }
    }
  }
  const updated: StoredKey = {
    ...existing,
    label: patch.label ?? existing.label,
    encryptedKey: patch.apiKey ? encrypt(patch.apiKey) : existing.encryptedKey,
    isDefault: patch.isDefault ?? existing.isDefault,
    updatedAt: new Date().toISOString(),
  };
  store.set(id, updated);
  return updated;
}

export function deleteKey(id: string, userId: string): boolean {
  const existing = store.get(id);
  if (!existing || existing.userId !== userId) return false;
  store.delete(id);
  return true;
}

export function listKeys(userId: string): Omit<StoredKey, "encryptedKey">[] {
  return [...store.values()]
    .filter((k) => k.userId === userId)
    .map(({ encryptedKey: _, ...rest }) => rest);
}

export function getDecryptedKey(provider: string, userId: string): string | null {
  const keys = [...store.values()].filter(
    (k) => k.userId === userId && k.provider === provider
  );
  const preferred = keys.find((k) => k.isDefault) ?? keys[0];
  if (!preferred) return null;
  try {
    return decrypt(preferred.encryptedKey);
  } catch {
    return null;
  }
}

export function getKeyRecord(provider: string, userId: string): StoredKey | null {
  const keys = [...store.values()].filter(
    (k) => k.userId === userId && k.provider === provider
  );
  return keys.find((k) => k.isDefault) ?? keys[0] ?? null;
}

export function markKeyResult(
  id: string,
  result: { success: boolean; latencyMs?: number; error?: string }
) {
  const k = store.get(id);
  if (!k) return;
  store.set(id, {
    ...k,
    lastSuccessAt: result.success ? new Date().toISOString() : k.lastSuccessAt,
    lastError: result.success ? null : result.error ?? "Unknown error",
    lastLatencyMs: result.latencyMs ?? k.lastLatencyMs,
    updatedAt: new Date().toISOString(),
  });
}

export function toPublic(k: StoredKey) {
  const { encryptedKey: _, ...rest } = k;
  return rest;
}
