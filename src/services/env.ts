import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_PATH: z.string().min(1).default("data/atlas.sqlite"),
  ATLAS_SHARED_PASSWORD: z.string().min(1).default("atlas-demo"),
  ATLAS_AUTH_SECRET: z.string().min(8).default("dev-atlas-secret"),
  ATLAS_AUTH_COOKIE_NAME: z.string().min(1).default("atlas_session"),
  BUNNY_STORAGE_ZONE: z.string().optional(),
  BUNNY_ACCESS_KEY: z.string().optional(),
  BUNNY_CDN_HOSTNAME: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export function isProduction() {
  return env.NODE_ENV === "production";
}
