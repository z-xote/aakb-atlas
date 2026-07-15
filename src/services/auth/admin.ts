import { ApiError } from "@/services/api/response";
import { assertRateLimit, requestIdentity } from "@/services/api/rate-limit";
import { safeTokenEquals } from "@/services/auth/crypto";
import { getAuthEnv } from "@/services/auth/env";

export function requireCliAdmin(request: Request) {
  assertRateLimit(`cli:${requestIdentity(request)}`, { limit: 120, windowMs: 60_000 });
  const configured = getAuthEnv().cliAdminToken;
  if (!configured) {
    throw new ApiError(503, "cli_admin_not_configured", "Atlas CLI administration is not configured.");
  }
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !safeTokenEquals(token, configured)) {
    throw new ApiError(401, "cli_unauthorized", "The CLI admin token was not accepted.");
  }
}
