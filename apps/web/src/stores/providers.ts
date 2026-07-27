import { create } from "zustand";

export type AIProvider = {
  id: string;
  name: string;
  models: string[];
  connected: boolean;
  defaultModel?: string;
};

interface ProvidersState {
  providers: AIProvider[];
  activeProvider: string;
  activeModel: string;
  setActiveProvider: (id: string) => void;
  setActiveModel: (model: string) => void;
  setConnected: (id: string, connected: boolean) => void;
}

const DEFAULT_PROVIDERS: AIProvider[] = [
  { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "o1", "o1-mini"], connected: false, defaultModel: "gpt-4o" },
  { id: "anthropic", name: "Claude", models: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"], connected: false, defaultModel: "claude-3-5-sonnet-20241022" },
  { id: "google", name: "Gemini", models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"], connected: false, defaultModel: "gemini-1.5-pro" },
  { id: "xai", name: "Grok", models: ["grok-2", "grok-2-mini", "grok-beta"], connected: false, defaultModel: "grok-2" },
  { id: "deepseek", name: "DeepSeek", models: ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"], connected: false, defaultModel: "deepseek-chat" },
  { id: "mistral", name: "Mistral", models: ["mistral-large-latest", "codestral-latest", "mistral-small-latest"], connected: false, defaultModel: "mistral-large-latest" },
  { id: "openrouter", name: "OpenRouter", models: ["auto", "anthropic/claude-3.5-sonnet", "openai/gpt-4o"], connected: false, defaultModel: "auto" },
  { id: "ollama", name: "Ollama", models: ["llama3.1", "qwen2.5", "mistral", "codellama"], connected: false, defaultModel: "llama3.1" },
];

export const useProvidersStore = create<ProvidersState>((set, get) => ({
  providers: DEFAULT_PROVIDERS,
  activeProvider: "openai",
  activeModel: "gpt-4o",

  setActiveProvider: (id) => {
    const provider = get().providers.find((p) => p.id === id);
    set({
      activeProvider: id,
      activeModel: provider?.defaultModel ?? provider?.models[0] ?? "",
    });
  },

  setActiveModel: (model) => set({ activeModel: model }),

  setConnected: (id, connected) =>
    set({
      providers: get().providers.map((p) =>
        p.id === id ? { ...p, connected } : p
      ),
    }),
}));
