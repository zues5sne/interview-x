import OpenAI from "openai";

export type AIProvider = "groq" | "openai" | "gemini";

type ProviderConfig = {
  baseURL?: string;
  envKey: string;
  defaultModel: string;
};

const PROVIDERS: Record<AIProvider, ProviderConfig> = {
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    envKey: "GROQ_API_KEY",
    defaultModel: "llama-3.3-70b-versatile",
  },
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    envKey: "GEMINI_API_KEY",
    defaultModel: "gemini-2.0-flash",
  },
  openai: {
    envKey: "OPENAI_API_KEY",
    defaultModel: "gpt-4o-mini",
  },
};

function resolveProvider(): AIProvider | null {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === "groq" || explicit === "openai" || explicit === "gemini") {
    if (process.env[PROVIDERS[explicit].envKey]) return explicit;
  }
  // Auto-detect based on which key is present.
  for (const provider of ["groq", "gemini", "openai"] as AIProvider[]) {
    if (process.env[PROVIDERS[provider].envKey]) return provider;
  }
  return null;
}

export type AIClient = {
  client: OpenAI;
  model: string;
  provider: AIProvider;
};

let cached: AIClient | null = null;

export function getAIClient(): AIClient | null {
  if (cached) return cached;
  const provider = resolveProvider();
  if (!provider) return null;

  const config = PROVIDERS[provider];
  const apiKey = process.env[config.envKey];
  if (!apiKey) return null;

  cached = {
    client: new OpenAI({ apiKey, baseURL: config.baseURL }),
    model: process.env.AI_MODEL ?? config.defaultModel,
    provider,
  };
  return cached;
}

const PROVIDER_LABELS: Record<AIProvider, string> = {
  groq: "Groq",
  gemini: "Gemini",
  openai: "OpenAI",
};

export type ActiveProvider = {
  provider: AIProvider;
  label: string;
  model: string;
};

export function getActiveProvider(): ActiveProvider | null {
  const ai = getAIClient();
  if (!ai) return null;
  return { provider: ai.provider, label: PROVIDER_LABELS[ai.provider], model: ai.model };
}
