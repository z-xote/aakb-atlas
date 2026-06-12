import { env } from "@/services/env";

export function getAuthEnv() {
  return {
    cookieName: env.ATLAS_AUTH_COOKIE_NAME,
    sharedPassword: env.ATLAS_SHARED_PASSWORD,
    authSecret: env.ATLAS_AUTH_SECRET,
  };
}
