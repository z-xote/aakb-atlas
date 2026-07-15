import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { findActiveSession, revokeSessionToken, touchSession } from "@/services/auth/device";
import { getAuthEnv } from "@/services/auth/env";
import { isProduction } from "@/services/env";

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(getAuthEnv().cookieName)?.value ?? null;
}

export async function getAuthenticatedSession() {
  const token = await getSessionToken();
  return token ? findActiveSession(token) : null;
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
  return token ? touchSession(token) : null;
}
