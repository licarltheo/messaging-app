import type { AIProvider, ModelInfo } from "./types.js";
import { createOpenAICompatibleProvider } from "./openai-compatible.js";
import { anthropicProvider } from "./anthropic.js";
import { geminiProvider } from "./gemini.js";

const openai = createOpenAICompatibleProvider({
  id: "openai",
  name: "OpenAI",
  baseUrl: "https://api.openai.com/v1",
  defaultModels: [
    { id: "gpt-4o", name: "GPT-4o", contextWindow: 128000, inputCostPer1M: 2.5, outputCostPer1M: 10 },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", contextWindow: 128000, inputCostPer1M: 0.15, outputCostPer1M: 0.6 },
    { id: "o1", name: "o1", contextWindow: 200000, inputCostPer1M: 15, outputCostPer1M: 60 },
    { id: "o1-mini", name: "o1 Mini", contextWindow: 128000, inputCostPer1M: 3, outputCostPer1M: 12 },
  ],
  costs: {
    "gpt-4o": { input: 2.5, output: 10 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    o1: { input: 15, output: 60 },
    "o1-mini": { input: 3, output: 12 },
  },
});

const azure = createOpenAICompatibleProvider({
  id: "azure",
  name: "Azure OpenAI",
  baseUrl: process.env.AZURE_OPENAI_ENDPOINT
    ? `${process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, "")}/openai/deployments`
    : "https://YOUR_RESOURCE.openai.azure.com/openai/deployments",
  defaultModels: [
    { id: "gpt-4o", name: "GPT-4o (Azure)" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini (Azure)" },
  ],
  chatPath: `/${process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o"}/chat/completions?api-version=2024-08-01-preview`,
});

const xai = createOpenAICompatibleProvider({
  id: "xai",
  name: "Grok",
  baseUrl: "https://api.x.ai/v1",
  defaultModels: [
    { id: "grok-2", name: "Grok 2", contextWindow: 131072 },
    { id: "grok-2-mini", name: "Grok 2 Mini" },
    { id: "grok-3", name: "Grok 3" },
    { id: "grok-beta", name: "Grok Beta" },
  ],
});

const deepseek = createOpenAICompatibleProvider({
  id: "deepseek",
  name: "DeepSeek",
  baseUrl: "https://api.deepseek.com",
  defaultModels: [
    { id: "deepseek-chat", name: "DeepSeek Chat", inputCostPer1M: 0.14, outputCostPer1M: 0.28 },
    { id: "deepseek-reasoner", name: "DeepSeek Reasoner", inputCostPer1M: 0.55, outputCostPer1M: 2.19 },
    { id: "deepseek-coder", name: "DeepSeek Coder" },
  ],
  costs: {
    "deepseek-chat": { input: 0.14, output: 0.28 },
    "deepseek-reasoner": { input: 0.55, output: 2.19 },
  },
});

const mistral = createOpenAICompatibleProvider({
  id: "mistral",
  name: "Mistral",
  baseUrl: "https://api.mistral.ai/v1",
  defaultModels: [
    { id: "mistral-large-latest", name: "Mistral Large", inputCostPer1M: 2, outputCostPer1M: 6 },
    { id: "mistral-small-latest", name: "Mistral Small", inputCostPer1M: 0.1, outputCostPer1M: 0.3 },
    { id: "codestral-latest", name: "Codestral" },
  ],
  costs: {
    "mistral-large-latest": { input: 2, output: 6 },
    "mistral-small-latest": { input: 0.1, output: 0.3 },
  },
});

const groq = createOpenAICompatibleProvider({
  id: "groq",
  name: "Groq",
  baseUrl: "https://api.groq.com/openai/v1",
  defaultModels: [
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B" },
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant" },
    { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
    { id: "gemma2-9b-it", name: "Gemma 2 9B" },
  ],
});

const together = createOpenAICompatibleProvider({
  id: "together",
  name: "Together AI",
  baseUrl: "https://api.together.xyz/v1",
  defaultModels: [
    { id: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", name: "Llama 3.1 70B Turbo" },
    { id: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", name: "Llama 3.1 8B Turbo" },
    { id: "Qwen/Qwen2.5-72B-Instruct-Turbo", name: "Qwen 2.5 72B" },
  ],
});

const openrouter = createOpenAICompatibleProvider({
  id: "openrouter",
  name: "OpenRouter",
  baseUrl: "https://openrouter.ai/api/v1",
  defaultModels: [
    { id: "openai/gpt-4o", name: "GPT-4o (via OR)" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (via OR)" },
    { id: "google/gemini-pro-1.5", name: "Gemini 1.5 Pro (via OR)" },
    { id: "x-ai/grok-2", name: "Grok 2 (via OR)" },
    { id: "auto", name: "Auto" },
  ],
  headers: {
    "HTTP-Referer": "https://licarl.app",
    "X-Title": "Licarl Prompt Maker",
  },
});

const ollama = createOpenAICompatibleProvider({
  id: "ollama",
  name: "Ollama",
  baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1",
  defaultModels: [
    { id: "llama3.1", name: "Llama 3.1" },
    { id: "qwen2.5", name: "Qwen 2.5" },
    { id: "mistral", name: "Mistral" },
    { id: "codellama", name: "Code Llama" },
    { id: "deepseek-r1", name: "DeepSeek R1" },
  ],
});

const cohere = createOpenAICompatibleProvider({
  id: "cohere",
  name: "Cohere",
  baseUrl: "https://api.cohere.ai/compatibility/v1",
  defaultModels: [
    { id: "command-r-plus", name: "Command R+", inputCostPer1M: 2.5, outputCostPer1M: 10 },
    { id: "command-r", name: "Command R", inputCostPer1M: 0.15, outputCostPer1M: 0.6 },
    { id: "command-light", name: "Command Light" },
  ],
  costs: {
    "command-r-plus": { input: 2.5, output: 10 },
    "command-r": { input: 0.15, output: 0.6 },
  },
});

const providers: Record<string, AIProvider> = {
  openai,
  anthropic: anthropicProvider,
  google: geminiProvider,
  xai,
  deepseek,
  mistral,
  groq,
  together,
  openrouter,
  cohere,
  ollama,
  azure,
};

export function getProvider(id: string): AIProvider | undefined {
  return providers[id];
}

export function listProviders(): { id: string; name: string; models: ModelInfo[] }[] {
  return Object.values(providers).map((p) => ({
    id: p.id,
    name: p.name,
    models: [],
  }));
}

export function getAllProviderIds(): string[] {
  return Object.keys(providers);
}

export { providers };
