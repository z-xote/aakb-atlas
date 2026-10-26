import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { findActiveSession, revokeSessionToken, touchSession } from "@/services/auth/device";
import { getAuthEnv } from "@/services/auth/env";
import { env, isProduction } from "@/services/env";

// `next dev` skips device login so local work needs no enrolment.
const DEV_SESSION = { dev: true } as const;
const devLoginBypass = () => env.NODE_ENV === "development";

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(getAuthEnv().cookieName)?.value ?? null;
}

export async function getAuthenticatedSession() {
  const token = await getSessionToken();
  const session = token ? await findActiveSession(token) : null;
  return session ?? (devLoginBypass() ? DEV_SESSION : null);
}

export async function isAuthenticated() {
  return Boolean(await getAuthenticatedSession());
}

export async function requireAuth() {
  const session = await getAuthenticatedSession();
  if (!session) redirect("/login");
  return session;
}

export async function setDeviceSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(getAuthEnv().cookieName, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: isProduction(),
    path: "/",
    priority: "high",
  });
}

export async function clearAuthSession() {
  const token = await getSessionToken();
  if (token) await revokeSessionToken(token);
  (await cookies()).delete(getAuthEnv().cookieName);
}

export async function touchCurrentSession() {
  const token = await getSessionToken();
  const session = token ? await touchSession(token) : null;
  return session ?? (devLoginBypass() ? DEV_SESSION : null);
}
