import type {
  AIProvider,
  ChatCompletionRequest,
  ChatCompletionResult,
  StreamChunk,
  ModelInfo,
  Usage,
} from "./types.js";

const MODELS: ModelInfo[] = [
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", contextWindow: 200000, inputCostPer1M: 3, outputCostPer1M: 15 },
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", contextWindow: 200000, inputCostPer1M: 3, outputCostPer1M: 15 },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", contextWindow: 200000, inputCostPer1M: 0.8, outputCostPer1M: 4 },
  { id: "claude-3-opus-20240229", name: "Claude 3 Opus", contextWindow: 200000, inputCostPer1M: 15, outputCostPer1M: 75 },
];

const BASE = "https://api.anthropic.com/v1";

function toAnthropicMessages(messages: ChatCompletionRequest["messages"]) {
  let system: string | undefined;
  const msgs: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of messages) {
    if (m.role === "system") {
      system = (system ? system + "\n" : "") + m.content;
    } else {
      msgs.push({ role: m.role as "user" | "assistant", content: m.content });
    }
  }
  return { system, messages: msgs };
}

function cost(usage: Usage, model: string): number | null {
  const m = MODELS.find((x) => x.id === model);
  if (!m?.inputCostPer1M) return null;
  return (usage.promptTokens / 1e6) * m.inputCostPer1M + (usage.completionTokens / 1e6) * (m.outputCostPer1M ?? 0);
}

export const anthropicProvider: AIProvider = {
  id: "anthropic",
  name: "Claude",
  supportsStreaming: true,

  async listModels() {
    return MODELS;
  },

  async chat(req, apiKey) {
    const start = Date.now();
    const { system, messages } = toAnthropicMessages(req.messages);
    const res = await fetch(`${BASE}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: req.model,
        max_tokens: req.maxTokens ?? 4096,
        temperature: req.temperature ?? 0.7,
        system,
        messages,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Anthropic ${res.status}: ${t.slice(0, 400)}`);
    }
    const data = (await res.json()) as {
      id: string;
      model: string;
      content: { type: string; text?: string }[];
      stop_reason: string;
      usage: { input_tokens: number; output_tokens: number };
    };
    const usage: Usage = {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    };
    return {
      id: data.id,
      model: data.model,
      provider: "anthropic",
      content: data.content?.map((c) => c.text ?? "").join("") ?? "",
      finishReason: data.stop_reason,
      usage,
      latencyMs: Date.now() - start,
      estimatedCostUsd: cost(usage, req.model),
    };
  },

  async *chatStream(req, apiKey) {
    const { system, messages } = toAnthropicMessages(req.messages);
    const res = await fetch(`${BASE}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: req.model,
        max_tokens: req.maxTokens ?? 4096,
        temperature: req.temperature ?? 0.7,
        system,
        messages,
        stream: true,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Anthropic ${res.status}: ${t.slice(0, 400)}`);
    }
    if (!res.body) throw new Error("No body");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let id = `msg-${Date.now()}`;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const payload = t.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload) as {
            type: string;
            message?: { id: string };
            delta?: { type: string; text?: string; stop_reason?: string };
          };
          if (ev.type === "message_start" && ev.message?.id) id = ev.message.id;
          if (ev.type === "content_block_delta" && ev.delta?.text) {
            yield { id, delta: ev.delta.text, finishReason: null };
          }
          if (ev.type === "message_delta" && ev.delta?.stop_reason) {
            yield { id, delta: "", finishReason: ev.delta.stop_reason };
          }
        } catch { /* skip */ }
      }
    }
  },

  async testConnection(apiKey) {
    const start = Date.now();
    try {
      await this.chat(
        { messages: [{ role: "user", content: "hi" }], model: MODELS[2].id, maxTokens: 5 },
        apiKey
      );
      return { ok: true, latencyMs: Date.now() - start };
    } catch (e) {
      return { ok: false, latencyMs: Date.now() - start, error: e instanceof Error ? e.message : String(e) };
    }
  },

  estimateCost: cost,
};
