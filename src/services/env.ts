import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_PATH: z.string().min(1).default("data/atlas.sqlite"),
  ATLAS_ALLOWED_EMAILS: z.string().default(""),
  ATLAS_CLI_ADMIN_TOKEN: z.string().optional(),
  ATLAS_DEV_AUTH_BYPASS: z
    .string()
    .optional()
    .transform((value) => value === "1" || value === "true"),
  ATLAS_BASE_URL: z.url().default("http://localhost:3000"),
  ATLAS_STORAGE_DRIVER: z.enum(["bunny", "local"]).default("local"),
  ATLAS_STORAGE_PREFIX: z.string().default(""),
  BUNNY_STORAGE_ZONE: z.string().optional(),
  BUNNY_ACCESS_KEY: z.string().optional(),
  BUNNY_STORAGE_ENDPOINT: z.url().default("https://storage.bunnycdn.com"),
  BUNNY_CDN_HOSTNAME: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ATLAS_IMAGE_QUALITY: z.enum(["medium", "high"]).default("medium"),
});

export const env = envSchema.parse(process.env);

export function isProduction() {
  return env.NODE_ENV === "production";
}

if (env.ATLAS_DEV_AUTH_BYPASS && isProduction()) {
  console.warn(
    "ATLAS_DEV_AUTH_BYPASS is set in production. Ignoring it: Clerk sign-in stays on."
  );
}
