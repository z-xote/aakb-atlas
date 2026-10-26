import type { AtlasSession } from "@/services/auth/access";
import { env } from "@/services/env";

type BypassConfig = Pick<typeof env, "NODE_ENV" | "ATLAS_DEV_AUTH_BYPASS">;

// Opt-in local login skip. Production ignores the flag.
export function isDevAuthBypassActive(config: BypassConfig = env) {
  return config.ATLAS_DEV_AUTH_BYPASS && config.NODE_ENV !== "production";
}

export const DEV_SESSION: AtlasSession = {
  userId: "dev-local",
  email: "dev@local",
};
