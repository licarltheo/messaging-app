/**
 * OpenAI-compatible provider base.
 * Used by: OpenAI, Azure OpenAI, xAI Grok, DeepSeek, Mistral, Groq,
 * Together AI, OpenRouter, Ollama, Cohere, and any OpenAI-spec endpoint.
 */
import type {
  AIProvider,
  ChatCompletionRequest,
  ChatCompletionResult,
  StreamChunk,
  ModelInfo,
  Usage,
} from "./types.js";

export interface OpenAICompatibleConfig {
  id: string;
  name: string;
  baseUrl: string;
  defaultModels: ModelInfo[];
  chatPath?: string;
  headers?: Record<string, string>;
  costs?: Record<string, { input: number; output: number }>;
}

export function createOpenAICompatibleProvider(cfg: OpenAICompatibleConfig): AIProvider {
  const chatPath = cfg.chatPath ?? "/chat/completions";

  async function request(
    apiKey: string,
    body: Record<string, unknown>,
    stream: boolean,
    signal?: AbortSignal
  ): Promise<Response> {
    const url = `${cfg.baseUrl.replace(/\/$/, "")}${chatPath}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...cfg.headers,
      },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${cfg.name} API ${res.status}: ${text.slice(0, 500)}`);
    }
    return res;
  }

  function estimateCost(usage: Usage, model: string): number | null {
    const c = cfg.costs?.[model];
    if (!c) return null;
    return (usage.promptTokens / 1e6) * c.input + (usage.completionTokens / 1e6) * c.output;
  }

  return {
    id: cfg.id,
    name: cfg.name,
    supportsStreaming: true,

    async listModels(apiKey: string): Promise<ModelInfo[]> {
      try {
        const url = `${cfg.baseUrl.replace(/\/$/, "")}/models`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${apiKey}`, ...cfg.headers },
        });
        if (!res.ok) return cfg.defaultModels;
        const data = (await res.json()) as { data?: { id: string }[] };
        if (!data.data?.length) return cfg.defaultModels;
        return data.data.map((m) => ({
          id: m.id,
          name: m.id,
          ...(cfg.defaultModels.find((d) => d.id === m.id) ?? {}),
        }));
      } catch {
        return cfg.defaultModels;
      }
    },

    async chat(req: ChatCompletionRequest, apiKey: string): Promise<ChatCompletionResult> {
      const start = Date.now();
      const body = {
        model: req.model,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens,
        top_p: req.topP,
        stop: req.stop,
        stream: false,
      };
      const res = await request(apiKey, body, false);
      const data = (await res.json()) as {
        id: string;
        model: string;
        choices: { message: { content: string }; finish_reason: string }[];
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      };
      const latencyMs = Date.now() - start;
      const usage: Usage = {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      };
      return {
        id: data.id,
        model: data.model ?? req.model,
        provider: cfg.id,
        content: data.choices?.[0]?.message?.content ?? "",
        finishReason: data.choices?.[0]?.finish_reason ?? null,
        usage,
        latencyMs,
        estimatedCostUsd: estimateCost(usage, req.model),
      };
    },

    async *chatStream(
      req: ChatCompletionRequest,
      apiKey: string
    ): AsyncGenerator<StreamChunk, void, unknown> {
      const body = {
        model: req.model,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens,
        top_p: req.topP,
        stop: req.stop,
        stream: true,
        stream_options: { include_usage: true },
      };
      const res = await request(apiKey, body, true);
      if (!res.body) throw new Error("No response body for stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamId = `chatcmpl-${Date.now()}`;
      let finalUsage: Usage | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") return;

          try {
            const json = JSON.parse(payload) as {
              id?: string;
              choices?: { delta?: { content?: string }; finish_reason?: string | null }[];
              usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
            };
            if (json.id) streamId = json.id;
            if (json.usage) {
              finalUsage = {
                promptTokens: json.usage.prompt_tokens,
                completionTokens: json.usage.completion_tokens,
                totalTokens: json.usage.total_tokens,
              };
            }
            const delta = json.choices?.[0]?.delta?.content ?? "";
            const finishReason = json.choices?.[0]?.finish_reason ?? null;
            if (delta || finishReason) {
              yield {
                id: streamId,
                delta,
                finishReason,
                usage: finishReason ? finalUsage : undefined,
              };
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    },

    async testConnection(apiKey: string) {
      const start = Date.now();
      try {
        await this.chat(
          {
            messages: [{ role: "user", content: "ping" }],
            model: cfg.defaultModels[0]?.id ?? "gpt-4o-mini",
            maxTokens: 5,
            stream: false,
          },
          apiKey
        );
        return { ok: true, latencyMs: Date.now() - start };
      } catch (e) {
        return {
          ok: false,
          latencyMs: Date.now() - start,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    },

    estimateCost,
  };
}
