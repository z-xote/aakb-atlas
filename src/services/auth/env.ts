import { env } from "@/services/env";

export function getAuthEnv() {
  return {
    allowedEmails: env.ATLAS_ALLOWED_EMAILS,
    cliAdminToken: env.ATLAS_CLI_ADMIN_TOKEN,
  };
}
