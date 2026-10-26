import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ApiError } from "@/services/api/response";
import { resolveAccess, type AccessResult } from "@/services/auth/access";
import { DEV_SESSION, isDevAuthBypassActive } from "@/services/auth/dev-bypass";
import { getAuthEnv } from "@/services/auth/env";

export async function getAccess(): Promise<AccessResult> {
  if (isDevAuthBypassActive()) return { status: "allowed", session: DEV_SESSION };
  return resolveAccess(await currentUser(), getAuthEnv().allowedEmails);
}

// For API routes: null when signed out, so callers answer 401. A signed-in
// account that is not on the allowlist throws a 403 instead.
export async function getAuthenticatedSession() {
  const access = await getAccess();
  if (access.status === "not_authorised") {
    throw new ApiError(403, "not_authorised", "This account is not authorised to use Atlas.");
  }
  return access.status === "allowed" ? access.session : null;
}

// For pages and server actions.
export async function requireAuth() {
  const access = await getAccess();
  if (access.status === "signed_out") redirect("/sign-in");
  if (access.status === "not_authorised") redirect("/not-authorised");
  return access.session;
}
