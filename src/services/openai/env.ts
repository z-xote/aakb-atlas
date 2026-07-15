import { env } from "@/services/env";

export function getOpenAIEnv() {
  return {
    apiKey: env.OPENAI_API_KEY,
    configured: Boolean(env.OPENAI_API_KEY),
    quality: env.ATLAS_IMAGE_QUALITY,
  };
}
