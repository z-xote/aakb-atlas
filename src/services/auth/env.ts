import { env } from "@/services/env";

export function getAuthEnv() {
  return {
    cookieName: env.ATLAS_SESSION_COOKIE,
    cliAdminToken: env.ATLAS_CLI_ADMIN_TOKEN,
  };
}
