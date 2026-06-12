import { getOpenAIEnv } from "@/services/openai/env";

export type AtlasImagePromptPlan = {
  configured: boolean;
  model: string;
  prompt: string;
};

export function createAtlasImagePromptPlan(input: {
  projectType: string;
  note?: string;
}): AtlasImagePromptPlan {
  const env = getOpenAIEnv();

  return {
    configured: env.configured,
    model: "future-atlas-image-model",
    prompt: `Draft an Atlas Image concept for ${input.projectType}. ${input.note ?? ""}`.trim(),
  };
}
