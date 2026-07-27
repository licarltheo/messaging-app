/**
 * Unified AI Provider Interface — Licarl Prompt Maker
 * Every provider implements this contract.
 */

export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  topP?: number;
  stop?: string | string[];
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatCompletionResult {
  id: string;
  model: string;
  provider: string;
  content: string;
  finishReason: string | null;
  usage: Usage;
  latencyMs: number;
  estimatedCostUsd: number | null;
}

export interface StreamChunk {
  id: string;
  delta: string;
  finishReason: string | null;
  usage?: Usage;
}

export interface ModelInfo {
  id: string;
  name: string;
  contextWindow?: number;
  inputCostPer1M?: number;
  outputCostPer1M?: number;
}

export interface ProviderHealth {
  provider: string;
  connected: boolean;
  keyValid: boolean;
  lastSuccessAt: string | null;
  lastError: string | null;
  models: ModelInfo[];
  averageLatencyMs: number | null;
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly supportsStreaming: boolean;

  listModels(apiKey: string): Promise<ModelInfo[]>;
  chat(req: ChatCompletionRequest, apiKey: string): Promise<ChatCompletionResult>;
  chatStream(
    req: ChatCompletionRequest,
    apiKey: string
  ): AsyncGenerator<StreamChunk, void, unknown>;
  testConnection(apiKey: string): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
  estimateCost(usage: Usage, model: string): number | null;
}
