import type {
  AIProvider,
  ChatCompletionRequest,
  ChatCompletionResult,
  StreamChunk,
  ModelInfo,
  Usage,
} from "./types.js";

const MODELS: ModelInfo[] = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", contextWindow: 1000000, inputCostPer1M: 0.1, outputCostPer1M: 0.4 },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", contextWindow: 2000000, inputCostPer1M: 1.25, outputCostPer1M: 5 },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", contextWindow: 1000000, inputCostPer1M: 0.075, outputCostPer1M: 0.3 },
];

const BASE = "https://generativelanguage.googleapis.com/v1beta";

function toGeminiContents(messages: ChatCompletionRequest["messages"]) {
  const systemParts: string[] = [];
  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (const m of messages) {
    if (m.role === "system") {
      systemParts.push(m.content);
    } else {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    }
  }
  return {
    systemInstruction: systemParts.length ? { parts: [{ text: systemParts.join("\n") }] } : undefined,
    contents,
  };
}

function cost(usage: Usage, model: string): number | null {
  const m = MODELS.find((x) => x.id === model);
  if (!m?.inputCostPer1M) return null;
  return (usage.promptTokens / 1e6) * m.inputCostPer1M + (usage.completionTokens / 1e6) * (m.outputCostPer1M ?? 0);
}

export const geminiProvider: AIProvider = {
  id: "google",
  name: "Gemini",
  supportsStreaming: true,

  async listModels() {
    return MODELS;
  },

  async chat(req, apiKey) {
    const start = Date.now();
    const { systemInstruction, contents } = toGeminiContents(req.messages);
    const url = `${BASE}/models/${req.model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction,
        generationConfig: {
          temperature: req.temperature ?? 0.7,
          maxOutputTokens: req.maxTokens ?? 8192,
        },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Gemini ${res.status}: ${t.slice(0, 400)}`);
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    const usage: Usage = {
      promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
    };
    return {
      id: `gemini-${Date.now()}`,
      model: req.model,
      provider: "google",
      content: text,
      finishReason: data.candidates?.[0]?.finishReason ?? null,
      usage,
      latencyMs: Date.now() - start,
      estimatedCostUsd: cost(usage, req.model),
    };
  },

  async *chatStream(req, apiKey) {
    const { systemInstruction, contents } = toGeminiContents(req.messages);
    const url = `${BASE}/models/${req.model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction,
        generationConfig: {
          temperature: req.temperature ?? 0.7,
          maxOutputTokens: req.maxTokens ?? 8192,
        },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Gemini ${res.status}: ${t.slice(0, 400)}`);
    }
    if (!res.body) throw new Error("No body");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const id = `gemini-${Date.now()}`;

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
        if (!payload) continue;
        try {
          const json = JSON.parse(payload) as {
            candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
          };
          const delta = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
          const fr = json.candidates?.[0]?.finishReason ?? null;
          if (delta || fr) yield { id, delta, finishReason: fr };
        } catch { /* skip */ }
      }
    }
  },

  async testConnection(apiKey) {
    const start = Date.now();
    try {
      await this.chat(
        { messages: [{ role: "user", content: "hi" }], model: "gemini-1.5-flash", maxTokens: 5 },
        apiKey
      );
      return { ok: true, latencyMs: Date.now() - start };
    } catch (e) {
      return { ok: false, latencyMs: Date.now() - start, error: e instanceof Error ? e.message : String(e) };
    }
  },

  estimateCost: cost,
};
